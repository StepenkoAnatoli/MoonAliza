# Re-review 2 of unit sr-evidence, after fix round 2 (refute-first)

Unit: the calibration evidence check and the qualification table.
- Worktree: `/home/user/task5-handoff/wt/sr-evidence`, base `229aa1f`.
- Head: `6918e3d`. Fix round 2 added three commits on `0fe67a7`: `f5d0be3` (N1), `4dfcaa7` (N2), `6918e3d` (N3).
- Contract: `smartrouter/briefs/evidence-check-builder.md` (C1-C6).
- Checklist: `smartrouter/briefs/router-reviewer.md` (refute first, S1-S4), applied as in review 1 and re-review 1.
- Inputs: re-review 1 is `sr-evidence-rereview-1.md`; the fix report is `sr-evidence-fix-2.md`.

I changed nothing in the worktree. Every probe ran on `git archive` copies of HEAD and of `0fe67a7`, under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/rr2/`. The only command run
inside the worktree was the regression gate, and `git status --short` was empty before and after it. Python 3.11.15.

## Verdict: FIX

**N1, N2 and N3 are fixed.** I re-ran each finding's own proof at HEAD and at `0fe67a7`. Each one reproduces at
`0fe67a7` and is refused or rendered at HEAD. The new tests fail against `0fe67a7`'s tools: 11 failures in the check
suite and 3 in the table suite. 17 guard-removal mutations of the new code all turn a suite red.

**I found one new S3, N4.** It is the class C1 sets apart, and fix round 2 does not reach it. The check treats every
folder without the kit's keys as a legacy run. It does not hold that class to runs 1-3. A new folder written in run 2's
legacy form, with a new run id and a new run number, therefore passes with LIMITs instead of the kit's full rules. The
table then counts its pin and fix PASSes. The plainest case is a copy of run 2 relabelled as run 4: N2's new check does
not catch it, and opus-high's pin row reads `4 of 4`.

Nothing else I tried broke. The details:
- A fuzz of 53,490 shapes gave 0 tracebacks and 0 net catches.
- I silenced each of the 93 fail and limit sites, and every one turned a suite red.
- Run 3 re-derives with 0 mismatches.
- The table recounts with 0 mismatches.
- The gate passes.

## Earlier findings, re-checked

| id | status | proof re-run |
|---|---|---|
| N1 (S2) | fixed | I re-ran re-review 1's `mk_p1.py` (run 2 copy, three-prong `adjudication_schema`, `adjudication.json` with C-9's three lenses not real, an S2 other in C-9 on sonnet-high). **At `0fe67a7`:** `1 folder(s), 0 failure(s), 3 limitation(s)`, and the table is written. **At HEAD:** exit 1 with one line, `FAIL ... scores-derivable: legacy run: scores.json declares an adjudication_schema, yet the review pass rule (sha256 360d460628da) counts the grader's falseBlocking and does not apply the adjudication record; only run 3's adjudicated rule rests a review grade on one`. `qualification_table.py` prints "refused: the evidence check fails; nothing written", exits 1, and writes no file. **Bypass attempts:** a record with no schema already fails `prongs-declared`, and so does a schema with no record. Run 3's rule with no record keeps `review_prongs` None, so its PASSes stay `unadjudicated` (fail-safe). Kit runs derive through the kit and are unaffected. None of these gets through. |
| N2 (S3) | fixed | I put two copies of run 2 under `2026-10-17/` and `2026-10-20/`. **At `0fe67a7`:** `2 folder(s), 0 failure(s)`, and the table is written. **At HEAD:** 4 `protocol-frozen` FAILs (the run-id line and the host-and-number line, on each folder, naming the other folder), exit 1, and the table writes nothing. **Under default discovery:** I copied run 1 into `docs/evidence/2026-10-20/claude-code-calibration-1` (the other name form) in a copy of HEAD. `check_calibration_evidence.py` gives 4 FAILs, exit 1, and `qualification_table.py --check` is refused, exit 1. **Edge case:** `run_id` as a list, an object, 7 or true in both files fails `protocol-frozen` alone, with no traceback, because `filled()` accepts only strings. So `check_folders` never hashes an unhashable value. |
| N3 (S4) | fixed | I set `void_cells` in the pass fixture to 7, true, null, `"abc"` and `["pin:x"]`. **At `0fe67a7`:** 7 and true raise `TypeError: argument of type 'int'`/`'bool'` `is not iterable` in the table. **At HEAD:** all five shapes render, exit 0. Before, a string was read with substring semantics; now it is not read at all. The kit (`observations.py:437`) and run 3 both write `void_cells` as an object, so the guard hides no real void cell. My fuzz (below) found no other table crash. |

### Red first and guard proofs, measured by me

**Red first.** I ran HEAD's two test files against `0fe67a7`'s tools.
- The check suite: `FAILED (failures=11)`:
  - N1: 3 subtests;
  - N2: 4 subtests;
  - N3: Shapes i=13, 14, 15, and the sweep.
- The table suite: `FAILED (failures=3)`. That is the N2 refusal, and `void_cells` = 7 and true.

**Guard-removal mutations** (`cond2.py`; both full suites, on HEAD copies). Each of the 17 is red:

| mutation | check suite | table suite |
|---|---|---|
| N1 condition removed | failures=3 | - |
| N1 marker always False | failures=2 | failures=3 |
| N1 marker always True | failures=3 | - |
| N1 `prongs is not None` clause dropped | failures=9, errors=1 | failures=3 |
| N2 run-id grouping removed | failures=2 | failures=1 |
| N2 number grouping removed | failures=3 | failures=1 |
| N2 pair threshold 3 | failures=4 | failures=1 |
| N2 own folder named as the other | failures=4 | - |
| N2 unsuffixed folder not read as run 1 | failures=1 | - |
| N2 the check's `main` on `check_folder` | failures=4 | - |
| N2 the table's `main` on `check_folder` | - | failures=1 |
| N3 void guard removed | failures=1 | failures=2 |
| N3 `cases_of` returns any truthy value | failures=1 | - |
| N3 cases line removed | failures=2 | - |
| N3 amendments guard removed | failures=2 | - |
| N3 `pin_mapping` reads cases directly | failures=1 | - |
| N3 `legacy_judging` reads cases directly | failures=1 | - |

The fix report gives "always False: failures=1", measured on LegacyRuns alone. My full-suite figure is larger and
consistent with it.

**The fix report's correction.** The fix report says `4dfcaa7`'s message wrongly says "three" proof counts were lower,
where it was four. I compared the first message `7072c92` with `4dfcaa7`. Four counts rose: number grouping 2 to 3,
threshold 3 to 4, own-other 3 to 4, check main 3 to 4. The report's correction is accurate. That one word is left in
history and disclosed, and I raise no finding on it.

## New finding

### N4 (S3): a new folder in legacy form is accepted as a legacy run; C1 holds that class to runs 1-3

**What the brief says.**
- C1 defines the class as "a *legacy run* (runs 1-3)".
- The check's own docstring repeats it: "calibration runs 1-3 predate the kit".
- So does `docs/evidence/README.md`: "A legacy run (runs 1-3)".
- Item 4.3 refuses a results PR whose evidence does not carry the intended rule.

**What the code does.**
- `check_folder` sets `r.kind = "kit" if kit_keys(protocol) else "legacy"`, so any folder without the kit's keys gets
  legacy leniency.
- Under that leniency, `prongs-declared`, `fewer-prong-pass-flagged`, `pin-category-mapping`,
  `judging-profile-named` and `relayed-chat-statement` are LIMITs, not FAILs.
- The only legacy refusal for a new run is an unencoded pass-rule text (F1). A folder that keeps run 1's or run 2's
  rule text passes.

**Reproduction** (a copy of HEAD):
1. Copy `docs/evidence/2026-10-17/claude-code-calibration-2` to `docs/evidence/2026-10-20/claude-code-calibration-4`.
2. Set `run_id` to `wf_00000000-new` in its `protocol.json` and `scores.json`.

Results:
- `check_calibration_evidence.py`: `4 folder(s), 0 failure(s), 19 limitation(s)`, exit 0. N2's new step does not
  fire, because the run id and the number both differ.
- `qualification_table.py` writes the row
  `| opus-high | opus | high | not named | pin-tests | not recorded | PASS | PASS | PASS | PASS | 4 of 4 | mechanical | - |`.
  Run 2's one observation is counted twice.
- A new run with its own real observations in run 2's legacy form passes the same way. Its pin and fix PASSes are
  counted. It never has to declare prongs, a judging profile or the relayed text.

**Why it is realistic.** Re-review 1 called N1 realistic because copying run 2's protocol is the obvious way to write a
new run. The same path, without adding an adjudication record, lands here. Fix round 2 does not touch this:
- N1 refuses only a declared adjudication record beside runs 1-2's review rule.
- N2 refuses only a run id, or a host and run number, that is shared.

It also predates this round: the same folder exits 0 at `0fe67a7`.

**Severity.** S3. A duty that C1 and the README claim, Item 4.3 in full for any run other than runs 1-3, is not
enforced, and no test proves it. It is not S2, because the folder's scores do agree with its own observations under the
rule it states.

**Fix.**
- Hold the legacy class to runs 1-3. One way is a constant of their three `run_id`s, each with its host and run
  number.
- A folder without kit keys that is not one of them fails `protocol-frozen` (or `scores-derivable`) with "a new run is
  a kit run".
- Add a red-first test with the relabelled copy above. Add a second case: a copy of run 1 renamed to the next free
  number with a fresh run id.
- Runs 1-3 are unaffected.

## Checklist, re-run on HEAD

1. **Each rule a-h on a failing folder.**
   - The builder's eight fixtures (unchanged since `1c22574`) each fail only their named rule. b gives 3 lines, the
     others 1. The pass fixture gives 0 FAIL and 0 LIMIT.
   - I rebuilt my eleven minimal folders (`mk_rules.py` on HEAD), and each fails only its rule:
     - a: `frozen_at` popped; `run_id` null
     - b: `prongs_in_classification` reordered; `adjudication.json` `declared-prongs` short
     - c: alpha-low fix flipped
     - d: a flag on beta-max's three-prong PASS, which gives two d lines
     - e: pin `build-tests`
     - f: no qualification and no limitation
     - g: `statement` popped
     - h: a key built by concatenation in `clusters.md`; `sub/Grader.Prompt.txt`
   - Each folder was run alone. Since N2, the pass fixture and its edits are the same run, and checking them together
     rightly fails `protocol-frozen`.
2. **The three real folders.** `python3 tools/check_calibration_evidence.py` gives
   `3 folder(s), 0 failure(s), 14 limitation(s)`, exit 0. These are the same 14 lines as in re-review 1:
   - runs 1-2: b, d (unadjudicated 8 and 9), e, f, g;
   - run 3: b (missing forbidden), d (its own reading, flagged haiku-medium and haiku-high), f, g (A-1).

   These are the limitations C1 names.
3. **Run 3 re-derived with fresh code of my own.**
   - Lens votes: holds and reachable not "no", in two of three lenses. All five clusters are real on two prongs.
   - The `three_prong_reading` marks C-4 and C-5 not real (G-2).
   - Pin and fix are mechanical. The review is PASS when r8Found, r11Found, adjudicated false blocking 0 and no
     copying.
   - Result: **39 cells, 0 mismatches**, `falseBlocking_adjudicated` included.
   - Under three prongs, exactly haiku-medium (2) and haiku-high (1) fail. They are flagged with
     `three_prong_false_blocking` 2 and 1, and this matches "13 of 15 under the three-prong definition".
4. **Caveats and counts.** My recount of the committed table from the three `scores.json` files gives 39 rows,
   0 cell mismatches, 0 count mismatches, and no row missing or extra.
   - 2 cells read `PASS (2-prong, would fail)` (not counted).
   - 17 read `PASS (unadjudicated)` (8 + 9, not counted).
   - 2 cells are supplementary.
   - The four "does not support" statements are present.
5. **`--check`.**
   - On the committed table: exit 0.
   - On a copy with `PASS (2-prong, would fail)` changed to `PASS`: exit 1.
   - From cwd `/`: exit 0.
   - A fresh `generate()` is byte-identical to the committed table (`cmp`).
   - The table did not change in this round.
6. **Secrets.** `python3 tools/check_secrets.py` reports `clean (0 hits)`. The h folder's key is written by
   concatenation, and the output names the pattern, not the value.
7. **The gate.** `python3 tools/run_regression.py` in the worktree gives 56 steps, `REGRESSION GATE: all checks PASS`,
   exit 0, in 1m35s. The four unit steps follow `test_calibration_kit`. Outside the gate:
   - the check suite: 50 tests OK in 28 s;
   - the table suite: 20 tests OK in 1.1 s.
8. **Shapes, my own sweeps.**
   - **Fuzz:** every node of every JSON file in the pass fixture and runs 1, 2 and 3, with up to two list items,
     replaced by each of `None, 0, 7, True, "x", ["x"], {"x":1}, [], {}`. That is 53,490 mutations, with **0
     tracebacks** in the check or the table and **0 net catches**. Re-review 1 counted 16 net catches; each is now a
     named guard.
   - **Fail-site sweep:** each of the 93 `r.fail(`/`r.limit(` sites silenced in turn. **0 of 93 survive**; all are red.
   - The README sentence added for N3 describes the gate's sweep accurately: scalars go in place of objects and
     lists; leaves keep one shape. My fuzz covers the leaves too, and run 2.
9. **No other file changed.**
   - `git diff --name-only 0fe67a7..HEAD` lists the five files the fix report names.
   - Over `229aa1f..HEAD`, nothing changed under `docs/evidence/2026-*`, `hosts/` or `skills/`.
   - Under `tools/calibration/`, only the README paragraph changed.
   - `run_regression.py` gained exactly the four lines.
   - All three commits use the `StepenkoAnatoli` noreply identity and carry both trailers.
   - `4dfcaa7`'s message carries the five parts, including the got-wrong part.

## Gist

- FIX. N1, N2 and N3 are fixed, each re-proven:
  - the N1 folder exits 1 and the table refuses it;
  - two copies of a run give 4 `protocol-frozen` FAILs, also under default discovery;
  - a scalar `void_cells` renders.
- The new tests fail 11 + 3 against `0fe67a7`. My 17 guard-removal mutations are all red.
- N4 (S3, new, predates the round): a folder without kit keys is treated as a legacy run even when it is not run 1-3:
  - a copy of run 2 relabelled as run 4 with a new run id exits 0, and the table counts opus-high pin `4 of 4`;
  - fix: hold the legacy class to runs 1-3's ids, and refuse any other such folder as "a new run is a kit run".
- The checklist holds:
  - the per-rule folders a-h fail only their rule;
  - the real folders give the same 14 C1 limitations;
  - run 3 re-derived: 39 cells, 0 mismatches, flags 2 and 1;
  - 39 rows recounted, 0 mismatches;
  - `--check` exits 1 on an edited copy, and a fresh generation is byte-identical;
  - secrets clean;
  - the gate's 56 steps pass.
- Sweeps: 53,490 fuzzed shapes with 0 tracebacks and 0 net catches; 0 of 93 silenced fail and limit sites survive.
