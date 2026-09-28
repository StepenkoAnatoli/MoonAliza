# MoonAliza managed runtime scheduler — 27 September 2026

The managed inference scheduler core is implemented and verified. It provides the ownership boundary that the local-model provider and installation flow will use. The installed app remains **0.5.0** with its working Hugging Face profile; these new backend components are not yet connected to the installed setup screen.

## What changed

- A bounded FIFO queue admits one inference job at a time.
- Cancelling a queued job removes it before it runs.
- Stop and timeouts immediately revoke the active job's authority, then wait for confirmed runtime cleanup before admitting another job.
- Unknown or overdue cleanup keeps admission closed instead of assuming the old runtime is gone.
- Heartbeats cannot extend the hard job deadline. Monotonic elapsed checks prevent delayed timer callbacks from admitting expired work or publishing late success.
- Installation takes an exclusive maintenance gate. New inference stays closed while it changes model/runtime files, including while a cancelled filesystem operation is still settling.
- Shutdown closes admission, cancels queued work and waits for owned cleanup.

For now, completion stops the owned runtime before the next lease; retaining a warm model needs a separately verified unload protocol. This is a correctness boundary, not a local-inference performance claim.

## Verification

**286 tests passed across 25 files**, with no failures or pending tests, in **50.08 seconds**. TypeScript checking, lint and build also passed. The additions are 23 scheduler tests and one activation/scheduler integration test.

The real native Windows helper test confirmed that both an owned child and grandchild had exited before a queued holder began. The actual artifact activation test confirmed that no download effects occurred while inference held the maintenance gate.

The real **Ollama 0.34.4** developer verifier passed in **99.56 seconds**. It rehashed and extracted the pinned archive, verified its Ollama Inc. signature and supervised port ancestry, then queued a follow-up lease during startup. That second lease began after confirmed runtime Stop and successfully bound the released port. The verifier removed its temporary runtime, home and model directories.

The version endpoint became ready after **15.21 seconds**. This is executable startup time. **No model inference or coding-quality qualification was performed.**

[Detailed runtime evidence](MoonAliza-scheduler-runtime-verification.json) retains file identities, stop results and `schedulerFollowupAfterStop: true`. The repeatable producer is `node --import tsx scripts/check-runtime-artifacts.ts` from the repository. Ordinary tests/builds do not download or launch Ollama.

An exact-value scan of 113 non-ignored repository files found neither the supplied Hugging Face nor GitHub credential. No new installer, commit, push or public release was produced.

## Next integration

Connect the scheduler and verified artifact store to the production managed Ollama provider, with owned-port and observed-backend checks, then complete real model qualification and the setup UI. Production catalogue signing inputs, retained quality evidence, reference-aware removal and storage relocation remain part of the full project.
