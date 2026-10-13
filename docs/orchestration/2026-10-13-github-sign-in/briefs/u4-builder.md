# Builder brief: U4 renderer

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U4 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` sections 8 (all), 2.3 (the projection, for what each state means), 3.2, 3.3, and "Tests the builders owe": the ground rules and `tests/github-account-panel.test.tsx`. The main process is not wired yet (U6), so build against a fake `AppApi` in tests. Also run `tests/workbench.test.tsx` to check that your new button names do not collide with existing locators.
- **Base:** your worktree's branch starts at `8f86232` (U0). Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.
