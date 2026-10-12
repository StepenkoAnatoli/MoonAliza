// Shared helpers for the 2026-10-11 Gemini probes. Run from the repository root with `npx tsx`.
// The key is read from GEMINI_API_KEY only, sent only in a header, and never written anywhere:
// every recorded string passes through redact() and every credential header is replaced.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const OUT = join('docs', 'evidence', '2026-10-11-gemini-probes', 'raw');
export const BASE = 'https://generativelanguage.googleapis.com';
export const COMPAT = `${BASE}/v1beta/openai`;

const KEY = process.env.GEMINI_API_KEY ?? '';
if (!KEY) { console.error('GEMINI_API_KEY is not set'); process.exit(2); }
export const key = (): string => KEY;

export function redact(text: string): string {
  let out = text.split(KEY).join('<redacted>');
  out = out.replace(/([?&]key=)[^&\s"]+/g, '$1<redacted>');
  return out;
}

// A Google API key's shape (its four-character prefix, then 35 characters), spelled in parts so this file never matches a key scan.
const GOOGLE_KEY_SHAPE = new RegExp('AI' + 'za[0-9A-Za-z_-]{35}');
const SECRET_HEADERS = new Set(['authorization', 'x-goog-api-key', 'cookie', 'set-cookie']);
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name, SECRET_HEADERS.has(name.toLowerCase()) ? '<redacted>' : redact(value)]));
}

export interface Exchange {
  label: string; startedAt: string; request: { method: string; url: string; headers: Record<string, string>; body: string | { omitted: string; bytes: number; prefix: string } };
  status: number; responseHeaders: Record<string, string>; chunks: Array<{ ms: number; text: string }>; body: string;
  framing: { bytes: number; crlf: number; lf: number; cr: number; commentLines: number; dataLines: number; eventLines: number; doneMarker: boolean; lastBytes: string };
  error?: string;
}

/** Performs a request, keeping every network chunk as it arrived (decoded as UTF-8) and the whole body. */
export async function exchange(label: string, url: string, init: { method?: string; headers: Record<string, string>; body: string; maxRecordBody?: number }): Promise<{ record: Exchange; bytes: Buffer; response: Response }> {
  const started = Date.now();
  const recordBody = init.body.length > (init.maxRecordBody ?? 200_000)
    ? { omitted: 'request body too large to record; generator in the probe script', bytes: Buffer.byteLength(init.body), prefix: redact(init.body.slice(0, 600)) }
    : redact(init.body);
  const record: Exchange = { label, startedAt: new Date(started).toISOString(), request: { method: init.method ?? 'POST', url: redact(url), headers: redactHeaders(init.headers), body: recordBody }, status: 0, responseHeaders: {}, chunks: [], body: '', framing: undefined as never };
  const parts: Buffer[] = [];
  let response: Response;
  try {
    response = await fetch(url, { method: init.method ?? 'POST', headers: init.headers, body: init.method === 'GET' ? undefined : init.body, signal: AbortSignal.timeout(300_000) });
    record.status = response.status;
    response.headers.forEach((value, name) => { record.responseHeaders[name] = SECRET_HEADERS.has(name) ? '<redacted>' : redact(value); });
    const reader = response.body!.getReader();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const buf = Buffer.from(chunk.value);
      parts.push(buf);
      record.chunks.push({ ms: Date.now() - started, text: redact(buf.toString('utf8')) });
    }
  } catch (error) {
    record.error = redact(String((error as Error)?.message ?? error) + ' ' + String((error as { cause?: unknown })?.cause ?? ''));
    response = new Response(null, { status: 599 });
  }
  const bytes = Buffer.concat(parts);
  record.body = redact(bytes.toString('utf8'));
  record.framing = framing(bytes);
  return { record, bytes, response: new Response(bytes, { status: record.status || 599, headers: Object.fromEntries(Object.entries(record.responseHeaders)) }) };
}

export function framing(bytes: Buffer): Exchange['framing'] {
  const text = bytes.toString('utf8');
  const lines = text.split(/\r?\n/);
  return {
    bytes: bytes.length,
    crlf: (text.match(/\r\n/g) ?? []).length,
    lf: (text.match(/(?<!\r)\n/g) ?? []).length,
    cr: (text.match(/\r(?!\n)/g) ?? []).length,
    commentLines: lines.filter(line => line.startsWith(':')).length,
    dataLines: lines.filter(line => line.startsWith('data:')).length,
    eventLines: lines.filter(line => line.startsWith('event:')).length,
    doneMarker: /^data: ?\[DONE\]\s*$/m.test(text),
    lastBytes: JSON.stringify(redact(bytes.subarray(Math.max(0, bytes.length - 120)).toString('utf8'))),
  };
}

export function save(name: string, value: unknown): void {
  mkdirSync(OUT, { recursive: true });
  const text = redact(JSON.stringify(value, null, 2));
  if (text.includes(KEY) || GOOGLE_KEY_SHAPE.test(text)) throw new Error(`refusing to write ${name}: key material found`);
  writeFileSync(join(OUT, name), text + '\n');
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const bearer = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` });
export const native = () => ({ 'Content-Type': 'application/json', 'x-goog-api-key': KEY });

/** Server-sent events parsed only for reporting; Moonzila's own reader is used wherever a verdict depends on it. */
export function sseEvents(text: string): unknown[] {
  return text.split(/\r?\n\r?\n/).map(block => block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.replace(/^data: ?/, '')).join('\n'))
    .filter(payload => payload && payload !== '[DONE]').map(payload => { try { return JSON.parse(payload); } catch { return { unparsed: payload }; } });
}
