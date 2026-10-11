# Phase 1 common rules (every builder and reviewer)

- Repository: Moonzila (`StepenkoAnatoli/MoonAliza`), an Electron/TypeScript desktop coding agent.
  Read `AGENTS.md` (invariants, quality gate) and `docs/specification/more-models.md` (Phase 1
  design) before anything else. Requirements: `docs/orchestration/2026-10-05-more-models/REQUIREMENTS-P1.md`.
- Node: `export PATH=/versions/node/v24.21.0/bin:$PATH`. Checks: `npm run typecheck`, `npm run lint`,
  `npx vitest run <files>`. The full Linux suite has 74 known failures (Windows-only native helper
  tests: managed-ollama, owned-transport, owned-connection, hardware, scheduler, research-kit and
  others; list in `/home/user/task5-handoff/baseline-failing.json`); a failure outside that set is yours.
- Work only in your worktree and only on the files your brief owns. Do not push. Commit to your own
  branch only, as yourself: `git -c user.name=StepenkoAnatoli -c user.email=318295322+StepenkoAnatoli@users.noreply.github.com commit`.
  The commit message is the repository's five-part report (what changed, why, what it touched, what
  you verified with verified/untested/expected, what you got wrong; AGENTS.md standing protocol rule 2),
  ending with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01VdJ51CTnHT4Zet6eScsBBh`.
  A commit that touches `src/` must stage `docs/ARCHITECTURE.md` with a sentence about your change
  (the commit gate refuses it otherwise); write only in the paragraph your brief names.
  Never use `--no-verify`.
- Test-first: write each test, run it red against the unchanged code, then make the change. For every
  new test, prove the guard: remove the one guard it names, run it, see it fail, restore. Record each
  proof (command and observed result) in your report.
- Fixtures come from the captured pages, copied, never invented. The corpus is
  `docs/research/2026-10-05-provider-wire-formats/research/raw/`; the evidence rows are in its
  `EVIDENCE.md`. Cite the E-row in a comment next to each fixture.
- No network: tests use local fakes (see existing tests for the patterns). No real vendor is called.
- Your final answer is your report: what changed (files), each test and its guard proof, the commands
  you ran with their results, any deviation from the spec and why, risks you see, and your commit id
  (from `git log`, never from memory).
