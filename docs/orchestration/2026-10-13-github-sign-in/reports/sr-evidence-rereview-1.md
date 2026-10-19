# Re-review 1 of unit sr-evidence, after fix round 1 (refute-first)

Unit: the calibration evidence check and the qualification table.
- Worktree: `/home/user/task5-handoff/wt/sr-evidence`, base `229aa1f`.
- Head: `0fe67a7`. The fix round added seven commits on `1c22574`: 4863d10, 3c3220a, 5e9aedf, e96f08c, 6c625f8, b988ab6, 0fe67a7.
- Contract: `smartrouter/briefs/evidence-check-builder.md` (C1-C6).
- Checklist: `smartrouter/briefs/router-reviewer.md` (refute first, S1-S4), applied as in review 1.
- Inputs: review 1 is `sr-evidence-review-1.md`; the fix report is `sr-evidence-fix-1.md`.

I changed nothing in the worktree. Every probe ran on `git archive` copies of HEAD and of `1c22574`, under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/rr1/`. `git status` in the
worktree was clean before and after; only ignored `__pycache__/` directories were present. Python 3.11.15.

## Verdict: FIX

**F1-F6 are fixed.** I re-ran each finding's proof, and each now holds.

**I found one new S2 of the same class as F1.** It was already present at `1c22574`, and the fix round did not touch it:
- A copy of run 2 that adds an adjudication record passes the check.
- Its review pass rule does not apply that record.
- The table then counts all 9 of its review PASSes without a caveat, and says they rest on a three-prong adjudication.
- One of those PASSes has a blocking finding in a cluster that its own lens records make not real.

I also found one new S3 (a run copied into a second folder is counted twice) and one new S4 (a table traceback on a
`void_cells` scalar, which F3's sweep does not reach).

## Earlier findings, re-checked

| id | status | proof re-run |
|---|---|---|
| F1 (S2) | fixed | I rebuilt review 1's three folders and a fourth variant (the stripped pass fixture with its lenses untouched). At `1c22574` each exits 0. At HEAD each exits 1 with `scores-derivable: legacy run: no encoded pass rule for the <case> case ...`: 3 lines each for the stripped fixture and for run 1 with no cases, and 1 line (fix) for run 2 with the fix case renamed. `qualification_table.py` over the first prints "refused: the evidence check fails; nothing written", exit 1, and no file is written. The F1 condition mutations each turn the suite red: removing the scored-without-rule loop gives failures=1, and removing the duplicate-case refusal gives failures=1. |
| F2 (S3) | fixed | I wrote my own sweep. It silences each of the 89 `r.fail(`/`r.limit(` call sites in turn with `(lambda *a, **k: None)(` and runs both suites: **0 survivors of 89, all red**. I also ran 18 condition mutations, each red: the 11 guards review 1 named, F1 ×2, F4, F5 (dropping `re.I`), F3's `others` list guard, F3's lens-id guard, and the net narrowed to `ZeroDivisionError` (errors=3). The report's restated claim holds. |
| F3 (S4) | fixed in the check; a table gap remains (N3) | Review 1's five shapes each exit 1 with a named FAIL and no traceback (for example `review:beta-max in scores.json is not an object`). I wrote my own fuzz: every node of every JSON file in the pass fixture and runs 1, 2 and 3, with every profile and up to two list items, replaced by each of `None, 0, 7, True, "x", ["x"], {"x":1}, [], {}`. That is 53,490 mutations. **The check never raised.** The net caught 16 shapes, each as a FAIL (fail-closed): `protocol.json` `cases = 7` or `amendments = 7`, under judging-profile-named, relayed-chat-statement and pin-category-mapping. **The table raised 4 times**; see N3. |
| F4 (S4) | fixed | Status `frozen` and the template's exact run-complete line exit 0. These each exit 1 on `protocol-frozen` alone: `run complete; but never frozen`, `run complete`, `FROZEN`, `frozen ` (trailing space), and `["frozen"]`. The kit writes no status itself; the template is the only source of the two values. |
| F5 (S4) | fixed | `Review.PROMPT.md`, `TRANSCRIPT`, `JOURNAL.JSONL` and `review.Prompt` each exit 1. `notes.md` exits 0. |
| F6 (S4) | fixed | Runs 1 and 3 alone give the headers `run 1 (wf_052c5f34-973)` and `run 3 (wf_4e9ef48d-066)`, and the run table lists 1 and 3. See N2 for a side effect when two folders carry the same number. |

## New findings

### N1 (S2): a legacy run whose review rule ignores the adjudication record still has its review PASSes counted as adjudicated

**Where.** `tools/check_calibration_evidence.py`.
- `check_legacy` sets `r.review_prongs = prongs` from `legacy_prongs`. That value depends only on whether `scores.json` declares an `adjudication_schema` that is consistent with `adjudication.json`.
- `legacy_fewer_prong` marks review PASSes `unadjudicated` only when `prongs is None`.
- The review rule the folder's hash selects is independent of all this. Runs 1 and 2 use `_review(..., lambda g, c: g.get("falseBlocking"))`, which is the grader's own count. Only run 3's rule, `_adjudicated_false_blocking`, reads the lens records.

**Effect.** A folder can state run 1's or run 2's review pass rule and also carry an adjudication record. The check then:
- accepts the record as what the review grades rest on;
- checks each grade against the grader's `falseBlocking`, never against the record;
- prints no LIMIT for the review PASSes.

The table counts those PASSes. This breaks C1, which says to refuse "a score the observations do not support". It also
breaks C3, which says the table shows "the adjudication schema version and prongs each run's review grade rests on".

**Reproduction** (`mk_p1.py` in the scratch folder). Copy run 2, then:
1. Add `scores.json` `adjudication_schema` with `prongs_in_lens_schema` and `prongs_in_classification` both `[holds, reachable, forbidden]`, and `missing_prong: []`.
2. Add `adjudication.json` with cluster `C-9`, whose three lenses are all `holds: false, reachable: "no", forbidden: false`.
3. Append `{"severity": "S2", "cluster": "C-9", ...}` to sonnet-high's review-grade `others`.

Results:
- The check gives `1 folder(s), 0 failure(s), 3 limitation(s)`, exit 0. The prongs-declared and fewer-prong LIMITs are gone.
- The table writes `| sonnet-high | ... | review | ... | PASS | 1 of 1 | run 2: schema 1, holds+reachable+forbidden | - |`.
- All 9 review PASSes are counted. In the real run 2, all 9 are `PASS (unadjudicated)` and not counted.
- Under the record the folder itself declares, sonnet-high's review is FAIL: one S2 finding sits in a cluster with 0 real votes.
- The same folder also exits 0 at `1c22574`, so the defect predates the fix round.

**Why it is realistic.** Writing a new run by copying run 2's protocol (its pass-rule text) and adding the kit's
adjudication step is the obvious path. F1's fix shuts out a folder that has *no* encoded rule. It does not shut out an
encoded rule paired with an adjudication record that the rule does not use.

**Fix.** Let only the adjudicated review rule (run 3's hash) rest on an adjudication record. For runs 1-2's review rule,
either of these works:
- fail `scores-derivable` (or `prongs-declared`) when the folder also declares an `adjudication_schema` ("the review
  pass rule does not apply the adjudication record");
- or keep `review_prongs = None`, so its PASSes stay `unadjudicated` and the LIMIT is printed.

Add a red-first test with the folder above. Runs 1-3 are unaffected: runs 1-2 declare no schema, and run 3's rule is
the adjudicated one.

### N2 (S3): a run copied into a second folder is counted twice in the table

**Where.**
- `check_calibration_evidence.discover` and `qualification_table.generate`. Nothing compares `run_id` across folders.
- Since F6, `run_number` gives both copies the same label.

**Reproduction.** Put two copies of run 2 under two parent folders and run `qualification_table.py` on both. It exits 0
and writes:
- the header `| run 2 (wf_fe91e1d6-d78) | run 2 (wf_fe91e1d6-d78) |`;
- the row `| opus-high | ... | pin-tests | ... | PASS | PASS | 2 of 2 | ...`.

One observation is counted twice. C3 asks for "pass/partial/fail per run", and a duplicated folder is not a second run.
The default discovery picks up such a copy under any `docs/evidence/<date>/`. Before F6, the labels at least differed;
now they are identical.

**Fix.** Refuse two accepted folders with the same `run_id`, or with the same host and run number, in the check (a
cross-folder line) or in the table. Add a test with the two copies.

### N3 (S4): the table raises on a `void_cells` scalar that the check accepts

**Where.** `tools/qualification_table.py:108`:

```python
if f"{case}:{profile}" in (self.scores.get("void_cells") or {}):
```

**Reproduction.** In `scores.json`, set `void_cells` to `7` or `true`, in the pass fixture or in a run 3 copy. The check
exits 0. `qualification_table.py` then dies with `TypeError: argument of type 'int' is not iterable`, a traceback. My
fuzz found exactly these 4 crashes.

**Why the Shapes sweep misses it.** `wrong_shapes()` in `test_check_calibration_evidence.py:681` replaces a dict only by
`"x"` or `["x"]`, a list only by `"x"` or `{"x": 1}`, and a scalar only by `{"x": 1}`. It never tries a number, a bool
or null. So the claim in the fix report that "the table renders every folder the check still accepts" holds only for
those shapes.

A related point: a string `void_cells` is read with substring semantics. The check never reads `void_cells`, so the
table trusts it unchecked.

**Fix.** Guard with `isinstance(..., dict)`. Add numbers, bools and null to `wrong_shapes`.

## Checklist, re-run on HEAD

1. **Each rule a-h on a failing folder.**
   - The builder's eight fixtures each fail only their named rule (b with 3 lines, the others with 1), and the pass fixture gives 0 FAIL and 0 LIMIT. The fixtures are unchanged since `1c22574`.
   - I built eleven minimal folders of my own (`mk_rules.py`), and each fails only its rule:
     - a: `frozen_at` popped; `run_id` null
     - b: `prongs_in_classification` reordered; `adjudication.json` `declared-prongs` short
     - c: alpha-low fix flipped
     - d: a flag on beta-max's three-prong PASS, which gives two d lines: the flag and the stated count
     - e: pin `build-tests`
     - f: no qualification and no limitation
     - g: `statement` popped
     - h: a key written by concatenation, `"sk-"+"ant-"+"Q"*40`, in `clusters.md`, which fails as `anthropic-key`; and `sub/Grader.Prompt.txt`
2. **The three real folders.**
   - `python3 tools/check_calibration_evidence.py` gives `3 folder(s), 0 failure(s), 14 limitation(s)`, exit 0.
   - Runs 1-2 have 5 LIMITs each: b, d (unadjudicated 8 and 9), e, f, g. Run 3 has 4: b (missing forbidden), d (its own reading, flagged haiku-medium and haiku-high), f, g (A-1).
   - These are the limitations C1 names, and they are the same 14 lines as review 1.
3. **Run 3 re-derived with my own code.**
   - Lens votes use the declared prongs: holds, and reachable not "no", in two of three lenses. All five clusters are real.
   - Pin and fix are mechanical.
   - The review is PASS when r8Found, r11Found, adjudicated false blocking 0 and no copying.
   - Result: 39 graded cells (12 pin, 12 fix, 15 review), **0 mismatches** with `scores.json`, `falseBlocking_adjudicated` included.
   - Under all three prongs (C-4 and C-5 not real, as G-2 records), exactly haiku-medium (2 findings) and haiku-high (1) fail. That equals the two flags and their `three_prong_false_blocking` values 2 and 1, and "13 of 15 under the three-prong definition".
4. **Caveats and counts.**
   - Run 3's two flagged cells read `PASS (2-prong, would fail)` and are counted 0 of 3.
   - Runs 1-2 show 17 `PASS (unadjudicated)` cells, 8 + 9.
   - haiku-low's run 3 review reads `PASS (supplementary)` and is not counted.
   - All four "does not support" statements are in the header.
   - My recount of every row from the three `scores.json` files: 39 rows, 0 mismatches.
5. **`--check`.**
   - On the committed table: exit 0.
   - On a copy with `PASS (2-prong, would fail)` changed to `PASS`: exit 1.
   - From cwd `/`: exit 0.
   - A fresh generation is byte-identical to the committed table (`cmp`).
   - The table is unchanged in this round.
6. **Secrets.** `python3 tools/check_secrets.py` reports clean, 0 hits. The suite writes its key by concatenation. My concatenated key fails `no-secrets-or-bodies` only, and the output names the pattern, not the value.
7. **The gate.**
   - `python3 tools/run_regression.py` in the worktree: 56 steps, `REGRESSION GATE: all checks PASS`, exit 0, 1m28s. The worktree was clean afterwards.
   - The four steps sit right after `test_calibration_kit`.
   - The suites ran 48 tests OK in 18.6 s and 18 tests OK in 0.7 s.
8. **No other file changed.**
   - `git diff --name-only 1c22574..HEAD` lists only `docs/evidence/README.md`, `tools/check_calibration_evidence.py`, `tools/qualification_table.py` and their two test files.
   - Over the whole unit (`229aa1f..HEAD`), nothing changed under `docs/evidence/2026-*`, `hosts/` or `skills/`.
   - Under `tools/calibration/`, only the one README paragraph changed.
   - All seven commits use the `StepenkoAnatoli` noreply identity and carry the five-part report and both trailers. I read the F1 commit in full.

## Note for the lead (not a defect)

The net under each rule turns an unforeseen shape into that rule's FAIL, which is fail-closed and in C2's format. My
fuzz reached it 16 times: `cases = 7` and `amendments = 7`. The fix report says no failure went through the net, but
that holds only for its sampled shapes. The messages read "a value has the wrong shape for this rule (TypeError: ...)",
which is acceptable.

## Gist

- FIX. F1-F6 are all fixed, each re-proven. My own sweeps:
  - 0 of 89 silenced fail/limit sites survive;
  - 18 condition mutations, all red;
  - 53,490 fuzzed shapes, and the check never raised.
- N1 (S2, same class as F1, predates the round): a copy of run 2 that adds an adjudication record passes. Its review rule ignores the record, so the table counts all 9 review PASSes as adjudicated ("1 of 1"), including one that the folder's own lens records make FAIL. Fix: only run 3's adjudicated rule may rest on an adjudication record.
- N2 (S3): two folders with the same run id are counted as two runs ("2 of 2"), with identical labels since F6. N3 (S4): `void_cells: 7` passes the check and crashes the table at `qualification_table.py:108`, and the Shapes sweep never tries numbers, bools or null.
- The checklist holds:
  - per-rule folders a-h fail only their own rule;
  - the real folders give exactly the 14 C1 limitations;
  - run 3 re-derived: 39 cells, 0 mismatches, flags 2 and 1;
  - 39 rows recounted, 0 mismatches;
  - `--check` exits 1 on an edited copy, and a fresh generation is byte-identical;
  - secrets clean;
  - the gate's 56 steps pass;
  - only the allowed files changed.
