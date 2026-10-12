# Discovery Contract - OrchestratorInc agent-orchestrator: architecture, licence

Started 2026-10-12. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

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

## Unknowns

A fact belongs here when guessing it wrong changes the design: API limits and pricing,
auth model, data schemas, rate limits, licensing/ToS, platform behavior, current library
versions, competitor pricing, data availability.

Status is exactly one of:
- `CLOSED` - proven by an `E-##` row in `research/EVIDENCE.md` (which must point at cached raw text).
- `KNOWN-UNKNOWN` - unreachable now; the `Evidence` cell names the day-one verification step.

Anything else (`OPEN`, blank, "in progress") fails the gate.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|
| U-01 | Whether the repository exists and is public, and what the product is for | If it is missing or private nothing can be reused and the question ends here; its purpose decides whether it is an orchestrator at all | CLOSED | E-01 (repository page, P, retrieved 2026-10-12): the repository exists and is public (HTTP 200), with 3,243 commits, 13.1k stars and a commit on 2026-10-12. It is a local desktop workspace that plans, runs and supervises teams of external coding agents from task to merged pull request. E-04 adds that a paid Cloud mode exists but is gated by account entitlement; the local product is the open repository. |
| U-02 | Its architecture: how planning, workers, isolation (worktrees or copies), review, state and resume are built, and whether it has budgets or a stop-list | Decides which of Moonzila's orchestrator needs it already answers, and which ideas transfer | CLOSED | E-01, E-03, E-04, E-09 (README, architecture.md, STATUS.md, project configuration page, P, retrieved 2026-10-12). Planner: a persistent project orchestrator agent that breaks a plan into tasks and spawns or redirects workers. Workers: one task, one coding agent, one isolated workspace - a git branch and worktree per project session, an AO-managed plain directory for a standalone worker. Review: interactive reviewer adapters, project autoReview, and an SCM observer that sends CI failures, review comments and merge conflicts back to the owning worker; reviewers are not sandboxed. State and resume: a Go daemon persists minimal facts in SQLite, derives display status at read time, fans out changes through trigger-fed CDC, and keeps Chat agents in detached per-session hosts so a daemon or app restart does not stop a turn. Budgets: the local desktop pages (architecture.md, STATUS.md) describe no cap - Codex capacity and usage are displayed (E-04) - and the local product only time-limits setup (a 10-minute limit per setup step, a 10-minute total start budget for a new Chat session, E-09). The Cloud control plane does enforce a budget, known here only from commit text on the repository page (E-01, line 60, the feat(cloud) commit of PR #6478; its code is under `cloud/`, which was not read): plan slots with one reserved orchestrator slot and the rest for workers, including sessions an orchestrator spawns; a rolling-window and a weekly session-hour limit counted from a ledger of running session-minutes sampled each minute; waking a paused session is refused when over the plan; and an enforcer pauses over-limit sessions between turns, never mid-turn. Billing is off unless a Stripe key is configured, so local and self-hosted control planes are not capped. Stop-list: none of the captured pages describes a command stop-list; reviewer modes and prompts are explicitly not a sandbox (E-04, E-06). |
| U-03 | Its runtime and language, and whether it runs on Windows | A component that cannot run on Windows, or is written in a language Moonzila does not ship, cannot be reused as code | CLOSED | E-03, E-04, E-08 (architecture.md, STATUS.md, Platforms page, P, retrieved 2026-10-12): a Go daemon with an Electron + React 19 front end. Windows is a supported platform with a Windows x64 installer and native Terminal UI on a ConPTY host, no tmux needed; some agents are not available on Windows (Unreal Agent is macOS/Linux only, fx needs WSL, E-06). |
| U-04 | How agents and models are plugged in | Decides whether Moonzila's own model selector and providers could drive it, or whether it only supervises external agent CLIs | CLOSED | E-06, E-09 (agent adapters page and project configuration page, P, retrieved 2026-10-12), E-04 and E-01: agents are external CLIs the user installed and signed in to, driven through compiled-in Go adapters (35 harnesses listed) either as a terminal UI or as structured Chat over each agent's own protocol (mostly ACP); Orchestrator bundles no provider credentials and no provider CLIs. AO itself picks the model and effort: the New task flow has the user choose an agent and model per session (E-01), Chat has model/effort/provider controls (E-04), and Project Settings hold defaults - `agentConfig` is the project's default model, permission and effort, and the worker and orchestrator roles each take their own harness and model (E-09); effort is changed in Project Settings or the daemon API (E-06). The model names come from each installed agent's own catalog (E-09; commit text on E-01 line 62 calls it a provider-owned model/effort catalog). An unconfigured reviewer reuses the project's default worker agent with that worker's model and effort (E-09). None of the captured pages describes automatic routing of tasks to models; that AO has no router is an inference from that silence, not a stated fact. AO's precedent: the user or the project default picks the model per role and per session. |
| U-05 | Its maturity: current release, release cadence and activity | A stale or pre-release project is a weaker base for code reuse and a moving target for borrowed ideas | CLOSED | E-05 (releases page, P, retrieved 2026-10-12), E-01, E-07: latest release v0.13.7 (2026-10-10), pre-1.0, with releases and nightly pre-releases several times a day (ten tags in three days) and a commit the day of retrieval; the npm CLI @aoagents/ao is frozen at 0.10.0 and the desktop app is the install path. |
| U-06 | Its licence and what it requires of an app that reuses its code | Decides whether code may be reused at all, in a closed or an open app, and what notices and conditions come with it | CLOSED | E-02 (LICENSE, P, retrieved 2026-10-12) and E-01: Apache License 2.0, Copyright 2026 Untrivial. Code may be reused in a closed or an open app; a distributed derivative must carry a copy of the licence, prominent notices in modified files, and the retained copyright and attribution notices; a NOTICE file would have to travel too, and the root listing shows none. Section 6 grants no trademark rights - "This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file." Moonzila may name the origin of copied code (customary use, and in the NOTICE text), but must not brand or market with the Licensor's names or marks without separate permission. The Licensor named in the file is Untrivial; the licence does not mention a logo, and the corpus does not establish whose mark "Orchestrator.inc" is. Residual: whether the cloud, contracts/cloud and private folders carry other terms is not established (see the brief's known unknowns). |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

None. The user named the repository and the question; every unknown above is a public fact.

## Already decided

Locked decisions for this project. Do not revisit these without the human.

- Moonzila keeps its own deterministic model selector in charge (More models MANDATE decision 3)
  unless the user decides otherwise; this corpus reports how agent-orchestrator chooses models
  and does not change that decision.
- Budget: at most 15 Firecrawl credits for this project, decompose included; no `--fallback`.
