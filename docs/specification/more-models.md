# More models (plan task after Task 5)

The user's request, October 4: add more models to Moonzila, research first. The research is done
(October 5, both gates pass): `docs/research/2026-10-05-provider-wire-formats` (the wire brief) and
`docs/research/2026-10-05-coding-model-shortlist` (the shortlist brief). The run ledger is
`docs/orchestration/2026-10-05-more-models/RUN.md`; the decisions below are recorded in its
`MANDATE.md`.

## Where Moonzila starts (discovery, October 5)

- Only `openai-compatible` and `ollama` run. `anthropic` and `openai-responses` are declared in
  `ProfileKindSchema` but `complete()` throws NOT_IMPLEMENTED for them (`src/main/inference.ts`).
- The managed local stack (signed catalogue, activation, managed Ollama, selector) has no production
  caller, and on the user's PC no local model can be offered (about 1.2 GB available against a
  reserve of max(2 GiB, 15% of RAM); the CPU has no AVX, shortlist E-31).
- Selection is a profile the user picks per run.

## Phases

One draft pull request per phase, each merged under the AGENTS.md merge checks.

| Phase | Content | Rests on |
|-------|---------|----------|
| 1 | Stream robustness for every OpenAI-shaped vendor; fail-closed locality for a user-run Ollama | wire brief, design points 3 and 8; Decision step 1 (first build step) |
| 2 | The per-message provider-state slot, a per-kind request builder, and the Anthropic Messages adapter with its profile option ([design](more-models-phase2.md)) | wire brief, design points 1, 2, 4-7; Decision step 2 |
| 3 | The OpenAI Responses adapter (and with it gpt-6.1-sol with tools) | wire brief, Decision step 3; shortlist design point 2 |
| 4 | Fixes to the existing kind (DeepSeek, Mistral, OpenRouter, Gemini 3 `extra_content`) and the dated cloud presets with their data-use classes | wire brief, Decision step 4; shortlist Decision, first build step. Needs the user's vendor keys for the day-one probes (wire U-18, shortlist U-06) |
| 5 | The Gemini native adapter (generateContent) | wire brief, Decision step 5 |
| later | Direction 3: an inference-free eligibility display beside the profile picker. Direction 1: the local catalogue, once the managed stack has a production caller and a machine clears the reserve | `reports/2026-10-10-ideas-review.md` section 3; shortlist design point 1 |

## Phase 1 design

### 1. Stream robustness (src/main/provider-stream.ts, the OpenAI-shaped branch of `complete()`)

- `readSse` skips comment lines (a line starting with `:`), such as OpenRouter's
  `: OPENROUTER PROCESSING` (wire E-25). It accepts `event:` lines and keeps the event name with the
  event's data, because Anthropic and the Responses API name their events (E-10, E-33). Other SSE
  fields (`id:`, `retry:`) are ignored. The existing callers keep receiving the parsed data.
- An in-stream failure ends the call as a failure, never as an answer: an error chunk (a top-level
  `error` object, OpenRouter E-25) and a `finish_reason` of `error` (OpenRouter E-25, Mistral E-22),
  `insufficient_system_resource` or `aborted` (DeepSeek E-20).
- `finish_reason` mapping on the OpenAI-shaped path: `stop` (no calls) to complete; `tool_calls` to
  tool_calls; `length` and Mistral's `model_length` (E-22) to incomplete; `content_filter` or a refusal
  to blocked; the failures above and **any value the adapter does not know** to failure. Today an
  unknown value becomes incomplete; a vendor's new failure signal must not be read as a usable partial
  answer.
- OpenRouter repeats `finish_reason` on its usage chunk (E-25): a second terminal chunk with the same
  reason is not an error. A second chunk with a *different* reason is.
- A failure crosses to the engine as PROVIDER_ERROR, as every provider failure does today.

*Set aside:* treating an unknown `finish_reason` as incomplete (today's behaviour). Incomplete keeps
the partial text as a saved message; for an error signal that text is not an answer.

### 2. Fail-closed locality for a user-run Ollama (src/main, before every inference)

A loopback Ollama can serve cloud models (`gpt-oss:120b-cloud`, `gemma4:cloud`) that forward the prompt
to ollama.com (wire E-28, E-29, E-31). Locality is decided from the endpoint host alone
(`validateEndpoint`), so such a model is labelled local today, and a local-only project would send
its prompt off the machine.

- Before each inference on a profile of kind `ollama`, when the run's effective inference policy is
  local-only (the session's or the project's), main reads `GET <endpoint>/api/status` through the
  local network session, bounded (5 s, 64 KiB, no redirects), and continues only when it answers 200
  with `cloud.disabled === true` (wire E-28: "To use only local models, disable cloud features";
  E-30, E-31). Anything else - another status, a missing field, `false`, a timeout, a body that is
  not JSON - refuses the call with the new code `LOCAL_MODEL_UNVERIFIED`, before any prompt byte is
  sent.
- The engine shows: "Moonzila could not confirm that this Ollama keeps prompts on this computer, and
  this conversation is local only. Ollama can send prompts to ollama.com cloud models unless its cloud
  features are off. Check that Ollama is running and up to date, turn off its cloud features (set
  OLLAMA_NO_CLOUD=1, or "disable_ollama_cloud": true in Ollama's server.json), restart Ollama, then try
  again." One message covers every refusal - cloud reported on, an Ollama without `/api/status`, one not
  running - so it claims only what Moonzila knows (unit review U2-R4). No retry.
- Under a cloud-allowed policy nothing changes.
- The managed runtime already makes the same check at startup (`src/models/managed-ollama.ts`); this
  extends it to profiles the user points at their own Ollama.
- `LOCAL_MODEL_UNVERIFIED` is a public error code and a new value of the internal `inference.error`
  code; `inferenceErrorCode` passes it through.

*Set aside:* (a) a warning that still sends - a local-only policy is a promise, and a warning after
the prompt left would not keep it; (b) checking only at profile save - the user can restart Ollama
with cloud on between runs; (c) the finer per-model rule (the model's `remote_host`, a `:cloud` tag)
- how Ollama classes a reference as cloud-sourced is not stated on any captured page, so it stays
off until the day-one probe U-18 (10) records it (wire design point 8).

*Known limit:* an `openai-compatible` profile on a loopback address (Ollama's `/v1`, LM Studio, a
local proxy) is still labelled local without a check. Moonzila cannot verify what a generic local
server forwards to. Recorded for the locality label work in a later phase.

### Tests the builders owe

- `readSse`: comment lines skipped; `event:` names kept; `id:`/`retry:` ignored; fixtures copied from
  E-10 (Anthropic's basic and tool-use streams, with `ping` and an `error` event) and E-25
  (OpenRouter's comment line, the usage chunk repeating `finish_reason`, the mid-stream error chunk).
- `complete()` on the OpenAI-shaped path: each failure signal fails the call and saves no answer; an
  unknown `finish_reason` fails; `model_length` is incomplete; a repeated identical terminal reason
  is accepted, a changed one fails.
- Locality: under local-only, each refusal case (non-200, `disabled: false`, field missing, non-JSON,
  timeout, oversized body, redirect) refuses before the chat request is sent (the fake server sees
  no `/api/chat` request); `disabled: true` lets it through; under cloud-allowed no status request is
  made; the check runs before every inference step, not once per run; the managed path is unchanged.
- Every new test is shown failing with its guard removed.

### As built (Phase 1)

Recorded from the build, the unit reviews and the integration review
(`docs/orchestration/2026-10-05-more-models/reports/p1-integration-review.json`).

- `readSse` is split in two: `readSseEvents` yields `{ event, data }`, keeping the event name for the
  Phase 2 and 3 adapters, and `readSse` yields only the data, so its existing callers are unchanged.
  Line ends are the reader's existing `\n` and `\r\n`; a lone CR is not a line end (recorded for later).
- Internal messages, all crossing to the engine as PROVIDER_ERROR: a non-null top-level `error`, in a
  stream chunk or in a plain JSON answer, is `PROVIDER_STREAM_ERROR`; a failure or unknown
  `finish_reason` is `PROVIDER_FINISH_FAILED`; a second, different reason is
  `PROVIDER_INVALID_RESPONSE`. `"error": null` on a normal chunk is no error.
- An empty `finish_reason` counts as no reason (the stream accumulator always skipped it; unit review
  U1-R2), and no reason at all - a stream cut short - stays incomplete, as before. This rule comes from
  the U1 builder brief (`briefs/p1-u1-builder.md`), not from the design above, which names only values.
- The status request is `GET` with `redirect: 'error'`, `credentials: 'omit'` and `cache: 'no-store'`,
  no header and no body, through the local session; a test pins that exact request. Under Electron the
  last two matter: `session.fetch` turns a default request into one that carries the session's cookies
  and HTTP authentication (integration review INV-1), and the session's HTTP cache could otherwise
  answer a later step with an earlier `disabled: true` (BRK-1). Electron enforces `redirect: 'error'`;
  its responses never report `redirected`, so that second check only catches fetchers that do.
- Default-path impact: local-only is the default for folder-free chats and new projects, and Ollama's
  cloud features are on unless the user turns them off, so a stock user-run Ollama is now refused in
  those chats until they are off. README.md and `docs/development-status.md` say so.
- What the tests do not reach: the order inside `infer()` (the check, then `complete()`) is pinned by
  reading `src/main/index.ts` as text, and the behavioural tests call a helper that copies that order;
  an `infer()` harness was set aside. Electron's credential and cache behaviour was shown with the
  integration review's Electron harness; the unit tests run on Node's fetch and pin the request instead.
  The Windows e2e run is the one place the real app is seen doing it: every fake Ollama a local-only
  run reaches answers `/api/status` with cloud disabled (`e2e/fixtures/ollama-status.ts`), and `e2e/workbench.spec.ts` asserts
  one status request before its one chat request.
- Fixtures not copied from a capture, each marked in its test: the `id:`/`retry:` lines (no captured
  stream uses them), the message text in the Mistral `model_length` test, and the `404 page not found`
  body.

## Recorded for later

- An `openai-compatible` profile on a loopback address (Ollama's `/v1`, LM Studio, a local proxy) is
  labelled local without a check (Phase 1 known limit; integration review MM-P1-SPEC-5). Ollama's `/v1`
  sits in front of the same handler that forwards cloud models (wire E-31).
- An `infer()` harness, so the check-before-`complete()` order is shown by behaviour, not source text
  (MM-P1-SPEC-6).
- Chat requests set no `credentials`, so under Electron they carry the session's cookies and HTTP
  authentication (INV-5): pass `credentials: 'omit'` in the Phase 2 per-kind request builder and pin it.
- `lines()` in `src/main/provider-stream.ts`: a lone CR is not a line end (BRK-4), and each chunk
  re-splits the whole pending buffer, which is quadratic on one long event trickled in small chunks
  (BRK-5). Both predate Phase 1; no captured vendor uses a lone CR.
- `profile.test` passes against a user-run Ollama with cloud on, and the first local-only run is then
  refused. A warning there needs a contract change.
