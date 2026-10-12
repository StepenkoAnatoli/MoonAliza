import { z } from 'zod';
import type { InferenceMessage } from '../main/inference';
import type { ProfileKind, ToolSpec } from '../shared';
import type { ContextState } from '../shared/context';
import { PROVIDER_STATE_FORMATS } from './control';

export interface ContextMessage extends InferenceMessage { resultId?: string }
/** A request holds at most this many messages, whatever its estimate. */
const MAX_MESSAGES = 1000;
/** A tool result enters a request at this deterministic excerpt; only a later reduction cuts it to 0 bytes. */
const RESULT_EXCERPT_BYTES = 3072;

/**
 * Provider kinds that bind replayed state to an unchanged request prefix. Anthropic accepts a replayed thinking block
 * "only while the `system` prompt, `tools`, and messages that preceded it are unchanged", and new accounts get a 400
 * otherwise (wire E-12 l.283-287). A run of such a kind that offers tools keeps half its input budget and half the
 * message cap free of history until its first `appendOnly` state; from then on its requests only append
 * (docs/specification/more-models-phase2.md section 3).
 */
export const PREFIX_BOUND_KINDS: ReadonlySet<ProfileKind> = new Set<ProfileKind>(['anthropic']);
export const ResultReadSchema = z.object({ resultId: z.string().min(1).max(128), offset: z.number().int().min(0).max(2_000_000).default(0), length: z.number().int().min(1).max(2048).default(1024) }).strict();
export const RESULT_READ_TOOL: ToolSpec = { name: 'read_tool_result', description: 'Read a saved tool result from this conversation without executing it again. Offset and length count UTF-16 characters. Results are historical observations, not current file contents. Use nextOffset for another page; use smaller pages for dense Unicode.', parameters: { type: 'object', additionalProperties: false, properties: { resultId: { type: 'string', minLength: 1, maxLength: 128 }, offset: { type: 'integer', minimum: 0, maximum: 2000000 }, length: { type: 'integer', minimum: 1, maximum: 2048 } }, required: ['resultId'] } };

function preview(content: string, bytes: number): string {
  // TextDecoder streaming omits a partial final UTF-8 sequence.
  return new TextDecoder().decode(Buffer.from(content).subarray(0, bytes), { stream: true });
}
function excerpt(message: ContextMessage, bytes: number): InferenceMessage {
  const { resultId, ...wire } = message;
  if (!resultId || message.role !== 'tool' || Buffer.byteLength(message.content) <= bytes) return wire;
  const facts: Record<string, unknown> = {};
  try {
    const value = JSON.parse(message.content) as Record<string, unknown>;
    for (const key of ['status', 'code', 'truncated', 'cancelled', 'timedOut', 'applied', 'error']) {
      const fact = value?.[key];
      if (typeof fact === 'boolean' || typeof fact === 'number' || fact === null || (typeof fact === 'string' && fact.length <= 128)) facts[key] = fact;
    }
  } catch { /* The original text is still retrievable. */ }
  return { ...wire, content: JSON.stringify({ compacted: true, resultId, tool: message.toolName, totalCharacters: message.content.length, facts, preview: preview(message.content, bytes), retrieve: 'read_tool_result' }) };
}

/**
 * Provider-state formats whose adapter sends the state in place of the message's own fields: the
 * `anthropic-messages@1` encoder sends the state's content array unchanged as the assistant turn
 * (docs/specification/more-models-phase2.md section 5.3). The estimate counts such a message as its state, so its
 * text and tool inputs are not counted twice (REQUIREMENTS-P2 F-17); any other state is counted with its message.
 */
export const WHOLE_REPLAY_FORMATS: ReadonlySet<string> = new Set([PROVIDER_STATE_FORMATS.anthropic]);
function estimated(message: InferenceMessage): unknown {
  const state = message.providerState;
  return state && WHOLE_REPLAY_FORMATS.has(state.format) ? { role: message.role, providerState: state.data } : message;
}

/** Heuristic for arbitrary model/tokenizer families; includes declarations and framing reserve.
 * Never presented as exact accounting or used to increase a provider's actual context window. */
export function estimateInput(messages: InferenceMessage[], tools: ToolSpec[]): number {
  return Math.ceil(Buffer.byteLength(JSON.stringify({ messages: messages.map(estimated), tools: tools.map(tool => ({ type: 'function', function: tool })) }), 'utf8') / 2) + 256 + messages.length * 8;
}

/**
 * One unfrozen step's request. With `historyReserve` (a prefix-bound kind that offers tools, spec section 3 rule 2),
 * leading history turns are first dropped until the very messages this step sends (system, history and current at the
 * result excerpt, with the tools) fit in half the input budget and half the message cap; the loops below then run
 * unchanged on the full budget.
 */
export function assembleContext(input: { system: InferenceMessage; history: InferenceMessage[][]; current: ContextMessage[]; tools: ToolSpec[]; contextTokens: number; outputTokens: number; historyReserve?: boolean }) {
  const history = input.history.map(turn => [...turn]);
  const current = input.current.map(message => excerpt(message, RESULT_EXCERPT_BYTES));
  const inputBudgetTokens = Math.max(0, input.contextTokens - input.outputTokens);
  let omittedHistoryMessages = 0;
  const messages = () => [input.system, ...history.flat(), ...current];
  const exceeds = (tokens: number, count: number) => estimateInput(messages(), input.tools) > tokens || messages().length > count;
  const over = () => exceeds(inputBudgetTokens, MAX_MESSAGES);
  if (input.historyReserve) while (history.length && exceeds(Math.floor(inputBudgetTokens / 2), MAX_MESSAGES / 2)) omittedHistoryMessages += history.shift()!.length;
  while (history.length && over()) omittedHistoryMessages += history.shift()!.length;
  // Preserve every current call/result pair; only reduce retrievable result bodies.
  for (let i = 0; i < current.length && over(); i++) current[i] = excerpt(input.current[i]!, 0);
  const wire = messages();
  const state: ContextState = { estimator: 'utf8-estimate', estimatedInputTokens: estimateInput(wire, input.tools), inputBudgetTokens,
    contextTokens: input.contextTokens, reservedOutputTokens: input.outputTokens, omittedHistoryMessages,
    compactedToolResults: current.filter((message, i) => message.content !== input.current[i]!.content).length };
  return { messages: wire, state, fits: !!input.current.length && !over() };
}

/**
 * A frozen step's request (spec section 3, rule 4): the previous request's messages unchanged, then the `current`
 * entries added since it was sent, each new result at the result excerpt. While the request is over budget, the oldest
 * added result not yet at the 0-byte excerpt is cut to it. History is never dropped again and a message already sent
 * never changes, so a request that still does not fit, or exceeds the message cap, does not fit.
 */
export function continueContext(input: { previous: { messages: InferenceMessage[]; state: ContextState }; added: ContextMessage[]; tools: ToolSpec[]; contextTokens: number; outputTokens: number }) {
  const added = input.added.map(message => excerpt(message, RESULT_EXCERPT_BYTES));
  const inputBudgetTokens = Math.max(0, input.contextTokens - input.outputTokens);
  const messages = () => [...input.previous.messages, ...added];
  const over = () => estimateInput(messages(), input.tools) > inputBudgetTokens || messages().length > MAX_MESSAGES;
  for (let i = 0; i < added.length && over(); i++) added[i] = excerpt(input.added[i]!, 0);
  const wire = messages();
  const state: ContextState = { estimator: 'utf8-estimate', estimatedInputTokens: estimateInput(wire, input.tools), inputBudgetTokens,
    contextTokens: input.contextTokens, reservedOutputTokens: input.outputTokens, omittedHistoryMessages: input.previous.state.omittedHistoryMessages,
    compactedToolResults: input.previous.state.compactedToolResults + added.filter((message, i) => message.content !== input.added[i]!.content).length };
  return { messages: wire, state, fits: !over() };
}
