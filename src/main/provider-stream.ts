import { z } from 'zod';

// Streamed provider responses, folded back into the one-body shapes `complete()` already validates.
// Research: docs/research/2026-09-29-streaming-tool-calls (BRIEF.md). Native Ollama sends each tool
// call whole inside one chunk (E-04); OpenAI Chat Completions sends index-keyed fragments whose id,
// type and name arrive only on a call's first delta, with arguments as string pieces (E-07).

const MAX_TEXT = 2_000_000;
const MAX_ARGUMENTS = 131072;

async function* lines(response: Response, maxBytes: number): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('PROVIDER_EMPTY_RESPONSE');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0; let pending = ''; let finished = false;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) { finished = true; break; }
      bytes += chunk.value.byteLength;
      if (bytes > maxBytes) throw new Error('PROVIDER_RESPONSE_TOO_LARGE');
      try { pending += decoder.decode(chunk.value, { stream: true }); } catch { throw new Error('PROVIDER_INVALID_RESPONSE'); }
      const parts = pending.split(/\r?\n/);
      pending = parts.pop()!;
      yield* parts;
    }
    try { pending += decoder.decode(); } catch { throw new Error('PROVIDER_INVALID_RESPONSE'); }
    if (pending) yield pending;
  } finally {
    // A consumer that stops early (a rejected chunk, a bound, `[DONE]`) closes the connection too.
    if (!finished) await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

function json(text: string): unknown {
  try { return JSON.parse(text); } catch { throw new Error('PROVIDER_INVALID_RESPONSE'); }
}

/** Ollama's `application/x-ndjson`: one JSON object per line. A non-streamed body is one such line. */
export async function* readNdjson(response: Response, maxBytes = 4 * 1024 * 1024): AsyncGenerator<unknown> {
  for await (const line of lines(response, maxBytes)) if (line.trim()) yield json(line);
}

/** Server-sent events: each event's `data:` lines joined; `[DONE]` ends the stream. */
export async function* readSse(response: Response, maxBytes = 4 * 1024 * 1024): AsyncGenerator<unknown> {
  let data: string[] = [];
  for await (const line of lines(response, maxBytes)) {
    if (line === '') {
      const payload = data.join('\n'); data = [];
      if (payload === '[DONE]') return;
      if (payload) yield json(payload);
      continue;
    }
    if (line.startsWith('data:')) data.push(line.slice(line.startsWith('data: ') ? 6 : 5));
  }
  const payload = data.join('\n');
  if (payload && payload !== '[DONE]') yield json(payload);
}

const OllamaChunkSchema = z.object({
  message: z.object({ role: z.literal('assistant').optional(), content: z.string().max(MAX_TEXT).optional(), thinking: z.string().max(MAX_TEXT).optional(), tool_calls: z.array(z.unknown()).max(128).nullable().optional() }).optional(),
  done: z.boolean(),
  done_reason: z.string().max(128).optional(),
});

/** Native Ollama: append content, extend the list with every whole call, keep the last terminal state. */
export class OllamaAccumulator {
  private content = '';
  private readonly calls: unknown[] = [];
  private done = false;
  private doneReason: string | undefined;

  push(raw: unknown): void {
    const parsed = OllamaChunkSchema.safeParse(raw);
    if (!parsed.success || this.done) throw new Error('PROVIDER_INVALID_RESPONSE');
    const chunk = parsed.data;
    this.content += chunk.message?.content ?? '';
    if (this.content.length > MAX_TEXT) throw new Error('PROVIDER_RESPONSE_TOO_LARGE');
    this.calls.push(...(chunk.message?.tool_calls ?? []));
    if (this.calls.length > 128) throw new Error('PROVIDER_INVALID_RESPONSE');
    this.done = chunk.done;
    this.doneReason = chunk.done_reason;
  }

  /** The shape of a non-streamed `/api/chat` answer; a stream cut before `done` stays not done. */
  result() {
    return { message: { role: 'assistant' as const, content: this.content, ...(this.calls.length ? { tool_calls: this.calls } : {}) }, done: this.done, ...(this.doneReason !== undefined ? { done_reason: this.doneReason } : {}) };
  }
}

const Nullable = <T extends z.ZodType>(schema: T) => schema.nullable().optional();
const OpenAIChunkSchema = z.object({
  choices: z.array(z.object({
    index: z.number().int().optional(),
    delta: z.object({
      role: Nullable(z.literal('assistant')),
      content: Nullable(z.string().max(MAX_TEXT)),
      refusal: Nullable(z.string().max(MAX_TEXT)),
      tool_calls: Nullable(z.array(z.object({
        index: z.number().int().nonnegative().max(127),
        id: Nullable(z.string().max(256)),
        type: Nullable(z.string().max(64)),
        function: Nullable(z.object({ name: Nullable(z.string().max(256)), arguments: Nullable(z.string().max(MAX_ARGUMENTS)) })),
      })).max(128)),
    }).optional(),
    finish_reason: Nullable(z.string().max(128)),
  })).max(1),
  usage: Nullable(z.object({ prompt_tokens: z.number().int().nonnegative().optional(), completion_tokens: z.number().int().nonnegative().optional() })),
});

interface PartialCall { id?: string; type?: string; name?: string; arguments: string }

/** OpenAI-compatible: calls keyed by index; id, type and name from the first delta carrying them. */
export class OpenAIAccumulator {
  private content: string | null = null;
  private refusal: string | null = null;
  private readonly calls = new Map<number, PartialCall>();
  private finishReason: string | null = null;
  usage: { inputTokens?: number; outputTokens?: number } | undefined;

  push(raw: unknown): void {
    const parsed = OpenAIChunkSchema.safeParse(raw);
    if (!parsed.success) throw new Error('PROVIDER_INVALID_RESPONSE');
    const { choices, usage } = parsed.data;
    if (usage) this.usage = { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens };
    const choice = choices[0];
    if (!choice) return; // the usage chunk carries no choice
    const delta = choice.delta ?? {};
    if (typeof delta.content === 'string') this.content = (this.content ?? '') + delta.content;
    if (typeof delta.refusal === 'string') this.refusal = (this.refusal ?? '') + delta.refusal;
    if ((this.content?.length ?? 0) > MAX_TEXT || (this.refusal?.length ?? 0) > MAX_TEXT) throw new Error('PROVIDER_RESPONSE_TOO_LARGE');
    for (const fragment of delta.tool_calls ?? []) {
      const call = this.calls.get(fragment.index) ?? { arguments: '' };
      for (const [key, value] of [['id', fragment.id], ['type', fragment.type], ['name', fragment.function?.name]] as const) {
        if (value === null || value === undefined) continue;
        // A later delta may repeat a call's identity, never change it.
        if (call[key] !== undefined && call[key] !== value) throw new Error('PROVIDER_INVALID_RESPONSE');
        call[key] = value;
      }
      call.arguments += fragment.function?.arguments ?? '';
      if (call.arguments.length > MAX_ARGUMENTS) throw new Error('PROVIDER_INVALID_RESPONSE');
      this.calls.set(fragment.index, call);
    }
    if (choice.finish_reason) this.finishReason = choice.finish_reason;
  }

  /** The shape of a non-streamed completion; calls in index order, arguments still an unparsed string. */
  result() {
    const calls = [...this.calls.entries()].sort(([a], [b]) => a - b)
      .map(([, call]) => ({ id: call.id, type: call.type, function: { name: call.name, arguments: call.arguments } }));
    return { choices: [{ message: { role: 'assistant' as const, content: this.content, refusal: this.refusal, ...(calls.length ? { tool_calls: calls } : {}) }, finish_reason: this.finishReason }] };
  }
}
