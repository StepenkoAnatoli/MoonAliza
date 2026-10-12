/* eslint-disable @typescript-eslint/no-explicit-any -- a one-off probe script reading untyped recorded JSON */
// Step 8 of the probe brief: Moonzila's existing openai-compatible request against Anthropic's compatible
// layer, through the real complete() (src/main/inference.ts) with a recording fetcher, then the recorded
// SSE bytes replayed through readSse + OpenAIAccumulator (src/main/provider-stream.ts) on their own.
// Run: npx tsx docs/evidence/2026-10-12-anthropic-probes/compat.ts <u18|u06>. Nothing under src/ changes.
import { writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { join } from 'node:path';
import { complete, type InferenceProfile } from '../../../src/main/inference';
import { OpenAIAccumulator, readSse } from '../../../src/main/provider-stream';
// @ts-expect-error plain .mjs helper
import { book, cost, CAP, DIR, spent } from './probe-lib.mjs';

const MODEL = 'claude-sonnet-5-5';
const profile: InferenceProfile = { kind: 'openai-compatible', endpoint: 'https://api.anthropic.com/v1', model: MODEL, outputTokens: 1024 };
const READ_FILE = { name: 'read_file', description: 'Read a UTF-8 text file from the project.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } };
const TOOLS = [
  READ_FILE,
  { name: 'list_dir', description: 'List the entries of a project directory.', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } },
  { name: 'write_file', description: 'Write a UTF-8 text file in the project.', parameters: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] } },
  { name: 'search', description: 'Search the project for text.', parameters: { type: 'object', properties: { query: { type: 'string' }, options: { type: 'object', properties: { case_sensitive: { type: 'boolean' }, globs: { type: 'array', items: { type: 'string' } } }, required: ['case_sensitive', 'globs'] } }, required: ['query', 'options'] } },
];

/** Minimal JSON-schema check for the probe's own tool schemas (object, string, boolean, array of string). */
function conforms(schema: any, value: any): boolean {
  if (schema.type === 'string') return typeof value === 'string';
  if (schema.type === 'boolean') return typeof value === 'boolean';
  if (schema.type === 'array') return Array.isArray(value) && value.every((v) => conforms(schema.items, v));
  if (schema.type === 'object') {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    if ((schema.required ?? []).some((k: string) => !(k in value))) return false;
    return Object.entries(value).every(([k, v]) => schema.properties?.[k] ? conforms(schema.properties[k], v) : false);
  }
  return false;
}

async function probe(id: string, prompt: string, tools: typeof TOOLS) {
  const worst = cost(MODEL, 2000, profile.outputTokens);
  if (worst > CAP - spent()) { console.log(`SKIP ${id}`); writeFileSync(join(DIR, `${id}.meta.json`), JSON.stringify({ id, skipped: true, reason: `worst $${worst} > remaining $${CAP - spent()}` }, null, 2) + '\n'); return; }
  let raw = ''; let status = 0; let headers: Record<string, string> = {}; let requestBody = ''; let url = '';
  const t0 = performance.now();
  const fetcher = async (u: string, init: RequestInit) => {
    url = u; requestBody = String(init.body);
    const res = await fetch(u, init);
    const buf = Buffer.from(await res.arrayBuffer());
    raw = buf.toString('utf8'); status = res.status; headers = Object.fromEntries(res.headers);
    return new Response(buf, { status: res.status, headers: res.headers });
  };
  let outcome: any; let error: string | undefined;
  try {
    outcome = await complete(profile, [{ role: 'system', content: 'You are a coding assistant. Use the tools when they are needed.' }, { role: 'user', content: prompt }],
      { fetcher, secret: process.env.MOONZILA_ANTHROPIC_API_KEY, signal: new AbortController().signal, tools, retry: false });
  } catch (e) { error = (e as Error).message; }
  const ms = Math.round(performance.now() - t0);
  // Replay the recorded bytes through the accumulator alone.
  let replay: any; let replayError: string | undefined;
  if (status === 200) {
    try { const acc = new OpenAIAccumulator(); for await (const c of readSse(new Response(raw, { headers: { 'content-type': 'text/event-stream' } }))) acc.push(c); replay = acc.result(); }
    catch (e) { replayError = (e as Error).message; }
  }
  // Usage from the stream's last usage chunk (Moonzila reads prompt_tokens / completion_tokens).
  const usage = outcome?.usage ?? replay?.usage ?? {};
  const inTok = usage.inputTokens ?? usage.prompt_tokens ?? 0; const outTok = usage.outputTokens ?? usage.completion_tokens ?? 0;
  const c = status === 200 ? cost(MODEL, inTok, outTok) : 0;
  book({ id, model: MODEL, status, inputTokens: inTok, outputTokens: outTok, cost: c, costBasis: status === 200 ? 'usage' : 'refused, no usage reported', worstCase: worst, note: 'openai-compatible route' });
  writeFileSync(join(DIR, `${id}.request.json`), JSON.stringify({ method: 'POST', url, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer <redacted>' }, body: JSON.parse(requestBody || 'null') }, null, 2) + '\n');
  writeFileSync(join(DIR, `${id}.response.raw`), raw);
  const calls = outcome?.toolCalls ?? [];
  const schemaOk = calls.map((call: any) => conforms(tools.find((t) => t.name === call.name)?.parameters, call.input));
  const meta = { id, prompt, status, headers, latencyMs: ms, outcome, error, replay, replayError, schemaOk, cost: c };
  writeFileSync(join(DIR, `${id}.meta.json`), JSON.stringify(meta, null, 2) + '\n');
  console.log(`${id}: ${status} ${error ?? outcome.outcome} calls=${JSON.stringify(calls.map((x: any) => [x.name, x.input]))} schema=${JSON.stringify(schemaOk)} replay=${replayError ?? replay?.choices?.[0]?.finish_reason} $${c.toFixed(4)} total $${spent().toFixed(4)}`);
}

const U06: Array<[string, string]> = [
  ['one-tool-read', 'Call read_file on README.md'],
  ['one-tool-list', 'List the files in the src directory.'],
  ['two-tools', 'Read package.json and also list the docs directory, both in this turn.'],
  ['two-same-tool', 'Read both a.txt and b.txt, in parallel.'],
  ['nested-1', "Search for 'TODO', case-sensitive, only in *.ts and *.tsx files."],
  ['two-args', "Write a file notes.txt containing the text 'hello world'."],
  ['nested-2', "Search for 'fixme', not case-sensitive, in *.md files."],
  ['no-tool-math', 'What is 2 + 2? Answer directly without using any tool.'],
  ['no-tool-hello', 'Say hello. Do not use any tools.'],
  ['one-tool-path', 'Open the file docs/plan.md.'],
];

const which = process.argv[2];
if (which === 'u18') await probe('U18-compat-read-file', 'Call read_file on README.md', [READ_FILE]);
if (which === 'u06') for (const [n, p] of U06) await probe(`U06-${n}`, p, TOOLS);
console.log(`spent so far: $${spent().toFixed(4)}`);
