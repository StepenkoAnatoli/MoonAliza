# Managed inference scheduler implementation plan

**Goal:** implement the D4 FIFO ownership boundary used by managed inference and D2 activation, without claiming local model qualification or UI integration.

**Architecture:** one process-owned scheduler admits one inference holder at a time. Opaque epoch/generation tokens bind host operations to the live holder. Cancellation, expiry and completion first revoke that holder, then await a bounded, trusted runtime-stop acknowledgement before another holder is admitted. An unconfirmed stop faults the scheduler and rejects queued work. Maintenance closes new inference admission immediately, waits behind already queued work, confirms runtime stop, and holds admission closed until the maintenance callback settles.

**Tech stack:** existing TypeScript/Node, AbortController, native Windows Job Object helper, Vitest. No new dependencies or network API changes.

**Spec:** `docs/specification/source-plan.md`, D4, and `docs/specification/managed-artifacts.md`. This follows the existing approved full implementation plan and user direction to continue; it does not introduce a new approval gate.

## Constraints and interfaces

- `src/engine/scheduler.ts`: `LeaseFence` creates identity-bound tokens and rejects stale or stopping holders. `InferenceScheduler.run(task, {signal?, queueTimeoutMs?, leaseTimeoutMs?, heartbeatTimeoutMs?})` passes a lease with token, signal, assertCurrent and heartbeat. Completion waits for cleanup. Timers use relative process timeouts, not persisted wall-clock expiry.
- Constructor requires `stopRuntime(reason): Promise<void>`. This trusted owner callback must resolve only after owned runtime termination is confirmed. Reject/timeout permanently fences this scheduler; a caller cannot clear it by declaring itself finished.
- `withRuntimeStopped(task, signal?)` supplies the existing ActivationStore ownership callback. Cancellation of maintenance holds the gate until the callback settles, since a JavaScript timeout cannot revoke filesystem effects. No heartbeat applies to maintenance; the operation supplies its own bounded work and cancellation.
- Queue length and timing options are validated/bounded. Queued cancellation removes work without calling its task. Shutdown closes admission, cancels queued and active inference, and waits for confirmed cleanup or reports failure. It waits for an active maintenance callback to settle.
- Every brokered effect must call the lease's `assertCurrent`; an arbitrary callback is not a filesystem sandbox. Late callback results and failures are consumed, never delivered as successful current work.
- Completion stops the owned runtime for now. Retaining a warm model requires a separately verified unload protocol before reusing capacity; no optimistic reuse.

## Tasks

- [x] Add behavioral tests and run them red: FIFO exclusion, stale/foreign token rejection, bounded queue, queued cancellation/expiry, delayed active cancellation cleanup, late result fencing, heartbeat and lease expiry, cleanup failure/timeout, maintenance serialization and cancellation, shutdown.
- [x] Implement the scheduler and rerun the targeted tests. Keep runtime control behind the main-owned callback and all state transitions inside the scheduler.
- [x] Add/run a Windows integration test using the actual native helper: an owned child must exit before a queued job begins. No unrelated process or user-owned Ollama service is controlled.
- [x] Connect an ActivationStore test to the actual scheduler maintenance callback and prove a held inference lease prevents activation effects and new inference admission.
- [x] Typecheck, lint, full test suite with durable JSON report, build. Record measured scope and outstanding production managed-provider, qualification and UI work.

Verification: 23 scheduler tests and 10 activation tests passed, followed by all 286 tests in 25 files (50.08 seconds), typecheck, lint and build. The repeatable real Ollama verifier passed in 99.56 seconds and confirmed that a queued second lease starts only after the prior runtime stops and releases its port. It removed the temporary runtime. No model inference or coding qualification was performed. Timer-delay regressions were seen failing before adding monotonic checks at admission, heartbeat/assertion, completion and cleanup; absent-token and normal-completion signal-revocation regressions were likewise red before their fixes.

Broader D4 still requires a production managed Ollama provider, verified owned-port/backend identity on every admitted runtime, explicit context/output/model lifecycle options, and main/engine integration. D3 real model quality evidence remains separate and must not be fabricated from scheduler fixtures.
