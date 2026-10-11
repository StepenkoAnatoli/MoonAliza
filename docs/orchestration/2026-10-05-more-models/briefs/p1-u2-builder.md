# Builder brief: Phase 1, U2 fail-closed Ollama locality

Read `briefs/p1-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p1-u2`, branch
`build/mm-p1-u2`, base `304ba1e` (which already carries the LOCAL_MODEL_UNVERIFIED contract: the
public code, the internal `inference.error` code, `inferenceErrorCode` and the engine's message).

**Requirements:** F-5, F-6, S-1, T-1 (REQUIREMENTS-P1.md). **Spec:** more-models.md, Phase 1 design
section 2.

**You own:** a new `src/main/ollama-locality.ts`; its call inside `infer()` in `src/main/index.ts`
(nothing else in that file); `tests/ollama-locality.test.ts` (and, if `infer()` can only be tested
through an existing harness, the smallest addition to that harness); `docs/ARCHITECTURE.md`, the
privacy paragraph (the one that begins "Privacy changes require an explicit project-policy update").
Do not touch `src/main/inference.ts`, the managed runtime or the renderer.

**What to build**
1. A function (for example `assertOllamaLocal(endpoint, fetcher, signal)`) that reads
   `GET <endpoint>/api/status` with `redirect: 'error'`, no credential, a 5 s timeout combined with the
   run's signal, and a 64 KiB body bound. It returns only when the answer is 200 and the body parses as
   JSON with `cloud.disabled === true`. Every other outcome throws `LOCAL_MODEL_UNVERIFIED`: another
   status, a missing or non-boolean field, `false`, a non-JSON or oversized body, a redirect, a network
   error, a timeout. A cancelled run still crosses as cancelled (`RUN_CANCELLED`), not as this code.
   The response shape is the one `src/models/managed-ollama.ts` already parses at startup
   (`{ cloud: { disabled: boolean } }`); evidence: wire E-28
   (`raw/2026-10-05-cloud-ollama-ollama-a13ccce8.md`: "To use only local models, disable cloud
   features"), E-30 (`raw/2026-10-05-types-go-githubusercontent-4d8bd3e9.md`, the StatusResponse and
   CloudStatus types), E-31 (`raw/2026-10-05-routes-go-githubusercontent-6669b9b0.md`, the
   `/api/status` handler).
2. In `infer()`, after the existing policy and endpoint checks and before `complete()`, when the
   profile's kind is `ollama` and the run's effective inference policy is local-only (the session's
   policy or the project's, from the same `run.context` the function already reads), call it with the
   local session's fetcher. Under cloud-allowed make no status request. It runs on every call of
   `infer()`, so before every model step.
3. Nothing changes for `openai-compatible` profiles, for the managed runtime, or for `profile.test`.

**Tests owed:** every refusal case above refuses before the chat request is sent (a local fake server
records that no `/api/chat` request arrived); `disabled: true` lets the chat request through; under
cloud-allowed no `/api/status` request is made; two consecutive steps of one run each make one status
request; the status request carries no `Authorization` header and no prompt text; a cancelled run is
`RUN_CANCELLED`. Each test shown red with its guard removed.

**Pre-mortem:** the check placed after `complete()` starts (a prompt byte already sent); the effective
policy read from only one of session and project; a 3xx followed; a timeout that hangs past 5 s; an
`ollama` profile with a trailing path in its endpoint; a test that passes with the guard removed.
