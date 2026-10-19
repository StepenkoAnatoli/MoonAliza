Draft: this PR builds the GitHub sign-in that the user approved on 2026-10-13. The design is `docs/specification/github-sign-in.md` (merged in #46).

How it works:
- It uses the device flow with a read-only scope.
- Tokens exist only in the app's vault.

The GitHub App is not registered yet (UD-1), so `GITHUB_APP` is empty and the feature reports "not configured". Nothing goes to github.com until U9 adds the constants.

## What is in it

| Unit | Files | State |
|---|---|---|
| U0 contracts | `src/main/github-app.ts`, `src/main/github-credential.ts`, `src/shared/github-account.ts`, `src/shared/params.ts`, vault purpose | frozen; red-first, 8 guard proofs |
| U1 wire client | `src/main/github-oauth.ts` | integrated after 4 review rounds; U1-R11 fixed by the lead |
| U2 account store | `src/main/github-account-store.ts` | integrated after 4 review rounds; U2-R15 pins ported by the lead |
| U3 reader and reasons | `src/main/github.ts`, `src/shared/github.ts`, `src/engine/application.ts` (3 lines) | ACCEPT |
| U4 renderer | `src/renderer/GitHubAccountPanel.tsx`, `src/renderer/github-text.ts`, `App.tsx`, `styles.css` | ACCEPT |
| U5 lifecycle service | `src/main/github-signin.ts` | ACCEPT after 4 rounds; one S4 open (U5-R18) |
| U6 main wiring | `src/main/index.ts` | ACCEPT; one S4 deferred (U6-R2) |
| U7 token invariant | `tests/github-signin-invariants.test.ts` | integrated; the lead fixed R17 and R18 after the two-round cap; R19 is a known limit |
| X2-1, X2-2 | startup reconcile; `src/main/vault.ts` staging | ACCEPT after their own fix rounds |

How each unit was built and reviewed:
- Each unit was reviewed refute-first.
- Every new test was red before its fix and has a guard-removal proof.
- The run ledger is `docs/orchestration/2026-10-13-github-sign-in/RUN.md`.

The branch also carries docs and tooling, but no app code:
- the run folder;
- the sub-agent dispatch adapter under `docs/orchestration/smartrouter/`, with its policy, ledger and calibration evidence.

## Not done yet (why this is a draft)

- U8: the Windows e2e (`e2e/github-sign-in.spec.ts`) has not been built.
- fix-c1-c3: the wire's body phase does not observe the timeout signal. This is S3, reachable only through an injected fetcher; the production `fetch` is not exposed. The brief is ready (`briefs/fix-c1-c3.md`).
- Still to come:
  - the re-verification of the U5 extra findings (T1-T8);
  - the integration review (spec, invariants, mutation, breaker);
  - the integration fix round (including the U5-R18 pin);
  - the docs unit.
- U9 (the constants) waits on UD-1.
- Auto-build Stages 6-9 (harden, audit, deliver, validate).

Merge rule (`AGENTS.md`):
- every S1 and S2 is fixed and re-reviewed;
- the Linux gate equals the 74-failure baseline;
- Windows CI is green on the exact head;
- no review thread is open.

## Validation so far

- Linux pinned gate on `683e9cd` (after wave 2): typecheck, lint and build exit 0. 2138 tests ran, and the 74 failures are exactly the baseline set.
- U6, U7, X2-1 and X2-2 landed after that gate. Each unit's own test files are green on the integration head. No full gate has run since `683e9cd`.
- This PR's Windows CI run is the first full Windows run of the integration head.

## Remaining limits and risks

- The app ships unconfigured until UD-1 is answered.
- C-1..C-3 stay open until fix-c1-c3 lands.
- The same awaited-cancel pattern at `src/main/github-signin.ts:228` and `src/main/github.ts:19,57,59` has not been judged yet. The integration review covers it.
- U7-R19 is a known limit of the invariant suite.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
