## Problem and resulting behavior

Upstream `hosts/claude-code/` still holds host policy revision 3. The host has run on revision 4 since calibration run 3, and #100 cites revision 4's qualifications and the ledger rows behind them. This PR brings the adapter up to the host's copy, MoonAliza `build/github-sign-in` at `e43e656` (`docs/orchestration/smartrouter/` minus `briefs/`):

1. **Host policy revision 4.** `review` is added to `cc-sonnet-low`, `cc-sonnet-high`, `cc-sonnet-xhigh`, `cc-opus-max` and `cc-fable-max` (two passes each, rules 2-3). `fix` is removed from `cc-haiku-low`: this is the learning loop's first demotion from production outcomes, after two `verification-failed` outcomes. `pin-tests` is blocked for `cc-fable-medium` after its run-3 pin FAIL, until two later passes. Routing under revision 4:
   - a default fix goes to `cc-haiku-high`, with `cc-sonnet-xhigh` as the reviewer;
   - a default review goes to `cc-sonnet-xhigh`;
   - a fix under 175k goes to `cc-haiku-medium`.

   The README gains "How calibration run 3 was applied", the regenerated table, the G-2 note and friction items 19-20.
2. **The run-3 trace.** It adds:
   - `trace/calibration-3/`;
   - `trace/policies/host-policy-3.json`, the fixture the sr-policy-4 decisions were bound to;
   - the sr-policy-4 unit: a blocked decision, a delegate decision, a dispatch and an accepted outcome;
   - the MoonAliza outcomes `fix-u7-r3-4`, `fix-x2-1-3` and `fix-x2-2-3`;
   - 7 ledger rows and 4 usage readings.

   `route.mjs` is unchanged. The suite now has 100 cases.
3. **The binding stays `fbe7bca`.** None of the files the adapter mirrors changed between `fbe7bca` and `ade3f1e`: `tests/smart_router_decisions.py`, `references/gates.md`, `SKILL.md` (3.0.0) and `tools/prices-2.json`. Only spec-v2 changed, for Item 4, and the adapter already carries that change (f2cd97c, #99).

## Related issue

Related to #100: the tiers proposal cites revision 4 and these rows. The run-3 evidence itself is #101. There is no issue number.

## Validation

Run from the repo root on this branch, with local fixtures and no live provider. The platform was Windows, Node 24.20.0 and Python 3.14.7, on an LF checkout:

- `node --test hosts/claude-code/route.test.mjs` gives 100 pass, 0 fail.
- `python3 tools/test_claude_code_host_artifacts.py` gives 5 OK.
- `python3 tools/conform_spec.py --record <the newest ledger line, sr-policy-4 seq 4>` gives CONFORMANT, and `--outcome hosts/claude-code/trace/outcomes/sr-policy-4-4.json` gives CONFORMANT.
- `python3 tools/run_regression.py` gives "REGRESSION GATE: all checks PASS", both standalone and through the pre-commit hook.
- `git diff fbe7bca ade3f1e` over the mirrored files is empty.

## Remaining limits or risks

- `trace/calibration-3/adjudication.json` and `void-cells.json` predate #101's review revisions. #101's copies add three fields: `three_prong_reading`, `lens_schema_prongs` and `relayed_message`. No value differs. `clusters.md`, `observations.json` and `results-table.md` are byte-identical. After #101's delta review lands, the next refresh resyncs these two files from the host.
- On a `core.autocrlf=true` checkout (the Windows default), 4 byte-identity tests fail because the working tree has CRLF. Check out with LF to run the suite.
- Draft until the delta reviews of #100-#102 land, so the review queue stays at three.


🤖 Generated with [Claude Code](https://claude.com/claude-code)
