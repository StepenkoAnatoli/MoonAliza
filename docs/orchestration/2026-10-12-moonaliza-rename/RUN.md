# Run: moonaliza-rename

| Field           | Value |
|-----------------|-------|
| Status          | ACTIVE |
| Started         | 2026-10-12 |
| Last checkpoint | 2026-10-12 - builder made the four commits on `build/rename` (`71e8490`, `c5b740c`, `5c0ec78`, then the docs commit) |
| Engagement      | Light (one builder, then independent reviewers; installer naming is user-facing) |
| Working branch  | `main-axuse` (from `main` @ `2fb13ac` plus docs `64864bd`, `6ed7e22`); builder on `build/rename` |
| Base / baseline | pinned Linux gate: 74 known failures (`/home/user/task5-handoff/baseline-failing.json`) |

## Next action
Builder done (four commits on `build/rename`, see Log); next, three refute-first reviewers (completeness
against DECISIONS.md and the scout; tests and lockstep guards with the full suite; packaging and records accuracy); fix
rounds; integrate onto `main-axuse`; pinned gate; PR; Windows CI; merge.

## Task statement
User, 2026-10-12: "MoonAliza appears to be the best choise ... MoonAliza it is". The plan records the rename as its own
pull request after More models Phase 2 merges, changing what users see and keeping the installed app's identity.

## Log
- 2026-10-12: read-only scout (workflow `moonaliza-rename-scout`, 6 agents): 183 files name the old name; 559 lines are in
  historical records; no byte- or hash-pinned recording contains it; the October 4 rename (`e7cdd4a`, `5082167`) changed
  every value back to which this run returns, and falsified some dated records. Report: `reports/scout.json`. Decisions
  R-1..R-14 in `DECISIONS.md`.
- 2026-10-12: builder (`briefs/builder.md`) made the four commits on `build/rename`: `71e8490` source, renderer, tests, e2e, quoted specs and ARCHITECTURE (R-1, R-2, R-3, R-6, R-8); `c5b740c` packaging (R-4); `5c0ec78` test-only identifiers (R-7); and the docs commit that adds this line (R-5, R-9, R-10, R-11, R-12). Linux gate after commits 1 and 3: 1542 tests, 74 failures, all in the baseline, no new failure. Each lockstep group was guard-proven (one side reverted turns tests red) except the bridge messages, whose mocked copies match regexes without the name; the Anthropic fake was driven in Node. Every remaining Moonzila line outside docs/orchestration, docs/research and docs/evidence is a dated record (R-10) or a sentence that names the old name on purpose (decision 14, the README upgrade note, history notes). Not run: Windows CI, e2e, the installer upgrade (R-5).
