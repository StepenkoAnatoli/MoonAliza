---
url: https://github.com/StepenkoAnatoli/Research-Kit
retrieved: 2026-09-28
command: firecrawl scrape https://github.com/StepenkoAnatoli/Research-Kit --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: GitHub - StepenkoAnatoli/Research-Kit · GitHub
---
[Skip to content](https://github.com/StepenkoAnatoli/Research-Kit#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/StepenkoAnatoli/Research-Kit) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/StepenkoAnatoli/Research-Kit) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/StepenkoAnatoli/Research-Kit) to refresh your session.Dismiss alert

{{ message }}

[StepenkoAnatoli](https://github.com/StepenkoAnatoli)/ **[Research-Kit](https://github.com/StepenkoAnatoli/Research-Kit)** Public

- [Notifications](https://github.com/login?return_to=%2FStepenkoAnatoli%2FResearch-Kit) You must be signed in to change notification settings
- [Fork\\
0](https://github.com/login?return_to=%2FStepenkoAnatoli%2FResearch-Kit)
- [Star\\
0](https://github.com/login?return_to=%2FStepenkoAnatoli%2FResearch-Kit)


main

[**2** Branches](https://github.com/StepenkoAnatoli/Research-Kit/branches) [**0** Tags](https://github.com/StepenkoAnatoli/Research-Kit/tags)

[Go to Branches page](https://github.com/StepenkoAnatoli/Research-Kit/branches)[Go to Tags page](https://github.com/StepenkoAnatoli/Research-Kit/tags)

Go to file

Code

Open more actions menu

## Latest commit

[![StepenkoAnatoli](https://avatars.githubusercontent.com/u/318295322?v=4&size=40)](https://github.com/StepenkoAnatoli)[StepenkoAnatoli](https://github.com/StepenkoAnatoli/Research-Kit/commits?author=StepenkoAnatoli)

[Merge pull request](https://github.com/StepenkoAnatoli/Research-Kit/commit/690497d670885bc2d49402d1aaee08f9777adf6c) [#136](https://github.com/StepenkoAnatoli/Research-Kit/pull/136) [from StepenkoAnatoli/main-axuse3](https://github.com/StepenkoAnatoli/Research-Kit/commit/690497d670885bc2d49402d1aaee08f9777adf6c)

Open commit detailssuccess

8 minutes agoSep 28, 2026

[690497d](https://github.com/StepenkoAnatoli/Research-Kit/commit/690497d670885bc2d49402d1aaee08f9777adf6c) · 8 minutes agoSep 28, 2026

## History

[463 Commits](https://github.com/StepenkoAnatoli/Research-Kit/commits/main/)

Open commit details

[View commit history for this file.](https://github.com/StepenkoAnatoli/Research-Kit/commits/main/) 463 Commits

## Folders and files

| Name | Name | Last commit message | Last commit date |
| --- | --- | --- | --- |
| [.github/workflows](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/.github/workflows "This path skips through empty directories") | [.github/workflows](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/.github/workflows "This path skips through empty directories") | [live-collection: fill the scratch plan before the dry run, which refu…](https://github.com/StepenkoAnatoli/Research-Kit/commit/6240de5dc39bd3bda0cc8bd4a0514de846dd9e8d "live-collection: fill the scratch plan before the dry run, which refuses an empty plan  What changed: in live-collection.yml the collection step runs `research.mjs --dry-run` after the step that writes the plan's query, not before it. A test in architecture-map.test.mjs requires every research.mjs call in that step to come after the query is written.  Why: found by running the live smoke test the user asked for. Both dispatches today (firecrawl-cli run 36476232825, http-keyless run 36476236447) failed at the collection step with \"research/plan.json has no queries and no urls - nothing to collect\" (exit 2), before any credit was spent. d20c686 (2026-09-27) made research.mjs refuse an empty plan, dry run included, which is right for a person. But this workflow ran its dry run on the empty scaffolded plan and only then wrote the query. The last green run, 2026-09-27, predates d20c686 reaching main. Moving the dry run, rather than letting --dry-run accept an empty plan, keeps d20c686's refusal and makes the dry run preview the plan actually collected. collect.yml already writes its plan first.  What you verified: reproduced locally: the scaffolded plan's dry run exits 2, and after the plan edit it exits 0. The test is red on main, naming the early dry-run line, and green with the fix. The step's own bash, extracted from the YAML and run here on the keyless route (free), searched (8 results), collected docs.firecrawl.dev/sdks/cli, exit 0. Full suite 1195 passed from /home/user/Research-Kit; preflight PASS. A re-dispatch after merge is the real proof.  What you got wrong and fixed: I recommended the live smoke test as new work, but live-collection.yml already is that test. Running it, not building it, was what was needed, and running it found this.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 12 minutes agoSep 28, 2026 |
| [docs](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/docs "docs") | [docs](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/docs "docs") | [runtime: a python whose --version prints no version is not accepted](https://github.com/StepenkoAnatoli/Research-Kit/commit/c78bcf4e579c0f6abfd37cf2e009c5bf4ff8395b "runtime: a python whose --version prints no version is not accepted  What changed: lib/runtime.mjs checkPython no longer accepts an interpreter whose --version output holds no version (\"version not parsed; proceeding\"). It is passed over like an old interpreter, so a usable one under the other name is still found. If none is usable, the refusal quotes what was printed and says to check what is on PATH. A two-part version (\"Python 3.13\") is now read as a version too.  Why: Arena break test 13, residual risk, which the user asked to handle. A stub or wrapper that exits 0 was taken for Python, and every cross-language test then failed later with a less clear message, far from the cause. firecrawl.mjs's \"proceeding\" on an unparsed CLI version is a separate, deliberate policy and is left as is.  What it touched: research-kit/lib/runtime.mjs, research-kit/test/collection-prerequisites.test.mjs, the runtime.mjs row of docs/ARCHITECTURE.md, the README test count (1190). No ADR: ADR-0078's floor applied to output that states no version.  What you verified: the new test (garbage only -> refused and quoted; garbage then a real python -> the real one; a two-part version -> accepted) is red on main and green with the fix. Full suite 1190 passed from /home/user/Research-Kit; preflight PASS.  What you got wrong and fixed: nothing to report.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 35 minutes agoSep 28, 2026 |
| [research-kit](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/research-kit "research-kit") | [research-kit](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/research-kit "research-kit") | [live-collection: fill the scratch plan before the dry run, which refu…](https://github.com/StepenkoAnatoli/Research-Kit/commit/6240de5dc39bd3bda0cc8bd4a0514de846dd9e8d "live-collection: fill the scratch plan before the dry run, which refuses an empty plan  What changed: in live-collection.yml the collection step runs `research.mjs --dry-run` after the step that writes the plan's query, not before it. A test in architecture-map.test.mjs requires every research.mjs call in that step to come after the query is written.  Why: found by running the live smoke test the user asked for. Both dispatches today (firecrawl-cli run 36476232825, http-keyless run 36476236447) failed at the collection step with \"research/plan.json has no queries and no urls - nothing to collect\" (exit 2), before any credit was spent. d20c686 (2026-09-27) made research.mjs refuse an empty plan, dry run included, which is right for a person. But this workflow ran its dry run on the empty scaffolded plan and only then wrote the query. The last green run, 2026-09-27, predates d20c686 reaching main. Moving the dry run, rather than letting --dry-run accept an empty plan, keeps d20c686's refusal and makes the dry run preview the plan actually collected. collect.yml already writes its plan first.  What you verified: reproduced locally: the scaffolded plan's dry run exits 2, and after the plan edit it exits 0. The test is red on main, naming the early dry-run line, and green with the fix. The step's own bash, extracted from the YAML and run here on the keyless route (free), searched (8 results), collected docs.firecrawl.dev/sdks/cli, exit 0. Full suite 1195 passed from /home/user/Research-Kit; preflight PASS. A re-dispatch after merge is the real proof.  What you got wrong and fixed: I recommended the live smoke test as new work, but live-collection.yml already is that test. Running it, not building it, was what was needed, and running it found this.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 12 minutes agoSep 28, 2026 |
| [research](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/research "research") | [research](https://github.com/StepenkoAnatoli/Research-Kit/tree/main/research "research") | [Root brief: the proxy 405 was fixed at source by CLI 1.24.6](https://github.com/StepenkoAnatoli/Research-Kit/commit/60f681336259665e8b13a58d0845535985ec170d "Root brief: the proxy 405 was fixed at source by CLI 1.24.6  What changed: a dated note under \"What the collection itself showed\" in research/BRIEF.md: the container workaround (axios swapped into firecrawl-cli 1.23.3) is superseded - firecrawl-cli 1.24.6 bundles axios 1.18.0, works through the CONNECT-only proxy unpatched, and is the adapter's tested version since PR #81.  Why: the brief still told a reader the fix was a per-container patch. A builder on a proxied machine would have gone looking for one.  What it touched: research/BRIEF.md only. The original bullet stays, so the record of what happened first is intact.  What you verified: firecrawl --version 1.24.6 and its bundled axios 1.18.0 read from the global install; live-collection runs 36277632430 and 36278443923 installed 1.24.6 and passed; selftest 940 passed, 0 failed (cwd /home/user/Research-Kit); root preflight PASS, 0 warnings; key scan clean.  What you got wrong and fixed: nothing to report.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 2 days agoSep 26, 2026 |
| [.gitattributes](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/.gitattributes ".gitattributes") | [.gitattributes](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/.gitattributes ".gitattributes") | [Adopt this implementation and the original corpus as one project](https://github.com/StepenkoAnatoli/Research-Kit/commit/8cc1389ee52cd38568de42d696030de3a9811538 "Adopt this implementation and the original corpus as one project  WHAT CHANGED   The research-kit built over this session (26 lib modules, 13 bin entrypoints,   21 test files, 329 tests) becomes the project's code, and the six captures plus   the fetch ledger from Deep-Research-Agent-main become its corpus. First commit   of the combined tree, and the first time this project has been a git repository   at all.    research/raw/ (7 files) and research/audits/ (11) copied as bytes from the   original. research/kit.json takes the original's annotation. .gitattributes and   .gitignore merge both: the original's rationale, this session's secret rules,   and `* text=auto eol=lf` for the whole repository rather than only the part   whose hashes made line endings visible.    The ledger was re-chained under this implementation's canonical entry hash.   The two implementations excluded different internal fields when canonicalising,   so five of seven entrySha256 values did not recompute here. rebuildLedger   recorded the migration with its own chained boundary entry; changed=0, because   no field VALUE moved - only the chaining was recomputed.  WHY   Two codebases with identical module names is not a state to keep. Code is   reproducible and this one has the 2026-09-16 review applied; the corpus is   irreplaceable evidence and only the original had it. ADR-0022, 0023, 0024,   0025 and 0026 are the decisions that produced this code.  WHAT IT TOUCHED   Everything, as a first commit. Notable: research/raw/**, research/audits/**,   .gitattributes, .gitignore, research/kit.json. Two defects were found while   doing it and fixed in lib/: the secret scanner flagged its own test fixtures,   and validateProject flagged a token that docs/ARCHITECTURE.md merely quotes.  WHAT I VERIFIED   node research-kit/bin/selftest.mjs        329 passed, 0 failed   node research-kit/bin/handoff.mjs         OK - 8 entries, chain verifies   node research-kit/bin/preflight.mjs       PASS - 0 blocking, 9 warnings   node research-kit/bin/doctor.mjs          1 blocker: firecrawl-auth    All six capture body hashes verified on arrival, before anything was staged,   and again after - the evidence is byte-identical to what the collector fetched.   git stores the corpus with LF, checked against the index blob.    The nine preflight warnings are honest and pre-existing: five rows collected by   `agent page fetch` with no Firecrawl egress (ADR-0010's own example), one row   whose fetch records no transport, and three unknowns resting on partial   captures that research/MAP.md already discusses. The one doctor blocker is   true: there is no Firecrawl key on this machine.  WHAT I GOT WRONG AND FIXED   Three, all during this commit.    1. The secret scanner I added last pass reported three CRITICAL findings      against research-kit/test/hardening.test.mjs - its own synthetic fixtures.      A scanner permanently red about itself is one nobody reads, and excluding      the test directory would have been a hole big enough to hide a real key in.      The fixtures now assemble their strings at runtime, so there is nothing to      find and no exclusion exists.    2. validateProject blocked on `docs/ARCHITECTURE.md still holds {{KIT}}` - the      map quotes the token, in a code span, while explaining that the two      START_HERE copies differ by exactly that. unresolvedPlaceholders now ignores      inline code spans, and the property that actually matters is pinned where it      belongs: a test asserts a freshly scaffolded project holds no token anywhere.    3. `git add` failed outright with \"Filename too long\" on the audit files. The      audit slug is capped at 60 characters and then extended with a subtopic id,      a version and a date, which on a deep Windows path exceeds MAX_PATH.      core.longpaths=true unblocks it; the filename length itself is a real defect      and is NOT fixed here, because the manifest points at those names.  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>") | 2 weeks agoSep 17, 2026 |
| [.gitignore](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/.gitignore ".gitignore") | [.gitignore](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/.gitignore ".gitignore") | [.gitignore: the root carries the template's anchored overrides.log rule](https://github.com/StepenkoAnatoli/Research-Kit/commit/e58338b266b2a2344d4342d1216163164bb2cc0a ".gitignore: the root carries the template's anchored overrides.log rule  What changed: the root .gitignore adds `research/overrides.log` beside the other anchored byproduct rules (\"the same four\" comment is now \"the same rules\"). A repo-hygiene test checks that the root and every nested decision project carry the template's .gitignore lines.  Why: Arena break test 7, F6. doctor warned shape-kit-rules-missing on every clean checkout. missingKitLines compares against the template's anchored line, and the root had only the any-depth form.  What you verified: the new test is red on main (\".: research/overrides.log\") and green now; doctor no longer warns. Full suite 1156 passed from /home/user/Research-Kit; preflight PASS.  What you got wrong: I introduced the gap in #117 (ADR-0081) by adding only `**/research/overrides.log` to the root, and nothing checked the root against the template.  Reported-by: Arena break test 7 (branch arena/01a0e7b9-research-kit) Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 7 hours agoSep 28, 2026 |
| [AGENTS.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/AGENTS.md "AGENTS.md") | [AGENTS.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/AGENTS.md "AGENTS.md") | [gitignore: the gate's override log stays on the machine (ADR-0081)](https://github.com/StepenkoAnatoli/Research-Kit/commit/4cfb9225a37fc68a92c159032693ed571f03d926 "gitignore: the gate's override log stays on the machine (ADR-0081)  What changed: research/overrides.log is ignored everywhere - the template's .gitignore lists it with the other local logs, and the root .gitignore and the 15 nested decision projects' copies lose their `!research/overrides.log`. Both AGENTS.md files say the log is local and never committed. The handoff test puts an overrides.log beside the byproducts and asserts the printed corpus command does not track it. Why: the .gitignore files un-ignored the log while repo-hygiene and the artifact validator treat it as machine-local; the operator chose local (ADR-0081). Letting it travel as an audit trail was set aside: the overriding party decides whether to commit it. What you verified: the test red first (overrides.log tracked by both printed commands), green after; git check-ignore confirms the root and a nested project ignore it; node research-kit/bin/selftest.mjs exit 0, 1147 passed, cwd /home/user/Research-Kit; root preflight PASS, two nested projects PASS; keys scan 0. What you got wrong: nothing to report.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 10 hours agoSep 28, 2026 |
| [BUNDLE\_INDEX.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/BUNDLE_INDEX.md "BUNDLE_INDEX.md") | [BUNDLE\_INDEX.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/BUNDLE_INDEX.md "BUNDLE_INDEX.md") | [Stop treating the archive's hashes as a rule, and make them a record …](https://github.com/StepenkoAnatoli/Research-Kit/commit/decddc7e9cc93e1c9407e9af4866300c8d17eeca "Stop treating the archive's hashes as a rule, and make them a record that is actually checked  WHAT CHANGED   docs/adr/0028-the-bundle-is-a-received-state-not-a-live-constraint.md  (new)     - Supersedes ADR-0022's byte-preservation consequence. The rest of ADR-0022       is untouched and still right: the release-evidence validator layer stays       deferred with nothing stubbed in to pretend it exists.     - ADR-0007 is restored in full. The same-commit map rule now has no exception.    lib/bundle.mjs, bin/bundle.mjs, test/bundle.test.mjs  (new, 12 tests)     - verifyBundle(root) sorts all 80 indexed files into unchanged, drifted,       unexpected and missing. EXPECTED_TO_DRIFT names only files one of this       project's own rules requires to move: the corpus, the map, the ADR index,       and the manifest itself.     - Hashes bytes, not decoded text, with a test using a deliberately invalid       utf8 sequence to prove the two digests differ.     - A test asserts no planning document is ever exempted - a drift report whose       exemption list grows can stop saying anything.     - A test runs it against THIS repository and fails if any bundled document       changed with no rule requiring it.    BUNDLE_INDEX.md: a header saying what it is - frozen at 2026-09-17, never     regenerated - so the next reader does not reconstruct that from an ADR.   lib/doctor.mjs: a `bundle` line, so drift is visible in the health report     rather than only when somebody thinks to ask.   docs/history-2026-09-20-two-commits-kept.md  (new): the second decision.  WHY   ADR-0022 said docs/ARCHITECTURE.md must not be edited because BUNDLE_INDEX.md   carries its SHA-256, and gave the same-commit map rule an exception on the   grounds that editing it would trade \"a checkable property for an unverifiable   one\".    That was inverted, and it is measurable. `grep -rn BUNDLE_INDEX research-kit/`   returns nothing: those digests had never been read by any code in this kit, so   they had never once been verified. The map rule, meanwhile, is checked   mechanically on every commit by the gate this project ships. The exception   suspended the property that was being enforced in order to protect the one that   was not.    The premise was also already false. Nine of eighty files have changed - the   whole corpus, the map, the ADR index, and the index itself. Most moved because   the kit was USED. A research-first kit whose corpus never changes is one nobody   ran.    And it cost something. Three commits took --no-verify. Twice in one session the   gate blocked and was right both times: ARCHITECTURE.md described CMD_SAFE_ARG as   an allowlist after it became a denylist, claimed the adapter stamped   completeness 'full' after it started grading, said \"two adapters\" after there   were two sides, and named a rankedBy field that only existed in memory. An   exception that suppresses a rule which keeps catching real drift is a bad   exception.    The digests stay frozen rather than being regenerated. A hash file rewritten   whenever it disagrees with reality records nothing - it can never fail, so it   can never tell you anything. Frozen, it answers a real question: what did we   actually receive? Git cannot answer that one, because this repository's first   commit is already the unpacked archive.  THE OTHER DECISION: 58f2c34 and d0278b2 STAY   Not squashed. Three reasons, in ascending order of how much they settle it.    They are evidence, not noise: the pair is this project's commit gate being   proved on the real repository - one commit reopening four unknowns and being   refused, one restoring them and being allowed. The suite covers the gate in   temp projects; it cannot cover the gate installed machine-wide against this   corpus. That happened once.    The project already decided this. EVIDENCE.md keeps E-15, a 404 capture, with   the row saying \"deleting the failed capture would have made the corpus look   tidier than the research was\". Rewriting history to drop the experiment that   proved the gate works is the same move for the same false benefit.    And it would break live references. Three documents cite the descendant SHAs -   the validation map cites 5ff0bdd, a536ec1 and 8111c66; ADR-0027 and the   requirements both cite 2f9c761. Rewriting 58f2c34 changes every hash above it.   A traceability document whose references no longer resolve is worse than none:   it looks authoritative and points at nothing.    The real defect was that `wip: reopen the unknowns while re-collecting` never   said why an agent deliberately broke its own contract. Git cannot annotate a   commit without rewriting it, so the annotation is   docs/history-2026-09-20-two-commits-kept.md. src/index.js needed no action -   86a428e had already removed it.  HOW TO VERIFY   node research-kit/bin/selftest.mjs    433 passed, 0 failed  (was 421)   node research-kit/bin/bundle.mjs      71/80 unchanged, 9 expected, 0 unexpected   node research-kit/bin/doctor.mjs      READY, 18 checks   node research-kit/bin/preflight.mjs   PASS, 0 blocking    This commit is itself the test of the decision: it changes research-kit/lib and   was written with NO --no-verify. The gate allowed it because ARCHITECTURE.md is   staged alongside, which is what ADR-0007 asked for all along.  WHAT IS STILL OPEN   The three gaps named in docs/validation-2026-09-20-search-fetch-seam.md, all   unchanged: no test executes either CLI, two-provider concurrency is an argument   rather than a test, and the live network path is exercised but not pinned.  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>") | last weekSep 20, 2026 |
| [CONTEXT.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/CONTEXT.md "CONTEXT.md") | [CONTEXT.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/CONTEXT.md "CONTEXT.md") | [protocol: short commit reports and design-only ADRs for small changes](https://github.com/StepenkoAnatoli/Research-Kit/commit/491c0b90a8c499ffb8907e6786a68b9fdc20c4da "protocol: short commit reports and design-only ADRs for small changes  What changed: rules 2 and 3 of the standing protocol (AGENTS.md, template/AGENTS.md, CONTEXT.md) allow a one-line-per-part report outside the declared code paths, and require an ADR only for design choices; ADR-0075 and its index row. Why: the operator asked to lighten process overhead for small changes; test-only and wording commits carried the full ceremony. What you verified: full suite 1106 passed, exit 0; staged-diff key scan 0. This commit touches no declared code path, so it uses the short form it introduces. What you got wrong: nothing to report.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | yesterdaySep 27, 2026 |
| [README.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/README.md "README.md") | [README.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/README.md "README.md") | [runtime: the Python floor is 3.11, and CI tests exactly the floor](https://github.com/StepenkoAnatoli/Research-Kit/commit/0e83eb25a35bad3a5d2befad6a1e6fdb5b2412a9 "runtime: the Python floor is 3.11, and CI tests exactly the floor  What changed: REQUIRED_PYTHON in lib/runtime.mjs goes from 3.12 to 3.11, and checkPython's fix messages are built from it. README.md, research-kit/README.md and both python-version pins in .github/workflows/offline-suite.yml now say 3.11. A new support-policy test requires the code, both READMEs and every CI pin to name the same floor. The prerequisites test now checks the boundary (3.11 accepted, 3.10 rejected).  Why: an outside break-test noted the floor was declared 3.12 while the runners passed on 3.11, so the floor was never tested as binding. The old policy test only asked for \"some 3.1x pin\". I measured the real range: the CI cross-language step and all 58 Python-dependent tests pass on 3.10, 3.11, 3.12 and 3.13. 3.11 is the oldest of those still maintained. ADR-0078 records the choice and the rejected alternatives (keep 3.12; 3.10, end of life October 2026; a four-version matrix).  What it touched: research-kit/lib/runtime.mjs, README.md, research-kit/README.md (floor, and count 1121 -> 1122), .github/workflows/offline-suite.yml (pins only), test/support-policy.test.mjs, test/collection-prerequisites.test.mjs, docs/ARCHITECTURE.md (runtime row), ADR-0078 and its index row.  What you verified: the boundary assertion was red first (\"the floor, 3.11, must be accepted\"). Across Python 3.10/3.11/3.12/3.13 the three runners agreed with Node 3/3 each, and the Python-dependent tests passed 58/58 each. Full suite 1122 passed, exit 0; preflight 0. The staged-diff key scan printed 0.  What you got wrong and fixed: nothing to report.  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> Claude-Session: https://claude.ai/code/session_01S1fT6wSqD2LwRjsUuRvDau") | 14 hours agoSep 28, 2026 |
| [RESEARCH\_REPORT.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/RESEARCH_REPORT.md "RESEARCH_REPORT.md") | [RESEARCH\_REPORT.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/RESEARCH_REPORT.md "RESEARCH_REPORT.md") | [Adopt this implementation and the original corpus as one project](https://github.com/StepenkoAnatoli/Research-Kit/commit/8cc1389ee52cd38568de42d696030de3a9811538 "Adopt this implementation and the original corpus as one project  WHAT CHANGED   The research-kit built over this session (26 lib modules, 13 bin entrypoints,   21 test files, 329 tests) becomes the project's code, and the six captures plus   the fetch ledger from Deep-Research-Agent-main become its corpus. First commit   of the combined tree, and the first time this project has been a git repository   at all.    research/raw/ (7 files) and research/audits/ (11) copied as bytes from the   original. research/kit.json takes the original's annotation. .gitattributes and   .gitignore merge both: the original's rationale, this session's secret rules,   and `* text=auto eol=lf` for the whole repository rather than only the part   whose hashes made line endings visible.    The ledger was re-chained under this implementation's canonical entry hash.   The two implementations excluded different internal fields when canonicalising,   so five of seven entrySha256 values did not recompute here. rebuildLedger   recorded the migration with its own chained boundary entry; changed=0, because   no field VALUE moved - only the chaining was recomputed.  WHY   Two codebases with identical module names is not a state to keep. Code is   reproducible and this one has the 2026-09-16 review applied; the corpus is   irreplaceable evidence and only the original had it. ADR-0022, 0023, 0024,   0025 and 0026 are the decisions that produced this code.  WHAT IT TOUCHED   Everything, as a first commit. Notable: research/raw/**, research/audits/**,   .gitattributes, .gitignore, research/kit.json. Two defects were found while   doing it and fixed in lib/: the secret scanner flagged its own test fixtures,   and validateProject flagged a token that docs/ARCHITECTURE.md merely quotes.  WHAT I VERIFIED   node research-kit/bin/selftest.mjs        329 passed, 0 failed   node research-kit/bin/handoff.mjs         OK - 8 entries, chain verifies   node research-kit/bin/preflight.mjs       PASS - 0 blocking, 9 warnings   node research-kit/bin/doctor.mjs          1 blocker: firecrawl-auth    All six capture body hashes verified on arrival, before anything was staged,   and again after - the evidence is byte-identical to what the collector fetched.   git stores the corpus with LF, checked against the index blob.    The nine preflight warnings are honest and pre-existing: five rows collected by   `agent page fetch` with no Firecrawl egress (ADR-0010's own example), one row   whose fetch records no transport, and three unknowns resting on partial   captures that research/MAP.md already discusses. The one doctor blocker is   true: there is no Firecrawl key on this machine.  WHAT I GOT WRONG AND FIXED   Three, all during this commit.    1. The secret scanner I added last pass reported three CRITICAL findings      against research-kit/test/hardening.test.mjs - its own synthetic fixtures.      A scanner permanently red about itself is one nobody reads, and excluding      the test directory would have been a hole big enough to hide a real key in.      The fixtures now assemble their strings at runtime, so there is nothing to      find and no exclusion exists.    2. validateProject blocked on `docs/ARCHITECTURE.md still holds {{KIT}}` - the      map quotes the token, in a code span, while explaining that the two      START_HERE copies differ by exactly that. unresolvedPlaceholders now ignores      inline code spans, and the property that actually matters is pinned where it      belongs: a test asserts a freshly scaffolded project holds no token anywhere.    3. `git add` failed outright with \"Filename too long\" on the audit files. The      audit slug is capped at 60 characters and then extended with a subtopic id,      a version and a date, which on a deep Windows path exceeds MAX_PATH.      core.longpaths=true unblocks it; the filename length itself is a real defect      and is NOT fixed here, because the manifest points at those names.  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>") | 2 weeks agoSep 17, 2026 |
| [START\_HERE.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/START_HERE.md "START_HERE.md") | [START\_HERE.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/START_HERE.md "START_HERE.md") | [Adopt this implementation and the original corpus as one project](https://github.com/StepenkoAnatoli/Research-Kit/commit/8cc1389ee52cd38568de42d696030de3a9811538 "Adopt this implementation and the original corpus as one project  WHAT CHANGED   The research-kit built over this session (26 lib modules, 13 bin entrypoints,   21 test files, 329 tests) becomes the project's code, and the six captures plus   the fetch ledger from Deep-Research-Agent-main become its corpus. First commit   of the combined tree, and the first time this project has been a git repository   at all.    research/raw/ (7 files) and research/audits/ (11) copied as bytes from the   original. research/kit.json takes the original's annotation. .gitattributes and   .gitignore merge both: the original's rationale, this session's secret rules,   and `* text=auto eol=lf` for the whole repository rather than only the part   whose hashes made line endings visible.    The ledger was re-chained under this implementation's canonical entry hash.   The two implementations excluded different internal fields when canonicalising,   so five of seven entrySha256 values did not recompute here. rebuildLedger   recorded the migration with its own chained boundary entry; changed=0, because   no field VALUE moved - only the chaining was recomputed.  WHY   Two codebases with identical module names is not a state to keep. Code is   reproducible and this one has the 2026-09-16 review applied; the corpus is   irreplaceable evidence and only the original had it. ADR-0022, 0023, 0024,   0025 and 0026 are the decisions that produced this code.  WHAT IT TOUCHED   Everything, as a first commit. Notable: research/raw/**, research/audits/**,   .gitattributes, .gitignore, research/kit.json. Two defects were found while   doing it and fixed in lib/: the secret scanner flagged its own test fixtures,   and validateProject flagged a token that docs/ARCHITECTURE.md merely quotes.  WHAT I VERIFIED   node research-kit/bin/selftest.mjs        329 passed, 0 failed   node research-kit/bin/handoff.mjs         OK - 8 entries, chain verifies   node research-kit/bin/preflight.mjs       PASS - 0 blocking, 9 warnings   node research-kit/bin/doctor.mjs          1 blocker: firecrawl-auth    All six capture body hashes verified on arrival, before anything was staged,   and again after - the evidence is byte-identical to what the collector fetched.   git stores the corpus with LF, checked against the index blob.    The nine preflight warnings are honest and pre-existing: five rows collected by   `agent page fetch` with no Firecrawl egress (ADR-0010's own example), one row   whose fetch records no transport, and three unknowns resting on partial   captures that research/MAP.md already discusses. The one doctor blocker is   true: there is no Firecrawl key on this machine.  WHAT I GOT WRONG AND FIXED   Three, all during this commit.    1. The secret scanner I added last pass reported three CRITICAL findings      against research-kit/test/hardening.test.mjs - its own synthetic fixtures.      A scanner permanently red about itself is one nobody reads, and excluding      the test directory would have been a hole big enough to hide a real key in.      The fixtures now assemble their strings at runtime, so there is nothing to      find and no exclusion exists.    2. validateProject blocked on `docs/ARCHITECTURE.md still holds {{KIT}}` - the      map quotes the token, in a code span, while explaining that the two      START_HERE copies differ by exactly that. unresolvedPlaceholders now ignores      inline code spans, and the property that actually matters is pinned where it      belongs: a test asserts a freshly scaffolded project holds no token anywhere.    3. `git add` failed outright with \"Filename too long\" on the audit files. The      audit slug is capped at 60 characters and then extended with a subtopic id,      a version and a date, which on a deep Windows path exceeds MAX_PATH.      core.longpaths=true unblocks it; the filename length itself is a real defect      and is NOT fixed here, because the manifest points at those names.  Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>") | 2 weeks agoSep 17, 2026 |
| View all files |

## Repository files navigation

# Deep-Research-Agent

[Permalink: Deep-Research-Agent](https://github.com/StepenkoAnatoli/Research-Kit#deep-research-agent)

**Research first, build second.** This is a research kit that collects evidence from real
sources, keeps a tamper-evident record of where every claim came from, and then _refuses to_
_let a build start_ until a person has reviewed it.

It is for the case where an AI would otherwise guess: API limits, pricing, what a licence
actually permits, whether a platform can do the thing you are planning around.

* * *

## Start here if this is new to you

[Permalink: Start here if this is new to you](https://github.com/StepenkoAnatoli/Research-Kit#start-here-if-this-is-new-to-you)

Five steps. You need a GitHub account and this repository. You do **not** need to install
anything for steps 1-4.

> **Two ways in, and this is the easier one.** These steps run everything on GitHub, from
> the website. If you would rather install the kit and run it on your own machine, skip to
> [Your first 30 minutes](https://github.com/StepenkoAnatoli/Research-Kit#your-first-30-minutes) instead - same kit, same gate, more
> control and more setup.

### 1\. Get a Firecrawl key

[Permalink: 1. Get a Firecrawl key](https://github.com/StepenkoAnatoli/Research-Kit#1-get-a-firecrawl-key)

Sign up at [firecrawl.dev](https://www.firecrawl.dev/) and copy your API key from the
dashboard. The free tier is 1,000 credits a month, no card, and it stops at zero rather
than billing you.

### 2\. Put the key where only the collector can read it

[Permalink: 2. Put the key where only the collector can read it](https://github.com/StepenkoAnatoli/Research-Kit#2-put-the-key-where-only-the-collector-can-read-it)

In **your** repository on GitHub:

> **Settings** → **Environments** → **New environment** → name it `research-collection`
>
> → **Add secret**: name `FIRECRAWL_API_KEY`, value = your key
> → **Add variable**: name `RESEARCH_KIT_COLLECTION_ENV`, value `research-collection`

Both are needed. The _variable_ is how the collector checks the environment really exists —
GitHub silently creates an unprotected environment if a workflow names a missing one, and
that would leave your key somewhere it should not be.

⚠️ **Do not put the key in Settings → Secrets and variables → Actions.** That makes it
readable by _every_ workflow in the repository, including one added in a pull request. The
collector has a check that refuses to run if it finds it there.

### 3\. Run a collection from the website

[Permalink: 3. Run a collection from the website](https://github.com/StepenkoAnatoli/Research-Kit#3-run-a-collection-from-the-website)

> **Actions** tab → **collect** in the left sidebar → **Run workflow**

Type your topic, leave the rest alone for a first run, press the green button. Start small:
`max_pages: 1` and `depth: probe` costs about 3 credits.

When it finishes, scroll to **Artifacts** at the bottom of the run and download the ZIP.

### 4\. Read what came back

[Permalink: 4. Read what came back](https://github.com/StepenkoAnatoli/Research-Kit#4-read-what-came-back)

Open the ZIP and read **`README-FIRST.md`**. It will say:

> **COLLECTED CORPUS — HUMAN REVIEW REQUIRED**

**That is the correct result, not a problem.** The collector gathers evidence; it does not
decide whether the research is any good. Three steps are yours, and no tool does them:

1. Classify every row in `project/research/MAP.md`
2. Rewrite every Finding in `project/research/EVIDENCE.md` into a claim you would defend
3. Run preflight, then write and review the brief

Until those are done, `manifest.json` says `"buildAuthorized": false` — meaning **do not**
**start building from this yet**, and any AI reading it should refuse to as well.

### 5\. Check the package is intact (optional)

[Permalink: 5. Check the package is intact (optional)](https://github.com/StepenkoAnatoli/Research-Kit#5-check-the-package-is-intact-optional)

```
node research-kit/bin/artifact.mjs validate --file research-kit-corpus-v1-<something>.zip
```

`PASS` means the package is undamaged and its evidence chain verifies. It does **not** mean
you may build — that is the separate `buildAuthorized` line, and the two are kept apart on
purpose.

* * *

## Letting an AI agent run the collector

[Permalink: Letting an AI agent run the collector](https://github.com/StepenkoAnatoli/Research-Kit#letting-an-ai-agent-run-the-collector)

An agent can do steps 3–5 for you. It needs a token, and that token should be able to do
**one thing only**.

### Where to get the token

[Permalink: Where to get the token](https://github.com/StepenkoAnatoli/Research-Kit#where-to-get-the-token)

> **[github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)**
>
> (or: your avatar → **Settings** → **Developer settings** → **Personal access tokens** →
> **Fine-grained tokens** → **Generate new token**)

| Field | Value |
| --- | --- |
| Token name | something recognisable, e.g. `research-collector-agent` |
| Expiration | 30 days. Short is good — you can always make another |
| Repository access | **Only select repositories** → pick this one |
| Permissions → Repository → **Actions** | **Read and write** |
| Everything else | leave alone |

**`Actions: Read and write` is the only permission it needs.** With just that, the agent can
start a collection and read the result. It **cannot** read or change your code, read your
secrets, change settings, or reach any other repository. If it misbehaves, revoke the token
— one click, and nothing else breaks.

Copy the token when it is shown. GitHub will not show it again.

### Give it to the agent

[Permalink: Give it to the agent](https://github.com/StepenkoAnatoli/Research-Kit#give-it-to-the-agent)

Set it in the environment. **Never on a command line** — that ends up in your shell
history, in the process list, and in any log that echoes the command. There is no
`--token` flag, deliberately.

```
export RESEARCH_KIT_GITHUB_TOKEN=github_pat_...

node research-kit/bin/collect-remote.mjs \
  --repository OWNER/REPO \
  --topic "What are the rate limits on the Stripe API" \
  --max-pages 5 --json
```

Windows PowerShell:

```
$env:RESEARCH_KIT_GITHUB_TOKEN = "github_pat_..."
node research-kit/bin/collect-remote.mjs --repository OWNER/REPO --topic "..." --json
```

One command: it dispatches the run, prints the run id immediately, waits, downloads the
artifact, unwraps it, and validates it.

| Exit | Meaning |
| --- | --- |
| 0 | collected and valid — **still does not authorize building** |
| 1 | the package is invalid |
| 2 | the run failed, or the package is incomplete |
| 3 | could not start: no token, bad repository, or no permission |
| 4 | dispatched and still running when the wait ran out; the run id is on stdout |

### Or register it as an MCP tool

[Permalink: Or register it as an MCP tool](https://github.com/StepenkoAnatoli/Research-Kit#or-register-it-as-an-mcp-tool)

If your agent speaks the Model Context Protocol, it can have the collector as a tool
instead of a command:

```
{
  "mcpServers": {
    "research-kit": {
      "command": "node",
      "args": ["<path>/research-kit/bin/mcp-server.mjs"],
      "env": { "RESEARCH_KIT_GITHUB_TOKEN": "github_pat_..." }
    }
  }
}
```

Two tools: `collect` starts a run and returns its id; `fetch_corpus` takes that id and
returns a link to the validated package. The server speaks **both** protocol eras -
`2026-07-28`, and `2025-11-25` or `2025-06-18` on the older handshake - because the
specification is ahead of every shipped client, clients built on the official SDK before
December 2025 still ask for `2025-06-18`, and a server only the spec can talk to is one
nothing can call. The same token, the same one permission, and the
same rule at the end - the result carries `buildAuthorized`, and it is `false` for every
freshly collected corpus.

Why it is a local server and not a hosted one, and why it hands back a link rather than the
file: [ADR-0034](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/docs/adr/0034-the-collector-speaks-mcp-over-stdio.md), which was written
from research that passed the gate first.

### What the agent must not do

[Permalink: What the agent must not do](https://github.com/StepenkoAnatoli/Research-Kit#what-the-agent-must-not-do)

Read `buildAuthorized` and stop if it is `false`. **It will be `false` for everything this**
**command returns**, because a freshly collected corpus has not been reviewed by anyone. An
agent treating exit 0 as permission to build has skipped the only part that needed a person.

* * *

## Reference

[Permalink: Reference](https://github.com/StepenkoAnatoli/Research-Kit#reference)

- [`research-kit/README.md`](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/research-kit/README.md) — every command, the artifact format, the transports
- [`docs/ARCHITECTURE.md`](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/docs/ARCHITECTURE.md) — what each module owns
- [`docs/adr/`](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/docs/adr/README.md) — why things are the way they are

## Supported platforms

[Permalink: Supported platforms](https://github.com/StepenkoAnatoli/Research-Kit#supported-platforms)

**Linux and Windows are supported. macOS is best-effort and untested.**

"Supported" here means one specific thing, and nothing vaguer: **every commit runs the**
**full offline suite on that platform in CI.** Linux and Windows both do
( [`offline-suite.yml`](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/.github/workflows/offline-suite.yml)). macOS does not, so a macOS
regression will not be caught before you hit it. Until GitHub's `ubuntu-latest` finishes
moving to Ubuntu 26.04 (2026-11-19), Linux is checked on both images, 24.04 and 26.04
( [ADR-0043](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/docs/adr/0043-the-suite-runs-on-ubuntu-26-04-through-the-migration.md)).

|  | Linux | Windows | macOS |
| --- | --- | --- | --- |
| full suite runs on every commit | ✅ | ✅ | ❌ |
| platform-specific behaviour asserted | executable hook bit | LF checkout, `.cmd` argument guard | — |
| a regression here is caught by CI | yes | yes | **no** |

This is not a guess about where the code works — it is a statement about where it is
_checked_. The distinction earned itself twice in one day:

- `githooks/pre-commit` shipped as mode `100644`. Git **silently skips** a non-executable
hook, so the gate reported clean commits while doing nothing. The machine it was
authored on (Windows) has no executable bit and _could not_ have detected it; the first
Linux run found it in minutes.
- The single macOS run we did was not wasted either. It found a real containment bug —
`audit --zip` refused to package its own files whenever the project sat under a symlink.
**That one was never macOS-specific:** a symlinked `~/projects`, or `/home` → `/mnt/home`,
reproduces it on Linux. It is fixed.

macOS is excluded deliberately rather than accidentally. A CI leg nobody intends to fix
teaches people to ignore red, which costs more than the coverage is worth. If that
changes, add `macos-latest` to the matrix in `offline-suite.yml` — there is a comment
there saying so.

**Requirements:** Node 22+ and Git. Python 3.11+ is needed for the cross-language
conformance runners; without it those tests report `UNSUP` and **block** rather than
silently passing. Node 22, 24 and 26 are each tested on every commit - the three lines Node
supports (as of 2026-09). Behind an HTTPS proxy, the kit's own requests (keyless pages,
SerpAPI searches, remote collection) need Node 22.21+ or 24+ to use it; `doctor` says so
when yours cannot.

## Bring your own keys

[Permalink: Bring your own keys](https://github.com/StepenkoAnatoli/Research-Kit#bring-your-own-keys)

**No credentials ship with this repository, and none ever will.** If you cloned this,
the keys are yours to supply.

You can run the whole kit with **no key at all**:

```
node "$HOME/.agents/research-kit/bin/research.mjs" --transport http-keyless
```

That route has no vendor, no credential and no metering. It is slower and its captures
are often graded `partial`, which the corpus records honestly rather than hiding.

For the metered routes, the kit reads a credential from exactly two places — the
environment, or the machine config at `~/.agents/research-kit.config.json`:

| Provider | Used for | How to supply it |
| --- | --- | --- |
| Firecrawl | fetching pages, and searching by default | `npm install -g firecrawl-cli@1.24.6` (the package is `firecrawl-cli`; `firecrawl` is a different one), then `firecrawl login` — the CLI stores it. **Never run `firecrawl env` inside a repository**: it writes the key into `.env`. |
| SerpAPI | searching only, entirely optional | `SERPAPI_API_KEY`, or `serpapiKey` in the machine config |

Both have free tiers, and the kit is designed around them: Firecrawl gives 1,000 credits
a month, SerpAPI 250 searches. Adding the SerpAPI key is worth it not because it is
cheaper but because it is a _second meter_ — search stops competing with fetching for the
same budget ( [ADR-0027](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/docs/adr/0027-search-and-fetch-are-two-seams.md)).

**The kit never reads a key from the repository, and never writes one into it.** That is
a checked property, not a promise: `doctor` runs a secret scan over every tracked text
file on each invocation, the tests assert the key never reaches a rendered command, a log
line or an error string, and a query that _contains_ your key is refused before it is
sent — because it would otherwise be stored as a search term on the vendor's systems.

**Validating needs no credentials at all.** The release-evidence validators, the
conformance runners in both languages, `preflight` and the whole test suite are offline
and read-only — none of them reads an environment variable, so none can use a key even
by accident. A reviewer can re-run every check without asking you for anything.

One disclosure, since it is your data: a search sends your query text to the provider.
SerpAPI retains search data for 31 days. Tavily was evaluated and **deliberately not**
**wired in**, because its terms permit it and its AI providers to retain queries and
outputs for training — a reasonable thing to opt into knowingly, and not a reasonable
default ( [research/BRIEF.md](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/research/BRIEF.md)).

## Your first 30 minutes

[Permalink: Your first 30 minutes](https://github.com/StepenkoAnatoli/Research-Kit#your-first-30-minutes)

**The local path**, for running the kit on your own machine rather than on GitHub. If you
just want research back and do not care where it runs,
[Start here](https://github.com/StepenkoAnatoli/Research-Kit#start-here-if-this-is-new-to-you) is shorter.

One path, in order. Steps 1–4 and 7 are entirely offline and need no credential; step 5's
map searches and step 6's collection are the only steps that can spend anything.

**1\. Check the machine.** This answers "is anything missing" before you spend time on it.

```
node research-kit/bin/doctor.mjs
```

**2\. Install the kit and its gates.**`install.mjs` copies the kit to
`~/.agents/research-kit`, where every project on this machine reaches it. `install-hooks.mjs`
installs the commit and edit gates, which are what hold a project to "research first". A
_collector_ holds a key and gathers evidence; a _builder_ has no key and consumes what a
collector pushed. The default is collector.

```
node research-kit/bin/install.mjs
node research-kit/bin/install-hooks.mjs                  # a collector (the default)
node research-kit/bin/install-hooks.mjs --role builder   # instead, on a build machine
```

**3\. See a validator actually work, before you own any data.** Six synthetic packages —
one that passes, five that fail one way each:

```
node research-kit/examples/release-evidence/run-example.mjs
```

Read [`examples/release-evidence/README.md`](https://github.com/StepenkoAnatoli/Research-Kit/blob/main/research-kit/examples/release-evidence/README.md)
next. It is the fastest way to learn what a release package _is_, because the schemas
describe each file's shape and say nothing about how they refer to each other.

**4\. Prove the whole thing runs here.** Offline, no key, no network:

```
node research-kit/bin/selftest.mjs
```

**5\. Scaffold a project.** A project is its own folder, outside this repository. It is the
**current working directory** \- the kit takes no project argument - so `cd` there first,
and call the installed kit by its full path. `$HOME` works in bash, zsh, Git Bash and
PowerShell.

```
mkdir "$HOME/my-research" && cd "$HOME/my-research"
node "$HOME/.agents/research-kit/bin/new-project.mjs" . --topic "<your topic>"
node "$HOME/.agents/research-kit/bin/decompose.mjs" --topic "<your topic>"
```

Then open `research/MAP.md` and mark each row `COVERED`, `DISMISSED` or `GAP`. **This step**
**is yours and is not automated** — deciding what counts as answered is the judgement the
rest of the kit protects.

Write the blocking unknowns into `research/DISCOVERY.md`, each tracing back to a map row,
then the queries and pages that close them into `research/plan.json`. `research.mjs`
refuses a plan with neither:

```
{
  "topic": "<your topic>",
  "queries": [{ "q": "<what to search for>", "why": "U-1", "prefer": ["<the domain that owns the fact>"] }],
  "urls": [{ "url": "https://<a page you already know>", "why": "U-1", "type": "P" }]
}
```

**6\. Collect.** The only step that spends credits:

```
node "$HOME/.agents/research-kit/bin/research.mjs" --dry-run   # see what it would fetch, and the cost
node "$HOME/.agents/research-kit/bin/research.mjs"
```

**7\. Ask whether you may build yet.**

```
node "$HOME/.agents/research-kit/bin/preflight.mjs"
```

`PASS` means the thirteen corpus checks agree the evidence supports starting. Anything else
names what blocks and prints one fix.

### Reading a verdict

[Permalink: Reading a verdict](https://github.com/StepenkoAnatoli/Research-Kit#reading-a-verdict)

Every validating command maps its status to an exit code, so scripts can branch on it:

| Status | Exit | Means |
| --- | --: | --- |
| `PASS` | 0 | checked, and correct |
| `FAIL` / `REOPEN` | 1 | checked, and wrong |
| `INCOMPLETE` | 2 | **could not be checked** — not the same as wrong |
| `BLOCKED` | 3 | refused to start |

The `INCOMPLETE` row is the one that catches people. A record the registry declares but
which is absent produces no verdict _about that record_, so reporting `FAIL` would claim
more than the validator knows.

## When something fails

[Permalink: When something fails](https://github.com/StepenkoAnatoli/Research-Kit#when-something-fails)

The failure modes that actually happen, and what each one looks like:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Tests print `UNSUP  PYTHON-NOT-FOUND` and the suite exits non-zero | No Python; the cross-language conformance runners cannot run | Install Python 3.11+. This **blocks by design** — a green suite with no Python would claim Node and Python agree while testing neither |
| `preflight` fails with `ledger-missing` | `research/raw/.fetches.jsonl` did not travel. Zip tools and some sync tools silently drop dotfiles | On the collector: push `research/raw/` **including its dotfiles** |
| Commits succeed but the gate never seems to run | `githooks/pre-commit` is not executable; git skips a non-executable hook silently | `git update-index --chmod=+x research-kit/githooks/pre-commit` |
| The gate blocks with "…is not staged with them" | You changed a declared code path without updating `docs/ARCHITECTURE.md` | Update the map, or `git commit --no-verify` (recorded) |
| `audit --zip` says a file "resolves outside" its own directory | Fixed 2026-09-20. Older checkouts refuse whenever the project sits under a symlink | Update |
| `researcher-release validate` rejects a package you believe is right | The files refer to each other; one link is wrong | `diff` your package against `examples/release-evidence/01-minimal-pass/` |
| A `PASS` did not notice a file you know is broken | `validate` checks what the **registry declares**, not what the directory contains | See package `03` in the examples — it exists to document exactly this |
| Windows: `git add` refuses with a long-path error | `MAX_PATH`; this repo has produced 114-character paths under a 157-character root | `git config core.longpaths true` |

## Run it from inside the project

[Permalink: Run it from inside the project](https://github.com/StepenkoAnatoli/Research-Kit#run-it-from-inside-the-project)

The kit takes no project argument — the project is the current working directory. `cd`
into the project first, then run the kit from wherever it is installed:

```
cd ~/projects/my-thing
node "$HOME/.agents/research-kit/bin/preflight.mjs"
```

From any other directory it reports on the directory it is standing in.

## Two machines, two roles

[Permalink: Two machines, two roles](https://github.com/StepenkoAnatoli/Research-Kit#two-machines-two-roles)

The kit runs on two boxes, and a machine declares which half it is (`role` in
`~/.agents/research-kit.config.json`, default `collector` — set it with
`node research-kit/bin/install-hooks.mjs --role builder`):

|  | **collector** (the operator's PC) | **builder** (a sandbox, a CI box, a second laptop) |
| --- | --- | --- |
| holds | the Firecrawl key | no key, no Firecrawl egress to firecrawl.dev |
| runs | `decompose.mjs`, `research.mjs` — produces the corpus | `handoff.mjs`, `preflight.mjs` — consumes it, then builds |
| `doctor.mjs` | a missing key is a FAIL | a missing key is informational |
| must | push `research/raw/` including its dotfiles, so the builder can receive the corpus | **not collect** — `research.mjs` and `decompose.mjs` refuse (exit 2) |

The corpus crosses the two through git, so the builder's first command is:

```
node "$HOME/.agents/research-kit/bin/handoff.mjs"
```

It verifies that `research/raw/.fetches.jsonl` (the ledger) is present and non-empty,
that every capture an evidence row names is on disk, and that the chain verifies. It
exits 1 and names whatever is missing. The remedy always lives on the collector: push
`research/raw/` including its dotfiles. See `docs/adr/0010-machine-roles.md` and
`docs/adr/0011-handoff-integrity.md`.

## Cloning or zipping this repository

[Permalink: Cloning or zipping this repository](https://github.com/StepenkoAnatoli/Research-Kit#cloning-or-zipping-this-repository)

**One dotfile under `research/raw/` is evidence. The rest are byproducts, and the**
**difference matters in both directions.**

`research/raw/.fetches.jsonl` is the hash-chained fetch ledger that proves every cached
page in `research/EVIDENCE.md` was actually fetched. It **must travel**. Zip tools, some
sync tools, and certain git filters silently drop dotfiles — and if it is missing, the
repository cannot pass its own gate (`node research-kit/bin/preflight.mjs` fails with
`ledger-missing`). That has happened to this project once already. When copying by hand,
copy `research/raw/.fetches.jsonl`.

Everything else there is **machine-local state and must not travel**:
`.diagnostics.jsonl` (what the gate decided, each time it ran), `.usage.jsonl` (what a
collection spent), `.failures.jsonl` (what a collection failed to fetch), and
`.fetches.lock`. All four are in `.gitignore`.

The reason this paragraph is worded so carefully: `.diagnostics.jsonl` was tracked
anyway, from the first commit of this repository until 2026-09-20 — added in the same
commit as the `.gitignore` rule that excludes it, which `.gitignore` is powerless to undo
once a file is in the index. The gate writes a line to it on **every** invocation, so
every verification left the working tree dirty, and a read-only check that modifies the
repository is a contradiction. A test now asserts that no ignored file is tracked.

## About

No description, website, or topics provided.

### Resources

[Readme](https://github.com/StepenkoAnatoli/Research-Kit#readme-ov-file)

[Activity](https://github.com/StepenkoAnatoli/Research-Kit/activity)

### Stars

**0** stars

### Watchers

**0** watching

### Forks

[**0** forks](https://github.com/StepenkoAnatoli/Research-Kit/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2FStepenkoAnatoli%2FResearch-Kit&report=StepenkoAnatoli+%28user%29)

## Releases

## Packages

## Contributors

## Languages

You can’t perform that action at this time.
