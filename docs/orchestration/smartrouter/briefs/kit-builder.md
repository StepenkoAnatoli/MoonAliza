# Unit sr-kit: the calibration kit under `tools/calibration/` in SmartRouter (onboarding proposal, Items 2-4.2)

Worktree and branch: created by the lead from SmartRouter `origin/main` (named in the launch prompt). Work only
under `tools/calibration/`, `tools/test_calibration_kit.py`, `tools/run_regression.py` (one registration line),
`tests/fixtures/calibration/`, `CHANGELOG.md` (one Unreleased line) and `README.md` (one row or sentence naming
the kit), plus your report file in the MoonAliza run folder named in the launch prompt. SmartRouter's pre-commit hook
runs its regression gate on every commit (`python3 tools/run_regression.py`, about a minute); never --no-verify, never
unwire it; no push. Commit identity and trailer lines as in the MoonAliza brief `briefs/router-builder.md` (the
`Co-Authored-By` line names the model that writes the commit, plus the `Claude-Session` line); five-part commit
reports; red-first tests with guard-removal proofs. Reports: full report to the path the launch prompt names, a gist
of at most five lines returned.

## Why

SmartRouter merged the calibration-first onboarding proposal (`docs/proposals/calibration-first-onboarding.md`,
#102). Its Item 2 asks for the kit every run so far rebuilt by hand, under one path, host-independent in method;
Item 3 for the run protocol the kit enforces; Item 4.1-4.2 for the results layout and the pull-request request
the kit prints. This unit builds those from calibration run 3's actual artefacts (the only complete lineage). The
shared synthetic subject pack (Item 2, "shared pack") and the CI check and table (Items 4.3-4.4) are separate
units; this unit defines the pack format and leaves the shared pack's directory with its README only.

## Sources (read-only; copy the method, never a path, a session id, a key or a MoonAliza source file)

- The proposal, in the worktree: `docs/proposals/calibration-first-onboarding.md` (Items 2-4 are the contract).
- Run 3's published record, in the worktree: `docs/evidence/2026-10-18/claude-code-calibration-3/` (`protocol.json`
  is the template's lineage; `grade.sh` and `historyless-checkout.sh` as run; `README.md` for the run-id and
  amendment conventions; `scores.json` and `observations.json` for the output shapes).
- Run 3's working files, on this machine under
  `/tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/`:
  `sr-calibration-3.js` (the main run's workflow script: items per profile and task, the candidate prompts with
  the A-1 reconciling preamble, the grader with the CLASSIFICATION, clustering and the three lenses, pipelined),
  `sr-calibration-3b.launch.js` (the supplementary run; the same prompts and schemas, the cluster-assignment
  step), `cal3-observations.py` (the builder of observations.json, scores and tables from the harness journal and
  run file), `cal-grade-3.sh` and `cal3-grade-done.sh` (mechanical grading of pin and fix cells),
  `cal-historyless-checkout.sh`. These files carry absolute paths, a session id, a MoonAliza repository path and
  MoonAliza-specific file names: none of that enters the kit. Nothing else in that directory is a source.
- The host adapter's reader of observations: `hosts/claude-code/route.mjs` (`calibrationEvidence`, the flat
  profile map it accepts; an observation's task object may carry `tier`).

## The lead's decisions

K1. **Path `tools/calibration/`.** The kit is files, not a package; no new dependency; Python 3.12 and bash as the
    rest of `tools/`; the workflow template is JavaScript for the Claude Code workflow harness, the only harness
    with a run, with its harness-specific parts marked `// HARNESS:` so another host knows what to replace.
K2. **Files**, each with a one-line lineage header naming the run-3 artefact it generalises:
    `README.md` (how a host onboards a profile: pack, protocol freeze, launch, grade, build, results, the printed
    request; the run protocol Items 3.1-3.5 as numbered rules); `protocol.template.json` (run 3's shape with
    values blank: subject, sources with the hash convention, cases with pass rules and `tier`, metrics,
    accounting, timing, privacy, limits, `classification.prongs` (the three), `judging_profile` with its
    qualification or the bootstrap limitation line, `relayed_operator_text` (verbatim or `null` with the
    statement that the harness relays nothing), `run_id` null until the launch, `amendments` []);
    `classification.md` (the three prongs, the S4 rule for an unreachable contract hole, G-1 and G-2 as the rules
    they produced); `grader.prompt.md`, `lens.prompt.md`, `cluster.prompt.md`, each with its output schema in a
    fenced JSON block, the lens schema carrying `forbidden` and a lens voting real only on all three prongs, with
    `{{placeholders}}` for the pack's names; `historyless-checkout.sh` (arguments: source repo, commit, target,
    branch; the node_modules/.build symlinks optional via a flag); `grade.sh` (arguments: a pack manifest, the
    task, the candidate checkout; everything run 3 hard-coded comes from the manifest); `observations.py`
    (arguments: the journal, the run file, the manifest, the grades directory, the output directory; writes
    `observations.json` in the flat profile map, `scores.json` with `totals.tokens`, `adjudication_schema`,
    `category_mapping`, `would_fail_under_three_prong`, `results-table.md`, `clusters.md`,
    `tokens-and-estimates.md`; the harness journal format documented at the top); `run.template.js` (the
    workflow: items per profile and task from the manifest, the candidate preamble that reconciles a relayed
    operator request, pipelined grading, clustering, three lenses per cluster, majority; retry limit 0);
    `request.py` (Item 4.2: prints the branch name, the file list and the pull-request body in this repository's
    template, filled from the protocol and scores, ending with the sentence that asks the operator to open the
    pull request; it never runs git); `subject-pack/README.md` (the pack format: `manifest.json` with the base
    tree reference, the accepted fix reference, the ground-truth findings with severities and causes, the
    required behaviour stated without the fix, pass rules per case and tier, source hashes, the isolation rule of
    Item 2, the pack version); `subject-pack/shared/` left as a README stub naming the unit that builds it.
K3. **No provider calls, no keys, no host paths.** The kit never reads an environment variable for a credential and
    the test asserts no absolute path, no session id (`session_` or a 32-hex run id) and no `/home/` or `/tmp/`
    string appears under `tools/calibration/` except in a `{{placeholder}}` or an example clearly marked as one.
K4. **Tests** in `tools/test_calibration_kit.py`, registered in `tools/run_regression.py` after
    `test_claude_code_host_artifacts`: the template parses and carries every key of K2; `bash -n` on both scripts;
    `historyless-checkout.sh` on a temp repository yields one commit whose tree equals the source commit's;
    `grade.sh` on a temp pack (a two-line module and a one-row test) grades a green candidate PASS and a
    source-touching candidate FAIL on scope; `observations.py` on the fixture journal and run file under
    `tests/fixtures/calibration/` (three cells, synthetic, written by you) produces the flat shape the adapter
    reads (assert the keys the README documents) and totals that sum; `request.py` prints the four template
    sections and the operator sentence; the K3 hygiene assertion; and `check_secrets` stays green.
K5. **CHANGELOG** Unreleased: one line naming the kit and the proposal; **README**: one sentence where tools are
    listed. `validate_skills` is untouched (no skill change).

## Deliverables and stop triggers

A. `tools/calibration/` per K2. B. Tests per K4, red-first with guard proofs (each test shown red by removing
what it guards). C. The CHANGELOG and README lines. D. The regression gate green through the pre-commit hook on
every commit. Stop and report if a run-3 artefact is missing or unreadable, if the gate cannot run, or if a kit
file would need a MoonAliza-specific value to work (then it is a manifest field, not a constant).
