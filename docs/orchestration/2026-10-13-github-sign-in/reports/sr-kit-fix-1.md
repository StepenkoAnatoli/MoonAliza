# sr-kit fix round 1: review findings F1, F2, F3 (`tools/calibration/`, SmartRouter)

Builder: claude-opus-5-5. Worktree `/home/user/task5-handoff/wt/sr-kit`, branch `tools/calibration-kit`. Three commits
on top of `4129317`, one per finding, not pushed. This report file is not committed. Review: `sr-kit-review-1.md`.

## Gist

- F1 (S2) fixed in `78d6a19`. `grade.sh` gives each swapped source a fresh mtime two seconds past the last one and puts the original mtime back at the end. The tests now grade with the bytecode cache on.
- F2 (S2) fixed in `634ac50`. `historyless-checkout.sh --link` takes `NAME=DIR` and refuses a directory whose real path is inside, or holds, the pack or its repository. The old bare form is refused.
- F3 (S3) fixed in `2dc4fd1`. The launch step refuses a placeholder qualification, a limitation that is not the bootstrap line, a missing relayed statement, and any `{{` left in the protocol, naming its path.
- Each fix was red-first: 4, 2 and 4 failures against the code before it. 14 guard-removal proofs, each red when its guard is removed and green on restore. The kit runs 57 tests OK on Python 3.11.15 and 3.12.3, and five repeated runs stayed green. The gate passed through the pre-commit hook on all three commits.
- No finding was rejected. Open: symlinks inside a dependency tree and checkouts made without the script are the host's to check; the docs say so.

## Commits

| sha | finding | subject |
|---|---|---|
| `78d6a19` | F1 | grade.sh gives each swapped source an mtime of its own, so a cache keyed on mtime and size never runs the previous version |
| `634ac50` | F2 | historyless-checkout.sh --link takes NAME=DIR and refuses a dependency directory that reaches the pack |
| `2dc4fd1` | F3 | the launch step refuses a placeholder qualification, a limitation that is not the bootstrap line, a missing relayed statement, and any placeholder left in the protocol |

- **Identity:** `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`.
- **Message format:** each message carries the finding id, the five named parts, and the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines.
- **Hook:** no `--no-verify`. The pre-commit hook ran `python3 tools/run_regression.py` on each commit and reported `REGRESSION GATE: all checks PASS`.
- **Files changed:** 6, all inside the brief's permitted paths:
  - `tools/calibration/{grade.sh, historyless-checkout.sh, run.template.js, README.md, subject-pack/README.md}`
  - `tools/test_calibration_kit.py`

## F1 (S2): grade.sh and the mtime-and-size cache

- **Reproduced** in a scratch copy with only `PYTHONDONTWRITEBYTECODE` removed. Over three runs, `Scripts` failed 3, 3 and then 2 tests: the same tests the review names, and the failure depends on timing.
- **Fix** (`grade.sh`):
  - Before the first swap, the script records each source file's `st_mtime_ns`.
  - After every `put()` and every intermediate `restore()`, the swapped files get `os.utime(ns=...)` from a clock that starts at max(now, the original mtimes) and moves forward 2 s each time.
  - The final restore puts the original mtimes back.
  - `restored` now also requires the original mtimes.
- **Tests:**
  - `git_env` no longer sets `PYTHONDONTWRITEBYTECODE`. It removes both that variable and `PYTHONPYCACHEPREFIX`, so the cache stays on.
  - New: `test_grade_a_same_size_swap_with_the_bytecode_cache_on` (`a - b` against `a + b`, cache warmed first, fix and pin each graded three times).
  - New: `test_grade_gives_every_swapped_version_its_own_mtime_and_puts_the_original_back`. This one is deterministic: the test command logs the source's mtime at each run, and the test asserts the mtimes are at least 2 s apart pairwise and that the original mtime is back afterwards.
- **Red first:** failures=4 (both new tests, plus `test_grade_fix_green_candidate_passes` and `test_grade_pin_red_then_green_with_the_accepted_fix_passes`).
- **Guard proofs (4):**
  - removing the stamp in `put()`: 5 tests red;
  - removing the stamp in the intermediate `restore()`: the mtime test red;
  - removing the final mtime restore: the mtime test red;
  - a 1 µs step instead of 2 s: 5 tests red.
- **Set aside:** runner-specific cache invalidation, such as deleting `__pycache__` or setting the variable in the test command.

## F2 (S2): --link into the pack

- **Reproduced:** `--pack <s>/pack --link node_modules` gave `ok`. From inside the checkout, `git -C node_modules/.. log --all` showed the fix commit and `show HEAD:src/mod.py` printed `return a + b`.
- **Fix:**
  - `--link NAME=DIR` resolves DIR with `cd` + `pwd -P`, so a symlink is followed to its real path.
  - It refuses, before the target exists:
    - a DIR inside, or holding, SOURCE_REPO (checked with or without `--pack`);
    - a DIR inside, or holding, the `--pack` directory;
    - a missing DIR;
    - the bare `NAME` form.
  - The link points at the resolved DIR and is still listed in `.git/info/exclude`.
- **Docs:** the kit README (step 3), the subject-pack README (Isolation and `checkout.links`) and the launch comment in `run.template.js` now say:
  - dependencies are installed outside the pack;
  - the harness script reads no filesystem, so its path check compares strings;
  - symlinks inside a dependency tree, and checkouts made any other way, are the host's to check.
- **Tests:**
  - The link test now uses a directory outside the pack and asserts where the link resolves.
  - New: `test_historyless_checkout_refuses_a_link_that_reaches_the_pack`, with five cases: inside the pack; inside SOURCE_REPO without `--pack`; a symlink outside that resolves into the pack; a directory that holds the pack; the bare form. Each case asserts its own reason.
- **Red first:** failures=2 against the committed script.
- **Guard proofs (5):** the NAME=DIR requirement; the whole inside/holding refusal; its holding half; the SOURCE_REPO guard without `--pack`; `pwd -P` (replaced by `pwd -L`).
- **Re-running the reviewer's reproduction:**
  - the bare form: refused, exit 2;
  - `node_modules=<pack>/repo/node_modules`: refused, exit 2;
  - `node_modules=<outside dir>`: ok, and `git -C node_modules/..` finds no repository.
- **Set aside:**
  - Copying the dependency tree into each checkout: large and slow, and the copy still lands in the candidate's paths.
  - Scanning every symlink inside DIR: node_modules holds thousands.

## F3 (S3): launch refusals and placeholders

- **Reproduced** with `execute_template` and `run_config` in scratch. All four of the reviewer's cases launched 10 agents.
- **Fix** (`run.template.js`, launch step):
  - It refuses an unfilled `relayed_operator_text.statement`.
  - A qualification that is empty, not a string, or a placeholder counts as no qualification. Without one, the limitation must begin with "judging profile not independently qualified".
  - A recursive scan refuses any string in the protocol that contains `{{`, and names its path (for example `protocol.profiles[0].key`). The scan skips the relayed text, which is the operator's words verbatim.
  - The specific checks run before the scan, so each has its own message.
  - README step 5 and the template header list the new refusals.
- **Tests (4 new):**
  - `test_launch_treats_a_placeholder_qualification_as_unset`
  - `test_launch_requires_the_bootstrap_limitation_line_itself`: "trust me" is refused, and the exact line launches.
  - `test_launch_requires_the_relayed_text_statement`: missing, empty and placeholder statements.
  - `test_launch_refuses_any_placeholder_left_in_the_protocol`: profiles, `accounting.statement`, the shipped template with only the freeze time and the judge filled, and a relayed text containing `{{` that launches.
- **Red first:** failures=4 against the committed template.
- **Guard proofs (5):** the statement check; placeholder-as-unset (reverted to `== null`); the bootstrap prefix; the scan; the relayed-text exemption.
- **Re-running the reviewer's cases:** each is refused with its own message, and 0 agents start.

## Checks

- **Unit tests** (`python3 tools/test_calibration_kit.py`): `Ran 57 tests ... OK` on Python 3.11.15 and 3.12.3. Five repeated runs on 3.11 were all OK. Node 22. cwd `/home/user/task5-handoff/wt/sr-kit`. Verified.
- **Regression gate:** `REGRESSION GATE: all checks PASS` through the pre-commit hook on each of the three commits. Verified.
- **Lint:** `python3 tools/check_secrets.py` reports clean (0 hits). `grep -rn "/home/\|/tmp/" tools/calibration/` is empty, and the K3 hygiene test is green. Verified.
- **Typecheck:** `bash -n` passes on both scripts. Verified.
- **CI** (ubuntu, Python 3.12): expected green, not run.
- **Guard proofs:** 14 in total. Each one edited the guard in place, ran the named test class, and restored the file, with a `cmp` check against a saved copy afterwards.

## Untested, and limits

- `run.template.js` has still run only under the stub harness, never under the real workflow harness.
- F1's fix was tested with Python's bytecode cache only. Other runners that cache by mtime are expected to behave the same, but that is not run. During a grade the swapped files carry mtimes in the future. Python's cache check is an equality test, so this is harmless to it.
- F2 does not follow symlinks inside a dependency tree. That duty is documented as the host's, not enforced.

## What I got wrong

1. **The F2 test's first assertion was too loose.**
   - **Where:** `test_historyless_checkout_refuses_a_link_that_reaches_the_pack`.
   - **What happened:** removing the NAME=DIR guard left the test green. The bare form was then refused by the SOURCE_REPO check instead, and the test only checked that the message named `--link`.
   - **Impact:** none committed.
   - **Cause:** the assertion was looser than the refusal it pins.
   - **Fix:** each case now asserts its own reason.
   - **Verified:** red when the guard is removed, then green.
2. **One F3 branch had no test.**
   - **Where:** the relayed-text exemption from the placeholder scan, in `run.template.js`.
   - **What happened:** removing it left every test green.
   - **Impact:** none committed.
   - **Cause:** I added the exemption after writing the tests.
   - **Fix:** a test case where a relayed text containing `{{` launches.
   - **Verified:** red, then green.
3. **A red-first check that proved nothing.**
   - **Where:** an F2 scratch step.
   - **What happened:** I used `git stash` to check the new tests against the old script, but the stash also removed the new tests, so it showed only "old tests, old code: OK".
   - **Impact:** none.
   - **Cause:** I stashed the whole tree when only the script should have been reverted.
   - **Fix:** I restored only the committed script (`git show HEAD:<script> > <script>`), ran the new tests against it, then put the new script back.
   - **Verified:** failures=2, then green.
4. **A dropped argument.**
   - **Where:** my first re-run of the reviewer's F2 reproduction.
   - **What happened:** I left out the BRANCH argument and got the usage error.
   - **Impact:** none.
   - **Fix:** re-ran with the argument.
   - **Verified:** the results above.
