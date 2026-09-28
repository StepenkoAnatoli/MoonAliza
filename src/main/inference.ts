import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { BoundedJsonObjectSchema, CompletionSchema, InferenceMessagesSchema, InferenceToolsSchema, InferenceToolCallsSchema } from '../engine/control';
import { IdSchema, type ToolCall, type ToolSpec } from '../shared';

export type ProviderKind = 'openai-compatible' | 'openai-responses' | 'anthropic' | 'ollama';
export interface InferenceProfile { kind: ProviderKind; endpoint: string; model: string; outputTokens: number; contextTokens?: number }
export interface InferenceMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; toolCalls?: ToolCall[]; toolCallId?: string; toolName?: string }
export interface Completion { content: string; outcome: 'complete' | 'incomplete' | 'blocked' | 'tool_calls'; toolCalls?: ToolCall[] }
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export function validateEndpoint(kind: ProviderKind, value: string): { endpoint: string; locality: 'local' | 'external' } {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('INVALID_ENDPOINT'); }
  if (url.username || url.password || url.search || url.hash || value.length > 2048) throw new Error('INVALID_ENDPOINT');
  const loopback = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || (kind === 'ollama' && !loopback)) throw new Error('INVALID_ENDPOINT');
  return { endpoint: url.href.replace(/\/+$/, ''), locality: loopback ? 'local' : 'external' };
}

export async function readBoundedJson(response: Response, maxBytes = 4 * 1024 * 1024): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('PROVIDER_EMPTY_RESPONSE');
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); throw new Error('PROVIDER_RESPONSE_TOO_LARGE'); }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new Error('PROVIDER_INVALID_RESPONSE'); }
}

const ChatSchema = z.object({ choices: z.array(z.object({ message: z.object({ role: z.literal('assistant').optional(), content: z.string().max(2_000_000).nullable().optional(), refusal: z.string().max(2_000_000).nullable().optional(), tool_calls: z.unknown().optional() }), finish_reason: z.string().max(128).nullable().optional() })).length(1) });
const OllamaSchema = z.object({ message: z.object({ role: z.literal('assistant').optional(), content: z.string().max(2_000_000), tool_calls: z.unknown().optional() }), done: z.boolean(), done_reason: z.string().max(128).optional() });
const FunctionName = z.string().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/);
const OpenAICalls = z.array(z.object({ id: IdSchema, type: z.literal('function'), function: z.object({ name: FunctionName, arguments: z.string().max(131072) }).strict() }).strict()).min(1).max(128);
const OllamaCalls = z.array(z.object({ id: IdSchema.optional(), function: z.object({ index: z.number().int().nonnegative().max(127).optional(), name: FunctionName, arguments: BoundedJsonObjectSchema, description: z.string().max(16384).optional() }).strict() }).strict()).min(1).max(128);

/** Canonical history must contain complete, unambiguous tool interaction groups. */
function encodeMessages(messages: InferenceMessage[], local: boolean): { messages: unknown[]; usedIds: Set<string> } {
  const parsed = InferenceMessagesSchema.safeParse(messages);
  if (!parsed.success) throw new Error('INVALID_INFERENCE_REQUEST');
  const pending = new Map<string, ToolCall>();
  const usedIds = new Set<string>();
  const encoded: unknown[] = [];
  for (const message of parsed.data) {
    if (message.role === 'tool') {
      const call = pending.get(message.toolCallId!);
      if (!call || (message.toolName !== undefined && message.toolName !== call.name)) throw new Error('INVALID_INFERENCE_REQUEST');
      pending.delete(call.id);
      encoded.push({ role: 'tool', content: message.content, tool_call_id: call.id, ...(local ? { tool_name: call.name } : {}) });
      continue;
    }
    if (pending.size) throw new Error('INVALID_INFERENCE_REQUEST');
    const toolCalls = message.toolCalls?.map((call, index) => {
      if (usedIds.has(call.id)) throw new Error('INVALID_INFERENCE_REQUEST');
      usedIds.add(call.id); pending.set(call.id, call);
      return local
        ? { id: call.id, function: { index, name: call.name, arguments: call.input } }
        : { id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.input) } };
    });
    encoded.push({ role: message.role, content: message.content, ...(toolCalls ? { tool_calls: toolCalls } : {}) });
  }
  if (pending.size) throw new Error('INVALID_INFERENCE_REQUEST');
  return { messages: encoded, usedIds };
}

function parseCalls(raw: unknown, local: boolean, tools: ToolSpec[], usedIds: Set<string>): ToolCall[] {
  try {
    const calls = local
      ? OllamaCalls.parse(raw).map(call => ({ id: call.id ?? `ollama-${randomUUID()}`, name: call.function.name, input: call.function.arguments }))
      : OpenAICalls.parse(raw).map(call => ({ id: call.id, name: call.function.name, input: BoundedJsonObjectSchema.parse(JSON.parse(call.function.arguments)) }));
    const allowed = new Set(tools.map(tool => tool.name));
    const validated = InferenceToolCallsSchema.parse(calls);
    if (validated.some(call => usedIds.has(call.id) || !allowed.has(call.name))) throw new Error('Invalid call');
    return validated;
  } catch { throw new Error('PROVIDER_INVALID_RESPONSE'); }
}

function hasCalls(raw: unknown): boolean { return raw !== undefined && (!Array.isArray(raw) || raw.length > 0); }

/** The caller supplies the correct main-owned network session and obtains credentials from the vault. */
export async function complete(profile: InferenceProfile, messages: InferenceMessage[], options: { fetcher: Fetcher; secret?: string; signal: AbortSignal; tools?: ToolSpec[]; managedOllama?: { numGpu: 0; keepAlive: -1 } }): Promise<Completion> {
  if (options.signal.aborted) throw new Error('RUN_CANCELLED');
  const { endpoint } = validateEndpoint(profile.kind, profile.endpoint);
  if (!profile.model || !Number.isInteger(profile.outputTokens) || profile.outputTokens < 1) throw new Error('INVALID_PROFILE');
  if (profile.contextTokens !== undefined && (!Number.isInteger(profile.contextTokens) || profile.contextTokens < profile.outputTokens || profile.contextTokens > 2_000_000)) throw new Error('INVALID_PROFILE');
  // Other adapters are admitted only after their response and terminal-state contracts are implemented.
  if (profile.kind !== 'openai-compatible' && profile.kind !== 'ollama') throw new Error('NOT_IMPLEMENTED');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.secret) headers.Authorization = `Bearer ${options.secret}`;
  const signal = AbortSignal.any([options.signal, AbortSignal.timeout(120_000)]);
  const local = profile.kind === 'ollama';
  if (options.managedOllama && (!local || options.secret || !profile.contextTokens || options.managedOllama.numGpu !== 0 || options.managedOllama.keepAlive !== -1)) throw new Error('INVALID_PROFILE');
  const history = encodeMessages(messages, local);
  const declaredTools = InferenceToolsSchema.safeParse(options.tools ?? []);
  if (!declaredTools.success) throw new Error('INVALID_INFERENCE_REQUEST');
  const tools = declaredTools.data;
  const requestBody = JSON.stringify({ model: profile.model, messages: history.messages,
    ...(tools.length ? { tools: tools.map(tool => ({ type: 'function', function: tool })) } : {}),
    ...(local ? { options: { num_predict: profile.outputTokens, ...(profile.contextTokens ? { num_ctx: profile.contextTokens } : {}), ...(options.managedOllama ? { num_gpu: options.managedOllama.numGpu } : {}) }, ...(options.managedOllama ? { keep_alive: options.managedOllama.keepAlive, truncate: false, shift: false } : {}) } : { max_completion_tokens: profile.outputTokens }), stream: false });
  if (Buffer.byteLength(requestBody) > 8 * 1024 * 1024) throw new Error('INVALID_INFERENCE_REQUEST');
  const response = await options.fetcher(`${endpoint}${local ? '/api/chat' : '/chat/completions'}`, {
    method: 'POST', headers, signal, redirect: 'error',
    body: requestBody,
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error(`PROVIDER_HTTP_${response.status}`); }
  const data = await readBoundedJson(response);
  if (options.signal.aborted) throw new Error('RUN_CANCELLED');
  if (local) {
    const parsed = OllamaSchema.safeParse(data);
    if (!parsed.success) throw new Error('PROVIDER_INVALID_RESPONSE');
    const content = parsed.data.message.content;
    if (!parsed.data.done || parsed.data.done_reason !== 'stop') return { content, outcome: 'incomplete' };
    if (hasCalls(parsed.data.message.tool_calls)) return CompletionSchema.parse({ content, outcome: 'tool_calls', toolCalls: parseCalls(parsed.data.message.tool_calls, true, tools, history.usedIds) });
    return { content, outcome: 'complete' };
  }
  const parsed = ChatSchema.safeParse(data);
  if (!parsed.success) throw new Error('PROVIDER_INVALID_RESPONSE');
  const choice = parsed.data.choices[0]!;
  const content = choice.message.content ?? choice.message.refusal ?? '';
  if (choice.message.refusal || choice.finish_reason === 'content_filter') return { content, outcome: 'blocked' };
  if (choice.finish_reason === 'tool_calls') return CompletionSchema.parse({ content, outcome: 'tool_calls', toolCalls: parseCalls(choice.message.tool_calls, false, tools, history.usedIds) });
  return { content, outcome: choice.finish_reason === 'stop' && !hasCalls(choice.message.tool_calls) ? 'complete' : 'incomplete' };
}
