import { BoundedJsonObjectSchema, CompletionSchema, InferenceToolCallSchema, InferenceToolCallsSchema, InferenceToolsSchema, PROVIDER_STATE_FORMATS, PROVIDER_STATE_MAX } from '../engine/control';
import type { ToolCall, ToolSpec } from '../shared';
import type { Completion, InferenceMessage, InferenceProfile } from './inference';      // types only: no runtime cycle
import type { CheckedTranscript, KindPart } from './provider-kind';
import { readSseEvents } from './provider-stream';

/**
 * The Anthropic Messages adapter (docs/specification/more-models-phase2.md section 5): route, headers, the request
 * body, the stream reader, the outcome with its provider state, and the refusal and retry rules. Every function is
 * pure except readAnthropic, which reads one response. The kind joins complete()'s table in unit U4. Imports only
 * types from inference.ts and provider-kind.ts, so there is no runtime import cycle.
 */
export const ANTHROPIC_VERSION = '2023-06-01';

/** One content block as read: its start object's fields with the applied deltas. */
export interface FoldedBlock { readonly fields: Readonly<Record<string, unknown>>; readonly partialJson: string; readonly replayable: boolean; readonly closed: boolean }
export interface AnthropicFold {
  /** message_start read. */
  readonly started: boolean;
  /** message_stop read. */
  readonly stopped: boolean;
  readonly stopReason: string | null;
  readonly blocks: readonly FoldedBlock[];
  readonly usage: Readonly<{ input_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number; output_tokens?: number }>;
}

const MAX_TEXT = 2_000_000;           // the cap CompletionSchema puts on `content` (src/engine/control.ts)
const MAX_PARTIAL_JSON = 131_072;     // per call, the bound the chat kinds put on arguments (src/main/provider-stream.ts)
const MAX_BLOCKS = 512;
const MAX_TOOL_USES = 128;
// The rules a canonical call and an offered tool already meet (src/engine/control.ts), so a replayed block meets them too.
const IdSchema = InferenceToolCallSchema.shape.id;
const ToolNameSchema = InferenceToolsSchema.element.shape.name;

type JsonRecord = Record<string, unknown>;
const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const fail = (code: string): never => { throw new Error(code); };
const refuse = (): never => fail('INVALID_INFERENCE_REQUEST');
const invalid = (): never => fail('PROVIDER_INVALID_RESPONSE');

// --- The state schema: one definition, used by the encoder (section 5.3) and the outcome (section 5.5) ---------------

/**
 * The fields each replayable block type must carry, with their rules (E-09 l.135, l.151, l.169, l.179). Every other
 * field of a block is kept as received; together, as one object, they must pass BoundedJsonObjectSchema, so an
 * untrusted start object cannot carry an unbounded tree.
 */
const BLOCK_FIELDS: Readonly<Record<string, Readonly<Record<string, (value: unknown) => boolean>>>> = {
  text: { text: value => typeof value === 'string' },
  thinking: { thinking: value => typeof value === 'string', signature: value => typeof value === 'string' && value !== '' },
  redacted_thinking: { data: value => typeof value === 'string' && value !== '' },
  tool_use: { id: value => IdSchema.safeParse(value).success, name: value => ToolNameSchema.safeParse(value).success, input: value => BoundedJsonObjectSchema.safeParse(value).success },
};

function isReplayableBlock(block: unknown): boolean {
  if (!isRecord(block) || typeof block.type !== 'string' || !Object.hasOwn(BLOCK_FIELDS, block.type)) return false;
  const rules = BLOCK_FIELDS[block.type]!;
  for (const [field, rule] of Object.entries(rules)) if (!Object.hasOwn(block, field) || !rule(block[field])) return false;
  // Object.fromEntries defines each key as its own property, `__proto__` included, so none escapes the bound.
  const extra = Object.fromEntries(Object.entries(block).filter(([field]) => field !== 'type' && !Object.hasOwn(rules, field)));
  return BoundedJsonObjectSchema.safeParse(extra).success;
}

/**
 * The strict `anthropic-messages@1` state schema: `data` is JSON of exactly `{ content: Block[] }` with 1 to 512
 * replayable blocks. Returns the content array as parsed (never a rebuilt copy), or undefined for any other shape.
 */
export function parseAnthropicState(data: string): readonly JsonRecord[] | undefined {
  let parsed: unknown;
  try { parsed = JSON.parse(data); } catch { return undefined; }
  if (!isRecord(parsed) || Object.keys(parsed).length !== 1 || !Object.hasOwn(parsed, 'content')) return undefined;
  const content = parsed.content;
  if (!Array.isArray(content) || content.length < 1 || content.length > MAX_BLOCKS || !content.every(isReplayableBlock)) return undefined;
  return content as JsonRecord[];
}

// --- Route and headers (section 5.1) ---------------------------------------------------------------------------------

/** `anthropic-version` and, when a key exists, `Authorization: Bearer` (E-08 l.50-54). Never x-api-key, anthropic-beta or a workspace header. */
export function anthropicHeaders(_profile: InferenceProfile, secret: string | undefined): Record<string, string> {
  return { 'Content-Type': 'application/json', 'anthropic-version': ANTHROPIC_VERSION, ...(secret ? { Authorization: `Bearer ${secret}` } : {}) };
}

// --- The request body (sections 5.2 and 5.3) -------------------------------------------------------------------------

/** An assistant tool step's content: its state's content array, sent unchanged once it matches the canonical step. */
function replayedContent(message: InferenceMessage, calls: readonly ToolCall[]): readonly JsonRecord[] {
  const state = message.providerState;
  // Never rebuilt: a reconstructed thinking block is a 400 (E-12 l.167; source-plan.md:647).
  if (!state || state.format !== PROVIDER_STATE_FORMATS.anthropic) return refuse();
  const content = parseAnthropicState(state.data) ?? refuse();
  // The engine executes the canonical calls, so the replayed call must be the one whose result follows. JSON text,
  // not deep equality: the state's input went through JSON.stringify, so a -0 in the canonical call is 0 there.
  const uses = content.filter(block => block.type === 'tool_use');
  if (uses.length !== calls.length) return refuse();
  uses.forEach((block, index) => {
    const call = calls[index]!;
    if (block.id !== call.id || block.name !== call.name || JSON.stringify(block.input) !== JSON.stringify(call.input)) refuse();
  });
  if (content.filter(block => block.type === 'text').map(block => block.text).join('') !== message.content) return refuse();
  return content;
}

/**
 * The Messages request: `{ model, max_tokens, system?, messages, tools?, stream: true }` in that key order (section 5.2).
 * Pure: the same input gives the same bytes. Every refusal is INVALID_INFERENCE_REQUEST, before any fetch.
 */
export function encodeAnthropic(profile: InferenceProfile, transcript: CheckedTranscript, tools: readonly ToolSpec[]): string {
  const source = transcript.messages;
  // There is no system role for input messages (E-09 l.115): the engine's one system message, first, becomes `system`.
  const lifted = source[0]?.role === 'system';
  const system = lifted ? source[0]!.content : '';
  const messages: Array<{ role: 'user' | 'assistant'; content: unknown }> = [];
  let results: unknown[] | undefined;
  for (const message of lifted ? source.slice(1) : source) {
    if (message.role === 'tool') {
      // A run of tool results is one user message of tool_result blocks only, in transcript order (E-11 l.143, l.316).
      if (!results) { results = []; messages.push({ role: 'user', content: results }); }
      results.push({ type: 'tool_result', tool_use_id: message.toolCallId, content: message.content });
      continue;
    }
    results = undefined;
    if (message.role === 'system') return refuse();
    // Consecutive user messages are sent as they are, never merged (E-09 l.62).
    if (message.role === 'user') messages.push({ role: 'user', content: message.content });
    else messages.push({ role: 'assistant', content: message.toolCalls ? replayedContent(message, message.toolCalls) : message.content });
  }
  // A request ending with an assistant message is a prefill, a 400 on Claude 4.6 and later (E-12 l.149-157).
  if (messages.at(-1)?.role !== 'user') return refuse();
  return JSON.stringify({
    model: profile.model, max_tokens: profile.outputTokens, ...(system ? { system } : {}), messages,
    ...(tools.length ? { tools: tools.map(item => ({ name: item.name, description: item.description, input_schema: item.parameters })) } : {}),
    stream: true,
  });
}

// --- The stream reader (section 5.4) ---------------------------------------------------------------------------------

const KNOWN_BLOCKS = new Set(['text', 'thinking', 'redacted_thinking', 'tool_use']);
const KNOWN_EVENTS = new Set(['message_start', 'content_block_start', 'content_block_delta', 'content_block_stop', 'message_delta', 'message_stop']);
const USAGE_FIELDS = ['input_tokens', 'cache_read_input_tokens', 'cache_creation_input_tokens', 'output_tokens'] as const;
type Usage = { -readonly [field in typeof USAGE_FIELDS[number]]?: number };
interface OpenBlock { fields: JsonRecord; partialJson: string; known: boolean; replayable: boolean; closed: boolean; signed: boolean }

/** Each usage field takes the latest count from any event carrying it: the counts are cumulative (section 5.6). */
function observeUsage(usage: Usage, raw: unknown): void {
  if (!isRecord(raw)) return;
  for (const field of USAGE_FIELDS) {
    const value = raw[field];
    if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) usage[field] = value;
  }
}

/** Applies one content_block_delta to the open block; `text` counts the answer's characters across text blocks. */
function applyDelta(block: OpenBlock, delta: unknown, text: { length: number }): void {
  // Any delta on an unknown block is ignored (the block is already not replayable).
  if (!block.known) return;
  if (!isRecord(delta) || typeof delta.type !== 'string') return invalid();
  const type = block.fields.type;
  // Types before accumulation: a delta extends a start field only when both are strings, since JavaScript would
  // coerce `null + 'Hi'` into 'nullHi', a string the provider never sent.
  const extend = (field: string, piece: unknown): number => {
    const current = block.fields[field];
    if (typeof piece !== 'string' || typeof current !== 'string') return invalid();
    block.fields[field] = current + piece;
    return piece.length;
  };
  switch (delta.type) {
    case 'text_delta':
      if (type !== 'text') return invalid();
      text.length += extend('text', delta.text);
      if (text.length > MAX_TEXT) fail('PROVIDER_RESPONSE_TOO_LARGE');
      return;
    case 'thinking_delta':
      if (type !== 'thinking') return invalid();
      extend('thinking', delta.thinking);
      return;
    case 'signature_delta':
      // "a single `signature_delta`" (E-10 l.135): it replaces the start's value, which may be absent or a string.
      if (type !== 'thinking') return invalid();
      if (block.signed || typeof delta.signature !== 'string' || (block.fields.signature !== undefined && typeof block.fields.signature !== 'string')) return invalid();
      block.fields.signature = delta.signature;
      block.signed = true;
      return;
    case 'input_json_delta':
      // Its own text, which starts empty and never touches the start's `input` (the first piece may be "", E-10 l.324).
      if (type !== 'tool_use') return invalid();
      if (typeof delta.partial_json !== 'string') return invalid();
      block.partialJson += delta.partial_json;
      if (block.partialJson.length > MAX_PARTIAL_JSON) invalid();
      return;
    default:
      // An unknown delta type: ignored, and the block keeps what its known deltas gave, but it is no longer replayable.
      block.replayable = false;
  }
}

/**
 * Reads a 2xx Messages answer as server-sent events, whatever its Content-Type says (section 5.4; D3 records the live
 * label), and folds it. Decides no outcome; bounded by the stream cap, the joined text, the block counts and the
 * partial JSON per call. Reading ends at message_stop, which cancels the rest of the body.
 */
export async function readAnthropic(response: Response): Promise<AnthropicFold> {
  let started = false; let stopped = false; let stopReason: string | null = null;
  const blocks: OpenBlock[] = []; const usage: Usage = {}; const text = { length: 0 };
  let open: OpenBlock | undefined; let toolUses = 0;
  for await (const { event, data } of readSseEvents(response)) {
    if (!isRecord(data) || typeof data.type !== 'string') return invalid();
    const type = data.type;
    // "Each event uses an SSE event name ... and includes the matching event `type` in its data" (E-10 l.63).
    if (event !== undefined && event !== type) return invalid();
    if (type === 'ping') continue;
    // An error after the 200 (E-10 l.78-86; E-12 l.43). Its text is never kept: not in the message, not as a cause.
    if (type === 'error') throw new Error('PROVIDER_STREAM_ERROR');
    // "handle unknown event types gracefully" (E-10 l.91), before message_start too.
    if (!KNOWN_EVENTS.has(type)) continue;
    if (type === 'message_start') {
      if (started) return invalid();
      started = true;
      observeUsage(usage, isRecord(data.message) ? data.message.usage : undefined);
      continue;
    }
    if (!started) return invalid();
    switch (type) {
      case 'content_block_start': {
        // Indices are positions in the final content array (E-10 l.68): one block open at a time, in order.
        if (open) return invalid();
        if (data.index !== blocks.length) return invalid();
        if (blocks.length >= MAX_BLOCKS) return invalid();
        const start = data.content_block;
        if (!isRecord(start) || typeof start.type !== 'string') return invalid();
        if (start.type === 'tool_use' && ++toolUses > MAX_TOOL_USES) return invalid();
        if (start.type === 'text' && typeof start.text === 'string') {
          text.length += start.text.length;
          if (text.length > MAX_TEXT) fail('PROVIDER_RESPONSE_TOO_LARGE');
        }
        // Kept as received; a type that is not an input block (such as `fallback`, E-09 l.121-256) is not replayable.
        // Spread defines each key as its own property, `__proto__` included.
        const known = KNOWN_BLOCKS.has(start.type);
        open = { fields: { ...start }, partialJson: '', known, replayable: known, closed: false, signed: false };
        blocks.push(open);
        break;
      }
      case 'content_block_delta':
        if (!open || data.index !== blocks.length - 1) return invalid();
        applyDelta(open, data.delta, text);
        break;
      case 'content_block_stop':
        if (!open || data.index !== blocks.length - 1) return invalid();
        open.closed = true;
        open = undefined;
        break;
      case 'message_delta': {
        const reason = isRecord(data.delta) ? data.delta.stop_reason : undefined;
        if (reason !== null && reason !== undefined) {
          if (typeof reason !== 'string' || (stopReason !== null && reason !== stopReason)) return invalid();
          stopReason = reason;
        }
        observeUsage(usage, data.usage);
        break;
      }
      case 'message_stop':
        if (open) return invalid();
        stopped = true;
        break;
    }
    // Leaving the loop stops readSseEvents, whose reader cancels the body: bytes after message_stop are never parsed.
    if (stopped) break;
  }
  return { started, stopped, stopReason, usage, blocks: blocks.map(block => ({ fields: block.fields, partialJson: block.partialJson, replayable: block.replayable, closed: block.closed })) };
}

// --- The outcome and its state (sections 5.5 and 5.6) ----------------------------------------------------------------

function usageOf(usage: AnthropicFold['usage']): Pick<Completion, 'usage'> {
  // All three input counts count toward the window (E-13 l.32); usage only when both counts were seen (E-10 l.388-425).
  if (usage.input_tokens === undefined || usage.output_tokens === undefined) return {};
  const inputTokens = usage.input_tokens + (usage.cache_read_input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0);
  return Number.isSafeInteger(inputTokens) ? { usage: { inputTokens, outputTokens: usage.output_tokens } } : {};
}

/** The checked completion: nothing leaves complete() that CompletionSchema, and so the engine, would refuse. */
function completion(value: Completion): Completion {
  if (value.content.length > MAX_TEXT) fail('PROVIDER_RESPONSE_TOO_LARGE');
  const parsed = CompletionSchema.safeParse(value);
  return parsed.success ? parsed.data : invalid();
}

/** A final answer's content: the text blocks joined in order with no separator; a text that is not a string is refused, never coerced. */
function answerText(blocks: readonly FoldedBlock[]): string {
  return blocks.filter(block => block.fields.type === 'text').map(block => typeof block.fields.text === 'string' ? block.fields.text : invalid()).join('');
}

/** A `tool_use` stop: the calls and the state, the state checked as the encoder will check it (section 5.5). */
function toolCallsOutcome(fold: AnthropicFold, check: { tools: readonly ToolSpec[]; usedIds: ReadonlySet<string> }): Completion {
  const blocks = fold.blocks;
  if (!blocks.some(block => block.fields.type === 'tool_use')) return invalid();
  const content = blocks.map((block): JsonRecord => {
    if (!block.replayable) return invalid();
    if (!block.closed) return invalid();
    if (block.fields.type === 'thinking' && (typeof block.fields.signature !== 'string' || block.fields.signature === '')) return invalid();
    if (block.fields.type !== 'tool_use') return { ...block.fields };
    // The input is parsed only here, for a tool_use stop; an empty join takes the start object's `input`, `{}` (E-10 l.321).
    let input: unknown = block.fields.input;
    if (block.partialJson !== '') try { input = JSON.parse(block.partialJson); } catch { return invalid(); }
    return { ...block.fields, input };
  });
  const allowed = new Set(check.tools.map(item => item.name));
  const calls = InferenceToolCallsSchema.safeParse(content.filter(block => block.type === 'tool_use').map(block => ({ id: block.id, name: block.name, input: block.input })));
  if (!calls.success) return invalid();
  if (calls.data.some(call => !allowed.has(call.name))) return invalid();
  if (calls.data.some(call => check.usedIds.has(call.id))) return invalid();
  // What Anthropic's own loop sends back: the accumulated content array, every block in index order (E-10 l.59;
  // E-11 l.611-613). An extra field nested too deep for JSON.stringify's recursion is refused, not a stack overflow.
  // "Kept as received" means as JSON values, not bytes: the state is written again from the parsed events, so a number
  // past double precision is rounded, 1e400 becomes null, integer-like keys move first and an escape is written plain.
  // Every string keeps its value, signatures included. This is inherent to reading JSON here; D5 shows any live effect.
  let data: string;
  try { data = JSON.stringify({ content }); } catch { return invalid(); }
  if (data.length > PROVIDER_STATE_MAX) fail('PROVIDER_RESPONSE_TOO_LARGE');
  // The encoder's own schema, so a state it would refuse at step 2 fails here, before step 1's tools run.
  if (!parseAnthropicState(data)) return invalid();
  const appendOnly = content.some(block => block.type === 'thinking' || block.type === 'redacted_thinking');
  const text = content.filter(block => block.type === 'text').map(block => block.text).join('');
  return completion({ ...usageOf(fold.usage), content: text, outcome: 'tool_calls', toolCalls: calls.data, providerState: { format: PROVIDER_STATE_FORMATS.anthropic, appendOnly, data } });
}

/**
 * The stop map (section 5.5; E-11 l.20-28), keyed on `stop_reason` alone: `stop_details` is never read (E-09
 * l.1173-1178 and E-11 l.399 disagree on when it is set). Pure. Only a tool_calls outcome carries state; a final
 * answer drops blocks of unknown types and keeps a text block's text past an unknown delta.
 */
export function anthropicOutcome(fold: AnthropicFold, check: { tools: readonly ToolSpec[]; usedIds: ReadonlySet<string> }): Completion {
  if (!fold.started) return invalid();
  const usage = usageOf(fold.usage);
  // A stream cut short, or one that never said why it stopped, is incomplete: no calls, no state.
  const reason = fold.stopped ? fold.stopReason : null;
  switch (reason) {
    case null: return completion({ ...usage, content: answerText(fold.blocks), outcome: 'incomplete' });
    case 'tool_use': return toolCallsOutcome(fold, check);
    case 'end_turn': case 'stop_sequence': {
      // The Phase 1 rule: a call under a stop that is not tool_use is never executed.
      const outcome = fold.blocks.some(block => block.fields.type === 'tool_use') ? 'incomplete' : 'complete';
      return completion({ ...usage, content: answerText(fold.blocks), outcome });
    }
    // "Treat the response as truncated" (E-11 l.28).
    case 'max_tokens': case 'model_context_window_exceeded': return completion({ ...usage, content: answerText(fold.blocks), outcome: 'incomplete' });
    // "a normal HTTP 200 response, not an error" (E-11 l.379).
    case 'refusal': return completion({ ...usage, content: answerText(fold.blocks), outcome: 'blocked' });
    // pause_turn belongs to server tools, which MoonAliza never sends (E-11 l.26, l.347); any other value is a failure.
    default: return fail('PROVIDER_FINISH_FAILED');
  }
}

// --- Refusals and retries (sections 5.7 and 5.8) ---------------------------------------------------------------------

/** True only for a JSON body whose error is `invalid_request_error` saying "prompt is too long" (E-13 l.150; E-12 l.60-77). */
export function isAnthropicOverflow(text: string): boolean {
  let body: unknown;
  try { body = JSON.parse(text); } catch { return false; }
  const error = isRecord(body) ? body.error : undefined;
  return isRecord(error) && error.type === 'invalid_request_error' && typeof error.message === 'string' && /prompt is too long/i.test(error.message);
}

/**
 * Milliseconds before retrying a refused answer, or undefined for never (section 5.8). A 429 waits its integer
 * `retry-after` ("The number of seconds to wait", E-14 l.108); without one it is the spend cap, never retried (E-14
 * l.62-63). Any 5xx, 529 included, waits its integer `retry-after`, else 1 s and then 2 s (E-12 l.34-41). post()
 * bounds the count and the deadline.
 */
export function anthropicRetryDelayMs(response: Response, attempt: number): number | undefined {
  const header = response.headers.get('retry-after');
  const seconds = header !== null && /^\d+$/.test(header) ? Number(header) * 1000 : undefined;
  if (response.status === 429) return seconds;
  if (response.status >= 500 && response.status <= 599) return seconds ?? (attempt === 0 ? 1000 : 2000);
  return undefined;
}

export const anthropicKind: KindPart<AnthropicFold> = {
  url: endpoint => `${endpoint}/messages`,
  headers: anthropicHeaders,
  timeoutMs: 600_000,
  owns: [PROVIDER_STATE_FORMATS.anthropic],
  refusalStatuses: [400],
  body: (profile, transcript, tools) => encodeAnthropic(profile, transcript, tools),
  read: readAnthropic,
  outcome: anthropicOutcome,
  isOverflow: isAnthropicOverflow,
  retryDelayMs: anthropicRetryDelayMs,
};
