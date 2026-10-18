# sr-pack re-review 1: the shared synthetic subject pack after fix round 1 (refute first)

Reviewer: fresh refute-first reviewer. Unit: sr-pack, worktree `/home/user/task5-handoff/wt/sr-pack`, branch
`tools/calibration-shared-pack`, base `229aa1f`, head `8b72079`. This round's commits are `0d59cc9` (R-1), `8d1f023`
(R-2) and `8b72079` (R-3), on top of review 1's head `78a873f`. The contract is
`docs/orchestration/smartrouter/briefs/pack-builder.md` (P1-P6) and the pack format `tools/calibration/subject-pack/README.md`.

Nothing in the worktree was modified: `git status --short` is empty. The only untracked items are ignored
`__pycache__` directories, which the builder's runs created at 22:05. Every probe ran in
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-pack-rereview/` (named `$S`).
Python 3.11 was used, with node 22 on PATH.

## Verdict: FIX

R-2 and R-3 are fixed. R-1 is half fixed: both wrong fixes the first review built now grade FAIL, and correct fixes
still grade PASS. But the new row 1 does not test what its docstring, its commit subject and the fix report say it
tests. A third wrong fix still grades PASS (N-1, S3). A fourth, milder one also grades PASS (N-2, S4). One pin change
fixes both, and I checked it end to end through `grade.sh`. Everything else on the checklist holds.

## Earlier findings: re-run

### R-1 (S2): fixed for the two fixes it named; see N-1 and N-2 for the remainder

- **Re-run of the review's proof.** The cells were made with `historyless-checkout.sh --pack $S/host/pack` from base0
  `b41a7f9c` in a fresh `make-repo.sh` build. `fix-chars` graded `acceptedPinGreen false, PASS false`, and so did
  `fix-trunc`. In both, candidateGreen, guardRed and scopeOk were true and lint was ok. Both used to grade PASS.
  - verified: `$S/grades/fix-chars.json`, `fix-trunc.json`.
- **Red-first proof re-run.** In a clone of HEAD I put back the pin from `78a873f` and rebuilt the ids and source
  hashes (`$S/tools/rehash.py`), so that only the assertion decides. Then
  `SharedPack.test_grade_fix_wrong_fixes_of_d2_fail_on_the_accepted_pin` failed on both subtests with
  `acceptedPinGreen: True ... PASS: True`.
  - verified. The clone was then restored.
- **Correct fixes still PASS.**
  - `fix-ok` (the accepted source) graded PASS, with `srcDiffLines` as before.
  - `fix-alt` (encode, cut, count and break inside the str branch) graded PASS.
  - verified.
- **Rule.** D-2's `required_behaviour` now ends "and once limit bytes are taken read_bounded reads no further chunk".
  This matches SPEC.md and `cause` (read).

### R-2 (S4): fixed (documentation)

- Step 3 of the pack README now says that both guards compare paths only with `pack_dir`, and that the host checks
  the kit's path itself (read: `git show 8d1f023`).
- I re-ran the review's proof, which now shows the documented gap:
  - `historyless-checkout.sh --pack $S/host/pack ... $S/b1/pack/trees/cand` exits 0.
  - With the kit copy itself as `--pack`, it refuses with "inside the pack", exit 2.
  - `run.template.js`, filled with `checkout_root` inside the kit copy's `trees/`, returns `error None`, 10 calls
    (`$S/tools/launch2.py`).
  - verified.
- The README's claims are accurate. The kit-side guard stays a lead decision, as the fix report says.

### R-3 (S4): fixed (specification)

- All three trees' SPEC.md files are byte-identical and name `array.array` and `mmap` in the "none" line (diff, grep).
- In a history-less checkout of accepted0, `read_bounded([array.array('b',[65,66])],4)` and
  `read_bounded([mmap.mmap(-1,2)],4)` both raise `TypeError: read_bounded: unsupported chunk type ...` (verified).
- The suite's edges test asserts both.

## New findings

### N-1 (S3): row 1 of D-2's accepted pin cuts on a character boundary, not inside a character; a fix that never splits a character grades PASS

**Problem.** In `trees/accepted/tests/test_pin.py`, the docstring says "The first row cuts a text chunk inside the
UTF-8 bytes of a non-ASCII character". Commit `0d59cc9`'s subject says the pin "tests a cut inside a UTF-8
character", and the fix report says "(a cut inside a UTF-8 character)". The row is `(["héllo"], 3, b"h\xc3\xa9")`.
"héllo" encodes as `68 c3 a9 6c 6c 6f`, so a limit of 3 cuts after `é`, on a character boundary: `b"h\xc3\xa9"`
decodes cleanly to "hé".

So the pin cannot tell the accepted behaviour from a fix that cuts text only at character boundaries. SPEC.md asks
for the accepted behaviour twice: "The result is the chunks' bytes in order, cut at `limit`" and "a cut may fall
inside a character".

The row came from review 1's own suggested fix for R-1, which described it as "a cut inside the UTF-8 bytes of a
non-ASCII text chunk". The flaw starts there. The fixer's description then made it a claim the pin does not keep.

**Reproduction (ran).** `fix-boundary` is base0 with a str branch that appends whole characters while they fit,
counts their bytes, and stops at the first one that does not fit. The candidate's own test is the usual
`(["abc","def"],4) -> b"abcd"`, and the commit carries the `fix(bounded): D-2 - ` prefix.
- `grade.sh $S/host/pack/manifest.json fix $S/host/cells/fix-boundary` gives `candidateGreen, guardRed,
  acceptedPinGreen, scopeOk all true, lint ok, PASS true`.
- In that checkout, `read_bounded(["éé"], 3)` returns `b'\xc3\xa9'`, and `read_bounded(["éé", b"x"], 3)` returns
  `b'\xc3\xa9'`. accepted0, fix-ok and fix-alt return `b'\xc3\xa9\xc3'` for both (`$S/tools/probe.py`).
- The bound and the never-raises promise both hold, which is why this is S3 and not S2. The fix cell still grades a
  fix PASS when it diverges from SPEC's result shape, which is the class of false PASS that R-1 was opened to close.

**Fix (one line).** Make row 1 `(["héllo"], 2, b"h\xc3")`, which really cuts inside `é`. Rebuild with make-repo.sh;
only accepted0 moves. Then add `boundary` to the wrong-fix subtests.

### N-2 (S4): row 2 cannot tell "never pulled" from "pulled and dropped"; a fix that checks the bound at the top of the loop grades PASS

**Problem.** Row 2, `(["ab", "cd", 3], 4, b"abcd")`, tests the stop with a sentinel that read_bounded rejects only
once it classifies it. The pin's docstring says "it is never read". The manifest rule, which the pin case gives its
candidate as "the rule", says "once limit bytes are taken read_bounded reads no further chunk".

A fix that checks `taken >= limit` at the top of the loop pulls the sentinel from the iterable and drops it without
classifying it, so the row passes.

**Reproduction (ran).** `fix-topcheck` is base0 with the str branch encoding and falling through to the shared cut and
count, and the bound checked at the top of the loop.
- `grade.sh` gives PASS (all flags true).
- With a generator that records its pulls, `read_bounded(g(), 4)` returns `b'abcd'` after 3 pulls. accepted0 stops
  after 2.
- The promise holds and an endless iterable still terminates; only a source that blocks or has side effects on a
  pull sees the extra read. Hence S4.

**Fix (one line, same change as N-1).** Make row 2 a stream that fails if pulled past the limit, for example a
generator `text_then_unreadable("ab", "cd")` that yields both texts and then raises AssertionError. Base0 still goes
red at once (its str branch never stops), so there is no timeout.

**Proposed pin, checked end to end.**
- Rows: `(["héllo"], 2, b"h\xc3")` and `(text_then_unreadable("ab", "cd"), 4, b"abcd")`.
- The file is at `$S/pins/zz_strong_pin.py`.
- Run with `tests/run.py`, it gives exit 1 at review0, base0, chars, trunc, boundary and topcheck, and exit 0 at
  accepted0, ok and alt. verified.
- Through `grade.sh`, in a scratch pack whose accepted0 carries it (rebuilt ids: review0 and base0 unchanged,
  accepted0 `362feca9`):
  - fix-ok PASS and fix-alt PASS.
  - chars, trunc, boundary and topcheck FAIL on `acceptedPinGreen` alone.
  - noguard FAIL (guardRed) and scope FAIL (scopeOk).
  - pin-ok PASS, pin-greenatbase FAIL (redAtHead), pin-wrongbytes FAIL (greenWithFix).
  - verified (`$S/grades/p2-*.json`).

## Whole-unit checklist (same as review 1)

1. **Trees and ids.**
   - `make-repo.sh $S/host/pack/repo` printed review0 `46c1cb9c...`, base0 `b41a7f9c...` and accepted0 `ee3f596b...`
     with "the ids equal manifest.json's", exit 0.
   - The manifest carries the same ids in `cases.review.base`, `cases.pin.base` and `cases.fix.base` (base0), and in
     `accepted_fix` (accepted0).
   - History is linear (review0 -> base0 -> accepted0). The tags are plain refs, and all 7 files are mode 100644.
   - verified.
2. **Defects per tree.**
   - `git diff review0 base0`: one line in `src/bounded.py` (D-1, memoryview added to the binary check).
   - `git diff base0 accepted0`: two lines in `src/bounded.py`, replaced by one (D-2), plus `tests/test_pin.py`.
   - Fix messages name D-1 and D-2. The probes show D-2 present at base0 and review0 (`["éé"],3` gives 4 bytes;
     a pull count of 4 at limit 4) and absent at accepted0.
   - verified.
3. **Manifest against the format.**
   - The keys are `_lineage, pack, pack_version, kind, repository, subject, commit_rule, accepted_fix, findings,
     cases, paths, commands, checkout, source_hashes, isolation`, as in review 1.
   - The D-1 and D-2 findings carry every field. No finding text states a fix line.
   - I recomputed `source_hashes` independently: the keys equal `git ls-files` of the pack minus the manifest, with
     no mismatch.
   - verified.
4. **grade.sh on the four cells, plus the wrong ones.**
   - pin: the correct pin PASSes; one green at base FAILs (redAtHead false); one with wrong bytes FAILs
     (greenWithFix false).
   - fix: the correct fix PASSes, and so does the alternative correct fix. A scope break FAILs (outOfScope
     `["SPEC.md"]`); no own test FAILs (guardRed false); chars and trunc FAIL. Boundary and topcheck PASS (N-1, N-2).
   - Every grade reports `restored: true` and leaves the checkout clean.
   - verified.
5. **Launch.**
   - `run.template.js` under the kit's stub harness (`execute_template`), filled with this manifest and host paths
     outside the pack, returns `error None`, with 10 calls: pin, fix, two reviews, two grades, cluster and three
     lenses.
   - No pin, fix or review prompt names the pack directory, `trees/`, `make-repo`, `zz_accepted`, any of the three
     ids, either fix line, or the new pin's rows.
   - The refusals fire, each with 0 calls: checkout root inside the pack, adjudication checkout inside the pack
     repository, pack inside the checkout root, and an unfrozen protocol.
   - verified.
6. **Hygiene.** `Hygiene` (K3) is part of the suite, which ran green. `check_secrets: clean (0 hits)`. verified.
7. **Gate.** In a scratch clone of `8b72079` with `core.hooksPath=.githooks`:
   - `tools/test_calibration_kit.py`: Ran 79 tests, OK.
   - `tools/run_regression.py`: "REGRESSION GATE: all checks PASS" (75 s).
   - verified.
8. **No other file changed.**
   - `git diff --name-only 229aa1f..HEAD`, filtered by the brief's permitted paths, leaves nothing.
   - The three fix commits touch only `shared/{manifest.json, README.md, trees/accepted/tests/test_pin.py,
     trees/*/SPEC.md}` and `tools/test_calibration_kit.py`. No tree source changed.
   - Each commit is authored by StepenkoAnatoli and carries the five named parts and the `Co-Authored-By` and
     `Claude-Session` trailers.
   - verified.

## Notes (not findings)

- If the pin changes as proposed, accepted0 moves a third time. review0 and base0 do not move, and the manifest hash
  changes. Nothing has been released yet.
- The commit subject of `0d59cc9` and the fix report's gist overstate row 1 (N-1). A history rewrite is not
  warranted: the follow-up commit's report should correct the claim.
