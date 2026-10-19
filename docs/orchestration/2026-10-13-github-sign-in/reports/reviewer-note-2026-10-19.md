# Note to the reviewer of SmartRouter #105-#108 (written 2026-10-19 by the lead for the operator to send)

Four draft PRs on SmartRouter are ready for review. Suggested order and what to look at:

1. #106 - calibration kit under tools/calibration/ (base: main). Review this first: #107 and #108 are stacked on
   it and retarget to main the moment it merges. Focus: the path guards in historyless-checkout.sh and
   run.template.js (three review rounds landed there: symlink reach, "/" and "//" and "." segments), the mtime step
   in grade.sh (stale bytecode after a same-size swap), and the launch refusals (unfrozen protocol, a placeholder
   left anywhere, keys included). Verify: python3 tools/test_calibration_kit.py (57 OK), python3 tools/run_regression.py.

2. #107 - shared synthetic subject pack, version 1 (base: tools/calibration-kit). Review the diff against its base
   branch, not main, or you see the kit again. Focus: whether D-2's accepted pin is as discriminating as claimed
   (seven wrong fixes FAIL, two correct fixes PASS), and whether the README states the defects without leaking the
   fix line. Verify: make-repo.sh into a temp dir prints the three fixed ids (review0 46c1cb9c, base0 b41a7f9c,
   accepted0 da71a8e3); python3 tools/test_calibration_kit.py (79 OK).

3. #108 - evidence check in the regression gate plus the generated qualification table (base:
   tools/calibration-kit). Focus: the legacy class is closed to the three run ids by LEGACY_RUN_IDS; anything else
   without the kit's keys is refused, which is the strictness we want. Confirm you agree the 14 named limitations on
   runs 1-3 are limitations, not passes. Verify: python3 tools/check_calibration_evidence.py (3 folders, 0 failures,
   14 limitations), python3 tools/qualification_table.py --check.

4. #105 - Claude Code adapter, host policy revisions 5 (difficulty tiers) and 6 (typed evidence). Independent of
   the other three. Focus: route.mjs tier floor and Gate 2 at tier; the typed reference resolution (the path cannot
   leave the store; it must be the latest outcome of its dispatch); the revision-6 policy drops five entries for want
   of outcome rows. Verify: node --test hosts/claude-code/route.test.mjs (141 pass).

Decisions needed from you, not from the diffs:

- Under revision 6, build-core, build-tests, research-collect and docs-mechanical have no delegate above
  direct-max-tokens until run 4's host-pack cells. Grandfather the four dropped entries until run 4, or keep them
  dropped (the current state)?
- Both proposals (#100, #102) still carry "not normative" status clauses; #105 enforces them anyway on the strength
  of your merges. Fine as is, or should the clauses be lifted first?
- Kit finding R-2: the kit's own trees/accepted/ is reachable by a host that checks out inside the kit tree.
  Documented as the host's duty, not enforced. Enforce in the kit later, or leave?

After #105 merges, the next adapter refresh carries the sr-kit, sr-pack and sr-evidence trace rows and the
cc-opus-high headroom ratified to 1,492,000.
