# sr-kit re-review 1 (after fix round 1): the calibration kit (`tools/calibration/`)

- Unit: sr-kit, worktree `/home/user/task5-handoff/wt/sr-kit`, branch `tools/calibration-kit`, base `7f7fc75`, head `2dc4fd1`. The fix round is three commits on top of `4129317`: `78d6a19` (F1), `634ac50` (F2), `2dc4fd1` (F3). Nothing is pushed.
- Contract: `briefs/kit-builder.md` (K1-K5), proposal Items 2-4.2, severities S1-S4 from `briefs/router-reviewer.md`. Earlier review: `sr-kit-review-1.md`. Fix report: `sr-kit-fix-1.md`.
- Method: refute-first and read-only on the worktree. Every probe ran under `<scratchpad>/sr-kit-rereview/`, with a temporary same-size pack, checkouts, a `git archive HEAD` copy of the kit for the red-first and guard proofs, and the observation and trace folders. `git status --short` in the worktree was empty after every step.
- Verdict: **FIX**. F1, F2 and F3 are fixed: each proof was re-run and is now green, and the code before each fix is red against the new tests. Two new findings remain, both small:
  - **N1 (S3):** the F3 scan misses a placeholder in an object key, and the shipped template has one.
  - **N2 (S4):** `within()` cannot match when the outer path is `/`, so `--link NAME=/` is accepted.

## Earlier findings: re-run proofs

### F1 (S2) - fixed

- **Independent reproduction, cache on.** I built a temporary pack: `src/mod.py` is `return a - b` at the base and `return a + b` in the accepted fix (same size). I made history-less checkouts and ran the candidate's tests once, so `__pycache__` was warm. `PYTHONDONTWRITEBYTECODE` was unset.
  - New `grade.sh`, three fresh fix checkouts and three fresh pin checkouts: all six graded `PASS true` with `restored true`.
    - Fix cells: `guardRed`, `acceptedPinGreen` and `candidateGreen` were all true.
    - Pin cells: `redAtHead` and `greenWithFix` were both true.
  - Back-to-back regrades of the same checkout: fix-4/5/6 three times each, and pin-1 and fix-1 interleaved three times. All PASS.
  - The old `grade.sh` (`4129317`) on the same kind of fresh checkouts:
    - fix-4 FAIL (`acceptedPinGreen false`);
    - fix-5 and fix-6 FAIL (`guardRed false`).

    The defect reproduces before the fix and is gone after it. Verified.
- **The kit's tests.** `git_env` now pops `PYTHONDONTWRITEBYTECODE` and `PYTHONPYCACHEPREFIX` (`tools/test_calibration_kit.py:57-58`), and the same-size test asserts the variable is absent (line 544).
  - In the scratch copy, the old `grade.sh` against the new tests gives `FAILED (failures=5)`.
  - Guard proofs:
    - `STEP_NS = 1000` gives failures=5;
    - dropping the final mtime restore gives failures=1;
    - restored, it is OK.

  Verified.
- **Reasoning on the residual.** After the final restore, the cached `.pyc` records a stamped mtime, not the original, so the next run recompiles. The clock starts at max(now, the original mtimes), so a stamp never equals an earlier one. Expected, not run beyond the regrades above.

### F2 (S2) - fixed

Probes ran on the temporary pack (`<s>` = the scratch folder):

| `--link` argument | result |
|---|---|
| `node_modules` (bare, the reviewer's original reproduction) | refused, exit 2, "takes NAME=DIR" |
| `node_modules=pack/repo/node_modules`, with `--pack` | refused, exit 2, "shares a path with <s>/pack/repo" |
| the same, without `--pack` | refused, exit 2 (SOURCE_REPO guarded on its own) |
| `node_modules=deps/sneaky`, a symlink outside that resolves into the pack | refused, exit 2 (`pwd -P` resolves it) |
| `node_modules=<s>`, a directory holding the pack | refused, exit 2 |
| `node_modules=deps/node_modules`, outside the pack | ok. The link resolves to `<s>/deps/node_modules`, and `git -C node_modules/..` reports "not a git repository" |
| `a/../../x=...` | refused, "plain relative name" |
| `node_modules=/` | **accepted**: see N2 |

- Old `historyless-checkout.sh` against the new tests: failures=2.
- Guard proof: removing the "holds" half (`|| within "$guarded" "$dep"`) gives failures=1; restored, it is OK.

Verified.

### F3 (S3) - fixed for every case reported

I used `execute_template` and `run_config` from the test module, in scratch, under the stub harness:

| case | result |
|---|---|
| baseline fixture | 10 agents |
| placeholder qualification and placeholder limitation | refused (Item 3.3), 0 agents |
| placeholder qualification, limitation null | refused, 0 agents |
| qualification null, limitation "trust me" | refused, 0 agents |
| qualification null, limitation a number | refused (no TypeError) |
| qualification null or `""`, limitation is the bootstrap line | launches |
| `relayed_operator_text` = `{text: null}` | refused (statement, Item 3.2) |
| statement `{{x}}` | refused |
| relayed text containing `{{` | launches (exempt, verbatim) |
| shipped template with only `frozen_at` and the judge filled | refused at `protocol.status` |
| `_lineage` left in | refused at `protocol._lineage` |

- Old `run.template.js` against the new tests: failures=4.
- Guard proofs:
  - disabling the scan gives failures=1;
  - dropping the relayed-text exemption gives failures=1;
  - restored, it is OK.

Verified.

## New findings

### N1 (S3): the placeholder scan reads values only, so the template's own placeholder key launches

**Problem.**
- `placeholderAt` in `run.template.js` (launch step, the `const placeholderAt` closure) recurses into values with `Object.entries`. It tests strings, and never the keys.
- `protocol.template.json:67` ships one placeholder that is a key: `"rates_per_mtok": {"{{model alias}}": {...}}`.
- The README's step 5, the template header and the fix report all say the launch refuses "any `{{placeholder}}` left in the protocol". F3's fix as requested said "anywhere in RUN.protocol".

**Reproduction (verified).**
- The fixture protocol with `accounting.rates_per_mtok.alpha` renamed to `{{model alias}}`, every value filled: `agents=10 error=None`.
- A top-level key `{{extra}}`: `agents=10 error=None`.
- `observations.py --protocol` with that protocol exits 0. `scores.json` then carries `usd_all_input` and `usd_all_output` as `null` for both alpha-low items, where the correct key gives 0.001 and 0.005, and 0.002 and 0.01.

**Impact.** A host that fills the rate numbers but not the key launches without complaint. Its cost estimates for that model come out null. The estimates are labelled estimate-only and are not a gate, so the impact is small. But the claim in the README and the F3 fix is unenforced, and the template's only key placeholder is the case that slips through.

**Fix.**
- In `placeholderAt`, also return the path when an object key contains `{{`. Test with `k.includes('{{')` before recursing; keys under the exempt relayed text need no special case.
- Add a red-first case to `test_launch_refuses_any_placeholder_left_in_the_protocol`: the rates key left as `{{model alias}}`.

### N2 (S4): `within()` never matches when the outer path is `/`, so `--link NAME=/` is accepted

**Problem.** `historyless-checkout.sh` defines `within() { case "$1/" in "$2"/*) ... }`. When `$2` is `/`, the pattern is `//*`, which no absolute path matches. So:

- the "DIR holds the pack" half does not refuse `DIR=/`;
- the existing `--pack /` check (`within "$TARGET_ABS" "$PACK_ABS"`) has the same blind spot. It was already there before the fix.

**Reproduction (verified).** `historyless-checkout.sh --pack pack --link node_modules=/ pack/repo <base> co/l6 cal/l6` answers `ok`. `co/l6/node_modules -> /`, and `git -C co/l6/node_modules<s>/pack/repo log --oneline --all` lists `fix: SECRET`.

**Impact.** Small. It needs a host to pass `/`, and a candidate's shell can name absolute paths anyway; the isolation is about not handing it a path. Still, the header claims the script refuses a directory that "holds either".

**Fix.** In `within()`, return 0 when `$2` is `/`, and add the `/` case to the refusal test.

## Not findings, noted

- **A NAME that is already in the tree (pre-existing; the old script did the same).** Examples are `src`, `tests` or `.git`. `ln -s DIR TARGET/NAME` then makes the link inside that directory (for example `co/l10/src/node_modules -> <s>/deps/node_modules`), and `/src` goes into `.git/info/exclude`. A candidate's untracked file under `src/` then disappears from `git status` (checked: `src/new.py` was not listed), and so from `grade.sh`'s `untracked` and `srcTouched`. Only the host picks NAME, so a candidate cannot use this. Refusing a NAME that exists in the base tree, or `.git`, would close it.
- The template has run only under the stub harness, as the fix report says.

## Whole-unit checklist (same as review 1)

1. **Lineage and K2 files.** All twelve kit files are present, with their lineage headers. The three changed headers (`grade.sh`, `historyless-checkout.sh`, `run.template.js`) still name the run-3 artefact and now state the change from run 3. Verified by reading.
2. **Hygiene (K3).**
   - `grep -rnE '/home/|/tmp/|session_|wf_|sk-|[0-9a-f]{32}' tools/calibration --exclude-dir=__pycache__` finds nothing.
   - The MoonAliza-name grep finds nothing.
   - No `os.environ`, `process.env` or `getenv` in the kit.
   - `python3 tools/check_secrets.py`: clean (0 hits).

   Verified.
3. **The kit's tests and the gate.**
   - `python3.12 tools/test_calibration_kit.py` and `python3.11 ...`: `Ran 57 tests ... OK` each, plus about eight more full runs in the scratch copy, all OK.
   - `python3 tools/run_regression.py`: `REGRESSION GATE: all checks PASS` (62.7 s).
   - `bash -n` on both scripts: ok.
   - Old-code reds: failures 5, 2 and 4. Guard proofs: five spot checks, each red, then green.
   - cwd `/home/user/task5-handoff/wt/sr-kit`, Python 3.12.3 and 3.11.15.

   Verified.
4. **Scripts on a temporary repository.** Above. Each checkout is one commit whose tree equals the base tree.
5. **Observations against rate.**
   - `observations.py` on the fixture writes the seven files, exit 0.
   - `node hosts/claude-code/route.mjs rate --trace <tmp> --policy hosts/claude-code/host-policy.json` prints the three `CALIBRATION` lines (alpha-low pin-tests and fix, beta-max review: 1 pass each), then "no proposals", exit 0.

   Verified.
6. **`request.py`.** On the built folder, it prints the four template sections and ends with the operator sentence. There is no `subprocess`, `os.system` or `Popen`. Verified.
7. **Template keys.**
   - `classification.prongs`: `[holds, reachable, forbidden]`.
   - `judging_profile`: key, model, effort, qualification, limitation.
   - `relayed_operator_text`: text null plus the statement.
   - `run_id` null, `amendments` [], and every case has `tier`.

   Verified.
8. **No other file changed.**
   - The fix round touched 6 files (249+/31-), all under the brief's paths.
   - `git diff --name-only 7f7fc75..HEAD`: the same 23 files as review 1.
   - Identity: `StepenkoAnatoli <318295322+...noreply>`.
   - Each fix message has the five parts, with the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines.

   Verified.
