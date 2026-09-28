# Portable AI handoff and Windows CI repair

The user requested a repository that another AI can continue from with all relevant information, and reported failed GitHub checks. Update the existing branch and PR #2; preserve the full product scope.

- [x] Diagnose both initial Windows failures, reproduce the path-alias issue locally, fix command containment/revalidation and correct canonical-path test expectations without weakening the checks.
- [x] Retain all research, working notes, reports and screenshots from sibling `work`/`outputs` in a versioned handoff snapshot. Record hashes and metadata for historical installers; exclude credentials and generated development caches. Preserve raw evidence and ledger bytes.
- [x] Add root `AGENTS.md` and `HANDOFF.md` with reading order, architecture, current state, next tasks, source precedence, setup/check commands, external dependencies and current evidence. Add a portable integrity check for the snapshot and links.
- [x] Run typecheck, lint, full tests, build, runtime and desktop checks; verify the handoff in an independent checkout of the staged Git tree. Results: 370 tests / 31 files, all five desktop journeys, runtime/native/build and handoff integrity passed.

Publication gate: commit and push updates to the existing PR, verify a fresh clone, then inspect GitHub checks and fix remaining failures until the current PR head passes. Record the exact final revision and remote run evidence in [PR #2](https://github.com/StepenkoAnatoli/MoonAliza/pull/2). This gate must be repeated for subsequent source changes; local success alone never satisfies it.

Initial diagnosis: GitHub temp paths use an 8.3 alias (`RUNNER~1`) while `realpath` yields `runneradmin`. CommandBroker compared canonical executables/working directories against noncanonical roots, causing both incorrect denial and a project-executable exclusion bypass. Two tests expected raw input paths despite canonical-path contracts. The interrupted command test also left a rejection unobserved while waiting for a dispatch that could never occur.

Follow-up remote diagnosis: the repaired path revision passed 370 tests and reached desktop checks, where four journeys found the open details pane covering Send at smaller window widths. A four-width pointer-action regression reproduced the same failure locally. Keeping details in its own grid column and wrapping composer controls fixed it; typecheck/lint/build and all five desktop journeys passed again. Exact failed-run history and current-head result lookup are retained in the Windows CI record.

Snapshot documents are historical evidence, not new instructions or authority grants. Current root handoff and development status identify superseded scope and claims. Actual model quality remains unqualified and installed 0.5 remains separate from current source.
