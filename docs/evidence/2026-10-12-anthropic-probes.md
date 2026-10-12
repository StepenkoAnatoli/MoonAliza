# Anthropic live probes, 2026-10-12

Probe session for `docs/orchestration/2026-10-05-more-models/DAY-ONE-P2.md`, run against the native request shape of
`docs/specification/more-models-phase2.md` section 5. Synthetic prompts only; no repository content was sent.

- Date: 2026-10-12, 07:16-07:23 UTC. Base commit `291ea8a` (`main-axuse`); evidence branch `claude/anthropic-probes-2026-10-12`.
- Endpoints: `POST https://api.anthropic.com/v1/messages` (native, steps 1-7) and `POST https://api.anthropic.com/v1/chat/completions` (compatible layer, step 8).
- Models: `claude-haiku-4-5-20251001`, `claude-sonnet-5-5`, `claude-opus-5-5`, `claude-fable-5-1`.
- Native headers: `Content-Type: application/json`, `anthropic-version: 2023-06-01`, `Authorization: Bearer <redacted>`. The native body is
  `{model, max_tokens, system?, messages, tools?, stream: true}` in that order. No `thinking`, `tool_choice`, `temperature`, `top_p`,
  `top_k` or `stream_options` was sent. The one exception is D4's comparison request, which had `stream: false`.
- Key: read only from `MOONZILA_ANTHROPIC_API_KEY` inside the probe script and placed only in the request header. Every committed file
  was scanned for the key's value and for the key prefix (`scan.mjs`), and the result was clean. The response headers
  `anthropic-organization-id` and `anthropic-workspace-id` are replaced with `<redacted-id>`.
- Spend: **US$0.465 booked against the US$3.00 cap**. Of that, US$0.123 comes from reported usage and US$0.342 is a conservative
  reservation for the two refused requests (see the spend table).
- Files in `docs/evidence/2026-10-12-anthropic-probes/`:
  - `probe-lib.mjs`, `run.mjs`: the native probes.
  - `compat.ts`: step 8.
  - `summarize.mjs`, `scan.mjs`: helpers.
  - `spend.json`: the ledger.
  - Per probe `<id>`: `<id>.request.json` (headers redacted), `<id>.response.raw` (the response body byte for byte, every SSE line) and
    `<id>.meta.json` (status, headers, latency, parsed facts, usage, cost). D2's request records its filler as a description plus a
    sha256 instead of 1.1 MB of text.

## Results by item

### D2: over-window refusal (Haiku 4.5)
- **Request:** about 1.5 times the 200K window. The filler was 20,000 lines of
  `Line NNNNN: the quick brown fox jumps over the lazy dog.` (1,139,999 bytes), then `Reply with OK.`, with `max_tokens` 64.
- **Status:** 400. Content-Type is JSON.
- **Deciding body:**
  `{"type":"error","error":{"type":"invalid_request_error","message":"prompt is too long: 340027 tokens > 200000 maximum"},"request_id":"req_..."}`
- **Finding:** this matches the spec's rule exactly (`invalid_request_error` and `/prompt is too long/i`, section 5.7), so CONTEXT_LIMIT
  holds as designed. The body reports no usage.
- **"If the result differs":** not triggered. Use this body as the `isAnthropicOverflow` fixture; no widening is needed.

### D7 (over-maximum): `max_tokens` 70,000 on Haiku 4.5
- **Request:** `Reply with OK.`. **Status:** 400.
- **Deciding body:**
  `{"type":"error","error":{"type":"invalid_request_error","message":"max_tokens: 70000 > 64000, which is the maximum allowed number of output tokens for claude-haiku-4-5-20251001"}}`
- **Finding:** the request is refused before any generation, and it does not match the overflow pattern. It therefore surfaces as
  `PROVIDER_HTTP_400`, and the profile test shows the generic message.
- **Note:** "64K" here is 64,000, not 65,536.
- **"If the result differs":** the refusal was expected. Naming it in the form stays recorded for later (F-21).

### D11: Haiku 4.5 round trip with `thinking` omitted
- **Status:** 200 and 200.
- **Step 1:** blocks `tool_use, tool_use` (`get_weather {"city":"Paris"}` and `get_time {}`), `stop_reason` `tool_use`, no thinking block.
- **Step 2:** replay accepted, `end_turn`, one text block.
- **Finding:** Haiku 4.5 does not think when `thinking` is omitted.
- **"If the result differs":** not triggered.

### D1: Bearer auth
- **Request:** `Reply with OK.`, `max_tokens` 64, on Sonnet 5.5 (`D1-bearer`). **Status:** 200, text `OK.`
- **Finding:** Bearer was accepted on every native request this session made (4 models, 30 requests), so the `x-api-key` retry was never needed.
- **Side fact:** an unauthenticated request (no key) gets 401 `"x-api-key header is required"`, which names the legacy header even
  though Bearer works.
- **"If the result differs":** not triggered. `anthropicHeaders` keeps Bearer.

### D3: stream framing (27 native streams)
- `Content-Type: text/event-stream; charset=utf-8` on every stream, with `content-encoding: gzip` and `transfer-encoding: chunked`.
- Line endings are LF only; no CRLF appeared.
- Every event has an `event:` line equal to its data `type`.
- **New: padded `data:` lines.** Each JSON payload is followed by a variable run of spaces before the line end, for example
  `data: {"type":"message_stop"        }`. `JSON.parse` accepts trailing whitespace, so the reader rules are unaffected, but fixtures
  must keep the padding.
- **`ping` placement:** exactly one `ping` in every stream, always the third event, right after the first `content_block_start`. So it
  falls inside an open block, not before `message_start`.
- No unknown event or delta types appeared.
- No bytes follow `message_stop`; the stream ends with `message_stop` and a blank line.
- **`stop_details`:** every `message_delta` carries `"stop_details": null` (with `stop_sequence` and `container`). No `end_turn` carried
  a refusal `stop_details`.
- **Fields not in the captures:**
  - The `message_start.message` object has `container`, `stop_details` and `diagnostics` (all null).
  - Its usage has `cache_creation {ephemeral_5m_input_tokens, ephemeral_1h_input_tokens}`, `service_tier` and `inference_geo` (a string).
- **Response headers:**
  - `anthropic-ratelimit-{requests,tokens,input-tokens,output-tokens}-{limit,remaining,reset}` (the reset values are RFC 3339 timestamps).
  - `request-id`, `anthropic-organization-id`, `anthropic-workspace-id`.
  - No `retry-after` on a 200.
- **"If the result differs":** add the raw lines as fixtures (with the padding). No reader rule needs relaxing.

### D4: usage, streamed against non-streamed (Sonnet 5.5, `Reply with OK.`)

| Source | `input_tokens` | `output_tokens` | Other fields |
|--------|----------------|-----------------|--------------|
| Streamed `message_start` | 15 | **3** | |
| Streamed `message_delta` | 15 (repeated) | 5 | `output_tokens_details {thinking_tokens: 0}` |
| Non-streamed | 15 | 5 | `output_tokens_details {thinking_tokens: 0}` |

- **Finding:** latest-value-wins gives the non-streamed figures, and summing would be wrong (3 + 5).
- **"If the result differs":** not triggered. The `anthropicOutcome` usage rule stands.

### D5: native two-step round trip with verbatim replay

`D5-<model>-step1/2` used the plain prompt. `D5-think-<model>-step1/2` used a reasoning-inviting prompt, which this session added
because the plain prompt produced no thinking on any model (see "What went wrong"). Both requests of every round trip returned 200 on
Sonnet 5.5, Opus 5.5 and Fable 5.1.

- **Fable 5.1:** no Covered-Model or retention 400 for this organisation.
- **(a) An undocumented field:** every live `tool_use` start block carries `"caller":{"type":"direct"}`, for example
  `{"type":"tool_use","id":"toolu_...","name":"get_weather","input":{},"caller":{"type":"direct"}}`. Replaying it verbatim was accepted
  on all four models. Thinking blocks carry exactly `type`, `thinking` and `signature`.
  - **"If the result differs":** not triggered (verbatim replay is accepted), so no whitelist is needed.
- **(b) `redacted_thinking`:** none arrived.
- **(c) `signature_delta`:** exactly one per thinking block, in every stream.
  - The start object is `{"type":"thinking","thinking":"","signature":""}`.
  - Then come one `thinking_delta` with `"thinking":""` and one `signature_delta` (signatures of 868 to 2,216 characters).
- **(d) Interleaving:** step 1 on all three models produced `thinking, text, tool_use, tool_use`. The final answers were
  `thinking, text` on Sonnet and `text` only on Opus and Fable.
  - No empty text block appeared.
  - Thinking blocks with empty `thinking` text were replayed and accepted.
- **(e) Re-serialized input:** the streamed `partial_json` was `{"city": "Rome"}` (with a space). It was replayed as the parsed object
  (`{"city":"Rome"}`) in a turn holding a signed thinking block, and that was accepted.
  - Not exercised: integer-like key reordering and number normalisation. Every argument was a string.
- **(f) A changed prefix:** on Sonnet, the step-2 request was resent with the system prompt's final `.` changed to `!`. It was accepted
  (200) both without thinking (`D5f-sonnet-changed-system`) and with a signed thinking block in the replayed turn
  (`D5f-think-sonnet-changed-system`). This informs only; the design stays append-only.

### D13: Sonnet 5.5 thinking display
- **Finding:** thinking text is **omitted** by default on Sonnet 5.5, as on Opus 5.5 and Fable 5.1. The thinking text is `""` while
  `output_tokens_details.thinking_tokens` is 48 (D5-think step 1). Sonnet 5.5 is not in H-E03's list, but it behaves the same way.
- **"If the result differs":** nothing to do. The in-memory state holds only signatures.

### D14: argument-free tool
- **Finding:** `get_time` streams one `input_json_delta` with `"partial_json":""`, so the joined string is empty. The start block's
  `input` is `{}`, and the empty-join rule (take the start's `input`) is correct.
- **"If the result differs":** not triggered.

### D16: reported `input_tokens` against Moonzila's UTF-8/2 estimate

The estimate column is `ceil(bytes/2) + 256 + 8 x messages`, taken over the whole request body, which overstates
`estimateInput` (that function counts messages and tools only).

| Step-2 request | UTF-8 bytes | Estimate | `input_tokens` | Signature chars | Estimate / actual |
|----------------|-------------|----------|----------------|-----------------|-------------------|
| D5-sonnet (no thinking) | 1,107 | 842 | 633 | 0 | 1.33 |
| D5-think-sonnet | 2,352 | 1,464 | 789 | 928 | 1.86 |
| D5-think-opus | 2,313 | 1,445 | 772 | 868 | 1.87 |
| D5-think-fable | 2,327 | 1,452 | 773 | 948 | 1.88 |
| D11-haiku | 1,115 | 846 | 796 | 0 | 1.06 |

- **Finding:** the estimate stays above the reported count in every case. A replayed signature costs far fewer tokens than its bytes/2
  suggest.
- **Haiku 4.5:** its tokenizer counts the same request 26% higher than the 5.x models. D2 also measured about 3.4 bytes per token on
  plain English filler.
- **"If the result differs":** nothing to calibrate urgently. The reserve is conservative here.

### D6: second run without the first run's thinking (Sonnet 5.5)
- **Run 1:** `D6-run1-step1`, a tool call, then `D6-run1-step2`, a final answer with a thinking block.
- **Run 2 history:** run 1's prompt, then its answer as a plain string (no thinking, no tool turns), then a new prompt.
- **Status:** 200. The model thought again, wrote text and called `get_time`.
- **Finding:** the request is accepted, as the design expects.
- **Behavioural side effect, for the lead to weigh:** because the history drops run 1's tool turns, the model concluded its earlier
  answer had been invented. It said: "I never called any weather tool. The 'Paris, 18 °C, cloudy' result was made up, so ignore it".
  This does not contradict the spec, but it is a quality cost of the "history drops tool turns" rule worth recording.
- **"If the result differs":** not triggered. The `drop_block` beta is not needed.

### D7: `profile.test` latency at the profile's `max_tokens`

| Request | Latency | `stop_reason` | `output_tokens` |
|---------|---------|---------------|-----------------|
| 2,048 Sonnet | 1.30 s | `end_turn` | 5 |
| 2,048 Opus | 1.31 s | `end_turn` | 4 |
| 2,048 Fable | 1.20 s | `end_turn` | 5 |
| 32,000 Sonnet | 0.98 s | `end_turn` | 5 |
| 32,000 Opus | 1.10 s | `end_turn` | 4 |
| 32,000 Fable | 1.14 s | `end_turn` | 4 |

- **Finding:** all requests were far inside the 25 s timeout. `max_tokens` does not slow a short answer, and none of them thought.
- **Conditional items:** the 32,000 Opus and Fable requests ran because the cap's remainder covered their worst cases ($0.65 and $1.62)
  at the time.
- **"If the result differs":** not triggered.

### D12: thinking-heavy tool step (Opus 5.5, `max_tokens` 32,000)
- **Request:** a prompt asking for step-by-step reasoning before one `get_weather` call. **Status:** 200, `tool_use`
  (`get_weather {"city":"Minsk"}`).
- **Finding:** total wall time 6.4 s (headers at 0.7 s), 4,515 SSE bytes and 28 lines. Usage: 544 input and 588 output, of which 536
  were `thinking_tokens`. The thinking text is omitted, so a thinking-heavy step adds only a signature (2,216 characters) to the stream.
  The 4 MiB cap and the 600 s timeout are orders of magnitude away for this kind of step.
- **Limit:** one prompt only. A step that thinks for tens of thousands of tokens was not provoked, and its wall time is unmeasured.
- **"If the result differs":** not triggered. No idle timeout is needed on this evidence.

### D15: `fallback` block
- **Finding:** no `fallback` block in any of the 27 native streams, tool turns included.

### D8: 429 and 5xx
- **Finding:** none was met. No 429, no 5xx and no retry happened. The rate-limit headers on a 200 are recorded under D3.
- **"If the result differs":** not triggered.

### D9: multi-workspace key
- **Not run.** Nothing in the key or the responses shows whether it is multi-workspace: every response named a single
  `anthropic-workspace-id`, which is redacted. Not applicable.

### D10
- **Not a vendor probe.** It is U2's Electron check and is not part of this session.

## Step 8: compatible route (beyond the DAY-ONE list; run because the cap remained)

**U-18 (1)/(3).** Moonzila's real `complete()` (`src/main/inference.ts`, unmodified) was run through a recording fetcher.
- **Request:**
  - Profile `{kind: 'openai-compatible', endpoint: 'https://api.anthropic.com/v1', model: 'claude-sonnet-5-5', outputTokens: 1024}`.
  - One `read_file` tool and the prompt `Call read_file on README.md`.
  - Body:
    `{model, messages, tools:[{type:'function',function:{...}}], max_completion_tokens: 1024, stream_options:{include_usage:true}, stream:true}`.
- **Status:** 200, `Content-Type: text/event-stream`.
- **Stream:**
  - `chat.completion.chunk` objects, with the same trailing-space padding as the native route.
  - `tool_calls[0]` starts with `arguments: ""`.
  - The final chunk has `finish_reason: "tool_calls"` and `usage {completion_tokens: 49, prompt_tokens: 400}`, followed by `data: [DONE]`.
- **Outcome:** `complete()` returned `tool_calls` `read_file {"path":"README.md"}` with usage 400 / 49. Replaying the recorded bytes
  through `readSse` and `OpenAIAccumulator` on their own gave the same `finish_reason: tool_calls`.
- **Finding:** the existing accumulator accepts Anthropic's compatible stream.

**Reduced U-06** (10 fixed prompts, Sonnet 5.5 only, the same profile and 4 tools including a nested-object `search` tool):
- **Result: 10 of 10.** 8 tool turns ended in `tool_calls` with arguments that conform to the declared schema:
  - one tool (3);
  - two tools in one turn (2);
  - two string arguments (1);
  - nested object with a boolean and an array (2).
- The 2 turns that must not call a tool ended `complete` with no calls.
- **Not a full U-06:** the shortlist asks for at least 20 prompts per model. This is the reduced set the brief asked for.

## Contradictions with `more-models-phase2.md`
1. **Section 5.5 "Set aside":** the spec says the captured start objects hold exactly the documented input fields. Live `tool_use`
   blocks carry an extra `caller` field.
   - The spec's chosen rule (keep every field verbatim) is the one that works, and replaying `caller` is accepted.
   - The alternative that was set aside (keep only documented fields) is now untested rather than known-safe.
2. **Section 5.4 ("`message_start` comes first; before it only `ping`..."):** this is not contradicted, but the one `ping` per stream
   arrives inside the first open block, after its `content_block_start`. The fakes should place it there.
3. **D13 expectation:** Sonnet 5.5 omits thinking text by default, the same as the listed models.
4. **DAY-ONE-P2 D7 cost basis:** it reads Haiku 4.5's "64K" as 65,536. The live limit is 64,000.

Nothing else contradicts the spec. The D2 body, D4 usage, D14 empty join, D5 verbatim replay and D3 reading rules all hold.

## Not run, and why
- **D9:** a multi-workspace key cannot be identified (see above).
- **D10:** not a vendor probe.
- **D7 over-maximum on Sonnet 5.5 and D2 on a 1M model:** not needed, because Haiku 4.5 was still available.
- **Full U-06 (20 or more prompts per model; Opus and Fable):** not in this brief's reduced scope.
- **`redacted_thinking`, 429, 5xx and `fallback`:** cannot be provoked, and none occurred.

## What went wrong in this session
- **The plain D5 prompt elicited no thinking on any model.** Its round trips proved replay of `tool_use` (with `caller`) but not of
  signed thinking. A reasoning-inviting variant (`run.mjs` step `3b`) was added and run on all three models. D6's prompt was changed
  the same way before it ran.
- **The first `scan.mjs` contained the literal key prefix it searches for**, so it would have flagged itself. It now builds the string
  from two parts.
- **Refused requests report no usage.** The spend ledger books D2 at its counted 340,027 input tokens (US$0.34) as a reservation, since
  whether a refused request is billed is not stated. The real spend is likely about US$0.12.
- **Environment:** the container has Node 22.22.0, not 24. Step 8 installed dependencies with
  `npm ci --ignore-scripts --engine-strict=false` (no Electron download; `node_modules` is untracked) to import `src/main/inference.ts`
  with tsx. Nothing under `src/` or `tests/` changed.
- **Repository:** pushing reported that the repository has moved to `StepenkoAnatoli/Selenic`. The push to the existing remote
  succeeded.

## Spend table

Prices per million tokens, input / output: Fable 5.1 $10 / $50, Opus 5.5 $4 / $20, Sonnet 5.5 $2 / $10, Haiku 4.5 $1 / $5
(pricing corpus E-01). "Worst case checked" is the bound tested against the cap's remainder before each request: input bound plus the
whole `max_tokens` as output.

| # | Item | Model | Status | Input | Output | Cost (US$) | Worst case checked | Running total |
|---|---|---|---|---|---|---|---|---|
| 1 | D2-over-window | haiku-4-5-20251001 | 400 | 0 | 0 | 0.0000 (refused) | 0.4003 | 0.0000 |
| 2 | D7-over-max-haiku | haiku-4-5-20251001 | 400 | 0 | 0 | 0.0000 (refused) | 0.3297 | 0.0000 |
| 3 | D11-haiku-step1 | haiku-4-5-20251001 | 200 | 646 | 73 | 0.0010 | 0.0225 | 0.0010 |
| 4 | D11-haiku-step2 | haiku-4-5-20251001 | 200 | 796 | 28 | 0.0009 | 0.0305 | 0.0019 |
| 5 | D2-reservation | haiku-4-5-20251001 | - | 340027 | 0 | 0.3400 (reservation) | 0.3400 | 0.3420 |
| 6 | D7-over-max-reservation | haiku-4-5-20251001 | - | 2000 | 0 | 0.0020 (reservation) | 0.0020 | 0.3440 |
| 7 | D1-bearer | sonnet-5-5 | 200 | 15 | 5 | 0.0001 | 0.0046 | 0.3441 |
| 8 | D4-non-streamed | sonnet-5-5 | 200 | 15 | 5 | 0.0001 | 0.0046 | 0.3441 |
| 9 | D5-sonnet-step1 | sonnet-5-5 | 200 | 482 | 73 | 0.0017 | 0.0450 | 0.3458 |
| 10 | D5-sonnet-step2 | sonnet-5-5 | 200 | 633 | 34 | 0.0016 | 0.0610 | 0.3474 |
| 11 | D5-opus-step1 | opus-5-5 | 200 | 482 | 73 | 0.0034 | 0.0899 | 0.3508 |
| 12 | D5-opus-step2 | opus-5-5 | 200 | 633 | 32 | 0.0032 | 0.1219 | 0.3540 |
| 13 | D5-fable-step1 | fable-5-1 | 200 | 482 | 73 | 0.0085 | 0.2248 | 0.3625 |
| 14 | D5-fable-step2 | fable-5-1 | 200 | 633 | 34 | 0.0080 | 0.3048 | 0.3705 |
| 15 | D5f-sonnet-changed-system | sonnet-5-5 | 200 | 633 | 34 | 0.0016 | 0.0610 | 0.3721 |
| 16 | D5-think-sonnet-step1 | sonnet-5-5 | 200 | 528 | 183 | 0.0029 | 0.0450 | 0.3750 |
| 17 | D5-think-sonnet-step2 | sonnet-5-5 | 200 | 789 | 130 | 0.0029 | 0.0610 | 0.3779 |
| 18 | D5f-think-sonnet-changed-system | sonnet-5-5 | 200 | 789 | 117 | 0.0027 | 0.0610 | 0.3806 |
| 19 | D5-think-opus-step1 | opus-5-5 | 200 | 528 | 166 | 0.0054 | 0.0899 | 0.3860 |
| 20 | D5-think-opus-step2 | opus-5-5 | 200 | 772 | 92 | 0.0049 | 0.1219 | 0.3910 |
| 21 | D5-think-fable-step1 | fable-5-1 | 200 | 528 | 167 | 0.0136 | 0.2248 | 0.4046 |
| 22 | D5-think-fable-step2 | fable-5-1 | 200 | 773 | 87 | 0.0121 | 0.3048 | 0.4167 |
| 23 | D6-run1-step1 | sonnet-5-5 | 200 | 521 | 91 | 0.0020 | 0.0450 | 0.4186 |
| 24 | D6-run1-step2 | sonnet-5-5 | 200 | 631 | 258 | 0.0038 | 0.0610 | 0.4225 |
| 25 | D6-run2 | sonnet-5-5 | 200 | 666 | 410 | 0.0054 | 0.0450 | 0.4279 |
| 26 | D7-2048-sonnet | sonnet-5-5 | 200 | 15 | 5 | 0.0001 | 0.0245 | 0.4280 |
| 27 | D7-2048-opus | opus-5-5 | 200 | 15 | 4 | 0.0001 | 0.0490 | 0.4281 |
| 28 | D7-2048-fable | fable-5-1 | 200 | 15 | 5 | 0.0004 | 0.1224 | 0.4285 |
| 29 | D7-32000-sonnet | sonnet-5-5 | 200 | 15 | 5 | 0.0001 | 0.3240 | 0.4286 |
| 30 | D12-opus-32000 | opus-5-5 | 200 | 544 | 588 | 0.0139 | 0.6480 | 0.4425 |
| 31 | D7-32000-opus | opus-5-5 | 200 | 15 | 4 | 0.0001 | 0.6480 | 0.4427 |
| 32 | D7-32000-fable | fable-5-1 | 200 | 15 | 4 | 0.0003 | 1.6200 | 0.4430 |
| 33 | U18-compat-read-file | sonnet-5-5 | 200 | 400 | 49 | 0.0013 | 0.0142 | 0.4443 |
| 34 | U06-one-tool-read | sonnet-5-5 | 200 | 711 | 49 | 0.0019 | 0.0142 | 0.4462 |
| 35 | U06-one-tool-list | sonnet-5-5 | 200 | 711 | 48 | 0.0019 | 0.0142 | 0.4481 |
| 36 | U06-two-tools | sonnet-5-5 | 200 | 722 | 95 | 0.0024 | 0.0142 | 0.4505 |
| 37 | U06-two-same-tool | sonnet-5-5 | 200 | 720 | 97 | 0.0024 | 0.0142 | 0.4529 |
| 38 | U06-nested-1 | sonnet-5-5 | 200 | 732 | 98 | 0.0024 | 0.0142 | 0.4554 |
| 39 | U06-two-args | sonnet-5-5 | 200 | 722 | 74 | 0.0022 | 0.0142 | 0.4576 |
| 40 | U06-nested-2 | sonnet-5-5 | 200 | 725 | 90 | 0.0024 | 0.0142 | 0.4599 |
| 41 | U06-no-tool-math | sonnet-5-5 | 200 | 722 | 12 | 0.0016 | 0.0142 | 0.4615 |
| 42 | U06-no-tool-hello | sonnet-5-5 | 200 | 715 | 13 | 0.0016 | 0.0142 | 0.4630 |
| 43 | U06-one-tool-path | sonnet-5-5 | 200 | 714 | 53 | 0.0020 | 0.0142 | 0.4650 |
