import { z } from 'zod';
import type { InferenceMessage } from '../main/inference';
import type { ToolSpec } from '../shared';
import type { ContextState } from '../shared/context';

export interface ContextMessage extends InferenceMessage { resultId?: string }
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

/** Heuristic for arbitrary model/tokenizer families; includes declarations and framing reserve.
 * Never presented as exact accounting or used to increase a provider's actual context window. */
export function estimateInput(messages: InferenceMessage[], tools: ToolSpec[]): number {
  return Math.ceil(Buffer.byteLength(JSON.stringify({ messages, tools: tools.map(tool => ({ type: 'function', function: tool })) }), 'utf8') / 2) + 256 + messages.length * 8;
}

export function assembleContext(input: { system: InferenceMessage; history: InferenceMessage[][]; current: ContextMessage[]; tools: ToolSpec[]; contextTokens: number; outputTokens: number }) {
  const history = input.history.map(turn => [...turn]);
  const current = input.current.map(message => excerpt(message, 3072));
  const inputBudgetTokens = Math.max(0, input.contextTokens - input.outputTokens);
  let omittedHistoryMessages = 0;
  const messages = () => [input.system, ...history.flat(), ...current];
  const over = () => estimateInput(messages(), input.tools) > inputBudgetTokens || messages().length > 1000;
  while (history.length && over()) omittedHistoryMessages += history.shift()!.length;
  // Preserve every current call/result pair; only reduce retrievable result bodies.
  for (let i = 0; i < current.length && over(); i++) current[i] = excerpt(input.current[i]!, 0);
  const wire = messages();
  const state: ContextState = { estimator: 'utf8-estimate', estimatedInputTokens: estimateInput(wire, input.tools), inputBudgetTokens,
    contextTokens: input.contextTokens, reservedOutputTokens: input.outputTokens, omittedHistoryMessages,
    compactedToolResults: current.filter((message, i) => message.content !== input.current[i]!.content).length };
  return { messages: wire, state, fits: !!input.current.length && !over() };
}
