# sr-pack report: fix round 2 (re-review sr-pack-rereview-1: N-1 S3, N-2 S4)

Builder of unit sr-pack, fix round 2. Worktree `/home/user/task5-handoff/wt/sr-pack`, branch
`tools/calibration-shared-pack`, on top of `8b72079`. Two commits, one per finding, not pushed. This report file is
not committed.

## Gist

- N-1 (S3) fixed: D-2's accepted pin row 1 is now `(["héllo"], 2, b"h\xc3")`, which really cuts inside "é" (68 c3 a9: limit 2 falls between c3 and a9). The re-review's `boundary` wrong fix (whole characters only) now grades FAIL on `acceptedPinGreen` alone. A SharedPack subtest grades it.
- N-2 (S4) fixed: row 2 now reads `texts_then_no_more("ab", "cd")`, a generator that raises AssertionError if it is pulled after the limit is reached, so the pin tests "reads no further chunk" literally. The re-review's `topcheck` wrong fix (bound checked at the top of the loop: 3 pulls, not 2) now grades FAIL on `acceptedPinGreen` alone. A SharedPack subtest grades it.
- New ids: review0 `46c1cb9c8dc8029a45e3f5c02c5092224c701df2` and base0 `b41a7f9c2c38c3caef06ceb0a3987e19098f759b` are unchanged. accepted0 is now `3517210bbece5e49d527e6d27d6fe18da8e5920c` (after N-1 it was `0af40d53...`). make-repo.sh at HEAD reports that they equal the manifest's (verified).
- Kit suite: 79 tests OK (the count is unchanged, because both new cases are subtests of an existing test). check_secrets is clean, py_compile is ok, and the regression gate PASSed through the pre-commit hook on both commits. Both fixes are red-first with guard-removal proofs.
- This round corrects 0d59cc9's subject and fix report 1. The old row 1 never cut inside a character. That mistake was mine (round 1) and is reported below.

## Commits

| sha | finding | subject |
|---|---|---|
| `90de2cd` | N-1 | tools/calibration: shared pack N-1 - D-2's accepted pin cuts "héllo" at limit 2, inside "é", so a fix that cuts text only at character boundaries grades FAIL |
| `5760494` | N-2 | tools/calibration: shared pack N-2 - D-2's accepted pin reads a stream that fails if pulled past the limit, so a fix that checks the bound at the top of the loop grades FAIL |

Both commits are by StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>. Each message carries the five
named parts and ends with the `Co-Authored-By` and `Claude-Session` lines. No commit used `--no-verify`. Each went
through `.githooks/pre-commit`, which printed "REGRESSION GATE: all checks PASS".

**Revert note.** Both commits move accepted0 and the same `source_hashes` entry in manifest.json. So reverting 90de2cd
alone while 5760494 stays conflicts on those lines, as the R-1 and R-3 commits of round 1 do. This comes from the pack's
deterministic ids, not from mixing tasks.

## Files

`tools/calibration/subject-pack/shared/{manifest.json,trees/accepted/tests/test_pin.py}` and
`tools/test_calibration_kit.py`. These are all within the brief's permitted paths. No tree source line changed, and
neither did SPEC.md or a README. D-1, D-2 and their accepted fixes did not move.

## Per finding

### N-1 (S3): fixed as the re-review proposed

- **Pin.** Row 1 is now `(["héllo"], 2, b"h\xc3")`. The docstring says limit 2 falls between the two bytes of "é", so the result ends with the first of them.
- **Test.** `SharedPack.wrong_fix("boundary")` takes base0's str branch and rewrites it to take whole characters while they fit, count their bytes, and stop reading at the first one that does not fit. `test_grade_fix_wrong_fixes_of_d2_fail_on_the_accepted_pin` grades it as a fix cell. The cell carries the candidate's own test and the `fix(bounded): D-2 - ` prefix. The test expects `candidateGreen`, `guardRed`, `scopeOk` and lint ok, with `acceptedPinGreen` false and `PASS` false. A probe then shows the divergence from SPEC.md: `read_bounded(["éé", b"x"], 3)` returns `b'\xc3\xa9'` (2 bytes), where SPEC.md cuts at 3.
- **Red (verified).** With the old row, the `boundary` subtest failed with `acceptedPinGreen: True ... PASS: True` (srcDiffLines 12). This reproduces the re-review.
- **Green (verified).** Run with SharedPack and Docs, all 31 tests OK, then the full suite of 79 OK. `chars` and `trunc` still FAIL, and the accepted pin PASSes the pin cell.

### N-2 (S4): fixed as the re-review proposed

- **Pin.** Row 2 is now `texts_then_no_more("ab", "cd"), 4, b"abcd"`. The helper yields the texts and raises AssertionError on the next pull.
  - The rows are built inside `test_rows`, because a generator in the old class attribute `ROWS` would be spent after one run.
  - Each subtest is labelled by a string, not by a generator repr.
  - At base0 the pin fails at once with AssertionError: base0's str branch never stops, so it pulls again and the generator raises. There is no timeout. The existing test `test_d2_the_accepted_pin_is_red_at_base_and_review_and_green_at_accepted` asserts AssertionError in stderr at review and base, and it is still green.
- **Test.** `wrong_fix("topcheck")` makes these changes:
  - The str chunk is encoded and falls through to the shared cut and count.
  - `if taken >= limit: break` moves from after the count to the top of the loop.

  The same test grades it as a fix cell, with the same flags expected. A probe then shows the extra pull: a generator that records its pulls gives `b'abcd' 3`.
- **Red (verified).** With the sentinel row, the `topcheck` subtest failed with `acceptedPinGreen: True ... PASS: True` (srcDiffLines 7). This reproduces the re-review.
- **Green (verified).** The full suite of 79 tests is OK.
- **Not done: an endless generator for the stop row.** Base0 would hang on it until grade.sh's 120 s timeout. The raising generator fails base0 at once and tests the same thing.

## Tests, red and green

Commands were run in `/home/user/task5-handoff/wt/sr-pack` as `python3 tools/test_calibration_kit.py [names]`, with Python 3
and node 22 from `/opt/node22/bin` on PATH.

| test | red | green |
|---|---|---|
| SharedPack.test_grade_fix_wrong_fixes_of_d2_fail_on_the_accepted_pin, subtest `boundary` (new) | old row 1 `(["héllo"],3,b"h\xc3\xa9")`: PASS True, acceptedPinGreen True | FAIL on acceptedPinGreen only; probe `b'\xc3\xa9'` |
| same test, subtest `topcheck` (new) | old row 2 `(["ab","cd",3],4,b"abcd")`: PASS True, acceptedPinGreen True | FAIL on acceptedPinGreen only; probe `b'abcd' 3` |

## Guard-removal proofs

For each mutation, the ids and `source_hashes` were rebuilt with a scratch rehash script
(`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/fix2/rehash.py`). This way the
assertion decides the result, not make-repo's id check. After each proof the files were restored from copies, and
make-repo.sh reported "the ids equal manifest.json's". All proofs are verified:

1. **N-1:** the old row 1 put back -> red on `boundary`; restored -> green.
2. **N-2:** the sentinel row 2 put back -> red on `topcheck` only (`test_d2_...` stayed green); restored -> green.
3. **Alternative correct fix.** I also probed the reviewer's `alt` fix at HEAD's pin, outside grade.sh: in a copy of base's tree, a str branch that encodes, cuts, counts and breaks.
   - The pin and the shipped harness gave exit 0 (13 tests OK).
   - base0's source with the same pin gave exit 1.

## Checks

- **typecheck:** `python3 -m py_compile tools/calibration/subject-pack/shared/trees/*/src/*.py tools/calibration/subject-pack/shared/trees/*/tests/*.py` -> ok at HEAD (verified).
- **lint:** `python3 tools/check_secrets.py` -> "clean (0 hits)" (verified). The K3 hygiene scan is green as part of the kit suite (verified).
- **unit:** `python3 tools/test_calibration_kit.py` -> 79 tests OK, before each commit (verified).
- **full suite:** the regression gate through the pre-commit hook on both commits, "REGRESSION GATE: all checks PASS" (verified).
- **make-repo.sh at HEAD:** into a scratch target, it printed the three ids above and "the ids equal manifest.json's" (verified).

## Findings for the lead

1. **accepted0 moved twice this round**: from `ee3f596b...` to `0af40d53...`, then to `3517210b...`. review0 and base0 did not move. The manifest's hash changed too. Nothing is released, but a protocol written against round 1's ids is stale.
2. **Unchanged by this round.** The pin's two-row shape, the make-repo commit message ("its two-row pin") and D-2's `required_behaviour` are all unchanged. The rule already names both the UTF-8 byte count and the stop, and the pin now tests both literally.
3. **Bytecode caches.** I removed `__pycache__` directories under `tools/calibration/` that my test runs had created. They are ignored files, and none was tracked.

## What I got wrong and fixed

1. **Row 1 did not cut inside a character (round 1).**
   - **mistake:** fix round 1 (0d59cc9) shipped D-2's pin row 1 `(["héllo"], 3, b"h\xc3\xa9")` and described it as a cut inside a UTF-8 character. It cuts on a character boundary.
   - **where:** `trees/accepted/tests/test_pin.py` row 1 and its docstring, 0d59cc9's subject, and fix report 1's gist and R-1 section.
   - **impact:** a fix of D-2 that cuts text only at character boundaries graded PASS in the fix cell. Nothing was released. The fix-1 report overstated what the pin tests.
   - **cause:** I took the row from review 1's suggestion and trusted its description without encoding "héllo" and counting the bytes.
   - **fix:** 90de2cd. Row 1 is `(["héllo"], 2, b"h\xc3")`, and the `boundary` wrong fix is graded in the suite. 0d59cc9 was not rewritten; 90de2cd's message carries the correction.
   - **verified:** red on the old row, green on the new (see the table and proof 1).
2. **Row 2 did not test "never read" (round 1).**
   - **mistake:** row 2's sentinel tested "rejected if classified", not "never pulled", which the docstring and the rule claim.
   - **where:** `trees/accepted/tests/test_pin.py` row 2 (0d59cc9).
   - **impact:** a top-of-loop fix that pulls one extra chunk graded PASS. Nothing was released.
   - **cause:** I chose the sentinel to avoid a hang at base0 and did not check whether a pulled-but-unclassified chunk would still pass.
   - **fix:** 5760494, the raising generator.
   - **verified:** red on the sentinel row, green on the generator (see proof 2).
3. Nothing else to report from this round's own work: every edit applied on the first run and every guard went red when it should.
