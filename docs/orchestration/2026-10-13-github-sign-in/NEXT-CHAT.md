# Handoff to new chats (written 2026-10-19 03:45 UTC by the originating session)

Two new chats take over from here. Everything either one needs is in git; nothing lives only in this session's
container or memory. Read this file, then the files it names, then act. The originating session has cancelled every
scheduled trigger it held for SmartRouter (the run 4 reminder, the #109 check-in), so the new chats own them.

## State on disk

| What | Where | State |
|------|-------|-------|
| MoonAliza build branch | `StepenkoAnatoli/MoonAliza` `build/github-sign-in` (this file's commit is its head) | the run ledger `docs/orchestration/2026-10-13-github-sign-in/RUN.md` (read the last three entries), the adapter `docs/orchestration/smartrouter/` (route.mjs, host-policy-6, trace), the run 4 plan and briefs under `docs/orchestration/smartrouter/briefs/` |
| SmartRouter main | `StepenkoAnatoli/SmartRouter` `main` at `ac2a7bb` | #105 (adapter revisions 5-6), #106 (calibration kit), #107 (shared pack), #108 (evidence check + table) all merged 2026-10-19 by the lead on the reviewer's approval; gate green on main (`python3 tools/run_regression.py`) |
| SmartRouter open PR | #109 `hosts/claude-code-refresh-6` at `c76ccb7` (the operator's main merge on top of 1a26f46) | the adapter refresh with the sr-kit/sr-pack/sr-evidence traces, the 1492000 headroom and the pinned usage-windows test; draft, waiting on the reviewer; merge when CI is green and the reviewer approves (`merge` method, as every merge in this repo) |
| Usage windows | reading 2026-10-19T03:01:34Z: five_hour 0.05, seven_day 0.80 | **Gate 4 blocks every adapter dispatch until the seven-day reset at 2026-10-24 18:00 UTC** (limit = stop-at 0.90 minus lead-reserve 0.10 = 0.80, reached). The operator may override by saying so; the lead never does |
| Research-Kit | branch `claude/compassionate-lovelace-n9ow86`, untouched, far behind origin/main | nothing pending there |

Machine-local things that do NOT travel (recreate them): the worktrees under `/home/user/task5-handoff/wt/` and the
clones under `/home/user/`; Node 24 at `/versions/node/v24.21.0/bin`; the SmartRouter pre-commit hook (run
`python3 tools/install_hooks.py` or what `tools/README` says after cloning; never unwire it); MoonAliza `node_modules`
(`npm ci`). The adapter's request files for the run 4 units are in the repo (`briefs/requests/`), not in a scratchpad.

## Chat A: SmartRouter run 4 (paste this as the opening message)

> Continue the SmartRouter work from MoonAliza `build/github-sign-in`. Read
> `docs/orchestration/2026-10-13-github-sign-in/NEXT-CHAT.md` first, then RUN.md's last three entries, then
> `docs/orchestration/smartrouter/briefs/run4-plan.md` and the four briefs it names. Rules: every unit goes through
> the adapter (`docs/orchestration/smartrouter/route.mjs decide | dispatch | outcome`, with a usage reading under 30
> minutes old from `list_events kinds=["rate_limit_event"]` pasted with `route.mjs usage`); nothing is dispatched while
> Gate 4 blocks (seven_day at 0.80 until the reset on 2026-10-24 18:00 UTC) unless I override; stop and save at 0.90,
> no new launch past 0.85. First: check SmartRouter #109 (merge it when CI is green and the reviewer approves; it is
> the adapter mirror and the policy binding's next refresh). At the reset: fresh reading, `decide` and `dispatch`
> `sr-pack-4a` and `sr-kit-cases` from `briefs/requests/` (fill `now` and `deadline`), worktrees from SmartRouter
> `main`; then `sr-policy-7` and `sr-packs-t1`; then freeze and launch stage 4a per the plan. Write less text; report
> at the end of each phase; merge as you decide, carefully; do not lower quality.

What the plan decides (R4-1..R4-9, in `run4-plan.md`): stage 4a subject X2-1 (base `16f637f`, accepted `01a8604`,
T3); 12 fix@T3 cells, 4.8M-9.6M tokens, mechanical grading; the T1 host-pack cells for build-core, build-tests,
research-collect and docs-mechanical need the kit to carry a category per task object, mutants on a pin case and a
gate-graded case kind (`sr-kit-cases`) and the adapter to read them (`sr-policy-7`); order after the reset; budget
about a quarter of the new week. Follow-ups recorded from the reviewer: the four dropped entries stay dropped; R-2 is
a post-run-4 kit hardening item.

Conventions the new chat keeps: commit identity `-c user.name=StepenkoAnatoli -c
user.email=318295322+StepenkoAnatoli@users.noreply.github.com`, trailers `Co-Authored-By: <the model writing the
commit> <noreply@anthropic.com>` and `Claude-Session: <the session URL>`; five-part commit reports (short form for
docs); one commit per task; red-first tests with guard-removal proofs; SmartRouter PR template (Problem and resulting
behavior / Related issue / Validation / Remaining limits or risks); draft PRs, subscribe, safety-net check-ins (50
minutes, then 4 hours, three quiet then stop); adapter acceptance checks must name the category's verification items
verbatim or Gate 3 blocks; every request declares `difficultyTier`; the ledger is append-only and secret-free.

## Chat B: MoonAliza items 4 and 5 (paste this as the opening message)

> Continue MoonAliza from `build/github-sign-in`. Read `docs/orchestration/2026-10-13-github-sign-in/NEXT-CHAT.md`
> first, then RUN.md (the resume points and the last entries). Two items, in order. (4) A fix unit for calibration
> run 3's clusters C-1..C-3: the wire module `src/main/github-oauth.ts`'s body phase (read and cancel) never observes
> the timeout signal, so a stalled stream or a never-settling cancel hangs the call past `requestTimeoutMs`
> (`docs/orchestration/smartrouter/trace/calibration-3/clusters.md` and `lead-notes.md`; real on all three prongs).
> Write its brief as `briefs/fix-c1-c3.md` on the pattern of `briefs/fix-x2-1.md` (the lead's design decision with
> rejected alternatives, red-first tests with guard proofs, pre-mortem), declare it T2 (edit set: the module, its
> test file, the map), and dispatch it through the adapter to cc-opus-high when Gate 4 admits it (blocked until
> 2026-10-24 18:00 UTC unless I override). Its accepted fix is also the subject planned for calibration run 4 stage 4b
> (review@T3), so keep the base and accepted revisions recorded in RUN.md. (5) U5 extras re-verification
> (`reports/u5-extras-themes.md`), the integration review (the four reviewers), the draft PR for `build/github-sign-in`,
> then auto-build Stages 6 to 9. Lead-only work (the brief, the PR text, the ledger) proceeds now; delegated work waits
> for the reset. Write less text; report at the end of each phase; do not lower quality.

## Standing constraints (both chats, verbatim)

Keys are only used by reading them inline or in scripts: never print, copy or write them to a repo, never put them in
sub-agent prompts; never run `firecrawl env` inside a repo. Never use `--no-verify` or `GATE_OFF`; never unwire
SmartRouter's pre-commit hook. Never pass `--fallback` on your own initiative. Remind the operator to rotate keys (the
Firecrawl key was in a conversation record; the uploads directory held key files; SmartRouter's notes mention a GitHub
token); ask before shredding key files. No model identifiers in commits or PRs beyond the trailers. Never commit
key-shaped test values (`sk-...`, `gh[pousr]_`, `github_pat_`), never copy example tokens from research captures,
never write `client` + `_secret` in `src/`. Do not act for sub-agents on permission-denied actions. Do not record the
"Finish and stop" instruction in the run ledger. The SmartRouter ledger holds no keys, prompts or bodies. Do not read
repositories outside the session's GitHub scope. Do not work around the classifier's self-modification denial (the
operator installs Ballast). The lead declares a tier on every request and never passes Gate 4 by hand.
