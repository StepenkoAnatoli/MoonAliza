# Builder brief: U8 Windows e2e

Read `briefs/common.md` first, in full; it binds this unit.

- **Your row:** U8 in `BREAKDOWN.md`. It gives the files you own and your pre-mortem.
- **Spec to implement:** `docs/specification/github-sign-in.md` "Tests the builders owe": `e2e/github-sign-in.spec.ts`, plus sections 8, 9 and 10. Journey A runs always. Journey B runs only when `isConfigured(GITHUB_APP)` is true; today it is false, so B must be a visible skip. Reuse the patterns of `e2e/github-reading.spec.ts` and `e2e/anthropic.spec.ts`. Linux cannot prove an e2e: run what you can (typecheck, `npx eslint e2e`, `npx playwright test --list`) and say plainly that the proof is Windows CI on the exact head.
- **Base:** your worktree's branch starts at the integration commit the lead names in your launch prompt. Make each commit there.
- **Done means:**
  - every requirement your BREAKDOWN traceability rows name is built and has its tests;
  - every guard has its removal proof;
  - the full-suite comparison shows no new failure;
  - you have written your report.
