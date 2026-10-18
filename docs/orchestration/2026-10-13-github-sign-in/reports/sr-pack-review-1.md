# sr-pack review 1: the shared synthetic subject pack (refute first)

Reviewer: fresh-eyed unit reviewer, refute first. Unit: sr-pack, worktree `/home/user/task5-handoff/wt/sr-pack`, branch
`tools/calibration-shared-pack`, base `229aa1f`, head `78a873f` (5 commits: 6605855, 163df1a, a80ea3e, 4db14a0, 78a873f).
Contract: `docs/orchestration/smartrouter/briefs/pack-builder.md` (P1-P6), the pack format
`tools/calibration/subject-pack/README.md`, proposal Item 2. Nothing in the worktree was modified; every probe ran in
the scratch directory `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-pack-review/`
(named `$S` below).

## Verdict: FIX

One S2 (the accepted pin does not discriminate D-2's required behaviour, so two wrong fixes grade PASS) and two S4.
Everything else the launch prompt asked to check holds, with the evidence below.

## Findings

### R-1 (S2): the accepted pin admits fixes that still break the bound; grade.sh grades them PASS

**Problem.** The fix case's only check that a candidate's fix repairs D-2 is the accepted test
(`trees/accepted/tests/test_pin.py`, placed at `tests/zz_accepted_pin.py` and run against the candidate's source). Its
two rows (`(["abc", "def"], 4, b"abcd")` and `([b"ab", "cdé", b"f"], 4, b"abcd")`) both cut a str chunk at an ASCII
character and never test the stop. D-2's own ground truth asks for both: `required_behaviour` "a str chunk's UTF-8
bytes count against limit", `cause` "neither the bound nor the stop applies to it", and SPEC.md "The bound" ("a text
chunk counts by its UTF-8 bytes ... Once limit bytes are taken, read_bounded reads no further chunk"). So a fix that
counts characters instead of UTF-8 bytes, or one that truncates the joined result at the end and still never counts
str chunks, passes the accepted pin, and grade.sh grades the fix cell PASS although the module still breaks its
promise. The shared pack exists so these cells compare across hosts; a false PASS here corrupts every host's fix cell
the same way.

**Reproduction (ran).** Pack built by `make-repo.sh $S/host/pack/repo`, manifest copied beside it, checkouts by
`historyless-checkout.sh --pack $S/host/pack $S/host/pack/repo base0 <cell> <branch>`, each with the candidate's own
D-2 test appended to `tests/test_bounded.py` and committed with the `fix(bounded): D-2 - ` prefix:

- `fix-chars`: the str branch becomes "cut the str to the room left in characters, append its encoding, count its
  characters" (`chunk = chunk[:limit - taken].encode(...)`; `taken += <characters>`; stop at limit).
  `grade.sh ... fix $S/host/cells/fix-chars` -> `PASS: True` (candidateGreen, guardRed, acceptedPinGreen, scopeOk all
  true, lint ok). In that checkout `read_bounded(["éééé"], 4)` returns 8 bytes and `read_bounded([b"ab", "ééé"], 4)`
  returns 6 bytes: the promise "never returns more than limit bytes" is still broken.
- `fix-trunc`: base0 with only `return join_parts(parts)[:limit]`. `grade.sh` -> `PASS: True`. In that checkout
  `read_bounded(("ab" for _ in itertools.count()), 5)` never returns (`timeout 5` exit 124), where accepted0 returns
  `b"ababa"`: the stop SPEC.md states is not restored.

**Fix (one line).** Make the accepted pin's two rows discriminate both halves of D-2 and rebuild the ids; for example
rows `(["héllo"], 3, b"h\xc3\xa9")` (a cut inside the UTF-8 bytes of a non-ASCII text chunk) and
`(["ab", "cd", 3], 4, b"abcd")` (the reader stops before a chunk it would reject). Verified in scratch: that pin is red
at base0 (one FAIL, one ERROR, exit 1), green at accepted0 (exit 0), and red against both `fix-chars` and `fix-trunc`
(exit 1). Then rebuild with make-repo.sh, rewrite the manifest's ids and hashes, and add both wrong fixes to the
`SharedPack` grade tests as FAIL cells.

### R-2 (S4): following the README's layout leaves `trees/accepted/` outside every mechanical guard

**Problem.** The pack README (step 1) tells the host to build the repository outside the kit's tree, so `pack_dir` is
not the kit's `subject-pack/shared/`, which holds `trees/accepted/` (the accepted fix and pin in plain files). The
launch refusal of `run.template.js` and `historyless-checkout.sh --pack` only compare paths with `pack_dir`, so a
checkout root inside the kit's `shared/trees/` is accepted. The README's step 3 does say "every checkout outside the
kit's tree as well as the pack directory (`trees/accepted/` holds the accepted fix)", so this is a documented host
duty that no check enforces, not a broken claim.

**Reproduction (ran).** `$S/b1/pack` is a copy of the kit's `shared/`. The template filled with
`pack_dir=$S/host/pack`, `checkout_root=$S/b1/pack/trees/checkouts` under the stub harness: `error: None`, 10 calls
launched. `historyless-checkout.sh --pack $S/host/pack $S/host/pack/repo base0 $S/b1/pack/trees/cand cal-x`: exit 0.

**Fix (one line).** Say in the pack README's step 3 that the guards cover only the pack directory, so the host checks
the kit path itself (or passes the kit's `shared/` as `pack_dir` when it builds `repo` there); a kit-side guard is a
kit change outside this unit's paths.

### R-3 (S4): "bytes-like" in the promise is wider in Python's own vocabulary than the code accepts

**Problem.** The promise says "bytes-like (bytes, bytearray, memoryview)". Python's glossary calls any buffer-protocol
object (`array.array`, `mmap`) a bytes-like object, and accepted0 raises `TypeError` on one. SPEC.md's "none: anything
else (an int, None, a list)" puts it outside the promise, so under the three-prong classification it is not a true
other finding, but a refute-first reviewer can file it and an adjudication has to spend a vote on it - the same noise
78a873f removed for a released memoryview and a limit of 0.

**Reproduction (ran).** In `$S/co/accepted` (history-less checkout of accepted0):
`read_bounded([array.array('b', [65, 66])], 4)` -> `TypeError: read_bounded: unsupported chunk type array`.
(For contrast, memoryviews with an int format, two dimensions, a stride, or zero dimensions all read correctly.)

**Fix (one line).** Name `array.array` and `mmap` in SPEC.md's "none" line as outside the promise, in every tree, with
the rebuild R-1 already needs.

## Checks run (all evidence from commands run by this reviewer)

1. **Rebuild twice, ids equal the manifest's and each other.** `make-repo.sh $S/b1/pack/repo` and, with another HOME,
   `make-repo.sh $S/b2/elsewhere/repo`: both print `review0 9f93403b...`, `base0 2b23fc8f...`,
   `accepted0 4c166406...` and "the ids equal manifest.json's", exit 0. A third build to `$S/host/pack/repo` (exit 0)
   is the one used for grading. The builder's hostile-host test (filters, CRLF, signing, legacy encoding, other
   default branch, foreign identity and dates) is green in the suite.
2. **Exactly the P2 defects per tree.** Commits are a linear `review0 -> base0 -> accepted0`, all files 100644, tags are
   plain refs. `git diff review0 base0` touches one line of `src/bounded.py` (D-1: `memoryview` added to the binary
   classification); `git diff base0 accepted0` touches two lines of `src/bounded.py` (D-2) plus the new
   `tests/test_pin.py`. Probe in history-less checkouts: review0 - memoryview raises `TypeError` (D-1), str streams
   return 6/7/2000 bytes over limits 4/4/5 (D-2); base0 - memoryview reads `b"abcd"`, D-2 still present; accepted0 -
   neither. Fix messages: base0 "fix(bounded): D-1 - ...", accepted0 "fix(bounded): D-2 - ...". The fixes are minimal
   (1 line, 2->1 lines).
3. **Shipped harness.** `python3 tests/run.py tests/test_bounded.py`: `Ran 12 tests`, exit 0 at review0, base0 and
   accepted0. No test touches memoryview or a str chunk crossing the limit; nothing names either fix. The accepted pin
   is green at accepted0.
4. **Manifest vs format README.** Every documented field is present (optional `commit_rule`, `instructions`,
   `commit_prefix`, `scope`, `map_file`, `allowed_extra`, `run_one` included); `kind shared`, `pack_version "1"`,
   `repository "repo"`, tiers T1, pass rules identical to the kit fixture's, pin finding D-2 with a two-row
   instruction, fix prefix `fix(bounded): D-2 - `, review scope naming all three functions, paths and commands as P4
   says, `checkout.links []`. `source_hashes` recomputed independently under the protocol convention: keys equal every
   pack file but the manifest, no mismatch. No finding text states a fix line. No S2 on fields.
5. **grade.sh on cells made with historyless-checkout.sh.** Host layout (`$S/host/pack` = manifest + repo):
   correct pin -> PASS (redAtHead, greenWithFix, srcClean, lint ok); pin green at base -> FAIL (redAtHead false); pin
   with wrong expected bytes -> FAIL (greenWithFix false); correct fix (accepted source + own row) -> PASS
   (srcDiffLines 3); an alternative correct fix with a new `tests/test_pin_text.py` -> PASS; fix + SPEC.md edit ->
   FAIL (scopeOk false, outOfScope `["SPEC.md"]`); fix with no test of its own -> FAIL (guardRed false). Every run
   `restored: true` and left the checkout clean. Two wrong fixes PASS: R-1.
6. **run.template.js under the stub harness.** Filled with this manifest and host paths outside the pack: `error:
   None`, pin/fix/review cells for the fixture profiles plus grade, cluster and lens calls; no candidate prompt names
   the pack directory, `trees/`, `make-repo`, `zz_accepted_pin` or any of the three ids, nor either fix line. The
   refusals fire: checkout root inside the pack, adjudication checkout inside the pack repository, pack inside the
   checkout root, unfrozen protocol (each `calls: 0`). Gap outside the pack directory: R-2.
7. **Hygiene, secrets, suite, gate.** The K3 regex set grepped over `tools/calibration/` (excluding `__pycache__` and
   `{{placeholders}}`): no hit. `bash -n make-repo.sh` and `py_compile` over every tree's Python: clean.
   `python3 -m unittest tools.test_calibration_kit` in the worktree (Node 24 on PATH, so the node-gated tests ran):
   `Ran 78 tests`, OK. In a scratch clone of the head with `core.hooksPath=.githooks` (the fresh clone first failed
   only `hook_wiring`, as a clone must): `tools/check_secrets.py` "clean (0 hits)"; `tools/run_regression.py` "all
   checks PASS", including `test_calibration_kit` (78 tests OK).
8. **Permitted paths.** `git diff --stat 229aa1f..HEAD`: 27 files, all under `tools/calibration/subject-pack/shared/`,
   plus `tools/test_calibration_kit.py`, `tools/calibration/README.md`, `tools/calibration/subject-pack/README.md`
   (one "The shared pack" paragraph each, plus the stub row and the limits bullet updated) and one CHANGELOG line. No
   kit script changed. `git status` clean after every probe.
9. **Docs name the defects without fix lines.** The pack README gives each defect a summary and cause; the builder's
   test checks no added fix line appears in it, and by reading: neither the README, the kit README paragraph nor the
   CHANGELOG line states a fix line. Sections P6 asks for are present (version, defects, files, how a host runs it,
   what it does not discriminate, when it is rewritten).

## Notes (not findings)

- The review prompt's severity scale calls "wrong behaviour against the spec that the shipped tests miss" S2, which
  is where a reviewer will place D-2; the manifest records it as S3 because P2 says so. The review pass rule does not
  read severity, so no grade changes.
- The commit trailers follow this session's attribution reminder (`Claude Opus 5.5`) rather than the
  `router-builder.md` line; noted, not judged.
