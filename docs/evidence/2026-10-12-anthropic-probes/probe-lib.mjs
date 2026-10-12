// Probe library for the 2026-10-12 Anthropic measurements (DAY-ONE-P2.md).
// Sends the native shape of docs/specification/more-models-phase2.md section 5, records every raw
// byte of the response, and keeps a spend ledger under a hard cap. The key is read only from
// process.env.MOONZILA_ANTHROPIC_API_KEY and is placed only in the request header; every saved
// header is redacted.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const DIR = new URL('.', import.meta.url).pathname;
const LEDGER = join(DIR, 'spend.json');
export const CAP = 3.0;
export const ENDPOINT = 'https://api.anthropic.com/v1/messages';

// US$ per million tokens, input / output (pricing corpus E-01).
export const PRICES = {
  'claude-fable-5-1': [10, 50],
  'claude-opus-5-5': [4, 20],
  'claude-sonnet-5-5': [2, 10],
  'claude-haiku-4-5-20251001': [1, 5],
};

export function ledger() {
  return existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { cap: CAP, rows: [] };
}
export function spent() {
  return ledger().rows.reduce((sum, row) => sum + row.cost, 0);
}
function book(row) {
  const l = ledger();
  l.rows.push(row);
  writeFileSync(LEDGER, JSON.stringify(l, null, 2) + '\n');
}

export function cost(model, inputTokens, outputTokens) {
  const [i, o] = PRICES[model];
  return (inputTokens * i + outputTokens * o) / 1e6;
}

/** Native body in the spec's key order: model, max_tokens, system?, messages, tools?, stream. */
export function nativeBody({ model, maxTokens, system, messages, tools, stream = true }) {
  const body = { model, max_tokens: maxTokens };
  if (system) body.system = system;
  body.messages = messages;
  if (tools && tools.length) body.tools = tools;
  body.stream = stream;
  return body;
}

function headers(auth) {
  const key = process.env.MOONZILA_ANTHROPIC_API_KEY;
  if (!key) throw new Error('MOONZILA_ANTHROPIC_API_KEY missing');
  const h = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
  if (auth === 'x-api-key') h['x-api-key'] = key;
  else h.Authorization = `Bearer ${key}`;
  return h;
}
function redactedHeaders(auth) {
  const h = { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' };
  if (auth === 'x-api-key') h['x-api-key'] = '<redacted>';
  else h.Authorization = 'Bearer <redacted>';
  return h;
}

/** Parse raw SSE text into events plus framing facts. */
export function analyseSse(raw) {
  const facts = {
    crlf: raw.includes('\r\n'),
    lfOnly: !raw.includes('\r\n') && raw.includes('\n'),
    eventOrder: [],
    pings: [],
    eventsWithoutName: 0,
    nameMismatch: 0,
    unknownEventTypes: [],
    deltaTypes: {},
    blockTypes: [],
    signatureDeltasPerBlock: {},
    bytesAfterMessageStop: null,
    fallbackBlock: false,
    stopReason: null,
    stopDetails: undefined,
    usageEvents: [],
    blocks: [],
  };
  const known = new Set(['message_start', 'content_block_start', 'content_block_delta', 'content_block_stop',
    'message_delta', 'message_stop', 'ping', 'error']);
  const lines = raw.split(/\r?\n/);
  let name; let data = [];
  let afterStopOffset = null;
  let offset = 0;
  const events = [];
  for (const line of lines) {
    offset += Buffer.byteLength(line, 'utf8') + 1;
    if (line === '') {
      if (data.length) events.push({ name, data: data.join('\n'), endOffset: offset });
      name = undefined; data = [];
      continue;
    }
    if (line.startsWith('event:')) name = line.slice(6).trim();
    else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }
  if (data.length) events.push({ name, data: data.join('\n'), endOffset: offset });
  const blocks = [];
  events.forEach((ev, i) => {
    let d;
    try { d = JSON.parse(ev.data); } catch { facts.eventOrder.push('<non-json>'); return; }
    facts.eventOrder.push(d.type);
    if (ev.name === undefined) facts.eventsWithoutName++;
    else if (ev.name !== d.type) facts.nameMismatch++;
    if (!known.has(d.type)) facts.unknownEventTypes.push(d.type);
    if (d.type === 'ping') facts.pings.push(i);
    if (d.type === 'message_start') facts.usageEvents.push({ event: 'message_start', usage: d.message?.usage });
    if (d.type === 'message_delta') {
      facts.usageEvents.push({ event: 'message_delta', usage: d.usage });
      if (d.delta?.stop_reason) facts.stopReason = d.delta.stop_reason;
      if ('stop_details' in (d.delta ?? {})) facts.stopDetails = d.delta.stop_details;
    }
    if (d.type === 'content_block_start') {
      const b = { ...d.content_block };
      blocks[d.index] = { block: b, partialJson: '', signatureDeltas: 0 };
      facts.blockTypes.push(b.type);
      if (b.type === 'fallback') facts.fallbackBlock = true;
    }
    if (d.type === 'content_block_delta') {
      const t = d.delta?.type;
      facts.deltaTypes[t] = (facts.deltaTypes[t] ?? 0) + 1;
      const s = blocks[d.index];
      if (t === 'text_delta') s.block.text += d.delta.text;
      else if (t === 'thinking_delta') s.block.thinking += d.delta.thinking;
      else if (t === 'signature_delta') { s.block.signature = d.delta.signature; s.signatureDeltas++; }
      else if (t === 'input_json_delta') s.partialJson += d.delta.partial_json;
    }
    if (d.type === 'message_stop') afterStopOffset = ev.endOffset;
  });
  if (afterStopOffset !== null) {
    const total = Buffer.byteLength(raw, 'utf8');
    facts.bytesAfterMessageStop = Math.max(0, total - afterStopOffset);
  }
  blocks.forEach((s, i) => {
    if (!s) return;
    if (s.block.type === 'thinking') facts.signatureDeltasPerBlock[i] = s.signatureDeltas;
    if (s.block.type === 'tool_use') {
      s.rawPartialJson = s.partialJson;
      if (s.partialJson !== '') s.block.input = JSON.parse(s.partialJson);
    }
  });
  facts.blocks = blocks.map((s) => s && { ...s.block, ...(s.block.type === 'tool_use' ? { _rawPartialJson: s.rawPartialJson } : {}) });
  return facts;
}

/** Latest-value usage over the stream's usage events. */
export function streamUsage(facts) {
  const u = {};
  for (const e of facts.usageEvents) for (const [k, v] of Object.entries(e.usage ?? {})) if (typeof v === 'number') u[k] = v;
  return u;
}

/**
 * Send one request. `worstInput` bounds the input tokens; worst output is maxTokens unless
 * `worstOutput` is given (the model's maximum when the request asks for more).
 */
export async function send({ id, model, body, auth = 'bearer', worstInput, worstOutput, bodyForRecord, note }) {
  const bytes = Buffer.from(JSON.stringify(body), 'utf8');
  const worst = cost(model, worstInput ?? Math.ceil(bytes.length / 2), worstOutput ?? body.max_tokens);
  const remaining = CAP - spent();
  if (worst > remaining) {
    const skip = { id, skipped: true, reason: `worst case $${worst.toFixed(4)} > remaining $${remaining.toFixed(4)}` };
    writeFileSync(join(DIR, `${id}.meta.json`), JSON.stringify(skip, null, 2) + '\n');
    console.log(`SKIP ${id}: ${skip.reason}`);
    return skip;
  }
  writeFileSync(join(DIR, `${id}.request.json`), JSON.stringify({
    method: 'POST', url: ENDPOINT, headers: redactedHeaders(auth),
    bodyUtf8Bytes: bytes.length, bodySha256: createHash('sha256').update(bytes).digest('hex'),
    body: bodyForRecord ?? body,
  }, null, 2) + '\n');
  let attempt = 0; let res; let raw; let t0; let tHeaders; let tEnd; const retries = [];
  for (;;) {
    t0 = performance.now();
    res = await fetch(ENDPOINT, { method: 'POST', headers: headers(auth), body: bytes });
    tHeaders = performance.now();
    const buf = Buffer.from(await res.arrayBuffer());
    tEnd = performance.now();
    raw = buf.toString('utf8');
    if ((res.status === 429 || res.status >= 500) && attempt < 2) {
      const ra = res.headers.get('retry-after');
      retries.push({ status: res.status, headers: Object.fromEntries(res.headers), body: raw });
      const wait = ra && /^\d+$/.test(ra) ? Number(ra) * 1000 : 2000;
      attempt++;
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    break;
  }
  writeFileSync(join(DIR, `${id}.response.raw`), raw);
  const isSse = raw.startsWith('event:') || raw.startsWith('data:') || raw.includes('\nevent:');
  const facts = res.status === 200 && body.stream ? analyseSse(raw) : null;
  let usage = {};
  if (facts) usage = streamUsage(facts);
  else { try { usage = JSON.parse(raw).usage ?? {}; } catch { /* not JSON */ } }
  const inTok = (usage.input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  const outTok = usage.output_tokens ?? 0;
  let c = cost(model, inTok, outTok);
  let costBasis = 'usage';
  if (res.status !== 200 && !usage.input_tokens) { c = 0; costBasis = 'refused, no usage reported'; }
  book({ id, model, status: res.status, inputTokens: inTok, outputTokens: outTok, cost: c, costBasis, worstCase: worst, note });
  const meta = {
    id, model, auth, status: res.status, headers: Object.fromEntries(res.headers),
    latencyMs: { headers: Math.round(tHeaders - t0), total: Math.round(tEnd - t0) },
    responseBytes: Buffer.byteLength(raw, 'utf8'), isSse, usage, cost: c, costBasis, worstCase: worst,
    retries, facts,
  };
  writeFileSync(join(DIR, `${id}.meta.json`), JSON.stringify(meta, null, 2) + '\n');
  console.log(`${id}: ${res.status} ${model} in=${inTok} out=${outTok} $${c.toFixed(4)} total $${spent().toFixed(4)} ${Math.round(tEnd - t0)}ms stop=${facts?.stopReason ?? '-'}`);
  return meta;
}

/** Assistant content to replay: blocks as accumulated, without the probe's own annotation. */
export function replayContent(facts) {
  return facts.blocks.map((b) => { const { _rawPartialJson, ...rest } = b; return rest; });
}
