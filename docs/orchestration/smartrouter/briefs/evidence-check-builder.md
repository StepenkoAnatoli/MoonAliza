# Unit sr-evidence: the calibration evidence check in the regression gate and the generated qualification table (onboarding proposal Items 4.3-4.4)

Worktree and branch: created by the lead from SmartRouter branch `tools/calibration-kit` at 229aa1f (the kit, PR #106;
this unit stacks on it, beside the shared-pack unit). Work only on `tools/check_calibration_evidence.py`,
`tools/test_check_calibration_evidence.py`, `tools/qualification_table.py`, `tools/test_qualification_table.py`,
`tools/run_regression.py` (registration lines), `tests/fixtures/calibration-evidence/**` (synthetic fixtures),
`docs/evidence/qualification-table.md` (generated), `docs/evidence/README.md` (new or one section: what the check
enforces, what the table supports), `tools/calibration/README.md` (one paragraph: the check a results PR must pass),
`CHANGELOG.md` (one Unreleased line), plus your report file in the MoonAliza run folder named in the launch prompt.
SmartRouter's pre-commit hook runs the regression gate on every commit (about a minute); never --no-verify, never
unwire it; no push. Commit identity and trailer lines as in the MoonAliza brief `briefs/router-builder.md`; five-part
commit reports; red-first tests with guard-removal proofs. Reports: full report to the path the launch prompt names,
a gist of at most five lines returned. Never edit a file under `docs/evidence/2026-*/` (they are evidence).

## Why

The onboarding proposal (`docs/proposals/calibration-first-onboarding.md`, merged #102) Item 4.3 asks for a CI check
that refuses a results pull request whose evidence does not carry the intended rule (prongs declared and equal, scores
derived under them, a fewer-prong PASS flagged and excluded, the host's pin mapping, the judging profile named, the
relayed-chat statement present), and Item 4.4 for one generated table over every run with the adjudication schema,
the prongs and a caveat column, excluding fewer-prong PASSes from the pass count and stating what it does not support.
Three runs exist under `docs/evidence/` and predate both; the kit (`tools/calibration/`, branch tools/calibration-kit)
now produces the layout the check reads. Read the proposal's Items 4.3-4.4 and 1.1 in full, then the three evidence
folders' `protocol.json`, `scores.json`, `observations.json`, `README.md` (and run 3's `adjudication.json`,
`void-cells.json`), the kit's `observations.py` and `protocol.template.json`, and `hosts/claude-code/route.mjs`
`calibrationEvidence` (how the adapter counts observations).

## The lead's decisions

C1. **Two classes of run.** A *kit run* is an evidence folder whose `protocol.json` carries `schema_version` >= the kit
    template's and the kit's keys (`classification.prongs`, `judging_profile`, `relayed_operator_text`); a *legacy run*
    (runs 1-3) carries none of them. The check applies Item 4.3 in full to a kit run. For a legacy run it applies what
    the folder can answer and records the rest as a named limitation, never as a pass: run 3 declares its prongs in
    `scores.json` `adjudication_schema` and flags `would_fail_under_three_prong`, so its review PASSes are checked
    against that flag; runs 1-2 have no adjudication record, so every review PASS of theirs is reported
    `unadjudicated` and excluded from the table's pass count under the same rule as a fewer-prong PASS. A legacy run
    is never refused for lacking kit keys; it is refused for an internal contradiction (a score the observations do
    not support, a flag inconsistent with its own schema).
C2. **The check**, `tools/check_calibration_evidence.py [FOLDER...]` (default: every `docs/evidence/*/claude-code-calibration*/`
    and any `docs/evidence/*/*-calibration-*/`), exit 0 when every folder passes, else exit 1 naming the folder and
    the rule, one line per failure, as the other `tools/check_*.py` do. Rules, each with its name in the output: (a)
    `protocol-frozen`: `protocol.json` has `status` frozen and a non-null `run_id` recorded before the launch (kit
    run) or a `run_id` at all (legacy); (b) `prongs-declared`: the protocol's classification prongs equal the
    adjudication record's lens-schema prongs (kit run) or `scores.json` `adjudication_schema` declares both sets
    and the missing prong (legacy run 3); (c) `scores-derivable`: `scores.json`'s per-profile pass/fail values match
    what the kit's `observations.py` derives from `observations.json` under the declared prongs, or, for a legacy run,
    the pass rules the folder's own `scores.json.pass_rules` state (apply them to the observations' fields; a
    mismatch is a failure); (d) `fewer-prong-pass-flagged`: every review PASS that holds only because a prong is
    missing carries `would_fail_under_three_prong: true` and is excluded from any pass count the folder states; (e)
    `pin-category-mapping`: `category_mapping.pin` is `pin-tests` (the host's rule 4; the protocol's label is not the
    mapping); (f) `judging-profile-named`: the kit run names `judging_profile` with its qualification or the bootstrap
    limitation line; a legacy run names its grader model in the README (run 3: opus-high) or is reported
    `judging-profile: legacy, named in README`; (g) `relayed-chat-statement`: the kit run's `relayed_operator_text` is
    verbatim text or `null` with the harness statement; a legacy run is reported from its README (run 3: A-1 recorded;
    runs 1-2: not recorded) as a limitation; (h) `no-secrets-or-bodies`: no file in the folder matches
    `tools/check_secrets.py`'s patterns and no prompt body or model output beyond the structured returns is present
    (the folder holds no `*.prompt*`, no `journal.jsonl`, no `transcript*`). Limitations print as `LIMIT <folder>
    <rule>: <text>`, failures as `FAIL <folder> <rule>: <text>`; a folder with limitations and no failures passes.
C3. **The table**, `tools/qualification_table.py [--check]` writes `docs/evidence/qualification-table.md` from every
    folder the check accepts (it runs the check first and refuses to write on a failure): one row per (host, profile,
    category) with the profile's model, effort and config as the folder's protocol names them, pass/partial/fail per
    run in run order, the run ids, the adjudication schema version and prongs each run's review grade rests on, and
    a caveat column (`PASS (2-prong, would fail)` for run 3's flagged cells, `PASS (unadjudicated)` for runs 1-2's
    review PASSes, `void` for void cells, `supplementary` for cells graded in a supplementary run); a pass count
    per row that excludes every caveated PASS; a header stating what the table does not support (no ordering between
    models, no cross-host comparison outside the shared pack's cells, no claim about tiers it did not run, no
    qualification: the host's rules qualify); and `--check` exits 1 when the committed table differs from the
    generated one (the gate step). Profiles are labelled as the folders label them; the host adapter's profile ids are
    not assumed (the table is upstream, the ids are the host's).
C4. **Gate.** Register `check_calibration_evidence` and `qualification_table --check` and the two test files in
    `tools/run_regression.py` after `test_calibration_kit`. The committed table is generated by the tool and
    committed in the same commit as the generator.
C5. **Tests.** `tools/test_check_calibration_evidence.py`: the three real folders pass with the limitations C1 names
    (assert the exact LIMIT lines for runs 1-2 and run 3); synthetic kit-run fixtures under
    `tests/fixtures/calibration-evidence/` (a passing folder built from the kit's fixture journal through the kit's
    `observations.py`, and one failing folder per rule a-h, each a minimal edit of the passing one) each fail with
    the named rule and nothing else; secrets rule: a folder with a key-shaped string fails (write the string by
    concatenation in the test, never as a literal that `check_secrets` would flag). `tools/test_qualification_table.py`:
    the generated table over the real folders has one row per (profile, category) the folders hold, run 3's two
    flagged cells read `PASS (2-prong, would fail)` and do not count, runs 1-2's review PASSes read
    `PASS (unadjudicated)` and do not count, the header's four "does not support" statements are present, `--check`
    passes on the committed table and fails on an edited copy.
C6. **No change** to the evidence folders, the kit, the host adapter or the skills; the check and the table consume.
    The check's name is the proposal's provisional one and may stay.

## Deliverables and stop triggers

A. The check (C1-C2). B. The table generator and the committed table (C3). C. Gate registration (C4). D. Tests
(C5), red-first with guard proofs. E. The docs lines. Stop and report if a real folder fails a rule in a way C1 does
not classify as a limitation (name the folder, the rule and the contradiction; do not edit the folder, do not
weaken the rule).
