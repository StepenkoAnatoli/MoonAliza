# sr-kit report 1: the calibration kit under `tools/calibration/` (SmartRouter, onboarding proposal Items 2-4.2)

Builder: cc-opus-high (dispatch Brief `smartrouter/trace/decisions/sr-kit-2.json`, profile claude-opus-5-5 at effort
high). Worktree `/home/user/task5-handoff/wt/sr-kit`, branch `tools/calibration-kit` (the branch the lead created; the
Brief's branch-hint reads `build/sr-kit`), base `7f7fc75` (SmartRouter main). Six commits, not pushed. This report file
is not committed.

## Gist

- `tools/calibration/` built per K2: protocol template, classification, grader/lens/cluster prompts (the lens schema carries `forbidden`; a lens votes real only on all three prongs), history-less checkout, manifest-driven `grade.sh`, `observations.py`, `run.template.js` with the A-1 reconciling preamble and launch refusals, `request.py`, the pack format and the shared-pack stub.
- 50 tests in `tools/test_calibration_kit.py`, registered after `test_claude_code_host_artifacts`. Six red-first runs and 72 guard-removal proofs, each red when removed and green on restore. The gate passes standalone (66 s) and through the hook on all six commits; the tests pass on Python 3.11.15 and 3.12.3.
- The filled workflow template is executed under Node with stub harness globals, covering every launch refusal, the cells, the prompts and the three-prong vote. `observations.json` from the fixtures is read by the real `route.mjs rate`.
- Past the brief: manifest fields added so that no kit file holds a subject value; the tree is copied as git objects (not `git archive`); `--void/--supplementary` (Item 3.2); the fix finding and the ground truth are put in the prompts, so no candidate reads a file outside its checkout.
- Open: the template has not run in the real harness yet (its first run is its test); the refute-first review is the lead's (nested-allowed false).

## Commits

| sha | subject |
|---|---|
| `435960f` | tools/calibration: the observations builder, with the synthetic fixture journal and run file |
| `dc2d8c9` | tools/calibration: history-less checkout and mechanical grading from a pack manifest, with smoke tests |
| `5dd0b8e` | tools/calibration: protocol template, classification and the grader, lens and cluster prompts, with the template and hygiene tests |
| `e3ef387` | tools/calibration: the workflow template with the relayed-request preamble, and the request printer |
| `3eb0e2c` | tools/calibration: the kit README, the subject-pack format, the shared-pack stub, and the CHANGELOG and README lines |
| `4129317` | tools: register the calibration kit's tests in the regression gate; the K3 scan also takes the literal /home/ and /tmp/ strings |

Identity `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`. Every message ends with
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and the `Claude-Session` line, and carries the five named
parts. No `--no-verify`; the pre-commit hook ran the gate on every commit, including the two amends of the last one.

Files (23, every one inside the Brief's permitted effects): `tools/calibration/{README.md, protocol.template.json,
classification.md, grader.prompt.md, lens.prompt.md, cluster.prompt.md, historyless-checkout.sh, grade.sh,
observations.py, run.template.js, request.py, subject-pack/README.md, subject-pack/shared/README.md}`,
`tools/test_calibration_kit.py`, `tools/run_regression.py` (one line), `tests/fixtures/calibration/{manifest.json,
protocol.json, journal.jsonl, run.json, grades/pin-alpha-low.json, grades/fix-alpha-low.json}`, `CHANGELOG.md` (one
Unreleased line), `README.md` (one row in the documentation table). `validate_skills` untouched.

## What the kit is (K2), and what changed from run 3

Each file has a lineage header naming the run-3 artefact it generalises. For `protocol.template.json` that header is its
`_lineage` key, since JSON has no comments.

- **`protocol.template.json`**: run 3's protocol shape with blank values. It carries `subject_pack` with the manifest
  hash, profiles, cases pin/fix/review with category, `tier` and pass rule, sources and the CRLF-normalised hash
  convention, metrics, accounting with `rates_per_mtok`, timing, privacy, limits, and `classification.prongs` (the
  three). It also carries `judging_profile` (qualification, or the bootstrap line "judging profile not independently
  qualified"), `relayed_operator_text` (`text: null` with "the harness relays no operator text into workers", or the
  text verbatim), `usage_window_readings`, `run_id: null` and `amendments: []`. The pin case carries the host category
  `pin-tests` (run 3 A-2).
- **`classification.md`**: holds the Definition, which `run.template.js` inserts verbatim into the grader and lens
  prompts. It also has the prong table, the S4 rule, and G-1 and G-2 written as rules.
- **The three prompts**: each has a `## Prompt`, an `## Output schema` in fenced JSON and a `## Placeholders` list, and
  a test pins that list to the placeholders actually used. The grader schema generalises run 3's `r8Found/r11Found...`
  into one `truth[]` entry per ground-truth finding. The lens prompt has a `## Lens:` section for each of the three
  lenses and a `## Vote rule`. The cluster prompt carries the supplementary assignment variant.
- **`historyless-checkout.sh SRC COMMIT TARGET BRANCH [--link NAME]... [--pack DIR]`**: copies the base tree and its
  blobs as git objects into a fresh repository and commits them with `commit-tree --no-gpg-sign`. It copies no commit
  of the source. Run 3 went through `git archive`, which drops `export-ignore` files; a guard proof shows the archive
  path fails the tree-equality check. The symlinks are opt-in and listed in `.git/info/exclude`, so a candidate's
  `git add -A` cannot commit them (run 3's candidates saw them untracked). The script refuses an existing target and,
  with `--pack`, a target that shares a path with the pack.
- **`grade.sh MANIFEST pin|fix CHECKOUT`**: a bash entry with the logic in a quoted-heredoc Python program. Run 3
  spliced shell variables into Python; nothing is spliced here. Every run-3 constant now comes from the manifest. The
  grade goes to stdout, the script reports whether it restored the swapped sources (`restored`), and it refuses a
  checkout that shares a path with the pack. Test reports: `exit-code` or `vitest-json`.
- **`observations.py JOURNAL RUN_FILE MANIFEST GRADES_DIR OUT_DIR [--protocol P] [--void C:P]... [--supplementary J R]`**:
  the harness journal format is documented at the top of the file. Beyond K2's list it writes `adjudication.json` and
  `void-cells.json` (the Item 4.1 layout).
  - A cell that ran without a grade is `score: null`, which the adapter counts as ungraded. Run 3 wrote it as null,
    which reads as "not run".
  - It recomputes each cluster's three-prong vote from the lens records. A lens record without `forbidden` is no
    three-prong vote (the G-2 reading), which gives `would_fail_under_three_prong` and `threeProngResult`.
  - Token totals sum to every agent of the run, with an `other` bucket for labels the kit does not name.
- **`run.template.js`**: the harness-specific lines are marked `// HARNESS:` (11 lines). It is filled from a run config
  (`{manifest, protocol without sources, host}`) and the four markdown files.
  - The launch step refuses, before any agent starts: an unfrozen protocol; a retry limit other than 0; an unrecorded
    relayed text; prongs other than the three; a judging profile with neither its qualification nor the bootstrap
    line; a candidate or lens checkout that shares a path with the pack (Items 2 and 3.1-3.4).
  - The candidate preamble reconciles a relayed request (A-1) and quotes a recorded one verbatim.
  - The rest follows run 3: pipelined grading, one clustering agent, three lenses per cluster, real on two votes of
    three with all three prongs. The supplementary mode re-runs only the void cells, uses the assignment prompt and
    keeps the main run's verdicts.
- **`request.py RESULTS_DIR [--repo-root] [--branch] [--issue]`**: prints the branch (`evidence/<folder>`), the files, a
  title and a body in `.github/pull_request_template.md`'s four sections, in order. The body names two-prong passes as
  `PASS (2-prong, would fail)` and states the judging qualification or limitation, the relayed-text statement, and that
  the printer did not run the gate. It ends by asking the operator to open the pull request. It has no `subprocess`,
  and a test pins that.
- **`subject-pack/README.md`**: documents every manifest field, and a test pins every fixture key to it. It also states
  the Item 2 isolation rule. **`subject-pack/shared/README.md`**: a stub naming the shared-pack unit.

## Choices past the brief (each revertible)

1. **Manifest fields beyond K2's list**: `commit_rule`, `paths.scratch_test`, `commands.run_one`, `commands.test_report`,
   `cases.*.instructions`, `cases.fix.commit_prefix`, `checkout.links`. Without them a prompt or a script would hold a
   subject value (the stop-trigger rule: a manifest field, not a constant).
2. **The fix candidate gets its finding in the prompt**, and the grader gets the ground truth inline. Run 3's fix
   candidates read the finding from a scratchpad file outside their checkout, which Item 2 forbids; candidates are now
   never told the pack's path.
3. **The lenses get their own history-less checkout of the review base.** Run 3 reused a candidate's checkout, scratch
   tests included.
4. **No `launch.py`.** K2 lists no launch file, so the launch refusals live in `run.template.js`. The fill is a
   README one-liner, and a test runs it and compares its output with the test's own fill byte for byte. A `launch.py`
   that fills, hashes and checks paths on disk would be a natural follow-up.
5. **The run config carries the protocol without `sources`.** Otherwise the filled script would embed its own hash.
6. **pin `srcClean` also counts untracked, non-ignored files under the source directory.** Run 3 counted tracked
   changes only.

## Tests (red -> green), cwd `/home/user/task5-handoff/wt/sr-kit`, `python3 tools/test_calibration_kit.py [Class]`

| commit | tests added | red before the change | green |
|---|---|---|---|
| 435960f | Observations (10): flat map keys and adapter reads, totals sum and schema, layout, lens without forbidden, three-prong majority, void + supplementary, void without supplementary refused, missing input refused, PASS/PARTIAL/FAIL rule, `route.mjs rate` counts the built map | 9 tests: failures=8, errors=1 (the 10th, the adapter test, added after the builder: red by guard removal) | 10 OK |
| dc2d8c9 | Scripts (11): bash -n; one root commit with the source tree (export-ignore file kept, no source commit reachable); links opt-in and hidden; existing target and in-pack target refused; fix green PASS; fix touching `src/other.py` FAIL on scope; pin PASS; pin touching source FAIL; pin green at the base FAIL; vitest-json report read; grade.sh refuses an in-pack checkout, a review case, and a missing checkout (exit 3) | failures=10 (pin-green-at-base added after: red by guard removal) | 11 OK |
| 5dd0b8e | TemplateAndPrompts (6) and Hygiene (2) | errors=6 (the scanner self-test passes without kit files) | 8 OK |
| e3ef387 | RunTemplate (7) and Request (4) | failures=3, errors=8 | 11 OK |
| 3eb0e2c | Docs (9): lineage headers, file list, observation keys, numbered rules 3.1-3.5, nine steps, fill command equals the fill, every manifest field documented, shared stub, CHANGELOG and README lines | failures=2, errors=7 | 9 OK |
| 4129317 | Gate (1): registered right after test_claude_code_host_artifacts | failures=1 (not in CHECKS) | 1 OK |

The whole file: `Ran 50 tests ... OK` (3.11.15 and 3.12.3). Seven tests need Node and skip with a reason where it is
absent; Node 22 ran them here.

**Guard-removal proofs: 72.** Each removed one guard in place, ran the named tests and restored the file, with a
byte-identical check after the restore. Every proof went red when the guard was removed and green on restore. Logs:
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/srkit-proofs/c1..c7-guards.log`.

- **observations.py (10):** the review-grade key; the pin score; the token sum; the forbidden prong; the void refusal;
  the supplementary replacement; the PARTIAL rule; the missing-journal refusal; the rates; the void-cells write.
- **Scripts (15):**
  - a syntax error in each script;
  - run 3's `git archive` copy; a fetch of the source commit into the checkout;
  - the `info/exclude` line; the `--pack` refusal; the existing-target refusal;
  - the fix scope rule; pin `srcClean`; pin red-at-head;
  - the restore; the base swap; the accepted swap;
  - grade.sh's pack refusal; the vitest-json parser.
- **Template, classification and prompts (17):**
  - in the template: a key, `run_id` set, the forbidden prong, the limitation line, the relayed statement, the
    `pin-tests` category;
  - in classification.md: the S4 sentence, G-2;
  - in the lens prompt: `forbidden` in the schema, in its required list, and in the vote sentence;
  - in the other prompts: a placeholder's documentation, the grader's `truth` field, the assignment variant;
  - for the hygiene scan: a host path and a run id written into a kit file, and the session-id rule.
- **Run template and request (17):**
  - in the template: the RUN slot; the pack-path refusal; the relayed-text refusal; the frozen refusal; the prongs
    refusal; forbidden in the vote; the A-1 preamble; the quoted relayed text; the judging profile; the Definition in
    the grader prompt; the supplementary filter; the kept verdict;
  - in request.py: the operator sentence; a template section; the two-prong naming; the missing-scores refusal; a
    `subprocess` import.
- **Docs (10):** a lineage header; a listed file; a documented key; a numbered rule; an onboarding step; the fill
  command; a manifest field; the stub's sentence; the CHANGELOG line; the README row.
- **Gate (1):** the registration line.
- **Hygiene, literal rule (2):** a mid-word `/tmp/` in a kit file; the literal rule itself.

Gate-level proof: with the forbidden prong removed from `observations.py`, `python3 tools/run_regression.py` stopped at
`== test_calibration_kit == FAIL (exit 1)`, `REGRESSION GATE: 1 failure(s): [('test_calibration_kit', 1)]`. It passed
again after the restore.

## Checks (the Brief's acceptance checks)

- typecheck: `python3 -m py_compile tools/calibration/*.py tools/test_calibration_kit.py; bash -n` on both scripts:
  exit 0. Verified, on 3.11 and 3.12.
- lint: `python3 tools/check_secrets.py` reports `clean (0 hits)`, and the K3 hygiene test is green. The scan finds no
  absolute host path, no `/home/` or `/tmp/` string, no session or 32-hex or `wf_` id, no MoonAliza name, no
  environment read and no provider call under `tools/calibration/` outside a `{{placeholder}}` or an `EXAMPLE:` line.
  `grep -rn "/home/\|/tmp/" tools/calibration/` is empty. Verified.
- unit tests: 50 OK, red-first, with 72 guard proofs. Verified.
- full suite: `python3 tools/run_regression.py` reports `REGRESSION GATE: all checks PASS`, standalone (66 s) and
  through the pre-commit hook on each commit. Verified.
- refute-first review: not run by me. The Brief sets nested-allowed false, so it is the lead's step. Untested.
- CI (ubuntu-24.04, Python 3.12, `python tools/run_regression.py`): expected green, not run. The runner image has git
  and Node, and the tests isolate git config (`GIT_CONFIG_GLOBAL`), so the machine's commit signing and hooks path do
  not reach them.

## Untested, and limits

- `run.template.js` has run under a stub harness only. The real workflow harness's `agent` options, its wrapping of a
  script body, and its retry and `attempt` behaviour are taken from run 3's script and run file, not re-observed.
- `grade.sh`'s vitest-json mode has been driven by a stand-in that writes vitest's counters, never by vitest, and the
  script has not run on a TypeScript pack.
- The journal format in `observations.py` was documented from run 3's builder, and I also read the key names (not the
  contents) of run 3's harness journal and run file in the session's project directory to confirm them. Those two files
  are outside the Brief's six named sources. Nothing from them entered the kit beyond the key names.
- Nothing was run on Windows. `historyless-checkout.sh` needs git 2.28 or later (`init -b`).

## For the lead

1. The evidence-check unit (Item 4.3) should read the kit's grader schema: `truth[]` per finding, not run 3's
   `r8Found/r11Found`. In `scores.json`, `review.truth` replaces those keys, and `adjudication_schema` carries
   `prongs_in_lens_schema`, `prongs_in_classification`, `missing_prong` and `declared_rule_disagrees`.
2. The shared-pack unit (Item 2) needs a manifest in the format of `subject-pack/README.md`. The fixture
   `tests/fixtures/calibration/manifest.json` is a complete synthetic example, and `make_pack()` in the test builds a
   working two-line pack.
3. Run 3's fix candidates read their finding from a host scratchpad file outside their checkout. That is an isolation
   gap Item 2 names. The kit closes it by putting the finding in the prompt; worth a line in run 4's protocol.
4. K4 asks for a fixture of "three cells". It has three cells (pin and fix for alpha-low, review for beta-max) plus
   their judging agents (a grader, a clustering agent, three lenses).

## What I got wrong (all caught before the commit they belong to, except item 6)

1. **Mistake:** a test added with an Edit that did not apply (the file had changed on disk), so its first guard proof
   ran against a missing test. **Where:** Scripts, pin green at the base. **Impact:** none delivered; the proof log
   showed ERROR both ways. **Cause:** a stale read. **Fix:** re-added by script and re-proved. **Verified:** red, then
   green.
2. **Mistake:** the hygiene scan read a git-ignored `__pycache__` file (UnicodeDecodeError). **Where:**
   `Hygiene.scan`. **Impact:** a red test. **Cause:** the observations test imports the builder. **Fix:** caches
   skipped. **Verified:** Hygiene green.
3. **Mistake:** three placeholders on one documentation bullet. **Where:** `lens.prompt.md`. **Impact:** the
   documentation test went red, as designed. **Cause:** a combined bullet. **Fix:** one bullet each. **Verified:**
   green.
4. **Mistake:** the template's header quoted the fill slots literally, so a fill would also rewrite the comment.
   **Where:** `run.template.js`. **Impact:** none delivered; the slot test counted two of each. **Cause:** the
   documentation repeated the marker. **Fix:** the header describes the slots without their literal text.
   **Verified:** green.
5. **Mistake:** the relayed-text guard proof first stayed green. **Where:** RunTemplate. **Impact:** the test did not
   pin Item 3.2's refusal, because a second check refused the same input with a similar message. **Cause:** the
   assertion was too loose. **Fix:** it asserts the refusal's own message and also drops the whole record.
   **Verified:** red, then green.
6. **Mistake:** wrong test counts in commit messages. **Where:** `3eb0e2c` says "51 OK" (it was 49), and the first
   version of `4129317` said 52. **Impact:** two wrong numbers in commit reports, no code. `3eb0e2c` is committed as
   is: correcting it needs an interactive rebase, which is not available here; this report corrects it. **Cause:** I
   added counts by hand. **Fix:** `4129317` amended to 50, and the counts in this report are taken from the runner's
   own line. **Verified:** `Ran 50 tests`.
7. **Mistake:** the README's launch steps first had the protocol record the hash of a script that embeds the whole
   protocol, so the hash would depend on itself. **Where:** README step 4 and the template header. **Impact:** none
   delivered. **Cause:** the fill took the protocol verbatim. **Fix:** the protocol goes into the fill without
   `sources`. **Verified:** the fill-command test is green.
8. **Mistake:** the K3 scan matched host paths only at a path's start, while K3 says no `/home/` or `/tmp/` string at
   all. **Where:** `HYGIENE`. **Impact:** none found in the kit (the grep was empty). **Cause:** I wrote the rule
   before re-reading K3's wording. **Fix:** a literal rule, and a self-test sample only that rule catches. The removal
   proof first stayed green, because the existing sample was also caught by the path rule. **Verified:** red, then
   green.
9. **Mistake:** some test expectations of my own were wrong: "add answers a + b" (the fixture says "add(a, b) answers
   a + b"); a case-sensitive "retry limit 0"; a case-sensitive lineage check that missed the JSON template's
   `_lineage` key; a fill-command regex that started at the earlier hash one-liner. **Impact:** red runs only.
   **Fix:** each expectation corrected. **Verified:** green, and each guard proof red, then green.
