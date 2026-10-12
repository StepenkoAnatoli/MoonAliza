# Phase 2 work breakdown

Every unit follows `briefs/p1-common.md` (a `p2-common.md` copy with the Phase 2 paths): its own
worktree and branch, only the files it owns, test-first (a new behaviour test red on the unchanged code;
a regression pin or snapshot green on it and red under a named mutation) with a guard proof per test,
verbatim fixtures copied from the captures in unit tests only (E-row and lines in a comment, checked
against the capture) and every built stream marked "built from E-10 shapes", no network, one
five-part commit per task, `docs/ARCHITECTURE.md` staged with every `src/` commit. U0 opens a "More
models, Phase 2" paragraph in ARCHITECTURE.md; each unit appends only its own sentence there, and the
lead resolves the line conflicts on integration. Node: `export PATH=/versions/node/v24.21.0/bin:$PATH`.

## U0 frozen contracts (lead, before any builder starts)

### `src/engine/control.ts` (added above `InferenceMessageSchema`, then two fields, two refines and one enum value)

```ts
/** Adapter-owned continuation state (more-models Phase 2): one per assistant tool step, held in the run's memory only. */
export const PROVIDER_STATE_MAX = 4 * 1024 * 1024; // characters: the stream cap (src/main/provider-stream.ts:57)
export const PROVIDER_STATE_FORMATS = { anthropic: 'anthropic-messages@1' } as const;
export const ProviderStateSchema = z.object({
  format: z.string().regex(/^[a-z][a-z0-9-]{0,47}@[1-9][0-9]{0,2}$/),
  appendOnly: z.boolean(),
  data: z.string().min(2).max(PROVIDER_STATE_MAX),
}).strict();
export type ProviderState = z.infer<typeof ProviderStateSchema>;

// InferenceMessageSchema: add `providerState: ProviderStateSchema.optional()` to the object, keep the existing refine, add:
//   .refine(m => m.providerState === undefined || (m.role === 'assistant' && m.toolCalls !== undefined), 'Provider state belongs to an assistant tool step')
// CompletionSchema: add `providerState: ProviderStateSchema.optional()`, keep the existing refine, add:
//   .refine(r => r.providerState === undefined || r.outcome === 'tool_calls', 'Provider state belongs to a tool-call outcome')
// ToEngineSchema `inference.error` (:96): the code enum gains 'PROVIDER_PROTOCOL_ERROR' (spec section 6).
```

### `src/main/inference.ts` (line 3 import, lines 10-11, 97-99 and the options type of `complete()` at line 146 only)

```ts
import { /* existing */, type ProviderState } from '../engine/control';
export interface InferenceMessage { role: 'system' | 'user' | 'assistant' | 'tool'; content: string; toolCalls?: ToolCall[]; toolCallId?: string; toolName?: string; providerState?: ProviderState }
export interface Completion { content: string; outcome: 'complete' | 'incomplete' | 'blocked' | 'tool_calls'; toolCalls?: ToolCall[]; usage?: TokenUsage; providerState?: ProviderState }
// :97-99, in the same commit as the enum above (a code the enum refuses is dropped by the engine, src/engine/index.ts:60-61):
export function inferenceErrorCode(error: unknown): 'CONTEXT_LIMIT' | 'LOCAL_MODEL_UNVERIFIED' | 'PROVIDER_PROTOCOL_ERROR' | 'PROVIDER_ERROR'
//   passes CONTEXT_LIMIT, LOCAL_MODEL_UNVERIFIED and PROVIDER_PROTOCOL_ERROR; everything else PROVIDER_ERROR, as today.
//   Its doc comment (:89-96, "Only an overflow is told apart ...") is left for U2, which owns updating it.
// :146, complete()'s options gain one optional field (types only in U0; U2's post() honours it, U4's profile.test passes false):
export async function complete(profile: InferenceProfile, messages: InferenceMessage[], options: { fetcher: Fetcher; secret?: string; signal: AbortSignal; tools?: ToolSpec[]; managedOllama?: { numGpu: 0; keepAlive: -1 }; /** Default true: the kind's retry rule applies. false: never retry; the first refusal surfaces. */ retry?: boolean }): Promise<Completion>
```

### `src/main/provider-kind.ts` (new, types only)

```ts
import type { ToolSpec } from '../shared';
import type { Completion, InferenceMessage, InferenceProfile } from './inference';

/** The transcript after the kind-neutral checks: strict parse, complete tool groups, owned state only. */
export interface CheckedTranscript { readonly messages: readonly InferenceMessage[]; readonly usedIds: ReadonlySet<string> }
export interface ManagedOllamaOptions { numGpu: 0; keepAlive: -1 }
/** One provider kind's wire, driven by complete() (src/main/inference.ts). */
export interface KindPart<Folded> {
  /** The request URL from the validated endpoint (no trailing slash). */
  url(endpoint: string, profile: InferenceProfile): string;
  headers(profile: InferenceProfile, secret: string | undefined): Record<string, string>;
  /** One deadline for every attempt of a call, from its start: 120_000 for chatKind, 600_000 for anthropicKind. */
  readonly timeoutMs: number;
  readonly owns: readonly string[];            // provider-state formats accepted on input
  readonly refusalStatuses: readonly number[]; // statuses whose body (<= 64 KiB) is read for isOverflow
  /** Pure: the same input gives the same bytes. Throws INVALID_INFERENCE_REQUEST. */
  body(profile: InferenceProfile, transcript: CheckedTranscript, tools: readonly ToolSpec[], extra: { managedOllama?: ManagedOllamaOptions }): string;
  /** Framing and accumulation of a 2xx answer, bounded; decides no outcome. */
  read(response: Response): Promise<Folded>;
  /** Pure: stop map, usage, calls (offered names, unused ids) and state. */
  outcome(folded: Folded, check: { tools: readonly ToolSpec[]; usedIds: ReadonlySet<string> }): Completion;
  isOverflow(text: string): boolean;
  /** Milliseconds before retrying this refused answer; undefined = never. attempt is 0 for the first retry. */
  retryDelayMs?(response: Response, attempt: number): number | undefined;
}
```

### `src/main/anthropic.ts` (new skeleton; every function throws `new Error('NOT_IMPLEMENTED')` until U3)

```ts
import { PROVIDER_STATE_FORMATS } from '../engine/control';
import type { ToolSpec } from '../shared';
import type { Completion, InferenceProfile } from './inference';      // types only: no runtime cycle
import type { CheckedTranscript, KindPart } from './provider-kind';

export const ANTHROPIC_VERSION = '2023-06-01';
export interface FoldedBlock { readonly fields: Readonly<Record<string, unknown>>; readonly partialJson: string; readonly replayable: boolean; readonly closed: boolean }
export interface AnthropicFold {
  readonly started: boolean;                   // message_start read
  readonly stopped: boolean;                   // message_stop read
  readonly stopReason: string | null;
  readonly blocks: readonly FoldedBlock[];
  readonly usage: Readonly<{ input_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number; output_tokens?: number }>;
}
export function anthropicHeaders(profile: InferenceProfile, secret: string | undefined): Record<string, string>;
export function encodeAnthropic(profile: InferenceProfile, transcript: CheckedTranscript, tools: readonly ToolSpec[]): string;
export function readAnthropic(response: Response): Promise<AnthropicFold>;
export function anthropicOutcome(fold: AnthropicFold, check: { tools: readonly ToolSpec[]; usedIds: ReadonlySet<string> }): Completion;
export function isAnthropicOverflow(text: string): boolean;
export function anthropicRetryDelayMs(response: Response, attempt: number): number | undefined;
export const anthropicKind: KindPart<AnthropicFold>; // { url: (endpoint) => `${endpoint}/messages`, timeoutMs: 600_000, owns: [PROVIDER_STATE_FORMATS.anthropic], refusalStatuses: [400], ... the functions above }
```

The state's `data` for `anthropic-messages@1` is `JSON.stringify({ content: Block[] })` (spec 5.3, 5.5).
One strict state schema in `anthropic.ts` serves the encoder and the outcome (spec 5.5).

### `src/engine/application.ts` (three edits only)

- `message()` (`:276-277`): `const { providerState: _state, ...visible } = value;` and the stored
  `Message` built from `visible`.
- `:371-372`: `const assistant: InferenceMessage = { role: 'assistant', content: output.content, toolCalls: output.toolCalls, ...(output.providerState ? { providerState: output.providerState } : {}) };`
  then `this.message(run, assistant); current.push(assistant);` unchanged.
- `:393`, the `failures` map's PROVIDER_PROTOCOL_ERROR text only: "The provider returned a tool call or
  step Moonzila could not use safely: a tool call that was invalid or not offered, or output that
  contained a saved credential. Nothing from that step was run or saved." (spec section 6).

### Error codes (frozen: none added)

No new public code, IPC message type, table or column. Internal messages used, all existing:
INVALID_INFERENCE_REQUEST, INVALID_PROFILE, INVALID_ENDPOINT, NOT_IMPLEMENTED, PROVIDER_EMPTY_RESPONSE,
PROVIDER_INVALID_RESPONSE, PROVIDER_STREAM_ERROR, PROVIDER_FINISH_FAILED, PROVIDER_RESPONSE_TOO_LARGE,
`PROVIDER_HTTP_<n>`, PROVIDER_PROTOCOL_ERROR, REDACTION_UNAVAILABLE, RUN_CANCELLED, CONTEXT_LIMIT. Across
the boundary CONTEXT_LIMIT, LOCAL_MODEL_UNVERIFIED and now PROVIDER_PROTOCOL_ERROR (an existing public
code, `src/shared/errors.ts:11`) are told apart (`inferenceErrorCode` and the `inference.error` enum,
both changed in U0); the frozen run's CONTEXT_LIMIT text is in spec section 3, rule 6.

### Owned by one unit, so not frozen (listed for review)

- U1, `src/engine/context.ts`: `PREFIX_BOUND_KINDS`, `WHOLE_REPLAY_FORMATS`,
  `assembleContext({ ..., historyReserve?: boolean })`,
  `continueContext({ previous: { messages: InferenceMessage[]; state: ContextState }, added: ContextMessage[], tools, contextTokens, outputTokens }): { messages; state; fits }`;
  in `application.ts`, a `FROZEN_CONTEXT_LIMIT` text constant chosen where `run.failed` is built (the
  `failures` map line stays U0's).
- U2, `src/main/inference.ts`: `checkTranscript(messages, owns)`, `chatKind(local)` (`timeoutMs: 120_000`;
  `url` and `headers` returning today's values), exported
  `post(fetcher, url, { headers, body, signal, stop, deadline, retry }, part)` with `deadline` =
  `Date.now()` when `complete()` starts its deadline timer, plus `part.timeoutMs`, and `retry` from
  `complete()`'s option (false: `part.retryDelayMs` is never asked); `signal` joins the caller's
  signal and that timer's `AbortController` (a `setTimeout`, never `AbortSignal.timeout`, so fake timers
  drive it; spec section 4); and the `inferenceErrorCode` doc comment (`:89-96`), updated to say that
  PROVIDER_PROTOCOL_ERROR now crosses too (U0 changes the function, not the comment).
- U3, `tests/fixtures/anthropic-state-refusals.ts` (new): the state refusal table of spec 5.3 as data
  (each row: a name, the encoder's state `data`, the built stream or none with its reason), imported by
  U3's and U4's tests.
- U4, `src/main/provider-screen.ts`:
  `screenCompletion(output: Completion, redact: (text: string) => Promise<string>): Promise<Completion>`
  and `providerStateLeaves(data: string): string`; in `src/main/inference.ts`, the runtime
  `import { anthropicKind } from './anthropic';` line and the kind table's `anthropic` entry (the only
  runtime import of `anthropic.ts`, which imports only types from `inference.ts`, so there is no
  cycle).

## Units

| Unit | Description | Owns | Depends on | Wave | Pre-mortem |
|------|-------------|------|------------|------|------------|
| U0 | Contracts (lead). The slot schema and types, the kind-part interface (`url`, `headers(profile, secret)`, `timeoutMs`), `complete()`'s `retry?: boolean` option (type only), the Anthropic skeleton, the engine's strip and carry; PROVIDER_PROTOCOL_ERROR's passage (`inference.error` enum and `inferenceErrorCode`, one commit) and its widened message, which is the shared `failures` entry and so applies to every kind; REQUIREMENTS-P2 and the spec's Phase 2 section committed; briefs written. Tests red-first: the control-schema block (accepted and refused shapes, both directions; `inference.error` with PROVIDER_PROTOCOL_ERROR and `inferenceErrorCode` passing it) and two application tests (the second `infer` call carries the state; after the run, a byte scan of `state.sqlite`, `-wal` and `-shm` as the first assertion, then `session.read` and the parsed `message.created` payloads, hold neither the key nor the marker, which is base64-alphabet only, under 1 KiB of state, so JSON nesting never escapes it, and sits only in the state's thinking text and signature, never in its text block or `tool_use` input, which become stored content and calls by design (spec, "Tests the builders owe"); guards: remove the strip, write the state into the event's copy of the message `content` (a string field `EventSchema` accepts; the scan must go red), remove the state from `:371`; a PROVIDER_PROTOCOL_ERROR from `infer`, and an unoffered call caught by the engine's own check at `:370`, each end the run with the widened message) | `src/engine/control.ts`; `src/main/inference.ts` line 3, lines 10-11, 97-99 (not the doc comment at 89-96, which is U2's) and the options type of `complete()` at line 146; `src/main/provider-kind.ts` (new); `src/main/anthropic.ts` (skeleton); `src/engine/application.ts` `message()`, `:371-372` and the `:393` PROVIDER_PROTOCOL_ERROR text; `tests/provider-transport.test.ts` block `:208-220` and the `inferenceErrorCode` tests `:242-256`; two new tests in `tests/application.test.ts`; `docs/specification/more-models.md` (Phase 2 design); `REQUIREMENTS-P2.md`; `briefs/p2-*.md`; ARCHITECTURE.md paragraph heading | - | 0 | (1) A refine too loose lets state ride on user, tool or system messages or on non-tool outcomes, a quiet leak and replay path: each refused shape gets its own failing case. (2) One IPC side missed, for the state or for the new error code: a silent hang until the run deadline or PROVIDER_ERROR on every step; both directions parsed through `FromEngineSchema` and `ToEngineSchema` in the tests, and the enum and `inferenceErrorCode` change in one commit. (3) A byte scan that cannot see what it guards: a marker JSON escapes (`"`, `\`) is stored escaped twice in the `events` row (`store.ts:186`) and matches neither its raw nor its once-escaped form, so the scan would pass with the state on disk; the marker is base64-alphabet only, and the guard that hides the state in a string field shows the scan itself going red |
| U1 | Engine: append-only Anthropic runs. `PREFIX_BOUND_KINDS`; the half-budget, 500-message history reserve on unfrozen steps of a prefix-bound kind that offers tools; the freeze on the first `appendOnly` state; `continueContext` (previous request plus added messages, only unsent results cut, oldest first); the estimate projection for `anthropic-messages@1`; the frozen-run CONTEXT_LIMIT text, for a local or a provider overflow, review runs excepted. Tests beyond the append-only set: F-15 (a later run's first request carries no state), F-16 (provider overflow in a frozen run gets the frozen text; a frozen review run keeps REVIEW_CONTEXT_LIMIT), S-3 as regression pins (an `external` `anthropic` revision under local-only refused at `run.start` with CLOUD_NOT_ALLOWED and no `infer` call; a switch to local-only during a run, by `session.policy.update` and by `project.policy.update` issued from inside the first `infer` call, ends the run cancelled with `infer` called exactly once, red only under the mutation that removes both the abort, `:189` or `cancelProject` at `:225`, and the revision comparison at `policy.ts:75-76`, since each alone still cancels the run; the before-every-step check stays today's `assertRunPolicy`, `:356`) | `src/engine/context.ts`; `src/engine/application.ts` (except U0's three edits); `tests/context.test.ts`; `tests/application.test.ts` (except U0's tests) | U0 | 1 | (1) The freeze base taken from the wrong request, or the `:43` loop still reachable when frozen, edits the prefix and nothing local sees it until a live 400: the multi-step test compares request k+1 with request k element by element through the real `execute()` with a fake `infer`, and the guard re-enables `:43`. (2) The reserve computed from different inputs than the step's own assembly lets step 1 fill the budget: the long-session test (history near the full budget, two tool steps) must fail with the reserve at 0 |
| U2 | Transport seam. Commit 1, on the unchanged code: byte-exact request snapshots for `openai-compatible` and `ollama` (plain, managed, with tools, multi-step); the F-4 order pins for today's five adjacent pairs whose errors differ (cancellation and endpoint, endpoint and profile, profile and kind, kind and managed-Ollama, managed-Ollama and transcript), each green there and shown red under the swap of its own two checks, and the transcript, tools and body-size refusals each with no fetch, red when that check is moved after the fetch (those three share INVALID_INFERENCE_REQUEST, so their order is not observable and not pinned); and the 120 s abort pin (fake timers, with `AbortSignal.timeout` replaced by the spy of spec section 4, since fake timers cannot reach it; restored after the test). Commit 2: `checkTranscript` with the format-ownership refusal, `chatKind(local)` (`timeoutMs` 120,000), the kind table (`openai-compatible`, `ollama`), `post()` with the retry hook and `complete()`'s `retry` option (false: the hook is never asked; test: a refusal a fake part would retry makes one fetch, red when `post()` ignores the flag), per-kind refusal reading, the deadline built from an `AbortController` and `setTimeout(part.timeoutMs)`, armed only after every pre-check (test: a valid call has one timer pending while its fetch waits, red first, and each pre-check's refusal leaves `vi.getTimerCount()` at 0, red under the mutation that arms it at the top of `complete()`) and cleared in a `finally`, and the retry deadline from `Date.now()` at its start, `validateEndpoint` labelling `anthropic` external (`http://127.0.0.1:11434/v1` included), the `inferenceErrorCode` doc comment (`:89-96`) brought in line with U0's change (PROVIDER_PROTOCOL_ERROR crosses too); of the order tests only the ownership pair (invalid managed-Ollama options plus a foreign state give INVALID_PROFILE, shown red under the mutation that runs the ownership check first), beside the ownership refusal itself (red first); the snapshots, the commit-1 order pins and the 120 s pin pass unchanged. Commit 3: `credentials: 'omit'` with its exact-init pin; its report names the known limit (Windows-integrated sign-in at a proxy or server, client certificates) and the revert set should a regression show after U4 and U5 land (commit 3 with its own ARCHITECTURE.md sentence, U4's `credentials` assertion, U5's no-cookie assertions, spec section 8's credentials line, the README sentence, and the spec's "As built (Phase 2)" sentence recording the rule and D10's verdict with the known-limit sentence beside it, the "Recorded for later" item swapped back to INV-5; spec section 4, item 6). End of wave 1, before the U4 and U5 briefs are written: the Electron check of spec section 4 (D10) in Electron 44.4.5 under xvfb, each case at the parent commit and with commit 3 (`Authorization` kept, no planted cookie; a Basic-auth proxy, plain rule and credentials in the rule's URL, each to a plain-HTTP fake and to an HTTPS fake through a `CONNECT` tunnel, the fake's self-signed certificate accepted with `setCertificateVerifyProc` on the test session only; a server 401 Basic), the proxy and 401 cases as shipped (no `login` handler) and with a harness handler; the expected outcome stated beside the results (the as-shipped proxy and 401 runs fail at both, Electron cancelling the challenge by default, so they cannot show a regression; the harness-handler runs may fail too, since `app.on('login')` is documented for `webContents` and utility-process requests, `electron.d.ts:510`, and the report says so if they do); the verdict, from the as-shipped runs only, in the unit report, worded "no as-shipped proxy or 401 path worked at the parent" when that is what ran, never as evidence that proxy authentication is unaffected. An as-shipped regression drops commit 3 from the branch before integration; if the check cannot run at all, the report says why and commit 3 is not merged (INV-5 stays recorded for later); harness-handler outcomes are recorded for the out-of-scope `login`-handler item | `src/main/inference.ts` (except U0's lines and U4's runtime import and registration lines; the `inferenceErrorCode` doc comment, `:89-96`, included); `tests/provider-transport.test.ts` (except U0's block and tests); the Electron check harness under the scratchpad (not committed) | U0 | 1 | (1) The restructure changes one byte or the order of errors for existing kinds (encoding before the `managedOllama` INVALID_PROFILE check; the cancellation re-check after the outcome): snapshots and the order pins first, on the unchanged code, so a reordering in commit 2 turns a pin red instead of being pinned as the new order, and `provider-transport`, `provider-stream`, `ollama-locality`, `managed-ollama` and `application` run unchanged. (2) The retry loop reuses a consumed response, leaves the refused body open, ignores Stop during the wait or waits past the part's deadline: fake-timer tests for each through `post()` with a fake part. (3) A timeout test that cannot fail: `AbortSignal.timeout` runs on a Node-internal timer fake timers do not reach, so a test of it would never see the abort (or would need real minutes); the deadline is a `setTimeout` the fake clock drives, and the commit-1 pin spies on `AbortSignal.timeout`. (4) The Electron check reaches the fake without passing the proxy (a loopback bypass) and reports a false pass: the proxy's own log must show every request. (5) A difference seen only with the harness `login` handler drops the cookie protection for no user: the verdict reads the as-shipped runs only. (6) A "no regression" verdict read as "proxy authentication is unaffected", when the as-shipped proxy and 401 runs fail at both commits and the only proxied destination is plain HTTP: the HTTPS `CONNECT` runs cover the real path, the expected outcome is written before the run, and the verdict's wording says what ran |
| U3 | Anthropic adapter, pure parts: `url`, headers, `timeoutMs`, encoder (system lifted from the first message, call-free assistants as strings, consecutive users kept, state parsed strictly with bounded extra fields and checked against the canonical calls by canonical JSON and the content, tool runs grouped, last message user), `readAnthropic` (the body read as SSE whatever its `Content-Type`; nothing but `ping`, `error` and unknown types before `message_start`; a delta applied only when its own field and the start field it extends are strings; the joined text bounded at 2,000,000 characters as it accumulates; reading ended at `message_stop` with the body cancelled; an `error` event's text never in the thrown error), `anthropicOutcome` with the outcome table, state building and `appendOnly`, the encoder's schema and the size cap run on the built state, final answers dropping unknown block types and keeping a text block's known `text_delta` text past an unknown delta, usage, `isAnthropicOverflow`, `anthropicRetryDelayMs` (429 and any 5xx), `anthropicKind`. The state refusal table (spec 5.3) as an exported fixture, driving the encoder test (every row INVALID_INFERENCE_REQUEST) and the outcome test (every row a stream can produce PROVIDER_INVALID_RESPONSE, no completion). Fixtures copied from E-10 (l.198-220, l.269-348, l.388-425, l.85-86) with a capture-match guard; built fixtures marked | `src/main/anthropic.ts`; `tests/anthropic.test.ts` (new); `tests/fixtures/anthropic-state-refusals.ts` (new) | U0 | 1 | (1) The stored state drifts from what was received (an empty block dropped, a start field lost, a delta mis-joined, an input re-keyed), invisible until a live step-2 400: tests pin the exact state JSON for each fixture and a built interleaved stream, and D5 probes it. (2) The reader too strict (pings, unknown events, events without a name, zero-delta blocks rejected) or too lax (a second `signature_delta`, an unknown block replayed, a state the encoder would refuse passed to the engine): each side has its own case, the tool-turn-only refusals are tested against a final answer that must pass, every row of the one state refusal table is tested at the encoder and, where a stream can produce it, through a stream to the outcome, so a shape added to the schema without a row, or a row tested on one side only, shows in review, and a malformed start followed by its delta (a non-string `text`, `thinking` or `signature`, which JavaScript would coerce into `"nullHi"`) is refused in the reader, in a tool turn and in a final answer, before the coerced value can pass the schema check |
| U4 | Main wiring and the profile option: the runtime import of `anthropicKind` and its entry in the kind table; `screenCompletion` (existing tool-call and content rules moved out of `infer()`, plus the state rule; test: a vault secret in `toolCalls` of a step with no state fails with PROVIDER_PROTOCOL_ERROR, red with the moved rule, today `index.ts:105-108`, removed) and its call after `const invoke =`; `profile.test` budget per kind and `retry: false`; the Provider option, default endpoint and hint (single-workspace keys, thinking and the 1M / 128K figures, several minutes per step, the data-use sentence of spec section 7 word for word, pinned whole by the renderer test, not yet checked against the live API; Haiku 4.5 not named); README paragraph (the same, plus "an Ollama reached through this kind is treated as cloud; local-only users use the Ollama kind"; and, only if the D10 verdict kept commit 3, the credentials sentence of spec section 4, which concerns every kind). `complete()`-level Anthropic tests over a fake fetcher (route, exact init with `credentials: 'omit'` only if commit 3 stays, headers, body, two-step state round trip, CONTEXT_LIMIT with the body text absent from the error, spend-cap 429 one fetch, numeric 429 and a 503 retried, the same 503 with `retry: false` one fetch and `PROVIDER_HTTP_503` at once, not aborted at 120 s and aborted at 600 s, fake timers driving `complete()`'s own `setTimeout`; every row of U3's state refusal table, as an assistant tool step's state, refused with INVALID_INFERENCE_REQUEST and no fetch). The brief is written after the D10 verdict and says which credentials assertions and sentences apply | `src/main/inference.ts` (the runtime `import { anthropicKind } from './anthropic'` line and the kind table's `anthropic` entry); `src/main/provider-screen.ts` (new); `src/main/index.ts`; `src/renderer/App.tsx`; `README.md`; `tests/provider-screen.test.ts` (new); `tests/anthropic-transport.test.ts` (new); `tests/workbench.test.tsx` | U2 (and its D10 verdict), U3 | 2 | (1) An edit before `const invoke =` breaks the Phase 1 source pin (`tests/ollama-locality.test.ts:298-323`): every edit after it, the pin test run, plus a new source pin that `screenCompletion` is called after `invoke`. (2) The screen reads the JSON text instead of the leaves, or skips the raw content, and a secret containing `"`, or split across two text blocks, crosses: both cases tested red against such an implementation. (3) The hint overstates data handling ("not retained") or names a model that retires before merge: the renderer test pins the data-use sentence whole and checks both strings are absent |
| U5 | Windows e2e. An Anthropic journey against a loopback fake whose streams are built from E-10 shapes and marked so: save the profile, Test connection, then make the project cloud-allowed through the UI exactly as `e2e/context-recovery.spec.ts:50` does (with the Anthropic profile selected, click "Review cloud access" in the privacy notice, `src/renderer/App.tsx:234`, then "Allow for this project" in the "Allow cloud inference?" dialog, `App.tsx:247`, and expect "Send message" enabled, `context-recovery.spec.ts:51`), then in Ask mode one tool round trip whose first step is a `thinking` block (empty `thinking`, a `signature` that is a marker built for the test from base64-alphabet letters and digits only, so JSON nesting never escapes it; not copied from E-10 l.407, whose example signature is elided with "..."), a `text` block and a `list_files` `tool_use` (`{"path": "."}`), stopping with `tool_use`. The fake asserts Bearer, `anthropic-version`, `/v1/messages`, the test's `max_tokens`, request 2 = request 1 messages + step 1's content array + one tool_result-only user message, and `system`, `tools`, `model`, `max_tokens` and `stream` byte-equal (canonical JSON) between requests 1 and 2 (E-12 l.283: replayed thinking is bound to the system prompt and tools; shown red under a step-dependent suffix on the system message handed to `infer`, applied at the `infer` call because the freeze would hide one made at assembly); after the app is closed a userData byte scan finds the marker nowhere (red with the strip removed). The workbench fake asserts `Authorization`. Only if the D10 verdict kept commit 3 (the brief, written after it, says so): no `cookie` with a cookie planted in the provider session, and none with one planted in the local session | `e2e/anthropic.spec.ts` (new); `e2e/fixtures/anthropic-fake.ts` (new); `e2e/workbench.spec.ts` (one assertion block) | U1, U4 | 3 | (1) Runs only on Windows CI, so each mistake costs a CI round (Phase 1 P1-CI-1): reuse the port-0 fake patterns of `e2e/fixtures/ollama-status.ts` and `e2e/context-recovery.spec.ts` and the userData scan of `e2e/research-collector.spec.ts`, and have the lead read the spec before pushing. (2) A fake that accepts anything proves nothing: every assertion is shown failing in one CI round with its guard removed (`credentials` deleted, when the cookie assertions exist; the state stripped from `current`; the strip removed, for the scan, which a JSON-escaped marker would have left green) or, for the `system` and `tools` equality, under the step-dependent system suffix; the provider session's proxy is not expected to intercept loopback, and the fake asserting that it received the requests shows it. (3) A tool the mode does not offer (E-10's `get_weather`) fails the step as PROVIDER_INVALID_RESPONSE: the built stream names `list_files`, offered in Ask mode (`src/tools/reads.ts:23`) |
| Lead | Integration review of U1-U5 together (spec, breaker in real Electron, invariants, mutation; reviewers read `e2e/`), fixes for every S1 and S2; docs: spec "As built (Phase 2)" and "Recorded for later", ARCHITECTURE paragraph, `docs/development-status.md`, HANDOFF, RUN.md units table, AGENTS.md (the new provider-state invariant row with its Evidence, and the token row's added Evidence, D-2); the gate; draft PR merged under the AGENTS.md checks | docs only | U1-U5 | 4 | (1) The as-built notes drift from the code (Phase 1's S1, MM-P1-SPEC-1): written from the integrated diff and checked by the spec reviewer. (2) README presents probe-only behaviour as verified: each such claim names its day-one item |

## Integration and gate

- Integration order: U0; then U1, U2, U3 in any order (disjoint files); the D10 gate; U4; U5. One
  unit per commit series, cherry-picked onto `main-axuse`, each through the commit gate.
- The D10 gate closes wave 1: U2 records the Electron check's verdict (as-shipped runs only, spec
  section 4) in its unit report, and only then does the lead write the U4 and U5 briefs. Commit 3
  (`credentials: 'omit'`) stays: the briefs include U4's `credentials` assertion, U5's no-cookie
  assertions and the README sentence, and the spec's section 8 line is written. Commit 3 goes: U2's
  branch drops it before integration, the briefs leave all of those out, and INV-5 stays recorded for
  later. The check cannot run at all: commit 3 is not merged, the briefs are written as for "goes", and
  INV-5 stays recorded for later with the reason. A regression that shows only after U4 and U5 have
  landed (the Windows e2e on the exact head) is reverted as the set named in commit 3's report, in one
  commit, so the revert test holds: commit 3 (its ARCHITECTURE.md sentence with it), U4's
  `credentials` assertion, U5's no-cookie assertions, the spec's section 8 line, the README sentence,
  and the spec's "As built (Phase 2)" sentence recording the rule with its known-limit sentence, the
  "Recorded for later" item swapped back to INV-5 (spec section 4, item 6).
- Linux: `npm run typecheck`, `npm run lint`, `npm run build`, and the full vitest JSON run with no
  failure outside the 74 baseline names (`/home/user/task5-handoff/baseline-failing.json`) and no file
  without results.
- Windows CI green on the exact head (unit tests, the 13 existing e2e journeys and the new one).
- Every S1 and S2 fixed and re-reviewed; the PR mergeable with no thread waiting.
