// U-06 (coding-model shortlist): a fixed set of 21 synthetic tool-call prompts through Moonzila's own
// complete() (src/main/inference.ts) with an openai-compatible profile on Gemini's compatible endpoint.
// Two verdicts per turn: "product" is what complete() returned; "wire" reads the recorded SSE events
// directly, to show what the model itself sent when the product refused the stream.
// Run from the repository root: npx tsx docs/evidence/2026-10-11-gemini-probes/u06-tool-calls.ts [model ...]
import { complete, type InferenceMessage } from '../../../src/main/inference';
import type { ToolSpec } from '../../../src/shared';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPAT, OUT, exchange, save, sleep, sseEvents, type Exchange } from './lib';

type Schema = { type?: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; items?: Schema; description?: string };
const obj = (properties: Record<string, Schema>, required: string[]): Schema => ({ type: 'object', properties, required, additionalProperties: false });
const TOOLS: ToolSpec[] = [
  { name: 'read_file', description: 'Read a UTF-8 text file from the project.', parameters: obj({ path: { type: 'string', description: 'Project-relative path' } }, ['path']) as never },
  { name: 'list_dir', description: 'List the entries of a project directory.', parameters: obj({ path: { type: 'string' }, recursive: { type: 'boolean' } }, ['path']) as never },
  { name: 'write_file', description: 'Create or replace a text file in the project.', parameters: obj({ path: { type: 'string' }, content: { type: 'string' } }, ['path', 'content']) as never },
  { name: 'search_code', description: 'Search project files for text.', parameters: obj({ query: { type: 'string' }, options: obj({ caseSensitive: { type: 'boolean' }, globs: { type: 'array', items: { type: 'string' } }, maxResults: { type: 'integer' } }, ['caseSensitive', 'globs']) }, ['query', 'options']) as never },
];
const SYSTEM = "You are a coding assistant with file tools. Use a tool only when the user's request needs file access; otherwise answer in text.";

type Kind = 'single' | 'two' | 'nested' | 'none';
const CASES: Array<{ id: number; kind: Kind; tool?: string; prompt: string }> = [
  { id: 1, kind: 'single', tool: 'read_file', prompt: 'Call read_file on README.md' },
  { id: 2, kind: 'single', tool: 'read_file', prompt: 'Open src/app.ts and show me what is in it.' },
  { id: 3, kind: 'single', tool: 'list_dir', prompt: 'List the files in the docs directory.' },
  { id: 4, kind: 'single', tool: 'list_dir', prompt: 'List everything under src, recursively.' },
  { id: 5, kind: 'single', tool: 'write_file', prompt: 'Create a file named notes.txt containing the text hello world.' },
  { id: 6, kind: 'single', tool: 'read_file', prompt: 'Read the file config/settings.json.' },
  { id: 7, kind: 'two', tool: 'read_file', prompt: 'Read package.json and tsconfig.json. Call read_file for both in this turn.' },
  { id: 8, kind: 'two', prompt: 'List the src directory and read README.md, both in this same turn.' },
  { id: 9, kind: 'two', tool: 'read_file', prompt: 'Read a.txt and b.txt in parallel.' },
  { id: 10, kind: 'two', tool: 'write_file', prompt: "Write 'one' to one.txt and 'two' to two.txt in this turn." },
  { id: 11, kind: 'two', tool: 'list_dir', prompt: 'List both the tests and the scripts directories now, in parallel.' },
  { id: 12, kind: 'nested', tool: 'search_code', prompt: 'Search the code for TODO, case-sensitive, only in *.ts and *.tsx files, at most 20 results.' },
  { id: 13, kind: 'nested', tool: 'search_code', prompt: "Find occurrences of 'fetch(' ignoring case in **/*.js files; return no more than 5 matches." },
  { id: 14, kind: 'nested', tool: 'search_code', prompt: 'Search for the word deprecated, case-insensitive, in *.md, *.txt and *.rst files.' },
  { id: 15, kind: 'nested', tool: 'search_code', prompt: "Look for 'class Engine' case-sensitively in src/**/*.ts, limit 10." },
  { id: 16, kind: 'nested', tool: 'search_code', prompt: "Search for 'password' case-insensitively across *.env.example files, max 3 results." },
  { id: 17, kind: 'none', prompt: 'What is 17 times 3? Answer directly; do not use any tool.' },
  { id: 18, kind: 'none', prompt: 'Say hello in French.' },
  { id: 19, kind: 'none', prompt: 'In one sentence, what is a JSON object?' },
  { id: 20, kind: 'none', prompt: 'Without reading any file, suggest a good name for a variable that counts retries.' },
  { id: 21, kind: 'none', prompt: 'Thanks, that is all for now.' },
];

/** The subset of JSON Schema the four tools use: object, string, boolean, integer, array; required; no extra keys. */
function valid(value: unknown, schema: Schema): boolean {
  switch (schema.type) {
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
      const record = value as Record<string, unknown>;
      if ((schema.required ?? []).some(name => !(name in record))) return false;
      return Object.entries(record).every(([name, child]) => schema.properties?.[name] ? valid(child, schema.properties[name]!) : schema.additionalProperties !== false);
    }
    case 'string': return typeof value === 'string';
    case 'boolean': return typeof value === 'boolean';
    case 'integer': return Number.isInteger(value);
    case 'array': return Array.isArray(value) && value.every(item => valid(item, schema.items ?? {}));
    default: return true;
  }
}
const schemaOf = (name: string) => TOOLS.find(tool => tool.name === name)?.parameters as Schema | undefined;
function callsValid(calls: Array<{ name?: string; args: unknown }>): boolean {
  return calls.every(call => { const schema = call.name ? schemaOf(call.name) : undefined; return !!schema && valid(call.args, schema); });
}
function expected(kind: Kind, tool: string | undefined, calls: Array<{ name?: string; args: unknown }>): boolean {
  if (kind === 'none') return calls.length === 0;
  const named = !tool || calls.every(call => call.name === tool);
  return named && calls.length >= (kind === 'two' ? 2 : 1) && callsValid(calls);
}

async function runCase(model: string, item: (typeof CASES)[number]) {
  const exchanges: Exchange[] = [];
  const fetcher = async (url: string, init: RequestInit) => {
    for (let attempt = 1; ; attempt++) {
      const { record, response } = await exchange(`u06-${model}-${item.id}#${attempt}`, url, { headers: init.headers as Record<string, string>, body: String(init.body) });
      exchanges.push(record);
      // Free-tier requests are capped per model per day, so a retry costs quota: one retry for a 503,
      // one for a per-minute 429, none for a 429 whose RetryInfo asks for more than 90 s (the daily cap).
      const retry = Number(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/.exec(record.body)?.[1] ?? 20);
      if ((record.status !== 503 && record.status !== 429) || attempt === 2 || retry > 90) return response;
      await sleep(Math.max(20, retry + 2) * 1000);
    }
  };
  const messages: InferenceMessage[] = [{ role: 'system', content: SYSTEM }, { role: 'user', content: item.prompt }];
  let result: Awaited<ReturnType<typeof complete>> | undefined; let thrown: string | undefined;
  try { result = await complete({ kind: 'openai-compatible', endpoint: COMPAT, model, contextTokens: 1048576, outputTokens: 8192 }, messages, { fetcher, secret: process.env.GEMINI_API_KEY, signal: new AbortController().signal, tools: TOOLS }); }
  catch (error) { thrown = (error as Error).message; }
  const last = exchanges.at(-1)!;
  // Wire view: every tool_calls entry of every chunk, joined by index when one is given, else taken whole.
  const events = last.status === 200 ? sseEvents(last.body) as Array<{ choices?: Array<{ delta?: { content?: string; tool_calls?: Array<{ index?: number; id?: string; function?: { name?: string; arguments?: string }; extra_content?: unknown }> }; finish_reason?: string }> }> : [];
  const entries = events.flatMap(event => event.choices?.[0]?.delta?.tool_calls ?? []);
  const wireCalls: Array<{ id?: string; name?: string; arguments: string; hasIndex: boolean; hasExtraContent: boolean }> = [];
  for (const entry of entries) {
    const previous = entry.index !== undefined ? wireCalls.find(call => call.hasIndex && wireCalls.indexOf(call) === entry.index) : undefined;
    if (previous) { previous.arguments += entry.function?.arguments ?? ''; continue; }
    wireCalls.push({ id: entry.id, name: entry.function?.name, arguments: entry.function?.arguments ?? '', hasIndex: entry.index !== undefined, hasExtraContent: entry.extra_content !== undefined });
  }
  const parsedWire = wireCalls.map(call => { try { return { name: call.name, args: JSON.parse(call.arguments) as unknown }; } catch { return { name: call.name, args: Symbol('unparseable') as unknown }; } });
  const finishReasons = events.map(event => event.choices?.[0]?.finish_reason).filter(Boolean);
  const productCalls = (result?.toolCalls ?? []).map(call => ({ name: call.name, args: call.input as unknown }));
  return {
    id: item.id, kind: item.kind, prompt: item.prompt, status: last.status, attempts: exchanges.length,
    product: { outcome: result?.outcome, threw: thrown, calls: productCalls, pass: item.kind === 'none' ? result?.outcome === 'complete' && productCalls.length === 0 : result?.outcome === 'tool_calls' && expected(item.kind, item.tool, productCalls), wronglyCalled: item.kind === 'none' && (result?.outcome === 'tool_calls' || productCalls.length > 0) },
    wire: { finishReasons, calls: wireCalls, argsParseAndValidate: wireCalls.length > 0 && callsValid(parsedWire), pass: last.status === 200 && expected(item.kind, item.tool, parsedWire), wronglyCalled: item.kind === 'none' && wireCalls.length > 0, text: events.map(event => event.choices?.[0]?.delta?.content ?? '').join('').slice(0, 300) },
    exchanges,
  };
}

// Resumable: CASES=3,5 reruns only those turns; a rerun replaces the row and keeps the old one under earlierRuns.
const models = process.argv.slice(2).length ? process.argv.slice(2) : ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite'];
const only = process.env.CASES ? new Set(process.env.CASES.split(',').map(Number)) : undefined;
type Row = Awaited<ReturnType<typeof runCase>> & { earlierRuns?: unknown[] };
for (const model of models) {
  const file = join(OUT, `u06-${model}.json`);
  const rows: Row[] = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { rows: Row[] }).rows : [];
  for (const item of CASES) {
    if (only && !only.has(item.id)) continue;
    const row: Row = await runCase(model, item);
    const index = rows.findIndex(existing => existing.id === item.id);
    if (index >= 0) { const { earlierRuns = [], ...previous } = rows[index]!; row.earlierRuns = [...earlierRuns, previous]; rows[index] = row; } else rows.push(row);
    rows.sort((a, b) => a.id - b.id);
    save(`u06-${model}.json`, { rows });
    console.log(model, item.id, item.kind, row.status, 'product', row.product.outcome ?? row.product.threw, row.product.pass ? 'PASS' : 'fail', '| wire', row.wire.finishReasons.join(','), row.wire.calls.map(call => call.name).join('+') || '-', row.wire.pass ? 'PASS' : 'fail');
    await sleep(7000);
  }
  const toolRows = rows.filter(row => row.kind !== 'none'); const noneRows = rows.filter(row => row.kind === 'none');
  const answered = rows.filter(row => row.status === 200);
  const summary = {
    model, turns: rows.length, answered200: answered.length,
    product: { toolTurnsPassed: toolRows.filter(row => row.product.pass).length, toolTurns: toolRows.length, noCallCorrect: noneRows.filter(row => row.product.pass).length, noCallWronglyCalled: noneRows.filter(row => row.product.wronglyCalled).length, noCallTurns: noneRows.length, outcomes: Object.fromEntries([...new Set(rows.map(row => row.product.outcome ?? row.product.threw ?? 'none'))].map(key => [key, rows.filter(row => (row.product.outcome ?? row.product.threw ?? 'none') === key).length])) },
    wire: { toolTurnsPassed: toolRows.filter(row => row.wire.pass).length, toolTurns: toolRows.length, noCallWronglyCalled: noneRows.filter(row => row.wire.wronglyCalled).length, finishReasons: Object.fromEntries([...new Set(rows.flatMap(row => row.wire.finishReasons))].map(key => [key, rows.filter(row => row.wire.finishReasons.includes(key)).length])), callsWithIndex: rows.flatMap(row => row.wire.calls).filter(call => call.hasIndex).length, calls: rows.flatMap(row => row.wire.calls).length, callsWithExtraContent: rows.flatMap(row => row.wire.calls).filter(call => call.hasExtraContent).length },
  };
  console.log(JSON.stringify(summary));
  save(`u06-${model}.json`, { summary, rows });
}
