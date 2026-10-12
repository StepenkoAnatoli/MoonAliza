# More models, Phase 2 design

Phase 2 builds the per-message provider-state slot, a per-kind request builder and the Anthropic
Messages adapter with its profile option (MANDATE.md decision 2), and decides how Anthropic thinking is
replayed (decision 5). Requirements: `docs/orchestration/2026-10-05-more-models/REQUIREMENTS-P2.md`. Evidence: the wire brief (design points 1,
2, 4-7; Decision step 2), its rows E-08 to E-15, the reused thinking capture
`docs/handoff/work/research/raw/2026-09-24-thinking-claude-platform-docs-claude-03550646.md` (cited
as H-E03; its row states only the preservation rule, every other line cited is a capture-only fact),
and the shortlist (SL-E01: claude-fable-5-1, claude-opus-5-5 and claude-sonnet-5-5 with a 1M window and
128K output; claude-haiku-4-5-20251001 with 200K and 64K, retiring not sooner than 2026-10-15; SL-E11
and SL-E17: Anthropic's commercial terms and API data-retention page).
"E-nn l.N" is line N of that row's capture, "SL-Enn l.N" a line of the shortlist row's capture. Code
lines are at `3bba21c`.

Anthropic's live probes (the Anthropic parts of wire U-18) had not run when this was written: no key had
reached the probe session. Nothing below depends on a probe; every fact only a probe can show is in "Day
one" below, with the behaviour until then. They ran on 2026-10-12, after the build began; "As built
(Phase 2)" records the outcomes.

Two departures from the wire brief, each decided below: the slot does not go "through the wire-state
store" (Decision step 1) in this phase, because nothing in Phase 2 reads state across runs (section 1);
and the adapter ships without the optional workspace setting (Decision step 2), because that setting
needs a schema migration (section 7).

### 1. The provider-state slot (src/engine/control.ts, src/main/inference.ts)

- **Shape.** `ProviderStateSchema = { format, appendOnly, data }`, strict:
  - `format` matches `^[a-z][a-z0-9-]{0,47}@[1-9][0-9]{0,2}$` and names the wire dialect and its
    version; Phase 2 has one, `anthropic-messages@1`. A tag, not the kind, because one kind will carry
    several dialects (DeepSeek, OpenRouter and Gemini's compatible layer are all `openai-compatible`).
  - `appendOnly` is set by the adapter when the vendor binds this state to an unchanged request prefix
    (E-12 l.283); for Anthropic, when the content holds a `thinking` or `redacted_thinking` block.
  - `data` is adapter-owned JSON text of 2 to `PROVIDER_STATE_MAX` = 4,194,304 characters, the stream
    reader's own cap (`src/main/provider-stream.ts:57`), which already bounds the response a state is
    built from; a state over it is PROVIDER_RESPONSE_TOO_LARGE. Zod bounds a string in constant time; the
    engine never parses it.
- **Where.** `InferenceMessage.providerState?` and `Completion.providerState?`
  (`src/main/inference.ts:10-11`). `InferenceMessageSchema` accepts it only on an assistant message
  that has `toolCalls`; `CompletionSchema` only with outcome `tool_calls` (`control.ts:78-88`). Both
  stay strict and change in one commit: a field missing from `InferenceMessageSchema` makes main drop
  the request without a word (`src/main/engine.ts:46-47`) and the run waits for its deadline; one missing
  from `CompletionSchema` fails every step (`engine.ts:84-86`).
- `MessageSchema`, `EventSchema` and `ToolCallSchema` are unchanged: state never travels on a stored
  message, an event or a tool call.
- **Ownership.** Only the adapter whose kind owns the format parses `data`, with its own strict schema
  (`docs/specification/source-plan.md:645`). Main refuses a message whose state the target kind does
  not own, before any fetch (`source-plan.md:646`): `openai-compatible` and `ollama` own none.
- **No migration.** `SCHEMA_VERSION` stays 4. `provider_wire_state` (`src/engine/migrations.ts:49-53`),
  `putWireState`/`getWireState` (`src/engine/store.ts:227-239`) and `ProviderWireStateSchema`
  (`src/shared/contracts.ts:37`) stay as they are and unused; nothing in `src` has ever called them.
- **Invariant.** AGENTS.md gains one row (D-2): "Provider state (adapter-owned model output: thinking,
  signatures, raw content blocks) lives only in a run's memory: never in the database, events, search
  index, renderer or logs, and never sent to a kind that does not own its format", its Evidence the
  strip and byte-scan test, the e2e userData scan, the ownership refusals and the contract refines. It
  only narrows what Phase 2 does; the later phase that persists state changes the row, and that change
  goes to the user.

*Set aside:* (a) persisting the state now. Within a run it is in memory; across runs it is never
replayed (section 3), so a stored row would have no reader and would put signatures and any thinking
summary at rest (no `secure_delete` pragma is set). The table already fits every later vendor (one row
per assistant message, a revision foreign key, `json_valid`); the first phase with a reader adds the
write inside `message()`'s transaction, a bulk read at history assembly (`application.ts:347`), the
identity envelope (built by the engine, which knows the revision) and a `getWireState` that returns
"no state" on a mismatch instead of throwing (`store.ts:237`). (b) A structured payload with a per-call
map in the IPC schema: Phase 4's per-call state (wire E-37) fits inside `data`, and an untrusted tree in
a recursive schema needs its own bounded walk. (c) An untagged string: the tag lets main refuse a
foreign state without parsing it. (d) A column on `messages`, event payloads or `ToolCall` fields: they
reach `SELECT *` readers, the search-index trigger, the strict DTOs and `tool.started`.

*Known limit:* Phase 4 must widen both refines (DeepSeek needs state on plain answers, wire E-19). Main
and the engine ship in one build, so that is a schema change, not a compatibility problem.

### 2. The engine carries the slot (src/engine/application.ts)

- `message(run, value, partial)` (`:276-281`) destructures `{ providerState, ...visible }` and builds
  the stored message and its `message.created` payload from `visible` only. Without this, the spread at
  `:277` writes the state into the `events` table (`store.ts:186` stores the payload as JSON), and the
  strict `EventSchema` (`src/shared/events.ts:16`) makes main drop the live event.
- A tool step (`:371-372`) builds `{ role: 'assistant', content, toolCalls, providerState? }`, passes it
  to `message()`, which strips the state, and pushes it onto `current`, which keeps it for the next
  request. A final answer (`:365`) carries none.
- The state lives exactly as long as `current`. Runs never resume: startup marks active runs
  interrupted (`store.ts:382`) and main aborts runs when the engine exits (`engine.ts:89-95`), so a
  restart loses nothing that could be used.

### 3. Thinking replay: append-only within a run (Mandate decision 5)

**Decision: remedy A, an append-only history, inside each run.** Every `thinking` and
`redacted_thinking` block of the current run's tool steps goes back exactly as received, inside its
message's whole content array; once a step returns such a block, the run's later requests only append;
thinking from earlier runs is never replayed; no `thinking` field, `anthropic-beta` header or
`block_binding` is sent.

What the evidence requires:
- On Fable 5.1, Opus 5.5 and Sonnet 5.5 a replayed thinking block is accepted "only while the `system`
  prompt, `tools`, and messages that preceded it are unchanged"; accounts created on or after
  2026-08-31 get a 400 otherwise (E-12 l.283-287). Opus 5.5 and Sonnet 5.5 are shortlisted (SL-E01).
- The latest assistant turn's thinking blocks go back with its tool results, unmodified, in order, empty
  ones included (E-13 l.85; E-12 l.167-175; H-E03 l.389).
- Outside tool use, earlier turns' thinking may be left out: "Allowed: outside tool use, omit prior
  turns' thinking" (H-E03 l.383-385; E-13 l.97).
- Anthropic's own advice: "Make your integration append-only regardless of your account's age"
  (H-E03 l.512); "send every assistant turn back exactly as you received it and add new messages only at
  the end" (l.514); append-only is the first remedy E-12 l.291 names.

How it maps onto MoonAliza. A run is one prompt and its tool loop, which is one tool-use turn. Its system
prompt and tools are fixed before the loop (`application.ts:339-354`); the only mid-run edits are
dropping history turns (`context.ts:41`) and cutting earlier results to the 0-byte excerpt (`:43`) at
a later step. History keeps only earlier runs' final texts (`application.ts:347`), which is allowed.

Rules (`src/engine/context.ts`, `application.ts`):
1. `PREFIX_BOUND_KINDS = new Set(['anthropic'])`, exported from `context.ts`, with the E-12 reason.
2. **Reserve.** While a run of such a kind that offers tools is not frozen, `assembleContext` gets
   `historyReserve: true`: before today's loops it drops leading history turns until system, history and
   current fit within half the input budget (`floor((contextTokens - outputTokens) / 2)`, by
   `estimateInput`) and within 500 messages. Today's loops then run unchanged on the full budget. A run
   without tools is a single step (any call is unoffered, `:370`) and keeps full trimming.
3. **Freeze.** After a tool step whose `Completion.providerState.appendOnly` is true, the run is frozen
   for its remaining steps; the base is the request that produced that state.
4. **Frozen step.** A new `continueContext({ previous, added, tools, contextTokens, outputTokens })`
   returns the previous request's messages unchanged, followed by the `current` entries added since it
   was sent: the assistant message as it is and each new result at the deterministic 3,072-byte excerpt
   (`:36`). While the request is over budget, the oldest added result not yet at the 0-byte excerpt is
   cut to it. History is never dropped again, and a message already sent never changes. If it still does
   not fit, or exceeds 1000 messages, `fits` is false and the run ends with CONTEXT_LIMIT (`:360`).
   `ContextState` carries `omittedHistoryMessages` from the base and adds the new compactions.
5. An unfrozen step (no state yet, or only `appendOnly: false` states, such as Haiku 4.5 without
   thinking) assembles as today, with the reserve. Other kinds are unchanged.
6. **Message.** A frozen run that fails with CONTEXT_LIMIT gets its own text, whichever side found the
   overflow: the local estimate (`fits` false, `:360`) or the provider (a 400 "prompt is too long"
   crossing from main as CONTEXT_LIMIT). The public code stays CONTEXT_LIMIT: "This task outgrew the
   selected model's context budget. This provider needs the earlier steps of a task sent back
   unchanged, so MoonAliza could not shorten them while the task ran. Saved messages and any applied
   changes remain available; commands are not retried. Split the task into smaller requests, or open
   Model profiles to check the model's supported context and response reserve." The existing text
   (`:393`) says "after reducing saved tool excerpts", which a frozen run did not do. The frozen text
   is a separate constant chosen where the `run.failed` event is built, so the `failures` map line is
   not edited by U1. Review runs, frozen or not, keep REVIEW_CONTEXT_LIMIT and their own message
   (`:410`), which is true for both.

Why the reserve: without it, step 1 trims history to just under the budget, and step 2 adds an
assistant message whose signature carries the encrypted full thinking (H-E03 l.137) plus up to eight
results, so every tool run in a long session would end at step 2. Half is MoonAliza's own heuristic,
not an external fact; on a 1M-window model with a 128K response reserve it still leaves about 436K
estimated tokens for system, history and prompt.

Why A: it rests only on captured facts and MoonAliza's code; it needs no request field, so one request
shape serves all four shortlisted models whatever the account's age; and it keeps the reasoning
continuity replay exists for (H-E03 l.376-378) or fails visibly.

*Set aside:* (B) the `thinking-binding-controls-2026-08-01` beta header with
`prefix_mismatch_behavior: "drop_block"`: no capture contains the header's name (no file in either corpus
contains `anthropic-beta`; E-12 l.293 only links the beta-headers page), and the preserved-thinking page
that says what counts as an edit and what `input_transformations` holds was not collected (H-E03
l.516-519); it needs a `thinking` object, which on Sonnet 5.5 must be adaptive (E-12 l.291) while Haiku
4.5 refuses adaptive (l.191-195), and `block_binding` without the header is a 400 (l.293-296); mid-loop
it drops the very block the model continues from (E-12 l.167; E-13 l.85; H-E03 l.378); and collecting
the two pages is metered collection. (C) Stripping thinking from the edited turn on: stated only for
`between_tools` (E-12 l.291), and mid-loop it is the "filtered out" 400 (l.167). (D) Server-side
compaction or context editing (H-E03 l.517): pages not collected. (E) Freezing without a reserve:
fails at step 2 in long sessions. (F) Freezing every Anthropic tool run from step 1: blocks compaction
for runs that never think, and gains nothing. (G) Storing final answers' thinking to replay it in the
next run: the cross-run prefix cannot be kept (history drops tool turns; system prompt and tools change
with mode and project), so the replayed block would draw the 400 of E-12 l.283.

*Known limit:* (1) An Anthropic run that offers tools sees at most about half the input budget, and 500
messages, of earlier conversation, even when the model never thinks: the reserve is chosen before any
response arrives. (2) A frozen run whose own steps outgrow the rest ends with CONTEXT_LIMIT where other
kinds would trim; `modelStepBudget` allows up to 120 steps (`SettingsSchema`, `src/shared/params.ts:74`),
each adding up to nine messages (one assistant message and at most eight results, `application.ts:370`),
more than the 1000-message cap. (3) On accounts created before 2026-08-31 the prefix check is off unless
`block_binding` is set (H-E03 l.512): the freeze costs the same there and protects nothing. (4) A later
run's latest assistant message is an earlier answer without its thinking: H-E03 l.385 allows it, but
E-12 l.167 refuses blocks "filtered out" of the latest assistant message. Day-one D6 settles which
applies; if it is refused, the only remedy is (B), which first needs the two pages collected (a user
decision, metered). (5) The reserve keeps half the budget free of history only: unfrozen steps before
the first thinking block (no state, or `appendOnly: false` states) grow `current` like any other run,
and once history is gone today's loops cut their results to the 0-byte excerpt. A freeze that comes
after such steps starts from a request already near the full budget, so the run can end with
CONTEXT_LIMIT a step or two later, where an unfrozen run would keep compacting. Day-one D16 and
frozen-run CONTEXT_LIMIT reports decide whether the reserve should also bound `current`.

### 4. The per-kind request builder (src/main/inference.ts, src/main/provider-kind.ts)

`complete()` keeps its parameters (its options object gains one optional field, `retry?: boolean`,
default true, frozen in U0: `false` turns retries off for the call, `post()` below; `profile.test` passes
it, section 6) and today's order (`:147-165`): cancellation; `validateEndpoint`;
profile checks; the kind's part (a kind without one, `openai-responses`, throws NOT_IMPLEMENTED before
any fetch, replacing `:152`); the `managedOllama` check (`:157`); `checkTranscript`; tools
(`:159-161`); the body and its 8 MiB cap (`:165`); the part's deadline timer (Timeouts, below; it
replaces `AbortSignal.timeout(120_000)` at `:155`, which has no effect before the fetch, so starting the
timer after the checks changes no error); `post()`; `part.read`; the cancellation re-check (`:175`);
`part.outcome`.

- **Order pins, written before the move (U2 commit 1, on the unchanged code).** For each adjacent pair
  of today's checks whose errors differ (cancellation and endpoint, RUN_CANCELLED over
  INVALID_ENDPOINT; endpoint and profile; profile and kind, INVALID_PROFILE over NOT_IMPLEMENTED for an
  `openai-responses` profile; kind and managed-Ollama, NOT_IMPLEMENTED over INVALID_PROFILE; managed-Ollama
  and transcript, INVALID_PROFILE over INVALID_INFERENCE_REQUEST), an input failing both gets the
  earlier check's error and no fetch. Each pin passes on today's code and is shown red under the swap of
  its own two checks (five named mutations, each run once and reverted). The transcript, tools and
  body-size checks all throw INVALID_INFERENCE_REQUEST, so their relative order is not observable and is
  not pinned; each is pinned as refused with no fetch (red when that check is moved after the fetch).
  Commit 2 must pass every pin unchanged, so a reordering made by the refactor shows red instead of
  being pinned as the new order.
- **The one new check (U2 commit 2).** The ownership refusal joins the transcript check: a foreign state
  on an otherwise valid request is refused with no fetch, red first (the U0 base accepts the field and
  sends the request); its place after the managed-Ollama check is pinned by one pair (invalid managed
  options plus a foreign state give INVALID_PROFILE), shown red under the mutation that runs the
  ownership check first. Its place before the tools and body-size checks is not observable (the same
  error) and is not claimed.

- **The part** (`KindPart`, types only in the new `src/main/provider-kind.ts`, frozen in U0):
  `url(endpoint, profile)`, `headers(profile, secret)`, `timeoutMs`, `owns` (formats accepted on input),
  `refusalStatuses`, a pure `body(...)` that throws INVALID_INFERENCE_REQUEST, `read(response)` (framing
  and accumulation), a pure `outcome(folded, check)` (stop map, usage, calls, state), `isOverflow(text)`
  and an optional `retryDelayMs(response, attempt)`. `url` and `headers` take the profile so a later
  kind can route or authenticate by it (the existing kinds route by kind today, `:166`); for the
  existing kinds they return today's values. Splitting `read` from `outcome` keeps today's order (a Stop
  wins over a malformed answer) and lets the outcome table be tested without streams.
- **Timeouts.** `timeoutMs` is one deadline for every attempt of a call, counted from the call's start:
  120,000 for `chatKind` (today's value, unchanged for the existing kinds, with a test that their
  requests still abort at 120 s) and 600,000 for `anthropicKind`. Anthropic's own curl example for
  Messages sets `--max-time 600` (E-09 l.1089); its advice for a 504 on a long-running request is to
  stream it (E-12 l.36), which MoonAliza already does; and its SDKs check non-streaming requests against
  a 10-minute timeout (E-12 l.122). Thinking tokens are generated before the answer and count toward
  `max_tokens` (E-13 l.48), so a step on an always-thinking model can run long (engineering judgment;
  D12 measures it). The vault grant is checked on entry only (`src/main/vault.ts:156-161`), so the
  125 s grant (`index.ts:102`) does not bound a longer call; the run's own duration limit
  (`runDurationMinutes`, default 15, `application.ts:158`) still does. The 4 MiB stream cap stays for
  every kind (known limit, section 5.8).
- **How the deadline is built, so tests can drive it.** `complete()` creates an `AbortController` and a
  `setTimeout` of `part.timeoutMs` that aborts it with
  `new DOMException('The operation was aborted due to timeout', 'TimeoutError')`, the reason
  `AbortSignal.timeout` gives today (checked on Node 24.21.0); joins it to the caller's signal with
  `AbortSignal.any`, as `:155` does; starts it just before `post()`, after every pre-check, so a refused
  input leaves no timer (that moment is what "the call's start" means throughout); and clears it in a
  `finally` around `post()`, `part.read` and `part.outcome`. The retry deadline is `Date.now()` at that
  start plus `part.timeoutMs`. `AbortSignal.timeout` is not used: Node runs its timer internally, out of
  reach of fake timers (vitest 5.0.1, `package.json:58`, fakes `setTimeout`, `setInterval`, `Date` and
  the like, `node_modules/vitest/dist/chunks/index.m3L2HgmY.js:5302-5308`; the critic saw an
  `AbortSignal.timeout(120_000)` still not aborted after `vi.advanceTimersByTimeAsync(121_000)`), whereas
  `vi.useFakeTimers()` fakes `setTimeout` and `Date` by default, so `advanceTimersByTimeAsync` drives
  both the deadline and the retry waits.
  - *The pin on unchanged code (U2 commit 1).* Today's code still calls `AbortSignal.timeout(120_000)`,
    so the 120 s pin replaces it for the test:
    `vi.spyOn(AbortSignal, 'timeout').mockImplementation(ms => { const c = new AbortController(); setTimeout(() => c.abort(new DOMException('The operation was aborted due to timeout', 'TimeoutError')), ms); return c.signal; })`
    under fake timers, restored after the test. The same test, spy kept, passes after commit 2, where the
    spy is no longer called and `complete()`'s own `setTimeout` is the faked timer. Named mutations:
    `AbortSignal.timeout(600_000)` at `:155` in commit 1, `timeoutMs: 600_000` on `chatKind` after it.
  - *The Anthropic deadline (U4)* needs no spy: fake timers drive `complete()`'s own `setTimeout`.
- **`checkTranscript(messages, owns)`** is the validation half of `encodeMessages` (`:47-73`),
  unchanged (strict parse, exactly one result per call, no reused id, nothing pending), plus the
  ownership rule of section 1. It returns the parsed messages and `usedIds`.
- **The existing kinds** become one `chatKind(local)` part in the same file, holding today's mapping
  half of `encodeMessages`, `readStreamed`, the schema checks, the finish map (`:176-200`), usage and the
  refusal rule (400, 413 and 422 bodies; the `error.code` list and `OVERFLOW`, `:104-122`). Their
  requests stay byte-identical; snapshots are committed before the move.
- **`post()`** is the one place that builds the fetch init:
  `{ method: 'POST', headers, body, signal, redirect: 'error', credentials: 'omit' }` (INV-5, recorded in
  Phase 1; the status request already omits credentials, `src/main/ollama-locality.ts:56`). On a non-2xx
  answer it asks `part.retryDelayMs`, unless the call was made with `retry: false`, which never asks; a
  delay is honoured (body cancelled first, the wait abortable by Stop, RUN_CANCELLED) only if it ends
  before the call's deadline (`part.timeoutMs` from the call's start) and fewer than two retries were
  made; otherwise it reads at most 64 KiB of a body whose status
  is in `part.refusalStatuses` and throws CONTEXT_LIMIT when `part.isOverflow(text)`, else
  `PROVIDER_HTTP_<n>`; other bodies are cancelled. `credentials: 'omit'` lands as its own commit (U2's
  commit 3) and stays only on the D10 verdict below.
- **`validateEndpoint`** returns `locality: loopback && kind !== 'anthropic' ? 'local' : 'external'`
  (section 7).
- The anthropic entry joins the kind table only when the adapter is complete (unit U4, which owns the
  runtime `import { anthropicKind } from './anthropic'` line in `inference.ts` and the entry; U2 owns
  the rest of the file outside U0's contract lines, the `inferenceErrorCode` doc comment at `:89-96`
  included), so the kind
  answers NOT_IMPLEMENTED until then.

*Set aside:* moving the existing kinds into a `providers/` directory (a larger change to code existing
users depend on, for no Phase 2 gain); one `encodeMessages` with a kind switch (it would grow every
phase); `cache: 'no-store'` on chat requests (POST answers are not served from cache, and INV-5 names
`credentials` only); a static `path` and `headers(secret)` in the part (a later kind that routes or
authenticates by profile would reopen the frozen interface); `AbortSignal.timeout(part.timeoutMs)`
(fake timers cannot drive it, so neither the 120 s pin nor the 600 s test could be written as
specified); an injected timer factory (a new option on `complete()` or a field on the frozen part, for
what a faked `setTimeout` already gives); leaving `profile.test` on the kind's retry rule (a Test
connection could wait a `retry-after`, or 1 s then 2 s, inside its own 25 s, and its abort landing
during a wait would end it as RUN_CANCELLED, "The run was stopped.", instead of the failure text
section 6 describes).

**Wave-1 check of `credentials: 'omit'` (D10, run by the transport builder, U2, at the end of wave 1).**
In real Electron 44.4.5 under xvfb (`dbus-run-session -- xvfb-run -a`, `--no-sandbox` as root, as
`docs/specification/research-journeys.md:54` records), with the built bundle and local fakes on port 0,
as the Phase 1 breaker harness did. Every case runs at the parent commit and with commit 3, and records
whether the fake (or the proxy) was reached, the headers it saw and the error otherwise:
1. A session made like the provider session, with a cookie planted for the fake's origin
   (`session.cookies.set`): a `post()`-built request reaches the fake with the `Authorization` header and
   without a `Cookie` header.
2. A local HTTP proxy that answers 407 with `Proxy-Authenticate: Basic` until it receives the right
   `Proxy-Authorization`, set on that session with `setProxy` (loopback bypass turned off, and the proxy's
   own log showing it received each request), configured two ways: a plain proxy rule, and a rule
   carrying the credentials in its URL (`http://user:pass@127.0.0.1:<port>`; whether Chromium uses
   them without a handler is not captured, and the run records it). Each rule is run against two
   destinations: the plain-HTTP fake, and an HTTPS fake reached through a `CONNECT` tunnel, the path
   every real provider request takes (an endpoint is `https:` unless it is loopback, `inference.ts:19`),
   and a different authentication path from a proxied plain-HTTP request. The proxy answers the
   `CONNECT` with 407 until it holds the right `Proxy-Authorization`, then tunnels to the fake; the fake
   serves a self-signed certificate made for the run, which the harness accepts on that test session
   only with `session.setCertificateVerifyProc` (`callback(0)` accepts,
   `node_modules/electron/electron.d.ts:13423-13433`), never on the app's own sessions.
3. A destination that answers 401 with `WWW-Authenticate: Basic` until it receives the right
   `Authorization: Basic` (the request sent without a key, so no explicit `Authorization`). The Phase 1
   breaker saw the locality status request, already `credentials: 'omit'`, refuse such a challenge in
   4 ms "with no login event" (`docs/orchestration/2026-10-05-more-models/reports/p1-integration-review.json`).
   Cases 2 and 3 run as the app ships, with no `login` handler (MoonAliza registers none: nothing in
   `src/main` listens for `login`), and again with a harness `app.on('login')` handler that answers the
   challenge. Electron documents that event for requests from a `webContents` or a utility process
   ("Emitted when `webContents` or Utility process wants to do basic auth",
   `node_modules/electron/electron.d.ts:510`), not for `session.fetch` in the main process, so the
   harness-handler runs may fail like the as-shipped ones; if they do, the report says so, and they
   still decide nothing (item 5).
4. **Expected outcome, stated before the run.** Electron 44.4.5's own typings say of the `login` event
   "The default behavior is to cancel all authentications" (`node_modules/electron/electron.d.ts:510-512`),
   and the Phase 1 breaker saw a Basic challenge refused with no login event. So the as-shipped proxy and
   401 runs are expected to fail at the parent commit and with commit 3 alike: such a pair cannot show a
   regression. The one as-shipped configuration that might authenticate without a handler is the rule
   carrying credentials in its URL, which is why it runs over HTTPS too. U2's unit report states this
   expectation beside the outcomes and says, run by run, whether it held.
5. **Verdict, from the as-shipped runs only.** An as-shipped outcome (cases 1 to 3 without a handler)
   that succeeded at the parent commit and fails with commit 3 is a regression (for case 1, the fake
   reached without the `Authorization` header); a cookie still sent with commit 3 means it does nothing,
   and it is dropped as well. When every as-shipped proxy and 401 run failed at the parent, as expected,
   the report says so in these words: "no as-shipped proxy or 401 path worked at the parent", and the
   verdict rests on case 1 alone. That verdict means commit 3 breaks no path that works as the app ships
   today among those run; it is not evidence that proxy authentication is unaffected (a configuration
   that authenticates today, through Windows-integrated sign-in, a client certificate or a `login`
   handler, is not among them: known limit below). The harness-handler runs decide nothing: MoonAliza has
   no `login` handler, so a difference that exists only with one affects no user and would cost the
   cookie protection (INV-5) for no one's benefit; their outcomes are recorded with the out-of-scope
   `login`-handler item ("Recorded for later"). Every outcome goes in U2's unit report and the
   integration report.
6. **A gate at the end of wave 1.** U2 records the verdict before the U4 and U5 briefs are written, and
   the lead writes those briefs from it:
   - commit 3 stays: U4's `complete()` test asserts `credentials: 'omit'` in the exact init; U5 asserts
     no `cookie` header on both sessions; section 8's credentials line and the README sentence (known
     limit below) are written, and the lead's "As built (Phase 2)" records the rule (the lines named
     below);
   - commit 3 goes: U2's branch drops it before integration; U4's exact init has no `credentials`, U5
     has no cookie assertions, neither sentence is written, and INV-5 stays recorded for later;
   - the check cannot run at all (Electron 44.4.5 does not start under xvfb, or the harness cannot be
     built): commit 3 is not merged, the briefs are written as for "commit 3 goes", and INV-5 stays
     recorded for later, with the reason the check could not run.
   If a regression shows after U4 and U5 have landed (the Windows e2e on the exact head is the only
   later run that could show one), the revert is one commit holding commit 3's revert (which takes its
   own `docs/ARCHITECTURE.md` sentence with it) together with U4's `credentials` assertion, U5's
   no-cookie assertions, section 8's line, the README sentence and the "As built (Phase 2)" lines that
   state the rule: the sentence recording that chat requests for every kind are sent with
   `credentials: 'omit'` and D10's verdict, and the known-limit sentence beside it (gateways that need
   Windows-integrated sign-in or a client certificate). In "Recorded for later" the same commit
   replaces the "If commit 3 stays" item with the "If commit 3 is dropped or not merged" item (INV-5,
   with the regression that caused the drop). That set is listed in commit 3's report now, so the revert is
   planned, not improvised.

*Known limit (named in the README and in commit 3's report, if commit 3 stays):* besides cookies,
`credentials: 'omit'` withholds the session's HTTP authentication (Phase 1 saw `session.fetch` carry
both by default, `docs/specification/more-models.md:121-122`) and, by the Fetch standard's definition of
credentials (not in MoonAliza's corpus), TLS client certificates. So an existing `openai-compatible` user
of a gateway that needs Windows-integrated sign-in (NTLM or Negotiate), at a proxy or at the server, or
a client certificate (an mTLS gateway), could lose access with commit 3. None of these can be tested
here (no Windows domain or Negotiate server, and no client certificate installed where Chromium would
offer it), and the Windows e2e runs without a proxy or server authentication. The README sentence:
chat requests no longer carry the app session's cookies or saved sign-ins, so a gateway that needs
Windows-integrated sign-in or a client certificate may refuse them.

### 5. The Anthropic Messages adapter (src/main/anthropic.ts)

One module: request, reader, outcome and refusal rules. It imports only types from `inference.ts` and
`provider-kind.ts`, plus `provider-stream.ts` (`readSseEvents`) and `engine/control.ts`, so there is no
runtime import cycle.

#### 5.1 Route and headers

- Route: `url(endpoint, profile)` returns `<endpoint>/messages`; the form's default endpoint is
  `https://api.anthropic.com/v1`. The API
  is at `https://api.anthropic.com` and Messages is `POST /v1/messages` (E-08 l.14, l.29; E-09 l.18),
  and `.../v1/` is the base URL Anthropic gives its compatible layer (E-15 l.39), so one endpoint shape
  serves both.
- Headers: `Content-Type: application/json` and `anthropic-version: 2023-06-01`, both required (E-08
  l.53-54; the only version on any capture, E-09 l.1087), and `Authorization: Bearer <key>` when a key
  exists ("`Bearer <token>`, where `<token>` is your API key", E-08 l.50), built inside
  `vault.withSecret` as today; `headers(profile, secret)` ignores the profile in Phase 2.
- Not sent: `x-api-key` ("Legacy fallback", E-08 l.51; the day-one fallback, D1), `anthropic-beta`
  (section 3) and `anthropic-workspace-id` (section 7).

#### 5.2 Body

`{ model, max_tokens: profile.outputTokens, system?, messages, tools?, stream: true }`, in that key
order, from a pure function (same input, same bytes).
- `max_tokens`, `messages` and `model` are the fields without the "optional" mark (E-09 l.44, l.58).
  Thinking tokens count toward `max_tokens` (E-13 l.48).
- `system` is a top-level string (E-09 l.597; contradiction 8, E-09 l.115), omitted when empty.
- `tools`, only when non-empty: `{ name, description, input_schema: parameters }` in the offered order,
  keys in that order (E-09 l.856-858). An empty `system` and an empty tool list leave their keys out,
  not `""` or `[]`.
- Never sent:
  - `thinking`. Omitting it runs adaptive thinking (E-12 l.255); `disabled` is a 400 on Fable 5.1 and
    Opus 5.5 (l.203-207) and on Sonnet 5.5 (l.219-223), `enabled` on Claude 4.7 and later (l.179-183),
    `adaptive` on Claude 4.5 and earlier (l.191-195). Omitting it is the only value no shortlisted model
    refuses.
  - `tool_choice`: `any` and `tool` are a 400 on Opus 5.5, Sonnet 5.5 and Fable 5.1 (E-12 l.259-267);
    the default is `auto`.
  - `temperature`, `top_p`, `top_k`: deprecated, and non-default values are a 400 on newer models (E-09
    l.1024-1058; H-E03 l.613).
  - `stream_options`, `cache_control`, `output_config`.

#### 5.3 Message mapping and replay

Every refusal is INVALID_INFERENCE_REQUEST, before any fetch.
- The first message, when it is a system message, becomes `system`; a system message anywhere else is
  refused: there is no system role for input messages (E-09 l.115). The engine sends exactly one, first
  (`context.ts:39`).
- `user` becomes `{ role: 'user', content: string }`. Consecutive user messages (for example an earlier
  prompt whose run kept no answer, or a branch's carried context, then the new prompt) are sent as they
  are, never merged: "Consecutive `user` or `assistant` turns in your request will be combined into a
  single turn" (E-09 l.62).
- `assistant` without tool calls (an earlier run's answer) becomes `{ role: 'assistant', content }`.
- `assistant` with tool calls must carry an `anthropic-messages@1` state; it is never rebuilt
  (`source-plan.md:647`; E-12 l.167, "reconstructed"). The state's `data` is parsed strictly as
  `{ content: Block[] }` with 1 to 512 blocks, each one of: `text` with a string `text`; `thinking` with
  a string `thinking` and a non-empty string `signature`; `redacted_thinking` with a non-empty string
  `data`; `tool_use` with an `IdSchema` id, a tool name and a bounded JSON object `input` (E-09 l.135,
  l.151, l.169, l.179). Other fields on a block are kept as received (section 5.5); together, as one
  object, they must pass `BoundedJsonObjectSchema` (depth 32, 10,000 nodes, 131,072 bytes,
  `control.ts:57-74`), so an untrusted start object cannot carry an unbounded tree. Then:
  - its `tool_use` blocks, in order, equal the message's `toolCalls` by id, name and
    `JSON.stringify(input)` of both, and are as many: the engine executes the canonical calls, so the
    replayed call must be the one whose result follows. Canonical JSON, not `isDeepStrictEqual`: the
    state's input went through `JSON.stringify` and back, so a `-0` in the canonical call is `0` in the
    state, which a deep-equality check would refuse although the bytes sent are the same;
  - its text blocks joined with no separator equal the message's `content`;
  - the content array is sent unchanged.
- Each run of consecutive `tool` messages becomes one user message holding only
  `{ type: 'tool_result', tool_use_id, content: string }` blocks, in transcript order: one per
  `tool_use`, nothing before them and no text after them (E-11 l.316, l.343, l.178; E-09 l.898-907; E-11
  l.143). `is_error` is not sent: its definition is collapsed on the capture (E-09 l.183).
- The last message must be a user message (a tool run counts): a request ending with an assistant
  message is a prefill, a 400 on Claude 4.6 and later (E-12 l.149-157).

**The state refusal table.** The strict state schema is one definition in `anthropic.ts`, used by the
encoder and by the outcome (section 5.5). Every shape it refuses is a row here. The encoder refuses each
with INVALID_INFERENCE_REQUEST before any fetch; where a stream can produce the shape, the outcome (or,
where named, the reader) refuses it with PROVIDER_INVALID_RESPONSE before the completion leaves
`complete()`, so no tool runs. The tests are driven by this table ("Tests the builders owe", U3 and U4).
The encoder's other refusals (a foreign format, a tool step without state, the comparisons with the
canonical calls and content, the system and last-message rules) are not schema shapes and no stream can
produce them; they are tested at the encoder only.

| Shape the state schema refuses | Encoder input (the state's `data`) | Stream that produces it: where it is refused |
|--------------------------------|------------------------------------|---------------------------------------------|
| `data` that is not JSON | `{"content":[` | none: the outcome builds `data` with `JSON.stringify` |
| JSON other than exactly `{ content: [...] }` | `[]`; `{"content":{}}`; a valid `content` plus an extra top-level key | none: the outcome builds that object |
| 0 blocks | `{"content":[]}` | a `tool_use` stop with no block: the outcome (no `tool_use` block, section 5.5) |
| 513 blocks | 513 valid `text` blocks | a 513th `content_block_start`: the reader (section 5.4 bounds); a fold of 513 blocks built directly (the outcome is pure): the outcome |
| a block of an unknown type | a `fallback` block | an unknown block in a `tool_use` stop: the outcome (not replayable) |
| `text` whose `text` is not a string | `"text": null` | a `text` start with `text: null` and no delta: the outcome (with a `text_delta`: the reader, section 5.4) |
| `thinking` whose `thinking` is not a string | `"thinking": 0` | a `thinking` start with `thinking: 0`, a `signature_delta` and no `thinking_delta`: the outcome (with a `thinking_delta`: the reader) |
| `thinking` with no `signature` field | `{"type":"thinking","thinking":""}` | a `thinking` start with no `signature` field and no `signature_delta`: the outcome |
| `thinking` with an empty `signature` | `"signature": ""` | a `thinking` start with `signature: ""` (E-10 l.392's start shape) and no `signature_delta`: the outcome |
| `thinking` whose `signature` is not a string | `"signature": 0` | a `thinking` start with `signature: 0` and no `signature_delta`: the outcome (with one: the reader) |
| `redacted_thinking` with an empty or missing `data` | `"data": ""`; no `data` field | a `redacted_thinking` start with `data: ""`, or with no `data`: the outcome |
| `tool_use` whose `id` fails `IdSchema` | an id with a leading space; an id of 129 characters | a `tool_use` start with that id: the outcome |
| `tool_use` whose `name` fails the tool-name rule | `"name": ""` | a `tool_use` start with that name: the outcome |
| `tool_use` whose `input` is not a bounded JSON object | `"input": []`; an input nested deeper than 32 | `partial_json` that parses to an array, or to an object nested deeper than 32: the outcome |
| a block's extra fields, taken together, outside `BoundedJsonObjectSchema` | an extra field nested deeper than 32; one holding more than 10,000 nodes; one over 131,072 bytes | a start object carrying such a field: the outcome |

#### 5.4 Stream reader (readAnthropic, on readSseEvents)

- The body of a 200 is read as server-sent events whatever its `Content-Type` says: MoonAliza always asks
  for a stream, no capture states the label a live answer carries, and D3 records it. A body that is not
  valid SSE events still fails as it does today: `readSseEvents` throws PROVIDER_INVALID_RESPONSE for a
  `data:` payload that is not JSON or bytes that are not UTF-8 (`provider-stream.ts:23`, `:28`, `:37-39`)
  and `lines()` PROVIDER_EMPTY_RESPONSE for a response without a body (`:14`); a body with no `data:`
  line (a plain JSON object, for example) yields no event, so it has no `message_start` and is
  PROVIDER_INVALID_RESPONSE (section 5.5).
- The data's `type` decides the event; an `event:` name that differs from it is
  PROVIDER_INVALID_RESPONSE ("Each event uses an SSE event name ... and includes the matching event
  `type` in its data", E-10 l.63). An event with no `event:` line (`readSseEvents` yields `event`
  undefined, `provider-stream.ts:46-47`) is accepted, `data.type` deciding: only a differing name is
  refused.
- `message_start` comes first and once; before it only `ping`, `error` (which fails the call) and
  unknown types may appear: any other known event type before it, a `content_block_start` among them,
  is PROVIDER_INVALID_RESPONSE. Its `message.usage` seeds the usage.
- `content_block_start { index, content_block }`: no block may be open and the index must equal the
  number of blocks so far (E-10 l.68: indices are positions in the final array). The start object is
  kept as received; a type other than `text`, `thinking`, `redacted_thinking` and `tool_use` (such as
  `fallback`, which is not an input block type, E-09 l.121-256) marks the block not replayable.
- `content_block_delta` must target the open block. `text_delta` appends `text` to a text block;
  `thinking_delta` appends `thinking` to a thinking block; `signature_delta` sets `signature` on a
  thinking block, once ("a special `signature_delta` event", E-10 l.133; "a single `signature_delta`",
  l.135), and a second is PROVIDER_INVALID_RESPONSE; `input_json_delta` appends `partial_json` to a
  tool_use block (the first may be `""`, l.324), at most 131,072 characters per call. A known delta on
  the wrong block type is PROVIDER_INVALID_RESPONSE. An unknown delta type, or any delta on an unknown
  block, marks the block not replayable and is otherwise ignored: a text block so marked keeps the text
  its known `text_delta` events gave, which a final answer uses (section 5.5), while a tool turn holding
  it fails.
- **Types before accumulation.** A known delta is applied only when its own field (`text`, `thinking`,
  `signature`, `partial_json`) is a string and the start field it extends is one too: `text_delta`
  needs the start's `text` to be a string, `thinking_delta` the start's `thinking`, and
  `signature_delta` the start's `signature` to be absent or a string (it replaces the value, never
  appends). Otherwise the call is PROVIDER_INVALID_RESPONSE, in any turn: the reader cannot know the
  stop yet, and JavaScript would coerce the value (`null + 'Hi'` is `'nullHi'`), so a tool turn's state
  would pass the outcome's schema check, and a final answer's content would be saved, holding a string
  the provider never sent. Every captured start object carries these fields as strings (`text: ""`,
  E-10 l.202; `thinking: ""` and `signature: ""`, l.392), so the rule refuses nothing a capture shows.
  `input_json_delta` accumulates into its own `partialJson`, which starts empty, and never touches the
  start's `input`.
- `content_block_stop` closes the open block. A block with no deltas is valid (E-10 l.68), with its
  start fields as received; this covers `redacted_thinking`, whose streamed form is not captured.
- `message_delta`: a non-null `stop_reason` different from one already seen is
  PROVIDER_INVALID_RESPONSE; each usage field takes its latest value.
- `message_stop` ends reading: the reader breaks, so bytes after it are never parsed, and `lines()`
  cancels the body because its reader stopped before the end (`provider-stream.ts:30-33`); a block
  still open then is PROVIDER_INVALID_RESPONSE.
- `ping` is ignored (E-10 l.74); unknown event types are ignored (l.91); `error` is
  PROVIDER_STREAM_ERROR and its text is not kept (l.78-86; E-12 l.43): the thrown error is
  `new Error('PROVIDER_STREAM_ERROR')`, with nothing of the event in its message or a `cause`.
- Bounds: the 4 MiB stream cap; the text blocks' text joined, which becomes the answer's `content`, at
  most 2,000,000 characters, the cap `CompletionSchema` puts on `content` (`src/engine/control.ts:87`),
  counted across all text blocks (start `text` included) and checked as each text block starts and as
  each `text_delta` is applied (PROVIDER_RESPONSE_TOO_LARGE), as the existing accumulators check theirs (`provider-stream.ts:102`);
  at most 128 `tool_use` blocks and 512 blocks (PROVIDER_INVALID_RESPONSE; the 512th
  `content_block_start` is read, the 513th fails).
- Tool inputs are not parsed here: the outcome parses them only for a `tool_use` stop, so a call cut
  short by `max_tokens` (E-11 l.205-207) is incomplete, not a failure.

#### 5.5 Outcome and state (E-11 l.20-28; wire design point 4)

| Stop | Outcome |
|------|---------|
| no `message_start` | PROVIDER_INVALID_RESPONSE |
| no `message_stop` (stream cut short), or a null `stop_reason` | incomplete, no calls, no state |
| `end_turn`, `stop_sequence` | complete; incomplete if a `tool_use` block exists (the Phase 1 rule) |
| `tool_use` | tool_calls, when there is at least one `tool_use` block, every input parses to a bounded object (an empty join takes the start object's `input`, `{}`, E-10 l.321), every thinking block has a non-empty signature, no block is not replayable, and the calls pass `InferenceToolCallsSchema`, offered names and unused ids (as `parseCalls`, `inference.ts:75-85`); otherwise PROVIDER_INVALID_RESPONSE |
| `max_tokens`, `model_context_window_exceeded` | incomplete ("Treat the response as truncated", E-11 l.28) |
| `refusal` | blocked; "a normal HTTP 200 response, not an error" (E-11 l.379); keyed on `stop_reason` only (contradiction below) |
| `pause_turn` | PROVIDER_FINISH_FAILED: it belongs to server tools, which MoonAliza never sends (E-11 l.26, l.347) |
| any other value | PROVIDER_FINISH_FAILED (the Phase 1 rule) |

- `content` is the text blocks joined in order with no separator: the blocks are consecutive parts of
  one answer, and a separator would add text the model did not write. A `text` block whose `text` is
  not a string can reach the outcome only without a delta (section 5.4 refuses the delta); in an
  outcome without state (complete, incomplete or blocked) it is PROVIDER_INVALID_RESPONSE, never
  coerced into the content; in a `tool_calls` outcome the state schema refuses it (below).
- **State**, for `tool_calls` only: `data` is `JSON.stringify({ content })` with every block in index
  order, each its start object's fields with the accumulated `text`, `thinking` and `signature` and,
  for `tool_use`, the parsed `input`; thinking blocks with an empty `thinking` are kept (E-12 l.175).
  This is what Anthropic's own loop sends back: the SDK accumulates the stream into the final message
  (E-10 l.59) and the loop appends `response.content` as the assistant turn (E-11 l.611-613).
  `appendOnly` is true when a `thinking` or `redacted_thinking` block is present.
- **The state is checked as the encoder will check it.** The outcome parses the `data` it built with the
  encoder's own strict state schema (section 5.3 and its refusal table: block types, non-empty
  signatures and `data`, `IdSchema` ids, bounded inputs, bounded extra fields, 1 to 512 blocks) and
  checks it against
  `PROVIDER_STATE_MAX`: a schema refusal is PROVIDER_INVALID_RESPONSE, a state over the cap
  PROVIDER_RESPONSE_TOO_LARGE. Both happen inside `complete()`, before the completion reaches the
  engine, so no tool runs; without the check a state the encoder would refuse would be found only when
  step 2 is encoded, after step 1's tools had run. One schema serves both sides, so they cannot drift.
- A final answer carries no state (thinking outside tool use need not be returned, E-13 l.85). A block
  of an unknown type is dropped: nothing of it reaches the content. A text block that an unknown delta
  type marked not replayable is still a text block: the unknown delta is ignored and the block's text
  from its known `text_delta` events stays in the content.

*Contradiction (flagged): `stop_details`.* E-09's response example carries a `stop_details` of type
`refusal` with `stop_reason: "end_turn"` (E-09 l.1173-1178), while E-11 says "`stop_details` is `null`
for all stop reasons other than `refusal`" (E-11 l.399). Resolved by never reading `stop_details`: the
outcome is keyed on `stop_reason` alone, which is consistent with both (under E-09's example the answer
is `end_turn`, complete, with whatever text it holds; under E-11 a refusal is `refusal`, blocked). If a
live `end_turn` with a refusal `stop_details` occurs (D3 recordings), it shows as a complete answer
holding the provider's text, never as tool calls.

*Known limit (fail-closed):* H-E03 l.485: when a response stops on `max_tokens`,
`model_context_window_exceeded` or `stop_sequence` soon after a tool call or tool result, its last block
can be a progress-update block standing in for unfinished work, and Anthropic's continuation is to pass
the turn back unchanged with a `tool_result` for each `tool_use`. MoonAliza maps those stops to
incomplete (a `tool_use` block under `stop_sequence` included, the Phase 1 rule): the partial text is
saved, no tool runs, no state is kept, and the run fails. Continuing such a turn would mean executing
calls from an incomplete outcome, which Phase 1 forbids. For `max_tokens`, a larger maximum response
in the profile is the user's remedy.

*Set aside:* keeping only the documented input fields of each block. The captured start objects hold
exactly those fields (E-10 l.202, l.321, l.392), so the two agree on every capture; where a live block
carries more, dropping a field risks the "reconstructed" 400 (E-12 l.167) and keeping it risks an
"Extra inputs are not permitted" 400 (the pattern of E-12 l.296). Verbatim follows Anthropic's own loop
and `source-plan.md:644` ("losslessly"); D5 records which holds, and the change is one function.

#### 5.6 Usage

- Each field takes the latest value from any event carrying it (`message_start.message.usage`, then
  each `message_delta.usage`): the counts are cumulative (E-10's ledgered source HTML, line 39), and the
  server-tool example's `message_delta` repeats `input_tokens` with a new value (E-10 l.457 against
  l.531). Never summed.
- Input = `input_tokens` + `cache_read_input_tokens` + `cache_creation_input_tokens`, all three counting
  toward the window (E-13 l.32); a cache field never seen counts 0. Output = the latest `output_tokens`.
- Usage is returned only when both `input_tokens` and `output_tokens` were seen; the thinking example
  carries none (E-10 l.388-425), so it stays unset, never 0.

#### 5.7 Errors and CONTEXT_LIMIT

- `refusalStatuses` is `[400]`; `isOverflow(text)` is true only when the JSON body's `error.type` is
  `invalid_request_error` and `error.message` matches `/prompt is too long/i` (E-13 l.150; the error
  shape, `error.type` and `error.message`, E-12 l.60-77). The text never leaves `complete()`.
- Everything else is `PROVIDER_HTTP_<n>` and crosses as PROVIDER_ERROR, including the 400s that are not
  an overflow: a spend limit the user set (E-12 l.18; E-14 l.68), prefill (E-12 l.149-157), modified
  thinking (l.167-170), a thinking type (l.179-249), forced tool use (l.259-263), a prefix mismatch
  (l.283-287) and `block_binding` (l.293-296).
- `model_context_window_exceeded` is the incomplete outcome (E-13 l.152), not a refusal.
- A 413 cannot occur: the 8 MiB body cap is below the 32 MB limit (E-08 l.109-114).
- The shared `OVERFLOW` pattern is not applied to this kind, and the `openai-compatible` rule is
  unchanged.

#### 5.8 Retries (wire design point 6)

`anthropicRetryDelayMs(response, attempt)`:
- 429 with a `retry-after` matching `/^\d+$/`: that many seconds ("The number of seconds to wait",
  E-14 l.108, l.225).
- 429 without one: undefined, never retried. That is the spend cap, which "keeps failing until access
  resumes" (E-12 l.32; E-14 l.62-63). A `retry-after` in another form counts as absent; its HTTP-date
  form is stated nowhere.
- Any 5xx, 500 to 599 with 529 included: an integer `retry-after` when present, else 1 s on the first
  retry and 2 s on the second. The SDK "automatically retries transient failures (such as connection
  errors, rate limits, and 5xx server errors)" (E-12 l.41); the statuses named are 500 ("Retry the
  request with exponential backoff", l.34), 504 (l.36) and 529 ("temporarily overloaded", l.38).
- Anything else: undefined.
`post()` allows at most two retries, the SDK's default (E-12 l.41), only before any body is read, and
only when the wait ends before the call's deadline, `part.timeoutMs` (600 s) from the call's start
(design point 6: PROVIDER_ERROR once a wait would pass the timeout). An `error` event after a 200 is
never retried, and a call made with `retry: false` (`profile.test`, section 6) is never retried.

*Known limit:* a stream over 4 MiB fails as PROVIDER_RESPONSE_TOO_LARGE (PROVIDER_ERROR); the cap
predates this phase and applies to every kind. D12 measures a thinking-heavy step's bytes and duration
against it and the 600 s timeout.

### 6. Main: the state screen and the connection test (src/main/provider-screen.ts, src/main/index.ts)

- `screenCompletion(output, redact)` in the new `src/main/provider-screen.ts` holds the screening
  `infer()` does today (`index.ts:105-109`) plus one rule, and `infer()` ends with
  `return screenCompletion(output, text => vault.redact(text));`. In order:
  1. tool calls: unchanged, the rule moved from `index.ts:105-108` (the JSON text redacted; any change
     is PROVIDER_PROTOCOL_ERROR), applied to every tool step, with or without state;
  2. state: when present, every object key and string leaf of the parsed `data`, joined with `\u0000`,
     and the unredacted `content`, each passed through `redact`; any change is PROVIDER_PROTOCOL_ERROR.
     Leaves, not the JSON text, because JSON escaping hides a secret containing `"` or `\`; the content
     too, because a secret split across two text blocks appears whole only there. The state is never
     redacted in place: an edited block is a 400 on the next step (E-09 l.161; E-12 l.167);
  3. content redacted, as today.
  REDACTION_UNAVAILABLE propagates as today. All edits sit after the `const invoke =` line, so the
  Phase 1 source pin (`tests/ollama-locality.test.ts:298-323`) holds.
- **The screen's failure reaches the user as itself.** Today a PROVIDER_PROTOCOL_ERROR thrown in main
  (`index.ts:107`) crosses as PROVIDER_ERROR: `inferenceErrorCode` passes only CONTEXT_LIMIT and
  LOCAL_MODEL_UNVERIFIED (`inference.ts:97-99`), and the `inference.error` enum
  (`src/engine/control.ts:96`) lists only those, PROVIDER_ERROR and RUN_CANCELLED. So a secret in a
  tool step would be reported as "The model or tool request failed. Check the selected profile and
  project access." U0 adds PROVIDER_PROTOCOL_ERROR to both in one commit (a code the enum refuses is
  dropped by the engine, `src/engine/index.ts:60-61`, and the run waits for its deadline), as Phase 1
  did for LOCAL_MODEL_UNVERIFIED (`tests/provider-transport.test.ts:252-256`). The engine already maps
  the code to its own message (`application.ts:393`), which U0 widens to cover both causes: "The
  provider returned a tool call or step MoonAliza could not use safely: a tool call that was invalid or
  not offered, or output that contained a saved credential. Nothing from that step was run or saved."
  It is an existing public code (`src/shared/errors.ts:11`). The `failures` entry is shared, so the
  widened text applies to every kind and every cause that raises the code: the engine's own check of an
  invalid or unoffered tool call (`application.ts:370`), which today's text describes, and the
  tool-call secret check in main, which until now crossed as PROVIDER_ERROR. A review run appends it to REVIEW_RUN_FAILED's text,
  as it does today for the engine's own protocol errors (`application.ts:411`).
- `profile.test` (`index.ts:279`): `outputTokens: profile.kind === 'anthropic' ? profile.outputTokens : 32`,
  and `retry: false` in `complete()`'s options (section 4), so a Test connection never waits on a retry
  and its failures keep the text described below (with retries, an abort landing during a wait would
  end it as RUN_CANCELLED). Thinking tokens are part of `max_tokens` (E-13 l.48) and thinking is always on for Fable 5.1 and Opus
  5.5 (E-12 l.203-207), so 32 can end at `max_tokens`, which is incomplete and fails the test. What the
  user then sees: a non-complete outcome throws PROVIDER_ERROR (`index.ts:283`), the 25 s abort the
  fetch's abort error, and a refusal `PROVIDER_HTTP_<n>`; none is in `publicMessages`, so `safeError`
  (`src/main/bridge.ts:53-55`) maps each to INTERNAL_ERROR with "The operation could not be completed.
  No private error details were shared.", which the preload throws (`src/preload/index.ts:9`) and the
  form shows as its error (`App.tsx:266`). (Only an abort that lands after the read and before the
  re-check at `inference.ts:175` becomes RUN_CANCELLED, "The run was stopped.") No "Connection failed"
  text exists in `src`. The configured value also checks the profile's ceiling against the model's at
  test time. Billing: input and output tokens are billed, thinking tokens as output tokens (E-13 l.48).
  The 25 s timeout (`index.ts:280`) is unchanged and separate from the 600 s chat timeout.

*Set aside:* `min(outputTokens, 1024)`: 1,024 is only the legacy extended-thinking minimum (E-09
l.830; contradiction 13), and it would not check the configured ceiling. *Known limit:* (1) a secret in
an Anthropic tool step's text, thinking or tool input fails the step where other kinds redact the text;
it is how tool calls are already treated. The match is a plain substring of every stored vault value, so
a short placeholder key saved for another profile (`ollama`, `EMPTY`) that appears in a step's thinking
or text, or occurs in any key or string leaf of the state (`type`, `text`, `tool_use`, `direct`), fails every
  such step; the same word in any kind's tool calls fails that step by the JSON-text rule, as before Phase 2 (integration review
P2-BRK-1; README). (2) A thinking model that does not finish "Reply with OK."
within 25 s fails Test connection although chat would work, with the generic text above; D7 measures
it, and the remedy then is a per-kind test timeout or budget. (3) Test connection cannot say which
refusal it met (an over-maximum `max_tokens`, D7; a multi-workspace key, D9): naming one needs a public
mapping, a new entry in `publicMessages` and so a new public code, which F-21 rules out in this phase;
it is recorded for later and goes through F-21 and the stop-list review when it is taken.

### 7. The profile option and locality (src/renderer/App.tsx, README.md, src/main/inference.ts)

- The Provider select (`App.tsx:266`) gains `<option value="anthropic">Anthropic API</option>` after the
  two existing options, whose values and order are kept (the e2e journeys select by value). The
  endpoint default follows the kind: `ollama` `http://127.0.0.1:11434`, `anthropic`
  `https://api.anthropic.com/v1`, otherwise `https://api.openai.com/v1`. The intro names the Anthropic
  API. For this kind a muted hint, in this order:
  - use an API key created for a single workspace (E-08 l.52);
  - thinking counts toward the maximum response (E-13 l.48); Claude Fable 5.1, Opus 5.5 and Sonnet 5.5
    have a 1M-token context window and up to 128K output tokens (SL-E01 l.22-23, the source's own
    figures). Haiku 4.5 is not named: it may retire before this merges ("Not sooner than October 15,
    2026", SL-E01 l.27);
  - a step can take several minutes (the 600 s timeout, section 4);
  - the data-use sentence, word for word (U4's renderer test pins it whole; the README repeats it):
    "Data use: Anthropic's commercial terms say it may not train models on your prompts and outputs;
    Claude Fable 5.1 requires 30-day retention and is not available under zero data retention unless
    Anthropic expressly authorizes it; if a chat or session is flagged, Anthropic may keep its inputs
    and outputs for up to 2 years; for how long other requests are kept, Anthropic's retention page
    refers to its commercial data retention policy, which MoonAliza has not reviewed." Clause by clause:
    "Anthropic may not train models on Customer Content from Services", Customer Content being Inputs
    and Outputs (SL-E11 l.26; those terms govern API keys, l.12); SL-E17 l.45 and l.140; SL-E17 l.241
    ("if a chat or session is flagged, Anthropic may retain inputs and outputs for up to 2 years");
    SL-E17 l.16 (for standard retention policies the page says to see the commercial data retention
    policy, which the shortlist did not collect; SL-E11 states no period). The last clause is true of
    SL-E17 l.23 as well: the page's "Conversation content ... is not retained by default" is one of the
    commitments it makes where a feature necessarily requires storage (l.20), with Covered Models
    excepted, and the hint neither repeats it nor says the page is silent on retention. The hint never
    says "not retained";
  - this adapter is built from Anthropic's documentation and is not yet checked against the live API
    (as built: "MoonAliza's Anthropic connection is tested against requests and responses recorded from
    the live API; the app itself has not yet been run against it", after the 2026-10-12 probes, U4-R5).
  No token values are prefilled: presets are Phase 4.
- README: the kind, its endpoint, single-workspace keys, always cloud (refused in local-only
  conversations; an Ollama reached through this kind is treated as cloud, so local-only users use the
  Ollama kind), thinking kept for the run but never shown or stored, a step can take several minutes, a
  long task can end with the context-limit message, the same data-use sentence as the hint, and the
  adapter built from Anthropic's documentation and not yet checked against the live API (as built: the
  hint's sentence after the probes, above). If the D10
  verdict keeps commit 3, the README also gets section 4's credentials sentence, which concerns every
  kind.
- **Locality.** `validateEndpoint` labels every `anthropic` endpoint `external`, loopback included. A
  loopback server can implement this API and forward to a cloud, and MoonAliza cannot verify that it
  does not: Ollama serves `/v1/messages` (E-31 l.1987-1988) through `cloudPassthroughMiddleware` and
  `ChatHandler`, which hands a cloud-sourced model to `proxyCloudJSONRequest` (E-31 l.2552-2558; the
  file shows the call, not its destination). That the destination is ollama.com is E-29's: its local
  API forwards cloud models after `ollama signin` (E-29 l.53-62), and ollama.com hosts an
  Anthropic-compatible `/v1/messages` (E-29 l.30). MoonAliza's
  `/api/status` check speaks only to the `ollama` kind's native API. Under local-only the existing
  policy refuses an `anthropic` profile before any byte (`src/engine/policy.ts:77`): at `run.start`, and
  a switch to local-only during a run cancels the run (S-3, section 8); under cloud-allowed
  a loopback gateway or test fake still works. The `bridge.ts:19` text already fits.
- **No workspace setting.** "Required with a multi-workspace API key. Optional for other API keys. A key
  created for a single workspace runs in that workspace when you omit the header" (E-08 l.52).

*Set aside:* (a) refusing loopback for this kind: it blocks the Windows e2e fake and local gateways even
under cloud-allowed, where "always external" is just as fail-closed. (b) Labelling loopback local: an
Ollama behind this kind could send a local-only conversation to its cloud (E-31 l.1987-1988), the Phase
1 known limit (MM-P1-SPEC-5) repeated. (c) The workspace setting now: a `profile_revisions` column
means schema v5 (migration, a hand-written v4 fixture, the `user_version` pins at
`tests/research-jobs-state.test.ts:81` and `:523`), changes to `ProfileSchema`, `StoredProfileSchema`
and the form, and a database older builds can no longer open (`migrations.ts:110`); it is deferred to
the phase that also needs it for Anthropic's compatible layer (Phase 4, E-15 l.22). (d) Running the
Ollama status check for an `anthropic` profile on loopback: the check belongs to the `ollama` kind's
native API and would not cover other servers.

*Known limit:* (1) multi-workspace keys do not work, and the error they get is not captured (D9);
(2) an `anthropic` profile saved through IPC before this phase with a loopback endpoint carries
`local` and is now refused by `infer()` with INVALID_ENDPOINT (`index.ts:93-94`) until saved again;
nothing is deleted, and the form never offered the kind. The engine's own local-only checks read the
stored label, so such a run is admitted and stored before main refuses it, and Test connection uses
the session the stored label picks (P2-IR-2, P2-SPEC-5 (d)); no byte leaves the machine.

### 8. Privacy and invariants

- Tokens never reach the engine in clear (AGENTS.md invariants): the state is screened in main before
  it crosses (section 6); the engine has no log (`stdio: 'ignore'`, `engine.ts:41`).
- State never reaches the database, events, the search index, `session.read`, `run.events` or the
  renderer (section 2; strict `MessageSchema` and `EventSchema`). Thinking text and signatures are never
  at rest; Sonnet 5.5's `display` default is not stated (H-E03 l.137 lists ten models whose default is
  `omitted`, Fable 5.1 and Opus 5.5 among them; Sonnet 5.5 is absent from it), so summarized thinking
  may arrive in the clear; it stays in memory for one run.
- Never sent to another kind: kinds refuse formats they do not own, and the profile revision is pinned
  per run (`application.ts:235`; `index.ts:90`).
- Untrusted: only the owning adapter parses the state, strictly; it is never shown and never turned
  into instructions.
- Local-only: an `anthropic` profile is always external (section 7). Under a local-only policy it sends
  no byte (S-3): `run.start` refuses it with CLOUD_NOT_ALLOWED (`application.ts:230`); a switch to
  local-only during a run cancels the run, since `session.policy.update` aborts the session's active
  runs (`:189`) and `project.policy.update` calls `cancelProject` (`:225`, `:269-271`); and before every
  step the engine (`assertRunPolicy`, `:356`, again after `infer` at `:362` and before each tool call at
  `:375`) and main before every fetch (`index.ts:91`) call `assertConversationPolicy` with the run,
  which refuses an aborted run or a session or project policy revision other than the run's own with
  RUN_CANCELLED (`policy.ts:73-76`) and, while both revisions are unchanged, a local-only policy with
  an external profile with CLOUD_NOT_ALLOWED (`:77-78`). Every policy update bumps its revision
  (`application.ts:187`, `:224`), so a mid-run switch is caught there as RUN_CANCELLED, and the run ends
  cancelled (`:392`).
- Credentials: the key only in `Authorization`, inside `vault.withSecret`, whose grant is checked on
  entry (`src/main/vault.ts:156-162`), so a retry wait needs no new grant. Every chat request, for every
  kind, is sent with `credentials: 'omit'`, so it carries none of the session's cookies or HTTP
  authentication (INV-5; D10 kept commit 3, `792b508`). Known limit: a gateway that needs
  Windows-integrated sign-in or a client certificate may refuse chat requests (section 4).
- AGENTS.md: one invariant row added (section 1, D-2), which narrows what any later code may do; the
  token row gains evidence.
- Stop-list: no migration, no user data deleted, nothing collected, no vendor request. The one
  invariant row added is the lead's decision under the user's "you have full access. continue",
  recorded in `docs/orchestration/2026-10-05-more-models/USER-DECISIONS-P2.md` and open to the user's overrule.

### Out of scope (named)

Persisting state and replay across runs (the first phase with a cross-run reader adds both; DeepSeek in
Phase 4 needs them at the latest, wire E-19); the workspace
setting; thinking controls (`thinking`, `effort`, `display`), showing thinking and `thinking.delta`
events (`source-plan.md:643`); prompt caching, token counting and the Models API; server-side
compaction and context editing; server tools and fallback; retries for other kinds; the existing
kinds' 120 s timeout, an idle timeout, and the 4 MiB stream cap; presets and model ids (Phase 4,
SL-E01); continuing a turn cut short after a tool call (H-E03 l.485, section 5.5); Anthropic's
compatible layer (Phase 4); `openai-responses` (Phase 3); Phase 1's recorded items (the
loopback `openai-compatible` label, an `infer()` harness, lone CR and the quadratic split in `lines()`,
the `profile.test` warning for Ollama cloud); a `login` handler for proxy or server authentication
(D10's harness-handler outcomes are recorded for it);
`diagnostics.export`; the unused `ModelChunk`, `ModelProvider` and `ProviderMessageSchema` scaffolding.

### Day one

The Anthropic parts of wire U-18 had not run when this was written (they ran on 2026-10-12; outcomes in
"As built (Phase 2)" and `docs/evidence/2026-10-12-anthropic-probes.md`). Each item below needs the user's Anthropic key in a probe
session on the collector machine, synthetic prompts only, results to `docs/evidence/`, under a US$3
spend cap (per-item estimates in `docs/orchestration/2026-10-05-more-models/DAY-ONE-P2.md`); D10 needs no vendor and runs at the end of wave 1,
before U4 and U5 are briefed (section 4). The full
list, with the behaviour until each runs and the change each result triggers, is the run's
`docs/orchestration/2026-10-05-more-models/DAY-ONE-P2.md`:
D1 Bearer on `/v1/messages` with a Console key; D2 the over-window 400 body; D3 stream framing and the
response's `Content-Type`; D4
usage cross-check; D5 a native two-step tool round trip with verbatim replay on Opus 5.5, Sonnet 5.5 and
Fable 5.1 (extra block fields, `redacted_thinking`, signature deltas, re-serialized inputs, the
account's prefix check); D6 a second run whose latest assistant message is the first run's answer
without its thinking; D7 `profile.test` with the profile's own `max_tokens` within 25 s; D8 any 429 or
5xx; D9 a multi-workspace key without the header; D10 Electron keeps `Authorization`, drops cookies and
leaves proxy and server authentication as shipped under `credentials: 'omit'` (end of wave 1, decided
on the as-shipped runs, section 4; if it cannot run at all, commit 3 is not merged); D11 Haiku 4.5 with
`thinking` omitted; D12 a long tool step against 600 s and 4 MiB; D13 Sonnet 5.5's `display` default;
D14 a tool with no arguments; D15 a `fallback` block without opting in; D16 reported `input_tokens`
against the estimate, to calibrate the reserve.

### Tests the builders owe

Every new behaviour test is first seen failing against the unchanged code. Every regression pin or
snapshot of today's behaviour (T-2's snapshots, the F-4 order pins, the 120 s abort, the existing
kinds' messages, the S-3 policy pins) passes on the unchanged code instead, and is shown red under a named mutation of that
code. Every guard is proved by removing that one guard. Fixtures copied from a capture name their E-row and lines and are
checked against the capture (as `tests/provider-stream.test.ts:326-331` does), and are used in unit
tests only; built streams, every e2e stream included, are marked "built from E-10 shapes, not a
capture".

- **Contracts** (U0; `tests/provider-transport.test.ts:208-220` block): `FromEngineSchema` accepts state
  on an assistant message with `toolCalls`, and refuses it on user, tool and system messages, on an
  assistant message without calls, with an empty or `PROVIDER_STATE_MAX` + 1 `data`, a malformed
  `format`, a missing `appendOnly` or an extra key; `CompletionSchema` accepts it only with
  `tool_calls`; `ToEngineSchema` parses an `inference.result` that carries it. `ToEngineSchema` accepts
  an `inference.error` with PROVIDER_PROTOCOL_ERROR and `inferenceErrorCode` passes it through (guard:
  let it fall back to PROVIDER_ERROR); the existing test at `:242-249` still passes.
- **Engine strip and carry** (U0; `tests/application.test.ts`): a fake `infer` returning `tool_calls`
  with a state whose `data` (under 1 KiB, so a row holding it fits on one database page) is an
  `anthropic-messages@1` content array: a `thinking` block whose `thinking` text and `signature` both
  contain a marker of base64-alphabet characters only (for example `UzBTdGF0ZU1hcmtlcnE3Wng5VmIz`), a
  `text` block and a `tool_use` block. The marker sits in the thinking text and signature only, never
  in the text block or the `tool_use` input: those legitimately become the stored message's `content`
  and `toolCalls` (`application.ts:371-372`), so a marker there would be on disk by design and the scan
  would be red for the wrong reason. JSON never escapes those characters, so the marker appears
  unchanged at any depth of nesting; a marker holding `"` would not (the `events` row stores the
  state's `data`, itself JSON, inside a JSON payload, `store.ts:186`, so `SIG"MARK` is stored as
  `SIG\\\"MARK`, matching neither its raw nor its once-escaped form). The second call's assistant
  message carries the identical state. After the run,
  the test's first assertion is a byte scan of `state.sqlite`, `state.sqlite-wal` and `state.sqlite-shm`
  for the marker; then `session.read` and every `message.created` payload (parsed with `EventSchema`,
  and its JSON text searched) hold neither the `providerState` key nor the marker. Guards: remove the
  strip (the scan goes red on the `events` row); write the state into the `message.created` payload
  inside a string field (the event's copy of the message `content`, the stored message unchanged), which
  `EventSchema` still accepts, so the scan, not the schema, is what goes red; remove the state from
  `:371` (the carry assertion goes red). A marker holding `"` or `\` is used only by the S-1 screen
  tests (U4). A fake `infer` that rejects with PROVIDER_PROTOCOL_ERROR ends the run with that code and
  the widened message (red against today's text), and so does a fake `infer` that returns an unoffered
  call (the engine's own check, `:370`, which applies to every kind).
- **Append-only and policy** (U1; `tests/context.test.ts`, `tests/application.test.ts`): with an
  `anthropic` profile, tools and three tool steps whose results exceed 3,072 bytes and whose states are
  `appendOnly`, each request equals the previous request plus the previous assistant message and its
  results, element by element as JSON (guard: let the `:43` loop run under the freeze); a step that
  does not fit after cutting only unsent results ends with CONTEXT_LIMIT, the frozen message and no
  further `infer` call; an already-sent result is never shortened again and unsent ones are cut oldest
  first; with history near the full budget a two-step run succeeds (guard: reserve 0, red at step 2);
  `appendOnly: false` states keep today's trimming (guard: freeze on any state); an
  `openai-compatible` run still drops history mid-run; a tool-free `anthropic` run gets no reserve; the
  estimate counts an `anthropic-messages@1` message as its state and other states with their message.
  F-15: after a run whose tool step carried state and whose answer was final, the next run's first
  request holds no `providerState` on any message and the earlier answer only as text (guard: carry
  `current` into history). F-16: a frozen run whose `infer` rejects with CONTEXT_LIMIT (a provider
  overflow) gets the frozen text; an unfrozen run's CONTEXT_LIMIT keeps today's text; a frozen review
  run ends with REVIEW_CONTEXT_LIMIT and the review message (guards: drop the frozen flag; apply the
  frozen text to review runs). S-3, regression pins of today's behaviour (green on the unchanged code,
  each red under its named mutation): (a) an `anthropic` profile revision labelled `external` in a
  local-only session is refused at `run.start` with CLOUD_NOT_ALLOWED and `infer` is never called (red
  when `run.start` skips `assertConversationPolicy`, `:230`); (b) a switch to local-only during a run
  cancels it: in a cloud-allowed project and session, the fake `infer`'s first call issues
  `session.policy.update` to local-only (in a second case, `project.policy.update` to local-only) and
  then returns `tool_calls`; the run ends cancelled (status `cancelled`, a `run.cancelled` event, no
  `run.failed`), no tool runs, and `infer` is called exactly once, so no further request or fetch is
  made. The two existing protections each cancel the run alone (the abort at `:189`, or
  `cancelProject` at `:225`, and the revision comparison in `assertConversationPolicy`,
  `policy.ts:75-76`, reached at `:362`), so (b) is shown red under the mutation that removes both: the
  run then fails at `:362` with CLOUD_NOT_ALLOWED, reported as PROVIDER_ERROR, instead of ending
  cancelled. The before-every-step check is today's `assertRunPolicy` at `:356` (and main's at
  `index.ts:91`), unchanged by U1 and covered by (b) at `:362`; U2 pins that `validateEndpoint` labels
  such a profile `external`.
- **Request builder** (U2; `tests/provider-transport.test.ts`): byte-exact snapshots of URL, method,
  headers, redirect and body for `openai-compatible` and `ollama` (plain and managed, with tools,
  multi-step), committed before the refactor and unchanged after it; the exact init has
  `redirect: 'error'` for each kind and, in commit 3, `credentials: 'omit'` (extending `:62-74`; commit
  3's own pin, red without the field, dropped with commit 3 if the D10 verdict drops it);
  `openai-responses` throws NOT_IMPLEMENTED with no fetch; a message carrying any state is
  refused before any fetch on both existing kinds (commit 2, red first); F-4 order (section 4): in
  commit 1, on the unchanged code, the five pins for today's adjacent pairs whose errors differ
  (cancellation and endpoint, endpoint and profile, profile and kind, kind and managed-Ollama,
  managed-Ollama and transcript), each green there and red under the swap of its two checks, plus the
  transcript, tools and body-size refusals each with no fetch (red when that check is moved after the
  fetch); in commit 2 only the ownership pair
  (invalid managed options plus a foreign state give INVALID_PROFILE; red under the mutation that runs
  ownership first), every commit-1 pin passing unchanged;
  `validateEndpoint` labels `anthropic` on `http://127.0.0.1` and on `http://127.0.0.1:11434/v1`
  `external` and keeps `ollama` local; a chat-kind request still aborts at 120 s and not before (a pin
  written in commit 1 on the unchanged code: fake timers, with `AbortSignal.timeout` replaced by the
  section 4 spy because fake timers cannot reach it; the same test passes after commit 2, where
  `complete()`'s own `setTimeout` is faked; red under `AbortSignal.timeout(600_000)` in commit 1 and
  `timeoutMs: 600_000` after it); the deadline timer is armed only after the pre-checks (commit 2):
  under fake timers, a valid call has exactly one timer pending while its fetch waits (red first: the
  unchanged code's `AbortSignal.timeout` is invisible to `vi.getTimerCount()`), and an input refused
  by each pre-check in turn leaves `vi.getTimerCount()` at 0 after the refusal (red under the mutation
  that arms the timer at the top of `complete()`); `post()` with a fake part: two retries then success in three fetches,
  a third refusal surfaces, a wait that would end past the part's own `timeoutMs` from the call's start
  is not taken (a fake part with a short timeout), Stop during a wait gives RUN_CANCELLED with no
  further fetch, the refused body is cancelled, no retry without a policy, and with `retry: false` a
  refusal the fake part would retry makes one fetch and surfaces its error at once with no timer
  pending (red when `post()` ignores the flag) (fake timers drive the waits, which are `setTimeout`,
  and the deadline, which is `Date.now()`).
- **Anthropic adapter, pure** (U3; `tests/anthropic.test.ts`): the E-10 basic stream (l.198-220; with
  `ping`), tool-use stream (l.269-348; empty first `partial_json`) and thinking stream (l.388-425), each
  folded and mapped: `complete` with "Hello!" and usage `{25, 15}`; `tool_calls` with one call and the
  exact state JSON; `complete` with no state and usage unset; a built thinking + text + tool_use stream
  gives blocks in index order with the empty `thinking` and the signature kept and `appendOnly: true`;
  a tool_use stream without thinking gives `appendOnly: false`. Refusals: an `error` event is
  PROVIDER_STREAM_ERROR, and a marker placed in its `error.message` appears nowhere in the thrown
  error (its message, `cause` or `String()`; guard: keep the event's text in the error); second
  `signature_delta`; known delta on the wrong block; out-of-order index; start while a block is open;
  block open at `message_stop`; event name differing from `data.type`; second `message_start`; a
  `content_block_start` before `message_start` (guard: accept blocks before it); changed
  `stop_reason`; no `message_start`; a 200 whose body is a plain JSON message with no `data:` line
  (PROVIDER_INVALID_RESPONSE, no `message_start`) and one whose `data:` payload is not JSON
  (PROVIDER_INVALID_RESPONSE, from `readSseEvents`); over 128 `tool_use` blocks; a 513th block (512
  accepted); over 131,072 characters of partial JSON; the joined text over 2,000,000 characters
  (PROVIDER_RESPONSE_TOO_LARGE in the reader: two text blocks of 1,000,000 characters each are
  accepted, and one more character in a third text block fails; guard: bound each block separately,
  which lets the joined text through to fail `CompletionSchema` later); and, on a `tool_use` stop only,
  an unknown block, an unknown delta, an unparseable or non-object input, an empty signature, an
  unoffered name or a reused id. Reading ends at `message_stop`: a built stream whose last chunk carries,
  after `message_stop`, bytes that would fail if read (a `data:` line that is not JSON and its blank
  line), served by a `ReadableStream` that stays open after that chunk and whose `cancel` callback
  records the call, completes as if those bytes were absent, and `cancel` was called (guard: keep
  reading after `message_stop`, which then fails on the bad line). No content-type rule: a built
  stream served with `Content-Type: application/json` (or none) is read as SSE and completes (red
  under a rule refusing a label other than `text/event-stream`).
  **The state refusal table** (section 5.3) drives two parameterized tests over one exported table,
  `tests/fixtures/anthropic-state-refusals.ts` (each row: a name, the encoder's state `data`, and the
  built stream that produces the shape, or none with the reason). At the encoder, every row's `data` on
  an assistant tool step is refused by `encodeAnthropic` with INVALID_INFERENCE_REQUEST (non-JSON
  `data`; JSON that is not exactly `{ content }`; 0 and 513 blocks; an unknown block type; a non-string
  `text`; a non-string `thinking`; a `thinking` with no `signature` field, with `signature: ""` and with
  a non-string `signature`; a `redacted_thinking` with empty or missing `data`; a `tool_use` id outside
  `IdSchema`; a bad tool name; a non-object or unbounded `input`; extra fields deeper than 32, with more
  than 10,000 nodes or over 131,072 bytes). At the outcome, every row with a stream, folded by
  `readAnthropic` and mapped by `anthropicOutcome` with the offered tools, fails with
  PROVIDER_INVALID_RESPONSE and returns no completion, so no tool can run: among them a `thinking`
  start with no `signature` field and no `signature_delta`, a `thinking` start whose `thinking` is not
  a string with no `thinking_delta`, a `redacted_thinking` start with `data: ""`, a start object whose
  extra fields exceed the bound, a `tool_use` stop with no block, and the 513th block (refused in the
  reader; the 513-block fold built directly is refused by the outcome). Guard: skip the outcome's
  schema check, and every stream row that only the schema refuses returns calls whose state the
  encoder refuses only at step 2 (the no-block, 513th-block, unknown-block and missing- or
  empty-signature rows stay red through the outcome's or the reader's own rules, which have their own
  guards above). A
  fold whose state would exceed `PROVIDER_STATE_MAX` (built directly, the outcome being pure) is
  PROVIDER_RESPONSE_TOO_LARGE. A malformed start followed by its delta (section 5.4, types before
  accumulation): a `text` start with `text: null` then a `text_delta` "Hi"; a `thinking` start with a
  numeric `thinking` then a `thinking_delta`; a `thinking` start with `signature: 0` then a
  `signature_delta`; and a `text_delta` whose own `text` is not a string. Each fails in the reader with
  PROVIDER_INVALID_RESPONSE, once in a stream that stops with `tool_use` (refused, no calls) and once in
  a stream that stops with `end_turn` (refused too, no content) (guard: append without the type check;
  the tool turn then returns calls with a state holding `"nullHi"` or a replaced signature, and the
  final answer completes with content `"nullHi"`). A final answer whose `text` start holds a non-string
  `text` and no delta is PROVIDER_INVALID_RESPONSE (guard: join with `String()`, which gives `"null"`).
  Tolerance, in a final answer (`end_turn`): a block of an unknown type between two text blocks is
  dropped and the content is the two texts joined (guard: refuse unknown blocks in every turn); an
  unknown delta type on a text block between two `text_delta` events is ignored and the block's text
  from those two deltas stays in the content (guard: drop a block marked not replayable from the
  content);
  `ping` and unknown event types ignored; an event with no `event:` line accepted; a zero-delta block
  and a whole `redacted_thinking` kept; a `max_tokens` stop with a half `tool_use` is incomplete; an
  `end_turn` carrying a refusal `stop_details` (E-09 l.1173-1178's shape) is complete. Outcome table:
  every E-11 value, a null and an unknown one, a missing `message_stop`. Usage: the three inputs summed,
  the latest value per field (E-10 l.457 and l.531), never summed across events, unset without both
  counts. Encoder: system lifted from the first message, and its key absent when empty; body keys in
  the order `model, max_tokens, system, messages, tools, stream`; tools as
  `{ name, description, input_schema }` in the offered order, the `tools` key absent when none are
  offered; two consecutive user messages sent as two user messages; tool results grouped in order with
  string content and no `is_error`; call-free assistant as a string; state content sent unchanged,
  extra block fields included; a canonical call input holding `-0` matches its state (guard: compare
  with `isDeepStrictEqual`); encoding twice gives the same bytes; no `thinking`, `tool_choice`,
  `temperature`, `top_p`, `top_k` or `stream_options`; refusals, besides the state schema's (the table
  above), for a system message after the first, an assistant tool step without state, a foreign
  format, a `tool_use` id, name, input, count or order mismatch, a text mismatch, and a transcript
  ending with an assistant message. Route and headers: `url` gives `<endpoint>/messages`; Bearer and the version, no `x-api-key`,
  `anthropic-beta` or workspace header; `timeoutMs` is 600,000. `isAnthropicOverflow`: true only for
  `invalid_request_error` with "prompt is too long"; false for each other 400 text in section 5.7.
  `anthropicRetryDelayMs`: seconds for a numeric 429 and for a 5xx with a numeric header; undefined for
  a 429 without the header or with a date; 1 s then 2 s for 500, 502, 503, 504, 529 and 599 without the
  header; undefined for 400, 401 and 404.
- **Main** (U4; `tests/provider-screen.test.ts`, `tests/anthropic-transport.test.ts`): a vault secret in
  a thinking leaf, a text leaf, a tool-input key, split across two text blocks, or containing `"` and `\`
  fails a tool step with PROVIDER_PROTOCOL_ERROR (the escaping case red against a JSON-text check);
  a vault secret in `toolCalls` of a tool step with no state fails with PROVIDER_PROTOCOL_ERROR, the
  rule moved from `src/main/index.ts:105-108` (red with that rule removed from `screenCompletion`);
  no state leaves the output unchanged and content redaction as today; REDACTION_UNAVAILABLE propagates;
  a source pin shows `infer()` calls `screenCompletion` after `invoke` and the Phase 1 pin still passes.
  `complete()` with kind `anthropic` over a fake fetcher: `<endpoint>/messages`, the exact init (with
  `credentials: 'omit'` only if the D10 verdict kept commit 3; the brief, written after the verdict,
  says which) and headers; a two-step round trip passes step 1's state into step 2's body unchanged; a
  400 "prompt is too long" is CONTEXT_LIMIT and its text appears nowhere in the error; a spend-cap 429
  makes one fetch; a numeric 429 retries; a 503 retries after 1 s, and with `retry: false` the same 503
  makes one fetch and throws `PROVIDER_HTTP_503` at once (red when the option is not passed to
  `post()`); a stalled answer is not aborted at 120 s and is at 600 s (fake timers drive `complete()`'s
  own `setTimeout`, no spy; red under `timeoutMs: 120_000`). Every row of the state refusal table
  (`tests/fixtures/anthropic-state-refusals.ts`, U3), as the state of an assistant tool step passed to
  `complete()`, is refused with INVALID_INFERENCE_REQUEST and the counting fake fetcher is never called.
  `profile.test` sends the profile's `outputTokens` for `anthropic` and 32 otherwise and passes
  `retry: false` (helper or source pin).
- **Renderer** (U4; `tests/workbench.test.tsx`): the select offers Anthropic API after the existing
  options; choosing it sets `https://api.anthropic.com/v1` and shows the hint, which holds the
  single-workspace sentence, the data-use sentence of section 7 exactly (the whole sentence as one
  string, so a dropped or reworded clause is red), "several minutes" and "not yet checked against the
  live API", and contains neither "Haiku" nor "not retained"; choosing Ollama restores the loopback
  endpoint.
- **Electron check** (U2, end of wave 1, Linux under xvfb; section 4): `Authorization` kept, no planted
  cookie sent, Basic proxy outcomes (plain rule and credentials in the rule's URL, each to a plain-HTTP
  fake and to an HTTPS fake through a `CONNECT` tunnel) and a server 401 Basic outcome, each at the
  parent commit and with commit 3, as shipped and with a harness `login` handler; the expected outcome
  (as-shipped proxy and 401 runs fail at both, Electron's default cancelling the challenge) stated
  beside the results; the harness-handler runs may fail like the as-shipped ones (`app.on('login')`
  is documented for `webContents` and utility-process requests), and the report says so if they do;
  the verdict from the as-shipped runs, worded "no as-shipped proxy or 401 path worked at the parent"
  when that is what ran, recorded in U2's unit report before U4 and U5 are briefed and again in the
  integration report; if the check cannot run at all, the report says why and commit 3 is not merged;
  not a vitest file.
- **Windows e2e** (U5; `e2e/anthropic.spec.ts`, `e2e/workbench.spec.ts`): an Anthropic profile on a
  loopback fake whose streams are built from E-10 shapes and marked so (the E-10 tool example's
  `get_weather` is not a tool MoonAliza offers): Test connection answered by a built `end_turn` text
  stream; then the project is made cloud-allowed through the UI, as
  `e2e/context-recovery.spec.ts:50` does: with the Anthropic profile selected in the trusted, local-only
  project, click "Review cloud access" in the privacy notice (`src/renderer/App.tsx:234`), then "Allow
  for this project" in the "Allow cloud inference?" dialog (`App.tsx:247`), and expect "Send message"
  enabled (`context-recovery.spec.ts:51`); then, in Ask mode, one tool round trip whose first step is a
  `thinking` block with empty `thinking` and a `signature` that is a marker built for the test from
  base64-alphabet letters and digits only, long enough not to occur by chance (not copied from E-10
  l.407, whose example signature is elided with "..."; JSON never escapes those characters, so one form
  serves every nesting depth), a `text` block, and
  a `tool_use` of `list_files` with input `{"path": "."}`, stopping with `tool_use`, and whose second
  step is a built `end_turn` answer. The fake asserts `authorization: Bearer <key>`,
  `anthropic-version: 2023-06-01`, path `/v1/messages`, the test request's `max_tokens`, that
  request 2 is request 1's messages plus step 1's content array plus one user message of `tool_result`
  blocks only, and that `system`, `tools`, `model`, `max_tokens` and `stream` are byte-equal between
  requests 1 and 2 (each compared as `JSON.stringify` of its parsed value, canonical because the
  encoder is pure and fixes key order). E-12 l.283 binds a replayed thinking block to the `system`
  prompt and `tools` as well as the messages before it, and this journey is the only real-wire check of
  that rule: T-3 compares the engine's messages, not the encoded `system` or `tools`. That assertion is
  shown red under a mutation giving the system message handed to `infer` a step-dependent suffix (at
  the `infer` call, `application.ts:361` at `3bba21c`, or wherever U1 leaves it; a suffix added where
  the context is assembled, `:358`, would be hidden by the freeze, which reuses the previous request's
  messages). After the app is closed, a byte scan of its userData directory finds the marker nowhere
  (the pattern of `e2e/research-collector.spec.ts:32`). The workbench fake asserts `Authorization` on
  `/api/chat`. Only if the D10 verdict kept commit 3 (U5's brief says which): the Anthropic fake asserts
  no `cookie` header although a cookie for its origin was planted in the provider session, and the
  workbench fake no `cookie` with one planted in the local session. Each assertion is shown failing with
  its guard removed (`credentials`, if present; the state carry; the strip, for the scan) or, for the
  `system` and `tools` equality, under the step-dependent suffix above.

### As built (Phase 2)

Recorded from the build, the unit reviews, the live probes and the integration review
(`docs/orchestration/2026-10-05-more-models/reports/`: `p2-wave1-workflow.json`, `p2-u3-live.json`,
`p2-wave2-workflow.json`, `p2-integration-review.json`).

- Units on `main-axuse`: U0 `28395c5` (lead); U1 to `47db017`; U2 `0337f69..ed70e78`; U3
  `90c7727..cc77893` and `3e88117`; U4 `b1e8550..bbc14aa`; U5 `0e96f1f`, `2d3fa59`. Each unit was
  reviewed refute-first; U1, U2 and U3 took three rounds, U4 and U5 one.
- **D10 kept commit 3** (`792b508`, wording `c091c3d`): every chat request, for every kind, is sent with
  `credentials: 'omit'`. In real Electron 44.4.5 under xvfb, with the expected outcomes written first:
  with commit 3 a cookie planted for the fake's origin is not sent and `Authorization` is; no as-shipped
  proxy or 401 path worked at the parent; a proxy rule carrying credentials in its URL is not used by
  Chromium at all (`ERR_NO_SUPPORTED_PROXIES`); with a harness `login` handler, a proxy authorization
  Chromium had already cached is still sent under `credentials: 'omit'`. The verdict rests on case 1, as
  item 5 above says; it is not evidence that proxy authentication is unaffected. Known limit: a gateway
  that needs Windows-integrated sign-in (NTLM or Negotiate) or a client certificate may refuse chat
  requests (README). U5's e2e asserts no `cookie` header with one planted in the provider session (with a
  positive control from that session without `omit`) and in the local session.
- **Live probes, 2026-10-12** (`docs/evidence/2026-10-12-anthropic-probes.md`, US$0.47 booked of the
  US$3 cap, the native shape of section 5 sent by a probe script, not by MoonAliza): Bearer is accepted
  (an unauthenticated request's 401 still names `x-api-key`); the over-window refusal is 400
  `invalid_request_error` "prompt is too long: 340027 tokens > 200000 maximum", which the overflow rule
  matches unchanged; streams are LF-only, each `event:` equals its data `type`, and the one `ping` sits
  inside the first open block, right after its `content_block_start`; a thinking block starts as
  `{"type":"thinking","thinking":"","signature":""}` and gets exactly one `signature_delta`; Sonnet 5.5,
  like Opus 5.5 and Fable 5.1, omits thinking text, so the state holds signatures and empty text; usage
  carries fields the captures lacked (`cache_creation`, `service_tier`, `inference_geo`,
  `output_tokens_details`), and the latest value wins (summing would be wrong); the JSON on a data line
  is padded with spaces before its last brace; every live `tool_use` start carries
  `"caller":{"type":"direct"}`, and replaying it verbatim is accepted on all four models; Haiku 4.5 does
  not think when `thinking` is omitted; no `redacted_thinking`, `fallback`, 429 or 5xx occurred; a
  32,000-token `max_tokens` did not slow Test connection (about 1 s on every model); the input estimate
  stayed above the reported count on every request measured. Anthropic's compatible route
  (`/v1/chat/completions`) works through the unmodified `openai-compatible` path, tool calls included
  (10 of 10 on a reduced U-06 set, Sonnet 5.5 only).
- Pinned from the live recordings: U3's follow-up feeds seven recorded streams through the adapter byte
  for byte (`tests/fixtures/anthropic-live/`, sha256-pinned, kept byte-exact by `.gitattributes`), and
  U4's transport test shows `complete()` building the request bodies the live API accepted (D1, D5 steps 1
  and 2) by sha256. No source change was needed after the probes.
- Corrections the probes made to the run's own documents: section 5.5's set-aside alternative (keep only
  the documented fields) is now untested rather than known-safe, because live starts carry `caller`; the
  chosen rule (keep every field verbatim) is the one that works. DAY-ONE-P2's D7 costed Haiku 4.5's "64K"
  as 65,536; the live limit is 64,000 ("max_tokens: 70000 > 64000").
- **D6's side effect.** A second run whose history drops the first run's tool turns is accepted, as
  designed, but the model then concluded its earlier answer had been invented ("I never called any
  weather tool. The 'Paris, 18 °C, cloudy' result was made up, so ignore it"). This is the cost of the
  existing rule that history keeps a run's final answer and drops its tool turns; it is not new in
  Phase 2 and is recorded for later.
- Deviations from the breakdown, each reviewed: U0 updated `inferenceErrorCode`'s doc comment itself
  rather than leaving it to U2, so no commit leaves it stale; U4's S-3 main-side pin (`bbc14aa`) landed
  after the registration that makes it reachable, and it passes on the code before U4 too, so it pins
  existing behaviour (U4-R2); `AnthropicHint` spaced its lines with an inline style (U4-R4, see below);
  U5's local-session positive control read the stored cookie (`cookies.get`) rather than sending a
  probe (U5-R3), and its assertion was shown red with `credentials: 'omit'` removed; a probe sent without
  `omit` replaced it in `c540092` (P2-SPEC-3); the `tools` half of
  U5's `system`/`tools` equality was proven by the reviewer's own mutation (tools reversed on step 2),
  not the builder's (U5-R1).
- Fixed after the integration review (`reports/p2-integration-review.json`): the hint's live-API sentence
  (P2-SPEC-1, U4-R5, `cd83bd3`); these notes (P2-SPEC-2); the tool-call screen now also reads the calls'
  keys and string leaves, so a secret holding `"` or `\` cannot hide behind JSON escaping in any kind
  (P2-IR-1, `23545c3`); a test that `complete()` hands `post()` the kind's own deadline (P2-MUT-1,
  `48dd054`); a positive control for the workbench's no-cookie assertion (P2-SPEC-3, `c540092`).
- Fail-closed cases the design did not spell out (P2-SPEC-4): `readAnthropic` refuses with
  PROVIDER_INVALID_RESPONSE a data payload that is not an object with a string `type` (even under
  `event: ping`), a `content_block_start` whose block has no string type, a delta on a known block whose
  `type` is missing or not a string, and a non-null `stop_reason` that is not a string; a usage count that
  is not a non-negative safe integer is ignored, and an input sum past the safe integers leaves usage
  unset; a state whose data is not JSON is PROVIDER_PROTOCOL_ERROR at the screen. S-5's "only the owning
  adapter parses it" has one other reader by design: main's screen parses any format's data to walk its
  leaves (section 6).
- Behaviour the breaker measured and left (P2-BRK-3, -4, -5, -6): the 600 s deadline, retries used up on
  a 529 and an Electron stream cut all reach the user as the generic PROVIDER_ERROR text; a stream that
  ends cleanly before any text block is an empty incomplete answer, stored and not shown (as for every
  kind); a bare-CR stream fails (the Phase 1 `lines()` limit); the whole-replay estimate counts the
  state's data as an escaped string, so thinking with many quotes or newlines is overestimated (the error
  is conservative: a frozen run can stop early, never overflow).
- Mutation (P2-MUT-2, -3): 124 of 128 mutations killed. Equivalent survivors: `complete()` passing the
  joined signal as `stop` (unobservable: no wait can end at or after the deadline), and two early exits in
  `toolCallsOutcome` (an unsigned thinking block, no `tool_use` block) that `parseAnthropicState` and
  `InferenceToolCallsSchema` enforce again with the same outcome.
- The inference grant still lasts 125 s (`index.ts:103`), sized for 120 s, while an `anthropic` call and
  its retries can last 600 s; `withSecret` checks the grant on entry only, so the key stays in
  `Authorization` inside the callback, but the grant's expiry no longer bounds its use (P2-IR-4, F-22).
- What the tests do not reach: the Anthropic e2e journey stops at "Trust and open" on Linux (the
  Windows-only helper), so the whole journey, the workbench journey and the provider-session check on
  the run's two requests are seen only on Windows CI. The app itself has not sent a request to the live
  API; its requests are compared with ones the live API accepted.

### Recorded for later (Phase 2 additions)

- Persisting state: the first phase with a cross-run reader adds the write inside `message()`'s
  transaction, the identity envelope, a bulk read at `application.ts:347`, and a `getWireState` that
  treats a revision mismatch as "no state" (`store.ts:237` throws today); Phase 4 widens the slot's
  refines to plain answers. It changes the AGENTS.md provider-state row, which goes to the user.
- The privacy paths that phase must close, each of which Phase 2 avoids only because nothing is
  stored: `session.branch` (`application.ts:192-202`) must not copy state rows into the new session,
  and its renderer-supplied context must never be built from state; the FTS triggers
  (`migrations.ts:94-104`) index `messages.content`, so state must stay out of that column; deleting a
  session cascades to `provider_wire_state` (`migrations.ts:49-50`), but with no `secure_delete` pragma
  the bytes stay in free pages and the WAL until overwritten, so the phase decides `secure_delete` or a
  vacuum on deletion; and `diagnostics.export` (declared, not built, `src/shared/params.ts:153`) must
  exclude provider state when it is built.
- The workspace setting (schema v5), with Anthropic's compatible layer in Phase 4.
- The whole-request timeouts (120 s for the existing kinds, 600 s for `anthropic`): an idle timeout.
  D12's one thinking-heavy step took 6.4 s and D7's Test connection about 1 s at every `max_tokens`
  tried, so neither is needed on that evidence; a step that thinks for tens of thousands of tokens was
  not provoked, and its wall time is unmeasured.
- The reserve's size, and whether it should also bound `current` (section 3, known limit 5), revisited
  after D16 and any CONTEXT_LIMIT reports from frozen runs.
- Continuing a turn cut short after a tool call (H-E03 l.485), if users meet it.
- A `login` handler for proxy or server authentication (out of scope). D10's harness-handler runs (an
  `app.on('login')` answering every challenge, at the parent commit and with commit 3, two runs each):
  every `login` event recorded was for Chromium's own spell-check dictionary download through the
  proxy, none for a `session.fetch`; a proxied chat request got through only when Chromium had already
  cached the proxy's authorization from that download, and then at the parent and with commit 3 alike
  (so `credentials: 'omit'` does not withhold a cached proxy authorization); with the dictionary host
  bypassed, every proxied request failed 407 at both; the server 401 failed at both. So a phase that
  adds a handler first establishes how a `session.fetch` challenge in main can reach one
  (`app.on('login')` is documented for `webContents` and utility-process requests,
  `node_modules/electron/electron.d.ts:510`).
- Commit 3 stayed (D10): gateways that need Windows-integrated sign-in (NTLM or Negotiate, at a proxy
  or the server) or a client certificate (section 4 known limit); a per-profile way to send session
  credentials, decided only if a user reports one.
- Naming provider refusals in Test connection (D7's over-maximum `max_tokens`, D9's multi-workspace
  error): today every failure there shows the generic INTERNAL_ERROR text (section 6); a named refusal
  needs a public mapping in `publicMessages` (`src/main/bridge.ts`), a new public code under F-21, so it
  goes through the stop-list review with the recordings as its evidence.
- History keeps a run's final answer and drops its tool turns, so a later run can conclude that its
  earlier answer was invented (D6, quoted in "As built"). Keeping a compact record of the tools a run
  used, or replaying its tool turns, is a quality change across every kind, decided with the
  persisting-state phase.
- From the integration review: skip short or common vault values in the state and content screen
  (P2-BRK-1, today a known limit); treat `anthropic` as external in the engine's local-only checks and
  in Test connection whatever label is stored (P2-IR-2); size the inference grant from the kind's
  `timeoutMs` or check it before each retry (P2-IR-4); make the history reserve's trimming linear
  (P2-BRK-2, quadratic since before Phase 2); count the replayed content, not its escaped data string
  (P2-BRK-6); add `e2e/` to `npm run lint` (P2-SPEC-5 (e)); one `vault.redact` pass for both forms of the
  tool calls, which now decrypts the vault twice per tool step (RR-5); a control to clear a saved key
  (the form keeps it on a blank Edit, and nothing sends `clearCredential`); the README's "must be sent back
  unchanged" against D5f, where this account accepted a changed system prompt with signed thinking: kept,
  because Anthropic requires it for newer accounts and the design stays append-only (P2-SPEC-5 (c)); confirm whether "128K output tokens" is
  128,000 (Haiku's "64K" was 64,000) and cap the form's maximum response per kind (P2-SPEC-5 (a)).
- Anthropic's compatible route was checked on Sonnet 5.5 only, with a reduced U-06 set (10 prompts);
  the full set (20 or more per model, Opus and Fable too) is Phase 4 input. Replaying re-serialized tool
  input was accepted with string arguments only; integer-like key order and number normalisation are
  not exercised.
