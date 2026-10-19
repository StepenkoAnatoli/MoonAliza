# sr-pack re-review 2: the shared synthetic subject pack after fix round 2 (refute first)

Reviewer: a fresh refute-first reviewer.

- **Unit:** sr-pack.
- **Worktree:** `/home/user/task5-handoff/wt/sr-pack`, branch `tools/calibration-shared-pack`.
- **Commits:** base `229aa1f`, head `5760494`. This round's commits are `90de2cd` (N-1) and `5760494` (N-2), on top
  of re-review 1's head `8b72079`.
- **Contract:** `docs/orchestration/smartrouter/briefs/pack-builder.md` (P1-P6) and the pack format
  `tools/calibration/subject-pack/README.md`.
- **Severity scale:** from `briefs/router-reviewer.md`, applied as in the earlier sr-pack reviews. R-1 was S2: a fix
  that breaks the promise grades PASS.

**Nothing in the worktree was modified.** `git status --short` is empty and HEAD is still `5760494`.

- The ignored `__pycache__` directories predate this review. The newest is
  `tools/calibration/__pycache__/observations.cpython-311.pyc`, written at 23:02:49, which is after the last commit.
  The fix report says those were removed. They are ignored and untracked, so this is not a finding.
- Every probe ran under `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-pack-rereview-2/`
  (`$R` below).
- I used Python 3.11 and node 22 (`/opt/node22/bin`).
- I imported the kit test module with `PYTHONDONTWRITEBYTECODE=1`, so the import wrote nothing into the worktree.

## Verdict: FIX

N-1 and N-2 are fixed. I re-ran both red-first proofs and both wrong fixes through `grade.sh`. Everything else on the
checklist holds.

One new finding of the same class remains: N-3 (S2). A D-2 fix that cuts a str chunk at `limit`, not at the room
left, still lets the result exceed `limit` bytes. The accepted pin is green against it, so the fix cell grades it PASS
whenever the candidate's own test cuts only a first chunk.

The fix is one token in the pin. I checked it end to end through `grade.sh`.

## Earlier findings: re-run

### N-1 (S3): fixed

- **Pin row.** Row 1 is now `("héllo", ["héllo"], 2, b"h\xc3")`. "héllo" encodes as `68 c3 a9 ...`, so limit 2 falls
  between `c3` and `a9`, inside the character.
  - The docstring says so, and it is accurate.
  - Commit `90de2cd` carries the correction of `0d59cc9`'s subject in its five-part message.
- **Re-run through grade.sh (verified).** I built fresh cells from base0 `b41a7f9c` in a fresh `make-repo.sh` build
  of HEAD's pack (`$R/host/pack`). The boundary-only fix (`$R/tools/variants.py boundary`, with the usual own test
  `(["abc","def"],4) -> b"abcd"` and the `fix(bounded): D-2 - ` prefix) graded:
  - `candidateGreen`, `guardRed` and `scopeOk` true, lint ok.
  - `acceptedPinGreen false`, `PASS false`.
  - It graded PASS in re-review 1. Grade file: `$R/grades/fix-boundary.json`.
- **Red-first proof (verified).** I worked in a scratch clone of `5760494` (`$R/clone`).
  1. Put the old row `(["héllo"], 3, b"h\xc3\xa9")` back.
  2. Rebuilt the ids and source hashes (`$R/tools/rehash.py`), so that only the assertion decides.
  3. Ran `SharedPack.test_grade_fix_wrong_fixes_of_d2_fail_on_the_accepted_pin`. It failed on subtest `fix='boundary'`
     only, with `acceptedPinGreen: True ... PASS: True` and `srcDiffLines: 12`.
  4. Restored the clone (`git checkout -- .`). The test was OK.

### N-2 (S4): fixed

- **Pin row.** Row 2 is now `texts_then_no_more("ab", "cd")` with limit 4. The generator raises AssertionError on the
  next pull.
  - The rows are built inside `test_rows`, so a run never sees a spent generator.
  - At review0 and base0, the pin fails at once on both rows: `6 not less than or equal to 2`, and "read_bounded pulled
    a chunk after limit bytes were taken". It does not hang. At accepted0 it exits 0. (verified)
- **Re-run through grade.sh (verified).** The top-of-loop fix (`variants.py topcheck`) graded `acceptedPinGreen false`
  and `PASS false`, with the other flags true. It graded PASS in re-review 1.
- **Red-first proof (verified).** In the same clone I put the sentinel row `["ab","cd",3]` back and rehashed.
  - The test failed on subtest `fix='topcheck'` only, with `acceptedPinGreen: True ... PASS: True` and
    `srcDiffLines: 7`.
  - `test_d2_the_accepted_pin_is_red_at_base_and_review_and_green_at_accepted` stayed green.
  - After restoring, the test was OK.

## New finding

### N-3 (S2): a D-2 fix that cuts a str chunk at `limit` instead of at the room left breaks the bound, and the accepted pin is green on it

**Problem.** Both pin rows cut a text chunk only when nothing has been taken before it.

- Row 1 has a single chunk.
- In row 2, "cd" exactly fills the room left after "ab", so it is never cut at all.

So the pin cannot tell `enc[:limit - taken]` (accepted) from `enc[:limit]`. The latter is a slip of exactly D-2's kind:
the text's bytes are counted, but the cut ignores what earlier chunks took.

- That fix returns `read_bounded(["abc","abc"], 4) == b"abcabc"` (6 bytes).
- It also returns `read_bounded([b"ab","cdef"], 3) == b"abcde"` (5 bytes).

This breaks the promise ("never returns more than limit bytes") and D-2's `required_behaviour` ("the result never
exceeds limit bytes whatever mix of str and bytes-like chunks"). It reproduces D-2's own `summary`.

This is the class R-1 was opened for: a fix that does not fix the defect grades PASS. The fix cell's pass rule leaves
the accepted pin as the only independent check. Here the accepted pin passes the fix, so the result depends wholly
on the candidate's own test. A candidate whose fix has this slip will often write a matching test that cuts a single
chunk.

**Reproduction (ran, verified).** The variant is `$R/tools/variants.py slicelimit`. Its str branch is
`enc = chunk.encode("utf-8", "replace")[:limit]; parts.append(enc); taken += len(enc); if taken >= limit: break;
continue`. Each cell is built from base0 in a fresh build of HEAD's pack and committed with the `fix(bounded): D-2 - `
prefix.

| cell | own test | candidateGreen | guardRed | acceptedPinGreen | scopeOk | lint | PASS |
|---|---|---|---|---|---|---|---|
| `fix-slicelimit-own1` | `(["abcdef"],4) -> b"abcd"` and `(["héllo"],2) -> b"h\xc3"` | true | true | **true** | true | ok | **true** |
| `fix-slicelimit` | the usual `(["abc","def"],4) -> b"abcd"` | false | true | **true** | true | ok | false |
| `fix-ok-own1` / `fix-alt-own1` (control) | same as own1 | true | true | true | true | ok | true |

- Grade files: `$R/grades/fix-slicelimit-own1.json` and `fix-slicelimit.json`.
- Probe `$R/tools/probe.py` in the slicelimit-own1 checkout prints `['abc','abc'],4: b'abcabc'` and
  `[b'ab','cdef'],3: b'abcde'`.
- accepted0, ok and alt print `b'abca'` and `b'abc'`.

**Fix (one token, checked end to end).** Make row 2 `texts_then_no_more("ab", "cde"), 4, b"abcd"`, so that its second
text is cut after 2 bytes are taken. Rename its label to match, for example "ab, cde, then no more". Rebuild with
make-repo.sh. Then add `slicelimit` to `SharedPack.wrong_fix`, with an own test that cuts a single chunk, because
the usual own test would mask it.

I checked this in a scratch pack (`$R/p2`) that carries the changed row. It rebuilt with review0 `46c1cb9c` and base0
`b41a7f9c` unchanged, accepted0 `069d9087...`, and "the ids equal manifest.json's". Grades are in `$R/grades2/`:

- `ok` and `alt` PASS, with both the usual own test and own1.
- `slicelimit` (own1 and usual), `chars`, `trunc`, `boundary`, `topcheck`, `assign` (taken set instead of added) and
  `nobreak` (no stop in the str branch) all FAIL. Each fails on `acceptedPinGreen`; usual-test `slicelimit` also fails
  `candidateGreen`.
- The pin cell with the changed pin as the candidate's test grades PASS (`redAtHead`, `greenWithFix`, `srcClean`
  true).
- The kit's `SharedPack` class runs 20 tests OK in `$R/clone` with the changed pin and rehashed manifest (clone
  restored afterwards).
- base0 stays red at once: its str branch never stops, so it pulls past "cde" and the generator raises.

## Whole-unit checklist (same as the first review)

1. **Trees and ids.** (verified)
   - `make-repo.sh $R/host/pack/repo` (HEAD's pack, from `git archive HEAD`) printed:
     - review0 `46c1cb9c8dc8029a45e3f5c02c5092224c701df2`
     - base0 `b41a7f9c2c38c3caef06ceb0a3987e19098f759b`
     - accepted0 `3517210bbece5e49d527e6d27d6fe18da8e5920c`
   - It reported "the ids equal manifest.json's", exit 0.
   - The manifest's `cases.review.base` is review0. `cases.pin.base` and `cases.fix.base` are base0. `accepted_fix`
     and D-2's `accepted_fix` are accepted0.
   - History is linear. The tags are plain refs to commits. All 7 files are mode 100644.
   - Author and committer are "Calibration Kit", dated 2026-01-01, 01-02 and 01-03 UTC.
   - No other file carries a stale accepted0 id: `git grep` for `ee3f596`, `0af40d5` and `3517210` finds only the
     manifest's two fields.
2. **Defects per tree.** (verified)
   - `git diff review0 base0` changes one line in `src/bounded.py`: D-1, memoryview added to the binary check.
   - `git diff base0 accepted0` replaces two lines with one in `src/bounded.py` (D-2) and adds `tests/test_pin.py`.
   - The commit messages name D-1 and D-2.
   - Probes: at review0 and base0, `["éé"],3` gives 4 bytes and four pulls at limit 4. At accepted0 it gives
     `b'\xc3\xa9\xc3'` with two pulls.
3. **Manifest against the format.** (verified)
   - The keys are unchanged: `_lineage, pack, pack_version, kind, repository, subject, commit_rule, accepted_fix,
     findings, cases, paths, commands, checkout, source_hashes, isolation`. All three cases are at T1.
   - I recomputed `source_hashes` independently. The 22 keys equal `git ls-files` of the pack minus the manifest, with
     no mismatch.
   - This round changed only accepted0 (twice) and `test_pin.py`'s hash.
4. **grade.sh on the four cells, plus wrong ones** (HEAD's pack). Every grade reports `restored: true` and leaves the
   checkout clean. (verified)

   | case | cell | result |
   |---|---|---|
   | pin | the accepted pin as the candidate's test | PASS |
   | pin | green at base | FAIL (`redAtHead` false) |
   | pin | wrong bytes | FAIL (`greenWithFix` false) |
   | fix | `ok` | PASS |
   | fix | `alt` | PASS |
   | fix | scope break (SPEC.md) | FAIL (`outOfScope ["SPEC.md"]`) |
   | fix | no own test | FAIL (`guardRed` false) |
   | fix | `chars`, `trunc`, `boundary`, `topcheck`, `assign`, `nobreak` | FAIL on `acceptedPinGreen` |
   | fix | `nocut`, `listfirst` | FAIL |
   | fix | `slicelimit` with a single-chunk own test | PASS (N-3) |

5. **Launch.** `run.template.js` ran under the kit's stub harness (`execute_template`), filled with HEAD's manifest
   and host paths outside the pack (`$R/tools/launch.py`). (verified)
   - It returned `error None` with 10 calls: pin, fix, two reviews, two grades, cluster and three lenses.
   - No pin, fix or review prompt contains any of these: the pack directory, `trees/`, `make-repo`, `zz_accepted_pin`,
     `texts_then_no_more`, `héllo`, `h\xc3`, "then no more", any of the three ids, or either fix line.
   - The refusals fire, each with 0 calls: checkout root inside the pack, adjudication checkout inside the pack
     repository, pack inside the checkout root, and an unfrozen protocol.
6. **Hygiene.** The K3 `Hygiene` class is part of the kit suite, which ran green. `python3 tools/check_secrets.py`
   printed "clean (0 hits)". `py_compile` passed for every tree's `src` and `tests` file. (verified)
7. **Gate.** In the scratch clone of `5760494` with `core.hooksPath=.githooks`: (verified)
   - `python3 tools/test_calibration_kit.py` ran 79 tests, OK (13 s).
   - `python3 tools/run_regression.py` printed "REGRESSION GATE: all checks PASS" (75 s). The `FAIL-CLOSED` lines in
     its output are expected test output.
   - The first gate run, before I set hooksPath in the clone, failed only on `hook_wiring`, as expected for an unwired
     clone.
8. **No other file changed.** (verified)
   - `git diff --name-only 229aa1f..HEAD`, filtered by the brief's permitted paths, leaves nothing.
   - This round's two commits touch only `shared/manifest.json`, `shared/trees/accepted/tests/test_pin.py` and
     `tools/test_calibration_kit.py`. No tree source, SPEC.md or README changed. The READMEs still describe a two-row
     pin, which is true.
   - All 10 commits are authored by StepenkoAnatoli, carry the five named parts and end with the `Co-Authored-By` and
     `Claude-Session` trailers.
   - No `--no-verify` was used, and nothing was pushed (the branch is local).

## Notes (not findings)

- If N-3's change is taken, accepted0 moves again. review0 and base0 do not move, and nothing is released.
- `5760494`'s message says accepted0 moves "a fourth time", and `90de2cd`'s says "a third time". This is consistent
  with the history. The fix report's revert note is accurate: the two commits conflict on the same manifest lines
  because the ids are deterministic.
- `$R/tools/rehash.py` re-serialises the manifest with a different indent. It was used only in scratch copies, never in
  the worktree.
