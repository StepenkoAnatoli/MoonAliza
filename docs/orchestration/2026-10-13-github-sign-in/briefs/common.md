# Common brief: GitHub sign-in builders (read this first, in full)

You build one unit of the GitHub sign-in for MoonAliza, an Electron + TypeScript Windows desktop coding agent. The user approved the design on 2026-10-13 ("GO MERGE, read-only, private text like local files"). The GitHub App is not registered yet (UD-1), so `GITHUB_APP` stays empty, the feature reports "not configured", and nothing you build may depend on real identifiers.

## Inputs (the contract)

- **Design:** `docs/specification/github-sign-in.md`. Read sections 1-2 and the sections your unit brief names, plus "Tests the builders owe" for your files and its ground rules (T-1).
- **Your row in the breakdown:** `docs/orchestration/2026-10-13-github-sign-in/BREAKDOWN.md`. It gives the files you own, your dependencies and your pre-mortem. The pre-mortem is the first thing your reviewer checks.
- **Frozen contracts (U0, commit `8f86232`):** `src/main/github-app.ts`, `src/main/github-credential.ts`, `src/shared/github-account.ts`, the five methods in `src/shared/params.ts`, and the vault's `github` purpose. **Do not change them.** If one is wrong, stop at that point and say why in your report; the lead changes contracts.
- **Requirements and decisions:** `REQUIREMENTS.md` and `DECISIONS.md` in the same folder.
- **Research:**
  - `docs/research/2026-10-13-github-sign-in-design/research/` (BRIEF.md, EVIDENCE.md);
  - `docs/research/2026-10-12-app-sign-in/research/`.

  Implement from these; never re-research. If a fact is missing, name it in your report.

## Rules

- **Worktree only.** Work only in your own worktree, on its branch. Touch only the files your unit owns, plus your own sentence in `docs/ARCHITECTURE.md`'s "GitHub sign-in" paragraph. Never touch `/home/user/moonaliza` or another worktree. Never push.
- **Test-first.**
  - A new behaviour test must be red on the unchanged code.
  - A regression pin must be green on the unchanged code, committed before the change, and red under a named mutation.
  - Every guard needs a removal proof: remove the guard the test names, run the test on its own input, see it red, restore, and check the file's sha256.
- **No secrets.**
  - Never commit a token-shaped literal: `gh` plus a letter and `_` with 20+ characters, `github_pat_`, or `sk-` with 16+ characters. Build markers at run time. `tests/github-token-literals.test.ts` checks this.
  - Never write `client` + `_secret` in `src/`; comments write "client secret" with a space.
  - Never copy example token strings from the research captures.
  - Never print, copy or write a real credential.
- **No network.** Tests use injected fetchers or the loopback fake (`tests/fixtures/fake-github-oauth.ts`, owned by U1), never github.com. Do not stub `globalThis.fetch`, except in the single late-binding test the spec names.
- **Fixtures.** Mark them "built from E-01/E-02/E-15 shapes, not a capture".
- **Node 24.** Run `export PATH=/versions/node/v24.21.0/bin:$PATH`. `node_modules` and `.build` are symlinked into your worktree; never commit them. Stage files by name, never with `git add -A`.
- **Commits.**
  - One five-part commit per task (What changed / Why / What it touched / What you verified, each claim marked verified, untested or expected / What you got wrong, "nothing to report" if nothing).
  - Identity: `git -c user.name=StepenkoAnatoli -c user.email=318295322+StepenkoAnatoli@users.noreply.github.com commit`.
  - End every message with the two trailer lines. The `Co-Authored-By` line names the model that writes the commit (lead
    ruling W-4/SW-6, 2026-10-17: the harness's attribution, so a sub-agent's commit says `Claude Opus 5.5`, `Claude Sonnet 5.5`
    or `Claude Haiku 5.5`, and the lead's says `Claude Fable 5.1`); the second line is always the session:

        Co-Authored-By: <the model writing this commit> <noreply@anthropic.com>
        Claude-Session: https://claude.ai/code/session_01VdJ51CTnHT4Zet6eScsBBh

  - No model identifier anywhere else: not in code, comments, docs, test names or PR text.
  - A commit that touches `src/` stages `docs/ARCHITECTURE.md` with your sentence appended to the "GitHub sign-in" paragraph.
  - Never use `--no-verify`.
- **Checks after each commit:**
  - `npm run typecheck` (with `NODE_OPTIONS=--max-old-space-size=2048`);
  - `npm run lint`;
  - `npx eslint e2e`;
  - your test files, one file at a time, with `TMPDIR` set to a private directory;
  - `tests/github-token-literals.test.ts` and `tests/github-app-constants.test.ts`.
- **Full suite.** Run it once at the end:
  - `npx vitest run --reporter=json --outputFile=<json>`;
  - then `python3 /tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/compare.py <json> <worktree>`.

  The baseline is 74 known Linux failures (`/home/user/task5-handoff/baseline-failing.json`), so the run must show no new failure and no file without results.
- **Timing.** Vitest's test timeout is 15 s and its hook timeout 10 s. Shrink limits through the injected seams, never by real waiting.
- **Careful coding.** Read the code you change and its callers before changing it. Verify instead of assume. Report mistakes plainly.

## Report (your final answer)

- Commits: sha and subject.
- For every test: its red-first proof or its pin's mutation, and every guard-removal proof, each with the command and the result seen.
- The checks you ran and their results, and the full-suite comparison.
- Anything in the design or contracts you judged wrong: where you stopped and why.
- What you got wrong.
