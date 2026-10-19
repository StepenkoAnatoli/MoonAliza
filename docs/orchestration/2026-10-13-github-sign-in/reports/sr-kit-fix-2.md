# sr-kit fix round 2: review findings N1, N2 (`tools/calibration/`, SmartRouter)

Builder: claude-opus-5-5. Worktree `/home/user/task5-handoff/wt/sr-kit`, branch `tools/calibration-kit`. Two commits
on top of `2dc4fd1`, one per finding, not pushed. This report file is not committed. Review: `sr-kit-rereview-1.md`.

## Gist

- N1 (S3) fixed in `7568c38`. The launch step's placeholder scan now also refuses an object key containing `{{` (for example `accounting.rates_per_mtok.{{model alias}}`) and names its path.
- N2 (S4, plainly right) fixed in `70051a9`. `within()` in `historyless-checkout.sh` treats `/` as holding every path, so `--link NAME=/` and `--pack /` are refused.
- Each fix was red-first: 1 and 2 failures against the code before it. 3 guard-removal proofs, each red when its guard is removed and green on restore.
- The kit runs 57 tests OK on Python 3.11.15 and 3.12, three repeated runs stayed green, and the gate passed through the pre-commit hook on both commits.
- No finding was rejected.

## Commits

| sha | finding | subject |
|---|---|---|
| `7568c38` | N1 | the launch step's placeholder scan also refuses a {{placeholder}} left as an object key |
| `70051a9` | N2 | historyless-checkout.sh treats the root directory as holding every path, so neither --link NAME=/ nor --pack / slips past its guards |

- **Identity:** `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`.
- **Message format:** each message carries the finding id, the five named parts, and the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines.
- **Hook:** no `--no-verify`. The pre-commit hook ran `python3 tools/run_regression.py` on each commit and reported `REGRESSION GATE: all checks PASS`.
- **Files changed:** 3, all inside the brief's permitted paths: `tools/calibration/run.template.js`, `tools/calibration/historyless-checkout.sh`, `tools/test_calibration_kit.py`.

## N1 (S3): a placeholder left as an object key

- **Reproduced by the new test cases** against the committed template. The rates key renamed to `{{model alias}}` launched with no error (`'...rates_per_mtok.{{model alias}}' not found in ''`).
- **Fix** (`run.template.js`, `placeholderAt`): each object entry carries its key. If the key contains `{{`, the scan returns the entry's path before recursing into the value. The relayed-text exemption still applies first. Array entries carry no key.
- **Docs:** none changed. README step 5 and the template header already say "any `{{placeholder}}` left in the protocol", which is now true.
- **Tests:** two new cases in `test_launch_refuses_any_placeholder_left_in_the_protocol`:
  - `rates_per_mtok.alpha` renamed to `{{model alias}}`: refused at `protocol.accounting.rates_per_mtok.{{model alias}}`, with 0 calls;
  - a top-level key `{{extra}}`: refused at `protocol.{{extra}}`, with 0 calls.
- **Red first:** failures=1, on the first new assertion.
- **Guard proofs (2):**
  - removing the key check: red on the rates-key case;
  - removing the key check, with the rates-key case also removed: red on the top-level case alone.
  - Both restored byte-identical (`cmp`), then green.
- **Not changed:** `observations.py` still writes `null` USD for a model with no rate. The launch refusal is the fix the finding names. A null estimate for an unknown rate is the template's documented "unknown tokens null" behaviour.

## N2 (S4): `within()` and the root directory

- **Reproduced** in scratch with the test module's `make_pack`/`checkout`:
  - `--pack <pack> --link node_modules=/` answered `ok`, and so did `--link node_modules=/` without `--pack`;
  - in both checkouts, `git -C <checkout>/node_modules<pack>/repo log --oneline --all` listed `accepted fix`.
- **Fix:** `within() { [ "$2" = / ] && return 0; case "$1/" in "$2"/*) return 0 ;; esac; return 1; }`. `pwd -P` ends in `/` only for the root, so the root is the only special case. The comment says so.
- **Tests:**
  - Two new cases in `test_historyless_checkout_refuses_a_link_that_reaches_the_pack`: `node_modules=/` with `--pack`, and without it (the SOURCE_REPO guard). Each must be refused with "holds the accepted fix" and must create no target.
  - One `--pack /` case in `test_historyless_checkout_refuses_an_existing_target_and_one_inside_the_pack`: refused with "is inside the pack /", and no target created.
- **Red first:** failures=2 (both tests), each answering `ok`.
- **Guard proof (1):** removing the `/` clause turned both tests red. The file was restored byte-identical (`cmp`), then green.
- **Re-running the reviewer's reproduction after the fix:** both `=/` forms and `--pack /` exit 2 with their reasons, and no target is created.

## Checks

- **Unit tests** (`python3 tools/test_calibration_kit.py`): `Ran 57 tests ... OK` on Python 3.11.15 and 3.12. Three more runs on 3.11 were all OK. Node 22.22.0. cwd `/home/user/task5-handoff/wt/sr-kit`. Verified.
  - The count stays at 57 because the new cases were added inside existing tests.
- **Regression gate:** `REGRESSION GATE: all checks PASS` through the pre-commit hook on both commits. Verified.
- **Lint:** `python3 tools/check_secrets.py` reports clean (0 hits). Verified.
  - `grep -rn "/home/\|/tmp/" tools/calibration/ --exclude-dir=__pycache__` is empty. The only hits without the exclude were local `__pycache__/*.pyc`, which `.gitignore:21` ignores and git does not track.
  - The K3 hygiene test is green.
- **Typecheck:** `bash -n` passes on `historyless-checkout.sh`. Verified.
- **CI** (ubuntu, Python 3.12): expected green, not run.

## Untested, and limits

- `run.template.js` has still run only under the stub harness, never under the real workflow harness. This is unchanged from round 1.
- N2 closes the root case only. Symlinks inside a dependency tree, and checkouts made without the script, remain the host's to check, as the docs already say.

## What I got wrong

1. **A probe that proved nothing.**
   - **Where:** my scratch reproduction of N2, the third probe (`--pack /`).
   - **What happened:** the probe reused a target name that an earlier probe had already created. The script refused it as "target exists", so the probe said nothing about `--pack /`.
   - **Impact:** none. No conclusion rested on that probe, and the committed test case uses its own target.
   - **Cause:** I named the targets by the flag count, and two probes had the same count.
   - **Fix:** the `--pack /` case went into the test suite with a distinct target name, and the post-fix re-run used a fresh scratch directory.
   - **Verified:** the test case was red against the old script ("ok") and green after the fix. The post-fix re-run refused `--pack /` with "is inside the pack".
