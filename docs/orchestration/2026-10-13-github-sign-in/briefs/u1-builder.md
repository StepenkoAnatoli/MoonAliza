# Builder brief: U1 wire client

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U1 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` sections 3.5, 5 (all), 3.9 layer 1, and "Tests the builders owe": the ground rules and `tests/github-oauth.test.ts`. The fake (`tests/fixtures/fake-github-oauth.ts`) is yours: build it as the spec describes, because U5 and U7 import it read-only.
- **Base:** your worktree's branch starts at `8f86232` (U0). Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.
