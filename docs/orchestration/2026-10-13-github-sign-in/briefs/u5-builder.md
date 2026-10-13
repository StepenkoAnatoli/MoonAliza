# Builder brief: U5 lifecycle service

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U5 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` sections 2 (all), 3.7, 6 (all), 3.4 (you implement `GitHubCredential`), 3.9, and "Tests the builders owe": the ground rules, `tests/github-signin.test.ts` and `tests/github-signin-refresh.test.ts`. You build on U1 (`src/main/github-oauth.ts` and the fake) and U2 (`src/main/github-account-store.ts`), both integrated before you start. Import them; do not change them. If one is wrong, say so.
- **Base:** your worktree's branch starts at the integration commit the lead names in your launch prompt. Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.
