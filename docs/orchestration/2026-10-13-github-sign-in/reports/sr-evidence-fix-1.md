# sr-evidence fix round 1: review findings F1-F6 (the calibration evidence check and the qualification table)

Builder: claude-opus-5-5. Worktree `/home/user/task5-handoff/wt/sr-evidence`, branch `tools/calibration-evidence-check`.
Seven commits on top of `1c22574`, one per finding plus one proof follow-up, not pushed. This report file is not
committed. Contract: `smartrouter/briefs/evidence-check-builder.md` (C1-C6). Review: `sr-evidence-review-1.md`.

## Gist

- F1 (S2) fixed in `4863d10`. A legacy run that scores a case with no encoded pass rule now fails `scores-derivable`, whether the case was dropped or renamed. A case stated twice also fails. The reviewer's three folders now exit 1, and the table refuses them.
- F2 (S3) fixed in `3c3220a` and `0fe67a7` (tests only). The 11 named guards now have tests that assert each guard's own message. A sweep silences each `r.fail`/`r.limit` call site of the check in turn. At HEAD it finds 0 of 89 sites that no test notices; before this round, 29 of 75 went unnoticed.
- F3 (S4) fixed in `5e9aedf`. A value of the wrong shape is now a `FAIL` under the rule that reads it, never a traceback. There are named guards for every shape the sweep reaches, plus a net under each rule. The table no longer raises on a malformed protocol profile list.
- F4 (S4) fixed in `e96f08c`: a kit run's status must equal one of the template's two values exactly. F5 (S4) fixed in `6c625f8`: the forbidden names match in any case. F6 (S4) fixed in `b988ab6`: table runs are labelled by the folder's `-calibration-<n>`.
- Every fix was red first against the commit before it, and every guard has a removal proof. The two suites run 48 and 18 tests, OK. The real folders still give 0 failures and the same 14 LIMIT lines, and the committed table is unchanged. The gate passed through the pre-commit hook on all seven commits. No finding was rejected.

## Commits

| sha | finding | subject |
|---|---|---|
| `4863d10` | F1 | check_calibration_evidence.py refuses a legacy run's scored case that no encoded pass rule judges, and a case stated twice |
| `3c3220a` | F2 | test_check_calibration_evidence.py proves every guard of the evidence check by its own message |
| `5e9aedf` | F3 | check_calibration_evidence.py reports a value of the wrong shape as a FAIL under the rule that reads it, never a traceback |
| `e96f08c` | F4 | check_calibration_evidence.py accepts a kit run's status only as one of the template's two values, exactly |
| `6c625f8` | F5 | check_calibration_evidence.py matches the forbidden prompt, journal and transcript file names in any case |
| `b988ab6` | F6 | qualification_table.py labels each run by its folder's run number, not its position in the list |
| `0fe67a7` | F2, F3 | the seven shape-guard lines F3 added are proven by their own messages |

Every subject starts `tools: <id> - `.

- **Identity:** `StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>`.
- **Message format:** each message carries the five named parts and the `Co-Authored-By: Claude Opus 5.5` and `Claude-Session` lines.
- **Hook:** no `--no-verify`. The pre-commit hook ran `tools/run_regression.py` on each commit and reported `REGRESSION GATE: all checks PASS`.
- **Amend:** `5e9aedf` was amended once, before any later commit, to correct a count in its own message ("7 of the 17", not "8"). The hook ran again on the amend.

## Files

All six files below are inside the brief's permitted paths:

- `tools/check_calibration_evidence.py` (F1, F3, F4, F5)
- `tools/test_check_calibration_evidence.py` (every finding but F6)
- `tools/qualification_table.py` (F3, F6)
- `tools/test_qualification_table.py` (F6)
- `docs/evidence/README.md` (F1, F3, F4, F6: one line or sentence each)

`docs/evidence/qualification-table.md` is unchanged: the real folders are runs 1-3, so --check still passes.

`git diff --name-only 1c22574..HEAD` lists only those five. No evidence folder, kit file, adapter file or skill changed (C6).

## F1 (S2): a legacy run passing by dropping its own pass rules

- **Reproduced** at `1c22574`, in scratch copies. Each of the reviewer's three folders exits 0:
  - the pass fixture with `judging_profile`, `relayed_operator_text`, `classification` and `cases` popped and every lens set to holds:false: `0 failure(s), 2 limitation(s)`;
  - run 1 with `cases` popped and opus-high's pin flipped;
  - run 2 with the fix case renamed and opus-high's fix flipped.
- **Fix** (`legacy_scores`):
  - Each case that `scores.json` scores (any profile with a non-null pin, fix or review), but for which the protocol states no encoded rule, fails `scores-derivable`: "legacy run: no encoded pass rule for the <case> case, which scores.json scores; protocol.json states none this check encodes, and a new run is a kit run".
  - A case stated twice fails too. Before, the last entry won silently.
  - A case already refused for an unencoded rule text is reported once, not twice.
- **Tests:**
  - `LegacyRuns.test_a_scored_case_with_no_encoded_pass_rule_fails`: the stripped pass fixture fails all three cases; run 1 with no cases fails all three; run 2's renamed fix fails fix only, and nothing else.
  - `LegacyRuns.test_a_case_stated_twice_fails`.
- **Red first:** failures=2.
- **Guard proofs:** removing the scored-without-rule refusal turns 1 test red; removing the duplicate refusal turns 1 test red.
- **After:** the reviewer's three folders exit 1, naming each unjudged case. `qualification_table.py` over the first refuses: "refused: the evidence check fails; nothing written".
- **Set aside:** classing a folder at the template's `schema_version` as a kit run. Runs 1-3 carry `schema_version` 1, which is the template's own, so the version cannot tell the classes apart. With F1, a stripped folder can pass as legacy only if its rule texts hash to one of the nine encoded texts of runs 1-3, and it is then checked under that rule.

## F2 (S3): guards with no removal proof

- **Reproduced:** all 11 of the reviewer's removals left both suites green at `4863d10`.
- **Fix (tests only, `3c3220a`):** a test for each guard, asserting the guard's own message:
  - kit guards:
    - frozen_at presence, as a case in the freeze test;
    - judging_profile key, model and effort;
    - a flag on a review that passes all three prongs (the existing test now asserts its own message, which the stated-count check masked);
    - a flag on a non-PASS;
    - declared-prong validity (`["holds","bogus"]`, `[]`, `"holds"`);
    - the binary-extension skip (a PNG passes);
  - legacy guards:
    - run 3's `three_prong_false_blocking` range (0, 99, "2");
    - a flag when no prong is missing;
    - a pin flag and a fix flag;
    - an encoded rule stated for another case;
    - profile-set equality, on each side.
- **The sweep:** `r.fail(`/`r.limit(` is replaced at one call site at a time by a no-op, and both suites are run. Before the further tests, 18 more of 75 sites survived:
  - kit: the builder's count form, the missing adjudication_schema, `prongs_in_classification`, the non-flat observations, a pin case on one side, a review on one side, an unknown cluster;
  - an unscannable text file;
  - legacy: adjudication.json present without a schema, the schema not declaring both sets, lens records not carrying the declared set, observations in neither form, a case on one side, an unknown cluster, a flag with no adjudication record, no grader named, adjudication.json not an object, adjudication.json unreadable.
  Each now has a case asserting its own line. The new tests are `KitRuns.test_each_kit_guard_fails_with_its_own_message`, `LegacyRuns.test_each_legacy_guard_fails_with_its_own_message` and five single tests.
- **Result:** the 11 named removals each turn at least one test red, and the sweep over 75 sites gives 0 survivors (verified at `3c3220a`). After F3 added 14 sites, a re-sweep found 7 F3 lines unproven. `0fe67a7` covers them, and the final sweep over all 89 sites at HEAD gives 0 survivors (verified, four ways in parallel on `git archive` copies).

## F3 (S4): tracebacks on malformed shapes

- **Reproduced:** each of the reviewer's five shapes exits 1 with an `AttributeError` traceback and no FAIL line. A sweep then replaced every node of every JSON file with a value of another type. It covered the pass fixture, run 1 and run 3, one profile of each shape. It found 94 raising shapes across 20 sites, 2 of them in the table.
- **Fix:**
  - Named guards, each failing the rule that owns the field:
    - a cell in either file that is not an object, kit and legacy: `<case>:<profile> in <file> is not an object`;
    - a profile entry that is not an object, and `scores.json` profiles that is not an object (every rule reads profiles through `profiles_of`);
    - a review's `others` that is not a list of objects with cluster ids, and `truth` that is not an object of findings, through a `Malformed` exception;
    - `classification` that is not an object (prongs-declared);
    - `totals` or `cells` that is not an object while a PASS is flagged (fewer-prong-pass-flagged);
    - run 3's prong sets and `missing_prong` that are not prong names;
    - lens records whose cluster id is not an id. These are not records, so a finding that names one fails as naming a cluster the record does not hold.
  - Under them, `guarded()` runs each rule. An `AttributeError`, `TypeError`, `KeyError`, `ValueError` or `IndexError` on a shape no guard foresaw becomes that rule's FAIL: "a value has the wrong shape for this rule (...)".
  - The table's `profile_entries` takes only list entries whose key is a string.
- **Tests (class `Shapes`):**
  - Twelve shapes, each asserting its exact line: the reviewer's five, two that a node-for-node replacement cannot reach, and the six from `0fe67a7`.
  - The net, by a rule patched to raise.
  - The sweep, which asserts three things: nothing raises; no failure went through the net (a foreseen shape must be named by a guard); and the table renders every folder the check still accepts.
- **Red first:** against `3c3220a`, failures=6 and errors=2, with 94 sweep crashes. With only the table fixed there are 76; with only the check fixed, 18.
- **Guard proofs:** 17 removals (each named guard, `profiles_of`, the table filter, the net) each turn a Shapes test red. Then 7 more lines were proven in `0fe67a7`, as above.
- **After:** the reviewer's five shapes each exit 1 with a FAIL line and no traceback.
- **Cost:** the Shapes sweep adds about 10 s to the check suite, which now takes about 19 s.
- **Set aside:**
  - The net alone: it gives a generic message, so a reader cannot tell which field is wrong.
  - A JSON-schema pass in front of the rules: it duplicates every rule's reading in a second place that would drift.

## F4 (S4): status by prefix

- **Fix:** `template_statuses()` reads the template's `"{{frozen | run complete; ...}}"` at run time. The status must equal one of the two values. The message names both.
- **Test:** `KitRuns.test_status_is_one_of_the_templates_two_values_exactly`.
  - Pass: both template values.
  - Fail on `protocol-frozen` alone: "run complete; but never frozen", "run complete", "frozen ", "Frozen", and the run-complete line with text appended.
- **Red first:** failures=5. Three statuses were accepted; two failed with the old message.
- **Guard proofs:** putting back the prefix test turns 3 subtests red; removing the rule turns 2 tests red.
- **Real folders:** runs 1-3 are legacy, where rule (a) reads only the run id, so they are unaffected.

## F5 (S4): case-sensitive names

- **Fix:** `re.I` on the three `FORBIDDEN_NAMES` patterns.
- **Test:** the existing names test also takes `Review.PROMPT.md`, `Transcript.txt` and `JOURNAL.JSONL`.
- **Red first:** failures=3.
- **Guard proofs:** dropping `re.I` from each pattern in turn turns the test red.

## F6 (S4): run labels by position

- **Fix:** `run_number(folder, position)` reads `n` from `<host>-calibration-<n>`. A name with no suffix is run 1, and any other name keeps its position. It drives the column headers, the legend, and the per-run adjudication and caveat entries.
- **Test:** `Gate.test_each_run_is_labelled_by_its_folders_run_number_not_its_position`.
  - Runs 1 and 3 alone read `run 1 (...)` and `run 3 (wf_4e9ef48d-066)`, with run 3's caveat, adjudication and legend row, and no `run 2`.
  - The kit fixture copied into a `-calibration-4` folder reads run 4.
  - `run_number` itself, for the three name forms.
- **Red first:** failures=1. Run 3's id appeared under "run 2".
- **Guard proofs:** three mutations each turn the test red: the enumerate label; an unsuffixed folder taking its position; another name not keeping its position.

## Tests, red and green

| suite | red (before the fix) | green |
|---|---|---|
| check, F1 | failures=2 | 33 OK |
| check, F2 | the 11 removals green at `4863d10`; 18 more survivors in the sweep | 44 OK; 0 of 75 survivors |
| check, F3 | failures=6, errors=2 (94 crashes) | 47 OK |
| check, F4 | failures=5 | 48 OK |
| check, F5 | failures=3 | 48 OK |
| table, F6 | failures=1 | 18 OK |
| check, `0fe67a7` | 7 of 89 sites silenced unnoticed | 48 OK; 0 of 89 survivors |

## Checks

All commands were run with cwd `/home/user/task5-handoff/wt/sr-evidence` on Python 3.11.15.

- `python3 tools/test_check_calibration_evidence.py`: 48 tests OK (verified).
- `python3 tools/test_qualification_table.py`: 18 tests OK (verified).
- `python3 tools/check_calibration_evidence.py`: `3 folder(s), 0 failure(s), 14 limitation(s)`, the same 14 lines as report 1 (verified).
- `python3 tools/qualification_table.py --check`: the committed table is the generated one (verified).
- `python3 tools/check_secrets.py`: clean, 0 hits (verified).
- `python3 -m py_compile` on both tools: exit 0 (verified).
- `python3 tools/run_regression.py`: `REGRESSION GATE: all checks PASS` at `b988ab6` (verified). It also passed through the hook on every commit, `0fe67a7` included (verified).
- The reviewer's repro folders, re-run at HEAD: F1's three fail scores-derivable; F3's five each give a FAIL line and no traceback; F4's and F5's fail their rules (verified).
- Refute-first re-review: owed by the lead.

## Findings for the lead

1. **The guard-proof claim, restated.** Report 1 said every guard has a removal proof. That was wrong for 29 of 75 call sites. The proof as it stands now has two parts:
   - every `r.fail`/`r.limit` call site in the check (89 at HEAD) turns at least one test red when silenced;
   - the named condition mutations listed per finding above each turn a test red.

   Guards inside the table generator were proven only where report 1 and F3/F6 list them. No sweep has been run over `qualification_table.py`.
2. **The shape net.** `guarded()` turns any of five exception types in a rule into that rule's FAIL. An internal bug in a rule therefore shows as a FAIL with the exception's text, not a traceback. That is fail-closed and C2's format, but less loud. The Shapes sweep fails if any fuzzed shape reaches the net, so the net is kept for shapes no guard foresaw.
3. **Gate time.** The check suite went from about 4 s to about 19 s, almost all of it the Shapes sweep (sampled: one profile of each shape, two list items).
4. **`0fe67a7` is a seventh commit.** It is the proof for F3's own lines. It was found by re-running the sweep after F3, and is kept separate rather than rewriting four commits of history.

## What I got wrong and fixed

1. **The freeze test's folder name.**
   - mistake: the new frozen_at case first failed for the test's own reason.
   - where: `test_protocol_freeze_failures`, `copy_pass(needle + index)`.
   - impact: a false red; nothing delivered.
   - cause: the needle put spaces in the folder path, and `rule_of` splits the FAIL line on spaces.
   - fix: folders named `f<index>`.
   - verified: suite OK.
2. **The first shape sweep tested the symptom, not the guards.**
   - mistake: it only asserted that nothing raised.
   - where: `Shapes.test_no_value_of_the_wrong_shape_raises`.
   - impact: with the net in place, 7 of 17 F3 guards could be removed with the suite green; nothing delivered.
   - cause: the net and the guards answer the same symptom.
   - fix: the sweep also refuses any failure that went through the net, and two unreachable shapes got their own cases.
   - verified: all 17 removals red.
3. **F3's commit claimed its guards proven when 7 lines were not.**
   - mistake: "17 removals proven" in `5e9aedf`'s report.
   - where: the commit message and the Shapes tests.
   - impact: those lines could be deleted with the suite green. The code was right; only the proof was missing. Nothing delivered past the branch.
   - cause: I proved F3 by condition mutations and did not re-run the call-site sweep after it.
   - fix: `0fe67a7`.
   - verified: each of the 7 red when silenced, and the full sweep at 0 of 89.
4. **A miscount in F3's message.**
   - mistake: "8 of the 17".
   - where: `5e9aedf`'s got-wrong part.
   - impact: a wrong number in a commit report.
   - cause: counted from memory.
   - fix: amended to 7 before the next commit, with the hook re-run.
   - verified: `git log -1` shows "7 of the 17".
5. **F6's first proof left a branch unproven.**
   - mistake: the "no suffix is run 1" mutation stayed green.
   - where: `run_number`.
   - impact: none delivered.
   - cause: the run-1 folder always sorts first, so its position is 1 too.
   - fix: the test asserts `run_number` directly.
   - verified: all three mutations red.
6. **Report 1's overstatement (F2) and the defects behind F1, F4, F5 and F6 were mine.**
   - where: F1 in `69558e7`; F4 and F5 in `02c3756`; F6 in `6653d61`.
   - Each commit's got-wrong part names the mistake, impact, cause, fix and proof.
