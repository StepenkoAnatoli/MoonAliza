# Unit sr-pack: the shared synthetic subject pack (onboarding proposal Item 2, "shared pack")

Worktree and branch: created by the lead from SmartRouter branch `tools/calibration-kit` at 229aa1f (the kit, PR #106,
not yet merged; this unit stacks on it). Work only under `tools/calibration/subject-pack/shared/`,
`tools/test_calibration_kit.py` (new tests for the pack), `tools/calibration/README.md` and
`tools/calibration/subject-pack/README.md` (one paragraph each naming the shared pack), `CHANGELOG.md` (one Unreleased
line), plus your report file in the MoonAliza run folder named in the launch prompt. SmartRouter's pre-commit hook runs
the regression gate on every commit (about a minute); never --no-verify, never unwire it; no push. Commit identity and
trailer lines as in the MoonAliza brief `briefs/router-builder.md`; five-part commit reports; red-first tests with
guard-removal proofs. Reports: full report to the path the launch prompt names, a gist of at most five lines returned.

## Why

The kit (`tools/calibration/`) defines the pack format (`subject-pack/README.md`) and leaves `subject-pack/shared/` as a
stub. The onboarding proposal's Item 2 wants a shared pack every host runs, so its cells compare across hosts: "a small
self-contained module with two seeded defects of the same shape the runs used (a rejection that breaks a 'nothing
rejects' promise; a bound skipped on an unexpected input), with its spec, its tests and its accepted fix", synthetic on
purpose (no host's private code travels), versioned, rewritten when it leaks. This unit builds it.

## The lead's decisions

P1. **Subject.** A Python module, standard library only, of about 60-120 lines: `src/bounded.py` with a function
    `read_bounded(chunks, limit)` that consumes an iterable of chunks and returns at most `limit` bytes, plus one or
    two helpers (a chunk classifier, a joiner), with a docstring that states the promise: "read_bounded accepts any
    iterable whose items are bytes-like (bytes, bytearray, memoryview) or str (encoded as UTF-8), never raises on such
    input, and never returns more than limit bytes". `SPEC.md` (the specification, two or three sections: the promise,
    the chunk kinds, the bound) and `tests/test_bounded.py` (the shipped harness, unittest, about 8-12 tests that are
    green on the accepted tree and name nothing of the defects' fixes). The resemblance to any real module stops at
    the shape; invent names and wording, copy no host code.
P2. **Two seeded defects, both S3, in the shapes the proposal names.**
    - D-1 (the rejection): on the review tree only, a `memoryview` chunk makes `read_bounded` raise `TypeError`
      ("nothing rejects" broken). Present at `review0`, absent at `base0` (the fix and pin cases do not carry it, so a
      fix candidate cannot stumble on it), fixed in `accepted0`'s lineage.
    - D-2 (the skipped bound): on the base and review trees, a `str` chunk is appended after encoding without being
      counted against the bound, so a stream of str chunks exceeds `limit`. Present at `review0` and `base0`, fixed at
      `accepted0`. The pin case's rule and the fix case's finding.
    The accepted fix is minimal (one or two lines per defect) and its commit message names the defect ids.
P3. **Trees and repository.** The pack ships its trees as directories, never a nested `.git`: `trees/review/`
    (D-1 and D-2 present), `trees/base/` (D-2 present), `trees/accepted/` (neither). `make-repo.sh <target>` builds the
    pack repository at `<target>` from them with fixed author, committer, dates and messages, so the three commit ids
    are deterministic; `manifest.json` carries those ids as `cases.review.base` (review0), `cases.pin.base` and
    `cases.fix.base` (base0) and `accepted_fix` (accepted0), and `repository` is the path `make-repo.sh` was given
    (document that the host runs `make-repo.sh` outside the kit's tree, e.g. under its checkout root's parent, and
    writes the path into its protocol; the committed manifest carries the default `repo`, built beside the manifest
    only for the kit's tests). The test asserts the rebuilt ids equal the manifest's.
P4. **Manifest.** Every field of the format, in the format's words: `kind: shared`, `pack_version: "1"`, the three
    cases at `T1` with pass rules copied from the kit's fixture manifest's shapes, the pin as a two-row test for D-2's
    rule, the fix with a commit prefix, the review covering `read_bounded` and its helpers with both findings;
    `paths` (source `src/bounded.py`, test file `tests/test_bounded.py`, new test pattern `^tests/test_pin.*\.py$`,
    accepted test placed at `tests/zz_accepted_pin.py`, scratch `tests/scratch_{name}.py`); `commands.test` as
    `python3 tests/run.py {files}` with a shipped runner that loads test files by path and exits non-zero on failure
    (`test_report: exit-code`), `commands.lint` as `python3 -m py_compile {files}`, timeout 120; `checkout.links` empty;
    `source_hashes` of every pack file; the isolation statement.
P5. **Tests** in `tools/test_calibration_kit.py` (a new `SharedPack` class): `make-repo.sh` yields three commits with
    the manifest's ids and the trees' contents; the shipped harness is green on the accepted tree, D-2's accepted pin
    is red at base and green at accepted, D-1's reproduction raises at review and not at accepted; `grade.sh` with
    this manifest grades a correct pin cell PASS (the accepted pin placed as the candidate's new test) and a wrong one
    FAIL, a correct fix cell PASS (the accepted source as the candidate's change with a pin) and a scope-breaking one
    FAIL; `run.template.js` filled with this pack passes the launch refusals under the stub harness (as the kit's
    launch tests do); the K3 hygiene scan still passes over the pack; and `check_secrets` stays green.
P6. **Docs.** `subject-pack/shared/README.md` replaces the stub: what the pack is, its version, its two defects in one
    sentence each (summary and cause, never the fix line), how a host builds the repository and runs the cells, what
    it does not discriminate (anything past the bounded T1 shape), and when it is rewritten. One paragraph each in
    the kit README and the pack-format README; one CHANGELOG line.

## Deliverables and stop triggers

A. `tools/calibration/subject-pack/shared/` per P1-P4, P6. B. Tests per P5, red-first with guard proofs. C. The
docs lines. D. The regression gate green through the pre-commit hook on every commit. Stop and report if the kit's
`grade.sh` or `run.template.js` cannot run this pack without a change to the kit itself (report the needed change;
do not edit kit files outside the permitted paths).
