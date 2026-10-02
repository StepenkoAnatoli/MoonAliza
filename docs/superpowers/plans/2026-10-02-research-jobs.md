# Research jobs and review implementation plan

**Status:** in progress. The user said "start" on October 2; Task 1 follows the D2 and D3 recommendations. D1 and D4 are not needed until Tasks 3 and 4. This is Stage 2 of the [integration review](../../specification/research-kit-integration-review.md), building on the [offline consumer](../../specification/research-kit-offline.md). Decisions D1–D4 below need the user's answer before Task 1 begins.

**Goal:** a project can start a Research Kit collection, follow it durably through restarts, read its evidence and brief, have the corpus reviewed, and end with a verified package whose readiness MoonAliza can show. Ordinary chat and existing projects behave exactly as today when research is off.

**Out of scope here:** Build admission that depends on research (Stage 3), bundled kit provisioning and release qualification (Stage 4), private-repository GitHub reading, and live text display.

## Current state, inspected on `main` at `b439ac4`

- `src/adapters/research-kit` validates real pinned packages through an owned, bounded process and retains verified bytes. Nothing in `src/engine`, `src/main` or the renderer calls it yet.
- Schema v2 already has a `research` table (`id`, `project_id`, nullable `run_id`, `status`, JSON `state`) and store methods `putResearch/getResearch/listResearch`. Project policy already carries `research: 'off' | 'public-technical' | 'private-connected'`, and `assertToolPolicy` refuses research tools when it is `off`.
- `src/shared/params.ts` declares `research.provision/start/read/cancel/review/purge`, and `src/shared/events.ts` declares `research.status`. These come from the original source plan, are only listed by `tests/contracts.test.ts`, and have no handler. Three of them conflict with the later integration review and must be revised, not implemented as declared:
  - `research.provision` accepts `provisioningSecret` and `runtimeSecret` as renderer strings. Credentials must enter through main-owned secret handling, never as general IPC payload.
  - `research.review` records a user `sufficient/insufficient` decision. Readiness is the kit's `APPROVED_BRIEF` with `buildAuthorized: true`, produced by its own gate. A MoonAliza-side switch is the "mutable Authorize" control the review rejects (correction 8).
  - `research.start` takes a free-text `brief`. The collector takes a topic, queries, known URLs and preferred domains, all of which become readable by anyone who can read the collector repository.

## Research Kit facts this plan depends on

Read directly from Research-Kit `main` at `fcde0e6` on October 2.

- `artifact-validator.mjs`, `artifact.mjs` and `artifact-manifest.schema.json` are byte-identical to the pinned `5588ce3`. The offline consumer's fixtures stay valid.
- `bin/collect-remote.mjs` (present at the pin) dispatches `collect.yml` on GitHub Actions, prints the run id before waiting, downloads and validates the package. Exit codes: 0 valid, 1 invalid, 2 run failed/incomplete, 3 could not start, 4 still running. `--json` gives a machine-readable result, `--run-id` resumes an existing run, `--no-wait` dispatches only. `--client-ref` is public: it names the run and artifact.
- The token comes only from `RESEARCH_KIT_GITHUB_TOKEN` or `GITHUB_TOKEN`; there is no token flag. It needs one permission, Actions read and write, on the collector repository. Firecrawl and SerpApi keys are repository secrets of the collector, so MoonAliza never holds them.
- Since the pin, collection gained `--run-id` pickup of an already-dispatched run (`bf60e21`) and survives transient polling failures (`49d3b6e`), plus several dispatch error fixes. `--run-id` is absent at the pin, and restart-safe resume depends on it, so Stage 2 must re-pin to a revision that has these changes.
- A freshly collected package is never `buildAuthorized`. Approval comes only from `artifact.mjs create --root <project>` after the kit's gate passes on a reviewed project: map classified, findings rewritten, brief TODOs answered and `Reviewed by: agent` declared.
- Research-Kit still has no LICENSE file, so redistribution rights remain unestablished.

## Decisions for the user

- **D1 Collector repository.** Recommended: a private repository the user owns that carries Research-Kit's `collect.yml` and the Firecrawl/SerpApi secrets. Topics and queries are readable by anyone who can read that repository, so a public collector only suits `public-technical` research.
- **D2 Collector token.** Recommended: a fine-grained token with only Actions read/write on that one repository, entered once through a dedicated main-owned field and stored in the existing encrypted vault. It must never be typed into chat, a model profile or a general IPC payload.
- **D3 Review mechanism.** Recommended: (a) unpack the collected corpus into a private research workspace outside project folders. The agent performs the three review steps there with MoonAliza's existing reviewed edit tools and exact approvals, then the owned process runs the kit's own `preflight.mjs` and `artifact.mjs create`. This needs no Research-Kit change. Alternative (b): first add machine-readable review operations to Research-Kit in a separate PR, as the integration review allows. (b) gives a narrower interface, but the kit would need new design and tests first.
- **D4 Kit pin and licence.** Recommended: re-pin to Research-Kit `fcde0e6` or later with deliberate fixture review, and add a LICENSE to Research-Kit now. Its owner is the same user, so this is a decision rather than research. Without a licence, Stage 4 must keep the kit as a user-provided external installation.

## Constraints

- Research stays optional. `policy.research === 'off'` keeps every current flow unchanged, and folder-free chat never starts research.
- Dispatch is network egress of user text to GitHub. Admit it only for projects whose policy allows it, show exactly which fields become visible, and revalidate policy and trust revisions before dispatch and before each later effect.
- Main owns the token, the process and the network. The engine owns durable job state. The renderer only calls strict IPC and never supplies paths, executables, tokens or dispatch identities.
- The token reaches the collector process as one explicitly set environment variable inside the existing minimal environment; nothing else is inherited. Output stays bounded and redacted, and Stop or timeout ends only the owned process tree.
- Idempotent dispatch: persist the job and a generated `clientRef` before dispatching, and persist the run id as soon as the collector prints it. After restart, resume by run id; never dispatch a second run for the same job.
- Readiness comes only from a fresh validation of the exact retained bytes against the recorded dispatch identity. Receipts stay process-local as in Stage 1, and restart re-validates.
- Imported AGENTS, skills and hooks are never activated, and corpus pages are untrusted data, not instructions.

## Tasks

1. [x] **Revise contracts.** Removed `research.provision` and `research.review`. `research.start` now takes the collector's public inputs and requires `acknowledgedPublic: true`; it enforces single-line inputs that cannot look like flags, comma-free preferred domains, the 1–25 page budget and URLs counting against it. Collector repository and ref must start with a letter or digit. Added `research.list`, `research.review.start` (job and profile only, no decision field), and main-owned `research.collector.read/save`, whose results carry `tokenConfigured` and never the token. Job state and the `research.status` event share one `ResearchStatusSchema`. No handler exists yet, so every research method still answers `NOT_IMPLEMENTED`.
2. [x] **Durable job state.** Schema v3 replaces `research` with run-less jobs: constrained columns (status CHECK, unique `client_ref` and `workflow_run_id`, one active job per project) and an append-only `research_events` journal keyed by revision. SQL triggers refuse any state change without its journal row, any stale step, identity changes, a second dispatch and `approved`. v2 rows move verbatim to `research_legacy`. `src/engine/research-state.ts` holds the only edge table; `src/engine/research.ts` holds admission (strict policy and trust revision binding), `research.start/list/read/cancel`, and the main-facing controls `research.context/transition/recover`. A dispatch whose binding is stale is journaled as `failed` and returned as `refused`. Recovery never re-queues an ambiguous dispatch; it fails it as `REMOTE_STATE_UNKNOWN`. Job notices travel as a separate `research` engine message and `moonaliza:research` channel; `EventSchema` is unchanged.
3. [ ] **Owned collection process.** Main runs the pinned `collect-remote.mjs` with fixed arguments, every value passed as `--name=value` (the kit's parser reads a separate value starting with `--` as a new flag), the token as its only credential and bounded output. **Correction:** under `--json` the kit does not print the run id before waiting, so dispatch with `--no-wait --json --client-ref=<clientRef>`, commit `dispatching -> collecting {workflowRunId}`, then watch with `--run-id=<id> --json`, which is safe to repeat. Commit `queued -> dispatching` through `research.transition` and spawn only on an `applied` reply. Exit 3 is not always "nothing dispatched": `NO_RUN_ID` and a network failure after sending are ambiguous and must fail as `REMOTE_STATE_UNKNOWN`, never re-dispatch. Exit 0 under `--no-wait` means dispatched, and a valid package can still be a `COLLECTION_FAILED` diagnostic; store the kit's `code`, not just the exit code. Call `research.recover` at app start and after an engine-only restart. Use `--run-id` for resume after restart or timeout (workflow artifacts expire after 7 days). Test dispatch, resume, Stop mid-wait, timeout, invalid package, failed run, missing token and redaction of tokens in output. Tests use a local fake GitHub API at the network boundary, not a fake collector.
4. [ ] **Verified import.** Pass downloaded packages through the existing adapter with the recorded binding (clientRef, repository, ref, commit, workflow, run id, attempt). Store the digest, validator identity and job revision on the job, and reject packages from a different run.
5. [ ] **Review (per D3).** Under (a): materialise the verified corpus into a private research workspace and run an agent review with exact edit approvals. Then run the kit's preflight and `artifact.mjs create`, and validate the new package as above. Readiness is shown only from that validation. Test a passing review, a failing gate, tampering between review and packaging, and restart mid-review.
6. [ ] **Renderer.** A research panel per project: start form showing what becomes public, live status, evidence and brief reader (bounded, rendered as untrusted text), review progress and actionable failures (missing kit, missing token, collection failed, review required, invalid evidence, stale, ready). No "authorize" control.
7. [ ] **Delivery.** Typecheck, lint, full tests, build/runtime and desktop journeys (start, restart mid-collection, cancel, review to ready). Package the Windows app, update the handoff, development status and release record, scan for secrets, push and open the phase PR, and verify exact-head Windows CI. The user merges.

## Acceptance

- With research off, all existing tests and desktop journeys pass unchanged.
- A job survives restart at every state and never dispatches twice.
- No token appears in the database, events, logs, renderer state or PR artifacts.
- `approved` is reachable only through the kit's own gate and a fresh validation of exact bytes. No MoonAliza control can produce it.

## Progress

October 2, Task 1: `tests/research-contracts.test.ts` failed first because the new methods did not exist, then passed (7 tests). The credential test starts from a valid input for each research method, so only the added field can cause a rejection. A deliberate mutation that let `research.read` accept extra fields made it fail. Typecheck, lint and `check-handoff` pass. Review of the diff found that the kit's flag parser would read a query such as `--runner=windows-latest` as a flag; the contract now refuses such values and comma-bearing domains, and Task 3 must pass `--name=value`. On Linux the full suite runs 518 tests in 38 files: 442 pass, and the same 76 native/validator tests fail with and without this change (identical failure lists). They need the Windows helper and the prepared kit, so exact-head Windows CI is the acceptance check.

October 2, Task 2: `tests/research-jobs-state.test.ts` (29 tests) failed first because `src/engine/research` did not exist, then passed after implementation. The design came from a judged panel of three alternatives (explicit columns, a typed state document, a transition journal), synthesized into this one; it was rechecked against the files before coding. The v2 fixture `tests/fixtures/schema-v2.sql` was dumped from the unmodified code at `950479f` and reproduces all 48 schema objects. Eight deliberate mutations were each caught: dropping the v1->v2 version chain, the single-dispatch index, admission on dispatch or the research-off refusal; allowing `approved` through the control; publishing on replay; re-queueing an ambiguous dispatch; and removing the explicit stale-revision check. Under the last, a racing second dispatch is still refused by the edge check and nothing is written; only the error code differs. That check exposed that the store derived the next revision from the current row; it now derives it from the caller's expected revision, so the database refuses a stale writer too. Mistakes caught during the work: two test bugs (a duplicate client ref hit the one-active-job index first; a reused run id hit the run-id uniqueness) and one code bug (the DTO carried `undefined` optional keys). Typecheck, lint and `check-handoff` pass; cwd `/home/user/moonaliza`. On Linux the full suite runs 547 tests in 39 files: 471 pass, and the same 76 native/validator tests fail as before (identical failure lists). Exact-head Windows CI is the acceptance check.

## Recorded for later (not in Task 2)

- **Task 3:** stop owned collectors on `research.cancel`, `project.revokeTrust` and `project.policy.update` (Task 2 only refuses at the next effect); decide whether a collector survives an engine-only restart; implement `research.collector.read/save`; re-pin Research-Kit to `bf60e21` or later for `--run-id`. Because the binding uses strict revision equality, any project policy edit (including an inference-only one) fails a queued job at dispatch.
- **Task 4:** the package manifest's `workflow` is always the literal `collect.yml` and its `ref` is the short `GITHUB_REF_NAME`, so they will not equal a configured `refs/heads/main` or another workflow file name; commit and run attempt are not returned by dispatch or `--json` and must come from the GitHub run (never from the package being validated); choose which project revision feeds the adapter's single `projectRevision`; record the job revision a receipt was bound to, because every transition bumps it. Implement `research.purge` with retained-byte deletion. Required verification fields go on `collecting -> collected`.
- **Task 5:** add review edges (and retry edges such as `not_ready -> reviewing`), replace the `research_readiness_reserved` trigger with a digest-gated rule in a v4 migration, and stream `research.status` on the review run.
- **Small follow-up:** `src/engine/policy.ts` throws `RESEARCH_DISABLED`, which is not in `ErrorCodeSchema` (the contract code is `RESEARCH_NOT_ALLOWED`); research admission now uses the contract code, but the tool-policy path still surfaces as `INTERNAL_ERROR`.

## Next phase after research: missions

User decision, October 2: finish this research phase first, then build missions (source-plan tasks C3/C4). MoonAliza may propose splitting a hard task into several agents, but it must **always ask for approval** first, showing the agent count, step budget, cloud or local profiles, and whether agents run in parallel. Local parallel agents need a warm runtime and concurrent scheduler leases (the scheduler is currently one-at-a-time and stops the runtime after each lease); cloud profiles can run in parallel.

User direction, October 2: the mission should decide from the machine's resources which model each agent uses and how many agents run, as local model selection already does. The user approved this design on October 2. It follows `selectLocal` (`src/models/select.ts`, [selection policy](../../specification/model-store-selection.md)):

- **A pure mission planner** chooses per-agent profiles and concurrency from measured evidence only: qualified machine receipts, current free RAM/VRAM under the same reserve rule (`max(2 GiB, 15% of RAM)`), project cloud policy and the step budget. Hard subtasks may get a stronger profile, simple ones a smaller one; cloud only where the project allows it.
- **Concurrency is measured, never guessed.** Today's receipts measure one model at a time. Running N agents on one loaded model needs receipts measured at each concurrency level (each extra agent adds its own context memory). Without such a receipt the planner runs agents sequentially, or offers a short monitored probe first.
- **The planner fills the approval card; the user still approves** (agent count, model per agent, parallel or sequential, local or cloud, step budget). Resources are rechecked under the lease before each agent starts; if they drop, the mission falls back to sequential instead of failing.
- On the current PC (about 1.15 GiB free, below the reserve) the planner must report that no local agent fits and offer only policy-permitted cloud agents.

## Project memory (proposed for after this phase, before missions)

User request, October 2: sessions must be stored and the user must be able to switch modes freely without MoonAliza forgetting where work stopped, repeating mistakes or rewriting finished work. Reference: [ProjectBrain](https://www.projectbrain.tools/), a hosted, structured memory of tasks, decisions, facts and skills shared across sessions and agents.

Current state (verified October 2): conversations, runs, messages and events persist in the engine database; the mode is chosen per message, so one conversation already spans Ask, Plan and Build. Forgetting comes from context assembly (`src/engine/context.ts`), which drops the oldest turns from the model request when the window fills (reported as omitted history), and there is no memory shared across conversations and no record of mistakes.

Proposed design (local, not the hosted service, consistent with local-first privacy):

- **Per-project memory records** in the engine database: tasks (todo, in progress, blocked, done), decisions with rationale, facts and constraints, and lessons (a mistake, its cause and the fix). Each record is revisioned and links to the conversation, run or operation that produced it.
- **Every run reads it, in every mode:** a bounded "where we are" brief (open tasks, active decisions and constraints, recent lessons) is assembled before history, so trimming old turns never removes project state. A `recall` tool searches full history through the existing FTS index.
- **Plan to Build handoff:** Plan mode saves a structured plan; Build mode follows it and marks steps done, so switching modes does not repeat or rewrite finished work.
- **Lessons:** failed operations, failing checks and user corrections become lesson records surfaced before similar actions. This reduces repeated mistakes; it cannot guarantee a model never repeats one.
- **Trust:** memory steers future runs, so entries derived from untrusted content (GitHub files, web or research captures) stay proposed until the user accepts them; imported text never becomes an instruction. The user can view, edit and delete every record. Project cloud policy applies whenever memory is sent to a cloud model.
- **Order (confirmed by the user, October 2):** research phase, then project memory, then missions, because mission agents need this shared state for handoffs.

## Decisions recorded October 2

These are user decisions; later phases implement them.

- **Phase order:** finish this research phase, then project memory, then missions.
- **Completion is counted, never estimated.** Every plan step lists acceptance items written in advance. An item counts only when its evidence exists: a test that ran and passed, CI green on that exact commit, a merged PR. Build completion % = verified items / all items, and each number links to what is missing.
- **Research readiness per plan step.** Each step lists its blocking unknowns. Research readiness % = unknowns closed with verified evidence / all blocking unknowns; an unreachable fact may be labelled a known unknown with a day-one check, never left silent. The plan shows both percentages.
- **Build only where research is sufficient** (integration review Stage 3, research-aware Build admission): Build mode is admitted per plan step only when that step's research is ready (the kit's own gate plus a fresh MoonAliza validation). Steps with no blocking unknowns need no research, so research stays optional for ordinary work.
- **Build to Research and back.** When Build hits something it cannot resolve from the code, it pauses that step, records the open question as an unknown in project memory and proposes a targeted research job with topic and queries prefilled from the error. The approval card shows exactly what becomes public; code is never placed in queries automatically. After review, facts land in project memory with sources and Build resumes at the same step; a mistake becomes a lesson.
- **Quality checks.** Careful-coding discipline (read before changing, run the checks, re-read the diff, report mistakes plainly) is Build mode's default behaviour. Break-test (prove realistic build and test failures, then fix them minimally) is suggested at 25%, 50% and 75% build completion, when a change touches risky areas (migrations, process or credential code, installers) and after a repeated-failure lesson; it is required before a milestone is marked 100% or released. The user approves every break-test run, with its cost shown. In missions it becomes a preset (finder, verifier, fixer).
- **GitHub, approved as four steps:**
  1. One secure GitHub connection (a GitHub App or fine-grained token with least privilege per repository) in the encrypted vault, shared by research collection, private repository reading and the steps below; never entered in chat.
  2. GitHub as completion evidence: CI runs on an exact commit and PR state tick acceptance items.
  3. Checks and break-test runs on GitHub Actions runners, so heavy and Windows-only checks do not depend on the user's PC.
  4. Optional per-project two-way sync of project memory tasks with GitHub Issues or a Project board, and finished work opened as draft PRs. Every write to GitHub needs the user's approval; issues are visible to repository readers, so private notes stay local unless the user opts in.
- **Background tasks, approved as the first part of the missions phase** (the foundation mission agents run on):
  1. A Tasks panel lists everything running in the background (test suites, builds, dev servers, research jobs, later mission agents) with status, elapsed time, the latest output and Stop.
  2. Build mode can start an approved command in the background and keep working; running in the background never bypasses the existing exact command approval.
  3. A finished task posts a short summary into the conversation (passed or failed and the key lines); the agent reads the full saved output on demand instead of loading it into context.
  4. Output streams to bounded files on disk. On app exit owned processes stop, and after restart those tasks show as interrupted and are never re-run silently; research jobs keep their resume-by-run-id behaviour.
  5. A concurrency limit applies, and local-model work still shares the one inference scheduler under the same RAM/VRAM rules as the mission planner.
