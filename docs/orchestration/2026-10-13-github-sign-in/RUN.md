# Run: github-sign-in

| Field           | Value |
|-----------------|-------|
| Status          | ACTIVE |
| Started         | 2026-10-13 |
| Last checkpoint | 2026-10-13 - Stage 5: U0 committed (`8f86232`), briefs written, wave 1 launching |
| Engagement      | Full (authentication, credential storage, new IPC, external service) |
| Working branch  | Stages 1-4: `research/github-sign-in` (PR #46). Stage 5: `build/github-sign-in` (worktree `/home/user/task5-handoff/wt/gsi-build`), from `6ac1007` (PR #46's head); builders in `/home/user/task5-handoff/wt/gsi-u<N>` on `build/gsi-u<N>` |
| Skills          | auto-build, lead-orchestrator, careful-coding, Research-Kit 0.9.5 |

## Auto-build stages
| Stage | Status | Artifact | Checkpoint |
|-------|--------|----------|------------|
| 0 Orient | DONE | this ledger; baseline below | 2026-10-13 |
| 1 Research | DONE: two projects, 21 credits, preflight PASS and handoff 0 each; every round refute-first verified (last: ACCEPT) | `docs/research/2026-10-12-app-sign-in`; `docs/research/2026-10-13-github-sign-in-design` (E-01..E-21, U-1..U-15 CLOSED, U-16 KNOWN-UNKNOWN) | 2026-10-13 |
| 2 Requirements | DONE: 54 rows (F-1..F-27, S-1..S-8, T-1..T-10, A-1..A-4, D-1..D-5), each traced to a unit and a test | REQUIREMENTS.md | 2026-10-13 |
| 3 Design | DONE: lifecycle-first design (three designs, three judges); critic rounds 1 (2 S2) and 2 (1 S3) resolved; final checks ACCEPT (brief) and three S4 wording items (design), applied by the lead | docs/specification/github-sign-in.md; DECISIONS.md; BREAKDOWN.md; USER-DECISIONS.md | 2026-10-13 |
| 4 Mandate | DONE: user, 2026-10-13, "GO MERGE, read-only, private text like local files"; UD-1 (registration) open, so the build ships with empty constants (UD-1 option 3) | MANDATE.md | 2026-10-13 |
| 5 Build | ACTIVE: U0 DONE (lead, `8f86232`); wave 1 (U1-U4) launching | units below | 2026-10-13 |
| 6 Harden | PENDING | - | - |
| 7 Audit | PENDING | - | - |
| 8 Deliver and merge | PENDING | - | - |
| 9 Validate and report | PENDING | - | - |

## Next action
Wave 1: U1 and U2's third fix round (workflow `github-sign-in-wave1-round3`); then integrate both, restructure nothing further in the map (one line per unit since U4's integration), run the pinned gate on the integrated head, and launch wave 2 (U5) from it.

## Task statement
User, 2026-10-12: "Can we make the app be able to login to GitHub/codex/Claude?" The Research-Kit check (`docs/research/2026-10-12-app-sign-in`, 8 credits) answered it. GitHub sign-in is allowed and is planned as its own task after the MoonAliza rename. Claude.ai sign-in is not allowed. Sign in with ChatGPT is not stated, so API keys are used until OpenAI confirms. The plan records this (`docs/superpowers/plans/2026-10-02-research-jobs.md`, "App sign-in", `64864bd`). User's order, 2026-10-12: Phase 2 and the rename, then this task, then the independent-operation track, then More models Phases 3-5. Standing words: "continue without asking or stopping", "merge as you decide just be careful", "dont lower quality", "you have full access. continue", "write less text. report in summary at the end of phase."

Scope of this run: GitHub sign-in only. The Claude and OpenAI outcomes are recorded and need no build beyond the settings sentence the brief proposes (next step 3).

## Baseline
`main` @ `0815f42` has the same tree as `194acc8` (`git diff` empty). Its pinned Linux gate, `/home/user/task5-handoff/results/s9ci1-194acc8`: typecheck, lint, build 0; 1572 tests, 74 failed, exactly `/home/user/task5-handoff/baseline-failing.json`, 0 files without results. Windows CI green on `194acc8` (38351459554 pull_request, 38351426367 push).

## Units
| Unit | Status | Commits | Review |
|------|--------|---------|--------|
| U0 contracts (lead) | DONE: red first (5 tests and one missing module), 8 of 8 guard proofs red, typecheck, lint, eslint e2e, check-handoff 0 | `8f86232` | lead; integration review later |
| U1 wire client | BUILT; reviews FIX x3 (S2, S2, then S3/S4); round 3 running | `build/gsi-u1`: `289fe3d`..`6b8ca13` (7) | wave-1 workflow |
| U2 account store | BUILT; reviews FIX x3 (S2 each); round 3 running | `build/gsi-u2`: `5fbbdab`..`7bcdc67` (13) | wave-1 workflow |
| U3 reader and reasons | INTEGRATED, ACCEPT (round 1 S3 x2 fixed; re-review S4 only, lead-owned spec items applied in `f4354ac`) | `4cce004`..`476c402` (10, fast-forward) | wave-1 workflow |
| U4 renderer | INTEGRATED, ACCEPT (round 2 FIX on one S3, fixed; final ACCEPT with no findings) | 10 cherry-picks ending `49faf12` | wave-1 workflow |
| U5 lifecycle service | PENDING (wave 2) | - | - |
| U6 main wiring | PENDING (wave 3) | - | - |
| U7 token invariant | PENDING (wave 3) | - | - |
| U8 Windows e2e | PENDING (wave 4) | - | - |
| U9 constants | WAITING on UD-1 | - | - |

## Research-Kit
Kit 0.9.5, role collector, `firecrawl-cli` authenticated, 277 credits. `doctor`: 3 blockers, all BT12-F1 (key-shaped test values; the user's decision, recorded in the More models run). Collection budget for this run: at most 15 credits, dry run first.

## Decisions and assumptions
- 2026-10-13: collection budget raised from 15 to 20 credits by the lead, for the owner pages the round-1 verifier and critic named (about 8 pages); 265 credits remained after round 1. Reversible only in the sense that nothing more is spent if the user objects.
- 2026-10-13: one more credit (21 in all) for GitHub's device-flow tutorial, to settle where the device-flow and refresh parameters go (OF-1 in the synthesis); the lead approved it as negligible against 257 remaining.
- 2026-10-13: U1 and U2 each ended the wave-1 workflow's two fix rounds with FIX (U1: one S3 and two S4; U2: one S2, two S3, one S4: guards without tests and two crash-window paths). Their severity fell each round and the remaining fixes are small and local, so the lead gave each a third, targeted round with a fresh review instead of stopping the run (auto-build's two-retry stop). A fourth would go to the user.
- 2026-10-13: classified architectural (sign-in flow, a new credential kind in the vault, new IPC, a GitHub App registration only the user can make); the Mandate waits for the user.

## Log
- 2026-10-13: started after More models Stage 9 (PR #44, `1bece02`) and the S9-CI-1 fix (PR #45, `0815f42`).
- 2026-10-13: Stage 1 workflow `github-sign-in-stage1` (run `wf_a788bf15-8c0`) launched: one researcher (nested project `docs/research/2026-10-13-github-sign-in-design` in worktree `/home/user/task5-handoff/wt/gh-signin`, branch `research/github-sign-in`, at most 15 credits), three read-only mappers (GitHub surfaces, vault and IPC, main-process runtime), a refute-first verifier and a completeness critic.
- 2026-10-13: Stage 1 round 1 returned (`reports/stage1-workflow.json`, 6 agents). Researcher: 12 pages, 12 credits (277 -> 265), preflight PASS, handoff 0, U-1..U-8 CLOSED, U-9 (REST API version) KNOWN-UNKNOWN. Verifier: FIX - F-1 (a 401 read as revocation would wipe a valid refresh token), F-2 (the not-installed case and organization install rights unanswered), F-3 (rate limits must be classified before a 403 is read as a missing permission), F-4..F-8 S3, F-9 S4. Critic: three user decisions (who registers and owns the GitHub App; read-only now or the broader permission set the plan names for the collector and self-unblocking; how private code is treated in cloud sessions), plus repository gaps (the renderer status channel, the network stack). The lead merged `research/app-sign-in` into the research branch (`d0df7e9`, F-7).
- 2026-10-13: round 2 launched (workflow `github-sign-in-stage1-round2`). Mistake: the first launch passed an empty findings list into the researcher's prompt (the args held a placeholder). Where: the round-2 workflow's args. Impact: the researcher would not have seen F-2, F-5, F-6 and F-9; it was stopped before writing anything or spending a credit (ledger still 12 entries, no file changed). Cause: I wrote the args by hand instead of from the saved report. Fix: the script now has the researcher and the verifier read the findings from `reports/stage1-workflow.json`. Verified: the relaunched run's script names the report path; the worktree was unchanged before the relaunch.
- 2026-10-13: round 2 returned (`reports/stage1-round2-workflow.json`): 8 owner pages, 8 credits (265 -> 257; 20 in all), preflight PASS, handoff 0; U-1..U-15 CLOSED, U-16 (a per-app device-flow cap for GitHub Apps) KNOWN-UNKNOWN; every round-1 finding addressed. Fresh verifier: FIX with S3/S4 only (R2-1 the 403 causes, R2-2 the SAML remedy, R2-3 a token issued before an installation, R2-4 the token-endpoint limit and rate limits on poll and refresh, R2-5 refresh failures; R2-6..R2-10 wording). Workflow `github-sign-in-stages2-3` launched: a no-collection fix round on the brief with a targeted re-check, in parallel with requirements, three designs (minimal, lifecycle-first, privacy-first), three judges, a synthesis and a critic.
- 2026-10-13: workflow `github-sign-in-stages2-3` returned (`reports/stages2-3-workflow.json`, 11 agents). Brief round 3: R2-1..R2-10 applied, no credits, preflight PASS; re-check FIX (S-1 S3: the 403 path's SAML remedy still one step; S-2..S-7 S4 residues). Requirements, three designs, three judges (lifecycle-first won two of three), a synthesis (spec, decisions, breakdown, requirements, 7 user decisions, 15 day-one checks) and a critic: FIX with DC-1 (S2: a refresh failing with any error but bad_refresh_token holds forever and never asks the user to sign in again), DC-2 (S2: a 401 on a just-refreshed token clears the account, assuming GitHub accepts a new token at once), DC-3..DC-7 S3, DC-8..DC-16 S4. The lead moved this run folder onto `research/github-sign-in` and wrote the drafts there. Workflow `github-sign-in-revise` launched.
- 2026-10-13: workflow `github-sign-in-revise` returned (`reports/revise-workflow.json`, 4 agents). Round 4: S-1..S-7 fixed; E-21 (GitHub's own device-flow tutorial, 1 credit, 257 -> 256) settles that step 1 and the poll send form-encoded bodies with `Accept: application/json`; the refresh placement stays an inference for the day-one double refresh; preflight PASS (21 ledger entries, 15 CLOSED, 1 KNOWN-UNKNOWN). Design revised for DC-1..DC-16 (two departures from the critic, stated in the docs). Re-checks: brief FIX (RC-1..RC-4, S4); critic 2 FIX (GS-1 S3: the fresh-token guard can refresh on every read without a hold or a clear; GS-2..GS-11 S4). Final pass launched; it ends Stage 3, since severity fell from S2 to S3/S4 and further rounds would only polish text the build reviews will read again.
- 2026-10-13: final pass (workflow `github-sign-in-final-pass`, run `wf_dc08841d-4fe`, 4 agents, `reports/final-pass-workflow.json`): brief RC-1..RC-4 fixed, check ACCEPT (two optional S4 residues); design GS-1..GS-11 fixed (stated departures in the docs), check FIX with three S4 wording items (RF-1..RF-3). The lead applied RF-1..RF-3, the optional 403-text residue (N-2) and the reviser's note that step 7 of `replace` could orphan a committed vault entry by writing `retiredRefs: []` after a failed removal. Both research projects: preflight PASS, handoff 0; `scripts/check-handoff.mjs` exit 0. Mandate presented (MANDATE.md).
- 2026-10-13: Mandate reply, verbatim: "GO MERGE, read-only, private text like local files". Recorded in MANDATE.md and USER-DECISIONS.md; the spec status is now approved; the plan got the read-only correction notes (the GitHub bullet and step 1 of "GitHub, approved as four steps").
- 2026-10-13: Stage 5 started on `build/github-sign-in` from `6ac1007`. U0 by the lead (`8f86232`): red first, 39 of 39 then green, 8 guard proofs. Briefs written before any launch (`briefs/common.md`, `u1`..`u8-builder.md`, `unit-reviewer.md`).
- 2026-10-13: wave 1 launched (workflow `github-sign-in-wave1`, run `wf_00db7666-c91`): U1-U4 builders in `wt/gsi-u1`..`gsi-u4` from `cabca2f`, each followed by a refute-first unit review and up to two fix rounds with fresh re-reviews (blocking: any S1-S3).
- 2026-10-13: wave 1 returned (`wf_00db7666-c91`, 22 agents). U3 ACCEPT and U4 ACCEPT: integrated onto `build/github-sign-in` (U3 fast-forward; U4 cherry-picked, each `docs/ARCHITECTURE.md` conflict resolved by keeping both units' sentences, one physical line per unit from now on). Integrated checks: typecheck and lint 0; github-read 70, github-text 24, github-account-panel 67, workbench 14, contracts 25, token-literals 2, app-constants 4, all passing. Lead docs commit `f4354ac`: spec 7.4 text aligned with the code (U3-R2), the phrase rule stated per sentence (U3-R3), and "As built" for the wave-1 judgment calls. U1 and U2: third round launched (`wf_f2b3e279-cb5`).
