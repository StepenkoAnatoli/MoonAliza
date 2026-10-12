// U-18 Gemini probes (1), (2), (3), (4), (8), (9), (11) and the U-05 over-window body.
// Run from the repository root: npx tsx docs/evidence/2026-10-11-gemini-probes/wire-probes.ts [probe ...]
// Every prompt is synthetic. Nothing from the repository is sent.
import { complete, type InferenceMessage } from '../../../src/main/inference';
import type { ToolSpec } from '../../../src/shared';
import { BASE, COMPAT, bearer, exchange, native, redact, save, sleep, sseEvents, type Exchange } from './lib';

const READ_FILE: ToolSpec = { name: 'read_file', description: 'Read a UTF-8 text file from the project.', parameters: { type: 'object', properties: { path: { type: 'string', description: 'Project-relative path' } }, required: ['path'], additionalProperties: false } };
const PROMPT = 'Call read_file on README.md';
const TOOL_RESULT = '# Demo project\nThis is a synthetic README used for a wire probe.';
const all: Record<string, unknown> = {};
const rateLimits: Exchange[] = [];

/** complete() with a fetcher that records the exact request Moonzila builds and the raw bytes it got back. */
async function viaComplete(label: string, model: string, messages: InferenceMessage[], tools: ToolSpec[] | undefined, outputTokens = 8192) {
  const exchanges: Exchange[] = [];
  const fetcher = async (url: string, init: RequestInit) => {
    // A 503 "high demand" is retried at most twice, 20 s apart; every attempt is kept.
    for (let attempt = 1; ; attempt++) {
      const { record, response } = await exchange(`${label}#${attempt}`, url, { headers: init.headers as Record<string, string>, body: String(init.body) });
      exchanges.push(record);
      if (record.status === 429) rateLimits.push(record);
      if (record.status !== 503 || attempt === 3) return response;
      await sleep(20000);
    }
  };
  let result: unknown; let thrown: string | undefined;
  try {
    result = await complete({ kind: 'openai-compatible', endpoint: COMPAT, model, outputTokens, contextTokens: 1048576 }, messages, { fetcher, secret: process.env.GEMINI_API_KEY, signal: new AbortController().signal, tools });
  } catch (error) { thrown = (error as Error).message; }
  return { label, model, exchange: exchanges.at(-1), earlierAttempts: exchanges.slice(0, -1), completeResult: result, completeThrew: thrown };
}

async function raw(label: string, url: string, headers: Record<string, string>, body: unknown) {
  const earlier: Exchange[] = [];
  for (let attempt = 1; ; attempt++) {
    const { record } = await exchange(`${label}#${attempt}`, url, { headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
    if (record.status === 429) rateLimits.push(record);
    if (record.status !== 503 || attempt === 3) return earlier.length ? { ...record, earlierAttempts: earlier } : record;
    earlier.push(record);
    await sleep(20000);
  }
}

const probes: Record<string, () => Promise<void>> = {
  async p1() {
    for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash-lite']) {
      const run = await viaComplete(`p1-${model}`, model, [{ role: 'user', content: PROMPT }], [READ_FILE]);
      save(`p1-compat-tool-${model}.json`, run); all[`p1-${model}`] = summarize(run);
      await sleep(6000);
    }
  },
  async p4() {
    const tools = [{ functionDeclarations: [{ name: 'read_file', description: READ_FILE.description, parameters: { type: 'object', properties: { path: { type: 'string', description: 'Project-relative path' } }, required: ['path'] } }] }];
    for (const model of ['gemini-3.8-flash', 'gemini-3.5-flash-lite']) {
      const url = `${BASE}/v1beta/models/${model}:streamGenerateContent?alt=sse`;
      const tool = await raw(`p4-tool-${model}`, url, native(), { contents: [{ role: 'user', parts: [{ text: PROMPT }] }], tools, generationConfig: { maxOutputTokens: 8192 } });
      save(`p4-native-stream-tool-${model}.json`, { ...tool, events: sseEvents(tool.body) }); all[`p4-tool-${model}`] = tool.framing;
      await sleep(6000);
      const text = await raw(`p4-text-${model}`, url, native(), { contents: [{ role: 'user', parts: [{ text: 'Write five short sentences about the Moon, one per line.' }] }], generationConfig: { maxOutputTokens: 8192 } });
      save(`p4-native-stream-text-${model}.json`, { ...text, events: sseEvents(text.body) }); all[`p4-text-${model}`] = text.framing;
      await sleep(6000);
    }
  },
  async p8() {
    const model = 'gemini-3.8-flash';
    // Turn 1: Moonzila's exact streamed body, through complete(), so the accumulator verdict is the product's.
    const first = await viaComplete('p8-turn1', model, [{ role: 'user', content: PROMPT }], [READ_FILE]);
    const events = sseEvents(first.exchange?.body ?? '');
    const carrying = events.map((event, index) => ({ index, event })).filter(({ event }) => JSON.stringify(event).includes('extra_content'));
    const calls = (events as Array<{ choices?: Array<{ delta?: { tool_calls?: Array<Record<string, unknown>> } }> }>).flatMap(event => event.choices?.[0]?.delta?.tool_calls ?? []);
    save('p8-turn1.json', { ...first, eventsCarryingExtraContent: carrying });
    const call = calls[0] as { id: string; function: { name: string; arguments: string }; extra_content?: unknown } | undefined;
    if (!call) { all.p8 = { turn1: summarize(first), stopped: 'no tool call in turn 1' }; return; }
    await sleep(6000);
    const toolMessage = { role: 'tool', tool_call_id: call.id, content: TOOL_RESULT };
    const assistant = (role: string, withSignature: boolean) => ({ role, content: '', tool_calls: [{ id: call.id, type: 'function', function: { name: call.function.name, arguments: call.function.arguments }, ...(withSignature && call.extra_content ? { extra_content: call.extra_content } : {}) }] });
    const body = (messages: unknown[]) => ({ model, messages, tools: [{ type: 'function', function: READ_FILE }], max_completion_tokens: 8192, stream_options: { include_usage: true }, stream: true });
    const withSig = await raw('p8-turn2-with-signature', `${COMPAT}/chat/completions`, bearer(), body([{ role: 'user', content: PROMPT }, assistant('assistant', true), toolMessage]));
    save('p8-turn2-with-signature.json', withSig);
    await sleep(6000);
    // Without the signature: Moonzila's own history replay, which cannot carry it today.
    const input = JSON.parse(call.function.arguments) as Record<string, unknown>;
    const without = await viaComplete('p8-turn2-without-signature', model, [{ role: 'user', content: PROMPT }, { role: 'assistant', content: '', toolCalls: [{ id: call.id, name: call.function.name, input: input as never }] }, { role: 'tool', content: TOOL_RESULT, toolCallId: call.id, toolName: call.function.name }], [READ_FILE]);
    save('p8-turn2-without-signature.json', without);
    await sleep(6000);
    const modelRole = await raw('p8-turn2-role-model-with-signature', `${COMPAT}/chat/completions`, bearer(), body([{ role: 'user', content: PROMPT }, assistant('model', true), toolMessage]));
    save('p8-turn2-role-model-with-signature.json', modelRole);
    all.p8 = { turn1: summarize(first), extraContentChunks: carrying.length, turn2WithSignature: withSig.status, turn2Without: summarize(without), turn2RoleModel: modelRole.status };
  },
  async p9() {
    const model = 'gemini-3.5-flash-lite';
    const url = `${BASE}/v1beta/models/${model}:countTokens`;
    const contents = [{ role: 'user', parts: [{ text: PROMPT }] }];
    const tools = [{ functionDeclarations: [{ name: 'read_file', description: READ_FILE.description, parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } }] }];
    const out: Record<string, Exchange> = {};
    out.contentsOnly = await raw('p9-contents', url, native(), { contents }); await sleep(3000);
    out.contentsPlusTools = await raw('p9-contents-tools', url, native(), { contents, tools }); await sleep(3000);
    out.generateContentRequestNoTools = await raw('p9-gcr', url, native(), { generateContentRequest: { model: `models/${model}`, contents } }); await sleep(3000);
    out.generateContentRequestWithTools = await raw('p9-gcr-tools', url, native(), { generateContentRequest: { model: `models/${model}`, contents, tools } });
    save('p9-count-tokens.json', out);
    all.p9 = Object.fromEntries(Object.entries(out).map(([name, record]) => [name, { status: record.status, body: record.body.trim() }]));
  },
  async p2() {
    const model = 'gemini-3.5-flash-lite';
    const window = 1048576; const target = Math.round(window * 1.5);
    // Deterministic synthetic filler: pseudo-random words from a fixed vocabulary, no repository text.
    const vocabulary = 'amber basil cedar delta ember fjord granite harbor iris juniper kelp lumen marble nectar onyx prairie quartz raven sable tundra umber velvet willow xenon yarrow zephyr'.split(' ');
    let seed = 20261011;
    const filler = (chars: number) => { const words: string[] = []; let length = 0; while (length < chars) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; const word = vocabulary[seed % vocabulary.length]! + (seed % 7 === 0 ? '.' : ''); words.push(word); length += word.length + 1; } return words.join(' '); };
    const countUrl = `${BASE}/v1beta/models/${model}:countTokens`;
    const sample = filler(200_000);
    const calibration = await raw('p2-calibrate', countUrl, native(), { contents: [{ role: 'user', parts: [{ text: sample }] }] });
    const sampleTokens = (JSON.parse(calibration.body) as { totalTokens?: number }).totalTokens;
    if (!sampleTokens) { save('p2-over-window.json', { calibration }); all.p2 = { stopped: 'calibration failed', status: calibration.status }; return; }
    const chars = Math.ceil(target * sample.length / sampleTokens);
    const text = 'Summarise the following text in one sentence.\n\n' + filler(chars);
    await sleep(5000);
    const counted = await raw('p2-count-full', countUrl, native(), { contents: [{ role: 'user', parts: [{ text }] }] });
    const out: Record<string, unknown> = { model, documentedInputTokenLimit: window, targetTokens: target, calibration: { sampleChars: sample.length, sampleTokens }, promptChars: text.length, promptBytes: Buffer.byteLength(text), countTokensOfFullPrompt: { status: counted.status, body: counted.body.trim() } };
    await sleep(20000);
    const compat = await viaComplete('p2-compat', model, [{ role: 'user', content: text }], undefined);
    out.compat = compat;
    await sleep(30000);
    out.nativeGenerate = await raw('p2-native-generate', `${BASE}/v1beta/models/${model}:generateContent`, native(), { contents: [{ role: 'user', parts: [{ text }] }] });
    await sleep(30000);
    out.nativeStream = await raw('p2-native-stream', `${BASE}/v1beta/models/${model}:streamGenerateContent?alt=sse`, native(), { contents: [{ role: 'user', parts: [{ text }] }] });
    save('p2-over-window.json', out);
    // complete() refuses this prompt before sending (one message is capped at 2,000,000 characters),
    // so the compatible route gets Moonzila's body shape built by hand, as complete() would build it.
    await sleep(65000);
    out.compatRaw = await raw('p2-compat-raw', `${COMPAT}/chat/completions`, bearer(), { model, messages: [{ role: 'user', content: text }], max_completion_tokens: 8192, stream_options: { include_usage: true }, stream: true });
    save('p2-over-window.json', out);
    const brief = (record: Exchange | undefined) => record && { status: record.status, body: record.body.slice(0, 4000) };
    all.p2 = { ...out, compat: { status: compat.exchange?.status, body: compat.exchange?.body.slice(0, 4000), completeThrew: compat.completeThrew }, nativeGenerate: brief(out.nativeGenerate as Exchange), nativeStream: brief(out.nativeStream as Exchange) };
  },
};

function summarize(run: Awaited<ReturnType<typeof viaComplete>>) {
  return { status: run.exchange?.status, framing: run.exchange?.framing, completeResult: run.completeResult, completeThrew: run.completeThrew };
}

const selected = process.argv.slice(2).length ? process.argv.slice(2) : ['p1', 'p4', 'p9', 'p8', 'p2'];
for (const name of selected) {
  console.log(`== ${name}`);
  try { await probes[name]!(); } catch (error) { all[name] = { scriptError: redact(String(error)) }; }
  console.log(redact(JSON.stringify(all[name] ?? all[Object.keys(all).find(k => k.startsWith(name)) ?? ''], null, 1)).slice(0, 3000));
  await sleep(5000);
}
save(`summary-${selected.join('-')}.json`, all);
if (rateLimits.length) save(`p11-rate-limits-${selected.join('-')}.json`, rateLimits);
console.log('rate limited responses:', rateLimits.length);
