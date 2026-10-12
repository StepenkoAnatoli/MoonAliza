# Builder brief: the MoonAliza rename

You build the rename described in `docs/orchestration/2026-10-12-moonaliza-rename/DECISIONS.md` (read it first, in full;
it is the contract), in the worktree `/home/user/task5-handoff/wt/rename` on branch `build/rename`. Do not touch
`/home/user/moonaliza` or any other worktree. Do not push.

## Inputs

- `DECISIONS.md` (R-1..R-14 and the four-commit split).
- `reports/scout.json`: every occurrence, classified, with file, lines, text, proposed change and the tests that pin it.
  Its critic section lists coupled sets, missed occurrences and disagreements; DECISIONS.md settles them.
- `git show e7cdd4a` and `git show 5082167`: the October 4 rename. For anything they changed, the value before `e7cdd4a`
  is the value to restore (R-3, R-4, R-7, R-11). Text added after October 4 that names the product is renamed by the rules.

## Rules

- Never a blind replace. Edit by file and line, guided by the scout and the two commits. Never touch
  docs/orchestration/** (except this run's own folder), docs/research/**, or docs/evidence/** other than
  `docs/evidence/model-store-runtime.json`'s lines that `e7cdd4a`/`5082167` changed (R-11). Never touch
  `tests/fixtures/anthropic-live/**`, research-kit zips, golden files or any sha256-pinned data.
- Keep: `app.setName('MoonAliza')`, `appId: com.moonaliza.desktop`, partitions, IPC names, `MoonAlizaHost.exe`, model-store
  and receipt identity strings, `MOONZILA_ANTHROPIC_API_KEY`, dated user-request sentences and dated decisions (R-10).
- Spelling: exactly `MoonAliza` (capital A); lowercase identifiers `moonaliza`; upper-case `MOONALIZA`.
- Four commits in the order of DECISIONS.md's "Commits". Each must pass on its own: after each commit run
  `npm run typecheck`, `npm run lint`, `npx eslint e2e`, and the test files that commit touches; after commit 1 and after
  commit 3 run the full `npx vitest run` and compare failing test names with
  `/home/user/task5-handoff/baseline-failing.json` (74 known failures; use
  `python3 /tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/compare.py <json> <root>`
  with `npx vitest run --reporter=json --outputFile=<json>`): no new failure. Use Node 24
  (`export PATH=/versions/node/v24.21.0/bin:$PATH`). `node_modules` and `.build` can be symlinked from
  `/home/user/moonaliza` (no self-referencing links).
- The commit gate: a commit touching `src/` or `scripts/` stages `docs/ARCHITECTURE.md` (update its rename sentence at
  about line 46, which today understates what the October 4 rename changed). Never `--no-verify`.
- Identity: `git -c user.name=StepenkoAnatoli -c user.email=318295322+StepenkoAnatoli@users.noreply.github.com commit`.
  Each message carries the five-part report (What changed, Why, What it touched, What you verified - each claim
  verified/untested/expected -, What you got wrong, "nothing to report" if nothing), and ends with:

      Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
      Claude-Session: https://claude.ai/code/session_01VdJ51CTnHT4Zet6eScsBBh

  No model identifiers anywhere else.
- Guard proofs: for each lockstep group, show that leaving one side unchanged turns a test red (for example: rename the
  composer label but not tests/workbench.test.tsx -> red; rename the Ask-mode prompt but not anthropic-fake.ts -> the e2e
  fake's check would refuse, shown by reading its check, since e2e needs Windows; productName without check-fuses.test.ts
  -> red). Restore after each proof.
- At the end: `git -C <worktree> grep -n -I -i moonzila -- . ':!docs/orchestration' ':!docs/research' ':!docs/evidence'`
  and account for every remaining line (each must be an R-10 keep); list them in your report.

## Report

Commits (sha and subject), the commands run with their results, the guard proofs, the remaining-occurrence list with the
R-number that keeps each, anything in DECISIONS.md you could not apply or think is wrong (do not silently deviate: if a
decision is wrong, stop at that item, say why, and continue with the rest), and what you got wrong.
