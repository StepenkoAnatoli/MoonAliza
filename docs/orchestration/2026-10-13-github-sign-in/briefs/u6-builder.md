# Builder brief: U6 main wiring

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U6 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` sections 9, 10, 3.3, 3.9, and "Tests the builders owe": `tests/github-main-wiring.test.ts` and `tests/github-reason-scan.test.ts`. You own `src/main/index.ts`. Read the three existing source-pin test files (`tests/ollama-locality.test.ts`, `tests/anthropic-transport.test.ts`, `tests/provider-transport.test.ts`) and keep their pinned spans intact. Run all three after each change.
- **Base:** your worktree's branch starts at the integration commit the lead names in your launch prompt. Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.

## As built by U5 (read before you start; the code is the record where it departs from the spec's pseudo-code)

- `GitHubSignIn` (`src/main/github-signin.ts`) is constructed exactly as spec section 9 shows; `GitHubSignInDeps` also takes an optional `monotonic?(): number` (default `performance.now()`), on which every hold is timed (U5-R13). The wiring in `src/main/index.ts` passes nothing for it; tests that time a hold inject a reading that only `step()` leaves alone (see the clocks in `tests/github-signin-refresh.test.ts` and `tests/github-signin.test.ts`).
- `renew()` has no `generation === g0` clauses: the live-account check after the answer is the one guard against a late refresh answer (U5-R12, U5-R14); `adopt()` keeps its admit under the store lock. The same-error reset runs right after that check and before the `tokens` branch (U5-R16).
- A read that starts after an app clear is a signed-out read (`request(undefined)` once); `send()` after `close()` throws `GITHUB_RENEWAL_UNAVAILABLE`; `close()` also waits for a commit point being stored within `quitWaitMs` (U5 build notes, U5-R9).
- The spec's "As built" wave-2 entries (written by the lead at U5's integration) are the authority for anything else; do not re-derive behaviour from sections 2 and 6 where they differ.
- Dispatch note: this unit was routed by the SmartRouter host adapter (`docs/orchestration/smartrouter/`); the Brief object in your launch prompt is the machine-readable form of this brief and names your acceptance checks, allowance and stop triggers. The Brief never widens what this file allows.
