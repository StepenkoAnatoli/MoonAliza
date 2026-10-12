# Phase 2 common rules (every builder and reviewer)

- Repository: Moonzila (`StepenkoAnatoli/MoonAliza`), an Electron/TypeScript desktop coding agent.
  Read `AGENTS.md` (invariants, quality gate) and `docs/specification/more-models-phase2.md` (the Phase 2
  design) before anything else. Requirements: `docs/orchestration/2026-10-05-more-models/REQUIREMENTS-P2.md`.
  Units, owned files and pre-mortems: `BREAKDOWN-P2.md` in the same folder; your unit's row there is
  authoritative for scope. Decisions and their set-aside alternatives: `DECISIONS-P2.md`. Probe-only facts:
  `DAY-ONE-P2.md`.
- U0 (the frozen contracts) is commit `28395c5`: `ProviderStateSchema`, `PROVIDER_STATE_MAX`,
  `PROVIDER_STATE_FORMATS` (`src/engine/control.ts`), the `providerState` fields, `inferenceErrorCode`
  passing PROVIDER_PROTOCOL_ERROR and its doc comment (already updated), `complete()`'s `retry?: boolean`
  option type (`src/main/inference.ts`), `KindPart` (`src/main/provider-kind.ts`), the Anthropic skeleton
  (`src/main/anthropic.ts`), and the engine's strip and carry (`src/engine/application.ts`). Do not change a
  frozen signature; if one is wrong, stop and report it.
- Node: `export PATH=/versions/node/v24.21.0/bin:$PATH`. Checks: `npm run typecheck`, `npm run lint`,
  `npx vitest run <files>`. The full Linux suite has 74 known failures (Windows-only native helper tests;
  list in `/home/user/task5-handoff/baseline-failing.json`); a failure outside that set is yours. `e2e/`
  runs only on Windows CI (Phase 1's P1-CI-1 was six e2e failures nobody had read).
- Work only in your worktree and only on the files your unit owns. Do not push. Commit to your own branch
  only, as yourself: `git -c user.name=StepenkoAnatoli -c user.email=318295322+StepenkoAnatoli@users.noreply.github.com commit`.
  One commit per task (the revert test); the message is the repository's five-part report (what changed,
  why, what it touched, what you verified with verified/untested/expected, what you got wrong; AGENTS.md
  standing protocol rule 2), ending with:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01VdJ51CTnHT4Zet6eScsBBh`.
  A commit that touches `src/` must stage `docs/ARCHITECTURE.md` with a sentence about your change, appended
  to the paragraph that begins "More models, Phase 2" (the commit gate refuses it otherwise). Never use
  `--no-verify`.
- Test-first (REQUIREMENTS-P2 T-1): a new behaviour test is written and seen red against the unchanged
  code, then the change; a regression pin or snapshot is committed before the change it guards, passes on
  the unchanged code and is shown red under a named mutation. For every test, prove its guard: remove the
  one guard it names (or apply the named mutation), run it, see it fail, restore. Record each proof
  (command and observed result) in your report.
- Fixtures: unit-test fixtures copied verbatim from a capture name their E-row and lines in a comment and
  are checked against the capture (as `tests/provider-stream.test.ts` does); every built stream is marked
  "built from E-10 shapes, not a capture". The wire corpus is
  `docs/research/2026-10-05-provider-wire-formats/research/raw/` with rows in its `EVIDENCE.md`.
- No network: tests use local fakes. No real vendor is called and nothing is collected.
- Your final answer is your report: the commits (ids from `git log`, never from memory), files changed,
  each requirement row you satisfied with the test that proves it, each test with its guard proof, the
  commands you ran with their results, any deviation from the spec and why, risks you see, and what you
  got wrong.
