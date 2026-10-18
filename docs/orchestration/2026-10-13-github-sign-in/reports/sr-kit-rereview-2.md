# sr-kit re-review 2 (after fix round 2): the calibration kit (`tools/calibration/`)

- **Unit:** sr-kit.
  - Worktree `/home/user/task5-handoff/wt/sr-kit`, branch `tools/calibration-kit`, base `7f7fc75`, head `70051a9`.
  - Fix round 2 is two commits on top of `2dc4fd1`: `7568c38` (N1) and `70051a9` (N2). Nothing is pushed.
- **Contract:** `briefs/kit-builder.md` (K1-K5) and the proposal's Items 2-4.2. Severities S1-S4 follow `briefs/router-reviewer.md`.
- **Earlier reports:** `sr-kit-review-1.md`, `sr-kit-rereview-1.md`, `sr-kit-fix-2.md`.
- **Method:** refute-first, and read-only on the worktree.
  - Every probe ran under `<s>` = `<scratchpad>/sr-kit-rereview-2/`. That folder holds a temporary pack (`src/mod.py` `a - b` at the base, `a + b` in the commit `fix: SECRET`), the checkouts, and a `git archive HEAD` copy of the kit (`<s>/kit`) for the red-first and guard proofs.
  - `git status --short` in the worktree was empty at the end, with HEAD still at `70051a9`.
- **Verdict: FIX.** N1 is fixed. N2 is fixed only for the exact spelling `/`. The same class remains open (N3, S4).
  - N2's fix comment rests on a false premise: "pwd -P ends in '/' only for the root".
  - Bash's `pwd -P` prints `//` for `//`, for `//.` and for `//tmp/..`. It also keeps the leading `//` of any `//a/b` path.
  - So `--link NAME=//` and `--pack //` still pass.
  - So does a pack or source path spelled with a leading `//`, which defeats the original inside-the-pack guard.
  - The launch step's `shares()` misses the same class for `//` and `/./`.

## Earlier findings: re-run proofs

### N1 (S3): fixed

- **Code** (`run.template.js:79-89`): `placeholderAt` carries each object entry's key. It returns the path when the key contains `{{`, before recursing. Array entries carry `''`. The relayed-text exemption still runs first.
- **The reviewer's reproduction, re-run at HEAD** with `execute_template`/`run_config` imported from the test module, under the stub harness (verified):

  | case | result |
  |---|---|
  | baseline fixture | 10 agents, no error |
  | `rates_per_mtok.alpha` renamed to `{{model alias}}` | refused at `protocol.accounting.rates_per_mtok.{{model alias}}`, 0 agents |
  | top-level key `{{extra}}` | refused at `protocol.{{extra}}`, 0 agents |
  | a key inside an object in an array (`accounting.nested.a[0].{{k}}`) | refused at that path, 0 agents |
  | relayed text `"x {{y}}"` | launches (exempt, verbatim) |
  | a key `{{note}}` beside the relayed text | refused at `protocol.relayed_operator_text.{{note}}` (the exemption covers `.text` only) |

- **Red first** (verified). In `<s>/kit` with `run.template.js` from `2dc4fd1`, `RunTemplate` gives failures=1: `'unfilled placeholder at protocol.accounting.rates_per_mtok.{{model alias}}' not found in ''`.
- **Guard proof** (verified). With the `key.includes('{{')` line deleted, `RunTemplate` gives failures=1. Restored with `git checkout`, it is OK.
- **Note.** The template's other key placeholder (`sources`, `protocol.template.json:52`) is not in `RUN.protocol` by design: the header says the protocol goes in "without its sources". Left in, it would be refused like any other key.

### N2 (S4): fixed for `/` only; the class stays open as N3

- **Code** (`historyless-checkout.sh:57`): `within() { [ "$2" = / ] && return 0; case "$1/" in "$2"/*) ...`.
- **The reviewer's reproduction, re-run on the temporary pack** (verified):
  - `--pack pack --link node_modules=/`: exit 2, "shares a path with ... which holds the accepted fix".
  - `--link node_modules=/` (no `--pack`): exit 2.
  - `--pack /`: exit 2, "is inside the pack /".
  - In each case, no target was created.
- **Red first** (verified). With `historyless-checkout.sh` from `2dc4fd1`, `Scripts` gives failures=2: the link test and the existing-target/inside-pack test.
- **Guard proof** (verified). With the `[ "$2" = / ] && return 0;` clause removed, `Scripts` gives failures=2. Restored, it is OK.

## New finding

### N3 (S4): the path guards compare spellings, not paths. A `//` root or `//` prefix passes `historyless-checkout.sh`, and `//` or `/./` passes the launch's `shares()`

**Problem.**

1. `historyless-checkout.sh` takes every guarded path from `pwd -P` (`SRC_ABS`, `PACK_ABS`, each `--link` DIR, and the target's parent). It compares them with `within()` as strings.
   - Bash's `pwd -P` keeps a leading `//`, which POSIX leaves implementation-defined; on Linux it is the root:

     ```
     $ bash -c 'cd -- // && pwd -P; cd -- //. && pwd -P; cd -- //tmp/.. && pwd -P; cd -- /// && pwd -P'
     //
     //
     //
     /
     ```

     (GNU bash 5.2.21.)
   - N2's clause tests `"$2" = /`, so `//` is not treated as the root. The comment's premise ("pwd -P ends in '/' only for the root") is false.
   - A `//a/b` spelling of the pack or the source repository also stays `//a/b`. It then never compares equal to, or as a prefix of, the `/a/b/...` spelling that the target or link resolves to.
2. `run.template.js:69-70`: `norm()` only turns backslashes into `/` and strips trailing slashes. So `<root>//pack/co` and `<root>/./pack/co` do not "share" with `<root>/pack`.

**Reproduction (verified, at `70051a9`).** `<s>` is the scratch folder, and `B` is the base commit.

| command | result |
|---|---|
| `historyless-checkout.sh --pack pack --link node_modules=// pack/repo B co/t4 cal/t4` | `ok`, exit 0. `co/t4/node_modules -> //`, and `git -C "co/t4/node_modules<s>/pack/repo" log --oneline --all` lists `b8d563b fix: SECRET` |
| `--link node_modules=//` (no `--pack`) | `ok`, exit 0 |
| `--pack //` | `ok`, exit 0 |
| `--pack pack --link node_modules=//.` | `ok`, exit 0 |
| `--pack /<s>/pack` (pack spelled `//tmp/...`), target `pack/co-b` | `ok`, exit 0: a checkout inside the pack. The control `--pack <s>/pack` is refused, "is inside the pack" |
| `--pack /<s>/pack --link nm=pack/repo /<s>/pack/repo B co/u2 cal/u2` | `ok`, exit 0. `co/u2/nm -> <s>/pack/repo`: the link goes straight to the repository that holds the fix |
| launch, `host.checkout_root = <root>//pack/co`, `pack_dir = <root>/pack` | 10 agents, no error. The control `<root>/pack/co` is refused, "shares a filesystem path with the pack directory" |
| launch, `host.checkout_root = <root>/./pack/co` | 10 agents, no error |

- **The holes predate the fix.** The script at `2dc4fd1` also answers `ok` to `--pack /<s>/pack` with a target inside the pack, and to `--link nm=//`.
- **N2's change did not close them.** It handles the one spelling `/`.
- (`///` and more slashes normalise to `/` in `pwd -P`. So `--pack //<s>/pack` with three slashes is refused correctly.)

**Impact.** Small, as with N2. Every case needs the host to type an unusual spelling, and a candidate's shell can name absolute paths anyway. But the script header (lines 14-20), the README and N2's own commit message all claim these refusals. The `//`-prefixed pack case defeats the original inside-the-pack guard, not just the new root case. The template's comment says it compares the host's paths "as strings", but it does not say that equivalent spellings escape.

**Fix (one class, two sites).**

- **`historyless-checkout.sh`.** Normalise every physical path once, where it is produced, instead of special-casing the root in `within()`. For example, use one helper for `SRC_ABS`, `PACK_ABS`, each `dep` and the target's parent:

  ```
  phys() { local p; p=$(cd -- "$1" 2>/dev/null && pwd -P) || return 1
           case $p in //*) p=/${p#"${p%%[!/]*}"} ;; esac; printf '%s\n' "${p:-/}"; }
  ```

  - Keep `within()`'s `/` clause; `//` then reaches it as `/`.
  - Correct the comment.
  - Add red-first cases:
    - `node_modules=//` and `node_modules=//.`, with and without `--pack`;
    - `--pack //`;
    - `--pack` spelled `/`+absolute pack path, with a target inside the pack;
    - SOURCE_REPO and `--pack` spelled `//...`, with `--link` into the repository.
- **`run.template.js` `norm()`.** Collapse runs of `/` and drop `.` segments. Either resolve `..` segments lexically or refuse a host path that contains one (no filesystem read is needed). Add the `//` and `/./` cases to the launch's path-sharing test.

## Not findings, noted

- **A NAME already in the base tree** (`--link src=...`, `--link .git=...`) still links inside that directory and excludes it, as `sr-kit-rereview-1.md` noted. Only the host picks NAME. This is unchanged and pre-existing.
- **`run.template.js` has run only under the stub harness**, as the fix report says.
- **`observations.py` still writes `null` USD for a model with no rate.** That is the documented "unknown, null" behaviour. N1's launch refusal is what closes the path to it.

## Whole-unit checklist (same as reviews 1 and 2)

1. **Lineage and K2 files.**
   - All 12 tracked kit files are present.
   - Each carries its lineage header (`protocol.template.json` in `_lineage`).
   - The two headers changed in this round still name the run-3 artefact they generalise.
   - Verified by `grep` over `git ls-files tools/calibration`.
2. **Hygiene (K3).** All verified.
   - `grep -rnEi '/home/|/tmp/|session_|wf_|sk-|[0-9a-f]{32}|moonaliza|github-oauth|cal3|readBounded|U1-R' tools/calibration --exclude-dir=__pycache__` finds nothing.
   - There is no `os.environ`, `process.env` or `getenv` in the kit.
   - `request.py` has no `subprocess`, `os.system` or `Popen`.
   - `python3 tools/check_secrets.py`: `clean (0 hits)`.
3. **The kit's tests and the gate.** cwd `/home/user/task5-handoff/wt/sr-kit`, Node v22.22.0. All verified.
   - `python3 tools/test_calibration_kit.py` (3.11.15): `Ran 57 tests ... OK`.
   - `python3.11` and `python3.12` (3.12.3): `Ran 57 tests ... OK` each.
   - `python3 tools/run_regression.py`: `REGRESSION GATE: all checks PASS` (1 min 4 s).
   - `bash -n` passes on `historyless-checkout.sh` and `grade.sh`.
   - The registration line is at `tools/run_regression.py:92`, after `test_claude_code_host_artifacts` (line 91).
   - The red-first and guard proofs for N1 and N2 are above. In `<s>/kit`, `RunTemplate` and `Scripts` at HEAD give 25 tests OK, and again after each restore.
4. **Scripts on a temporary repository.** All verified.
   - `--pack pack --link node_modules=deps/node_modules` (outside the pack) gives `ok`.
   - The checkout holds 1 commit, and its tree equals the base commit's tree.
   - The fix commit is absent (`git cat-file` reports "could not get object info").
   - `git status --porcelain` is empty, so the link is excluded.
   - N3 is the exception.
   - `grade.sh` was not changed in this round. Its tests (the same-size F1 tests among them) are green in the suite.
5. **Observations against `rate`.** All verified.
   - `observations.py --protocol tests/fixtures/calibration/protocol.json <journal> <run> <manifest> <grades> <s>/obs` exits 0 and prints `pin/fix/review: 1 of 1 PASS`.
   - It writes `adjudication.json`, `clusters.md`, `observations.json`, `results-table.md`, `scores.json`, `tokens-and-estimates.md` and `void-cells.json`.
   - `observations.json` is the flat profile map (`alpha-low`, `beta-max`).
   - `scores.json` carries `totals.tokens`. The parts sum to the total: 6000 + 500 + 200 + 500 + 0 = 7200. It also carries `adjudication_schema`, `category_mapping`, and `would_fail_under_three_prong` per review.
   - Copied to `<s>/trace/calibration-1/`, `node hosts/claude-code/route.mjs rate --trace <s>/trace --policy hosts/claude-code/host-policy.json` prints three `CALIBRATION` lines (alpha-low pin-tests and fix, beta-max review: 1 pass each), then `no proposals`, exit 0.
6. **`request.py`.** Verified.
   - On the built folder it exits 0 and prints `Branch:`, `Files:` and the title.
   - The body has the four sections of `.github/pull_request_template.md`, in order: Problem and resulting behavior, Related issue, Validation, Remaining limits or risks.
   - It ends with the operator sentence ("please open the pull request yourself ... This kit never pushes and never opens a pull request").
7. **Template keys.** Verified.
   - `classification.prongs` is `[holds, reachable, forbidden]`.
   - `judging_profile` has key, model, effort, qualification and limitation.
   - `relayed_operator_text` has `text: null`, the statement, and the `_fill` note.
   - `run_id` is null, `amendments` is `[]`, and all three cases carry `tier`.
8. **No other file changed.** Verified.
   - `git diff --name-only 2dc4fd1..HEAD`: `tools/calibration/historyless-checkout.sh`, `tools/calibration/run.template.js` and `tools/test_calibration_kit.py`.
   - `git diff --name-only 7f7fc75..HEAD`: the same 23 files as reviews 1 and 2, all inside the brief's paths.
   - Every commit's identity is `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`, with the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` trailers.
   - Both fix messages carry the five parts.
