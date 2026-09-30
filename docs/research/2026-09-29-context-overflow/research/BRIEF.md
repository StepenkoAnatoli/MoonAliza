# Brief - Context overflow: what Ollama /api/chat and OpenAI-compatible Chat Completions return when a request exceeds the model's context window

_Auto-drafted 2026-09-29 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require human/agent judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

MoonAliza's context handling (Stage C: "explicit context failure", "accurate context
accounting"). Today the engine estimates 2 characters per token, drops the oldest history,
and raises `CONTEXT_LIMIT` only when the current run alone does not fit
(`src/engine/application.ts`). Anything the estimate misses reaches the provider. Done means
knowing, per provider path MoonAliza supports (native Ollama, Ollama `/v1`,
OpenAI-compatible), what happens to a request larger than the model's window: is it
refused, and with what status and text, or silently truncated? And does the reserved
output count against the window? With that, an overflow can reach the user as
`CONTEXT_LIMIT` rather than `PROVIDER_HTTP_400`, and nothing is dropped unseen.

## What we verified

| Claim | Source | Type |
|---|---|---|
| Ollama's server/routes.go ChatHandler: an absent `truncate` means true, and an absent `shift` means true - so a request that sends neither has its history truncated silently. [quote: truncate := req.Truncate == nil \|\| *req.Truncate] [quote: Shift:           req.Shift == nil \|\| *req.Shift,] | E-13 `raw.githubusercontent.com` (U-01, U-02) | P |
| Ollama's server/prompt.go: with truncate on, chatPrompt drops whole messages from the front until the rendered prompt fits num_ctx, always keeping system messages and the last message; the check compares the prompt alone with num_ctx, so the reply's room is not reserved there. [quote: chatPrompt truncates any messages that exceed the context window of the model] [quote: if ctxLen <= opts.NumCtx {] | E-09 `raw.githubusercontent.com` (U-01) | P |
| Ollama's api/types.go: ChatRequest.Truncate truncates history when the rendered prompt exceeds the context; Shift, when true, shifts history when generation hits the limit instead of erroring. Both are pointers: absent is not false. [quote: // Truncate is a boolean that, when set to true, truncates the chat history messages] [quote: when hitting the context length limit instead of erroring] | E-12 `raw.githubusercontent.com` (U-01) | P |
| Ollama's /api/chat reference documents model, messages, tools, format, options, stream, think, keep_alive and logprobs - and neither `truncate` nor `shift`, which MoonAliza's managed path sends. [quote: Runtime options that control text generation] The fields are defined only in source (E-12, E-13). | E-08 `docs.ollama.com` (U-01) | P |
| Ollama's openai/openai.go: the /v1 chat converter builds its api.ChatRequest without Truncate or Shift, so /v1 always gets the defaults (E-13) and a client cannot refuse truncation. [quote: DebugRenderOnly: r.DebugRenderOnly, ... KeepAlive: r.KeepAlive,] | E-10 `raw.githubusercontent.com` (U-02) | P |
| Ollama's OpenAI-compatibility page (owner): lists supported request fields; `truncation` is unchecked (unsupported) in the /v1/responses list. The page gives no way to refuse truncation on the /v1 paths. | E-06 `docs.ollama.com` (U-02) | P |
| OpenAI's error-codes guide names no code for a request over the context window: it falls under 400 BadRequestError, and only the message says why. [quote: The error message should advise you on the specific error] | E-11 `platform.openai.com` (U-03) | P |
| Open WebUI's troubleshooting page lists overflow errors from different providers, each worded differently, and says they come from the provider, not the client. [quote: These come from the **model provider**] [quote: This model's maximum context length is 128000 tokens.] It also says Open WebUI does not truncate silently. | E-04 `docs.openwebui.com` (U-03) | S |
| Another client's bug report against llama-server, an OpenAI-compatible local server: an over-window request is refused as HTTP 400 with its own wording. [quote: 400 the request exceeds the available context size, try increasing it] Shows that OpenAI-compatible servers word overflow differently from OpenAI. | E-02 `github.com` (U-03) | S |

## Contradictions and how they were resolved

**Ollama's reference against its source (E-08 against E-12, E-13).**
- The `/api/chat` reference documents neither `truncate` nor `shift`.
- The source defines both, and turns both on when they are absent.
- I trust the source: it is what runs. The docs' silence is why a client can miss this.
  MoonAliza's managed path already sends both as false, while its user-profile path sends
  neither.

**Ollama's truncation against MoonAliza's own rule (E-09).**
- Ollama drops whole messages from the front, keeping system messages and the last one.
- MoonAliza's plan requires tool exchanges to stay intact: a tool call is never kept
  without its result. Ollama's truncation can split such a pair.
- This is no disagreement between sources, but it is why MoonAliza must do its own trimming
  and refuse Ollama's.

**No portable overflow signal (E-11 against E-04, E-02).**
- OpenAI names no error code: a plain 400, with the reason only in the message.
- Other OpenAI-compatible servers word it differently.
- Nothing is wrong, and nothing is standard either.

## Known unknowns

- **U-04** - Does the reserved output (`max_completion_tokens` / `num_predict`) count against the window check?
  - Known so far: Ollama's admission check compares the prompt alone with num_ctx (E-09); OpenAI documents nothing (E-11). MoonAliza's budget reserves the output either way, which is safe.
  - Day-one verification: send an OpenAI request whose input fits but input + max_completion_tokens does not, and record whether it is refused
- **U-05** - Native Ollama with `truncate: false`: what status and text come back when the prompt does not fit?
  - Known so far: the refusal is raised in Ollama's runner, not in the files collected (E-14).
  - Day-one verification: against a local Ollama, POST /api/chat with truncate false, shift false and a prompt over num_ctx, and record the status and body

## Decision

**1. Every native Ollama request sends `truncate: false` and `shift: false`, not only the
managed ones.**
- **Today:** a user's own Ollama profile sends neither, so Ollama drops old messages
  silently (E-13, E-09). That can split a tool call from its result.
- **With the change:** MoonAliza keeps doing its own history trimming, which drops whole
  turns from the oldest end before sending. Ollama then refuses a request that still does
  not fit, instead of rewriting it.

**2. An over-window refusal becomes `CONTEXT_LIMIT`, not `PROVIDER_HTTP_400`.**
- There is no code to key on (E-11). On a 400, `inference.ts` reads the bounded error body
  and matches it against a short list of overflow phrasings, taken from E-02 and E-04:
  `context length`, `context size`, `context window`, `maximum context`, `exceeds`
  together with `context`.
- **Match:** the call ends as `CONTEXT_LIMIT`, which MoonAliza already explains to the user.
- **No match:** the call stays `PROVIDER_HTTP_400`.
- **The body is never surfaced.** This keeps the existing rule that provider error text
  stays out of exceptions (`tests/provider-transport.test.ts`).
- Add U-05's text to the list once it is recorded.

**3. Ollama's `/v1` endpoint cannot refuse truncation (E-10).**
- MoonAliza's `ollama` profile kind uses the native API, so it is unaffected.
- An `openai-compatible` profile pointed at a local Ollama gets Ollama's silent truncation.
  MoonAliza's own pre-send trimming is the only guard there.
- Say so where the profile is set up, and recommend the `ollama` kind for local models.

**4. The budget keeps reserving the reply** (`contextTokens - outputTokens`). U-04 leaves
open whether providers count it, and reserving is the safe side either way.

**Out of scope:**
- Calibrating the estimate from real usage: that is decided in
  `docs/research/2026-09-28-open-gaps`.
- Summarising old turns (Open WebUI's "compaction", E-04). That is a product feature, not
  a fix.

**First build step:** in `tests/provider-transport.test.ts`, assert that a non-managed
Ollama request body carries `truncate: false` and `shift: false`, and fails today. Then
assert that a 400 whose body says "This model's maximum context length is 128000 tokens"
ends as `CONTEXT_LIMIT` without the body in the error, while a 400 saying something else
stays `PROVIDER_HTTP_400`.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "$HOME/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=550e86cb0537961a inputs=870f23562514b474 gate=pass -->
