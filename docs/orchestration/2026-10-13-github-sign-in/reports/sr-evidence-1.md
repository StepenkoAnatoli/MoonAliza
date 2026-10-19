# sr-evidence report 1: the calibration evidence check and the generated qualification table

Builder: cc-opus-high (dispatch brief `smartrouter/trace/decisions/sr-evidence-1.json`; profile cc-opus-high,
claude-opus-5-5 at effort high). Worktree `/home/user/task5-handoff/wt/sr-evidence`, branch
`tools/calibration-evidence-check`, stacked on `tools/calibration-kit` at `229aa1f`. Five commits, not pushed. This
report file is not committed. Contract: `smartrouter/briefs/evidence-check-builder.md` (C1-C6).

## Gist

- `tools/check_calibration_evidence.py` checks every calibration evidence folder under the eight named rules a-h. A kit run gets every rule in full, derived through the kit's own `observations.py` functions. A legacy run (runs 1-3) is checked for what it can answer, and what it cannot answer prints as a `LIMIT`. Exit 1 on any `FAIL`.
- The three real folders pass with 14 named limitations and no failure. No stop trigger fired: no real folder contradicts itself under any rule. Run 3's two would-fail flags and its stated "13 of 15" count are consistent.
- `tools/qualification_table.py [--check]` generates `docs/evidence/qualification-table.md`: 39 rows, with fewer-prong, unadjudicated and supplementary PASSes shown and not counted, and the four "does not support" statements. It refuses to write when the check fails.
- All four steps are registered in the gate after `test_calibration_kit`. The gate has 56 steps, all PASS, through the pre-commit hook on each of the five commits. The tests are red-first (48 in all), and every guard has a removal proof (31 mutations, each red).
- Judgement calls for the lead are in "Findings for the lead" below: supplementary PASSes are excluded from the count (a literal reading of C3); the grader is named from `protocol.json`, not the README; and run 3's unflagged PASSes cannot be verified, because its lens records carry no `forbidden` field.

## Commits

| sha | subject |
|---|---|
| `02c3756` | tools: check_calibration_evidence.py - rules a-h over kit runs, with one synthetic failing folder per rule |
| `69558e7` | tools: check_calibration_evidence.py - the legacy classification of calibration runs 1-3, every unanswerable rule a named limitation |
| `6653d61` | tools: qualification_table.py - the generated qualification table over every accepted run, caveated PASSes shown and not counted |
| `acb407f` | tools: run_regression.py - the evidence check, the qualification table's --check and their two suites join the gate after the kit |
| `1c22574` | docs: the evidence README, the kit's results-check paragraph and the changelog line for the evidence check and the table |

Every commit uses the identity `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>` and the trailers
`Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and `Claude-Session: https://claude.ai/code/session_01VdJ51CTnHT4Zet6eScsBBh`.
Each carries the five-part report: what changed, why, what it touched, what you verified, what you got wrong. No
`--no-verify` was used. The pre-commit hook ran the full gate on each commit, about 70 s each.

## Files

- `tools/check_calibration_evidence.py` (new): the check.
- `tools/test_check_calibration_evidence.py` (new): 31 tests. `--write-fixtures` regenerates the fixtures.
- `tests/fixtures/calibration-evidence/` (new, 73 files): `pass/` plus `a-protocol-frozen/` ... `h-no-secrets-or-bodies/`, each holding `fixture-host-calibration-1/`.
- `tools/qualification_table.py` (new): the generator.
- `tools/test_qualification_table.py` (new): 17 tests.
- `docs/evidence/qualification-table.md` (new, generated, committed with its generator).
- `tools/run_regression.py`: four registration lines.
- `docs/evidence/README.md` (new): what the check enforces, what the table supports.
- `tools/calibration/README.md`: one paragraph after the Request step.
- `CHANGELOG.md`: one Unreleased line.

`git diff --name-only 229aa1f..HEAD -- 'docs/evidence/2026-*'` is empty: no evidence folder changed. The kit, the host
adapter and the skills are unchanged too (C6).

## Design as built

**Kind (C1).** A folder is a kit run if `protocol.json` carries any of `classification.prongs`, `judging_profile` or
`relayed_operator_text`. A partial kit run is therefore still a kit run, and fails the rule whose key is missing. It
also needs `schema_version` at or above the template's (read from `protocol.template.json` at run time); a lower
version is a protocol-frozen failure. A folder with none of the three keys is a legacy run.

**Kit run, rules a-h (C2).**

- **(a)** Status is `frozen` or begins `run complete` (the template's two values). The check also needs `run_id` and `frozen_at`, no `{{placeholder}}` left (the kit launch step's scan, keys included, with the relayed text exempt), and `scores.json` `run_id` equal to the protocol's.
- **(b)** The protocol's prongs must equal the prongs present in every lens record of `adjudication.json`. `adjudication.json` `declared-prongs`, `scores.json` `adjudication_schema.prongs_in_classification` and `prongs_in_lens_schema` must all agree with the records. With no lens records there is nothing to compare, and the rule passes.
- **(c)** Each pin and fix score must equal `score is True` in `observations.json`. Each review result is recomputed with the kit's own `BLOCKING`, `votes` and `review_result`: every clustered S1-S3 other is judged real by two votes under the declared prongs, and an unclustered one is taken from the grader's classification. Profile and case presence must match, and a null score counts as not run.
- **(d)** This rule applies only when the declared prongs miss one of the three. A PASS that is not a PASS under all three prongs must carry `would_fail_under_three_prong: true`. A flag on a non-PASS, or on a PASS that passes on all three prongs, fails. The stated `totals.cells.review` count must either exclude the flagged PASSes or state the three-prong count. When no prong is missing, a wrong PASS is a (c) failure, reported once.
- **(e)** `category_mapping.pin` must be `pin-tests` whenever a pin cell exists.
- **(f)** `judging_profile` must name key, model and effort, plus either a filled qualification or a limitation starting `judging profile not independently qualified`. The bootstrap case passes with a LIMIT, and the table caveats its review PASSes `judge not qualified` (Item 3.3).
- **(g)** `relayed_operator_text.text` must be a non-empty string or null, and `statement` must be filled.
- **(h)** No file may match a `check_secrets.PATTERNS` entry, decoded with `check_secrets.decode_text`. The hit names the file, line and pattern, never the value. No `*.prompt*`, `journal.jsonl` or `transcript*` file may be present.

**Legacy run (C1).**

- **(a)** `run_id` present and repeated by `scores.json`.
- **(b)** With `adjudication_schema` (run 3): both sets must be declared, and `missing_prong` must equal the classification set less the lens set (a string or a list). `adjudication.json` `lens_schema_prongs` and `classification_prongs` must agree, the lens records must carry exactly the declared lens prongs, and the missing prong is a LIMIT. Without a schema (runs 1-2): a LIMIT.
- **(c)** The folder's own pass rules are taken from `protocol.json` `cases[].pass_rule`, which is where each `scores.json` `pass_rules` points. They are recognised by the SHA-256 of their text and applied to the observations' fields:
  - run 1: the pin pass excludes lint, and the review needs R16 only;
  - runs 2-3: lint is in the pin pass, and review is three-valued;
  - run 3: false blocking is recounted from `adjudication.json`'s lens votes under the run's own lens rule.

  An unencoded rule text is refused, never guessed: a new run is a kit run.
- **(d)** Run 3: each flag must sit on a PASS, with at least one S1-S3 other in a cluster real by the lens rule. `three_prong_false_blocking` must be between 1 and the number of such findings, and the stated count must agree. A LIMIT records that the reading behind the flags is the run's own. Runs 1-2: every review PASS is `unadjudicated`, a LIMIT.
- **(e)** No mapping (runs 1-2): a LIMIT naming the protocol's label and rule 4.
- **(f)** A LIMIT naming the grader from `protocol.json` `cases[review].grading`.
- **(g)** A LIMIT naming the amendment that recorded the relayed text (run 3: A-1), or saying it is not recorded.

**The 14 LIMIT lines over the real folders** are asserted exactly by
`LegacyRuns.test_the_three_real_folders_pass_with_exactly_these_limitations`:

- Runs 1-2, five each: no adjudication record (prongs-declared); 8 and 9 unadjudicated review PASSes; no category_mapping (the pin case is labelled build-tests); the grader opus-high, its qualification not recorded; relayed text not recorded.
- Run 3, four: the lens schema carried holds and reachable, so `forbidden` is missing; its flags (haiku-medium, haiku-high) are the run's own reading; the grader opus-high; the relayed text was recorded after the run in A-1.

**Table (C3).**

- **Layout.** A section per host: the host is the folder-name prefix before `-calibration`, or else `protocol.host`. Each section has a run legend (folder, run id, supplementary run id, kind, what review grades rest on). It then has one row per (profile, category) with these columns:
  - profile, model, effort, and config (`not named` when the protocol names none);
  - category (the pin case is pin-tests) and tier (`not recorded` for runs 1-3);
  - one column per run, in run order, headed `run N (<run id>)`;
  - `passes` (`k of n`, uncaveated PASSes of graded cells), `adjudication` (per run: `none`, or the scores schema version with its prongs and the missing prong; `mechanical` for pin and fix), and `caveats`.
- **Header.** The four does-not-support statements, how to read the table, and every LIMIT line the check recorded.
- **Determinism.** No timestamps. `--check` compares bytes.

## Tests, red and green

| suite | red (before the code) | green |
|---|---|---|
| `tools/test_check_calibration_evidence.py`, commit 1 (kit runs, fixtures, discovery) | 18 tests with no check file: failures=13, errors=28 | 18 tests OK, then 19 with the test added for the (b) guard |
| same, commit 2 (legacy runs, 8 new tests) | against commit 1's check: failures=10, errors=10 | 27 tests OK |
| `tools/test_qualification_table.py`, commit 3 | no tool file: the Table class errored in setUpClass, Gate failures=5 | 16 tests OK |
| `tools/test_check_calibration_evidence.py`, commit 4 (Gate) | the registration test: failures=1 | 28 tests OK |
| both, commit 5 (Docs, four tests) | failures=2, errors=1 (check suite) and errors=1 (table suite) | 31 and 17 tests OK |

The failing fixtures, each failing only its named rule (`KitRuns.test_each_failing_fixture_fails_its_rule_and_nothing_else`):

| fixture | edit of pass/ |
|---|---|
| a | protocol `run_id` null |
| b | protocol prongs set to holds and reachable |
| c | `alpha-low` pin pass flipped |
| d | pass/ built by `observations.py` under a two-prong protocol whose lens records carry no `forbidden`; the kit flags the PASS, then the flag is taken away |
| e | `category_mapping.pin` set to build-tests |
| f | qualification and limitation both null |
| g | relayed statement empty |
| h | a `journal.jsonl` added |

The secrets case is written by concatenation in the test, never as a literal (`"sk-" + "ant-" + ...`). Further
single-rule cases:

- a prompt body, a transcript and a journal file;
- a two-prong run that flags but still counts the PASS;
- a flag on a three-prong PASS;
- a lens vote change that flips the derived review;
- the bootstrap judge, which passes with a LIMIT, and a non-bootstrap limitation, which fails;
- relayed text: verbatim or null, plus four bad forms and the key missing;
- protocol freeze: status, schema_version, a placeholder value, a placeholder key, a run id mismatch, and `run complete` accepted;
- scores against records: six cases;
- missing or unreadable files, by name;
- output format and the summary line;
- discovery of both glob patterns, each folder once;
- the committed fixtures equal the kit-built ones byte for byte.

Legacy cases run on copies in a temp directory:

- six score contradictions across runs 1-3, including a C-4 lens vote that turns haiku-high's run-3 review into a non-PASS;
- an unencoded pass rule;
- four run-3 flag and count contradictions;
- five run-3 schema contradictions;
- run id agreement;
- no FAIL for missing kit keys.

Table tests:

- one row per (profile, category) the folders hold (39);
- model, effort and config;
- run 3's two flagged cells read `PASS (2-prong, would fail)`, at 0 of 3;
- runs 1-2 review PASSes read `PASS (unadjudicated)` and are not counted;
- supplementary cells are caveated and not counted;
- pin and fix rows count, and read `mechanical`;
- the adjudication column;
- the four header statements;
- the run ids and the LIMIT lines;
- determinism;
- `--check` passes on the committed table and fails on three edited copies and on a missing file;
- the write gives the committed bytes;
- it refuses to write on a failing check;
- a kit run gets its own host section;
- the bootstrap caveat.

## Guard-removal proofs (each red under the mutation, green on restore, file restored byte-identical; verified)

Check, kit rules (19 tests at the time):

| guard removed | tests red |
|---|---|
| (a) the whole rule | 3 |
| (b) lens-schema equality | at first 0: the b fixture also trips the scores-consistency half. I added `test_declared_prongs_must_equal_the_lens_schema_even_when_the_folder_agrees_with_itself`, which then goes red (1) |
| (c) review under declared prongs | 2 |
| (c) pin/fix | 2 |
| (d) missing flag | 1 |
| (d) stated count | 1 |
| (e) | 1 |
| (f) | 3 |
| (g) | 2 |
| (h) names | 2 |
| (h) patterns | 1 |

Check, legacy:

| guard removed | tests red |
|---|---|
| run_id agreement | 1 |
| the score comparison | 1 test (6 subtests) |
| the unencoded-rule refusal | 1 |
| run 3's adjudicated false blocking replaced by the grader's classification | the real-folders test (1) |
| missing_prong consistency | 1 |
| adjudication.json prong keys | 1 |
| undeclared lens prong | 1 |
| flag only on a PASS | at first 0, masked by the count check; after tightening the assertion to the guard's own message, 1 |
| flagged cell needs a real blocking other | at first 0 (same cause); after tightening, 1 |
| the unadjudicated LIMIT dropped | 2 |
| a legacy LIMIT turned into a FAIL | 4 |

Table:

| guard removed | tests red |
|---|---|
| counting every PASS | 6 |
| flagged caveat | 3 |
| unadjudicated caveat | 3 |
| supplementary caveat | 3 |
| bootstrap caveat | 1 |
| refusal on a failing check | 1 |
| `--check` comparison | 1 |
| one does-not-support statement dropped | 3 |

Gate: dropping the `qualification_table` line gives 1 red; dropping the `check_calibration_evidence` line gives 1 red.

## Checks (acceptance list of the dispatch brief)

- `python3 -m py_compile tools/check_calibration_evidence.py tools/qualification_table.py tools/test_check_calibration_evidence.py tools/test_qualification_table.py`: exit 0 (verified).
- `python3 tools/check_secrets.py`: clean, 0 hits, with the fixtures tracked (verified). The check's own secrets rule passes on the three real folders (verified).
- `python3 tools/test_check_calibration_evidence.py; python3 tools/test_qualification_table.py`: 31 and 17 tests OK, red first as above (verified).
- `python3 tools/run_regression.py`: exit 0, 56 steps `PASS (exit 0)`, `REGRESSION GATE: all checks PASS`, including the four new steps (verified). It also passed through the pre-commit hook on all five commits (verified by each commit landing).
- `python3 tools/check_calibration_evidence.py`: `3 folder(s), 0 failure(s), 14 limitation(s)`. `python3 tools/qualification_table.py --check`: the committed table is the generated one (verified).
- Refute-first review: not mine to run; it is owed by the lead.

The environment was Python 3.11.15, with cwd `/home/user/task5-handoff/wt/sr-evidence` for every command.

## Findings for the lead

1. **Supplementary PASSes are not counted.** C3 lists `supplementary` among the caveats and says the pass count "excludes every caveated PASS". Read literally, run 3's `fix:haiku-high` and `review:haiku-low` PASSes (A-1's legitimate re-runs) do not count: they read 2 of 3 and 0 of 3. If the intent was to count a supplementary re-run as an ordinary grade, the change is one line in `Run.cell`, the caveat list given to the count, plus the tests that pin it. The docs state the current rule.
2. **Run 3's unflagged review PASSes cannot be verified.** The run-3 lens records carry no `forbidden` field. Computed mechanically, every clustered run-3 PASS would fail under three prongs: 11 of 15, not the 2 that G-2 flags. G-2's two flags come from reading the lens prose. So, as C1 says, the check verifies the flags' consistency and the stated count, and records the reading itself as a LIMIT. Run 3's other 13 review PASSes count in the table as uncaveated PASSes resting on a 2-prong schema; the adjudication column says "missing forbidden" on every run-3 review row.
3. **The grader is named from `protocol.json`, not the README.** C2(f) says a legacy run names its grader "in the README (run 3: opus-high)". Run 2's and run 3's READMEs do not name the grader, but every protocol's `cases[review].grading` does ("model opus, effort high" and "opus high"). The LIMIT text says where the name came from.
4. **What the check cannot see.** These are listed in `docs/evidence/README.md`:
   - "run_id recorded before the launch": the folder holds no ordering, though the git history does. The check verifies presence and agreement only.
   - Pass counts stated in prose (READMEs, `results-table.md`): not parsed. Only `scores.json` `totals.cells.review` is checked.
   - Item 4.3's "every grade entry in the adapter's form": a property of the host policy (the adapter's validator), not of a folder. It is not in rules a-h.
5. **(b) on a kit run checks equality only.** A kit run that declares two prongs and whose lens records carry two passes (b), as C2 says. Rule (d) then catches every fewer-prong PASS against the full three. The kit's launch step already refuses a protocol whose prongs are not all three, so such a folder can only come from outside the kit (fixture d shows it).
6. **Integration with sr-pack (stacked on the same base).** Both units add an Unreleased CHANGELOG line and a paragraph to `tools/calibration/README.md`, so a textual merge conflict is likely. My CHANGELOG line deliberately avoids the substring `tools/calibration/`, because the kit's `test_changelog_and_readme_name_the_kit` allows exactly one such Unreleased line. If sr-pack's adjusted version of that test counts differently, re-run both suites after the merge.

## What I got wrong and fixed

1. **(d) double-reported (c).**
   - mistake: (d) reported a second failure beside (c) when a three-prong run's lens vote changed.
   - where: `kit_fewer_prong`, commit 1 before landing.
   - impact: a doubled failure line in one test; nothing delivered.
   - cause: the flag rule did not ask whether any prong was missing.
   - fix: it fires only when the declared prongs miss one.
   - verified: suite re-run, OK.
2. **Two test cases expected one rule where two legitimately fire.**
   - mistake: the cases were a `{{placeholder}}` relayed statement (also rule a) and lens records stripped of `forbidden` (which also changes the derived review).
   - where: `tools/test_check_calibration_evidence.py`, commit 1 before landing.
   - impact: false reds; nothing delivered.
   - cause: I designed the edits without tracing every rule they touch.
   - fix: replaced by cases that isolate their rule.
   - verified: suite OK, and each guard's removal still turns a test red.
3. **Run 2's review-only profiles failed scores-derivable.**
   - mistake: the check reported "pin:sonnet-xhigh is in scores.json only".
   - where: the presence test in `legacy_scores` and `kit_scores`.
   - impact: the real-folders test was red before commit 2; nothing delivered, and no folder was edited.
   - cause: `scores.json` writes `"pin": null` for a case not run, and I tested key presence.
   - fix: a null score is treated as not run, in both derivations and in the pin mapping's presence test.
   - verified: suite OK; the real folders give 0 failures.
4. **Three guards were unproven at first.**
   - mistake: (b) lens-schema equality, flag-only-on-a-PASS, and flagged-cell-needs-a-real-blocking-other had tests that passed with the guard removed.
   - where: the b fixture and `test_run3_flags_and_count_must_agree`.
   - impact: an unproven guard; nothing delivered.
   - cause: a sibling check fired on the same edit, and the assertion matched the sibling's message.
   - fix: a dedicated (b) test, and assertions on each guard's own message.
   - verified: each guard removed now turns its test red.
5. **The first README draft said a folder is never edited after its commit.**
   - mistake: that contradicts run 3, whose protocol was amended after the run.
   - where: `docs/evidence/README.md`.
   - impact: none delivered; caught before commit 5.
   - cause: I generalised this unit's rule to everyone.
   - fix: "never edit a file in it, except for the run's own amendments appended to its protocol".
   - verified: docs tests OK.
