# Run: moonaliza-rename

| Field           | Value |
|-----------------|-------|
| Status          | COMPLETE |
| Started         | 2026-10-12 |
| Last checkpoint | 2026-10-12 - MERGED (PR #41, `b5ce566`) |
| Engagement      | Light (one builder, then independent reviewers; installer naming is user-facing) |
| Working branch  | `main-axuse` (from `main` @ `2fb13ac` plus docs `64864bd`, `6ed7e22`); builder on `build/rename` |
| Base / baseline | pinned Linux gate: 74 known failures (`/home/user/task5-handoff/baseline-failing.json`) |

## Next action
None: the run is complete. Follow-ups recorded in DECISIONS.md and the PR: a guard for the bridge messages' test copies; tests for the window title, folder-free prompt, User-Agents, serviceName and productName agreement; the installer upgrade on Windows.

## Task statement
User, 2026-10-12: "MoonAliza appears to be the best choise ... MoonAliza it is". The plan records the rename as its own
pull request after More models Phase 2 merges, changing what users see and keeping the installed app's identity.

## Log
- 2026-10-12: read-only scout (workflow `moonaliza-rename-scout`, 6 agents): 183 files name the old name; 559 lines are in
  historical records; no byte- or hash-pinned recording contains it; the October 4 rename (`e7cdd4a`, `5082167`) changed
  every value back to which this run returns, and falsified some dated records. Report: `reports/scout.json`. Decisions
  R-1..R-14 in `DECISIONS.md`.
- 2026-10-12: builder (`briefs/builder.md`) made the four commits on `build/rename`: `71e8490` source, renderer, tests, e2e, quoted specs and ARCHITECTURE (R-1, R-2, R-3, R-6, R-8); `c5b740c` packaging (R-4); `5c0ec78` test-only identifiers (R-7); and the docs commit that adds this line (R-5, R-9, R-10, R-11, R-12). Linux gate after commits 1 and 3: 1542 tests, 74 failures, all in the baseline, no new failure. Each lockstep group was guard-proven (one side reverted turns tests red) except the bridge messages, whose mocked copies match regexes without the name; the Anthropic fake was driven in Node. Every remaining Moonzila line outside docs/orchestration, docs/research and docs/evidence is a dated record (R-10) or a sentence that names the old name on purpose (decision 14, the README upgrade note, history notes). Not run: Windows CI, e2e, the installer upgrade (R-5).
- 2026-10-12: build and review (workflow `moonaliza-rename-build`, 6 agents, `reports/build-review.json`). Builder: four
  commits on `build/rename` - `71e8490` app (UI, prompts, User-Agents, serviceName, comments, composer selectors),
  `c5b740c` packaging (productName, package name and author back to the released values), `5c0ec78` test-only identifiers
  and test data, `999e26c` docs (current docs, falsified records restored from `e7cdd4a^`, decision 14, upgrade note).
  Each commit: typecheck, lint, eslint e2e and check-handoff 0; full suite after commits 1 and 3: 1542 tests, 74 failed,
  exactly the baseline; each commit reverts without conflict; guard proofs for every lockstep group (the bridge-message
  copies have no guard: disclosed, recorded for later). Reviewers (completeness, tests and lockstep, packaging and
  records): ACCEPT, ACCEPT, FIX - two S2 and one S3 in the README upgrade note (stated as fact what the NSIS templates
  only imply; said uninstalling first avoids pin breakage; omitted the orphaned updater cache). Fixed in `5ed9b89`;
  re-review ACCEPT with the full suite at the baseline. The lead took the remaining S4 notes in `ee90acf` (dates of the
  Moonzila period, the Monnzila builds, HANDOFF's identifiers sentence, the check-fuses sentence, R-5). Kept as judged:
  the ARCHITECTURE rename paragraph is written in commit 1 and describes the whole series (the commit gate requires the
  map in that commit), and the plan's October 4 request bullets stay as dated records (R-10). Remaining occurrences of the
  old name outside dated folders: 20 lines, each a dated record or a deliberate history sentence.
- 2026-10-12: the user renamed the GitHub repository back to MoonAliza (`555d067` records it). Pinned Linux gate on `8c96e17` and on `555d067`: typecheck, lint, build 0; 1542 tests, 74 failed, exactly the baseline. Windows CI green on `6632d98`, `8c96e17` and `555d067` (push and pull_request runs). The user marked PR #41 ready; merged with method merge at the pinned head: merge commit `b5ce566` (parents `2fb13ac`, `555d067`; same tree as `555d067`). `main-axuse` fast-forwarded; `build/rename` and its worktrees removed (every commit in `main`).
