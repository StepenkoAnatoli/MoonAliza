import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { inspect } from 'node:util';
import { describe, expect, test } from 'vitest';
import { BoundedJsonObjectSchema, PROVIDER_STATE_MAX } from '../src/engine/control';
import { ANTHROPIC_VERSION, anthropicHeaders, anthropicKind, anthropicOutcome, anthropicRetryDelayMs, encodeAnthropic, isAnthropicOverflow, parseAnthropicState, readAnthropic, type AnthropicFold, type FoldedBlock } from '../src/main/anthropic';
import type { Completion, InferenceMessage, InferenceProfile } from '../src/main/inference';
import type { CheckedTranscript } from '../src/main/provider-kind';
import type { ToolCall, ToolSpec } from '../src/shared';
import { REFUSAL_SIGNATURE, REFUSAL_TOOL, STATE_REFUSALS, VALID_STATE_DATA, blockDelta, blockEvents, blockStart, blockStop, builtStream, messageEnd, messageStart, nested, refusalTranscript, sseText, toolUseBlock, type BuiltBlock } from './fixtures/anthropic-state-refusals';

// The Anthropic Messages adapter's pure parts (docs/specification/more-models-phase2.md section 5; unit U3).
// Fixtures marked "E-10, capture lines a-b" are copied verbatim from the wire corpus and checked against it by the
// first test; every other stream is built from E-10 shapes, not a capture.

const WIRE = '../docs/research/2026-10-05-provider-wire-formats/research/raw/';
const STREAMING = '2026-10-05-streaming-messages-claude-platform-docs-claude-0712ffc4.md';
const captureLines = (first: number, last: number) => readFileSync(new URL(WIRE + STREAMING, import.meta.url), 'utf8').split('\n').slice(first - 1, last).join('\n');

// E-10, capture lines 198-220: the basic stream, with a `ping` event.
const E10_BASIC = String.raw`event: message_start
data: {"type": "message_start", "message": {"id": "msg_1nZdL29xx5MUA1yADyHTEsnR8uuvGzszyY", "type": "message", "role": "assistant", "content": [], "model": "claude-opus-5-5", "stop_reason": null, "stop_sequence": null, "usage": {"input_tokens": 25, "output_tokens": 1}}}

event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "text", "text": ""}}

event: ping
data: {"type": "ping"}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "Hello"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "text_delta", "text": "!"}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence":null}, "usage": {"output_tokens": 15}}

event: message_stop
data: {"type": "message_stop"}`;

// E-10, capture lines 269-348: the tool-use stream, whose first `partial_json` is empty (l.324).
const E10_TOOL_USE = String.raw`event: message_start
data: {"type":"message_start","message":{"id":"msg_014p7gG3wDgGV9EUtLvnow3U","type":"message","role":"assistant","model":"claude-opus-5","stop_sequence":null,"usage":{"input_tokens":472,"output_tokens":2},"content":[],"stop_reason":null}}

event: content_block_start
data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}

event: ping
data: {"type": "ping"}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Okay"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":","}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" let"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"'s"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" check"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" the"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" weather"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" for"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" San"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" Francisco"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":","}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":" CA"}}

event: content_block_delta
data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":":"}}

event: content_block_stop
data: {"type":"content_block_stop","index":0}

event: content_block_start
data: {"type":"content_block_start","index":1,"content_block":{"type":"tool_use","id":"toolu_01T1x1fJ34qAmk2tNTrN7Up6","name":"get_weather","input":{}}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":""}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"{\"location\":"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":" \"San"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":" Francisc"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":"o,"}}

event: content_block_delta
data: {"type":"content_block_delta","index":1,"delta":{"type":"input_json_delta","partial_json":" CA\"}"}}

event: content_block_stop
data: {"type":"content_block_stop","index":1}

event: message_delta
data: {"type":"message_delta","delta":{"stop_reason":"tool_use","stop_sequence":null},"usage":{"output_tokens":89}}

event: message_stop
data: {"type":"message_stop"}`;

// E-10, capture lines 388-425: the thinking stream; neither event carries usage.
const E10_THINKING = String.raw`event: message_start
data: {"type": "message_start", "message": {"id": "msg_01...", "type": "message", "role": "assistant", "content": [], "model": "claude-opus-5-5", "stop_reason": null, "stop_sequence": null}}

event: content_block_start
data: {"type": "content_block_start", "index": 0, "content_block": {"type": "thinking", "thinking": "", "signature": ""}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "I need to find the GCD of 1071 and 462 using the Euclidean algorithm.\n\n1071 = 2 × 462 + 147"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "\n462 = 3 × 147 + 21"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "\n147 = 7 × 21 + 0"}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "thinking_delta", "thinking": "\nThe remainder is 0, so GCD(1071, 462) = 21."}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 0, "delta": {"type": "signature_delta", "signature": "EqQBCgIYAhIM1gbcDa9GJwZA2b3hGgxBdjrkzLoky3dl1pkiMOYds..."}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 0}

event: content_block_start
data: {"type": "content_block_start", "index": 1, "content_block": {"type": "text", "text": ""}}

event: content_block_delta
data: {"type": "content_block_delta", "index": 1, "delta": {"type": "text_delta", "text": "The greatest common divisor of 1071 and 462 is **21**."}}

event: content_block_stop
data: {"type": "content_block_stop", "index": 1}

event: message_delta
data: {"type": "message_delta", "delta": {"stop_reason": "end_turn", "stop_sequence": null}}

event: message_stop
data: {"type": "message_stop"}`;

// E-10, capture lines 85-86: an error event inside the stream.
const E10_ERROR = String.raw`event: error
data: {"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}}`;

// Live files, not Research-Kit captures: each file under tests/fixtures/anthropic-live/ is a byte-for-byte copy of the
// file of the same name in docs/evidence/2026-10-12-anthropic-probes/ (live probe 2026-10-12, against the native
// Messages API; report docs/evidence/2026-10-12-anthropic-probes.md, D3, D4, D5, D13, D14), checked by the sha256
// below, which is the evidence file's own (`sha256sum`, 2026-10-12):
// - D1-bearer.response.raw: docs/evidence/2026-10-12-anthropic-probes/D1-bearer.response.raw, live probe D1 (Sonnet 5.5,
//   "Reply with OK."), the streamed answer D4 compares with the non-streamed one.
// - D5-think-sonnet-step1.response.raw: docs/evidence/2026-10-12-anthropic-probes/D5-think-sonnet-step1.response.raw,
//   live probe D5-think-sonnet step 1 (Sonnet 5.5): thinking, text and two tool_use, the second argument-free.
// - D5-think-sonnet-step2.request.json: docs/evidence/2026-10-12-anthropic-probes/D5-think-sonnet-step2.request.json,
//   the step-2 request that replayed step 1's content, accepted (200); headers redacted; `bodySha256` hashes the bytes sent.
// - D5-think-sonnet-step2.response.raw: docs/evidence/2026-10-12-anthropic-probes/D5-think-sonnet-step2.response.raw,
//   live probe D5-think-sonnet step 2: the final answer (thinking, text).
// - D11-haiku-step1.response.raw: docs/evidence/2026-10-12-anthropic-probes/D11-haiku-step1.response.raw, live probe D11
//   step 1 (Haiku 4.5, thinking omitted): two tool_use, the second argument-free.
// - D11-haiku-step2.request.json: docs/evidence/2026-10-12-anthropic-probes/D11-haiku-step2.request.json, its step-2
//   request, accepted (200).
// - D12-opus-32000.response.raw: docs/evidence/2026-10-12-anthropic-probes/D12-opus-32000.response.raw, live probe D12
//   (Opus 5.5, max_tokens 32,000): a thinking-heavy tool step.
const LIVE_SHA256 = {
  'D1-bearer.response.raw': '66cf0064b6c8114d177d7dc258b5097d345aed56f230d9cbbfabcfe95b2c7f6d',
  'D5-think-sonnet-step1.response.raw': '41d24e1bb0266ec346b686ba23c17d6eeec7a5d183a402d41202f0041d390f83',
  'D5-think-sonnet-step2.request.json': '413d5f9d5c20ab180c1ac9708aaa67fab4e18601ed52786b92c033b08487bd8c',
  'D5-think-sonnet-step2.response.raw': '1bacd81c88a687b351612e9c9af78c47ea9daf7edd40a90dda24cfa59bdc1b2c',
  'D11-haiku-step1.response.raw': 'c269ccb1925798437677c1b22afbfd69e26d5cbcbaa63e854f2bf187088bf1f9',
  'D11-haiku-step2.request.json': '893e24a82d1d3aab649119febf821aa2ee1b949494203f410e245b463237cea3',
  'D12-opus-32000.response.raw': '472666b6925deb7a50c2b0b5c1e1869a757d56b08510ab17276a973dab7a4039',
} as const;
type LiveFile = keyof typeof LIVE_SHA256;
const LIVE_STREAMS = ['D1-bearer.response.raw', 'D5-think-sonnet-step1.response.raw', 'D5-think-sonnet-step2.response.raw', 'D11-haiku-step1.response.raw', 'D12-opus-32000.response.raw'] as const;
/** A live file's text. The probes recorded LF line ends only (D3), so a checkout that wrote CRLF is undone here. */
const live = (name: LiveFile) => readFileSync(new URL(`./fixtures/anthropic-live/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const sha256 = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
interface RecordedRequest { readonly bodyUtf8Bytes: number; readonly bodySha256: string; readonly body: { readonly messages: ReadonlyArray<{ readonly role: string; readonly content: unknown }> } }
const recorded = (name: LiveFile) => JSON.parse(live(name)) as RecordedRequest;
// The probes' system prompt, tools and prompts (docs/evidence/2026-10-12-anthropic-probes/run.mjs; the recorded requests).
const LIVE_SYSTEM = 'You are a test assistant. Use the tools when the user asks for them.';
const LIVE_TOOLS: ToolSpec[] = [
  { name: 'get_weather', description: 'Get the current weather for a city.', parameters: { type: 'object', properties: { city: { type: 'string', description: 'City name' } }, required: ['city'] } },
  { name: 'get_time', description: 'Get the current UTC time. Takes no arguments.', parameters: { type: 'object', properties: {} } },
];
const THINK_PROMPT = 'Think step by step before using any tool: which is larger, 17 x 23 or 19 x 21? If the first is larger, call get_weather for Paris, otherwise for Rome. Also call get_time. Then answer in one sentence.';
const PLAIN_PROMPT = 'Call get_weather for Paris and call get_time, then tell me both results in one sentence.';
const RAINY_PROMPT = 'Think carefully before acting. A city is chosen as follows: list the ten largest European capitals by population, reason step by step about which of them has the most rainy days per year, double-check your reasoning, and then call get_weather exactly once for the city you chose. Do not answer before calling the tool.';
const LIVE_RESULTS = ['Paris: 18 C, cloudy.', '14:05 UTC'];

const profile: InferenceProfile = { kind: 'anthropic', endpoint: 'https://api.anthropic.com/v1', model: 'claude-opus-5-5', outputTokens: 4096 };
const tool = (name: string, description = `${name} tool`): ToolSpec => ({ name, description, parameters: { type: 'object', properties: {} } });
const check = (tools: readonly ToolSpec[] = [REFUSAL_TOOL], usedIds: Iterable<string> = []) => ({ tools, usedIds: new Set(usedIds) });

/** A body delivered in pieces of `size` bytes, so nothing can rely on a chunk holding a whole line. */
function respond(text: string, options: { contentType?: string | null; size?: number } = {}): Response {
  const bytes = new TextEncoder().encode(text); const size = options.size ?? 7;
  const contentType = options.contentType === undefined ? 'text/event-stream' : options.contentType;
  return new Response(new ReadableStream({ start(controller) {
    for (let at = 0; at < bytes.length; at += size) controller.enqueue(bytes.slice(at, at + size));
    controller.close();
  } }), contentType === null ? {} : { headers: { 'Content-Type': contentType } });
}
const read = (text: string, options?: { contentType?: string | null; size?: number }) => readAnthropic(respond(text, options));
const map = async (text: string, tools: readonly ToolSpec[] = [REFUSAL_TOOL], usedIds: Iterable<string> = []): Promise<Completion> => anthropicOutcome(await read(text), check(tools, usedIds));
async function failure(promise: Promise<unknown>): Promise<Error> {
  try { await promise; } catch (error) { return error as Error; }
  throw new Error('expected the call to fail');
}
const message = async (promise: Promise<unknown>) => (await failure(promise)).message;

const signedThinking = (thinking = ''): BuiltBlock => ({ start: { type: 'thinking', thinking: '', signature: '' }, deltas: [{ type: 'thinking_delta', thinking }, { type: 'signature_delta', signature: REFUSAL_SIGNATURE }] });
const textOf = (...pieces: string[]): BuiltBlock => ({ start: { type: 'text', text: '' }, deltas: pieces.map(text => ({ type: 'text_delta', text })) });
const LIST_FILES_CALL = { id: 'toolu_01', name: 'list_files', input: { path: '.' } };

const folded = (fields: Record<string, unknown>, partialJson = ''): FoldedBlock => ({ fields, partialJson, replayable: true, closed: true });
const foldOf = (blocks: FoldedBlock[], stopReason: string | null = 'tool_use'): AnthropicFold => ({ started: true, stopped: true, stopReason, blocks, usage: {} });
const callBlock = folded({ type: 'tool_use', id: 'toolu_01', name: 'list_files', input: {} }, '{"path":"."}');

const checked = (messages: InferenceMessage[]): CheckedTranscript => ({ messages, usedIds: new Set(messages.flatMap(item => item.toolCalls?.map(call => call.id) ?? [])) });
const encode = (messages: InferenceMessage[], tools: readonly ToolSpec[] = []) => encodeAnthropic(profile, checked(messages), tools);
const stateOf = (content: unknown[], appendOnly = false) => ({ format: 'anthropic-messages@1', appendOnly, data: JSON.stringify({ content }) });
const toolStep = (content: unknown[], calls: ToolCall[], text = ''): InferenceMessage => ({ role: 'assistant', content: text, toolCalls: calls, providerState: stateOf(content) });
const result = (call: ToolCall, content = 'ok'): InferenceMessage => ({ role: 'tool', content, toolCallId: call.id, toolName: call.name });

test('the E-10 fixtures are the captured lines, copied verbatim', () => {
  // Guard: a fixture that drifts from its capture or its cited lines (mutation: change one character of E10_THINKING).
  for (const [fixture, first, last] of [[E10_BASIC, 198, 220], [E10_TOOL_USE, 269, 348], [E10_THINKING, 388, 425], [E10_ERROR, 85, 86]] as const) {
    expect(captureLines(first, last)).toBe(fixture);
  }
});

describe('captured and built streams, folded and mapped', () => {
  test('E-10 basic stream (with `ping`): complete "Hello!" with usage 25 in, 15 out', async () => {
    // Guard: usage takes each field's latest value (mutation: add output_tokens across events, 1 + 15).
    expect(await map(E10_BASIC, [])).toEqual({ content: 'Hello!', outcome: 'complete', usage: { inputTokens: 25, outputTokens: 15 } });
  });

  test('E-10 tool-use stream (empty first `partial_json`): one call and the exact state', async () => {
    // Guard: the state's input is the parsed partial JSON (mutation: keep the start object's `input`, `{}`).
    const completion = await map(E10_TOOL_USE, [tool('get_weather')]);
    expect(completion).toEqual({
      content: "Okay, let's check the weather for San Francisco, CA:", outcome: 'tool_calls',
      toolCalls: [{ id: 'toolu_01T1x1fJ34qAmk2tNTrN7Up6', name: 'get_weather', input: { location: 'San Francisco, CA' } }],
      usage: { inputTokens: 472, outputTokens: 89 },
      providerState: { format: 'anthropic-messages@1', appendOnly: false, data: '{"content":[{"type":"text","text":"Okay, let\'s check the weather for San Francisco, CA:"},{"type":"tool_use","id":"toolu_01T1x1fJ34qAmk2tNTrN7Up6","name":"get_weather","input":{"location":"San Francisco, CA"}}]}' },
    });
  });

  test('E-10 thinking stream: complete, no state, usage unset (never 0)', async () => {
    // Guard: usage only when both counts were seen (mutation: a count never seen counts 0).
    const completion = await map(E10_THINKING, []);
    expect(completion).toEqual({ content: 'The greatest common divisor of 1071 and 462 is **21**.', outcome: 'complete' });
    expect(Object.keys(completion)).not.toContain('usage');
  });

  test('a built thinking + text + tool_use stream keeps every block in index order, the empty thinking and the signature', async () => {
    // Guard: an empty thinking block is kept (mutation: drop thinking blocks whose `thinking` is empty).
    const completion = await map(builtStream([signedThinking(''), textOf('Listing', '.'), toolUseBlock()]));
    expect(completion.outcome).toBe('tool_calls');
    expect(completion.content).toBe('Listing.');
    expect(completion.toolCalls).toEqual([LIST_FILES_CALL]);
    expect(completion.providerState).toEqual({ format: 'anthropic-messages@1', appendOnly: true, data: `{"content":[{"type":"thinking","thinking":"","signature":"${REFUSAL_SIGNATURE}"},{"type":"text","text":"Listing."},{"type":"tool_use","id":"toolu_01","name":"list_files","input":{"path":"."}}]}` });
  });

  test('a thinking start with no `signature` field takes its `signature_delta`, in a tool turn and in a final answer (F-9)', async () => {
    // Built from E-10 shapes, not a capture: E-10 l.392 and every live start carry `"signature":""`; this start leaves the
    // field out, which F-9 and spec 5.4 allow ("the start's `signature` to be absent or a string"). The delta sets the
    // field, which then follows `thinking` in the state, and step 2 encodes that state.
    // Guards: an absent start signature is accepted (mutation: require the start's `signature` to be a string before its
    // signature_delta; both turns then fail in the reader with PROVIDER_INVALID_RESPONSE); an absent start is never written
    // into the signature as text (mutation: `${block.fields.signature}${delta.signature}`, which gives "undefined" + the
    // signature here). It does not hold the replace rule in general: an append that reads absent as "" gives the same
    // state as a replace on this start; the next test, whose start signature is non-empty, holds that rule.
    const unsigned: BuiltBlock = { start: { type: 'thinking', thinking: '' }, deltas: [{ type: 'thinking_delta', thinking: 'Hm.' }, { type: 'signature_delta', signature: REFUSAL_SIGNATURE }] };
    const completion = await map(builtStream([unsigned, toolUseBlock()]));
    expect(completion).toEqual({
      content: '', outcome: 'tool_calls', toolCalls: [LIST_FILES_CALL], usage: { inputTokens: 10, outputTokens: 5 },
      providerState: { format: 'anthropic-messages@1', appendOnly: true, data: `{"content":[{"type":"thinking","thinking":"Hm.","signature":"${REFUSAL_SIGNATURE}"},{"type":"tool_use","id":"toolu_01","name":"list_files","input":{"path":"."}}]}` },
    });
    const step: InferenceMessage = { role: 'assistant', content: completion.content, toolCalls: completion.toolCalls, providerState: completion.providerState };
    expect(JSON.parse(encode([{ role: 'user', content: 'Go' }, step, result(LIST_FILES_CALL)], [REFUSAL_TOOL])).messages[1]).toEqual({ role: 'assistant', content: JSON.parse(completion.providerState!.data).content });
    expect(await map(builtStream([unsigned, textOf('Done.')], 'end_turn'))).toEqual({ content: 'Done.', outcome: 'complete', usage: { inputTokens: 10, outputTokens: 5 } });
  });

  test('a thinking start with a non-empty `signature` has it replaced by its `signature_delta`, never appended to (spec 5.4)', async () => {
    // Built from E-10 shapes, not a capture: E-10 l.392 and every live start carry `"signature":""`; this start carries a
    // non-empty string, which spec 5.4 allows ("the start's `signature` to be absent or a string") and for which it says
    // the delta "replaces the value, never appends". Every other start in this file is "" or absent, where an append that
    // reads absent as "" and a replace give the same state.
    // Guard: the delta replaces the start's value (mutation: `(block.fields.signature ?? '') + delta.signature`; the state
    // then holds "start-sig" followed by the delta's signature, which the state schema accepts, so only this test sees it).
    const presigned: BuiltBlock = { start: { type: 'thinking', thinking: '', signature: 'start-sig' }, deltas: [{ type: 'thinking_delta', thinking: 'Hm.' }, { type: 'signature_delta', signature: REFUSAL_SIGNATURE }] };
    expect(await map(builtStream([presigned, toolUseBlock()]))).toEqual({
      content: '', outcome: 'tool_calls', toolCalls: [LIST_FILES_CALL], usage: { inputTokens: 10, outputTokens: 5 },
      providerState: { format: 'anthropic-messages@1', appendOnly: true, data: `{"content":[{"type":"thinking","thinking":"Hm.","signature":"${REFUSAL_SIGNATURE}"},{"type":"tool_use","id":"toolu_01","name":"list_files","input":{"path":"."}}]}` },
    });
  });

  test('a built interleaved turn with two calls (thinking, text, tool_use, text, tool_use): both calls, the exact state, and step 2 encodes it', async () => {
    // Built from E-10 shapes, not a capture: each call's partial JSON is different and split differently across deltas.
    // Guards: every tool_use block is a call (mutation: keep only the first call, `.slice(0, 1)`; step 2's encoder would
    // then refuse the state on the call count); the text blocks join with no separator (mutation: join them with "\n";
    // the encoder would then refuse the text); each block's partial JSON starts empty (mutation: a block starts with the
    // previous block's partial JSON; the second call's input then fails to parse).
    const second: ToolCall = { id: 'toolu_02', name: 'list_files', input: { path: 'src' } };
    const firstUse: BuiltBlock = { start: { type: 'tool_use', id: 'toolu_01', name: 'list_files', input: {} }, deltas: [{ type: 'input_json_delta', partial_json: '' }, { type: 'input_json_delta', partial_json: '{"pa' }, { type: 'input_json_delta', partial_json: 'th":"."}' }] };
    const secondUse: BuiltBlock = { start: { type: 'tool_use', id: 'toolu_02', name: 'list_files', input: {} }, deltas: [{ type: 'input_json_delta', partial_json: '{"path"' }, { type: 'input_json_delta', partial_json: ':"src"}' }] };
    const completion = await map(builtStream([signedThinking('Two folders.'), textOf('Listing', ' the root.'), firstUse, textOf(' Then', ' src.'), secondUse]));
    expect(completion).toEqual({
      content: 'Listing the root. Then src.', outcome: 'tool_calls', toolCalls: [LIST_FILES_CALL, second], usage: { inputTokens: 10, outputTokens: 5 },
      providerState: { format: 'anthropic-messages@1', appendOnly: true, data: `{"content":[{"type":"thinking","thinking":"Two folders.","signature":"${REFUSAL_SIGNATURE}"},{"type":"text","text":"Listing the root."},{"type":"tool_use","id":"toolu_01","name":"list_files","input":{"path":"."}},{"type":"text","text":" Then src."},{"type":"tool_use","id":"toolu_02","name":"list_files","input":{"path":"src"}}]}` },
    });
    // Step 2: the completion as the engine carries it, both results after it. The encoder accepts the state the outcome
    // built. Guard: each tool_use block is compared with its own call (mutation: compare each with the first call).
    const step: InferenceMessage = { role: 'assistant', content: completion.content, toolCalls: completion.toolCalls, providerState: completion.providerState };
    const messages = JSON.parse(encode([{ role: 'system', content: 'S' }, { role: 'user', content: 'Go' }, step, result(LIST_FILES_CALL, 'a.txt'), result(second, 'b.txt')], [REFUSAL_TOOL])).messages as unknown[];
    expect(messages).toEqual([
      { role: 'user', content: 'Go' },
      { role: 'assistant', content: JSON.parse(completion.providerState!.data).content },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_01', content: 'a.txt' }, { type: 'tool_result', tool_use_id: 'toolu_02', content: 'b.txt' }] },
    ]);
  });

  test('a tool_use stream without thinking gives appendOnly false', async () => {
    // Guard: appendOnly follows the blocks (mutation: appendOnly always true).
    const completion = await map(builtStream([textOf('Listing.'), toolUseBlock()]));
    expect(completion.providerState).toMatchObject({ appendOnly: false });
  });

  test('a zero-delta block and a whole `redacted_thinking` are kept, and redacted thinking sets appendOnly', async () => {
    // Guard: a block with no deltas is accepted as started (mutation: refuse a stop on a block that had no delta).
    const completion = await map(builtStream([{ start: { type: 'redacted_thinking', data: 'RW5jcnlwdGVkUmVhc29uaW5n' } }, { start: { type: 'text', text: 'Listing.' } }, toolUseBlock()]));
    expect(completion.providerState).toEqual({ format: 'anthropic-messages@1', appendOnly: true, data: '{"content":[{"type":"redacted_thinking","data":"RW5jcnlwdGVkUmVhc29uaW5n"},{"type":"text","text":"Listing."},{"type":"tool_use","id":"toolu_01","name":"list_files","input":{"path":"."}}]}' });
    expect(completion.content).toBe('Listing.');
  });

  test('a tool_use block with no input delta takes its start object\'s `input`', async () => {
    // E-10 l.321: the start carries `"input":{}`; a tool with no arguments may send no partial JSON (D14 records it).
    // Guard: an empty join takes the start's input (mutation: parse the empty join, which fails).
    const completion = await map(builtStream([{ start: { type: 'tool_use', id: 'toolu_01', name: 'list_files', input: {} } }]));
    expect(completion.toolCalls).toEqual([{ id: 'toolu_01', name: 'list_files', input: {} }]);
  });
});

describe('live streams (the Anthropic probes of 2026-10-12), folded and mapped', () => {
  type LiveEvent = { readonly name: string; readonly data: Record<string, unknown> };
  /** A live stream's events, parsed apart from the adapter: every event is one `event:` line and one `data:` line. */
  const eventsOf = (name: LiveFile): LiveEvent[] => live(name).split('\n\n').filter(Boolean).map(block => {
    const lines = block.split('\n');
    expect(lines).toHaveLength(2);
    return { name: lines[0]!.replace(/^event: /, ''), data: JSON.parse(lines[1]!.replace(/^data: /, '')) as Record<string, unknown> };
  });
  /** A block's start object and its deltas, from the parsed events. */
  const blockOf = (events: readonly LiveEvent[], index: number) => ({
    start: events.find(item => item.name === 'content_block_start' && item.data.index === index)!.data.content_block,
    deltas: events.filter(item => item.name === 'content_block_delta' && item.data.index === index).map(item => item.data.delta),
  });
  /** The stream's one signature_delta value, read from the text with a pattern, not by the adapter. */
  const signatureOf = (name: LiveFile) => {
    const found = [...live(name).matchAll(/"type":"signature_delta","signature":"([^"]*)"/g)].map(match => match[1]!);
    expect(found).toHaveLength(1);
    return found[0]!;
  };
  // Served as the live answers were labelled (D3), in 7-byte pieces, so a two-byte "×" or "°" is split across reads.
  const readLive = (name: LiveFile) => readAnthropic(respond(live(name), { contentType: 'text/event-stream; charset=utf-8' }));
  const mapLive = async (name: LiveFile, usedIds: Iterable<string> = []) => anthropicOutcome(await readLive(name), check(LIVE_TOOLS, usedIds));
  /** Step 2 as the engine sends it: the system prompt, the prompt, step 1's completion as the assistant step, a result per call. */
  const stepTwo = (model: string, outputTokens: number, prompt: string, step: Completion, results: readonly string[]) => encodeAnthropic(
    { kind: 'anthropic', endpoint: 'https://api.anthropic.com/v1', model, outputTokens },
    checked([
      { role: 'system', content: LIVE_SYSTEM }, { role: 'user', content: prompt },
      { role: 'assistant', content: step.content, toolCalls: step.toolCalls, providerState: step.providerState },
      ...step.toolCalls!.map((call, index) => result(call, results[index])),
    ]),
    LIVE_TOOLS,
  );
  /** The state's content array exactly as its bytes stand in `data`. */
  const contentBytes = (completion: Completion) => completion.providerState!.data.slice('{"content":'.length, -1);

  test('the live fixtures are the recorded files, byte for byte, and each recorded request body is the one sent', () => {
    // Guard: a fixture that drifts from its evidence file (mutation: remove one space of padding from a line of
    // D1-bearer.response.raw).
    for (const [name, hash] of Object.entries(LIVE_SHA256)) expect(sha256(live(name as LiveFile)), name).toBe(hash);
    // Each record's `body` is the body sent: its JSON text has the recorded length and sha256.
    for (const name of ['D5-think-sonnet-step2.request.json', 'D11-haiku-step2.request.json'] as const) {
      const request = recorded(name); const sent = JSON.stringify(request.body);
      expect(Buffer.byteLength(sent), name).toBe(request.bodyUtf8Bytes);
      expect(sha256(sent), name).toBe(request.bodySha256);
    }
  });

  test('the live streams hold the recorded facts the tests below rely on (D3, D4, D5, D13, D14)', () => {
    // Read apart from the adapter, so each fact the next tests depend on is shown to be in the fixture they read.
    let toolUses = 0;
    for (const name of LIVE_STREAMS) {
      const events = eventsOf(name);
      for (const item of events) expect(item.data.type, name).toBe(item.name);
      // (a) D3: exactly one ping, the third event, right after the first content_block_start, so inside an open block.
      expect(events.filter(item => item.name === 'ping'), name).toHaveLength(1);
      expect(events.slice(0, 3).map(item => item.name), name).toEqual(['message_start', 'content_block_start', 'ping']);
      // (c) D3's padding: a run of spaces inside the JSON, before its last brace, on most data lines; no line ends in one.
      const data = live(name).split('\n').filter(line => line.startsWith('data: '));
      expect(data.filter(line => / +\}$/.test(line)).length, name).toBeGreaterThan(data.length / 2);
      expect(data.filter(line => /\s$/.test(line)), name).toEqual([]);
      // (d) D3: fields no E-10 capture shows, on message_start's message and usage and on message_delta.
      expect(events[0]!.data, name).toMatchObject({ message: { container: null, stop_details: null, diagnostics: null, usage: { cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 }, service_tier: 'standard', inference_geo: expect.any(String) } } });
      expect(events.find(item => item.name === 'message_delta')!.data, name).toMatchObject({ delta: { stop_details: null, container: null } });
      // (e) D5 (a): every tool_use start carries "caller":{"type":"direct"}.
      for (const item of events.filter(event => event.name === 'content_block_start' && (event.data.content_block as { type: string }).type === 'tool_use')) {
        expect(item.data.content_block, name).toMatchObject({ input: {}, caller: { type: 'direct' } });
        toolUses++;
      }
    }
    expect(toolUses).toBe(5);
    // (g) D4: output_tokens 3 at message_start, then 5 at message_delta, which also carries output_tokens_details.
    const d1 = eventsOf('D1-bearer.response.raw');
    expect(d1[0]!.data).toMatchObject({ message: { usage: { input_tokens: 15, output_tokens: 3 } } });
    expect(d1.find(item => item.name === 'message_delta')!.data.usage).toEqual({ input_tokens: 15, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 5, output_tokens_details: { thinking_tokens: 0 } });
    // (b) D5 (c), D13: a thinking block starts with an empty-string signature, then one empty thinking_delta and one
    // signature_delta.
    for (const name of ['D5-think-sonnet-step1.response.raw', 'D5-think-sonnet-step2.response.raw', 'D12-opus-32000.response.raw'] as const) {
      expect(blockOf(eventsOf(name), 0), name).toEqual({ start: { type: 'thinking', thinking: '', signature: '' }, deltas: [{ type: 'thinking_delta', thinking: '' }, { type: 'signature_delta', signature: signatureOf(name) }] });
    }
    // (f) D14: the argument-free get_time streams one input_json_delta whose partial_json is "".
    for (const [name, index] of [['D5-think-sonnet-step1.response.raw', 3], ['D11-haiku-step1.response.raw', 1]] as const) {
      expect(blockOf(eventsOf(name), index).deltas, name).toEqual([{ type: 'input_json_delta', partial_json: '' }]);
    }
  });

  // Guards shared by every test below, each a mutation that turns all five red: a ping inside an open block is ignored
  // (mutation: refuse a ping while a block is open); the padding is read (mutation, in provider-stream.ts: refuse a
  // data payload with white space before its last brace); fields no capture shows are passed over (mutations: refuse a
  // usage object holding a value that is not a number, such as `cache_creation` or `service_tier`; refuse a
  // message_delta whose delta holds a key besides stop_reason and stop_sequence); each count takes its latest value
  // (mutations: add the counts across events; keep the first count).
  test('D1-bearer: the exact fold, and complete "OK." with usage 15 in, 5 out', async () => {
    const fold = await readLive('D1-bearer.response.raw');
    expect(fold).toEqual({ started: true, stopped: true, stopReason: 'end_turn', usage: { input_tokens: 15, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, output_tokens: 5 }, blocks: [{ fields: { type: 'text', text: 'OK.' }, partialJson: '', replayable: true, closed: true }] });
    expect(anthropicOutcome(fold, check(LIVE_TOOLS))).toEqual({ content: 'OK.', outcome: 'complete', usage: { inputTokens: 15, outputTokens: 5 } });
  });

  test('D5-think-sonnet step 1: two calls, the exact state, and step 2 encodes the request the API accepted, byte for byte', async () => {
    // Guards: the empty start signature is replaced by the delta's (mutation: keep a start signature that is a string;
    // the outcome then refuses the empty signature); extra fields are kept (mutation: rebuild each tool_use block from
    // type, id, name and input, which drops `caller`); an empty join takes the start's input (mutation: parse every
    // join); appendOnly follows the thinking block (mutation: appendOnly false); the encoder sends the state's blocks
    // unchanged (mutation: rebuild each replayed tool_use block from its documented fields).
    const weather = { id: 'toolu_01YXMxbAF33AFs67CC9oMczx', name: 'get_weather', input: { city: 'Rome' } };
    const time = { id: 'toolu_01AzrUvtgma5L6ypA3e7w3Gq', name: 'get_time', input: {} };
    const accepted = recorded('D5-think-sonnet-step2.request.json');
    const completion = await mapLive('D5-think-sonnet-step1.response.raw');
    expect(completion).toEqual({
      content: "Step by step:\n- 17 × 23 = 391\n- 19 × 21 = 399\n\n19 × 21 is larger, so I'll check the weather for Rome. I'll also get the time.",
      outcome: 'tool_calls', toolCalls: [weather, time], usage: { inputTokens: 528, outputTokens: 183 },
      // The state is the content the probe replayed at step 2 and the API accepted.
      providerState: { format: 'anthropic-messages@1', appendOnly: true, data: JSON.stringify({ content: accepted.body.messages[1]!.content }) },
    });
    // Block by block: index order, the empty thinking kept with the delta's signature (928 characters, D16), the
    // re-serialized inputs (the stream sent `{"city": "Rome"}`, D5 (e)), and `caller` kept after `input`.
    expect(signatureOf('D5-think-sonnet-step1.response.raw')).toHaveLength(928);
    expect(completion.providerState!.data).toBe(JSON.stringify({ content: [
      { type: 'thinking', thinking: '', signature: signatureOf('D5-think-sonnet-step1.response.raw') },
      { type: 'text', text: completion.content },
      { type: 'tool_use', ...weather, caller: { type: 'direct' } },
      { type: 'tool_use', ...time, caller: { type: 'direct' } },
    ] }));
    // Step 2 from that state: the content array byte-identical to the one sent live, and the whole body too.
    const body = stepTwo('claude-sonnet-5-5', 4096, THINK_PROMPT, completion, LIVE_RESULTS);
    expect(body).toContain(`{"role":"assistant","content":${JSON.stringify(accepted.body.messages[1]!.content)}}`);
    expect(body).toBe(JSON.stringify(accepted.body));
    expect(sha256(body)).toBe(accepted.bodySha256);
  });

  test('D5-think-sonnet step 2: the final answer is its text, with no state', async () => {
    // Guards: the shared ones; a signature_delta onto a start's "" is accepted (mutation: refuse a signature_delta when
    // the start carries a `signature` field).
    expect(await mapLive('D5-think-sonnet-step2.response.raw', ['toolu_01YXMxbAF33AFs67CC9oMczx', 'toolu_01AzrUvtgma5L6ypA3e7w3Gq'])).toEqual({
      content: "19 × 21 (399) is larger than 17 × 23 (391), so I requested Rome's weather, but the tool returned data labeled Paris (18 °C, cloudy), so I can't confirm Rome's conditions, and the current time is 14:05 UTC.",
      outcome: 'complete', usage: { inputTokens: 789, outputTokens: 130 },
    });
  });

  test('D11-haiku step 1 (no thinking): two calls, the argument-free one with `{}`, appendOnly false, and the accepted step 2, byte for byte', async () => {
    // Guards: an empty join takes the start's input (mutation: parse every join); extra fields are kept (mutation: drop
    // `caller`); appendOnly follows the blocks (mutation: appendOnly true); the encoder sends the state unchanged.
    const weather = { id: 'toolu_014WQE8mTrRHdU7FrKAbKeiK', name: 'get_weather', input: { city: 'Paris' } };
    const time = { id: 'toolu_01F8CKhMUBvKKrZ3xjCJw9JE', name: 'get_time', input: {} };
    const accepted = recorded('D11-haiku-step2.request.json');
    const completion = await mapLive('D11-haiku-step1.response.raw');
    expect(completion).toEqual({
      content: '', outcome: 'tool_calls', toolCalls: [weather, time], usage: { inputTokens: 646, outputTokens: 73 },
      providerState: { format: 'anthropic-messages@1', appendOnly: false, data: JSON.stringify({ content: [{ type: 'tool_use', ...weather, caller: { type: 'direct' } }, { type: 'tool_use', ...time, caller: { type: 'direct' } }] }) },
    });
    expect(completion.providerState!.data).toBe(JSON.stringify({ content: accepted.body.messages[1]!.content }));
    const body = stepTwo('claude-haiku-4-5-20251001', 4096, PLAIN_PROMPT, completion, LIVE_RESULTS);
    expect(body).toContain(`{"role":"assistant","content":${JSON.stringify(accepted.body.messages[1]!.content)}}`);
    expect(body).toBe(JSON.stringify(accepted.body));
    expect(sha256(body)).toBe(accepted.bodySha256);
  });

  test('D12-opus-32000: a thinking-heavy tool step gives one call and the exact state, and step 2 sends that state unchanged', async () => {
    // No live step 2 was sent for D12, so step 2 is checked against the state's own bytes, and its tool result is built.
    // Guards: as D5-think-sonnet step 1 (the signature replaced, `caller` kept, appendOnly true, the state sent unchanged).
    const weather = { id: 'toolu_01DcpP1k9MrVkwHkLP8KAbTi', name: 'get_weather', input: { city: 'Minsk' } };
    const signature = signatureOf('D12-opus-32000.response.raw');
    expect(signature).toHaveLength(2216);
    const completion = await mapLive('D12-opus-32000.response.raw');
    expect(completion).toEqual({
      content: '', outcome: 'tool_calls', toolCalls: [weather], usage: { inputTokens: 544, outputTokens: 588 },
      providerState: { format: 'anthropic-messages@1', appendOnly: true, data: JSON.stringify({ content: [{ type: 'thinking', thinking: '', signature }, { type: 'tool_use', ...weather, caller: { type: 'direct' } }] }) },
    });
    const body = stepTwo('claude-opus-5-5', 32_000, RAINY_PROMPT, completion, ['Minsk: 4 C, rain.']);
    expect(body).toContain(`{"role":"assistant","content":${contentBytes(completion)}}`);
  });
});

describe('the reader refuses', () => {
  const MARKER = 'U3RyZWFtRXJyb3JNYXJrZXJxN1p4OQ';

  test('an `error` event as PROVIDER_STREAM_ERROR, keeping none of its text', async () => {
    // Guard: the event's text stays out of the error (mutation: `new Error('PROVIDER_STREAM_ERROR', { cause: data })`).
    expect(await message(read(E10_ERROR))).toBe('PROVIDER_STREAM_ERROR');
    const error = await failure(read(sseText([messageStart(), blockStart(0, { type: 'text', text: '' }), { type: 'error', error: { type: 'overloaded_error', message: MARKER } }])));
    expect(error.message).toBe('PROVIDER_STREAM_ERROR');
    expect(error.cause).toBeUndefined();
    expect(String(error)).not.toContain(MARKER);
    expect(inspect(error, { depth: 10, showHidden: true })).not.toContain(MARKER);
  });

  test('a second `signature_delta` on one block', async () => {
    // Guard: the signature is set once (mutation: let a later signature_delta replace it).
    const twice: BuiltBlock = { start: { type: 'thinking', thinking: '', signature: '' }, deltas: [{ type: 'signature_delta', signature: REFUSAL_SIGNATURE }, { type: 'signature_delta', signature: 'T3RoZXJTaWduYXR1cmU' }] };
    expect(await message(read(builtStream([twice, toolUseBlock()])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test.each([
    ['input_json_delta on a text block', { start: { type: 'text', text: '' }, deltas: [{ type: 'input_json_delta', partial_json: '{}' }] }],
    ['signature_delta on a text block', { start: { type: 'text', text: '' }, deltas: [{ type: 'signature_delta', signature: REFUSAL_SIGNATURE }] }],
    ['text_delta on a thinking block that carries a `text` field', { start: { type: 'thinking', thinking: '', signature: REFUSAL_SIGNATURE, text: '' }, deltas: [{ type: 'text_delta', text: 'Hi' }] }],
    ['thinking_delta on a text block that carries a `thinking` field', { start: { type: 'text', text: '', thinking: '' }, deltas: [{ type: 'thinking_delta', thinking: 'Hi' }] }],
    ['text_delta on a tool_use block', { start: { type: 'tool_use', id: 'toolu_01', name: 'list_files', input: {}, text: '' }, deltas: [{ type: 'text_delta', text: 'Hi' }] }],
  ] as const)('a known delta on the wrong block type: %s', async (_name, block) => {
    // Each start carries the field its delta would extend, so only the block-type rule refuses it.
    // Guard: a known delta applies only to its own block type (mutation: skip the block-type check).
    expect(await message(read(builtStream([block as BuiltBlock, textOf('Done.')], 'end_turn')))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('an index out of order', async () => {
    // Guard: a start's index equals the number of blocks so far (mutation: skip the index check). In the first stream the
    // delta and stop repeat the wrong index, which the open-block rule refuses as well; in the second they name the
    // block's real position, so only the start's own index is wrong.
    expect(await message(read(sseText([messageStart(), ...blockEvents([textOf('Hi')], 1), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
    expect(await message(read(sseText([messageStart(), blockStart(1, { type: 'text', text: '' }), blockDelta(0, { type: 'text_delta', text: 'Hi' }), blockStop(0), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  const textStart = (index: number) => blockStart(index, { type: 'text', text: '' });
  const hi = (index: number, text = 'Hi') => blockDelta(index, { type: 'text_delta', text });
  test.each([
    // Each stream's starts and its other events name the right index, so only the one event's index is wrong.
    // Guard: a delta names the open block's index (mutation: accept a delta whenever a block is open).
    ['a delta naming a later index', [textStart(0), hi(1), blockStop(0)]],
    ['a delta naming an earlier, closed block', [textStart(0), hi(0), blockStop(0), textStart(1), hi(0, '!'), blockStop(1)]],
    // Guard: a stop names the open block's index (mutation: close the open block whatever the index).
    ['a stop naming a later index', [textStart(0), hi(0), blockStop(1)]],
    ['a stop naming an earlier, closed block', [textStart(0), hi(0), blockStop(0), textStart(1), blockStop(0)]],
  ])('an index that is not the open block\'s: %s', async (_name, events) => {
    expect(await message(read(sseText([messageStart(), ...events, ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a start while a block is open', async () => {
    // Guard: one block open at a time (mutation: skip the open-block check at a start).
    expect(await message(read(sseText([messageStart(), blockStart(0, { type: 'text', text: '' }), blockStart(1, { type: 'text', text: '' }), blockStop(1), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a block still open at `message_stop`', async () => {
    // Guard: message_stop needs every block closed (mutation: skip that check).
    expect(await message(read(sseText([messageStart(), blockStart(0, { type: 'text', text: 'Hi' }), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('an `event:` name that differs from `data.type`', async () => {
    // Guard: the name, when present, must equal the type (mutation: ignore the name).
    const renamed = E10_BASIC.replace('event: ping', 'event: message_stop');
    expect(await message(read(renamed))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a second `message_start`', async () => {
    // Guard: message_start comes once (mutation: skip that check).
    expect(await message(read(sseText([messageStart(), messageStart(), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a `content_block_start` before `message_start`', async () => {
    // Guard: blocks come after message_start (mutation: accept a block start before it).
    expect(await message(read(sseText([...blockEvents([textOf('Hi')]), messageStart(), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test.each(['message_delta', 'message_stop'])('a known `%s` before `message_start`', async type => {
    // (A stray content_block_delta or content_block_stop is refused by the open-block rule as well, so it is not a case here.)
    // Guard: only ping, error and unknown types precede message_start (mutation: skip that check for every type).
    const early = type === 'message_delta' ? messageEnd('end_turn')[0]! : { type };
    expect(await message(read(sseText([early, messageStart(), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn')])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a changed `stop_reason`, while the same one repeated is accepted', async () => {
    // Guard: a non-null stop_reason never changes (mutation: let the latest one win).
    const repeated = sseText([messageStart(), ...blockEvents([textOf('Hi')]), messageEnd('end_turn')[0]!, ...messageEnd('end_turn')]);
    expect((await map(repeated)).outcome).toBe('complete');
    const changed = sseText([messageStart(), ...blockEvents([textOf('Hi')]), messageEnd('end_turn')[0]!, ...messageEnd('max_tokens')]);
    expect(await message(read(changed))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  // Malformed known events fail closed rather than being skipped as unknown: no capture shows any of these shapes.
  test.each([
    // Guard: an event's data is an object with a string `type` (mutation: skip such an event as unknown).
    ['event data without a `type`', sseText([messageStart(), ...blockEvents([textOf('Hi')])]) + 'data: {"index": 0}\n\n' + sseText(messageEnd('end_turn'))],
    // Guard: a delta on a known block is an object with a string `type` (mutation: treat it as an unknown delta).
    ['a delta without a `type` on a known block', builtStream([{ start: { type: 'text', text: '' }, deltas: [{ text: 'Hi' }] }], 'end_turn')],
    // Guard: a start's content_block is an object with a string `type` (mutation: treat it as an unknown block).
    ['a content_block that is not an object', sseText([messageStart(), blockStart(0, 5 as unknown as Record<string, unknown>), blockStop(0), ...blockEvents([textOf('Hi')], 1), ...messageEnd('end_turn')])],
    // Guard: a stop_reason, when present, is a string (mutation: ignore one that is not).
    ['a `stop_reason` that is not a string', sseText([messageStart(), ...blockEvents([textOf('Hi')]), { type: 'message_delta', delta: { stop_reason: 5 } }, ...messageEnd('end_turn')])],
  ])('a malformed known event: %s', async (_name, text) => {
    expect(await message(read(text))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('no `message_start` (the outcome refuses the fold)', async () => {
    // Guard: a fold that never started is refused (mutation: map it as incomplete).
    expect(await message(map(sseText([{ type: 'ping' }, { type: 'vendor_event' }])))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a 200 whose body is a plain JSON message with no `data:` line: no message_start', async () => {
    // Built from E-09's response shape, not a capture. Guard: as the previous test (no message_start is refused).
    const plain = JSON.stringify({ id: 'msg_built', type: 'message', role: 'assistant', content: [{ type: 'text', text: 'Hi' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } });
    expect(await message(map(plain, [], []))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a 200 whose `data:` payload is not JSON (readSseEvents)', async () => {
    // No `event:` line, so the name rule cannot refuse it first. Guard: readSseEvents' JSON rule (mutation, in
    // provider-stream.ts: an unparseable payload yields an event of an unknown type, which the reader ignores).
    expect(await message(read('data: {"type": "message_start",\n\n'))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('more than 128 `tool_use` blocks (128 are read)', async () => {
    // Guard: at most 128 tool_use blocks (mutation: skip the count).
    const calls = (count: number) => builtStream(Array.from({ length: count }, (_, index) => toolUseBlock({ type: 'tool_use', id: `toolu_${index}`, name: 'list_files', input: {} })));
    expect((await read(calls(128), { size: 65536 })).blocks).toHaveLength(128);
    expect(await message(read(calls(129), { size: 65536 }))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a 513th block (the 512th is read)', async () => {
    // Guard: at most 512 blocks (mutation: skip the count).
    const blocks = (count: number) => builtStream(Array.from({ length: count }, () => ({ start: { type: 'text', text: '' } })), 'end_turn');
    expect((await read(blocks(512), { size: 65536 })).blocks).toHaveLength(512);
    expect(await message(read(blocks(513), { size: 65536 }))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('more than 131,072 characters of partial JSON in one call (131,072 are read)', async () => {
    // Guard: the per-call bound (mutation: skip it).
    const input = (length: number) => `{"path":"${'a'.repeat(length - 11)}"}`;
    expect((await read(builtStream([toolUseBlock(undefined, input(131_072))]), { size: 65536 })).blocks[0]!.partialJson).toHaveLength(131_072);
    expect(await message(read(builtStream([toolUseBlock(undefined, input(131_073))]), { size: 65536 }))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('the joined text over 2,000,000 characters, counted across text blocks', async () => {
    // Guard: the bound is on the joined text (mutation: bound each block separately, which lets the third block through).
    const million = 'a'.repeat(1_000_000);
    const two = [textOf(million), textOf(million)];
    expect(anthropicOutcome(await read(builtStream(two, 'end_turn'), { size: 65536 }), check([])).content).toHaveLength(2_000_000);
    expect(await message(read(builtStream([...two, textOf('b')], 'end_turn'), { size: 65536 }))).toBe('PROVIDER_RESPONSE_TOO_LARGE');
    // A start's own text counts too.
    expect(await message(read(builtStream([...two, { start: { type: 'text', text: 'b' } }], 'end_turn'), { size: 65536 }))).toBe('PROVIDER_RESPONSE_TOO_LARGE');
  });
});

describe('refused only in a tool turn', () => {
  const unknownBlock: BuiltBlock = { start: { type: 'fallback' } };
  const unknownDelta: BuiltBlock = { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 'Listing' }, { type: 'citations_delta', citation: {} }, { type: 'text_delta', text: '.' }] };
  // E-10 l.478-499's server_tool_use shape: a block of an unknown type that receives known deltas (built, not a capture).
  const unknownBlockWithDeltas: BuiltBlock = { start: { type: 'server_tool_use', id: 'srvtoolu_01', name: 'web_search', input: {} }, deltas: [{ type: 'input_json_delta', partial_json: '' }, { type: 'input_json_delta', partial_json: '{"query":"weather"}' }] };
  test.each([
    // Guard: a tool turn holds only replayable blocks (mutation, with the state schema check skipped too, since it also refuses the type).
    ['an unknown block', [unknownBlock, textOf('Listing.'), toolUseBlock()], [REFUSAL_TOOL], []],
    // Guards: as the row above for the tool_use stop; and any delta on an unknown block is ignored (mutation: apply deltas
    // to unknown blocks; the max_tokens turn then fails in the reader instead of being incomplete).
    ['an unknown block that receives a known delta', [unknownBlockWithDeltas, textOf('Listing.'), toolUseBlock()], [REFUSAL_TOOL], []],
    // Guard: a block an unknown delta touched is not replayable (mutation: an unknown delta leaves the block replayable).
    ['an unknown delta', [unknownDelta, toolUseBlock()], [REFUSAL_TOOL], []],
    // Guard: the input must parse (mutation: an unparseable join falls back to the start's input).
    ['an unparseable input', [toolUseBlock(undefined, '{"path":')], [REFUSAL_TOOL], []],
    // Guard: the input must be a bounded object (mutation: skip the call schema and the state schema check).
    ['a non-object input', [toolUseBlock(undefined, '"."')], [REFUSAL_TOOL], []],
    // Guard: every thinking block has a non-empty signature (mutation, with the state schema check skipped too).
    ['an empty signature', [{ start: { type: 'thinking', thinking: '', signature: '' }, deltas: [{ type: 'thinking_delta', thinking: 'Hm.' }] }, toolUseBlock()], [REFUSAL_TOOL], []],
    // Guard: calls name offered tools (mutation: skip the offered-name check).
    ['an unoffered name', [toolUseBlock()], [tool('read_file')], []],
    // Guard: call ids are unused (mutation: skip the used-id check).
    ['a reused id', [toolUseBlock()], [REFUSAL_TOOL], ['toolu_01']],
  ] as const)('%s', async (_name, blocks, tools, usedIds) => {
    expect(await message(map(builtStream(blocks as readonly BuiltBlock[], 'tool_use'), tools, usedIds))).toBe('PROVIDER_INVALID_RESPONSE');
    // Not a failure when the turn stopped short: the inputs are never parsed and nothing runs.
    const short = await map(builtStream(blocks as readonly BuiltBlock[], 'max_tokens'), tools, usedIds);
    expect(short.outcome).toBe('incomplete');
    expect(short.toolCalls).toBeUndefined();
    expect(short.providerState).toBeUndefined();
  });
});

describe('reading', () => {
  test('ends at `message_stop`: later bytes are never parsed and the body is cancelled', async () => {
    // Guard: the reader stops at message_stop (mutation: keep reading, which then fails on the line that is not JSON).
    let cancelled = false;
    const tail = 'data: this is not JSON\n\n';
    const bytes = new TextEncoder().encode(builtStream([textOf('Hi')], 'end_turn') + tail);
    const body = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(bytes); }, cancel() { cancelled = true; } });
    const completion = anthropicOutcome(await readAnthropic(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } })), check());
    expect(completion).toEqual({ content: 'Hi', outcome: 'complete', usage: { inputTokens: 10, outputTokens: 5 } });
    expect(cancelled).toBe(true);
  });

  test.each([['application/json'], [null]])('has no content-type rule: a built stream served with %s is read as SSE', async contentType => {
    // Guard: the label is not read (mutation: refuse a Content-Type other than text/event-stream).
    expect((await anthropicOutcome(await read(builtStream([textOf('Hi')], 'end_turn'), { contentType }), check())).content).toBe('Hi');
  });

  test('ignores `ping` and unknown event types, before and after `message_start`', async () => {
    // Guard: unknown types are ignored (mutation: refuse an unknown event type).
    const text = sseText([{ type: 'ping' }, { type: 'vendor_event', detail: 1 }, messageStart(), { type: 'vendor_event' }, ...blockEvents([textOf('Hi')]), { type: 'ping' }, ...messageEnd('end_turn')]);
    expect((await map(text)).content).toBe('Hi');
  });

  test('accepts an event with no `event:` line, its `data.type` deciding', async () => {
    // Guard: only a differing name is refused (mutation: require the name to equal the type).
    const unnamed = E10_BASIC.split('\n').filter(line => !line.startsWith('event: ')).join('\n');
    expect((await map(unnamed, [])).content).toBe('Hello!');
  });
});

describe('types before accumulation: a delta onto a start field that is not a string, or carrying one, fails in the reader, in any turn', () => {
  test.each([
    ['a `text` start with `text: null`, then a text_delta "Hi"', { start: { type: 'text', text: null }, deltas: [{ type: 'text_delta', text: 'Hi' }] }],
    ['a `thinking` start with a numeric `thinking`, then a thinking_delta', { start: { type: 'thinking', thinking: 0, signature: '' }, deltas: [{ type: 'thinking_delta', thinking: 'Hm.' }, { type: 'signature_delta', signature: REFUSAL_SIGNATURE }] }],
    ['a `thinking` start with `signature: 0`, then a signature_delta', { start: { type: 'thinking', thinking: '', signature: 0 }, deltas: [{ type: 'signature_delta', signature: REFUSAL_SIGNATURE }] }],
    ['a text_delta whose own `text` is not a string', { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 5 }] }],
    // Guard: a signature_delta's own `signature` is a string (mutation: drop that check; the final answer then completes
    // and the signature 0 reaches the fold).
    ['a signature_delta whose own `signature` is not a string', { start: { type: 'thinking', thinking: '', signature: '' }, deltas: [{ type: 'signature_delta', signature: 0 }] }],
    // Guard: an input_json_delta's own `partial_json` is a string (mutation: drop that check; the pieces then join to
    // '{"path":5}', an input the provider never sent as text, and a tool turn returns that call).
    ['an input_json_delta whose own `partial_json` is not a string', { start: { type: 'tool_use', id: 'toolu_02', name: 'list_files', input: {} }, deltas: [{ type: 'input_json_delta', partial_json: '{"path":' }, { type: 'input_json_delta', partial_json: 5 }, { type: 'input_json_delta', partial_json: '}' }] }],
  ] as const)('%s', async (_name, block) => {
    // Guard for the first four: a delta applies only when its field and the start field it extends are strings (mutation:
    // append without the type checks; the tool turn then returns calls with a coerced state, the final answer a coerced
    // content). Each row runs on a tool_use stop and on an end_turn stop: the reader cannot know the stop yet.
    expect(await message(read(builtStream([block as BuiltBlock, toolUseBlock()], 'tool_use')))).toBe('PROVIDER_INVALID_RESPONSE');
    expect(await message(read(builtStream([block as BuiltBlock, textOf('Done.')], 'end_turn')))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a final answer whose `text` start holds a non-string `text` and no delta is refused, never coerced', async () => {
    // Guard: the content joins strings only (mutation: join with String(), which gives "null").
    expect(await message(map(builtStream([{ start: { type: 'text', text: null } }, textOf('Done.')], 'end_turn')))).toBe('PROVIDER_INVALID_RESPONSE');
  });
});

describe('tolerated in a final answer', () => {
  test('a block of an unknown type between two text blocks is dropped', async () => {
    // Guard: unknown blocks fail only a tool turn (mutation: refuse a block that is not replayable in every turn).
    expect(await map(builtStream([textOf('Hello'), { start: { type: 'fallback' } }, textOf(' again.')], 'end_turn'))).toEqual({ content: 'Hello again.', outcome: 'complete', usage: { inputTokens: 10, outputTokens: 5 } });
  });

  test('an unknown delta type on a text block is ignored and the block keeps its text', async () => {
    // Guard: a text block marked not replayable stays in the content (mutation: leave such blocks out of the content).
    const block: BuiltBlock = { start: { type: 'text', text: '' }, deltas: [{ type: 'text_delta', text: 'Hello' }, { type: 'citations_delta', citation: { type: 'char_location' } }, { type: 'text_delta', text: ' again.' }] };
    expect((await map(builtStream([block], 'end_turn'))).content).toBe('Hello again.');
  });

  test('the captured `server_tool_use` block and its `input_json_delta` events (E-10 l.456-502) are dropped', async () => {
    // A known delta on a block of an unknown type, as the wire shows it. E-10 l.456-502 are read from the capture itself,
    // so they cannot drift; the text block and the stop after them are built from E-10 shapes, not a capture.
    // Guard: any delta on an unknown block is ignored (mutation: apply deltas to unknown blocks; input_json_delta on a
    // block that is not tool_use is then PROVIDER_INVALID_RESPONSE).
    const text = `${captureLines(456, 502)}\n\n${sseText([...blockEvents([textOf(' Done.')], 2), ...messageEnd('end_turn')])}`;
    expect(await map(text, [])).toEqual({ content: "I'll check the current weather in New York City for you. Done.", outcome: 'complete', usage: { inputTokens: 2679, outputTokens: 5 } });
  });

  test('a block of an unknown type that receives a `text_delta` is dropped, that text with it', async () => {
    // Built from E-10 shapes, not a capture. Guard: as the previous test (mutation: apply deltas to unknown blocks; a
    // text_delta on a block that is not text is then PROVIDER_INVALID_RESPONSE).
    const unknown: BuiltBlock = { start: { type: 'fallback' }, deltas: [{ type: 'text_delta', text: ' dropped' }] };
    expect(await map(builtStream([textOf('Hello'), unknown, textOf(' again.')], 'end_turn'))).toEqual({ content: 'Hello again.', outcome: 'complete', usage: { inputTokens: 10, outputTokens: 5 } });
  });

  test('a `max_tokens` stop with a half `tool_use` is incomplete', async () => {
    // Guard: inputs are parsed only for a tool_use stop (mutation: parse every turn's inputs).
    const completion = await map(builtStream([textOf('Listing.'), toolUseBlock(undefined, '{"path":"')], 'max_tokens'));
    expect(completion).toEqual({ content: 'Listing.', outcome: 'incomplete', usage: { inputTokens: 10, outputTokens: 5 } });
  });

  test('an `end_turn` carrying a refusal `stop_details` (E-09 l.1173-1178\'s shape) is complete', async () => {
    // Built: E-09's example pairs `stop_details` of type refusal with end_turn. Guard: stop_details is never read
    // (mutation: map a refusal stop_details to blocked).
    const text = sseText([messageStart(), ...blockEvents([textOf('I can help with part of that.')]), { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null, stop_details: { type: 'refusal', category: 'cyber', explanation: 'built' } }, usage: { output_tokens: 5 } }, { type: 'message_stop' }]);
    expect((await map(text)).outcome).toBe('complete');
  });
});

describe('the outcome table (E-11 l.20-28)', () => {
  const answer = (stopReason: string | null, extra: BuiltBlock[] = []) => builtStream([textOf('Partial'), ...extra], stopReason);
  test.each([
    // Guard for each row: its own mapping (mutation: map the row's stop to another outcome).
    ['end_turn', answer('end_turn'), 'complete'],
    ['stop_sequence', answer('stop_sequence'), 'complete'],
    ['end_turn with a tool_use block', answer('end_turn', [toolUseBlock()]), 'incomplete'],
    ['stop_sequence with a tool_use block', answer('stop_sequence', [toolUseBlock()]), 'incomplete'],
    ['tool_use', answer('tool_use', [toolUseBlock()]), 'tool_calls'],
    ['max_tokens', answer('max_tokens'), 'incomplete'],
    ['model_context_window_exceeded', answer('model_context_window_exceeded'), 'incomplete'],
    ['refusal', answer('refusal'), 'blocked'],
    ['a null stop_reason', answer(null), 'incomplete'],
    ['no message_stop', answer('end_turn').replace('event: message_stop\ndata: {"type":"message_stop"}\n\n', ''), 'incomplete'],
  ] as const)('%s', async (_name, text, outcome) => {
    const completion = await map(text);
    expect(completion.outcome).toBe(outcome);
    if (outcome !== 'tool_calls') { expect(completion.toolCalls).toBeUndefined(); expect(completion.providerState).toBeUndefined(); }
  });

  test.each([['pause_turn'], ['an_unknown_value']])('%s is PROVIDER_FINISH_FAILED', async stopReason => {
    // Guard: pause_turn and unknown values fail the call (mutation: map them as incomplete).
    expect(await message(map(answer(stopReason)))).toBe('PROVIDER_FINISH_FAILED');
  });

  test('a tool_use stop with no tool_use block is PROVIDER_INVALID_RESPONSE', async () => {
    // Guard: at least one tool_use block (mutation: skip that rule; the call list's own minimum of one, in
    // InferenceToolCallsSchema, also refuses an empty list, so the proof drops both).
    expect(await message(map(answer('tool_use')))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a directly built fold whose joined text is over 2,000,000 characters is PROVIDER_RESPONSE_TOO_LARGE (2,000,000 complete)', () => {
    // The reader bounds streamed text; the outcome is pure and keeps the same bound and code for a fold built directly.
    // Guard: completion() checks the content length (mutation: delete that line; CompletionSchema then refuses the answer
    // as PROVIDER_INVALID_RESPONSE instead).
    const text = (length: number) => folded({ type: 'text', text: 'a'.repeat(length) });
    expect(anthropicOutcome(foldOf([text(1_000_000), text(1_000_000)], 'end_turn'), check()).content).toHaveLength(2_000_000);
    expect(() => anthropicOutcome(foldOf([text(1_000_000), text(1_000_001)], 'end_turn'), check())).toThrow('PROVIDER_RESPONSE_TOO_LARGE');
  });
});

describe('usage', () => {
  test('input is input_tokens plus both cache counts, output the latest output_tokens', async () => {
    // Guard: both cache counts are added (mutation: leave out cache_creation_input_tokens).
    const text = sseText([messageStart({ input_tokens: 100, cache_read_input_tokens: 20, cache_creation_input_tokens: 3, output_tokens: 1 }), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn', { output_tokens: 7 })]);
    expect((await map(text)).usage).toEqual({ inputTokens: 123, outputTokens: 7 });
  });

  test('an input sum past the safe integers is never taken, and never fails an otherwise valid answer', async () => {
    // Built from E-10 shapes, not a capture. Each count is a valid safe integer; only their sum is not. Guard: the sum is
    // checked (mutation: take the sum unconditionally; CompletionSchema then refuses the answer as PROVIDER_INVALID_RESPONSE).
    // The control, a sum of exactly Number.MAX_SAFE_INTEGER, is taken.
    const answer = (usage: Record<string, number>) => sseText([messageStart(usage), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn', { output_tokens: 1 })]);
    expect(await map(answer({ input_tokens: Number.MAX_SAFE_INTEGER, cache_read_input_tokens: 1, output_tokens: 1 }))).toEqual({ content: 'Hi', outcome: 'complete' });
    expect((await map(answer({ input_tokens: Number.MAX_SAFE_INTEGER - 1, cache_read_input_tokens: 1, output_tokens: 1 }))).usage).toEqual({ inputTokens: Number.MAX_SAFE_INTEGER, outputTokens: 1 });
  });

  test('each field takes its latest value (E-10 l.457 and l.531), never a sum across events', async () => {
    // The two usage objects are read from the capture itself. Guard: the latest value wins (mutation: the first one wins).
    const first = (JSON.parse(captureLines(457, 457).slice('data: '.length)) as { message: { usage: Record<string, number> } }).message.usage;
    const last = (JSON.parse(captureLines(531, 531).slice('data: '.length)) as { usage: Record<string, number> }).usage;
    expect(first).toEqual({ input_tokens: 2679, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, output_tokens: 3 });
    const text = sseText([messageStart(first), ...blockEvents([textOf('Weather.')]), ...messageEnd('end_turn', last)]);
    expect((await map(text)).usage).toEqual({ inputTokens: 10682, outputTokens: 510 });
  });

  test('is unset without both counts', async () => {
    // Guard: as the E-10 thinking test (mutation: a count never seen counts 0).
    const noInput = sseText([messageStart({ output_tokens: 1 }), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn', { output_tokens: 5 })]);
    expect((await map(noInput)).usage).toBeUndefined();
    const noOutput = sseText([messageStart({ input_tokens: 5 }), ...blockEvents([textOf('Hi')]), { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null } }, { type: 'message_stop' }]);
    expect((await map(noOutput)).usage).toBeUndefined();
  });

  test('a malformed count is never taken, and never fails an otherwise valid answer', async () => {
    // Built from E-10 shapes, not a capture. Malformed usage does not invalidate an answer (the accumulators' rule,
    // docs/ARCHITECTURE.md): a count is taken only when it is a non-negative safe integer, so the field keeps what it had.
    // Guards: (mutation: take a negative count; CompletionSchema then refuses the first answer as PROVIDER_INVALID_RESPONSE)
    // and (mutation: take a count that is not an integer; likewise the second); both at once: (mutation: take any number).
    const negative = sseText([messageStart({ input_tokens: -5, output_tokens: 1 }), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn', { output_tokens: -1 })]);
    expect(await map(negative)).toEqual({ content: 'Hi', outcome: 'complete' });
    const fractional = sseText([messageStart({ input_tokens: 10, output_tokens: 1 }), ...blockEvents([textOf('Hi')]), ...messageEnd('end_turn', { output_tokens: 1.5 })]);
    expect(await map(fractional)).toEqual({ content: 'Hi', outcome: 'complete', usage: { inputTokens: 10, outputTokens: 1 } });
  });
});

describe('the state refusal table (spec 5.3)', () => {
  test('the valid state the rows depart from is accepted by the encoder', () => {
    // The control for the rows below. Guard: (mutation, in the fixture: leave the tool_use block out of VALID_STATE_DATA).
    expect(JSON.parse(encode(refusalTranscript(VALID_STATE_DATA), [REFUSAL_TOOL])).messages[1].content).toEqual(JSON.parse(VALID_STATE_DATA).content);
  });

  test('the state schema accepts the valid state and returns its content array as parsed', () => {
    // The control for the next test. Guard: (mutation: the schema refuses everything, which leaves every row below green).
    expect(parseAnthropicState(VALID_STATE_DATA)).toEqual(JSON.parse(VALID_STATE_DATA).content);
  });

  test.each(STATE_REFUSALS)('the state schema refuses: $name', row => {
    // Each row against the one schema directly (S-5), so a schema rule that the encoder's comparisons or the outcome's
    // call checks also enforce is still proved. Guards: each rule of parseAnthropicState (mutations: the tool_use field
    // rules removed, one at a time and together; the 1-block minimum; the 512-block maximum; the one-key top level; the
    // thinking signature and redacted data rules; the extras bound).
    expect(parseAnthropicState(row.data)).toBeUndefined();
  });

  test.each(STATE_REFUSALS)('the encoder refuses: $name', row => {
    // Guard: the strict state schema (mutation: skip it in the encoder; the rows that differ from the valid state only in
    // the refused shape then encode).
    expect(() => encode(refusalTranscript(row.data), [REFUSAL_TOOL])).toThrow('INVALID_INFERENCE_REQUEST');
  });

  test.each(STATE_REFUSALS.filter(row => 'sse' in row.stream))('a stream that produces it is refused: $name', async row => {
    // Guard: the outcome parses the state it built with the encoder's schema (mutation: skip that check; the rows only
    // the schema refuses then return calls whose state the encoder refuses only at step 2).
    const stream = row.stream as { sse: string; refusedIn: 'reader' | 'outcome' };
    if (stream.refusedIn === 'reader') { expect(await message(read(stream.sse, { size: 65536 }))).toBe('PROVIDER_INVALID_RESPONSE'); return; }
    const fold = await read(stream.sse, { size: 65536 });
    expect(() => anthropicOutcome(fold, check())).toThrow('PROVIDER_INVALID_RESPONSE');
  });

  test.each(STATE_REFUSALS.filter(row => row.name.endsWith('only together')))('each extra field alone is within the bound, the two together are not: $name', row => {
    // A fixture self-check: the row is refused only because a block's extra fields are bounded as one object.
    // Guard: (mutation, in the fixture: 140,000 characters per field, which one field alone exceeds).
    const block = (JSON.parse(row.data) as { content: Record<string, unknown>[] }).content[1]!;
    const extra = Object.fromEntries(Object.entries(block).filter(([field]) => field !== 'type' && field !== 'text'));
    expect(Object.keys(extra)).toEqual(['meta', 'note']);
    expect(BoundedJsonObjectSchema.safeParse(extra).success).toBe(false);
    for (const [field, value] of Object.entries(extra)) expect(BoundedJsonObjectSchema.safeParse({ [field]: value }).success).toBe(true);
  });

  test('a fold of 513 blocks built directly is refused by the outcome (512 are accepted)', () => {
    // Guard: as the previous test (mutation: skip the outcome's state schema check).
    const texts = (count: number) => Array.from({ length: count }, () => folded({ type: 'text', text: '' }));
    expect(anthropicOutcome(foldOf([...texts(511), callBlock]), check()).outcome).toBe('tool_calls');
    expect(() => anthropicOutcome(foldOf([...texts(512), callBlock]), check())).toThrow('PROVIDER_INVALID_RESPONSE');
  });

  test('a fold whose state would exceed PROVIDER_STATE_MAX is PROVIDER_RESPONSE_TOO_LARGE', () => {
    // Guard: the size check (mutation: skip it; the completion schema then refuses the state as invalid instead).
    const thinking = folded({ type: 'thinking', thinking: 'x'.repeat(PROVIDER_STATE_MAX), signature: REFUSAL_SIGNATURE });
    expect(() => anthropicOutcome(foldOf([thinking, callBlock]), check())).toThrow('PROVIDER_RESPONSE_TOO_LARGE');
  });

  test('a start object whose extra field is nested too deep for JSON.stringify is refused, not a stack overflow', async () => {
    // JSON.parse reads 100,000 nested arrays (it is iterative in Node 24), JSON.stringify's recursion cannot write them.
    // Built from E-10 shapes; the event is written as text because the test cannot stringify it either.
    // Guard: the state is built inside a try (mutation: let JSON.stringify's RangeError escape).
    const depth = 100_000;
    const deep = `event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":"","meta":${'['.repeat(depth)}${']'.repeat(depth)}}}\n\n`;
    const text = sseText([messageStart()]) + deep + sseText([blockStop(0), ...blockEvents([toolUseBlock()], 1), ...messageEnd('tool_use')]);
    expect(await message(map(text))).toBe('PROVIDER_INVALID_RESPONSE');
  });

  test('a directly built fold with a block left open is refused in a tool turn', () => {
    // Guard: every block of a tool turn is closed (mutation: skip that check).
    expect(() => anthropicOutcome(foldOf([{ ...callBlock, closed: false }]), check())).toThrow('PROVIDER_INVALID_RESPONSE');
  });
});

describe('encodeAnthropic', () => {
  const call = (id: string, input: ToolCall['input'] = { path: '.' }, name = 'list_files'): ToolCall => ({ id, name, input });
  const useBlock = (item: ToolCall) => ({ type: 'tool_use', id: item.id, name: item.name, input: item.input });

  test('lifts the first system message to `system`, and leaves the key out when it is empty', () => {
    // Guard: an empty system is left out (mutation: send `system` whenever the first message is a system message).
    expect(encode([{ role: 'system', content: 'Be brief.' }, { role: 'user', content: 'Hi' }])).toBe('{"model":"claude-opus-5-5","max_tokens":4096,"system":"Be brief.","messages":[{"role":"user","content":"Hi"}],"stream":true}');
    expect(encode([{ role: 'system', content: '' }, { role: 'user', content: 'Hi' }])).toBe('{"model":"claude-opus-5-5","max_tokens":4096,"messages":[{"role":"user","content":"Hi"}],"stream":true}');
  });

  test('orders the body keys `model, max_tokens, system, messages, tools, stream` and maps tools in the offered order', () => {
    // Guard: tools as { name, description, input_schema } (mutation: send `parameters` under its own name).
    const tools = [tool('read_file', 'Read a file.'), tool('list_files', 'List files.')];
    const body = encode([{ role: 'system', content: 'S' }, { role: 'user', content: 'Hi' }], tools);
    expect(body).toBe('{"model":"claude-opus-5-5","max_tokens":4096,"system":"S","messages":[{"role":"user","content":"Hi"}],"tools":[{"name":"read_file","description":"Read a file.","input_schema":{"type":"object","properties":{}}},{"name":"list_files","description":"List files.","input_schema":{"type":"object","properties":{}}}],"stream":true}');
    expect(Object.keys(JSON.parse(body))).toEqual(['model', 'max_tokens', 'system', 'messages', 'tools', 'stream']);
  });

  test('sends no `tools` key when none are offered, and never thinking, tool_choice, sampling or stream_options', () => {
    // Guard: the tools key only when non-empty (mutation: always send `tools`).
    const body = JSON.parse(encode([{ role: 'user', content: 'Hi' }], [])) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual(['model', 'max_tokens', 'messages', 'stream']);
    for (const key of ['tools', 'thinking', 'tool_choice', 'temperature', 'top_p', 'top_k', 'stream_options', 'system']) expect(body).not.toHaveProperty(key);
  });

  test('sends two consecutive user messages as two, never merged', () => {
    // Guard: E-09 l.62 (mutation: merge consecutive user messages).
    expect(JSON.parse(encode([{ role: 'user', content: 'First' }, { role: 'user', content: 'Second' }])).messages).toEqual([{ role: 'user', content: 'First' }, { role: 'user', content: 'Second' }]);
  });

  test('sends a call-free assistant message as string content', () => {
    // Guard: (mutation: send it as a text block array).
    expect(JSON.parse(encode([{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Hello.' }, { role: 'user', content: 'Again' }])).messages[1]).toEqual({ role: 'assistant', content: 'Hello.' });
  });

  test('groups a run of tool results into one user message, in transcript order, string content and no is_error', () => {
    // Guard: one user message per run (mutation: one user message per result).
    const first = call('toolu_a'); const second = call('toolu_b', { path: 'src' });
    const messages: InferenceMessage[] = [{ role: 'user', content: 'Go' }, toolStep([useBlock(first), useBlock(second)], [first, second]), result(second, 'two'), result(first, 'one')];
    const encoded = JSON.parse(encode(messages, [REFUSAL_TOOL])).messages as unknown[];
    expect(encoded).toHaveLength(3);
    expect(encoded[2]).toEqual({ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_b', content: 'two' }, { type: 'tool_result', tool_use_id: 'toolu_a', content: 'one' }] });
  });

  test('ends a run of tool results at the next assistant step: two tool steps give two tool_result user messages, in order', () => {
    // A multi-step run: step 1 calls one tool, step 2 calls two. Guard: a run ends at any message that is not a tool
    // result (mutation: delete `results = undefined;`; the second run then joins the first run's user message, the
    // request ends on an assistant message and is refused as INVALID_INFERENCE_REQUEST).
    const first = call('toolu_a'); const second = call('toolu_b', { path: 'src' }); const third = call('toolu_c', { path: 'docs' });
    const messages: InferenceMessage[] = [
      { role: 'system', content: 'S' }, { role: 'user', content: 'Go' },
      toolStep([useBlock(first)], [first]), result(first, 'one'),
      toolStep([useBlock(second), useBlock(third)], [second, third]), result(second, 'two'), result(third, 'three'),
    ];
    expect(JSON.parse(encode(messages, [REFUSAL_TOOL])).messages).toEqual([
      { role: 'user', content: 'Go' },
      { role: 'assistant', content: [useBlock(first)] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_a', content: 'one' }] },
      { role: 'assistant', content: [useBlock(second), useBlock(third)] },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_b', content: 'two' }, { type: 'tool_result', tool_use_id: 'toolu_c', content: 'three' }] },
    ]);
  });

  test('sends a state\'s content array unchanged, extra block fields and key order included', () => {
    // Guard: the received blocks are sent, not rebuilt (mutation: rebuild each block from its documented fields only).
    const item = call('toolu_01');
    const content = [{ type: 'thinking', thinking: '', signature: REFUSAL_SIGNATURE }, { citations: null, type: 'text', text: 'Listing.' }, { type: 'tool_use', id: 'toolu_01', name: 'list_files', input: { path: '.' }, caller: { type: 'direct' } }];
    const body = encode([{ role: 'user', content: 'Go' }, toolStep(content, [item], 'Listing.'), result(item)], [REFUSAL_TOOL]);
    expect(body).toContain(`{"role":"assistant","content":${JSON.stringify(content)}}`);
  });

  test('matches a canonical input holding -0 against the state\'s 0', () => {
    // The state's input went through JSON.stringify, so -0 is 0 there. Guard: canonical JSON, not isDeepStrictEqual
    // (mutation: compare the inputs with isDeepStrictEqual).
    const item = call('toolu_01', { offset: -0 });
    expect(() => encode([{ role: 'user', content: 'Go' }, toolStep([useBlock({ ...item, input: { offset: 0 } })], [item]), result(item)], [REFUSAL_TOOL])).not.toThrow();
  });

  test('is pure: encoding twice gives the same bytes', () => {
    // Guard: (mutation: a fresh value per call, such as a timestamp in the body).
    const item = call('toolu_01');
    const messages: InferenceMessage[] = [{ role: 'system', content: 'S' }, { role: 'user', content: 'Go' }, toolStep([useBlock(item)], [item]), result(item)];
    expect(encode(messages, [REFUSAL_TOOL])).toBe(encode(messages, [REFUSAL_TOOL]));
  });

  const item = call('toolu_01');
  const valid = (step: InferenceMessage, results: InferenceMessage[] = [result(item)]): InferenceMessage[] => [{ role: 'system', content: 'S' }, { role: 'user', content: 'Go' }, step, ...results];
  test.each([
    // Each refusal has its own guard: the mutation that removes that one check.
    ['a system message after the first', [{ role: 'user', content: 'Go' }, { role: 'system', content: 'Late.' }, { role: 'user', content: 'Again' }]],
    ['an assistant tool step without state', valid({ role: 'assistant', content: '', toolCalls: [item] })],
    ['a foreign state format', valid({ role: 'assistant', content: '', toolCalls: [item], providerState: { format: 'openai-chat@1', appendOnly: false, data: JSON.stringify({ content: [useBlock(item)] }) } })],
    ['a tool_use id mismatch', valid(toolStep([useBlock({ ...item, id: 'toolu_02' })], [item]))],
    ['a tool_use name mismatch', valid(toolStep([useBlock({ ...item, name: 'read_file' })], [item]))],
    ['a tool_use input mismatch', valid(toolStep([useBlock({ ...item, input: { path: 'src' } })], [item]))],
    ['a tool_use count mismatch', valid(toolStep([useBlock(item), useBlock(call('toolu_02'))], [item]))],
    ['a tool_use order mismatch', valid(toolStep([useBlock(call('toolu_02')), useBlock(item)], [item, call('toolu_02')]), [result(item), result(call('toolu_02'))])],
    ['a text mismatch', valid(toolStep([{ type: 'text', text: 'Listing.' }, useBlock(item)], [item], 'Listing files.'))],
    ['a transcript ending with an assistant message', [{ role: 'user', content: 'Go' }, { role: 'assistant', content: 'Prefill' }]],
    ['a transcript with no message after the system prompt', [{ role: 'system', content: 'S' }]],
  ] as const)('refuses %s with INVALID_INFERENCE_REQUEST', (_name, messages) => {
    expect(() => encode(messages as InferenceMessage[], [REFUSAL_TOOL])).toThrow('INVALID_INFERENCE_REQUEST');
  });
});

describe('route, headers and the kind part', () => {
  test('`url` gives `<endpoint>/messages`; the headers carry Bearer and the version only', () => {
    // Guard: (mutation: add an `x-api-key` header beside Authorization).
    expect(anthropicKind.url('https://api.anthropic.com/v1', profile)).toBe('https://api.anthropic.com/v1/messages');
    expect(anthropicHeaders(profile, 'sk-ant-test')).toEqual({ 'Content-Type': 'application/json', 'anthropic-version': ANTHROPIC_VERSION, Authorization: 'Bearer sk-ant-test' });
    expect(ANTHROPIC_VERSION).toBe('2023-06-01');
    expect(anthropicHeaders(profile, undefined)).toEqual({ 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' });
    expect(anthropicKind.headers(profile, 'sk-ant-test')).toEqual(anthropicHeaders(profile, 'sk-ant-test'));
  });

  test('the part: 600 s, owns anthropic-messages@1, reads 400 bodies, delegates to the pure functions', () => {
    // Guard: (mutation: timeoutMs 120_000, today's chat-kind value).
    expect(anthropicKind.timeoutMs).toBe(600_000);
    expect(anthropicKind.owns).toEqual(['anthropic-messages@1']);
    expect(anthropicKind.refusalStatuses).toEqual([400]);
    const messages: InferenceMessage[] = [{ role: 'user', content: 'Hi' }];
    expect(anthropicKind.body(profile, checked(messages), [], {})).toBe(encode(messages));
    expect(anthropicKind.read).toBe(readAnthropic);
    expect(anthropicKind.outcome).toBe(anthropicOutcome);
    expect(anthropicKind.isOverflow).toBe(isAnthropicOverflow);
    expect(anthropicKind.retryDelayMs).toBe(anthropicRetryDelayMs);
  });
});

describe('isAnthropicOverflow', () => {
  // E-12 l.66-74's error shape; the overflow words are E-13 l.150's. Bodies marked "captured" quote E-12's message text
  // inside that shape. Built, since no capture states them: the spend-limit message, and the overflow messages' text
  // beyond E-13's words. E-13 l.150 gives "prompt is too long" alone, so the suffix ": 1000500 tokens > 1000000 maximum"
  // and the capitalised "Prompt Is Too Long" are built.
  const body = (type: string, message: string) => JSON.stringify({ type: 'error', error: { type, message }, request_id: 'req_built' });
  const ERRORS = '2026-10-05-claude-api-errors-claude-platform-docs-claude-854b88aa.md';
  const errorLines = (first: number, last: number) => readFileSync(new URL(WIRE + ERRORS, import.meta.url), 'utf8').split('\n').slice(first - 1, last).join('\n');
  // E-12, capture lines 152-158: the prefill error body, verbatim.
  const E12_PREFILL = '{\n  "type": "error",\n  "error": {\n    "type": "invalid_request_error",\n    "message": "This model does not support assistant message prefill. The conversation must end with a user message."\n  }\n}';
  // E-12, capture lines 170, 182, 262, 286 and 296: one message text each, verbatim.
  const E12_MODIFIED_THINKING = '`thinking` or `redacted_thinking` blocks in the latest assistant message cannot be modified. These blocks must remain as they were in the original response.';
  const E12_THINKING_TYPE = '"thinking.type.enabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior.';
  const E12_FORCED_TOOL = 'tool_choice: type "tool" and "any" are not supported for this model.';
  const E12_PREFIX_MISMATCH = 'messages.{i}.content.{j}: Invalid `signature` in `thinking` block. The block is bound to a different conversation. Remove the block, or set `thinking.block_binding.prefix_mismatch_behavior` to "drop_block".';
  const E12_BLOCK_BINDING = 'block_binding: Extra inputs are not permitted';

  test('the fixtures marked "captured" are the cited E-12 lines, copied verbatim', () => {
    // Guard: a fixture that drifts from its capture or its cited lines (mutation: change one character of any of them).
    for (const [fixture, first, last] of [[E12_PREFILL, 152, 158], [E12_MODIFIED_THINKING, 170, 170], [E12_THINKING_TYPE, 182, 182], [E12_FORCED_TOOL, 262, 262], [E12_PREFIX_MISMATCH, 286, 286], [E12_BLOCK_BINDING, 296, 296]] as const) {
      expect(errorLines(first, last)).toBe(fixture);
    }
  });

  test('is true only for invalid_request_error with "prompt is too long"', () => {
    // Guard: the error type is checked (mutation: match the message alone).
    expect(isAnthropicOverflow(body('invalid_request_error', 'prompt is too long: 1000500 tokens > 1000000 maximum'))).toBe(true);
    expect(isAnthropicOverflow(body('invalid_request_error', 'Prompt Is Too Long'))).toBe(true);
    expect(isAnthropicOverflow(body('rate_limit_error', 'prompt is too long'))).toBe(false);
  });

  test.each([
    ['a spend limit (built)', body('invalid_request_error', 'You have reached your specified workspace API usage limits.')],
    ['prefill (captured, E-12 l.152-158)', E12_PREFILL],
    ['modified thinking (captured, E-12 l.170)', body('invalid_request_error', E12_MODIFIED_THINKING)],
    ['a thinking type (captured, E-12 l.182)', body('invalid_request_error', E12_THINKING_TYPE)],
    ['forced tool use (captured, E-12 l.262)', body('invalid_request_error', E12_FORCED_TOOL)],
    ['a prefix mismatch (captured, E-12 l.286)', body('invalid_request_error', E12_PREFIX_MISMATCH)],
    ['block_binding (captured, E-12 l.296)', body('invalid_request_error', E12_BLOCK_BINDING)],
    ['plain text that is not JSON', 'prompt is too long'],
    ['an `error` that is not an object', JSON.stringify({ type: 'error', error: 'prompt is too long' })],
  ])('is false for %s', (_name, text) => {
    // Guards: the body must be JSON with an error object (mutation: test the raw text for the phrase; red for the last two
    // cases), and the message must say "prompt is too long" (mutation: any invalid_request_error; red for the first seven).
    expect(isAnthropicOverflow(text)).toBe(false);
  });
});

describe('anthropicRetryDelayMs', () => {
  const refused = (status: number, retryAfter?: string) => new Response(null, { status, headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter } });
  test('waits the seconds of a numeric 429 and of a 5xx with a numeric header', () => {
    // Guard: the header is honoured (mutation: ignore retry-after).
    expect(anthropicRetryDelayMs(refused(429, '7'), 0)).toBe(7000);
    expect(anthropicRetryDelayMs(refused(503, '3'), 0)).toBe(3000);
    expect(anthropicRetryDelayMs(refused(529, '0'), 1)).toBe(0);
  });

  test('never retries a 429 without the header (the spend cap) or with a date', () => {
    // Guard: a 429 retries only with an integer header (mutation: give a 429 without one the 5xx backoff).
    expect(anthropicRetryDelayMs(refused(429), 0)).toBeUndefined();
    expect(anthropicRetryDelayMs(refused(429, 'Wed, 21 Oct 2026 07:28:00 GMT'), 0)).toBeUndefined();
    expect(anthropicRetryDelayMs(refused(429, '1.5'), 0)).toBeUndefined();
  });

  test.each([[500], [502], [503], [504], [529], [599]])('waits 1 s then 2 s after a %s without the header', status => {
    // Guard: every 5xx is retried (mutation: retry only 500, 504 and 529).
    expect(anthropicRetryDelayMs(refused(status), 0)).toBe(1000);
    expect(anthropicRetryDelayMs(refused(status), 1)).toBe(2000);
  });

  test.each([[400], [401], [404]])('never retries a %s', status => {
    // Guard: (mutation: retry any status with a retry-after header).
    expect(anthropicRetryDelayMs(refused(status), 0)).toBeUndefined();
    expect(anthropicRetryDelayMs(refused(status, '1'), 0)).toBeUndefined();
  });
});

test('nested() reaches the depth the bound refuses', () => {
  // A fixture self-check: 40 levels is beyond BoundedJsonObjectSchema's depth of 32.
  // Guard: (mutation, in the fixture: cap nested() at 32 levels).
  let depth = 0; let value: unknown = nested(40);
  while (typeof value === 'object' && value !== null) { value = (value as { a: unknown }).a; depth++; }
  expect(depth).toBe(40);
});
