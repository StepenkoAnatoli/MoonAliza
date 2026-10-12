import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inspect } from 'node:util';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { complete, type Completion, type Fetcher, type InferenceMessage, type InferenceProfile } from '../src/main/inference';
import type { ToolSpec } from '../src/shared';
import { REFUSAL_TOOL, STATE_REFUSALS, VALID_STATE_DATA, builtStream, refusalTranscript, type BuiltBlock } from './fixtures/anthropic-state-refusals';

// complete() with kind `anthropic` (docs/specification/more-models-phase2.md sections 4, 5.7, 5.8 and "Tests the builders
// owe", Main (U4)): the kind table's entry, driven through U2's seam (pre-checks, post(), the deadline) and U3's part,
// over a fake fetcher. Nothing here reaches a network.
//
// Sources of the fixtures:
// - Live recordings (the Anthropic probes of 2026-10-12, docs/evidence/2026-10-12-anthropic-probes.md):
//   - D2_BODY and D7_BODY are copied byte for byte from docs/evidence/2026-10-12-anthropic-probes/D2-over-window.response.raw
//     (D2: Haiku 4.5, 400, the over-window refusal) and .../D7-over-max-haiku.response.raw (D7: 400, an over-maximum
//     max_tokens), and checked against those files and their sha256 by the first test.
//   - The recorded requests (docs/evidence/2026-10-12-anthropic-probes/<id>.request.json: url, headers with the key
//     redacted, the body sent and its sha256) are read from the evidence folder; the live answers are read from
//     tests/fixtures/anthropic-live/ (U3's byte-exact copies, sha256 checked again here).
// - Every other stream is built from E-10 shapes, not a capture (tests/fixtures/anthropic-state-refusals.ts).

const EVIDENCE = '../docs/evidence/2026-10-12-anthropic-probes/';
const evidence = (name: string) => readFileSync(new URL(EVIDENCE + name, import.meta.url), 'utf8');
const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

// docs/evidence/2026-10-12-anthropic-probes/D2-over-window.response.raw, byte for byte (164 bytes, no line end).
const D2_BODY = '{"type":"error","error":{"type":"invalid_request_error","message":"prompt is too long: 340027 tokens > 200000 maximum"},"request_id":"req_011Cfww8XJDMkdomNnZtuQaJ"}';
// docs/evidence/2026-10-12-anthropic-probes/D7-over-max-haiku.response.raw, byte for byte (223 bytes, no line end).
const D7_BODY = '{"type":"error","error":{"type":"invalid_request_error","message":"max_tokens: 70000 > 64000, which is the maximum allowed number of output tokens for claude-haiku-4-5-20251001"},"request_id":"req_011Cfww8ZB5ZPGe2LG2wLpa2"}';
const EVIDENCE_SHA256 = { 'D2-over-window.response.raw': 'c87a3e5928f725541dfe459e2ce76a408ce155bf3781857d2c3fb23766c79df8', 'D7-over-max-haiku.response.raw': 'ad69627e52604e07cb2703e5dda9f8e87985f777b9470b4a1b15e7683f389a02' } as const;

// U3's copies of the live answers (sha256 as in tests/anthropic.test.ts, the evidence files' own).
const LIVE_SHA256 = {
  'D1-bearer.response.raw': '66cf0064b6c8114d177d7dc258b5097d345aed56f230d9cbbfabcfe95b2c7f6d',
  'D5-think-sonnet-step1.response.raw': '41d24e1bb0266ec346b686ba23c17d6eeec7a5d183a402d41202f0041d390f83',
  'D5-think-sonnet-step2.response.raw': '1bacd81c88a687b351612e9c9af78c47ea9daf7edd40a90dda24cfa59bdc1b2c',
} as const;
/** A live answer's text. The probes recorded LF line ends only (D3), so a checkout that wrote CRLF is undone here. */
const live = (name: keyof typeof LIVE_SHA256) => readFileSync(new URL(`./fixtures/anthropic-live/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
interface RecordedRequest { readonly url: string; readonly headers: Record<string, string>; readonly bodyUtf8Bytes: number; readonly bodySha256: string; readonly body: { readonly messages: ReadonlyArray<{ readonly role: string; readonly content: unknown }> } }
const recorded = (name: string) => JSON.parse(evidence(name)) as RecordedRequest;
// The probes' system prompt, tools, prompt and tool results (docs/evidence/2026-10-12-anthropic-probes/run.mjs; the
// recorded requests hold them, and the byte-for-byte body checks below would fail on any difference).
const LIVE_SYSTEM = 'You are a test assistant. Use the tools when the user asks for them.';
const LIVE_TOOLS: ToolSpec[] = [
  { name: 'get_weather', description: 'Get the current weather for a city.', parameters: { type: 'object', properties: { city: { type: 'string', description: 'City name' } }, required: ['city'] } },
  { name: 'get_time', description: 'Get the current UTC time. Takes no arguments.', parameters: { type: 'object', properties: {} } },
];
const THINK_PROMPT = 'Think step by step before using any tool: which is larger, 17 x 23 or 19 x 21? If the first is larger, call get_weather for Paris, otherwise for Rome. Also call get_time. Then answer in one sentence.';
const LIVE_RESULTS = ['Paris: 18 C, cloudy.', '14:05 UTC'];

const KEY = 'sk-ant-api03-TransportTestKey0001'; // built for the tests, not a key
const profile: InferenceProfile = { kind: 'anthropic', endpoint: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5-5', outputTokens: 4096 };
const hello: InferenceMessage[] = [{ role: 'user', content: 'Reply with OK.' }];
const signal = () => new AbortController().signal;
const ok: BuiltBlock = { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 'OK.' }] };
/** A 200 whose body is `text`, labelled as the live answers were (D3). */
const stream = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } });
/** A built `end_turn` answer "OK." (built from E-10 shapes, not a capture). */
const okStream = () => stream(builtStream([ok], 'end_turn'));
/** A built Anthropic error body (E-12 l.60-77's shape, not a capture). */
const refusedWith = (status: number, headers: Record<string, string> = {}, type = status === 429 ? 'rate_limit_error' : 'api_error') =>
  new Response(JSON.stringify({ type: 'error', error: { type, message: `built ${status} for the tests` } }), { status, headers: { 'Content-Type': 'application/json', ...headers } });

async function failure(promise: Promise<unknown>): Promise<Error> {
  try { await promise; } catch (error) { return error as Error; }
  throw new Error('expected the call to fail');
}

afterEach(() => { vi.useRealTimers(); });

test('the recorded bodies are the evidence files, byte for byte, and each recorded request body is the one sent', () => {
  // Guard: a fixture that drifts from its evidence file (mutation: change one character of D2_BODY).
  for (const [name, body] of [['D2-over-window.response.raw', D2_BODY], ['D7-over-max-haiku.response.raw', D7_BODY]] as const) {
    expect(evidence(name), name).toBe(body);
    expect(sha256(body), name).toBe(EVIDENCE_SHA256[name]);
  }
  for (const [name, hash] of Object.entries(LIVE_SHA256)) expect(sha256(live(name as keyof typeof LIVE_SHA256)), name).toBe(hash);
  for (const name of ['D1-bearer.request.json', 'D5-think-sonnet-step1.request.json', 'D5-think-sonnet-step2.request.json']) {
    const request = recorded(name); const sent = JSON.stringify(request.body);
    expect(Buffer.byteLength(sent), name).toBe(request.bodyUtf8Bytes);
    expect(sha256(sent), name).toBe(request.bodySha256);
  }
});

describe('route, exact init and headers', () => {
  test('a keyed request goes to <endpoint>/messages with the exact init: POST, the three headers in order, redirect error, credentials omit (F-5, F-6)', async () => {
    // Guards: the kind table's entry (mutation: remove it; NOT_IMPLEMENTED, no fetch); credentials: 'omit' in post()
    // (mutation: drop it; the init then lacks the field; D10's verdict kept it); the route (mutation: url
    // `${endpoint}/v1/messages`).
    const sent: Array<{ url: string; init: RequestInit }> = [];
    const output = await complete(profile, [{ role: 'system', content: 'Be brief.' }, ...hello], { secret: KEY, signal: signal(), fetcher: async (url, init) => { sent.push({ url, init }); return okStream(); } });
    expect(sent).toHaveLength(1);
    const { url, init } = sent[0]!;
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init).toEqual({ method: 'POST', headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', Authorization: `Bearer ${KEY}` }, body: init.body, signal: expect.any(AbortSignal), redirect: 'error', credentials: 'omit' });
    expect(Object.entries(init.headers as Record<string, string>)).toEqual([['Content-Type', 'application/json'], ['anthropic-version', '2023-06-01'], ['Authorization', `Bearer ${KEY}`]]);
    expect(init.body).toBe('{"model":"claude-sonnet-5-5","max_tokens":4096,"system":"Be brief.","messages":[{"role":"user","content":"Reply with OK."}],"stream":true}');
    expect(output).toEqual({ content: 'OK.', outcome: 'complete', usage: { inputTokens: 10, outputTokens: 5 } });
  });

  test('without a key there is no Authorization, and never x-api-key, anthropic-beta or a workspace header', async () => {
    // A loopback gateway or test fake under cloud-allowed (spec section 7): `http:` on loopback, still kind anthropic.
    const sent: RequestInit[] = [];
    await complete({ ...profile, endpoint: 'http://127.0.0.1:8123/v1' }, hello, { signal: signal(), fetcher: async (url, init) => { expect(url).toBe('http://127.0.0.1:8123/v1/messages'); sent.push(init); return okStream(); } });
    expect(Object.entries(sent[0]!.headers as Record<string, string>)).toEqual([['Content-Type', 'application/json'], ['anthropic-version', '2023-06-01']]);
    const keyed: RequestInit[] = [];
    await complete(profile, hello, { secret: KEY, signal: signal(), fetcher: async (_url, init) => { keyed.push(init); return okStream(); } });
    const names = Object.keys(keyed[0]!.headers as Record<string, string>).map(name => name.toLowerCase());
    for (const name of ['x-api-key', 'anthropic-beta', 'anthropic-workspace-id']) expect(names).not.toContain(name);
  });

  test('the live D1 request: complete() sends the body the API accepted, byte for byte, and maps the live answer (D1, D3, D4)', async () => {
    // D1 sent "Reply with OK." with max_tokens 64 to Sonnet 5.5 and got 200 "OK." (usage 15 in, 5 out). Guard: any byte
    // of the request (mutation: move `stream` to the front of encodeAnthropic's body; the sha256 then differs).
    const accepted = recorded('D1-bearer.request.json');
    const sent: Array<{ url: string; init: RequestInit }> = [];
    const output = await complete({ ...profile, outputTokens: 64 }, hello, { secret: KEY, signal: signal(), fetcher: async (url, init) => { sent.push({ url, init }); return stream(live('D1-bearer.response.raw')); } });
    expect(sent[0]!.url).toBe(accepted.url);
    expect(Object.keys(sent[0]!.init.headers as Record<string, string>)).toEqual(Object.keys(accepted.headers));
    expect(sha256(String(sent[0]!.init.body))).toBe(accepted.bodySha256);
    expect(output).toEqual({ content: 'OK.', outcome: 'complete', usage: { inputTokens: 15, outputTokens: 5 } });
  });
});

test('a two-step round trip through complete(): step 1\'s state goes into step 2\'s body unchanged, and both bodies are the ones the API accepted (D5)', async () => {
  // The live D5-think-sonnet round trip, replayed through complete() on both steps: step 1's live answer (thinking,
  // text, two tool_use) becomes a tool_calls completion with state; step 2 carries that completion as the assistant
  // step. Guards: the state passes the kind-neutral checks to the part (mutation: checkTranscript drops providerState
  // from the parsed messages; step 2 is then refused, INVALID_INFERENCE_REQUEST); the part sends it unchanged (mutation:
  // rebuild each replayed tool_use block from type, id, name and input in encodeAnthropic; `caller` is dropped).
  const steps = [recorded('D5-think-sonnet-step1.request.json'), recorded('D5-think-sonnet-step2.request.json')];
  const answers = [live('D5-think-sonnet-step1.response.raw'), live('D5-think-sonnet-step2.response.raw')];
  const bodies: string[] = [];
  const fetcher: Fetcher = async (url, init) => { expect(url).toBe('https://api.anthropic.com/v1/messages'); bodies.push(String(init.body)); return stream(answers[bodies.length - 1]!); };
  const first: InferenceMessage[] = [{ role: 'system', content: LIVE_SYSTEM }, { role: 'user', content: THINK_PROMPT }];
  const step1 = await complete(profile, first, { secret: KEY, signal: signal(), tools: LIVE_TOOLS, fetcher });
  expect(step1).toMatchObject({ outcome: 'tool_calls', providerState: { format: 'anthropic-messages@1', appendOnly: true } });
  expect(step1.toolCalls!.map(call => call.name)).toEqual(['get_weather', 'get_time']);
  const second: InferenceMessage[] = [...first, { role: 'assistant', content: step1.content, toolCalls: step1.toolCalls, providerState: step1.providerState },
    ...step1.toolCalls!.map((call, index) => ({ role: 'tool' as const, content: LIVE_RESULTS[index]!, toolCallId: call.id, toolName: call.name }))];
  const step2 = await complete(profile, second, { secret: KEY, signal: signal(), tools: LIVE_TOOLS, fetcher });
  expect(bodies).toHaveLength(2);
  // The state's content array, as its bytes stand in `data`, is step 2's assistant content, byte for byte.
  const stateContent = step1.providerState!.data.slice('{"content":'.length, -1);
  expect(bodies[1]).toContain(`{"role":"assistant","content":${stateContent}}`);
  expect(stateContent).toBe(JSON.stringify(steps[1]!.body.messages[1]!.content));
  expect(bodies.map(sha256)).toEqual(steps.map(step => step.bodySha256));
  expect(step2).toMatchObject({ outcome: 'complete', usage: { inputTokens: 789, outputTokens: 130 } });
  expect(step2).not.toHaveProperty('providerState');
});

describe('refusals (F-13, S-4)', () => {
  test('the live D2 over-window 400 is CONTEXT_LIMIT, after one fetch, and nothing of its body is in the error', async () => {
    // Guards: 400 is a refusal status whose body is read (mutation: refusalStatuses [] on anthropicKind; the body is then
    // cancelled unread, PROVIDER_HTTP_400); the body never leaves complete() (mutation: post() throws its error with the
    // refusal body as `cause`; inspect() then shows it).
    let fetched = 0;
    const error = await failure(complete({ ...profile, model: 'claude-haiku-4-5-20251001', outputTokens: 64 }, hello, { secret: KEY, signal: signal(), fetcher: async () => { fetched += 1; return new Response(D2_BODY, { status: 400, headers: { 'Content-Type': 'application/json' } }); } }));
    expect(error.message).toBe('CONTEXT_LIMIT');
    expect(fetched).toBe(1);
    const shown = [error.message, String(error), String(error.stack), inspect(error, { depth: 10, showHidden: true }), JSON.stringify(error), String((error as { cause?: unknown }).cause)].join('\n');
    for (const fragment of ['prompt is too long', '340027', 'invalid_request_error', 'req_011Cfww8XJDMkdomNnZtuQaJ']) expect(shown).not.toContain(fragment);
  });

  test('the live D7 over-maximum 400 is PROVIDER_HTTP_400, not an overflow, and nothing of its body is in the error', async () => {
    let fetched = 0;
    const error = await failure(complete({ ...profile, model: 'claude-haiku-4-5-20251001', outputTokens: 70_000, contextTokens: 200_000 }, hello, { secret: KEY, signal: signal(), fetcher: async () => { fetched += 1; return new Response(D7_BODY, { status: 400, headers: { 'Content-Type': 'application/json' } }); } }));
    expect(error.message).toBe('PROVIDER_HTTP_400');
    expect(fetched).toBe(1);
    const shown = [error.message, String(error.stack), inspect(error, { depth: 10, showHidden: true })].join('\n');
    for (const fragment of ['max_tokens', '64000', 'req_011Cfww8ZB5ZPGe2LG2wLpa2']) expect(shown).not.toContain(fragment);
  });
});

/**
 * complete() under fake timers: the fake time of each fetch, and of the call's end (`settledAt`), counted from its start.
 * Times, not a settled flag read at one moment, so a check does not depend on how many promise hops the call takes.
 */
function timed(answers: Array<() => Response>, options: { retry?: boolean } = {}) {
  const at: number[] = []; const started = Date.now();
  const fetcher: Fetcher = async () => { at.push(Date.now() - started); return answers[at.length - 1]!(); };
  const state: { settledAt?: number; result?: Completion; error?: Error } = {};
  void complete(profile, hello, { secret: KEY, signal: signal(), fetcher, ...(options.retry === undefined ? {} : { retry: options.retry }) })
    .then(result => { state.result = result; }, (error: Error) => { state.error = error; }).finally(() => { state.settledAt = Date.now() - started; });
  return { at, state };
}

describe('retries through complete() (F-14, spec 5.8)', () => {
  test('a 429 without retry-after is the spend cap: one fetch, PROVIDER_HTTP_429 at once', async () => {
    // Guard: the 429 rule (mutation in anthropicRetryDelayMs: a 429 without the header waits 1 s; a second fetch then
    // follows).
    vi.useFakeTimers();
    const call = timed([() => refusedWith(429), okStream]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(call.state.error?.message).toBe('PROVIDER_HTTP_429');
    expect(call.state.settledAt).toBe(0);
    expect(call.at).toEqual([0]);
  });

  test('a 429 with an integer retry-after waits that many seconds, then the retry answers', async () => {
    // Guards: the header is honoured (mutation: a 429 never retries; one fetch, PROVIDER_HTTP_429); the wait is taken
    // (mutation: post() skips its pause; the retry then goes at 0 ms).
    vi.useFakeTimers();
    const call = timed([() => refusedWith(429, { 'retry-after': '3' }), okStream]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(call.at).toEqual([0, 3_000]);
    expect(call.state).toMatchObject({ settledAt: 3_000, result: { content: 'OK.', outcome: 'complete' } });
  });

  test('a 503 retries after 1 s, and a second one after 2 s more', async () => {
    // Guard: the 5xx rule (mutation: a 5xx without the header never retries; one fetch, PROVIDER_HTTP_503).
    vi.useFakeTimers();
    const once = timed([() => refusedWith(503), okStream]);
    const twice = timed([() => refusedWith(503), () => refusedWith(503), okStream]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(once.at).toEqual([0, 1_000]);
    expect(once.state).toMatchObject({ settledAt: 1_000, result: { outcome: 'complete' } });
    expect(twice.at).toEqual([0, 1_000, 3_000]);
    expect(twice.state).toMatchObject({ settledAt: 3_000, result: { outcome: 'complete' } });
  });

  test('with retry: false the same 503 makes one fetch and throws PROVIDER_HTTP_503 at once, with no timer left', async () => {
    // profile.test passes it (F-20). Guard: complete() hands the option to post() (mutation: pass `retry: true`
    // whatever the option; the call then waits 1 s and retries).
    vi.useFakeTimers();
    const call = timed([() => refusedWith(503), okStream], { retry: false });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(call.state.error?.message).toBe('PROVIDER_HTTP_503');
    expect(call.state.settledAt).toBe(0);
    expect(call.at).toEqual([0]);
    expect(vi.getTimerCount(), 'the deadline timer is cleared').toBe(0);
  });
});

describe('the 600 s deadline (F-22)', () => {
  // A stalled answer: no headers at all, or headers and message_start and then nothing. The fake ends either on the
  // signal complete() hands it, as a real fetch does. Fake timers drive complete()'s own setTimeout (no spy: unlike the
  // chat kinds' 120 s pin, this was never AbortSignal.timeout). Guard: anthropicKind's timeoutMs (mutation: 120_000;
  // the call then ends at 120 s).
  const stalls: Array<[string, (init: RequestInit) => Promise<Response>]> = [
    ['before the headers', init => new Promise((_resolve, reject) => init.signal!.addEventListener('abort', () => reject(init.signal!.reason), { once: true }))],
    ['inside the stream', async init => new Response(new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(new TextEncoder().encode(builtStream([ok], 'end_turn').split('\n\n')[0]! + '\n\n'));
      init.signal!.addEventListener('abort', () => controller.error(init.signal!.reason), { once: true });
    } }), { headers: { 'Content-Type': 'text/event-stream' } })],
  ];
  test.each(stalls)('a stall %s is not aborted at 120 s and is at 600 s', async (_name, stall) => {
    vi.useFakeTimers();
    let seen: AbortSignal | undefined;
    const outcome = complete(profile, hello, { secret: KEY, signal: signal(), fetcher: (_url, init) => { seen = init.signal!; return stall(init); } }).then(() => 'resolved', (error: unknown) => error);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(seen, 'the request was sent').toBeDefined();
    expect(seen!.aborted, 'not aborted at 120 s').toBe(false);
    await vi.advanceTimersByTimeAsync(600_000 - 120_000 - 1);
    expect(seen!.aborted, 'not aborted before 600 s').toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(seen!.aborted, 'aborted at 600 s').toBe(true);
    const error = await outcome;
    expect(error).toBeInstanceOf(DOMException);
    expect((error as DOMException).name).toBe('TimeoutError');
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('the state refusal table through complete() (F-8, F-11; spec 5.3)', () => {
  // Every row of U3's table (tests/fixtures/anthropic-state-refusals.ts), as the state of an assistant tool step, is
  // refused before any fetch. Guard: the encoder's state schema (mutation in parseAnthropicState: accept any block,
  // dropping `content.every(isReplayableBlock)`; every block-shape row is then sent).
  test.each(STATE_REFUSALS.map(row => [row.name, row.data] as const))('%s: INVALID_INFERENCE_REQUEST, no fetch', async (_name, data) => {
    let fetched = 0;
    const error = await failure(complete(profile, refusalTranscript(data), { secret: KEY, signal: signal(), tools: [REFUSAL_TOOL], fetcher: async () => { fetched += 1; return okStream(); } }));
    expect(error.message).toBe('INVALID_INFERENCE_REQUEST');
    expect(fetched).toBe(0);
  });

  test('the valid state every row departs from is sent, unchanged, in one fetch', async () => {
    // So each refusal above is the row's one change, not the transcript around it.
    const bodies: string[] = [];
    const output = await complete(profile, refusalTranscript(VALID_STATE_DATA), { secret: KEY, signal: signal(), tools: [REFUSAL_TOOL], fetcher: async (_url, init) => { bodies.push(String(init.body)); return okStream(); } });
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toContain(`{"role":"assistant","content":${VALID_STATE_DATA.slice('{"content":'.length, -1)}}`);
    expect(output).toMatchObject({ content: 'OK.', outcome: 'complete' });
  });
});
