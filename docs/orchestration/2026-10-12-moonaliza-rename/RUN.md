# Run: moonaliza-rename

| Field           | Value |
|-----------------|-------|
| Status          | ACTIVE |
| Started         | 2026-10-12 |
| Last checkpoint | 2026-10-12 - scout done, decisions and builder brief written |
| Engagement      | Light (one builder, then independent reviewers; installer naming is user-facing) |
| Working branch  | `main-axuse` (from `main` @ `2fb13ac` plus docs `64864bd`, `6ed7e22`); builder on `build/rename` |
| Base / baseline | pinned Linux gate: 74 known failures (`/home/user/task5-handoff/baseline-failing.json`) |

## Next action
Builder (`briefs/builder.md`) makes the four commits on `build/rename`; then three refute-first reviewers (completeness
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
