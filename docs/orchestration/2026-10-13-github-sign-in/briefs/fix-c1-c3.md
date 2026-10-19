# Unit fix-c1-c3: the wire's body phase must observe the timeout signal (calibration run 3, C-1..C-3, S3)

Worktree and branch: named in the launch prompt (created by the lead from the integration head at dispatch, recorded in
RUN.md as this unit's base; it is also the base of calibration run 4 stage 4b). Conventions: `briefs/common.md` (commit
identity; the trailer names the model that writes the commit plus the Claude-Session line; the five-part commit report;
`docs/ARCHITECTURE.md` staged with any change under `src/`; never `--no-verify`; no push). The launch prompt names the
host's Node 24 path, the private `TMPDIR` and the full-suite baseline file of the dispatching host (the 74-failure set
is Linux-only; a Windows host gets its own baseline from the lead). Checks: `npm run typecheck`,
`npx eslint src/main/github-oauth.ts tests/github-oauth.test.ts`, `npx vitest run tests/github-oauth.test.ts` (green at
the start; state the count you saw), then `tests/github-token-literals.test.ts` and `tests/github-app-constants.test.ts`.
Difficulty tier: T2 (declared by the lead).

## The finding (adjudicated real; `docs/orchestration/smartrouter/trace/calibration-3/clusters.md`, `adjudication.json`, `lead-notes.md` G-2)

The timeout and the owner's abort exist only as `bounded()`'s `AbortSignal.any([owner, timeout])`
(`src/main/github-oauth.ts:97-99`), which goes into `init.signal` and nowhere else. After the fetcher returns, nothing in
the module observes it:

- C-1: `await reader.read()` in `readBounded` (`:117`, reached from `classify` `:167` and `loginOf` `:217`) and
  `await sent` in `classify` (`:159`) and `loginOf` (`:215`) are not raced against the signal. A fetcher that ignores
  `init.signal` and returns a body that never enqueues (or a promise that never settles) leaves `requestToken`,
  `requestDeviceCode` and `fetchLogin` pending forever; the adjudicators saw `init.signal.aborted === true` at 50 ms and
  all three still pending at 1 s, and the same under an owner abort.
- C-2: every body cancel is awaited with no bound: `:111` (declared oversize), `:124` (`readBounded`'s finally),
  `:176` (`classify`'s finally: 3xx and rate-limited answers), `:216` (`loginOf`'s non-2xx). `ReadableStream.cancel()`
  settles only when the source's cancel does, so a source whose `cancel()` never settles holds back an already-decided
  result (429 rate-limited, 302 unusable, oversize transient, a 401 login null) forever.
- C-3: both together. Also in C-1's claim: a stream of zero-length chunks is never refused by the byte bound, and if
  each chunk is enqueued at once the loop runs on microtasks only, so even a timer could not end it.

What forbids it: 5.3 row 1 ("the timeout fired" gives transient; failed at step 1; null for the login), 5.1 (every
request bounded by `requestTimeoutMs`), L-3 (a refresh "ends only by its response or by its own 20 s timeout"), the
module header (every failure is a result kind) and `fetchLogin`'s doc ("bounded by requestTimeoutMs"). Production
passes `lateFetch` (`globalThis.fetch`), which errors the body on abort and settles its cancels, so the shipped app is
not exposed: S3, reachable through any injected `Fetcher` (`src/main/github-credential.ts`, `(url, init) =>
Promise<Response>`, which does not require honouring `init.signal`).

## The lead's design decision (rejected alternatives are named so you do not re-derive them)

The wire bounds the whole call itself, whatever the fetcher does with `init.signal`. Implement exactly this, all in
`src/main/github-oauth.ts`:

1. One module-private helper that settles with a promise's value, or with a module-private `ABORTED` sentinel once a
   signal aborts: it checks `signal.aborted` synchronously first, passes a rejection through as a rejection (the callers
   already catch), and removes its abort listener when the promise settles (no listener left on a signal per call).
2. Each public function builds `bounded(signal, limits)` once and hands that same signal to the request's `init`, to
   `classify` / `loginOf`, and from them to `readBounded`.
3. `await sent` in `classify` and `loginOf` is raced: `ABORTED` is row 1 (transient; failed at step 1; null for the
   login). A `Response` that arrives after the call ended has its body cancelled when it arrives (not awaited,
   rejection caught), so an abandoned answer is still released.
4. `readBounded`'s `reader.read()` is raced: `ABORTED` returns null (the caller's row 4: transient, failed at step 1,
   null for the login; the same result kinds row 1 gives).
5. Every body cancel is started and never awaited, its rejection still caught: `:111`, `:124`, `:176`, `:216`. In the
   read loop's finally: `reader.cancel()` (unawaited, caught), then `reader.releaseLock()` (cancel closes the stream
   and settles pending reads synchronously, before the source's cancel runs, so the release is valid). A decided result
   returns at once; the doc comments that say "always cancelled and released" stay true and say "never awaited".
6. `readBounded` counts reads: more reads than `maxBytes` is over the bound (null). A body within the bound has at most
   `maxBytes` non-empty chunks, so only zero-length chunks can trip it; a body with a few empty chunks still reads.
7. `docs/ARCHITECTURE.md`: one clause on the U1 line (the wire observes its signal through the fetch and the body read,
   never awaits a body cancel, and bounds reads as well as bytes). The spec amendment is the lead's: propose the 5.1 and
   5.3 row 1 sentences in your report; do not edit `docs/specification/`.

Rejected: (a) one outer race at each public function (alone, when the timeout fires, a call whose 429 was already
decided but held by an awaited cancel returns transient instead of rate-limited: a wrong result kind, not just a late
one; with unawaited cancels added, it ends the call but leaves a stalled read and its stream never cancelled, against
5.1's "always cancelled or released");
(b) racing each cancel against the signal instead of not awaiting it (holds a decided result for up to
`requestTimeoutMs`, 20 s on a refresh, for nothing); (c) a separate cancel timeout (a new limit that neither the spec
nor `WireLimits` has); (d) a contract sentence requiring every `Fetcher` to honour `init.signal` (the type is a frozen U0
contract, the tests inject fetchers, and a sentence ends no stalled stream; 5.3 row 1 and L-3 state outcomes the wire
owes); (e) erroring or teeing the body to wire the signal into it (the wire does not own the stream, and a tee copies
every body and still awaits); (f) yielding to the timer queue every chunk instead of counting reads (timing-dependent
and costs every real body a macrotask per chunk).

Out of scope (the same awaited-cancel or unraced-read pattern elsewhere; the lead records them for the integration
review; do not touch): `src/main/github-signin.ts:228` (6.4's `await sent.body?.cancel()`), `src/main/github.ts:19`,
`:57`, `:59` (the reader, bounded by its run signal only after a read returns), `src/main/inference.ts`,
`src/main/ollama-locality.ts`.

## Tests, red first, with guard-removal proofs

All in `tests/github-oauth.test.ts`, with injected fetchers (the loopback fake cannot produce these bodies: real fetch
honours the signal). Add a small `within(promise, ms)` helper that returns a `PENDING` sentinel, so a red run reports
PENDING instead of hanging the file; no test waits more than about 1 s.

- **Stalled body (C-1):** a fetcher that ignores `init.signal` and returns `200 application/json` whose stream never
  enqueues. Under `quick` (50 ms): `requestToken` gives `{ kind: 'transient' }`, `requestDeviceCode` `{ kind: 'failed' }`,
  `fetchLogin` null, each within the window, and the recorded `init.signal.aborted` is true. Second row: the same stall
  under `limits` (5 s) with the owner aborting at about 20 ms. Red at HEAD: PENDING.
- **A fetch promise that never settles (C-1):** the same three results at the timeout. Then a deferred fetcher whose
  `Response` (a watched body) arrives after the call ended: the call's result is still row 1 and that body is cancelled.
  Red at HEAD.
- **A cancel that never settles (C-2):** a source whose `cancel()` returns a promise that never settles, under `limits`
  (5 s, so the timeout cannot be what ends the call), each settling to its decided result well inside the window:
  429 with `retry-after` gives `rate-limited` with that wait; 302 gives `unusable` 302 (and `failed` at step 1); a
  declared `content-length` over the bound gives transient; a streamed body over the bound gives transient; a 401 to
  `fetchLogin` gives null. Each row also asserts the source's `cancel()` was called. Red at HEAD: PENDING.
- **Zero-length chunks (C-1's aside):** a stream of `maxBodyBytes + 10` empty chunks followed by a valid token answer
  gives transient and is cancelled (red at HEAD: it reads `tokens`; keep it finite so the red run cannot starve the
  worker). Pin, green at HEAD and after: ten empty chunks then a valid answer gives `tokens`.
- Every existing test stays green, the stalled-body and owner-abort tests over the loopback fake included (both
  mechanisms now fire; the result kind is unchanged).

Guard proofs, each a single edit run against its own test and then restored (state the file's sha256 after restoring):
G1 the read race removed (bare `await reader.read()`); G2 the `sent` race removed, and separately the late-`Response`
cancel removed; G3 each of the four cancels awaited again, one site at a time (four proofs, each red on its own row);
G4 the read count removed. Each must turn its test red.

## Pre-mortem (check each and state it in the report)

(a) Dispatch stays synchronous: the fetcher is still called before the first await (`dispatch()` unchanged; the race
starts after), so the service can still send inside `vault.withSecret` (3.8, L-7) and the existing dispatch tests stay
green. (b) The refresh (L-3): read how `src/main/github-signin.ts` calls `requestToken` for a refresh and which owner
signal it passes; say whether anything there changes besides the bound now holding for a non-conforming fetcher.
(c) No unhandled rejection: every unawaited cancel has its `.catch`, and the abandoned `reader.read()` promise is
handled by the race; confirm vitest reports no unhandled error for the file. (d) The listener is removed on every path
(settled, rejected, aborted); say how you checked. (e) No result kind changes for any input the existing tests cover;
an abort during the body read gives the row-1 kinds. (f) No result carries response text or a cause (DC-9); the
existing leak walker tests stay green.

## Report

Write the full report to `docs/orchestration/2026-10-13-github-sign-in/reports/fix-c1-c3-1.md` (Ballast rule) and
return a gist of at most 5 lines plus that path. The file holds: commits (sha and subject), tests [{name, red, green}],
guards (each with its command, the result seen and the restored sha256), checks (each command with its exit and counts,
marked verified), the full-suite comparison against the host's baseline, the pre-mortem answers (a)-(f),
proposedSpecText (5.1 and 5.3 row 1), stoppedAt, mistakes (the six fields, or "nothing to report"), notes. Do not touch
any file outside `src/main/github-oauth.ts`, `tests/github-oauth.test.ts`, `docs/ARCHITECTURE.md` and that report.
