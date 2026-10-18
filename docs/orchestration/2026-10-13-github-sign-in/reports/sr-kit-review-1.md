# sr-kit refute-first review 1: the calibration kit (`tools/calibration/`)

- Unit: sr-kit, worktree `/home/user/task5-handoff/wt/sr-kit`, branch `tools/calibration-kit`, base `7f7fc75`, head `4129317` (six commits, 435960f..4129317, not pushed).
- Contract: `briefs/kit-builder.md` (K1-K5), the proposal `docs/proposals/calibration-first-onboarding.md` Items 2-4.2, conventions of `briefs/router-builder.md`, severities S1-S4 of `briefs/router-reviewer.md`.
- Reviewer: refute-first, read-only on the worktree. Every probe ran under `<scratchpad>/sr-kit-review/` (temporary pack repository, checkouts, trace directories, a scratch copy of the kit for guard proofs). Python ran with `PYTHONDONTWRITEBYTECODE=1` against the worktree, so the only files written there are none (`git status --short` is empty after every run; the git-ignored `tools/calibration/__pycache__/` was already there from the builder's run).
- Verdict: **FIX**. Two S2 and one S3. Everything else on the checklist held.

## Findings

### F1 (S2): `grade.sh` grades a correct candidate FAIL when the swapped source files keep the same size, and the kit's test hides it

**Problem.** `grade.sh` swaps the manifest's source files in place (`put(accepted)`, `put(base)`, `restore()`) and runs the test command after each swap. Each swap keeps the file's size, and its mtime changes by less than a second. Any test runner that validates a cache by mtime and size then runs stale code. Python's bytecode cache works this way: `__pycache__/*.pyc` stores the source mtime in seconds and the source size. When the base and accepted versions are the same length (a one-character defect such as `a - b` against `a + b`, or `<` against `<=` plus one character elsewhere), the run after a swap executes the previous version. The result changes from run to run.

**Reproduction (verified).** I made a temporary pack: `src/mod.py` is `return a - b` at the base and `return a + b` in the accepted fix, which is the same size. I made history-less checkouts with `historyless-checkout.sh --pack`, then graded with `bash tools/calibration/grade.sh <pack>/manifest.json <case> <checkout>`:

| candidate | PYTHONDONTWRITEBYTECODE=1 | default environment, fresh `__pycache__` (three runs) |
|---|---|---|
| fix-green (correct fix, pin, map) | PASS, acceptedPinGreen true | FAIL every time: acceptedPinGreen false in run 1, then guardRed false in runs 2 and 3 |
| pin-green (correct two-row pin) | PASS | PASS once, FAIL once (greenWithFix false) |

The kit's own tests set `PYTHONDONTWRITEBYTECODE="1"` in the environment they hand `grade.sh` (`tools/test_calibration_kit.py:54`). In a scratch copy with only that variable removed, `python3 tools/test_calibration_kit.py Scripts` fails three tests on each of three runs: `test_grade_fix_green_candidate_passes`, `test_grade_pin_red_then_green_with_the_accepted_fix_passes` and `test_grade_reads_a_counting_report`. The kit's own fixture pack uses `python3 -m unittest`, and a host's shell has no such variable set, so this is the default path.

**Impact.** Correct pin and fix cells are recorded as FAIL, depending on timing. A FAIL blocks a category until two later passes under the host's rules, so one wrong grade costs real runs. Run 3 used vitest and did not hit this, but the shared pack is not built yet and any Python or mtime-cached pack will.

**Fix.** After every `put()` and `restore()`, set each swapped file's mtime to a value that is new and at least two seconds away from the last one (`os.utime(path, ns=...)`), and put the original mtime back at the end. Alternatively, run the test command with the caches invalidated, but the mtime bump is runner-independent. Add a red-first test that grades a same-size swap with the bytecode cache on. The kit test must not set `PYTHONDONTWRITEBYTECODE` for `grade.sh`.

### F2 (S2): `--link` gives every candidate a filesystem path into the pack repository, so the accepted fix is reachable

**Problem.** `historyless-checkout.sh --link NAME` creates `TARGET/NAME -> SOURCE_REPO/NAME`, and `SOURCE_REPO` is the pack's repository (README step 3: `<pack dir>/<repository>`). That repository holds the accepted fix in its history. The `--pack` check compares only TARGET's own path. `run.template.js`'s `shares()` compares strings only. Neither follows the link. The candidate prompt says "Do not read or modify anything outside your checkout" but no longer names the forbidden path, which run 3's prompt did. Run 3 had the same exposure, but its prompt named the repository it forbade.

**Reproduction (verified).** I ran `historyless-checkout.sh --pack <s>/pack --link node_modules <s>/pack/repo <base> <s>/co/pin-a cal/pin-a`. It answers `ok ... one commit`, and the checkout's own `.git` cannot reach the fix (`git cat-file -t <accepted>` gives exit 128). Then, from inside the checkout:

```
$ git -C node_modules/.. log --oneline --all
38d9178 fix: SECRET-FIX-MESSAGE
f1d1c32 base
$ git -C node_modules/.. show HEAD:src/mod.py
def add(a, b):
    return a + b
$ readlink -f node_modules/..
<s>/pack/repo
```

**Impact.** Item 2's isolation ("the accepted answer is unreachable", "no candidate checkout shares a filesystem path with the pack") does not hold for any pack that needs `--link`. Any Node pack needs it, as run 3 did. The kit's README and the script header both claim the property.

**Fix.** Make `--link` take an explicit dependency directory (for example `--link NAME=DIR`). Refuse it when `realpath(DIR)` is inside the pack directory or inside SOURCE_REPO, and say in the pack README that installed dependencies live outside the pack. Alternatively, copy the dependency tree instead of linking it. In `run.template.js`, either resolve link targets in the launch check or state that this is the host's duty. Add a test that `--pack` together with `--link` into the pack is refused.

### F3 (S3): the launch step's refusals are defeated by the template's own `{{placeholders}}`

**Problem.** The README (step 5) says the launch refuses "a judging profile with neither its qualification nor the bootstrap line". The check in `run.template.js` is `JUDGE.qualification == null && unfilled(JUDGE.limitation)`. `protocol.template.json` ships `qualification` as a `{{...}}` string, so an unfilled protocol passes. Any limitation text is accepted, although Item 3.3 requires the exact line "judging profile not independently qualified". The launch does not scan the protocol for leftover placeholders, so unfilled profiles launch agents.

**Reproduction (verified).** I ran the filled template under the kit's stub harness, using `execute_template` and `run_config` imported from the test module, in a scratch directory:

- `judging_profile.qualification` and `.limitation` set to the template's placeholder strings: no error, 10 agents launched.
- `qualification` placeholder, `limitation` null: launched.
- `qualification` null, `limitation` "trust me": launched.
- `relayed_operator_text` = `{"text": null}`, with no statement: launched.
- The template's protocol as shipped, with only `frozen_at` and the judge's model and effort filled: launched `pin:{{model alias}}-{{effort}}` with model `{{model alias as the host requests it}}`.

`request.py` would then print "qualification: {{...}}" into the pull-request body.

**Impact.** Item 3.3's bootstrap limitation can be missing, or replaced by a placeholder, without any refusal. A run can start with unfilled profiles. On a harness that falls back to a default model, those cells would be recorded under the wrong profile.

**Fix.** In the launch step, refuse any string containing `{{` anywhere in `RUN.protocol`, using a recursive scan. Treat a placeholder qualification as unset. Require `limitation` to start with "judging profile not independently qualified" when `qualification` is null. Require `relayed_operator_text.statement`. Add one red-first test per refusal.

## Checklist: what was checked and held

1. **K2 files and lineage.** All twelve files exist, and each has a one-line lineage header naming the run-3 artefact it generalises. `protocol.template.json` carries the lineage in its `_lineage` key. The shared-pack README is a stub, and its lineage line names the proposal.
2. **Generalisation against the run-3 working files.**
   - Grader. The prompt is `sr-calibration-3.js`'s grader with the ground truth, module and test command made placeholders. The GRADE schema's `r8*`/`r11*` fields become one `truth[]` entry per finding, and `others`, `falseBlocking`, `copiedFromHistory` and `notes` are unchanged.
   - Classification. The CLASSIFICATION text is generalised; the run-3 Fetcher wording becomes "any input the module's stated API lets a caller hand it".
   - Lens. The prompt and the three lens instructions match run 3. The schema adds `forbidden` to both `properties` and `required`. The vote is `holds === true && reachable !== 'no' && forbidden === true`, and a cluster is real on two votes.
   - Cluster. The prompt and the assignment variant match run 3 and 3b, and the CLUSTER schema is identical.
   - Observations builder. `observations.py` matches `cal3-observations.py`'s journal and run-file reading, its PASS/PARTIAL/FAIL rule (generalised to "some but not all found") and its `review-grade` fields.
   - Grading. `grade.sh` keeps `cal-grade-3.sh`'s pin and fix steps and pass rules, with every constant now coming from the manifest.
   - Checkout. `historyless-checkout.sh` matches `cal-historyless-checkout.sh`'s one root commit, now built by copying git objects and checking that the tree is equal.
   - The A-1 preamble generalises 3b's reconciling sentence.
3. **K3 hygiene.**
   - `grep -rnE '/home/|/tmp/|session_|wf_|sk-|[0-9a-f]{32}'` over `tools/calibration/`, `tests/fixtures/calibration/` and the test file finds only the test's own patterns and the fixture's all-zero hashes. The only other hit is the git-ignored `__pycache__/*.pyc`, which holds the compiled file path.
   - A grep for MoonAliza names (`moonaliza`, `github-oauth`, the run-3 shas, `U1-R`, `cal3`, `readBounded`, ...) finds nothing.
   - No environment read and no provider call.
   - The hygiene test's scan rules catch each kind (`test_the_scan_catches_each_kind`).
4. **Tests and gate.**
   - `python3.12 tools/test_calibration_kit.py`: 50 tests OK (4.7 s).
   - `python3.11 ...`: 50 tests OK.
   - `python3 tools/run_regression.py`: "REGRESSION GATE: all checks PASS" (65.7 s).
   - `python3 tools/check_secrets.py`: clean, 0 hits.
   - Registration line after `test_claude_code_host_artifacts`.
   - `bash -n` passes on both scripts.
5. **Guard proofs, spot-checked in a scratch copy.**
   - Dropping `forbidden` from the template's vote turns two tests red.
   - Dropping `forbidden` from the lens schema's `required` turns five tests red.
   - Replacing the fix scope rule with `True` turns `test_grade_fix_source_touching_candidate_fails_on_scope` red.
   - Each copy was restored, and the copy is green again at 50 OK.
6. **historyless-checkout.sh on a temporary repository.**
   - It produces one commit, its tree equals the base commit's tree, and the accepted commit and the base commit are absent from the checkout's object store.
   - `--pack` refuses a target inside the pack (exit 2).
   - An existing target is refused (exit 2), and so is `bad..branch` (exit 2).
   - F2 is the exception.
7. **grade.sh on a temporary pack.**
   - With bytecode off: green pin PASS; source-touching pin FAIL (`srcClean` false, `srcTouched` `["src/mod.py"]`); green fix PASS; out-of-scope fix FAIL (`scopeOk` false, `outOfScope` `[".gitignore"]`).
   - Every source file was restored, with `restored` true.
   - F1 is the exception.
8. **observations.py on the fixture journal.**
   - Exit 0, writing all seven files.
   - Each observation has the documented keys.
   - Token kinds sum to the run total: items 6000 + graders 500 + clustering 200 + lenses 500 + other 0 = 7200.
   - `category_mapping` pin is `pin-tests`, and `adjudication_schema` lists all three prongs on both sides.
9. **Adapter shape.**
   - I copied the built `observations.json` to `<tmp trace>/calibration-1/` and ran `node hosts/claude-code/route.mjs rate --trace <tmp> --policy hosts/claude-code/host-policy.json`. It printed three `CALIBRATION` lines (alpha-low pin-tests and fix, beta-max review; "no policy profile" because the fixture's model ids are synthetic), then "no proposals", exit 0.
   - With the fixture's model ids rewritten to `claude-opus-5-5` and `claude-fable-5-1` and the keys to `opus-xhigh` and `fable-max`, it printed `CALIBRATION cc-opus-xhigh pin-tests: 1 pass`, `cc-opus-xhigh fix: 1 pass` and `cc-fable-max review: 1 pass`. The candidate's model was used, not the grader's.
   - The journal and run-file format the builder documents matches the real run-3 run file (read-only check of its key set: `workflow_agent` entries with label, model, state, tokens, durationMs, attempt; no effort, as run 3's observations also show `effort: null`).
10. **request.py.**
    - On the built folder it prints the branch, the files, the title and the body with the four sections of `.github/pull_request_template.md`, in order, and ends with the operator sentence ("please open the pull request yourself ... This kit never pushes and never opens a pull request").
    - The source has no `subprocess`, `os.system` or git call.
11. **Template keys.** `protocol.template.json` carries `classification.prongs` (`holds`, `reachable`, `forbidden`), `judging_profile` (qualification and limitation), `relayed_operator_text` (text null plus the statement), `run_id: null` and `amendments: []`. Cases carry `tier`.
12. **CHANGELOG, README and scope.**
    - One Unreleased line naming the kit and the proposal.
    - One README table row linking `tools/calibration/README.md`.
    - `git diff --stat 7f7fc75..HEAD` lists 23 files, all inside the brief's allowed paths.
    - Commit identity and trailers are as in router-builder.md.

## Not findings, noted

- The builder already reported the `3eb0e2c` message saying 51 tests where it was 49.
- `run.template.js` has not run in the real harness, as the builder reported.
