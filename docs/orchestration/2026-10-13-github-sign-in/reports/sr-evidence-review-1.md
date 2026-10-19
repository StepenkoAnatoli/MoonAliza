# Review 1 of unit sr-evidence (refute-first)

Unit: the calibration evidence check and the qualification table, worktree `/home/user/task5-handoff/wt/sr-evidence`,
base `229aa1f`, head `1c22574` (five commits: 02c3756, 69558e7, 6653d61, acb407f, 1c22574).
Contract: `briefs/evidence-check-builder.md` (C1-C6). Specification where the brief defers: proposal Items 4.3-4.4.
Checklist: `briefs/router-reviewer.md` (refute-first, S1-S4).
Reviewer: changed nothing in the worktree. Every probe ran on scratch copies under
`/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/sr-evidence-review/`.
`git status` in the worktree was clean before and after (only ignored `__pycache__/`).

## Verdict: FIX

One S2: a folder that drops the kit keys and the `cases` list from `protocol.json` is classed as a legacy run. It then
passes the gate with a review PASS that its own observations contradict, and the table counts that PASS without a
caveat. Also one S3, a guard-proof gap that the gist overstates, and four S4s. Everything else on the checklist holds,
and I reproduced each of those items myself.

## Findings

### F1 (S2): a folder with no kit keys and no `cases` skips rule (c) and passes, so the table counts an unsupported PASS

- **Where:** `tools/check_calibration_evidence.py`. Line 669 sets `r.kind = "kit" if kit_keys(protocol) else "legacy"`.
  In `legacy_scores`, line 532 (`for c in r.protocol.get("cases") or []`) builds `rules` only from the cases present,
  and line 551 (`if case not in rules: continue`) skips every scored case that has no rule. No FAIL and no LIMIT is
  printed for it.
- **Why it matters:** the builder keeps new runs out of the legacy path through the pass-rule hash ("a new run is a
  kit run"). A *wrong* rule text is refused that way. An *absent* one is not. C1 says a legacy run is "refused for an
  internal contradiction (a score the observations do not support)". C2(c) says "a mismatch is a failure", and C1
  says what a folder cannot answer is "a named limitation, never a pass". Here the contradiction is not checked and no
  limitation is printed.
- **Reproduction 1 (kit folder downgraded):** copy `tests/fixtures/calibration-evidence/pass/fixture-host-calibration-1`.
  Pop `judging_profile`, `relayed_operator_text`, `classification` and `cases` from `protocol.json`. Set `holds: false`
  on every lens in `adjudication.json`, so C-1 is not real under any prongs and beta-max's S3 R-3 is false blocking.
  The review is then FAIL by the kit's rule, but `scores.json` still says PASS. Result:
  `check_calibration_evidence: 1 folder(s), 0 failure(s), 2 limitation(s)`, exit 0. Running
  `qualification_table.py --table <scratch> <folder>` writes
  `| beta-max | beta | max | not named | review | T1 | PASS | 1 of 1 | ... | - |`, an uncaveated, counted PASS. With the
  lenses untouched, the stripped folder also passes (exit 0). It escapes rules (a) schema_version, (f) and (g) of the
  kit path.
- **Reproduction 2 (legacy folders):** in a copy of run 1, pop `cases` and flip `opus-high.pin.pass` to false: exit 0.
  In a copy of run 2, rename case id `fix` to `fix-case` and flip `opus-high.fix.pass` to false: exit 0. The table
  would then show FAIL where the observations give PASS.
- **Fix:** a folder without kit keys is a legacy run only when every case it scores has an encoded pass rule. In
  `legacy_scores`, fail `scores-derivable` (for example "legacy run: no encoded pass rule for the <case> case; a new
  run is a kit run") for each case that `scores.json` scores but `rules` lacks. That keeps C1 ("never refused for
  lacking kit keys"): runs 1-3 still pass, since all nine of their rule hashes are encoded. Add a red-first test for
  the absent-cases folder and for the renamed case id.
- The three real folders are not affected: they carry all three cases and all nine hashes match.

### F2 (S3): some guards have no removal proof, so the gist's "removing each guard turns at least one test red" is overstated

The builder's proof table removes whole rules and some sub-guards. I removed single guards in a `git archive HEAD`
copy and ran both suites. These removals left **both suites green**:

| guard (check_calibration_evidence.py) | behaviour at HEAD (my probe) |
|---|---|
| kit (a) `frozen_at` filled | a missing `frozen_at` fails protocol-frozen |
| kit (f) key/model/effort named | a missing `judging_profile.model` fails judging-profile-named |
| kit (d) flag on a review that passes on all three prongs | fails when the stated count is adjusted. The builder's test is masked by the stated-count check, which fires with the same rule (the masking the report fixed for the legacy guards but not here) |
| kit (d) flag on a non-PASS | fails |
| kit (b) declared prongs are classification prongs | `["holds","bogus"]` fails |
| legacy (d) `three_prong_false_blocking` range | 5 fails |
| legacy (d) flag with no missing prong | untested |
| legacy (d) flag on pin/fix | fails |
| legacy (c) hash's case id must match the case | a pin rule swapped with the fix text fails |
| legacy (c) profile set equality | an extra scores profile fails |
| (h) binary-extension skip | (mirrors check_secrets) |

Each guard works at HEAD, which I verified by direct probe. What is missing is the red-first proof. Fix: one test per
guard that asserts the guard's own message, or reword the report's claim.

### F3 (S4): malformed shapes crash with a traceback instead of a named FAIL

`scores.json` `profiles.beta-max.review = "PASS"` (kit), `profiles.alpha-low.pin = "PASS"`, observations
`others: ["x"]`, protocol `classification: ["holds"]`, and run 3 `profiles.opus-high.review = "PASS"` each end in
`AttributeError: 'str'/'list' object has no attribute 'get'` with exit 1 and no `FAIL <folder> <rule>` line (for
example line 279, `sr = s["review"] or {}`). The gate still refuses because the exit is 1, but C2 asks for the folder
and the rule to be named. Fix: guard with `isinstance(..., dict)` and fail the owning rule.

### F4 (S4): rule (a) accepts any status that starts with "run complete"

Line 217 passes `status: "run complete; but never frozen"` (exit 0). C2(a) says "status frozen". The template allows
`frozen | run complete; results in ...`, and `frozen_at` is still required, so the risk is low. Fix: match the
template's two values exactly.

### F5 (S4): rule (h) name patterns are case-sensitive

`Review.PROMPT.md` passes (exit 0), and so does a `run.json` holding a prompt string. The second is within C2's
parenthetical definition. The first matters on a case-insensitive checkout. Fix: `re.I` on `FORBIDDEN_NAMES`.

### F6 (S4): the table's run label is positional

`qualification_table.py:83` labels each run `run {n}` by its position in the sorted list, not by the folder's
`-calibration-<n>`. The real folders 1-3 coincide. A host with only `-1` and `-3` would show "run 2 (<id of run 3>)".
The run id is printed beside it. Fix: use the folder's n.

### Note for the lead (not a defect): the kit builder can emit a folder the gate refuses

When a run file's cluster verdict `real` disagrees with the declared-prong vote, `observations.py` scores by the
verdict, records `adjudication_schema.declared_rule_disagrees`, and flags the PASS `would_fail_under_three_prong` with
"(0 of 1 under the three-prong definition)". The check recomputes by votes and fails `scores-derivable`. I reproduced
this: fixture `run.json` with two lenses `forbidden: false` while `real: true` gives
`FAIL ... scores-derivable: review:beta-max scores 'PASS' ... gives 'FAIL'`. That matches Item 4.3 ("derives ... under
the declared prongs"; "the intended rule, not the one the run happened to run"), so I do not count it as a defect. The
FAIL text does not mention the override, though. Decide whether the kit should refuse overrides, or whether the check
should name `declared_rule_disagrees`.

## Checklist, with evidence

1. **Per-rule failing folders (my own, minimal, from the pass fixture).** Each fails its rule and no other:
   - a: status draft, frozen_at missing, scores run_id differs, blank run_id
   - b: protocol prongs reordered, protocol prongs with a duplicate
   - c: a fix pass flipped
   - e: category_mapping removed, or category_mapping.pin removed
   - f: judging_profile.model missing, or judging_profile missing
   - g: text "", text missing, relayed_operator_text missing
   - h: `sk-`+`ant-`+30 chars in clusters.md, in a JSON field and in sub/x.txt; a bearer header; review.prompt.md;
     transcript-1.txt; sub/grader.prompt.md

   Dropping only `forbidden` from the lens records fails b plus c. That is correct: the review really becomes FAIL
   under the three declared prongs. The builder's eight fixtures each fail only their named rule (verified by
   semantic diff and by running the check).
2. **Real folders.** `python3 tools/check_calibration_evidence.py` gives `3 folder(s), 0 failure(s), 14
   limitation(s)`, exit 0. Runs 1-2 have five LIMITs each (b, d unadjudicated 8/9, e, f, g); run 3 has four (b missing
   forbidden, d own reading, f, g A-1). These are the limitations C1 names.
   - Rule-text comparison with Item 4.3: (b), (c), (d) and (e) are as the proposal states.
   - The proposal's "every grade entry in the adapter's form" is not among C2's a-h rules. `docs/evidence/README.md`
     lists it under "what the check cannot see", as a policy property.
   - C2(f) said to read the grader from the README. The builder reads `protocol.json`: run 1's README names the
     grader, run 2's and run 3's do not (grep). This deviation is declared.
   - No rule was weakened to let the real folders pass. Mutating the real folders fails the expected rule:
     - run 3 haiku-medium review set to FAIL fails c;
     - opus-high fix flipped fails c;
     - C-1 lens holds flipped fails c on 7 profiles;
     - haiku-high unflagged fails d (via the stated count);
     - stated count "15 of 15 PASS" fails d;
     - pin mapping build-tests fails e;
     - missing_prong wrong fails b;
     - run 1 review flipped fails c;
     - run 2 PARTIAL set to PASS fails c;
     - run 1 run_id null fails a;
     - a flag on unadjudicated run 1 fails d.
3. **Run 3 re-derivation (my own code, not the check's).** Lens records C-1..C-5 hold `holds` / `reachable` with no
   `forbidden` field. Under the declared prongs (holds + reachable not "no", two of three votes), every cluster is
   real. For all 15 profiles: adjudicated false blocking 0, r8Found and r11Found true, no copying, so PASS. That
   equals `scores.json` result, pass and `falseBlocking_adjudicated` for all 15. Pin and fix match as well
   (fable-medium pin FAIL). Rule c agrees (no failure). Only haiku-medium (C-4, C-5) and haiku-high (C-4) have
   blocking others in C-4/C-5, which matches the two flags and "13 of 15".
4. **Table caveats and counts.**
   - Run 3's haiku-medium and haiku-high review cells read `PASS (2-prong, would fail)`, counted 0.
   - The 8 run-1 and 9 run-2 review PASSes read `PASS (unadjudicated)`, counted 0. I counted them per row.
   - Supplementary fix:haiku-high and review:haiku-low read `PASS (supplementary)` and are not counted (the declared
     C3 decision).
   - My script recomputed every cell and every pass count from the three `scores.json` files: 39 rows, 0 mismatches.
   - All four "does not support" statements are in the header.
5. **--check and bytes.**
   - `--check` on the committed table: exit 0.
   - Edited copy (`PASS (2-prong, would fail)` changed to `PASS`): exit 1. One appended byte: exit 1. Missing file:
     exit 1. `--check` from cwd `/`: exit 0.
   - A fresh generation is byte-identical to the committed table (`cmp` equal; sha256 e720b14f...bd7 for both).
   - The table and its generator are in the same commit, 6653d61.
6. **Secrets rule with a concatenated key.** `"sk-"+"ant-"+"A"*30` gives anthropic-key, and `"sk-"+"proj-"+"B"*20` in
   a run-3 copy gives openai-style-key. Both fail no-secrets-or-bodies only, and the output names the file and the
   pattern, not the value. The builder's test writes the key by concatenation.
7. **Gate.**
   - The four steps sit right after `test_calibration_kit`:
     - `test_check_calibration_evidence`
     - `check_calibration_evidence`
     - `test_qualification_table`
     - `qualification_table --check`
   - `python3 tools/run_regression.py` ran 56 steps: "REGRESSION GATE: all checks PASS", exit 0, 1m13s, and all four
     new steps PASS.
   - Suites: 31 tests OK and 17 tests OK.
8. **Scope.**
   - `git diff --stat 229aa1f..HEAD -- 'docs/evidence/2026-*' hosts skills tools/calibration` shows only
     `tools/calibration/README.md | 9 +` (the one paragraph).
   - Every other changed path is on the brief's allowed list.
   - Commit identity is StepenkoAnatoli. Trailers follow this session's attribution lines. Five five-part reports.
9. **Guard proofs.** See F2. 16 + 13 single-guard removals were run: 18 went red and 11 stayed green.

## Gist

- FIX. One S2: a results folder with no kit keys and no `cases` in `protocol.json` is classed legacy, skips rule (c),
  and passes the gate. My repro gives exit 0 for a review PASS its own lenses make a FAIL, and the table counts it
  "1 of 1" without a caveat. The fix is to fail rule (c) for any scored case without an encoded legacy pass rule.
- The checklist otherwise holds, all reproduced:
  - My per-rule folders a-h each fail only their own rule.
  - The real folders pass with exactly the 14 C1 limitations.
  - My independent re-derivation of run 3 matches all 45 cells.
  - Caveats and counts match the scores for all 39 rows.
  - `--check` fails on an edited copy, and a fresh generation is byte-identical to the committed table.
  - The gate's 56 steps PASS, and nothing changed outside the allowed paths.
- S3: 11 single-guard removals leave both suites green, so "each guard proven" is overstated. The guards themselves
  work at HEAD.
- S4: tracebacks instead of named FAILs on malformed shapes; the status prefix match; case-sensitive names; positional
  run labels. Note: a kit-built folder with a verdict override is refused by rule (c), which fits Item 4.3. The lead
  decides whether the kit should refuse overrides instead.
