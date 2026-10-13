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
