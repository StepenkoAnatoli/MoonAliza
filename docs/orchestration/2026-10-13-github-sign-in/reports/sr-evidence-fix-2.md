# sr-evidence fix round 2: review findings N1-N3 (the calibration evidence check and the qualification table)

Builder: claude-opus-5-5. Worktree `/home/user/task5-handoff/wt/sr-evidence`, branch `tools/calibration-evidence-check`.
Three commits on top of `0fe67a7`, one per finding, not pushed. This report file is not committed. Contract:
`smartrouter/briefs/evidence-check-builder.md` (C1-C6). Findings: the lead's fix-round-2 list (N1 S2, N2 S3, N3 S4).

## Gist

- N1 (S2) fixed in `f5d0be3`. A legacy run whose review rule is run 1's or run 2's (the grader's falseBlocking) and that also declares an `adjudication_schema` with `adjudication.json` now fails `scores-derivable`. Only run 3's adjudicated rule may rest a review grade on a record. The reviewer's folder exits 1, and the table refuses it.
- N2 (S3) fixed in `4dfcaa7`. Two folders with one `run_id`, or with one host and run number, each fail `protocol-frozen`, naming the other. This is a new cross-folder step, `check_folders`, which the check's and the table's `main()` both use. Two copies of run 2 exit 1, and the table writes nothing.
- N3 (S4) fixed in `6918e3d`. The table reads `void_cells` only as an object. The shape sweep now tries 7, true and null in place of every swept object and list. The wider sweep also reached three net catches in the check (`cases` and `amendments` not lists), and those are now named guards.
- Every fix was red first against the commit before it, and every new guard has a removal proof measured on its commit. The suites run 50 and 20 tests, OK. The real folders still give 0 failures and the same 14 LIMIT lines, and the committed table is unchanged. The gate passed through the pre-commit hook on all three commits.
- No finding was rejected. Two commit messages were amended once each, before the next commit, to correct proof counts (see "What I got wrong").

## Commits

| sha | finding | subject |
|---|---|---|
| `f5d0be3` | N1 | check_calibration_evidence.py refuses a legacy run whose review rule does not apply the adjudication record it declares |
| `4dfcaa7` | N2 | check_calibration_evidence.py refuses one run held in two folders, so the table never counts a run twice |
| `6918e3d` | N3 | qualification_table.py reads void_cells only as an object, and the shape sweep tries numbers, booleans and null |

Every subject starts `tools: <id> - `.

- **Identity:** `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`.
- **Message format:** each message carries the five named parts and the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines.
- **Hook:** no `--no-verify`. The pre-commit hook ran `tools/run_regression.py` on each commit and on each amend, and reported `REGRESSION GATE: all checks PASS`.
- **Amends:** `f5d0be3` (first `42bab0a`) and `4dfcaa7` (first `7072c92`) were each amended once, before any later commit, to correct proof counts in their own messages.

## Files

All five files are inside the brief's permitted paths:

- `tools/check_calibration_evidence.py` (N1, N2, N3)
- `tools/test_check_calibration_evidence.py` (N1, N2, N3)
- `tools/qualification_table.py` (N2, N3)
- `tools/test_qualification_table.py` (N2, N3)
- `docs/evidence/README.md` (N1, N2, N3: one table cell or sentence each)

`git diff --name-only 0fe67a7..HEAD` lists only those five. `docs/evidence/qualification-table.md` is unchanged. No evidence folder, kit file, adapter file or skill changed (C6).

## N1 (S2): run 1's or 2's review rule resting on a declared adjudication record

- **Reproduced** at `0fe67a7`, in a scratch copy built like the reviewer's `mk_p1.py`. Run 2 got:
  - a three-prong `adjudication_schema` with `missing_prong: []`;
  - an `adjudication.json` whose C-9 lenses all read holds false and reachable no;
  - an S2 other in C-9 on sonnet-high.

  The check gave `1 folder(s), 0 failure(s), 3 limitation(s)`, exit 0. The table row read `| sonnet-high | ... | review | ... | PASS | 1 of 1 | run 2: schema 1, holds+reachable+forbidden | - |`.
- **Fix:**
  - `_review()` marks each review rule `adjudicated` when its false-blocking count is `_adjudicated_false_blocking` (run 3's).
  - `legacy_scores()` fails `scores-derivable` when `legacy_prongs` returned prongs (a valid schema plus `adjudication.json`) and the review case is scored under an unadjudicated rule: "legacy run: scores.json declares an adjudication_schema, yet the review pass rule (sha256 <12>) counts the grader's falseBlocking and does not apply the adjudication record; only run 3's adjudicated rule rests a review grade on one".
- **Test:** `LegacyRuns.test_a_review_rule_that_ignores_a_declared_adjudication_record_fails`. It covers three folders:
  - the reviewer's folder;
  - the same without the added finding;
  - run 1 with the schema and record, plus the finding on sonnet-low.

  Each fails `scores-derivable` with exactly that one line. The table refuses each and writes nothing.
- **Red first:** failures=3.
- **Guard proofs**, measured on `f5d0be3`, LegacyRuns:
  - condition removed: failures=3;
  - marker always False: failures=1 (the real-folders test, because run 3 is refused);
  - marker always True: failures=3.
- **Set aside:**
  - Keeping `review_prongs` None, so the PASSes stay unadjudicated with the LIMIT. That would accept a folder whose own record contradicts its scores. A declared record that the stated rule never applies is an internal contradiction, which C1 refuses.
  - Popping the refused rule as well. Its removal proof stayed green, so the lines were dropped.

## N2 (S3): one run counted twice from two folders

- **Reproduced** at `f5d0be3`: two copies of run 2 under two date folders.
  - The check: `2 folder(s), 0 failure(s)`.
  - The table: two `run 2 (wf_fe91e1d6-d78)` columns, and opus-high's pin read `PASS | PASS | 2 of 2`.
- **Fix:** `check_folders(folders)` runs `check_folder` over each folder, then groups the reports two ways:
  - by `protocol.json` `run_id`;
  - by (host, run number) from the folder name, where no suffix is run 1.

  Each member of a group of two or more fails `protocol-frozen`, naming the others: "run_id '<id>' is also the run id of <folder>; ..." or "<host> run <n> is also the folder <folder>; one run is one evidence folder, and the table would count it twice". The check's `main()` and the table's `main()` both use it, so the table refuses.
- **Tests:**
  - `LegacyRuns.test_one_run_is_one_folder_across_the_folders_checked` has four cases: a copy under a second date (both lines), the same id under another number, the same number under another id, and run 1 in both name forms. Each folder alone passes, and the real folders give no FAIL.
  - Table `Gate.test_it_refuses_a_run_held_in_two_folders`: four FAIL lines, "refused", nothing written.
  - `KitRuns.test_output_is_one_line_per_failure_and_a_summary` now places the a-protocol-frozen fixture as the host's run 2 with its own scores run id. The pass and a-protocol-frozen fixtures are the same host's run 1 of the same run, a pair the new rule rightly refuses.
- **Red first** against `f5d0be3`'s tools: the check test failures=4 (each subtest), the table test failures=1.
- **Guard proofs**, measured on `4dfcaa7`, LegacyRuns+KitRuns, plus the table's Gate class:

  | mutation | result |
  |---|---|
  | id grouping removed | failures=2 |
  | number grouping removed | failures=3 |
  | pair threshold raised to 3 | check failures=4, table failures=1 |
  | each folder named as its own other | failures=4 |
  | the unsuffixed folder not read as run 1 | failures=1 |
  | the check's `main` back on `check_folder` | failures=4 |
  | the table's `main` back on `check_folder` | failures=1 |

- **Set aside:**
  - Refusing in the table only. The check is what the gate says the table may consume.
  - Keying on the `scores.json` run id as well. A folder without a protocol run id, or whose scores disagree with it, already fails on its own, and no test could tell the difference.
  - `generate()`'s own folder path stays on `check_folder`. It renders; `main` judges.

## N3 (S4): a scalar `void_cells` crashing the table; scalars missing from the sweep

- **Reproduced** at `4dfcaa7`. `void_cells` 7 or true in the passing fixture: the check exits 0, and the table raises `TypeError: argument of type 'int'` (or `'bool'`) `is not iterable`.
- **Fix:**
  - In the table, `Run.cell` reads `void_cells` only when it is an object.
  - In the tests, `SCALARS = [7, True, None]` is added to `wrong_shapes` for every swept object and list.
  - That widening found 10 net catches in the check besides the reviewer's 4 table crashes: `protocol.json` `cases` or `amendments` as 7 or true in runs 1 and 3. Each is now a named guard:
    - `cases_of()` returns a list or [];
    - `pin_mapping` and `legacy_judging` read cases through `cases_of()`;
    - `legacy_scores` fails `scores-derivable` with "legacy run: protocol.json cases is not a list";
    - `legacy_relayed` fails `relayed-chat-statement` with "legacy run: protocol.json amendments is not a list, so whether the relayed text was recorded cannot be read".
- **Tests:**
  - Three new cases in `Shapes.test_the_reviewed_shapes_fail_their_rule_without_a_traceback`.
  - Table `Gate.test_a_void_cells_value_that_is_not_an_object_holds_no_void_cell`: 7, true and null each render the same table as without, exit 0.
- **Red first** against `4dfcaa7`'s tools:
  - the sweep reports 14 entries (the reviewer's 4 table crashes and the 10 net catches);
  - Shapes failures=4;
  - the table test failures=2 (null already passed).
- **Guard proofs**, measured on `6918e3d`, Shapes plus the table's Gate class:

  | mutation | result |
  |---|---|
  | void guard removed | Shapes failures=1, table failures=2 |
  | `cases_of` returning any truthy value | failures=1 |
  | `pin_mapping` reading cases directly | failures=1 |
  | `legacy_judging` reading cases directly | failures=1 |
  | cases line removed | failures=2 |
  | amendments guard removed | failures=2 |

- **Set aside:**
  - Refusing a non-object `void_cells` in the check. No rule reads it, and the kit writes an object.
  - Scalars in place of every leaf as well. That sweep was run once over the fixed tools and was green, with no further site. It costs the gate about 20 s: the check suite ran 43 s, against 26.7 s with containers only and about 20 s before this round.

## Tests, red and green

| suite | red (before the fix) | green |
|---|---|---|
| check, N1 | failures=3 | 49 OK |
| check, N2 | failures=4 | 50 OK |
| table, N2 | failures=1 | 19 OK |
| check, N3 | Shapes failures=4 (14 sweep entries) | 50 OK |
| table, N3 | failures=2 | 20 OK |

## Checks

All commands were run with cwd `/home/user/task5-handoff/wt/sr-evidence` on Python 3.11.15.

- `python3 tools/test_check_calibration_evidence.py`: 50 tests OK in 26.7 s (verified).
- `python3 tools/test_qualification_table.py`: 20 tests OK (verified).
- `python3 tools/check_calibration_evidence.py`: `3 folder(s), 0 failure(s), 14 limitation(s)`, the same 14 lines (verified; the suite asserts them).
- `python3 tools/qualification_table.py --check`: the committed table is the generated one (verified).
- `python3 tools/check_secrets.py`: clean, 0 hits (verified).
- `python3 -m py_compile` on both tools: exit 0 (verified).
- The regression gate: `REGRESSION GATE: all checks PASS` through the hook on all three commits and both amends (verified).
- The reviewer's repro folders at HEAD (verified):
  - N1: `1 failure(s)`, the new line;
  - N2: `4 failure(s)`;
  - N3: the table writes, with no traceback.
- Refute-first re-review: owed by the lead.

## Findings for the lead

1. **N1 is a refusal, not a LIMIT.** The finding offered both. Refusal is fail-closed, and it matches C1's "refused for an internal contradiction". A folder with runs 1-2's rule and a declared record is refused even when its scores agree with the record.
2. **N2 is a new cross-folder step.** `protocol-frozen` now has a part that depends on which folders are checked together. A folder that passes alone can fail beside its copy. Passing the same folder twice on the command line also fails, naming itself.
3. **The sweep's scope for N3.** The gate's sweep tries scalars in place of containers only. Scalars in place of leaves were swept once, green, and are not in the gate, to save about 20 s per commit. Say if you want them in.
4. **The call-site sweep from fix round 1 was not re-run over the whole check.** The four new `r.fail` sites (one for N1, one for N2, two for N3) are each proven individually above.

## What I got wrong and fixed

1. **N1 and N2 commit messages carried proof counts measured on an earlier version of the code.**
   - mistake: `42bab0a` gave failures=3 for the always-False mutation; on the committed code it is 1. `7072c92` gave counts measured before the last test case was added. Four of them were lower: number grouping, threshold, own-other and check main read 2, 3, 3, 3, where the commit gives 3, 4, 4, 4.
   - where: the "What you verified" part of each message.
   - impact: wrong numbers in two commit reports. The code and the proofs were right. Nothing delivered past the branch.
   - cause: I wrote the counts from the run before the last edit, not from the committed code.
   - fix: re-measured on each commit, and each message amended once before the next commit, with the hook re-run. N3's counts were measured on its final code before it was committed.
   - verified: `git log -1 --format=%B` on `f5d0be3` and `4dfcaa7` shows the re-measured counts.
   - residual: `4dfcaa7`'s amended got-wrong line says "three of them lower"; it was four. The counts in its verified part are right. History was not rewritten past `6918e3d` to correct one word; this report is the correction.
2. **Unproven lines in first drafts.**
   - mistake: the drafts held lines no test could tell apart:
     - N1's pop of the refused rule;
     - N2's `scores.json` run-id fallback and its `check_folders` in `generate()`;
     - N2's unsuffixed-run branch, whose mutation stayed green.
   - where: `legacy_scores`, `check_folders`, `generate`.
   - impact: none delivered; they were found by the removal proofs before each commit.
   - cause: I added defensive lines beyond what the finding needed.
   - fix: the lines were dropped, and the run-1-in-both-forms test case was added.
   - verified: every remaining new line is red when removed.
3. **The README sentence for N3 overclaimed in its first two drafts.**
   - mistake: it first said a number, boolean or null "is a FAIL". `void_cells` is not read, and null often reads as absent. The second draft said "every object and list", while the sweep samples.
   - fix: reworded to what the tests do, before the commit.
4. **The defects themselves were mine.**
   - N1: the prongs were tied to the schema, not to the rule that applies them (`69558e7`).
   - N2: folders were judged one at a time (`02c3756`, `6653d61`).
   - N3: containers were swept without scalars, and `void_cells` was read unguarded (`5e9aedf`, `6653d61`). Fix-1's report claimed the table renders every accepted folder; that was unproven for these shapes.
   - Each commit's got-wrong part has the six fields.
