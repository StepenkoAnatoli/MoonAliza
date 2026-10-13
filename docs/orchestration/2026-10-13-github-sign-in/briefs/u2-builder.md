# Builder brief: U2 account store

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U2 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` sections 3.6, 4 (all), 6.7 (sign-out, for `clear`), and "Tests the builders owe": the ground rules and `tests/github-account-store.test.ts`. Read `src/main/vault.ts`, `src/main/collector-settings.ts` and `src/models/artifact-files.ts` (`serialized`) before you write.
- **Base:** your worktree's branch starts at `8f86232` (U0). Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.
