# Gemini wire probes, 2026-10-11

Live measurements against Google's Gemini API for the GEMINI parts of U-18 probes (1), (2), (3), (4),
(8), (9) and (11) in `docs/research/2026-10-05-provider-wire-formats/research/DISCOVERY.md` (with U-05
and U-20), and for U-06 in `docs/research/2026-10-05-coding-model-shortlist/research/DISCOVERY.md`.

- Date: 2026-10-11, 22:10-22:55 UTC (first run). Checkout: `main-axuse` at `b793f13`; no file under
  `src/` changed.
- Key: the repository owner's key from `GEMINI_API_KEY`, sent only as `Authorization: Bearer` (compatible
  route) or `x-goog-api-key` (native route). It is a **free-tier** key: every quota error names a
  `..._free_tier_...` metric. Every recorded header, URL and body was redacted (`<redacted>`); the files
  were grepped for the key value and for the Google key prefix before commit.
- Endpoints: compatible `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
  native `https://generativelanguage.googleapis.com/v1beta/models/<model>:streamGenerateContent?alt=sse`,
  `:generateContent`, `:countTokens`. Requests went through this session's egress proxy (plain HTTPS
  with a proxy CA); the proxy is not known to rewrite bodies, but the framing below was observed after it.
- Models: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash-lite` (all listed by
  `GET v1beta/models` on the day with `inputTokenLimit` 1048576, `outputTokenLimit` 65536, `thinking: true`).
- Prompts: synthetic only (for example "Call read_file on README.md", generated filler words). No
  repository content was sent.
- Scripts and raw transcripts: [`2026-10-11-gemini-probes/`](2026-10-11-gemini-probes/) - `lib.ts`
  (recording fetch, redaction), `wire-probes.ts` (probes 1, 2, 4, 8, 9), `u06-tool-calls.ts` (U-06),
  `replay-accumulator.ts` (replays a recorded stream through `OpenAIAccumulator`); `raw/*.json` hold every
  request (redacted) with its status, response headers, each network chunk as it arrived and the whole body.
- Tooling: `npm ci` under Node 22.22.0 (the only Node in this container; `engines` asks for 24), scripts
  run with the repository's `tsx`. The Electron binary and the research kit were not installed: no probe
  imports Electron or runs the test suite.

## Headline

1. **Moonzila cannot complete a Gemini tool turn on the compatible endpoint today.** Gemini returns HTTP
   200 and a well-formed call, but (a) its `delta.tool_calls[]` entries carry **no `index`**, which
   `OpenAIChunkSchema` requires (`src/main/provider-stream.ts:109`), so `OpenAIAccumulator.push` throws and
   `complete()` throws `PROVIDER_INVALID_RESPONSE`; and (b) even with an index the turn ends with
   **`finish_reason: "stop"`, never `"tool_calls"`**, so `complete()` (`src/main/inference.ts:180-181`)
   would return outcome `incomplete`, not `tool_calls`. Measured on all three models.
2. **The thought signature is mandatory on the compatible endpoint**, as E-37 says: a second turn without
   it is a 400 whose message names the missing `thought_signature`; with it (on the tool call's
   `extra_content`) it is a 200. Moonzila's replay cannot carry it today.
3. **The over-window body (U-05) cannot be measured on a free-tier key**: the free tier caps input at
   250,000 tokens per model per minute, so a 1.5x-window prompt gets 429 `RESOURCE_EXHAUSTED` before any
   window check; and Moonzila itself refuses the prompt locally (`INVALID_INFERENCE_REQUEST`, one message
   is capped at 2,000,000 characters). U-05 stays KNOWN-UNKNOWN; it needs a paid-tier key.
4. **Free-tier daily caps decide what can run**: `gemini-3.8-flash` and `gemini-3.7-flash` allow 20
   generate requests per model per day (`GenerateRequestsPerDayPerProjectPerModel-FreeTier`, quotaValue
   20), and both often answered 503 `UNAVAILABLE` "high demand". `gemini-3.5-flash-lite` answered every
   U-06 turn.

## Probe (1): Moonzila's exact body on the compatible endpoint

Request, built by `complete()` itself through a recording fetcher (`raw/p1-compat-tool-gemini-3.5-flash-lite.json`):

```
POST https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
Content-Type: application/json
Authorization: <redacted>

{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"Call read_file on README.md"}],"tools":[{"type":"function","function":{"name":"read_file","description":"Read a UTF-8 text file from the project.","parameters":{"type":"object","properties":{"path":{"type":"string","description":"Project-relative path"}},"required":["path"],"additionalProperties":false}}}],"max_completion_tokens":8192,"stream_options":{"include_usage":true},"stream":true}
```

Status 200, `content-type: text/event-stream`. Every raw line, byte for byte (the signature is shortened
here only; the raw file has it whole):

```
data: {"choices":[{"delta":{"role":"assistant","tool_calls":[{"extra_content":{"google":{"thought_signature":"EmAKXgFp...W4Y="}},"function":{"arguments":"{\"path\":\"README.md\"}","name":"read_file"},"id":"call_585940","type":"function"}]},"index":0}],"created":1791756645,"id":"ZAnMavyxOa3W-8YP06GpgQQ","model":"gemini-3.5-flash-lite","object":"chat.completion.chunk","usage":{"completion_tokens":18,"prompt_tokens":66,"total_tokens":84}}

data: {"choices":[{"delta":{"role":"assistant"},"finish_reason":"stop","index":0}],"created":1791756645,"id":"ZAnMavyxOa3W-8YP06GpgQQ","model":"gemini-3.5-flash-lite","object":"chat.completion.chunk","usage":{"completion_tokens":18,"prompt_tokens":66,"total_tokens":84}}

data: [DONE]

```

`complete()` result: threw `PROVIDER_INVALID_RESPONSE`. `replay-accumulator.ts` on the same bytes: chunk 0
rejected, chunk 1 accepted; with `index: 0` filled in, the accumulator yields one call
(`call_585940`, `read_file`, `{"path":"README.md"}`), usage 66/18 and `finish_reason: "stop"`.

`gemini-3.8-flash`, same body: three attempts in `raw/p1-compat-tool-gemini-3.8-flash.json`, all 503
`UNAVAILABLE` "This model is currently experiencing high demand..."; the same body sent again at the start
of probe (8) got 200 (`raw/p8-turn1.json`) with the identical shape: one chunk holding the whole call with
`extra_content` and no `index`, a chunk with `finish_reason: "stop"`, usage on both, `[DONE]`; `complete()`
threw `PROVIDER_INVALID_RESPONSE`.

Findings:
- Moonzila's exact body is accepted (200) - `max_completion_tokens`, `stream_options.include_usage` and
  `additionalProperties: false` in the schema included.
- A tool call arrives **whole in one chunk** (id, type, name and complete arguments), with **no `index`**.
  Parallel calls (U-06 turns 7-11) arrive **one per chunk, each without `index`**, distinct ids.
- **`finish_reason` is `"stop"` on tool turns** - not `"tool_calls"`. Contradicts the OpenAI shape the
  compatible kind assumes.
- **Usage rides on every chunk**, cumulative (`completion_tokens` 18 then 36 across a parallel turn),
  not on a separate `choices: []` chunk; the last chunk holds the total. The accumulator keeps the last
  usage, which is correct for this shape.
- `extra_content.google.thought_signature` rides on the first tool call of the step (U-06: 16 of 21 calls
  carried it - exactly the first call of each of the 16 tool turns, never the second of a parallel pair).
  On a turn with no tool call, a signature arrives on **`delta.extra_content`** of the final chunk (the
  one with `finish_reason`) - see U-06 turn 17 and probe (8) turn 2.

## Probe (2): over-window prompt (U-05) - not measurable on this key

`gemini-3.5-flash-lite`, documented `inputTokenLimit` 1048576, target 1.5x = 1,572,864 tokens. Filler is
pseudo-random words from a fixed 26-word vocabulary (generator in `wire-probes.ts`); calibrated with
`countTokens` (200,000 characters = 43,183 tokens), giving a prompt of 7,284,698 bytes.
`raw/p2-over-window.json`, `raw/p11-rate-limits-p2.json`.

| Route | Status | Body (decisive part) |
|---|---|---|
| `:countTokens` (contents only) | 200 | `{"totalTokens": 1576157, ...}` - countTokens does not refuse an over-window prompt |
| compatible, through `complete()` | not sent | `complete()` threw `INVALID_INFERENCE_REQUEST`: `InferenceMessageSchema` caps `content` at 2,000,000 characters (`src/engine/control.ts`), so Moonzila cannot send a prompt this size through any profile |
| compatible, Moonzila's body shape built by hand, streamed | 429 | array-wrapped: `[{"error": {"code": 429, ..., "status": "RESOURCE_EXHAUSTED", ...}}]` |
| native `:generateContent` | 429 | `{"error": {"code": 429, ...}}` |
| native `:streamGenerateContent?alt=sse` | 429 | `{"error": {"code": 429, ...}}` |

Each 429 (full body in the raw files):

```
"message": "You exceeded your current quota, please check your plan and billing details. ... \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_input_token_count, limit: 250000, model: gemini-3.5-flash-lite\nPlease retry in 30.718565359s.",
"status": "RESOURCE_EXHAUSTED",
"details": [
  {"@type": "type.googleapis.com/google.rpc.Help", "links": [{"description": "Learn more about Gemini API quotas", "url": "https://ai.google.dev/gemini-api/docs/rate-limits"}]},
  {"@type": "type.googleapis.com/google.rpc.QuotaFailure", "violations": [{"quotaMetric": "generativelanguage.googleapis.com/generate_content_free_tier_input_token_count", "quotaId": "GenerateContentInputTokensPerModelPerMinute-FreeTier", "quotaDimensions": {"location": "global", "model": "gemini-3.5-flash-lite"}, "quotaValue": "250000"}]},
  {"@type": "type.googleapis.com/google.rpc.RetryInfo", "retryDelay": "30s"}
]
```

Finding: on a free-tier key every prompt above 250,000 input tokens is a 429 rate limit, never a window
refusal, so the over-window status, gRPC status, message and details **were not observed**. Per the
contract a 429 is a rate limit and is never classed as CONTEXT_LIMIT. U-05 stays KNOWN-UNKNOWN; the probe
needs a paid-tier key (whose per-minute input limit exceeds 1.57M tokens) or a model whose window is
below 250,000 tokens. Moonzila side: `complete()` maps this 429 to `PROVIDER_HTTP_429` without reading the
body (`refusalCode` reads 400/413/422 only).

## Probe (3): framing

| Stream | Line ending | Comment lines | Keep-alives / `event:` lines | Terminal | After the last event |
|---|---|---|---|---|---|
| compatible SSE (all 200 streams) | LF (`\n`), 0 CR | none | none | `data: [DONE]` | `\n\n`, then close |
| native `streamGenerateContent?alt=sse` | **CRLF** (`\r\n`), every line | none | none | **none** - the last `data:` event, `\r\n\r\n`, then close | nothing |
| error bodies (compatible, `stream: true`) | LF | - | - | - | JSON **array** `[{"error": ...}]\n` (status 400, 429, 503) |
| error bodies (native, both routes) | LF | - | - | - | JSON object `{"error": ...}\n` |

`readSse` splits on `\r?\n` and ends on `[DONE]` or close, so both framings parse. New for the classifier:
on the compatible route a streamed request's error body is an array, so `refusalCode`'s
`(JSON.parse(text)).error.code` lookup (`src/main/inference.ts:118`) reads `undefined`; only the
`OVERFLOW` text regex can still match there. Fixture candidates for `tests/provider-stream.test.ts`: the
p1 and p4 raw bodies.

## Probe (4): native `streamGenerateContent?alt=sse`

Request (`raw/p4-native-stream-tool-gemini-3.8-flash.json`):

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?alt=sse
Content-Type: application/json
x-goog-api-key: <redacted>

{"contents":[{"role":"user","parts":[{"text":"Call read_file on README.md"}]}],"tools":[{"functionDeclarations":[{"name":"read_file","description":"Read a UTF-8 text file from the project.","parameters":{"type":"object","properties":{"path":{"type":"string","description":"Project-relative path"}},"required":["path"]}}]}],"generationConfig":{"maxOutputTokens":8192}}
```

200 (the `x-goog-api-key` header works on the streaming route). Body (CRLF shown as written; signature shortened):

```
data: {"candidates": [{"content": {"parts": [{"functionCall": {"name": "read_file","args": {"path": "README.md"},"id": "call_774859"},"thoughtSignature": "EvoBCvcB...+mg=="}],"role": "model"},"index": 0}],"usageMetadata": {"promptTokenCount": 66,"candidatesTokenCount": 18,"totalTokenCount": 122,"promptTokensDetails": [{"modality": "TEXT","tokenCount": 66}],"thoughtsTokenCount": 38,"serviceTier": "standard"},"modelVersion": "gemini-3.8-flash","responseId": "zAnMavOZD77i_uMPyOzU0Ao"}\r\n
\r\n
data: {"candidates": [{"content": {"parts": [{"text": ""}],"role": "model"},"finishReason": "STOP","index": 0}],"usageMetadata": {"promptTokenCount": 66,"candidatesTokenCount": 18,"totalTokenCount": 122,"promptTokensDetails": [{"modality": "TEXT","tokenCount": 66}],"thoughtsTokenCount": 38,"serviceTier": "standard"},"modelVersion": "gemini-3.8-flash","responseId": "zAnMavOZD77i_uMPyOzU0Ao"}\r\n
\r\n
```

`gemini-3.5-flash-lite` (`raw/p4-native-stream-tool-gemini-3.5-flash-lite.json`) has the same two-event
shape (call `call_987069`, no `thoughtsTokenCount`). Plain text prompt on `gemini-3.5-flash-lite`
(`raw/p4-native-stream-text-gemini-3.5-flash-lite.json`): four events, text split across the first three,
`candidatesTokenCount` 13, 37, 55, 55 and `totalTokenCount` 26, 50, 68, 68; the last event is
`{"text": "", "thoughtSignature": "..."}` with `finishReason: "STOP"`. The plain text prompt on
`gemini-3.8-flash` got 503 three times (not measured).

Findings:
- The stream ends by **closing the connection** after the last event's `\r\n\r\n`; no terminal marker.
- The **`functionCall` part arrives whole in one chunk** (name, object `args`, `id`), with its
  `thoughtSignature` on the same part.
- **The chunk with the `functionCall` carries no `finishReason`**; `finishReason: "STOP"` arrives on the
  next chunk, whose only part is an empty text part. So a functionCall turn ends with STOP, and the U-04
  map (a candidate holding a functionCall under STOP or absent maps to tool_calls) fits, provided the
  accumulator keeps calls from earlier chunks.
- **`usageMetadata` is on every chunk and cumulative** (each value is the running total; the last chunk
  holds the final counts). `thoughtsTokenCount` is reported separately and is not included in
  `candidatesTokenCount` (66 + 18 + 38 = 122).
- A plain-text answer ends with an empty-text part carrying a `thoughtSignature` (E-37's "a part with
  empty text").

## Probe (8): two-turn tool round trip on the compatible endpoint (`gemini-3.8-flash`, streamed)

Turn 1 (`raw/p8-turn1.json`): Moonzila's exact body through `complete()`; first attempt 503, second 200.
Exactly **one chunk carries `extra_content`**: the first, the same chunk that holds the whole tool call, on
the `tool_calls[0]` entry: `"extra_content":{"google":{"thought_signature":"EvoBCvcBAWkU..."}}`.

Turn 2, three variants (all streamed, Moonzila's field set):

| Variant | Request (assistant message) | Status | Body |
|---|---|---|---|
| with signature (`raw/p8-turn2-with-signature.json`) | `{"role":"assistant","content":"","tool_calls":[{"id":"call_80220","type":"function","function":{...},"extra_content":{"google":{"thought_signature":"<as received>"}}}]}` then `{"role":"tool","tool_call_id":"call_80220","content":"# Demo project..."}` | 200 | text answer quoting the tool result; the final chunk carries `delta.extra_content.google.thought_signature` with `finish_reason: "stop"` |
| without signature, sent by `complete()` (`raw/p8-turn2-without-signature.json`) | Moonzila's own replay: same messages, no `extra_content` | **400** | `[{"error": {"code": 400, "message": "Function call is missing a thought_signature in functionCall parts. This is required for tools to work correctly, and missing thought_signature may lead to degraded model performance. Additional data, function call `default_api:read_file` , position 2. Please refer to https://ai.google.dev/gemini-api/docs/thought-signatures for more details.", "status": "INVALID_ARGUMENT"}}]` - `complete()` threw `PROVIDER_HTTP_400` |
| role `"model"` with signature (`raw/p8-turn2-role-model-with-signature.json`) | as the first row, role `model` | 400 | `[{"error": {"code": 400, "message": "Invalid role: model", "status": "INVALID_ARGUMENT"}}]` |

Findings: the streamed carriage is on the `delta.tool_calls[]` entry of the chunk that holds the call; the
signature is required and validated on the compatible endpoint (400 without it); role `assistant` is right
and E-37's sequential sample's role `"model"` is refused. `refusalCode` does not class this 400 as
CONTEXT_LIMIT (correct), but the array-wrapped body means `error.code` is never read.

## Probe (9): countTokens with and without tools (`gemini-3.5-flash-lite`)

`raw/p9-count-tokens.json`, all `POST v1beta/models/gemini-3.5-flash-lite:countTokens` with `x-goog-api-key`.

| Body | Status | Response |
|---|---|---|
| `{"contents":[...]}` | 200 | `{"totalTokens": 9, "promptTokensDetails": [{"modality": "TEXT", "tokenCount": 9}]}` |
| `{"contents":[...],"tools":[{"functionDeclarations":[read_file]}]}` | **400** | `INVALID_ARGUMENT`, `Invalid JSON payload received. Unknown name "tools": Cannot find field.`, details `google.rpc.BadRequest` with one `fieldViolations` entry repeating the message |
| `{"generateContentRequest":{"model":"models/gemini-3.5-flash-lite","contents":[...]}}` | 200 | `totalTokens` 9 |
| `{"generateContentRequest":{"model":"models/gemini-3.5-flash-lite","contents":[...],"tools":[...]}}` | 200 | `totalTokens` **57** |

Finding: tools are counted only inside `generateContentRequest`; a top-level `tools` field is refused.
The same prompt and tool on `generateContent` reported `promptTokenCount` 66, not 57, so countTokens is an
estimate a few tokens below what generation bills (probes 1 and 4). countTokens also accepted a
1,576,157-token prompt without refusing it (probe 2).

## Probe (11): 429 bodies

Three kinds of 429 were met; all are `RESOURCE_EXHAUSTED` with a `google.rpc.QuotaFailure` and a
**`google.rpc.RetryInfo` with `retryDelay`** (whole seconds, rounded down from the message's
"Please retry in ..."). No `Retry-After` header was sent (response headers in the raw files).

| Quota | quotaId | quotaValue | retryDelay seen | Raw |
|---|---|---|---|---|
| input tokens per minute | `GenerateContentInputTokensPerModelPerMinute-FreeTier` | 250000 | `3s`, `30s` | `raw/p11-rate-limits-p2.json`, `raw/p2-over-window.json` |
| requests per day, `gemini-3.8-flash` | `GenerateRequestsPerDayPerProjectPerModel-FreeTier` | 20 | `5155s` ("1h25m55.8s") | `raw/p11-daily-quota-gemini-3.8-flash.json` |
| requests per day, `gemini-3.7-flash` | `GenerateRequestsPerDayPerProjectPerModel-FreeTier` | 20 | about 1h15m | `raw/u06-gemini-3.7-flash.json` (turns 13-21) |

Finding: a retry delay is carried in `details[].retryDelay` of type RetryInfo; a client can read it, and
must not retry a daily-quota 429 within the run (delays of over an hour). E-36 lists only ErrorInfo and
LocalizedMessage among the details entries; the observed 429s carry Help, QuotaFailure and RetryInfo
instead.

## U-06: tool calls through `complete()`

Fixed set of 21 synthetic turns (`u06-tool-calls.ts`): 6 single-call, 5 two-calls-in-one-turn, 5 nested-JSON
(`search_code` with an `options` object holding a boolean, a string array and an integer), 5 that must not
call a tool; 4 tools declared on every turn, each schema with `required` and `additionalProperties: false`;
system message "You are a coding assistant with file tools. Use a tool only when the user's request needs
file access; otherwise answer in text." Profile: `{ kind: 'openai-compatible', endpoint:
'https://generativelanguage.googleapis.com/v1beta/openai', contextTokens: 1048576, outputTokens: 8192 }`.
A 503 was retried once; a 429 with a retry delay over 90 s was not retried.

"Product" is what `complete()` returned: a tool turn passes only with outcome `tool_calls`, the expected
tool, the expected number of calls and arguments that validate against the schema. "Wire" reads the
recorded SSE events directly and applies the same test to what the model sent.

| Model | Turns answered (200) | Product: tool turns ending `tool_calls` with valid args | Product: no-call turns correct / wrongly called | Wire: tool turns with the right valid calls | Wire: no-call turns that called a tool | `complete()` outcomes |
|---|---|---|---|---|---|---|
| `gemini-3.5-flash-lite` | 21 of 21 | **0 of 16** | 5 of 5 / 0 | 16 of 16 | 0 of 5 | 16 `PROVIDER_INVALID_RESPONSE`, 5 `complete` |
| `gemini-3.7-flash` | 8 of 21 (5 x 503, 8 x 429 daily cap) | **0 of 16** (8 answered) | none answered (turns 17-21: 429, 503) | 8 of 8 answered | none answered | 8 `PROVIDER_INVALID_RESPONSE`, 5 `PROVIDER_HTTP_503`, 8 `PROVIDER_HTTP_429` |
| `gemini-3.8-flash` | first attempt: 2 of 8 before the daily cap (`raw/u06-gemini-3.8-flash-first-attempt.log`); rows not saved | 0 of 2 answered | not reached | 2 of 2 answered | not reached | 2 `PROVIDER_INVALID_RESPONSE`, 2 x 503, 4 x 429 |

Every answered tool turn on every model failed in the product for the reason in probe (1): no `index` on
the tool-call entries (and `finish_reason: "stop"` behind it). On the wire every answered tool turn was
right: the expected tool, two calls on the two-call turns, nested arguments that validate, and every
argument string parsed as a JSON object; no no-call turn called a tool. All turns ended with
`finish_reason: "stop"`; no call entry carried an `index`.

## Contradictions with the research brief

- U-18 (1) and the compatible kind assume OpenAI's streamed tool-call shape. Gemini's compatible endpoint
  sends no `tool_calls[].index` and ends tool turns with `finish_reason: "stop"`; Moonzila's accumulator
  and outcome map reject both. U-06's "terminal tool-call finish" cannot occur on this endpoint.
- U-20 noted that "until U-18 (8) records the streamed carriage ... Gemini 3 tool turns through the existing
  kind are marked untested": they are now measured as failing, before the signature question is even reached.
- E-37's sequential OpenAI sample sends the assistant turn with role `"model"`: the endpoint answers
  400 `Invalid role: model`. Role `assistant` (Moonzila's) is accepted.
- U-05 / U-18 (2) expected the over-window probe to yield the refusal body; on a free-tier key it cannot
  (input-tokens-per-minute 429 first), and Moonzila's own 2,000,000-character message cap refuses such a
  prompt before sending.
- E-36 names ErrorInfo and LocalizedMessage as details entries; the 429s carry Help, QuotaFailure and
  RetryInfo.
- U-04 left open which finishReason a functionCall turn ends with: STOP, on a separate later chunk with an
  empty text part; the functionCall chunk itself has no finishReason.

## Measured versus not run

| Item | State | Why |
|---|---|---|
| (1) compatible exact body, 3.5-flash-lite and 3.8-flash | measured | - |
| (2) over-window, compatible and native | **not measured** (429 rate limit recorded instead) | free-tier input cap 250,000 tokens/minute; needs a paid-tier key |
| (3) framing | measured | - |
| (4) native stream, tool and text | measured on 3.5-flash-lite; tool only on 3.8-flash | 3.8-flash text prompt: 503 three times |
| (8) two-turn round trip | measured on 3.8-flash | - |
| (9) countTokens | measured | - |
| (11) 429 bodies | measured | - |
| U-06 3.5-flash-lite | measured, 21 of 21 | - |
| U-06 3.7-flash | partial, 8 of 21 | 503 high demand; free-tier cap of 20 requests/day reached |
| U-06 3.8-flash | partial, 2 of 21 answered | 503 high demand; free-tier cap of 20 requests/day reached |
