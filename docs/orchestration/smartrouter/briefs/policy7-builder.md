# Unit sr-policy-7: host-policy-7, the adapter reads a calibration task object's category and the gate task

Worktree and branch: created by the lead from MoonAliza `build/github-sign-in` (the launch prompt names the head).
Work only under `docs/orchestration/smartrouter/` (`route.mjs`, `route.test.mjs`, `host-policy.json`, `README.md`,
`trace/policies/host-policy-6.json` as the fixture that freezes revision 6), your report file. Conventions as in
`briefs/policy6-builder.md` (commit identity, trailers, five-part reports, red-first with guard proofs, the gate
`node --test route.test.mjs`, `python3 tools/test_claude_code_host_artifacts.py` and `conform_spec.py` in the
SmartRouter checkout named in the launch prompt). No push.

## Why

The kit unit `sr-kit-cases` (K1, K3) writes `category` into each calibration task object and adds a `gate` task.
`rate` maps tasks to categories by position (`CALIBRATION_TASKS`): a `build-core` cell would print as `fix`, and a
`gate` cell would not be counted. Run 4's T1 cells (`briefs/run4-plan.md`, R4-4..R4-6) need both read.

## The lead's decisions

G1. **Freeze revision 6**: copy the live policy to `trace/policies/host-policy-6.json`; the revision-6 table test
    pins to the fixture, the live table test moves to revision 7 (as every revision did).
G2. **`rate` reads `category`.** For each task object (`pin`, `fix`, `review`, `gate`) a string `category` that is
    one of the policy's categories counts the grade under that category; absent, the positional mapping as today
    (runs 1-3 print unchanged: assert byte-equal `rate` output on the committed trace); a category the policy does
    not define, or a non-string, refuses the run (exit 4, the message naming the observation and key), never a
    silent fallback. A `gate` task object is read like `pin` and `fix` (`score` true/false/null, `tier`, `category`
    required: a gate with no category refuses).
G3. **The grade entry line** `calibration-<n>: <category>[@T<k>] PASS|PARTIAL|FAIL (n=<k>)` is unchanged; a policy
    may now cite `calibration-5: build-core PASS (n=1)`. E2 (typed evidence) is unchanged: a PASS grade entry at the
    tier supports a `qualified-for` entry.
G4. **No routing change.** Host-policy-7 is revision 6 plus the key `"policy-revision": "host-policy-7"` and the
    README section; every `decide` assertion of the revision-6 table holds on revision 7 (assert it).
G5. **Tests**: G2's four branches (positional fallback byte-equal; a category counted; an unknown category refused;
    a gate without category refused), G1's fixture pinning, G4; guard proofs for each. README: a "Calibration task
    categories (host-policy-7)" section, the applied decisions G1-G5, friction items if any.

## Deliverables and stop triggers

A. route.mjs per G2-G3. B. Policy per G4, fixture per G1. C. Tests per G5. D. README. Stop and report if a
committed trace observation carries a category the policy does not define (none should).
