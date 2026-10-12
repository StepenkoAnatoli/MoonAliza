# Builder brief: Phase 1, U1 stream robustness

Read `briefs/p1-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p1-u1`, branch
`build/mm-p1-u1`, base `304ba1e`.

**Requirements:** F-1, F-2, F-3, F-4, T-1 (REQUIREMENTS-P1.md). **Spec:** more-models.md, Phase 1
design section 1.

**You own:** `src/main/provider-stream.ts`; the OpenAI-shaped branch of `complete()` in
`src/main/inference.ts` (from `const parsed = ChatSchema.safeParse(data)` to the end, plus anything
`readStreamed` needs); `tests/provider-stream.test.ts`; new tests in `tests/provider-transport.test.ts`;
`docs/ARCHITECTURE.md`, the provider transport paragraph (the one that begins "The September 30
reconciliation"). Do not touch `inferenceErrorCode`, `validateEndpoint`, the Ollama branch or any
other file.

**What to build**
1. `readSse`: skip comment lines (first character `:`); keep an `event:` name with the event's data;
   ignore `id:` and `retry:`. Keep `readSse`'s existing callers working unchanged - for example a new
   generator that yields `{ event, data }` with `readSse` built on it - and keep every existing bound
   (byte limit, UTF-8 fatal decoding, early cancel, `[DONE]`).
2. On the OpenAI-shaped path, an in-stream failure fails the call (throw, so it crosses as
   PROVIDER_ERROR and no answer is saved): a chunk with a top-level `error` object (OpenRouter, E-25),
   and a `finish_reason` of `error` (E-25, Mistral E-22), `insufficient_system_resource` or `aborted`
   (DeepSeek E-20). Choose a specific internal message (for example `PROVIDER_STREAM_ERROR`); it must
   not be `CONTEXT_LIMIT` or `LOCAL_MODEL_UNVERIFIED`.
3. `finish_reason` map: `stop` without calls is complete; `tool_calls` is tool_calls; `length` and
   `model_length` are incomplete; `content_filter` or a refusal is blocked; the failure values above
   and any value not listed here fail the call. A plain JSON (non-streamed) answer follows the same map.
4. A repeated identical `finish_reason` (OpenRouter repeats it on its usage chunk, E-25) is accepted;
   a second chunk with a different non-null reason fails the call.
5. Fixtures, copied from the captures: E-10
   (`raw/2026-10-05-streaming-messages-claude-platform-docs-claude-0712ffc4.md`: the basic stream and
   the tool-use stream with `event:` lines and `ping`, and the `error` event) for `readSse` only - there
   is no Anthropic accumulator yet; E-25
   (`raw/2026-10-05-api-streaming-real-time-model-response-i-openrouter-2d4880cd.md`: the
   `: OPENROUTER PROCESSING` comment, the usage chunk repeating `finish_reason`, the mid-stream error
   chunk) through `complete()`; E-22 (`raw/2026-10-05-chat-mistral-b5c8b721.md`) and E-20
   (`raw/2026-10-05-chat-completions-api-deepseek-api-docs-deepseek-3c16da97.md`) for the finish
   reasons they document.

**Pre-mortem (what most likely fails review):** an existing caller of `readSse` silently changed; a
comment line inside a multi-line `data:` event; the usage chunk's repeated reason treated as a
change; a stream that ends with no finish reason at all (today: incomplete - keep it, and say so in
your report); a test that passes with its guard removed.
