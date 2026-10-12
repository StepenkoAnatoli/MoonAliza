# Brief - OrchestratorInc agent-orchestrator: architecture, licence

_Auto-drafted 2026-10-12 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require the reviewing agent's judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

On 2026-10-12 the user asked how Moonzila should get an in-app agent orchestrator (a planner,
parallel worker agents in isolated copies, independent reviewers, resumable progress, budgets
and a stop-list), with Moonzila as the main orchestrator and director, and named
github.com/OrchestratorInc/agent-orchestrator as a possible source alongside the project's own
`lead-orchestrator` skill. Moonzila is an Electron/TypeScript desktop app whose acceptance
platform is Windows. This corpus answers one question for whoever designs that orchestrator:
what agent-orchestrator is, read from its own pages - its purpose, how it plans, runs workers,
isolates them, reviews, keeps state and resumes, its runtime and language, whether it runs on
Windows, how agents and models are plugged in, how mature it is, and exactly what its licence
permits and requires if Moonzila reuses its code (closed or open) or only its ideas. Done means
a designer can say, from cited pages, which parts are reusable as code (and on what terms),
which are reusable as ideas only, and which do not fit Moonzila. It does not design Moonzila's
orchestrator and it does not decide the More models MANDATE question about routing authority.

## What we verified

| Claim | Source | Type |
|---|---|---|
| The repository exists and is public (HTTP 200, retrieved 2026-10-12), on branch main with 3,243 commits (line 48) and 437 tags (line 18), a last commit dated Oct 12, 2026 (line 42), 13.1k stars (line 319) and 1.8k forks (line 327). Its About line: [quote: Run and supervise teams of coding agents from planning to merge.] Purpose: [quote: Orchestrator.inc is a local desktop workspace built for that job.] Planner: [quote: The project orchestrator is Orchestrator.inc's persistent planning and coordination agent.] and [quote: The orchestrator owns planning and delegation; workers own implementation, tests, commits, and pull requests.] Workers and isolation: [quote: A worker is Orchestrator.inc's unit of execution: one task, one coding agent, and one isolated workspace.] and [quote: For Git-backed work, Orchestrator.inc gives the worker its own branch and worktree.] Review: [quote: Keep CI, mergeability, reviewer state, and interactive agent reviews beside the worker, then return requested changes to the same owner.] Licence label: [quote: Orchestrator.inc is available under the Apache License 2.0.] The root listing (lines 58-91) shows LICENSE and no NOTICE file, and also folders named cloud, contracts/cloud, private and pricing/catalog/v1, and both go.work and package.json (a Go plus Node repository). Telemetry: [quote: Orchestrator.inc collects limited usage and reliability telemetry to improve the product.] Model choice is AO's, per session: [quote: create a worker session with the coding agent, model, and interface that fit the task] and [quote: Describe the outcome, choose an agent and model, attach relevant files]. Commit text, not documentation (latest-commit messages shown in the root listing): line 62 says Command Code's ACP session maps [quote: AO's whole permission vocabulary and its model/effort picker map without a hardcoded catalog] and records [quote: the provider-owned model/effort catalog]. Line 60 (the feat(cloud) commit of PR #6478, Cloud-only; its code is under `cloud/`, not read) describes an enforced Cloud budget: [quote: Stripe billing with plan slots, usage limits and resets], [quote: one reserved orchestrator slot, the remaining slots for workers (including sessions an orchestrator spawns)], [quote: usage under the rolling window and the weekly limit], [quote: Usage is a ledger of running session-minutes, sampled each minute], [quote: Waking a paused session (terminal ticket, resume) is refused when over the plan], [quote: an enforcer pauses running sessions of over-limit organizations between turns, never mid-turn], and [quote: Billing is off unless AO_CLOUD_STRIPE_SECRET_KEY is set, so local and self-hosted control planes behave as before.] | E-01 `github.com` (U-01, U-02, U-04, U-05, U-06) | P |
| The status file (retrieved 2026-10-12) scopes what ships: [quote: Current main ships a working single-user local loop] and [quote: The core GitHub flow works end-to-end]. Build gate: [quote: The local gate is the backend Go build and race-enabled test suite]; front end: [quote: Electron + React 19 + TanStack Router/Query + Tailwind + shadcn primitives.] Agents are not bundled: [quote: AO reuses each harness's existing binary/auth/environment resolution and does not bundle provider CLIs]. Review: a list of interactive reviewer adapters (lines 101-106) and [quote: Experimental reviewer selection must be explicit; native modes and prompts are not OS or network isolation.]; automatic review: [quote: Project autoReview defaults copied into sessions, with per-session controls and idle/eligible-head gating.] Feedback loop: [quote: feeding PR facts into lifecycle, which sends agent nudges for CI failures, review feedback, and merge conflicts]. Resume: [quote: Desktop close, full quit, and updater daemon replacement detach and reconnect without relaunching the provider or interrupting an in-flight turn]. Usage on the local desktop is displayed; this file describes no cap: Codex account management [quote: shows structured authentication, capacity, usage, and confirmed reset-credit facts]. Model choice sits in AO's own controls: Native Chat includes [quote: changed files, approvals, structured input, model/effort/provider controls] and the MiMo Code harness ships with [quote: model selection, native-session restore, workspace activity hooks]. Windows: [quote: a ConPTY loopback host on Windows]. Cloud is gated: [quote: Cloud availability: public client and desktop integration exist, but usage is gated by build configuration, account entitlement, and a reachable control plane.] Issue links on lines 123-125 and 296-301 point at an earlier owner, Untrivial-ai/agent-orchestrator. | E-04 `raw.githubusercontent.com` (U-01, U-02, U-03, U-04) | P |
| The architecture document (retrieved 2026-10-12) states the runtime: [quote: Agent Orchestrator is a long-running Go daemon that supervises multiple parallel AI coding-agent sessions.] Isolation: [quote: Project sessions own isolated Git worktrees.] The front end is an Electron + React UI talking REST/SSE to a daemon on 127.0.0.1 (lines 92-170). Design principles: ports and adapters [quote: Core code never depends on concrete implementations.]; derived status [quote: Display status is never stored. It is computed at read time from durable facts.]; state in SQLite with trigger-fed change data capture [quote: DB triggers write to change_log, and the poller fans out changes.] and a watermark the poller resumes from (lines 653-671). Resume across restarts: [quote: Codex and all ACP Chat processes run in detached per-session hosts, so replacing the daemon or desktop app does not stop an in-flight turn.] Conservative termination: [quote: A session is only terminated when the runtime and process are both clearly dead and recent activity doesn't contradict that.] and [quote: Never force-delete dirty worktrees: User data safety comes before cleanup convenience.] An SCM observer polls every 30 s and a runtime reaper every 5 s (lines 840-899); CI failures, PR comments and merge conflicts are routed back to the owning session (lines 539-571). Windows runs terminals on ConPTY (line 16, lines 1075-1087). State location: [quote: Keep all app state under ~/.ao: Do not use OS-default app-data locations.] No section describes a spending budget or a command stop-list. | E-03 `raw.githubusercontent.com` (U-02, U-03) | P |
| The project configuration page (retrieved 2026-10-12) shows AO keeps model and effort defaults in its own project settings: `agentConfig` is [quote: Default model, permission, and effort settings.] Roles are configured separately: [quote: Choose each role's harness and provider settings independently], with `worker` and `orchestrator` each taking an `agent` and an `agentConfig` model (lines 79-90). Model names come from the agent, not from AO: [quote: Use the model names provided by the installed agent.] and [quote: project settings do not store provider tokens]. Reviewers default to the worker's model: [quote: Orchestrator reviews with the project's default worker agent, using that worker's model and effort] and [quote: Worker permissions never carry over to a reviewer.] No field routes tasks to models automatically; the fields table (lines 44-63) lists canonicalRepoURL, autoReview, workersRequestReview, defaultBranch, sessionPrefix, env, symlinks, postCreate, preRemove, agentConfig, worker, orchestrator, agentRules, agentRulesFile, orchestratorRules, reviewers, trackerIntake and containerReap. Time limits are the only budgets on the page: [quote: Each step has its own 10-minute limit.] and [quote: New Chat sessions have a 10-minute total start budget, including workspace creation, setup, and agent start.] Isolation follows the project kind: [quote: Git projects use worktrees.] and [quote: Scratch projects use Orchestrator-managed plain directories.] Review does not merge: [quote: Automatic review waits for an eligible PR head and an idle worker. It does not merge the pull request.] Worktree safety: [quote: Orchestrator does not force-delete a dirty registered worktree.] | E-09 `docs.orchestrator.inc` (U-02, U-04) | P |
| The agent adapters page (retrieved 2026-10-12) shows agents are plugged in as external CLIs the user already installed: [quote: Orchestrator uses the agent CLI and authentication you already installed for external harnesses.] and [quote: It does not bundle external provider credentials or install external adapters from npm.] Its table (lines 29-65) lists 35 harnesses with Terminal UI, Chat and Reviewer columns, e.g. claude-code and codex Yes on all three, gemini Terminal UI only; [quote: a registered adapter is not proof that it is ready on your machine]. Chat uses each agent's own protocol, mostly ACP (lines 90-105). Effort is an AO project setting, not only a harness flag: [quote: Use Project Settings in the desktop app or the daemon API to preserve or change effort.] The default worker harness is a project setting too: [quote: To make Codex the default worker, use]. This page does not say how a model is chosen; E-09 does. Review is not sandboxed: [quote: Experimental reviewer modes and prompts do not sandbox tools or network access.] Platform limits: [quote: Unreal Agent is built into Orchestrator for macOS and Linux and is Chat-only.] and for fx [quote: on Windows use WSL]. | E-06 `docs.orchestrator.inc` (U-02, U-03, U-04) | P |
| The platforms page (retrieved 2026-10-12) lists Windows as supported: [quote: Orchestrator has a desktop app for macOS, Windows, and Linux.] and [quote: Windows supports the desktop workflow, structured Chat, and native Terminal UI through Orchestrator's conpty host.] [quote: It does not require tmux, and iTerm2-specific helpers do not apply.] Agent availability differs: [quote: Available agents vary by platform.] Network scope: [quote: The primary desktop listener is fixed to 127.0.0.1 and has no authentication.] and [quote: Orchestrator does not turn the local desktop product into a hosted multi-user service.] | E-08 `docs.orchestrator.inc` (U-03) | P |
| The releases page (retrieved 2026-10-12) marks v0.13.7 as Latest (line 124), signed [quote: on Oct 10, 2026, 04:47 AM], with v0.13.6 on Oct 9, 2026 and a newer pre-release v0.13.8-nightly.202610110939 on Oct 11, 2026 (lines 26 and 83); the first page lists ten tags from v0.13.6-nightly.202610091332 to v0.13.8-nightly.202610110939 inside three days (lines 26-35). Versions are 0.x, so pre-1.0. v0.13.7 notes include [quote: Add Command Code TUI support with hooks, restore and --effort] and its assets include agent-orchestrator-win32-x64.exe (line 275) beside macOS dmg/zip and Linux AppImage, deb and rpm (lines 205-309). [render-reviewed: the failure notices are GitHub's lazy-loaded tag-compare menus and contributor lists; the release list (lines 26-35), the v0.13.7 heading, Latest marker, signing date, Added/Changed/Fixed notes and asset list (lines 122-309), and the v0.13.6 and nightly dates cited here are all present] | E-05 `github.com` (U-05) | P |
| The installation guide (retrieved 2026-10-12) offers a Windows x64 installer (line 20) and says [quote: The desktop app is the canonical install path.] The npm package is retired: [quote: @aoagents/ao is frozen at 0.10.0 and is no longer recommended.] Prerequisites are Git, the GitHub CLI, an external coding agent and, on macOS, tmux (lines 46-51). Isolation: [quote: Each worker session gets its own isolated worktree.] State: [quote: All Orchestrator application state lives under ~/.ao by default]. | E-07 `docs.orchestrator.inc` (U-05) | P |
| The LICENSE file (retrieved 2026-10-12) is the unmodified Apache License 2.0 text [quote: Version 2.0, January 2004] with the appendix boilerplate filled in as [quote: Copyright 2026 Untrivial]. Section 2 grants a [quote: perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work]. Section 4 sets the conditions of redistribution: [quote: You must give any other recipients of the Work or Derivative Works a copy of this License], [quote: You must cause any modified files to carry prominent notices stating that You changed the files], [quote: You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work], and a NOTICE file's attribution notices must travel with a derivative if the Work includes one. A closed product is allowed: [quote: may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole]. Section 3 grants a patent licence that ends for a party that sues: [quote: If You institute patent litigation against any entity]. Section 6 withholds a trademark grant but allows naming the origin: [quote: This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.] The section does not mention a logo, and the Licensor named in the file is Untrivial; nothing in this capture says whose mark "Orchestrator.inc" is. | E-02 `raw.githubusercontent.com` (U-06) | P |

## Contradictions and how they were resolved

1. **Who owns it.** The repository is OrchestratorInc/agent-orchestrator (E-01), the LICENSE
   copyright line reads "Copyright 2026 Untrivial" (E-02), STATUS.md's issue links point at
   Untrivial-ai/agent-orchestrator (E-04), and the Homebrew cask lives in an `agentwrapper` tap
   (E-07). Read as one project that has changed owner name; the LICENSE is trusted for who holds
   copyright, because it is the legal instrument and the others are links. The corpus does not
   establish whose trademark "Orchestrator.inc" is.
2. **Cloud.** The About line says "Desktop, web, mobile, and cloud agents" (E-01); STATUS.md says
   Cloud usage is gated by build configuration, account entitlement and a reachable control plane
   (E-04), and the Platforms page says the local product is not a hosted multi-user service (E-08).
   Trusted: STATUS.md and Platforms. Cloud is a gated, separately operated mode; nothing in this
   brief assumes it.
3. **How many agents.** The About line says "+25 more" beyond Claude Code and Codex, the README grid
   shows 34 names, architecture.md says "23+ agent harnesses", and the adapter docs table lists 35
   (E-01, E-03, E-06). Snapshots of a list that grows every week; the docs table is trusted as the
   current registry, with its own caveat that registered does not mean ready.
4. **tmux.** architecture.md keeps tmux as a legacy or fallback runtime (E-03); the Platforms page
   says Windows does not require tmux (E-08). Not a conflict: the fallback is a macOS/Linux path,
   and Windows uses ConPTY on both pages.
5. **Budgets: none in the docs, enforced in Cloud.** architecture.md and STATUS.md describe no cap,
   and STATUS.md shows Codex usage as displayed facts (E-03, E-04). The repository page's commit
   text for PR #6478 describes enforced Cloud plan limits (E-01, line 60). Not a conflict: the docs
   describe the local desktop, the commit describes the Cloud control plane, and that commit says
   billing is off unless a Stripe key is set, so local and self-hosted control planes are uncapped.
   Weight: the docs are trusted for the local product. The Cloud rules are taken as described in
   commit text. That text is the owner's own, but it records one change on one date, not current
   documentation, and its code (`cloud/`) was not read (K-2).
6. **Who picks the model.** The adapter page says AO uses the agent CLI and sign-in you installed
   (E-06), which an earlier reading of this corpus took to mean the harness chooses the model.
   The README, STATUS.md and the project configuration page show AO's own picker and defaults:
   "choose an agent and model" per task, model/effort/provider controls in Chat, and `agentConfig`
   as the project's default model, permission and effort, set per role (E-01, E-04, E-09). Trusted:
   E-09, the page that owns the configuration fields. The harness supplies the model names and the
   sign-in; AO stores the choice.

## Known unknowns

No blocking unknown is open. Four residual facts were not collected (15-credit budget, 13 spent);
none changes the recommendation below, and each has a day-one step:

- **K-1 - terms of the cloud, contracts/cloud, private and pricing/catalog/v1 folders.** The root
  LICENSE is Apache-2.0 (E-02), but these folders were listed, not read (E-01). Day one, before
  copying any file from them: open each folder on GitHub, look for its own LICENSE or per-file
  header, and copy nothing from it until that is checked.
- **K-2 - budget enforcement and a stop-list in code.** The Cloud budget is known only from commit
  text (E-01, line 60); the local pages describe no cap and no command stop-list (E-03, E-04, E-09).
  Day one, only if Moonzila wants AO's exact rules: search `cloud/` (the Cloud control plane:
  the Stripe plan limits, the session-minute usage ledger, the wake refusal and the between-turns
  pause enforcer) and `backend/internal/` (any local limit or deny logic) for `billing`, `plan`,
  `usage`, `limit`, `enforce` and `deny`. Settle K-1 for `cloud/` before reading it as a source of
  code. Moonzila designs its own caps either way.
- **K-3 - how the orchestrator agent actually spawns workers, and whether it sets their model.**
  The README describes the behaviour (E-01), STATUS.md says orchestrator routes are wired (E-04), and
  the configuration page sets each role's harness and model as project settings (E-09). Not read:
  the delegation mechanism (CLI calls from the orchestrator's agent, or a daemon tool) and whether
  the orchestrator agent can pass a harness or model when it spawns a worker. Day one: read
  `ao spawn --help`, `backend/internal/session_manager/`, and the docs page `guides/per-role-agents/`
  (linked from E-09).
- **K-4 - third-party licences inside its packages.** STATUS.md says it packages a checksum-pinned
  Vercel `agent-browser` binary and its macOS/Linux packages include tmux (E-04, E-08). Only
  relevant if Moonzila redistributes those components; check their own licences then.

## Decision

**Take the ideas, not the code, for Moonzila's first orchestrator.** The licence would allow the
code; the fit does not.

**The licence permits code reuse in a closed or an open app** (E-02, Apache-2.0). If Moonzila ever
ships copied or adapted code from it, the distribution must: include a copy of the Apache 2.0
licence; keep the copyright, patent, trademark and attribution notices of every copied source
file ("Copyright 2026 Untrivial"); put a prominent "changed" notice in every modified file; and
carry a NOTICE file's attribution if one is added upstream (none at the root on 2026-10-12, E-01).
Moonzila may put its own licence on its own code and on the combined work (section 4). The patent
licence ends for whoever sues over the work (section 3). **Section 6 grants no trademark rights**:
"This License does not grant permission to use the trade names, trademarks, service marks, or
product names of the Licensor, except as required for reasonable and customary use in describing
the origin of the Work and reproducing the content of the NOTICE file." So Moonzila may name the
origin of copied code (customary use, and in the NOTICE text), but must not brand or market with
the Licensor's names or marks without separate permission. The Licensor named in the file is
Untrivial; the licence says nothing about a logo.

**Why the code does not fit.** Its engine is a Go daemon (E-03) and Moonzila is TypeScript in
Electron, so reuse means shipping a second runtime as a sidecar. That daemon listens on loopback
with no authentication (E-08) and keeps state under `~/.ao` rather than the OS app-data folder
(E-03, E-07), and its reviewers run without OS or network isolation (E-04, E-06). All three cut
against Moonzila's approval-gated, journal-before-effect design. It supervises **external agent
CLIs** with their own sign-ins (E-06). It is pre-1.0 and ships several builds a day (E-05), so a
vendored copy would drift within weeks.

**Model choice, and where Moonzila's selector sits.** AO keeps its own model and effort picker per
session ("choose an agent and model" when creating a task, model/effort/provider controls in Chat)
and project defaults per role. `agentConfig` holds the default model, permission and effort, and
the worker and orchestrator roles each take their own harness and model. An unconfigured reviewer
reuses the default worker's model and effort. The model names come from each installed harness's
own catalog (E-01, E-04, E-06, E-09). None of the captured pages describes automatic routing of
tasks to models. That AO has no router is an inference from this silence, not a stated fact. AO's
precedent is that the user or the project default picks the model for each role and session. That
is the slot where Moonzila's deterministic selector would sit: it would supply the per-role and
per-session choice that AO takes from a person or a project setting. Whether that selector, or a
SmartRouter, makes routing decisions is Moonzila's own call. MANDATE decision 3 stays Moonzila's
decision either way, and nothing in this corpus decides it.

**Ideas that fit, mapped to the user's six needs:**

| Need | Idea from agent-orchestrator | Evidence |
|---|---|---|
| Planner | A persistent project orchestrator owns planning and delegation; workers own implementation, tests, commits and PRs. Separate standing rules for orchestrator and workers (`orchestratorRules`, `agentRules`), and per-role model settings. Moonzila is that orchestrator. | E-01, E-09 |
| Parallel workers in isolated copies | One task, one agent, one isolated workspace. Isolation follows the project kind: a branch and git worktree per worker, a plain managed directory for non-git work. Deterministic setup steps with a per-step time limit, a failed setup stops the launch, and a dirty worktree is never force-deleted. | E-01, E-03, E-07, E-09 |
| Independent reviewers | A reviewer registry kept separate from the worker registry, explicit reviewer selection, worker permissions never carried to a reviewer, and automatic review that waits for an idle worker and never merges. CI failures, review comments and merge conflicts go back to the worker that owns the change. | E-03, E-04, E-06, E-09 |
| Resumable progress | Store only durable facts in SQLite and derive every displayed status at read time. A trigger-fed change_log with a resume watermark. Agent turns run in detached per-session hosts, so an app restart does not kill a turn. A failed probe is not proof of death. Resume and restore are separate actions. | E-03, E-04, E-09 |
| Budgets | Local desktop: no spending cap is described, Codex usage is only displayed (E-04), and the only local limits are on time: 10 minutes per setup step and a 10-minute total start budget for a new Chat session (E-09). Cloud control plane (commit text, E-01 line 60): plan slots, with one reserved orchestrator slot and the rest for workers, including the sessions an orchestrator spawns; a rolling-window and a weekly session-hour limit counted from a ledger of running session-minutes sampled each minute; a paused session cannot be woken while over the plan; and an enforcer that pauses over-limit sessions **between turns, never mid-turn**. Ideas to take: count usage in an append-only ledger, check the budget both at spawn and at resume, reserve capacity for the director so workers cannot starve it, count the workers the director spawns against the same budget, and stop only at a turn boundary. Moonzila sets its own units (money or tokens per provider) and its own caps. | E-01, E-04, E-09 |
| Stop-list | None described. Reviewer modes and prompts are explicitly not a sandbox, and a `bypass-permissions` worker mode exists that the docs warn about. Moonzila designs this itself, on its existing command broker and guarded process. | E-04, E-06, E-09 |

A live board derived from facts (Working, Needs you, In review, Ready to merge) is a UI idea worth
taking with the derived-status rule (E-01).

**Against the project's own lead-orchestrator skill** (`.claude/skills/lead-orchestrator`, read
2026-10-12, not collected): the skill already supplies the *method* agent-orchestrator does not
document - plan and frozen contracts, separate builder and reviewer roles (spec reviewer, breaker,
mutation and invariant auditors), a run ledger (`RUN.md`) with a Next action and a resume
procedure, model choice per role, at most two retries per failed unit, and user approval before
merging, deleting data or spending past a budget. agent-orchestrator supplies the *runtime*
patterns the skill leaves to its host: process supervision, worktree lifecycle, SCM observation,
derived status, and, in Cloud, enforced budget slots and a between-turns pause. Suggested shape:
Moonzila is the director and runs the skill's method as its policy. It builds on runtime patterns
in the style of agent-orchestrator, takes the budget-enforcement ideas above, and designs the
stop-list in-house.

**Out of scope:** the Go daemon and its HTTP API, the mobile LAN listener and pairing, Cloud and
its Stripe billing as code (its enforcement rules are taken as ideas above), the tmux and ConPTY
terminal multiplexer (needed only if Moonzila hosts external terminal agents), and the 35
external-CLI adapters.

**First build step:** write Moonzila's orchestrator design note. It takes the six rows above as
its requirements and names which come from this brief and which from the lead-orchestrator
skill. It puts two choices to the user before any code: the budget units and caps (using the
ledger, the spawn and resume checks, the reserved director slot and the between-turns stop as the
starting point), and the stop-list, which has no reference here. It names where Moonzila's
deterministic model selector supplies each role's model, without deciding the MANDATE routing
question. Copy no source file from the repository; if a later step wants to, settle K-1 first and
follow the licence terms above.

## Next steps

1. The designer of Moonzila's orchestrator reads this brief and the six-row table above; nothing
   here needs re-research to start the design note.
2. Before any code is copied from the repository: settle K-1 and follow the licence terms in
   Decision.
3. Re-collect in a new project if this brief is used after about 2026-11-11 (30 refresh days):
   the project ships several builds a day, so architecture details may move.

<!-- research-kit:brief-draft body=c99cf765f21e246b inputs=d8e2a2b20aacb9ec gate=pass -->
