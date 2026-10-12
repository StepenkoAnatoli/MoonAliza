# Phase 2 decisions (expensive to reverse)

One record per choice that would be costly to undo once built, shipped or relied on. Citations as in
`docs/specification/more-models-phase2.md` (E-nn l.N: wire corpus capture line; H-E03: the reused thinking capture; SL-Enn: a
shortlist row). Requirement rows are in `REQUIREMENTS-P2.md`. The synthesis started from the design the
three judges rated best (the minimal design, 50/50/50), fixed every flaw a judge named, and grafted the
ideas they recommended from the other two; where a graft was not taken, the record says why.

---

## DR-1. The provider-state slot: a tagged, bounded, in-memory record; nothing persisted in Phase 2

**Decision.** `providerState = { format, appendOnly, data }` (strict; `data` an adapter-owned JSON
string of at most 4,194,304 characters) on `InferenceMessage` (assistant with tool calls only) and
`Completion` (`tool_calls` only). The engine keeps it in the run's in-memory `current` list; `message()`
strips it; no table, column or migration. `provider_wire_state` stays unused until the first phase with
a cross-run reader.

**Alternatives.**
- (a) Persist every stateful message now in `provider_wire_state` (the durable and adapter designs).
- (b) A structured payload in the IPC schema (`format`, `replay`, `message`, `calls`) with its own
  bounded JSON walk (durable).
- (c) An untagged opaque string (minimal).
- (d) A column on `messages`, event payloads or `ToolCall` fields.
- (e) A per-run cache held in main.

**Why this wins.**
- Nothing in Phase 2 reads state across runs (DR-2 never replays earlier runs' thinking), so (a) writes
  rows no code reads and puts signatures and any thinking summary at rest. All three judges marked that
  as a cost; the durable design's main reason for it (replaying a stored final answer if D6 fails) does
  not hold, because the cross-run prefix cannot be kept (DR-2).
- The existing table already fits every later vendor (one JSON row per assistant message, a revision
  foreign key, `json_valid`), so deferring costs no migration later: the first reader adds the write in
  `message()`'s transaction, the identity envelope and a non-throwing read.
- The `format` tag (grafted from durable) lets main refuse a foreign state without parsing it and names
  the dialect where one kind carries several (Phase 4). `appendOnly` (grafted from adapter) lets the
  vendor rule decide the freeze (DR-2) without the engine parsing vendor data.
- A string bounded by zod in constant time keeps untrusted depth out of any recursive schema; (b) needs
  a new walker for a shape no Phase 2 vendor uses.
- (d) leaks through `SELECT *`, the search-index trigger and strict DTOs; (e) cannot serve a later
  cross-run reader and ties main to engine message identity.

**Trade-offs.** Phase 4 must widen both refines (DeepSeek wants state on plain answers, E-19) and build
the write and read paths. Engine restart drops in-flight state, which is harmless because runs never
resume. AGENTS.md gains an invariant row that holds Phase 2 to this (D-2: provider state lives only in a
run's memory, never in the database, events, search index, renderer or logs, and never reaches a kind
that does not own its format); the phase that persists state changes that row, and the change goes to
the user. The lead adds the row under the user's "you have full access. continue" because it only
narrows; the user may overrule it (`USER-DECISIONS-P2.md`).

**Risks.**
- A missed side of the IPC schema: a silent hang until the run deadline (`src/main/engine.ts:46-47`)
  or PROVIDER_ERROR on every step (`:84-86`). Mitigation: both schemas in one U0 commit, a test per
  direction.
- The object spread in `message()` (`application.ts:277`) carries the state into `events`. Mitigation:
  an explicit destructure and a byte-scan test whose marker is base64-alphabet only, so the twice-escaped
  copy in an `events` row still matches (T-6), placed only in a thinking text and signature (a text
  block or tool input becomes stored content or calls by design), with a guard that hides the state in
  an event's string field.

**Rests on.** F-1, F-2, F-3, F-21, S-2, S-5, T-6, D-2; wire design point 1 and Decision step 1
(departed from: "through the wire-state store"); `source-plan.md:644-646`; `DECISIONS-P2.md:7`; E-19, E-37
(later fit).

---

## DR-2. Anthropic thinking replay: remedy A, append-only within a run, with a step-1 reserve

**Taken by the lead** under the user's "you have full access. continue" (2026-10-11), as recommended;
recorded in `USER-DECISIONS-P2.md`, and the user may overrule it.

**Decision (Mandate decision 5).** Replay the current run's thinking verbatim; never replay earlier
runs' thinking. For an `anthropic` run that offers tools: every unfrozen step trims history to half the
input budget and 500 messages; from the first tool step whose state is `appendOnly`, each request is the
previous request plus the new messages, only not-yet-sent results may be cut (to the 0-byte excerpt,
oldest first), and a step that still does not fit ends with CONTEXT_LIMIT and its own message. No
`thinking` field, beta header or `block_binding`.

**Alternatives.**
- (B) The `thinking-binding-controls-2026-08-01` beta header with `prefix_mismatch_behavior: "drop_block"`.
- (C) Strip thinking from the edited turn on.
- (D) Server-side compaction or context editing.
- Freeze without a reserve (durable, adapter).
- Freeze every Anthropic tool run from step 1 and never compact (minimal).
- Store final answers' thinking and replay it in the next run (minimal's and durable's D6 fallback).

**Why this wins.**
- It rests only on captured facts: the prefix rule (E-12 l.283-287), the must-return rule within a tool
  turn (E-13 l.85; E-12 l.167-175), the permission to omit earlier turns' thinking (H-E03 l.383-385;
  E-13 l.97), and Anthropic's advice to be append-only on every account (H-E03 l.512-514; E-12 l.291).
- One request shape for all four shortlisted models whatever the account's age; no field Haiku 4.5
  refuses (`adaptive`, E-12 l.191-195) and none Sonnet 5.5 needs for B (E-12 l.291).
- B needs facts not collected: the header name (no capture contains `anthropic-beta`), what counts as an
  edit and the `input_transformations` shape (H-E03 l.516-519). Collecting them is metered collection, on
  the stop-list. Mid-loop it would also drop the block the model continues from.
- The reserve (from minimal; all three judges named it the only fix for the real failure) prevents the
  step-2 CONTEXT_LIMIT a freeze without headroom causes in long sessions: step 1 trims to just under the
  budget, then step 2 adds a signature carrying the encrypted full thinking (H-E03 l.137).
- Freezing only once `appendOnly` state arrives (adapter) keeps today's trimming for runs that never
  think; cutting only unsent results (durable) stretches a frozen run without editing the prefix.
- Stored-answer replay is set aside because history drops tool turns and the system prompt and tools
  change with mode and project, so a replayed block would be "bound to a different conversation" (E-12
  l.283-286). If D6 shows the omitted thinking is refused, the only remedy is B (a user decision).

**Trade-offs.** Anthropic tool runs see at most about half the input budget (and 500 messages) of
earlier conversation, even when the model never thinks, because the reserve is chosen before any
response. A frozen run that outgrows the rest stops with CONTEXT_LIMIT instead of trimming, whether the
local estimate or the provider finds the overflow. The reserve bounds history only: unfrozen steps that
grew `current` before the first thinking block leave a frozen run little room (spec section 3, known
limit 5). On accounts created before 2026-08-31 the freeze protects nothing and still costs the same
(H-E03 l.512).

**Risks.**
- R1: D6 refuses the earlier answer without its thinking (E-12 l.167 can be read that way): every second
  run in a session would fail until B is collected and built. Low likelihood (H-E03 l.385 states it is
  allowed); high impact.
- R2: Anthropic's prefix check counts something Moonzila changes as an edit (what counts is not
  captured): every step 2 gets a 400 on new accounts. D5 settles it; failures are visible PROVIDER_ERROR,
  never wrong answers.
- R3: half is Moonzila's own heuristic; small windows (Haiku 4.5, 200K) feel it. D16 calibrates.
- R4: the freeze base taken from the wrong request leaves the prefix changing. Mitigation: the
  element-by-element property test (T-3) for the messages, and the Windows e2e's check that `system`
  and `tools` are byte-equal between a round trip's two requests (T-4), the part of the prefix E-12
  l.283 names that T-3 does not see.

**Rests on.** F-15, F-16, F-17, T-3, T-4; E-12 l.167-175, l.283-296; E-13 l.85, l.97; H-E03 l.137,
l.376-389, l.512-519; SL-E01; `application.ts:339-354`, `:347`; `context.ts:36-43`; MANDATE.md decision 5.

---

## DR-3. Replay content: the accumulated blocks verbatim

**Decision.** The state holds the response's whole content array in index order, each block being its
`content_block_start` object with the accumulated `text`, `thinking`, `signature` and parsed `input`,
empty thinking blocks included, any extra field kept. The encoder sends it unchanged after strict checks
against the canonical calls and content. An assistant tool step without state is refused, never rebuilt.

**Alternatives.**
- (a) Keep only each block type's documented input fields (minimal).
- (b) Store state only when thinking is present and rebuild other tool steps from the canonical text and
  calls (adapter).
- (c) Rebuild every assistant turn from the canonical message.

**Why this wins.**
- It is what Anthropic's own loop does: the SDK accumulates the stream into the final message (E-10
  l.59) and the loop appends `response.content` as the assistant turn (E-11 l.611-613). It matches "send
  every assistant turn back exactly as you received it" (H-E03 l.514), "passed back unmodified and in
  their original order" (E-09 l.161), and `source-plan.md:644` ("losslessly").
- On every capture the start objects hold exactly the documented fields (E-10 l.202, l.321, l.392), so
  (a) and the decision agree wherever there is evidence.
- One encoder path: no second rebuild path to keep byte-stable (b), and no thinking reconstructed (c)
  ("reconstructed" is a 400, E-12 l.167; `source-plan.md:647`).

**Trade-offs.** A secret in any part of an Anthropic tool step (text, thinking, tool input) fails the
step instead of being redacted (DR-6). Tool inputs are re-serialized from the parsed object (key order of
integer-like keys and number formats can differ from the model's bytes).

**Risks.** A live block may carry a response-only field the API refuses on input ("Extra inputs are not
permitted", the pattern at E-12 l.296), or the API may count a re-serialized input as an edit. Either
gives a 400 on every step 2, visible at once. D5 records which; the fallback (a field whitelist, or raw
input text) is one function in `src/main/anthropic.ts`. Accumulating onto a malformed start object
would coerce it (`null + 'Hi'` is `'nullHi'`) into a state the outcome's schema check accepts although
the provider never sent it: the reader applies a delta only when its own field and the start field it
extends are strings, and refuses it otherwise in any turn (spec 5.4).

**Rests on.** F-8, F-11; E-09 l.135-179; E-10 l.59, l.202, l.321, l.392; E-11 l.611-613; E-12 l.167-175;
H-E03 l.389, l.514.

---

## DR-4. The per-kind request builder: a frozen part interface, existing kinds restructured in place

**Decision.** A `KindPart` interface (types only, `src/main/provider-kind.ts`, frozen in U0):
`url(endpoint, profile)`, `headers(profile, secret)`, `timeoutMs`, `owns`, `refusalStatuses`, a pure
`body`, `read`, a pure `outcome`, `isOverflow` and an optional `retryDelayMs`. `url` and `headers` take
the profile so a later kind can route or authenticate by it without reopening the frozen interface;
`timeoutMs` is one deadline per call (120 s for the existing kinds, unchanged; 600 s for Anthropic).
`complete()` keeps its parameters and check order (its options gain `retry?: boolean`, default true,
which `profile.test` sets to false) and dispatches through a kind table. `openai-compatible` and
`ollama` become one `chatKind(local)` part inside `inference.ts`, their requests byte-identical
(snapshots committed first). One `post()` builds every fetch init with `redirect: 'error'`, and with
`credentials: 'omit'` only if the D10 verdict keeps it: that change lands alone as U2's commit 3, is
dropped before integration on an as-shipped regression, and is not merged if the check cannot run at
all (INV-5 then stays recorded for later). Anthropic is one module, `src/main/anthropic.ts`.

**Alternatives.**
- (a) Inline branches in `complete()` with a shared `post()` only (minimal).
- (b) A `providers/` directory with every kind moved into its own file and a registry (adapter).
- (c) One `encodeMessages` with a kind switch.

**Why this wins.**
- The frozen interface (adapter's best idea) gives U2 and U3 a contract to build against in parallel;
  the `read`/`outcome` split keeps today's order (a Stop wins over a malformed answer, `:175`) and lets
  the outcome table and the truncated-`tool_use` rule be tested without streams.
- Restructuring in place keeps the change to code existing users depend on inside one file, guarded by
  byte-exact snapshots; (b) moves four files' worth of working code for no Phase 2 gain, which two judges
  marked as the largest blast radius.
- (c) grows every phase inside one function.
- `credentials: 'omit'`, if the D10 verdict keeps it, closes INV-5 for every kind; as its own commit it
  can be dropped alone if Electron mishandles it (the riskiest change for existing users). Its verdict
  (D10) is a gate at the end of wave 1, so the units whose tests and text would depend on it (U4, U5)
  are briefed only after it is known, and the revert test holds either way.

**Trade-offs.** `inference.ts` keeps the existing kinds' code; a later phase may still split files.
If commit 3 stays, a gateway that needs Windows-integrated sign-in (NTLM or Negotiate, at a proxy or at
the server) or a client certificate may refuse chat requests: `omit` withholds HTTP authentication and,
by the Fetch standard's definition (not in the corpus), client certificates; none of it is testable
here, so the README and commit 3's report name it.

**Risks.**
- R5: the refactor changes a byte of an existing request or which error comes first. Mitigation: T-2
  snapshots and the F-4 order pins committed before the move, on the unchanged code (each pin red under
  the swap of its two checks), so the refactor commit cannot redefine the order it is checked against;
  the existing suites unchanged against the baseline.
- R6: Electron drops the explicit `Authorization` under `credentials: 'omit'`, breaking every cloud
  profile, or the flag stops a proxy or server from authenticating. Mitigation: at the end of wave 1,
  before the U4 and U5 briefs are written, the transport builder runs the D10 check in Electron 44.4.5
  under xvfb (`Authorization` kept, no cookie, a Basic-auth proxy to a plain-HTTP fake and through a
  `CONNECT` tunnel to an HTTPS fake, and a server 401 Basic, each compared with the parent commit), and
  the verdict rests on the as-shipped runs (no `login` handler, as Moonzila ships). Electron's default
  cancels an authentication challenge, so the as-shipped proxy and 401 runs are expected to fail at
  both commits: when they do, the verdict says "no as-shipped proxy or 401 path worked at the parent"
  and rests on the `Authorization` and cookie case, never on a claim that proxy authentication is
  unaffected; the harness-handler runs are recorded for the out-of-scope `login`-handler item and
  decide nothing, since a difference only they show affects no user (and they may fail like the
  as-shipped runs: `app.on('login')` is documented for `webContents` and utility-process requests,
  `node_modules/electron/electron.d.ts:510`). An as-shipped regression drops the commit before U4 and
  U5 start, and a check that cannot run at all keeps it out as well; if commit 3 stays, the Windows e2e
  asserts the header and cookie rules on both sessions, and a regression seen only there is reverted
  with its named dependents (U4's `credentials` assertion, U5's no-cookie assertions, the spec's
  section 8 line, the README sentence, and the spec's "As built (Phase 2)" sentence recording the rule
  with its known-limit sentence, the "Recorded for later" item swapped back to INV-5) as one commit.
  NTLM, Negotiate and client certificates cannot be tested here (known limit).

**Rests on.** F-3, F-4, F-5, F-14, F-20, F-22, T-2, T-4, T-5; wire design point 2; spec "Recorded for
later" (INV-5); `inference.ts:146-201`; E-09 l.1089; E-12 l.36, l.122.

---

## DR-5. Anthropic locality: always external, loopback allowed

**Decision.** `validateEndpoint` labels every `anthropic` endpoint `external`; `http:` stays allowed
only on loopback.

**Alternatives.** (a) Refuse loopback for this kind (adapter). (b) Label loopback `local`, as today's
host rule would.

**Why this wins.** A loopback server can implement this API and forward to a cloud, and Moonzila cannot
verify that it does not: Ollama serves `/v1/messages` (E-31 l.1987-1988) through
`cloudPassthroughMiddleware` and `ChatHandler`, which hands a cloud-sourced model to
`proxyCloudJSONRequest` (E-31 l.2552-2558, which shows the call, not its destination); that the
destination is ollama.com is E-29's: the local API forwards cloud models after sign-in (E-29 l.53-62),
and ollama.com hosts the same route (E-29 l.30). Moonzila's cloud-off check (`/api/status`) belongs to the `ollama`
kind's native API. So (b) would let a local-only conversation send prompts off the machine, the gap
Phase 1 recorded for `openai-compatible`. (a) is no safer than "always external" under local-only (both
refuse before any byte, `src/engine/policy.ts:77`), but it rules out the Windows e2e fake and local
gateways even under cloud-allowed; two judges marked that as the adapter design's most likely
rejection. README says an Ollama reached through this kind is treated as cloud, and local-only users
use the Ollama kind.

**Trade-offs.** A loopback fake is reached through the provider session (system proxy settings).

**Risks.** An `anthropic` row saved through IPC before this phase with a loopback endpoint carries
`local`; `infer()` now refuses it (INVALID_ENDPOINT, `index.ts:93-94`) until it is saved again. No data
is deleted; the form never offered the kind.

**Rests on.** F-18, S-3; `inference.ts:14-21`; `policy.ts:77`; E-29 l.30, l.53-62; E-31 l.1987-1988,
l.2552-2558; spec Phase 1 known limit (MM-P1-SPEC-5).

---

## DR-6. Secrets in provider state: fail the tool step, never redact the state

**Decision.** `screenCompletion` (new `src/main/provider-screen.ts`, called at the end of `infer()`)
keeps the existing tool-call and content rules and adds one: a tool step carrying state fails with
PROVIDER_PROTOCOL_ERROR when `vault.redact` would change the unredacted content or any key or string leaf
of the parsed state.

**Alternatives.** (a) Redact the state in place. (b) Screen the state's JSON text. (c) Leave the screen
inline in `infer()`, pinned by source text (minimal).

**Why this wins.** A redacted block is an edited block, a 400 on the next step (E-09 l.161; E-12 l.167),
so (a) only defers the failure and puts a modified signature-bound block on the wire. JSON escaping hides
a secret containing `"` or `\`, so (b) misses it; the unredacted content also catches a secret split
across two text blocks. Extracting the screen (adapter, recommended by a judge) gives it behavioural
tests instead of a source pin.

**Trade-offs.** For Anthropic tool steps a repeated key fails the step where other kinds redact text.
The failure must say so: PROVIDER_PROTOCOL_ERROR now crosses from main as itself (it crossed as
PROVIDER_ERROR, `inference.ts:97-99`, `control.ts:96`) and its message names both causes (F-23). The
message is the engine's one shared `failures` entry (`application.ts:393`), so it changes for every
kind: it also corrects what the existing kinds' tool-call secret check reports, and it is the text the
engine's own invalid or unoffered tool-call check (`:370`) now shows.

**Risks.** Moving `index.ts:105-109` breaks the Phase 1 source pin if done before `const invoke =`.
Mitigation: every edit after it; the pin test is run.

**Rests on.** S-1, S-2, F-23; AGENTS.md token invariant; `index.ts:105-109`; E-09 l.161; E-12 l.167.

---

## DR-7. The workspace setting is deferred; single-workspace keys only

**Taken by the lead** under the user's "you have full access. continue" (2026-10-11), as recommended;
recorded in `USER-DECISIONS-P2.md`, and the user may overrule it.

**Decision.** No `anthropic-workspace-id` setting in Phase 2. The form and README say to use a key
created for a single workspace.

**Alternatives.** Add an optional per-profile workspace id now (the wire brief, Decision step 2).

**Why this wins.** E-08 l.52 makes the header optional for a single-workspace key ("runs in that
workspace when you omit the header"). Adding it needs a `profile_revisions` column, which is schema v5:
a migration, a hand-written v4 fixture, the `user_version` pins (`tests/research-jobs-state.test.ts:81`,
`:523`), profile contract and form changes, and a database older builds refuse to open
(`migrations.ts:110`). That one-way step is better taken once, with the phase that also needs the header
for Anthropic's compatible layer (Phase 4, E-15 l.22).

**Trade-offs.** A user with only a multi-workspace key cannot use the kind until then.

**Risks.** The error such a key gets is not captured (D9); even once recorded, the UI can name it only
through a public mapping (a new public code, F-21), so until then such a key's failure shows the generic
"could not be completed" text.

**Rests on.** F-19; E-08 l.52; E-15 l.22; wire design point 2 and Decision step 2 (departed from).

---

## DR-8. Request shape: no `thinking`, beta header, `tool_choice` or sampling parameters

**Decision.** The body is `{ model, max_tokens, system?, messages, tools?, stream: true }` and nothing
else; headers carry no `anthropic-beta`.

**Alternatives.** Send `thinking: { type: 'adaptive', display: 'omitted' }` to keep thinking text out of
responses; send `tool_choice: auto`; per-model branches.

**Why this wins.** Omitting `thinking` is the only value no shortlisted model refuses: `adaptive` is a
400 on Haiku 4.5 (E-12 l.191-195), `disabled` on Fable 5.1, Opus 5.5 and Sonnet 5.5 (l.203-223),
`enabled` on 4.7 and later (l.179-183); `omitted` is already the default on Fable 5.1 and Opus 5.5, two
of the ten models H-E03 l.137 lists with that default (Sonnet 5.5 is absent from the list). `any` and `tool` choices are refused on three shortlisted models (E-12 l.259-267), and `auto` is
the default. Sampling values are refused on newer models (E-09 l.1024-1058; H-E03 l.613). Branching on a
user-typed model id would be fragile.

**Trade-offs.** No control over thinking display or effort; Sonnet 5.5's display default is not stated,
so summarized thinking may arrive (in memory only).

**Risks.** Haiku 4.5's behaviour with `thinking` omitted is not stated (D11); nothing in the design
depends on it.

**Rests on.** F-7; E-09 l.1024-1058; E-12 l.179-267; H-E03 l.137, l.613; SL-E01.

---

## Cheap to reverse (recorded in the spec, no separate record)

- Retries: 429 with an integer `retry-after`; any 5xx (500 to 599, 529 included) with `retry-after` or
  1 s then 2 s; at most two; within the call's deadline; never the spend cap; never for a call made
  with `complete()`'s `retry: false`, which `profile.test` passes so a Test connection never waits on a
  retry (F-14, F-20). Grafted from durable
  and adapter (E-12 l.34, l.41: the SDK retries "5xx server errors"); the minimal design had none.
- Timeouts per kind part (F-22): built from `setTimeout` and an `AbortController`, not
  `AbortSignal.timeout`, which fake timers cannot drive (spec section 4); the existing kinds keep 120 s
  (pinned by a test, which on the unchanged code spies on `AbortSignal.timeout`); Anthropic gets 600 s,
  the adapter design's value (E-09 l.1089 `--max-time 600`; E-12 l.36 streams long requests, l.122 the
  SDKs' 10-minute check for non-streaming ones). The first draft set 600 s aside as "a limit every kind
  shares", which was wrong once the timeout belongs to the part. D12 measures it; an idle timeout is
  recorded for later. `profile.test` keeps its 25 s (known limit, D7).
- `profile.test` sends the profile's own `outputTokens` for `anthropic` (F-20); `min(outputTokens, 1024)`
  set aside (1,024 is a legacy minimum, E-09 l.830, and would not check the ceiling).
- No content-type rule: a 200's body is read as server-sent events whatever its `Content-Type`, and a
  body that is not valid SSE events fails as `readSseEvents` fails it today or for lacking a
  `message_start` (spec 5.4); refusing a label other than `text/event-stream` was set aside because no
  capture states the live label, which D3 records.
- The reader's fail-closed rules (a second `signature_delta`, a known delta on the wrong block or on a
  start field that is not a string, an unknown block or delta in a tool turn): each is one check,
  widened from a recording (D3, D5).
- The estimate counts a whole-replay state instead of its message (F-17), grafted from durable.
- The frozen-run CONTEXT_LIMIT text (F-16), grafted from adapter.
- The AGENTS.md provider-state invariant row (D-2), the adapter design's idea: added by the lead because
  it narrows; the first draft left it out as an invariant change the Mandate does not name. Recorded for
  the user in `USER-DECISIONS-P2.md`.
- `tool_use` equality by `JSON.stringify` of both inputs, not `isDeepStrictEqual` (spec 5.3): the
  state's input went through JSON, so `-0` and `0` must compare equal.
- `stop_details` is never read (spec 5.5): E-09 l.1173-1178 and E-11 l.399 disagree on when it is set,
  and keying on `stop_reason` holds under both.
