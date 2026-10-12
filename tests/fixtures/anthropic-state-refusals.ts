import type { InferenceMessage } from '../../src/main/inference';
import type { ToolCall, ToolSpec } from '../../src/shared';

/**
 * The state refusal table of docs/specification/more-models-phase2.md section 5.3, as data (unit U3; U4's
 * `complete()` tests import it too). Each row is one shape the `anthropic-messages@1` state schema refuses: the
 * state `data` an assistant tool step carries (the encoder refuses it with INVALID_INFERENCE_REQUEST, before any
 * fetch), and the stream that produces the shape with where it is refused (PROVIDER_INVALID_RESPONSE, so no tool
 * runs), or none, with the reason no stream can produce it.
 *
 * Every row departs from VALID_STATE_DATA by one change, so the shape, not a mismatch with the canonical call or
 * content, is what is refused wherever the row allows it. Every stream here is built from E-10 shapes, not a
 * capture (docs/research/2026-10-05-provider-wire-formats, E-10 l.198-220, l.269-348, l.388-425).
 */

/** A signature built for the tests from base64-alphabet characters only (not copied from E-10 l.407, which is elided). */
export const REFUSAL_SIGNATURE = 'U3RhdGVSZWZ1c2FsU2lnbmF0dXJlMDE';
export const REFUSAL_TOOL: ToolSpec = { name: 'list_files', description: 'List the files of a folder.', parameters: { type: 'object', properties: { path: { type: 'string' } } } };
/** The canonical call and content of the assistant tool step every row's state rides on. */
export const REFUSAL_CALL: ToolCall = { id: 'toolu_01', name: 'list_files', input: { path: '.' } };
export const REFUSAL_CONTENT = '';

type Block = Record<string, unknown>;
const thinking: Block = { type: 'thinking', thinking: '', signature: REFUSAL_SIGNATURE };
const text: Block = { type: 'text', text: '' };
const toolUse: Block = { type: 'tool_use', id: 'toolu_01', name: 'list_files', input: { path: '.' } };
const state = (...content: Block[]) => JSON.stringify({ content });
/** An object nested `levels` deep, its leaf at depth `levels` (BoundedJsonObjectSchema allows 32). */
export const nested = (levels: number): Record<string, unknown> => { let value: unknown = 0; for (let level = 0; level < levels; level++) value = { a: value }; return value as Record<string, unknown>; };

/** The valid state every row departs from: encodeAnthropic accepts it on the step refusalTranscript builds. */
export const VALID_STATE_DATA = state(thinking, text, toolUse);

/** A transcript whose one assistant tool step carries `data` as its `anthropic-messages@1` state. */
export function refusalTranscript(data: string): InferenceMessage[] {
  return [
    { role: 'system', content: 'You are a coding agent.' },
    { role: 'user', content: 'List the files.' },
    { role: 'assistant', content: REFUSAL_CONTENT, toolCalls: [REFUSAL_CALL], providerState: { format: 'anthropic-messages@1', appendOnly: true, data } },
    { role: 'tool', content: 'a.txt', toolCallId: REFUSAL_CALL.id, toolName: REFUSAL_CALL.name },
  ];
}

// Built streams (built from E-10 shapes, not a capture): `event:` names equal to each data `type`, as E-10 l.63 says.
type StreamEvent = Record<string, unknown> & { type: string };
export const sseText = (events: readonly StreamEvent[]): string => events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('');
export const messageStart = (usage: Record<string, number> = { input_tokens: 10, output_tokens: 1 }): StreamEvent => ({ type: 'message_start', message: { id: 'msg_built', type: 'message', role: 'assistant', content: [], model: 'claude-built', stop_reason: null, stop_sequence: null, usage } });
export const blockStart = (index: number, block: Block): StreamEvent => ({ type: 'content_block_start', index, content_block: block });
export const blockDelta = (index: number, delta: Block): StreamEvent => ({ type: 'content_block_delta', index, delta });
export const blockStop = (index: number): StreamEvent => ({ type: 'content_block_stop', index });
export const messageEnd = (stopReason: string | null, usage: Record<string, number> = { output_tokens: 5 }): StreamEvent[] => [{ type: 'message_delta', delta: { stop_reason: stopReason, stop_sequence: null }, usage }, { type: 'message_stop' }];
/** One content block: its start object and its deltas, in order. */
export interface BuiltBlock { readonly start: Block; readonly deltas?: readonly Block[] }
export const blockEvents = (blocks: readonly BuiltBlock[], first = 0): StreamEvent[] =>
  blocks.flatMap((block, offset) => [blockStart(first + offset, block.start), ...(block.deltas ?? []).map(delta => blockDelta(first + offset, delta)), blockStop(first + offset)]);
/** A whole stream: message_start, the blocks, then the stop. */
export const builtStream = (blocks: readonly BuiltBlock[], stopReason: string | null = 'tool_use'): string => sseText([messageStart(), ...blockEvents(blocks), ...messageEnd(stopReason)]);

/** The offered call as a streamed tool_use block (E-10 l.321-339's shape: an `input` of `{}`, then partial JSON). */
export const toolUseBlock = (start: Block = { type: 'tool_use', id: 'toolu_01', name: 'list_files', input: {} }, partialJson = '{"path":"."}'): BuiltBlock =>
  ({ start, deltas: [{ type: 'input_json_delta', partial_json: '' }, { type: 'input_json_delta', partial_json: partialJson }] });
const signed = (start: Block): BuiltBlock => ({ start, deltas: [{ type: 'signature_delta', signature: REFUSAL_SIGNATURE }] });
const textBlock: BuiltBlock = { start: { type: 'text', text: '' } };
/** A `tool_use` turn: a signed thinking block, a text block and the call, with `replace` swapping one of them. */
const toolTurn = (replace: { thinking?: BuiltBlock; text?: BuiltBlock; tool?: BuiltBlock } = {}) =>
  builtStream([replace.thinking ?? signed({ type: 'thinking', thinking: '', signature: '' }), replace.text ?? textBlock, replace.tool ?? toolUseBlock()]);

export interface StateRefusal {
  readonly name: string;
  /** The state's `data`: encodeAnthropic refuses it with INVALID_INFERENCE_REQUEST. */
  readonly data: string;
  /** The built stream that produces the shape and where it is refused, or none with the reason. */
  readonly stream: { readonly sse: string; readonly refusedIn: 'reader' | 'outcome' } | { readonly none: string };
}

const BUILT_BY_STRINGIFY = 'none: the outcome builds `data` with JSON.stringify';
const BUILT_OBJECT = 'none: the outcome builds the `{ content }` object itself';
const extraField = (value: unknown) => ({ type: 'text', text: '', meta: value });
/** Two extra fields, each within the bound alone, outside it only as one object (spec 5.3: "together, as one object"). */
const twoExtraFields = (make: () => unknown) => ({ type: 'text', text: '', meta: make(), note: make() });
const halfBytes = () => 'x'.repeat(70_000);
const halfNodes = () => Array.from({ length: 6_000 }, () => 0);

export const STATE_REFUSALS: readonly StateRefusal[] = [
  { name: '`data` that is not JSON', data: '{"content":[', stream: { none: BUILT_BY_STRINGIFY } },
  { name: 'JSON that is an array', data: '[]', stream: { none: BUILT_OBJECT } },
  { name: '`content` that is not an array', data: '{"content":{}}', stream: { none: BUILT_OBJECT } },
  { name: 'a valid `content` plus an extra top-level key', data: JSON.stringify({ content: [thinking, text, toolUse], extra: true }), stream: { none: BUILT_OBJECT } },
  { name: '0 blocks', data: '{"content":[]}', stream: { sse: builtStream([]), refusedIn: 'outcome' } },
  // 512 text blocks and the call: 513 valid blocks, so only the count is out of bounds (the 513th start fails in the reader).
  { name: '513 blocks', data: state(...Array.from({ length: 512 }, () => text), toolUse), stream: { sse: builtStream([...Array.from({ length: 512 }, () => textBlock), toolUseBlock()]), refusedIn: 'reader' } },
  // `fallback` is not an input block type (E-09 l.121-256); E-10 l.68 streams it as a start and a stop with no deltas.
  { name: 'a block of an unknown type', data: state(thinking, { type: 'fallback' }, text, toolUse), stream: { sse: builtStream([signed({ type: 'thinking', thinking: '', signature: '' }), { start: { type: 'fallback' } }, textBlock, toolUseBlock()]), refusedIn: 'outcome' } },
  { name: '`text` whose `text` is not a string', data: state(thinking, { type: 'text', text: null }, toolUse), stream: { sse: toolTurn({ text: { start: { type: 'text', text: null } } }), refusedIn: 'outcome' } },
  { name: '`thinking` whose `thinking` is not a string', data: state({ type: 'thinking', thinking: 0, signature: REFUSAL_SIGNATURE }, text, toolUse), stream: { sse: toolTurn({ thinking: signed({ type: 'thinking', thinking: 0, signature: '' }) }), refusedIn: 'outcome' } },
  { name: '`thinking` with no `signature` field', data: state({ type: 'thinking', thinking: '' }, text, toolUse), stream: { sse: toolTurn({ thinking: { start: { type: 'thinking', thinking: '' } } }), refusedIn: 'outcome' } },
  // E-10 l.392's start shape (`signature: ""`), closed without its `signature_delta`.
  { name: '`thinking` with an empty `signature`', data: state({ type: 'thinking', thinking: '', signature: '' }, text, toolUse), stream: { sse: toolTurn({ thinking: { start: { type: 'thinking', thinking: '', signature: '' } } }), refusedIn: 'outcome' } },
  { name: '`thinking` whose `signature` is not a string', data: state({ type: 'thinking', thinking: '', signature: 0 }, text, toolUse), stream: { sse: toolTurn({ thinking: { start: { type: 'thinking', thinking: '', signature: 0 } } }), refusedIn: 'outcome' } },
  { name: '`redacted_thinking` with an empty `data`', data: state({ type: 'redacted_thinking', data: '' }, text, toolUse), stream: { sse: toolTurn({ thinking: { start: { type: 'redacted_thinking', data: '' } } }), refusedIn: 'outcome' } },
  { name: '`redacted_thinking` with no `data` field', data: state({ type: 'redacted_thinking' }, text, toolUse), stream: { sse: toolTurn({ thinking: { start: { type: 'redacted_thinking' } } }), refusedIn: 'outcome' } },
  { name: '`tool_use` whose `id` has a leading space', data: state(thinking, text, { ...toolUse, id: ' toolu_01' }), stream: { sse: toolTurn({ tool: toolUseBlock({ type: 'tool_use', id: ' toolu_01', name: 'list_files', input: {} }) }), refusedIn: 'outcome' } },
  { name: '`tool_use` whose `id` has 129 characters', data: state(thinking, text, { ...toolUse, id: `toolu_${'x'.repeat(123)}` }), stream: { sse: toolTurn({ tool: toolUseBlock({ type: 'tool_use', id: `toolu_${'x'.repeat(123)}`, name: 'list_files', input: {} }) }), refusedIn: 'outcome' } },
  { name: '`tool_use` with an empty `name`', data: state(thinking, text, { ...toolUse, name: '' }), stream: { sse: toolTurn({ tool: toolUseBlock({ type: 'tool_use', id: 'toolu_01', name: '', input: {} }) }), refusedIn: 'outcome' } },
  { name: '`tool_use` whose `input` is an array', data: state(thinking, text, { ...toolUse, input: [] }), stream: { sse: toolTurn({ tool: toolUseBlock(undefined, '[]') }), refusedIn: 'outcome' } },
  { name: '`tool_use` whose `input` is nested deeper than 32', data: state(thinking, text, { ...toolUse, input: nested(40) }), stream: { sse: toolTurn({ tool: toolUseBlock(undefined, JSON.stringify(nested(40))) }), refusedIn: 'outcome' } },
  { name: 'an extra field nested deeper than 32', data: state(thinking, extraField(nested(40)), toolUse), stream: { sse: toolTurn({ text: { start: extraField(nested(40)) } }), refusedIn: 'outcome' } },
  { name: 'an extra field holding more than 10,000 nodes', data: state(thinking, extraField(Array.from({ length: 10_000 }, () => 0)), toolUse), stream: { sse: toolTurn({ text: { start: extraField(Array.from({ length: 10_000 }, () => 0)) } }), refusedIn: 'outcome' } },
  { name: 'an extra field over 131,072 bytes', data: state(thinking, extraField('x'.repeat(131_072)), toolUse), stream: { sse: toolTurn({ text: { start: extraField('x'.repeat(131_072)) } }), refusedIn: 'outcome' } },
  // 70,000 characters each: about 70,011 bytes alone, about 140,021 together.
  { name: 'two extra fields over 131,072 bytes only together', data: state(thinking, twoExtraFields(halfBytes), toolUse), stream: { sse: toolTurn({ text: { start: twoExtraFields(halfBytes) } }), refusedIn: 'outcome' } },
  // 6,000 elements each: 6,002 nodes alone, 12,003 together.
  { name: 'two extra fields holding more than 10,000 nodes only together', data: state(thinking, twoExtraFields(halfNodes), toolUse), stream: { sse: toolTurn({ text: { start: twoExtraFields(halfNodes) } }), refusedIn: 'outcome' } },
];
