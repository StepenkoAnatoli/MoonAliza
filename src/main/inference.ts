import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { BoundedJsonObjectSchema, CompletionSchema, InferenceMessagesSchema, InferenceToolsSchema, InferenceToolCallsSchema, type ProviderState } from '../engine/control';
import { IdSchema, type ToolCall, type ToolSpec } from '../shared';
import { TokenUsageSchema, type TokenUsage } from '../shared/context';
import { OllamaAccumulator, OpenAIAccumulator, readNdjson, readSse } from './provider-stream';
import { anthropicKind } from './anthropic';
import type { CheckedTranscript, KindPart } from './provider-kind';

export type ProviderKind = 'openai-compatible' | 'openai-responses' | 'anthropic' | 'ollama';
export interface InferenceProfile { kind: ProviderKind; endpoint: string; model: string; outputTokens: number; contextTokens?: number }
export interface InferenceMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; toolCalls?: ToolCall[]; toolCallId?: string; toolName?: string; providerState?: ProviderState }
export interface Completion { content: string; outcome: 'complete' | 'incomplete' | 'blocked' | 'tool_calls'; toolCalls?: ToolCall[]; usage?: TokenUsage; providerState?: ProviderState }
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export function validateEndpoint(kind: ProviderKind, value: string): { endpoint: string; locality: 'local' | 'external' } {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('INVALID_ENDPOINT'); }
  if (url.username || url.password || url.search || url.hash || value.length > 2048) throw new Error('INVALID_ENDPOINT');
  const loopback = ['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || (kind === 'ollama' && !loopback)) throw new Error('INVALID_ENDPOINT');
  // An anthropic endpoint is external even on loopback: a local server can implement this API and forward to a cloud
  // (Ollama serves /v1/messages and proxies cloud models), which Moonzila cannot verify (more-models-phase2.md section 7).
  return { endpoint: url.href.replace(/\/+$/, ''), locality: loopback && kind !== 'anthropic' ? 'local' : 'external' };
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

/**
 * The kind-neutral half of a request: canonical history must contain complete, unambiguous tool interaction groups
 * (strict parse, exactly one result per call, no reused id, nothing pending), and a message may carry provider state
 * only in a format the target kind owns (more-models-phase2.md sections 1 and 4). Returns the parsed messages, with any
 * owned state kept for the part that owns it, and the call ids already used.
 */
export function checkTranscript(messages: InferenceMessage[], owns: readonly string[]): CheckedTranscript {
  const parsed = InferenceMessagesSchema.safeParse(messages);
  if (!parsed.success) throw new Error('INVALID_INFERENCE_REQUEST');
  const pending = new Map<string, ToolCall>();
  const usedIds = new Set<string>();
  for (const message of parsed.data) {
    if (message.providerState && !owns.includes(message.providerState.format)) throw new Error('INVALID_INFERENCE_REQUEST');
    if (message.role === 'tool') {
      const call = pending.get(message.toolCallId!);
      if (!call || (message.toolName !== undefined && message.toolName !== call.name)) throw new Error('INVALID_INFERENCE_REQUEST');
      pending.delete(call.id);
      continue;
    }
    if (pending.size) throw new Error('INVALID_INFERENCE_REQUEST');
    for (const call of message.toolCalls ?? []) {
      if (usedIds.has(call.id)) throw new Error('INVALID_INFERENCE_REQUEST');
      usedIds.add(call.id); pending.set(call.id, call);
    }
  }
  if (pending.size) throw new Error('INVALID_INFERENCE_REQUEST');
  return { messages: parsed.data, usedIds };
}

/** The chat kinds' wire messages for a checked transcript: Ollama takes object arguments and names each result's tool. */
function chatMessages(transcript: CheckedTranscript, local: boolean): unknown[] {
  const names = new Map<string, string>();
  return transcript.messages.map(message => {
    if (message.role === 'tool') return { role: 'tool', content: message.content, tool_call_id: message.toolCallId, ...(local ? { tool_name: names.get(message.toolCallId!) } : {}) };
    const toolCalls = message.toolCalls?.map((call, index) => {
      names.set(call.id, call.name);
      return local
        ? { id: call.id, function: { index, name: call.name, arguments: call.input } }
        : { id: call.id, type: 'function', function: { name: call.name, arguments: JSON.stringify(call.input) } };
    });
    return { role: message.role, content: message.content, ...(toolCalls ? { tool_calls: toolCalls } : {}) };
  });
}

function parseCalls(raw: unknown, local: boolean, tools: readonly ToolSpec[], usedIds: ReadonlySet<string>): ToolCall[] {
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

/**
 * The code an inference failure crosses into the engine with. Three are told apart, each because the engine has its
 * own message for it: CONTEXT_LIMIT (an overflow); LOCAL_MODEL_UNVERIFIED (a local Ollama that may send prompts to its
 * cloud, refused under a local-only policy before any prompt byte; docs/specification/more-models.md); and
 * PROVIDER_PROTOCOL_ERROR (a step main refuses to hand over - a secret in a tool call or in a tool step's provider
 * state; docs/specification/more-models-phase2.md section 6). Everything else stays PROVIDER_ERROR, as it always
 * crossed - RUN_CANCELLED included, whose passage would change how a run that lost its trust or policy mid-flight is
 * reported, a separate decision.
 */
export function inferenceErrorCode(error: unknown): 'CONTEXT_LIMIT' | 'LOCAL_MODEL_UNVERIFIED' | 'PROVIDER_PROTOCOL_ERROR' | 'PROVIDER_ERROR' {
  const reason = error instanceof Error ? error.message : '';
  return reason === 'CONTEXT_LIMIT' || reason === 'LOCAL_MODEL_UNVERIFIED' || reason === 'PROVIDER_PROTOCOL_ERROR' ? reason : 'PROVIDER_ERROR';
}

// Providers do not share one overflow code. Accept known structured codes and the
// bounded refusal phrases established by docs/research/2026-09-29-context-overflow.
const OVERFLOW = /context (length|size|window)|maximum context|exceeds? .{0,40}context/i;

/** The chat kinds' overflow rule: a known structured code, or a bounded refusal phrase. */
function isChatOverflow(text: string): boolean {
  let code: unknown;
  try { code = (JSON.parse(text) as { error?: { code?: unknown } } | null)?.error?.code; } catch { /* Plain text is also accepted. */ }
  return ['context_length_exceeded', 'context_window_exceeded', 'prompt_too_long'].includes(String(code)) || OVERFLOW.test(text);
}

/**
 * Refusal bodies are bounded, inspected only for classification and never exposed: at most 64 KiB of a body whose
 * status the part lists is read for its overflow rule; every other body is cancelled unread.
 */
async function refusalCode(response: Response, part: Pick<KindPart<unknown>, 'refusalStatuses' | 'isOverflow'>): Promise<string> {
  const fallback = `PROVIDER_HTTP_${response.status}`;
  if (!part.refusalStatuses.includes(response.status)) { await response.body?.cancel(); return fallback; }
  const reader = response.body?.getReader();
  if (!reader) return fallback;
  const chunks: Uint8Array[] = []; let bytes = 0;
  try {
    while (bytes < 65536) {
      const chunk = await reader.read(); if (chunk.done) break;
      const bounded = chunk.value.subarray(0, 65536 - bytes);
      chunks.push(bounded); bytes += bounded.byteLength;
    }
    return part.isOverflow(Buffer.concat(chunks).toString('utf8')) ? 'CONTEXT_LIMIT' : fallback;
  } catch { return fallback; }
  finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
}

/** A retry wait that Stop ends as RUN_CANCELLED (and the call's own deadline, which no wait is allowed to reach, as itself). */
function pause(ms: number, signal: AbortSignal, stop: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(stop.aborted ? new Error('RUN_CANCELLED') : signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms);
    if (signal.aborted) abort(); else signal.addEventListener('abort', abort, { once: true });
  });
}

/**
 * The one place a chat request's fetch init is built (more-models-phase2.md section 4). A refused answer is retried only
 * when the call allows it (`retry`), the part names a delay for it, fewer than two retries were made and the wait ends
 * before the call's deadline; the refused body is cancelled before the wait. Otherwise the refusal surfaces as
 * CONTEXT_LIMIT or PROVIDER_HTTP_<n>. `signal` is the caller's Stop joined with the call's deadline; `stop` is the
 * caller's alone, so a Stop during a wait is told apart from the deadline.
 */
export async function post(fetcher: Fetcher, url: string, request: { headers: Record<string, string>; body: string; signal: AbortSignal; stop: AbortSignal; deadline: number; retry: boolean }, part: Pick<KindPart<unknown>, 'refusalStatuses' | 'isOverflow' | 'retryDelayMs'>): Promise<Response> {
  for (let retries = 0; ; retries += 1) {
    // credentials: 'omit' (INV-5): no session cookie rides on a chat request, and the key travels only in the explicit
    // Authorization header. By the Fetch standard it also withholds server HTTP authentication and TLS client
    // certificates (untested here). It does not withhold proxy credentials: in the D10 Electron check (44.4.5,
    // 2026-10-12) a chat request still sent the session's cached Proxy-Authorization.
    const response = await fetcher(url, { method: 'POST', headers: request.headers, body: request.body, signal: request.signal, redirect: 'error', credentials: 'omit' });
    if (response.ok) return response;
    const delay = request.retry && retries < 2 ? part.retryDelayMs?.(response, retries) : undefined;
    if (delay === undefined || !(delay >= 0) || Date.now() + delay >= request.deadline) throw new Error(await refusalCode(response, part));
    await response.body?.cancel().catch(() => undefined);
    await pause(delay, request.signal, request.stop);
  }
}

/**
 * Folds a streamed answer back into the one-body shape validated below. Ollama's NDJSON reads a
 * non-streamed body as its single line; an OpenAI-compatible server that ignores `stream` answers
 * with plain JSON rather than `text/event-stream`, and is read as before - except that a top-level
 * `error` that is not null fails it as PROVIDER_STREAM_ERROR, the rule the stream accumulator applies
 * to each chunk (OpenRouter, wire E-25), so the same object is never an answer in one form only.
 */
async function readStreamed(response: Response, local: boolean): Promise<unknown> {
  if (!local && !/^text\/event-stream\b/i.test(response.headers.get('content-type') ?? '')) {
    const body = await readBoundedJson(response);
    if (typeof body === 'object' && body !== null && (body as { error?: unknown }).error != null) throw new Error('PROVIDER_STREAM_ERROR');
    return body;
  }
  const accumulator = local ? new OllamaAccumulator() : new OpenAIAccumulator();
  for await (const chunk of local ? readNdjson(response) : readSse(response)) accumulator.push(chunk);
  return accumulator.result();
}

/**
 * The existing kinds' part (more-models-phase2.md section 4): `openai-compatible` (OpenAI chat completions) and, with
 * `local`, Ollama's native chat. Their requests are byte-identical to the transport before the seam (tests pin them).
 */
export function chatKind(local: boolean): KindPart<unknown> {
  return {
    url: endpoint => `${endpoint}${local ? '/api/chat' : '/chat/completions'}`,
    headers: (_profile, secret) => ({ 'Content-Type': 'application/json', ...(secret ? { Authorization: `Bearer ${secret}` } : {}) }),
    timeoutMs: 120_000,
    owns: [],
    refusalStatuses: [400, 413, 422],
    body: (profile, transcript, tools, extra) => JSON.stringify({ model: profile.model, messages: chatMessages(transcript, local),
      ...(tools.length ? { tools: tools.map(tool => ({ type: 'function', function: tool })) } : {}),
      ...(local ? { options: { num_predict: profile.outputTokens, ...(profile.contextTokens ? { num_ctx: profile.contextTokens } : {}), ...(extra.managedOllama ? { num_gpu: extra.managedOllama.numGpu } : {}) }, truncate: false, shift: false, ...(extra.managedOllama ? { keep_alive: extra.managedOllama.keepAlive } : {}) } : { max_completion_tokens: profile.outputTokens, stream_options: { include_usage: true } }), stream: true }),
    read: response => readStreamed(response, local),
    outcome: (data, { tools, usedIds }) => chatOutcome(data, local, tools, usedIds),
    isOverflow: isChatOverflow,
  };
}

function chatOutcome(data: unknown, local: boolean, tools: readonly ToolSpec[], usedIds: ReadonlySet<string>): Completion {
  const observed = data as { usage?: { prompt_tokens?: unknown; completion_tokens?: unknown }; prompt_eval_count?: unknown; eval_count?: unknown } | null;
  const counts = TokenUsageSchema.safeParse({ inputTokens: local ? observed?.prompt_eval_count : observed?.usage?.prompt_tokens, outputTokens: local ? observed?.eval_count : observed?.usage?.completion_tokens });
  const usage = counts.success ? { usage: counts.data } : {};
  if (local) {
    const parsed = OllamaSchema.safeParse(data);
    if (!parsed.success) throw new Error('PROVIDER_INVALID_RESPONSE');
    const content = parsed.data.message.content;
    if (!parsed.data.done || parsed.data.done_reason !== 'stop') return { ...usage, content, outcome: 'incomplete' };
    if (hasCalls(parsed.data.message.tool_calls)) return CompletionSchema.parse({ ...usage, content, outcome: 'tool_calls', toolCalls: parseCalls(parsed.data.message.tool_calls, true, tools, usedIds) });
    return { ...usage, content, outcome: 'complete' };
  }
  const parsed = ChatSchema.safeParse(data);
  if (!parsed.success) throw new Error('PROVIDER_INVALID_RESPONSE');
  const choice = parsed.data.choices[0]!;
  // finish_reason, streamed or not (docs/specification/more-models.md, Phase 1 design 1): `stop` is
  // complete when it carries no call; `tool_calls`; `length` and Mistral's `model_length` (wire E-22)
  // are incomplete; `content_filter` or a refusal is blocked; no reason at all (a stream cut short) stays
  // incomplete. An empty reason is no reason: the stream accumulator has always skipped it, so a plain JSON
  // answer reads it the same way. Every other value fails the call, before a refusal can make it look
  // blocked: the failures vendors document - `error` (OpenRouter E-25, Mistral E-22),
  // `insufficient_system_resource` and `aborted` (DeepSeek E-20) - and any value not listed here, so a new
  // failure signal is never saved as a partial answer.
  const reason = choice.finish_reason || null;
  if (reason !== null && !['stop', 'tool_calls', 'length', 'model_length', 'content_filter'].includes(reason)) throw new Error('PROVIDER_FINISH_FAILED');
  const content = choice.message.content ?? choice.message.refusal ?? '';
  if (choice.message.refusal || reason === 'content_filter') return { ...usage, content, outcome: 'blocked' };
  if (reason === 'tool_calls') return CompletionSchema.parse({ ...usage, content, outcome: 'tool_calls', toolCalls: parseCalls(choice.message.tool_calls, false, tools, usedIds) });
  return { ...usage, content, outcome: reason === 'stop' && !hasCalls(choice.message.tool_calls) ? 'complete' : 'incomplete' };
}

/** The kinds complete() can send; a kind with no part (openai-responses) is refused. */
const kinds = new Map<ProviderKind, KindPart<unknown>>([
  ['openai-compatible', chatKind(false)],
  ['ollama', chatKind(true)],
  ['anthropic', anthropicKind],
]);

/**
 * The caller supplies the correct main-owned network session and obtains credentials from the vault. The kind-neutral
 * checks run first, in this order, each before any fetch: cancellation, endpoint, profile, the kind's part,
 * managed-Ollama options, the transcript (with state ownership), tools, the body and its 8 MiB cap. Only then is the
 * call's deadline armed (`part.timeoutMs` for every attempt), and the part drives the request.
 */
export async function complete(profile: InferenceProfile, messages: InferenceMessage[], options: { fetcher: Fetcher; secret?: string; signal: AbortSignal; tools?: ToolSpec[]; managedOllama?: { numGpu: 0; keepAlive: -1 }; /** Default true: the kind's retry rule applies. false: never retry; the first refusal surfaces (more-models-phase2.md section 4). */ retry?: boolean }): Promise<Completion> {
  if (options.signal.aborted) throw new Error('RUN_CANCELLED');
  const { endpoint } = validateEndpoint(profile.kind, profile.endpoint);
  if (!profile.model || !Number.isInteger(profile.outputTokens) || profile.outputTokens < 1) throw new Error('INVALID_PROFILE');
  if (profile.contextTokens !== undefined && (!Number.isInteger(profile.contextTokens) || profile.contextTokens < profile.outputTokens || profile.contextTokens > 2_000_000)) throw new Error('INVALID_PROFILE');
  // Other adapters are admitted only after their response and terminal-state contracts are implemented.
  const part = kinds.get(profile.kind);
  if (!part) throw new Error('NOT_IMPLEMENTED');
  if (options.managedOllama && (profile.kind !== 'ollama' || options.secret || !profile.contextTokens || options.managedOllama.numGpu !== 0 || options.managedOllama.keepAlive !== -1)) throw new Error('INVALID_PROFILE');
  const transcript = checkTranscript(messages, part.owns);
  const declaredTools = InferenceToolsSchema.safeParse(options.tools ?? []);
  if (!declaredTools.success) throw new Error('INVALID_INFERENCE_REQUEST');
  const tools = declaredTools.data;
  const body = part.body(profile, transcript, tools, options.managedOllama ? { managedOllama: options.managedOllama } : {});
  if (Buffer.byteLength(body) > 8 * 1024 * 1024) throw new Error('INVALID_INFERENCE_REQUEST');
  // The deadline is a setTimeout, not AbortSignal.timeout, so fake timers drive it; armed here, a refused input leaves none.
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), part.timeoutMs);
  const started = Date.now();
  try {
    const response = await post(options.fetcher, part.url(endpoint, profile), {
      headers: part.headers(profile, options.secret), body, signal: AbortSignal.any([options.signal, deadline.signal]),
      stop: options.signal, deadline: started + part.timeoutMs, retry: options.retry !== false,
    }, part);
    const folded = await part.read(response);
    if (options.signal.aborted) throw new Error('RUN_CANCELLED');
    return part.outcome(folded, { tools, usedIds: transcript.usedIds });
  } finally { clearTimeout(timer); }
}
