# Independent operation: the user's decisions

Track: an in-app agent orchestrator (Moonzila/Selenic as director) and SmartRouter's integration
(plan: `docs/superpowers/plans/2026-10-02-research-jobs.md`, Self-unblocking section; discovery:
`reports/discovery-1.md`).

| Date | Question | Answer (user's own choice) | What it supersedes or widens |
|------|----------|----------------------------|------------------------------|
| 2026-10-12 | When does this track start? | After More models Phase 2 and the rename; before More models Phases 3-5 | The order of 2026-10-05 (More models first) |
| 2026-10-12 | Who decides which model each orchestrator agent uses? | Moonzila's deterministic code with SmartRouter's five gates ported into it; no model chooses models | Widens More models MANDATE decision 3 from "four rules on a later display" to "the routing policy of every orchestrator agent"; keeps its rule that selection authority is the deterministic selector |
| 2026-10-12 | May a run work without per-action approval once its scope, budget and stop-list are approved? | Yes, staged: first self-unblocking (one agent, serial, writes on its own branch, ending in a pull request the app never merges); parallel writers only after isolation is qualified. Stop-list: merging or force-push, spending past budget, deleting data, credentials, private code in public research queries, invariant changes | For runs under such an authorization: per-edit and per-command approval (AGENTS.md invariants; `src/engine/operations.ts`), "every write to GitHub needs the user's approval" (plan, GitHub step 4), background tasks "never bypass the existing exact command approval" (plan, background tasks), and user acceptance of project-memory records before they reach a model (`docs/specification/project-memory.md`). The design must say for each how the standing authorization replaces it and which engine code enforces the stop-list |
| 2026-10-12 | Reuse OrchestratorInc/agent-orchestrator? | Take its runtime ideas, not its engine ("do as recommended"); the method is the repository's lead-orchestrator skill | Nothing superseded; recorded in the plan's Self-unblocking section (design basis) |

Open, asked at the design: the cash budget per mission and per task; what "SmartRouter finished" means
(the discovery's section 4 is the proposal); the place of the coding knowledge-base phase.
