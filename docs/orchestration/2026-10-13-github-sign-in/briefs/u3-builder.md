# Builder brief: U3 reader, reasons and model text

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U3 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` sections 7 (all), 3.4, 3.9, 11, and "Tests the builders owe": the ground rules, `tests/github-read.test.ts` and `tests/github-text.test.ts`. Commit order is fixed by your BREAKDOWN row: 1) the pins, tests only, green on the unchanged code; 2) the seam, the classification, the reasons and the texts; 3) the pre-redaction (X-3), which must revert alone. You own only lines 68, 375 and 376 of `src/engine/application.ts`.
- **Base:** your worktree's branch starts at `8f86232` (U0). Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.
