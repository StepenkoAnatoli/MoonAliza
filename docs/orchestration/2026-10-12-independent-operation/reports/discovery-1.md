# Selenic (formerly Moonzila): orchestrator and SmartRouter integration, discovery report, 2026-10-12

**What was read:**
- **SR** is `/home/user/stepenkoanatoli/smartrouter` at `582f0d3`.
- **MZ** is `/home/user/moonaliza` at `7301d3e` on branch `main-axuse`.
- **plan** is `SR docs/DEVELOPMENT_PLAN.md`.
- **review** is `MZ docs/orchestration/2026-10-05-more-models/reports/2026-10-10-ideas-review.md`.
- **jobs** is `MZ docs/superpowers/plans/2026-10-02-research-jobs.md`.

Both repositories were read only, and I checked every citation below again myself. Three citations in the input maps were wrong; they are corrected at the end.

## Decision summary

- **SmartRouter is not finished, and it has no part Moonzila can call.**
  - It is a routing policy written as Markdown skills, plus a Python harness for its pilot (SR `skills/smart-router/SKILL.md:3,20-24`).
  - Its live pilot has never made a real call (SR `README.md:16`).
  - Integrating it means work on the Moonzila side, and SmartRouter assigns that work to Moonzila (SR `docs/HANDOFF_MOONZILA.md:24-29`).
- **Recommended integration: Option A, growing into B1.**
  - Port SmartRouter's five gates and its rules for binding, briefs, results and the attempt ledger into Moonzila's own deterministic code.
  - That code stays the only authority that picks models, for the orchestrator's workers too.
- **Decision 3 can be kept.** The request can be met without breaking MANDATE decision 3, because nothing in it needs a model to choose models.
  - It does widen decision 3, from "four rules on a later display" to "the orchestrator's routing policy".
  - No one approved decision 3 individually (MZ `docs/orchestration/2026-10-05-more-models/MANDATE.md:7-9`), so the user has to confirm it.
  - Letting a model choose (the note's Path B) would reverse decision 3, and that is the user's call too.
- **The bigger change is not SmartRouter.** It is the "standing authorization": approve once, then no approval per action. That relaxes the approval invariant (MZ `AGENTS.md:8`; jobs:428), and only the user can decide it.
- **Build order, as the user set it:** project memory, then self-unblocking, then missions (jobs:430). Two pieces have to come in early because the orchestrator and SmartRouter both need them:
  - a priced accounting and reservation layer;
  - a stop-list enforced by the engine.

## 1. What SmartRouter is and how finished it is

**What it is:**
- **Three Agent Skills, all v1.0.0 and MIT-licensed:** `smart-router` (the main one), plus `-review` and `-eval-prep` (SR `SKILL.md:1-9`).
  - The main skill applies five ordered gates: permissions/privacy, capabilities, verification, affordability, economics.
  - It returns one of four routes: `direct`, `delegate`, `recommend-escalation` or `blocked` (SR `SKILL.md:13-18`).
  - Its own description says it "Recommends only; does not switch the running model, enforce caps" (SR `SKILL.md:3`).
- **The host must enforce everything:** authorization, model identity, dispatch, privacy and billing (plan:13; SR `SKILL.md:20-24`).
- **What it does not have:**
  - no service, API, library or wire protocol (none exists in the tree);
  - no algorithm that classifies tasks; a paid classifier is deferred (plan:427);
  - no orchestrator.
- **The only program that runs the gates is test code.** It is labelled "for testing only" and uses made-up profiles (SR `tests/smart_router_decisions.py:84,121-186`).
- **The pilot code does not route and does not return answers:**
  - `tools/live_dispatcher.py` lets the caller choose the profile; it makes no routing decision.
  - `tools/dispatch_adapter.py` returns only token counts and throws away the model's answer (SR `tools/dispatch_adapter.py:139-144`).

**Its own definition of done:**
- Done means passing the phase exit gates in plan §14 (plan:354-366).
- Phases 5-8 are "options, not commitments", and the plan says to simplify or stop "if direct is cheaper ... accounting/dispatch absent" (plan:368).
- The success measure is cost per verified successful task (plan:9-11). It has never been measured.

| Phase | What its own records say | What I checked |
|---|---|---|
| 1 Plan | Closed (SR `README.md:12`) | Agrees |
| 2 Skills | "Closed" (SR `README.md:13`) | Contradicted. The record says it "does not close Phase 2" (SR `docs/PHASE2_REVIEW_RECORD.md:4-5`), and the independent-review box is unchecked (:51-52). |
| 3 Preregistration | Closed as an "owner-deviation closure" (SR `README.md:14`) | The strict independent review is still open (SR `docs/PROJECT_COMPLETION.md:49-51`) |
| 4 Pilot, non-live | `promote (non-live)` (SR `docs/PHASE4_PILOT_REPORT.md:48-49`) | $0 spent; "real rate-sheet economics unproven" (:52, :56-57) |
| 4 Pilot, live | **Open** (SR `README.md:16`) | Spend was approved and signed on 2026-10-10 (SR `docs/PHASE4_LIVE_START_PACKET.md:68`), but there is no key in the checkout (SR `docs/CREDENTIAL_ROTATION_RUNBOOK.md:41`). Zero live calls. |
| 6-7 Moonzila | Moonzila's to build and approve (SR `docs/HANDOFF_MOONZILA.md:24-29`) | The advisory-screen note says "not ratified" (SR `docs/MOONZILA_ADVISORY_UI.md:3`), but its §8 says "RATIFIED as structure" (:164) |

**Verdict:**
- Every phase that could run without real model calls is closed.
- Against its own success measure, it is not finished.
- It has no release that a host could run as a router.
- "Finished" beyond the live pilot is not stated anywhere.

**Defects that matter if anything is reused:**
- **Cost is checked after the money is spent.** The call is sent first (SR `tools/live_dispatcher.py:217`), and the per-task and pilot cost caps are checked afterwards (:224, :230).
- **Missing usage counts as zero.** If the reply has no usage block, the token counts become 0 (SR `tools/dispatch_adapter.py:141-143`). The plan says missing usage must never lead to promotion (plan:330).
- **The key sits in plain text** in a `.env` file (SR `dispatch_adapter.py:62-78`).

## 2. What integrating it into Moonzila would mean

### Where SmartRouter would plug in

| What SmartRouter supplies | Where it lands in Moonzila | What Moonzila lacks today |
|---|---|---|
| Gate 1, privacy, which must run before any fetch, cache write or send (SR `references/gates.md:14-17`) | Host code before inference, next to the locality check (MZ `AGENTS.md:88`) | Nothing for cloud destinations beyond the session/project policy |
| A profile identity of five parts (SR `gates.md:75-76`) | `ProfileIdentitySchema` (MZ `src/shared/contracts.ts:34`) | The model revision and the tool/output configuration revision. Moonzila also never reads back which model actually answered (review:194). |
| Gate 4, affordability: a conservative cost bound and atomic reservations (SR `gates.md:43-56`) | A new accounting layer | Any price or spend code (`grep` over `src` finds 0 hits). Usage is recorded only after the call (MZ `src/engine/application.ts:365`). |
| Binding to revisions, and a recheck just before dispatch (SR `gates.md:77-87`) | Approval binding (MZ `src/engine/policy.ts:35-41`) | Revisions for a price list and for the verifier contract |
| Brief, result and ledger rules: persist before sending, every dispatch counts, at most one corrective repair (SR `references/brief-and-result.md:41-54`) | A mission journal and a worker brief | Both missing; missions are NOT_IMPLEMENTED (MZ `application.ts:232,265`) |
| Gate 5, economics: prefer `direct`, delegate only when the benefit covers all overhead (SR `gates.md:58-64`) | The mission planner (jobs:387) | The planner is not built |
| The advisory display (plan:346) | Phase 6 screen | Not built |

### Options

**Option A: SmartRouter as an advisory input to Moonzila's deterministic selector.**
- What it is:
  - Port Gates 1-5 into TypeScript host code.
  - Moonzila's selector, `src/models/select.ts`, is local-only today (`:7-9,26-33`). Extend it to cover cloud profiles.
  - The gates produce reason codes the selector shows. The review recommended exactly this (review:231).
- Cost:
  - The port itself.
  - A price list with revisions, a conservative bound, reservations, and the identity tuple extended.
  - Missions need all of these for their budgets anyway (MZ `docs/specification/decisions.md:11`), so most of the cost is shared. This is inference, not a measured estimate.
- No new runtime and no model calls for routing.
- What it touches: it fits decision 3 (MANDATE.md:21-24). It follows these rules:
  - "Skills, model output ... cannot grant permissions" (MZ `docs/specification/source-plan.md:112`);
  - one permission broker (source-plan.md:559);
  - journal before effect (MZ `AGENTS.md:8`).

**Option B1: SmartRouter's policy, ported, becomes the routing authority for the orchestrator's workers (plan Phase 7).**
- What it is: Option A, plus dispatch. The deterministic gates pick and recheck the profile for each planner, worker, reviewer and repairer call.
- Cost: Option A, plus everything Phase 7 requires:
  - privacy checked before prompt bytes leave;
  - Stop;
  - a durable record of attempts, reservations and settlement;
  - reconciliation after a restart (plan:348);
  - acceptance tests for no-send, cancel, restart and replay (plan:352).
- What it touches:
  - It keeps "authority stays the deterministic selector", but widens what decision 3 covers, so the user must confirm it.
  - It must follow SmartRouter's "start serially" rule and its "concurrency only after measured need" rule (plan:86, :350).
  - It must follow Moonzila's "serialize workspace writers until isolation is qualified" (decisions.md:12).

**Option B2: a model reads the skill and recommends a profile for each worker (Path B).**
- Cheapest to build, but each routing decision costs an extra model call.
- **It conflicts with:**
  - decision 3 (MANDATE.md:23);
  - SmartRouter's own single-authority rule (plan:50);
  - G10 (source-plan.md:112).
- **It breaks the order of checks.** Gate 1 cannot run before the send when the gate is prompt text (review:233-236).
- **It leaks data the user did not consent to.** It sends the profile inventory to a model, outside the consent text (review:275-279).
- **It cannot work on a local-only project.** That rule covers every model call, the router's included (plan:348), and no local model fits the user's PC (MANDATE.md:16-17).
- **Not recommended.** Choosing it reverses decision 3 and needs the user.

**Option C: reuse SmartRouter's Python dispatcher. Rejected.**
- It keeps the key in plain text, which breaks the vault invariant (MZ `AGENTS.md:80`).
- It checks cost after sending.
- It throws away the model's answer.
- It would add a Python runtime to the product.

**Answer on decision 3:** the user's words, "needs ... the smart router", do not by themselves require a model-generated recommendation. A and B1 keep decision 3 as written. What does change is its reach: from constraints on a later display to the policy that routes every orchestrator agent. Decision 3 was taken by the lead without individual approval (MANDATE.md:7-9), and the plan already sends this question to the user (jobs:432). **It goes to the user, as Q1.**

## 3. The in-app agent orchestrator

**What it must do.** The user's description: plan, delegate to parallel agents, review, fix, continue, and ask only when research cannot answer (jobs:428).

**What exists today:**
- One model runs one tool loop per run (MZ `application.ts:330-400`).
- Only one live run per project (`application.ts:231`).
- Every write and command waits for approval of the exact proposal (MZ `src/engine/operations.ts:105-173`).
- Runs are marked interrupted on restart and never resumed (MZ `src/engine/store.ts:382-399`).
- Missions are only declared: the schemas exist (MZ `src/shared/params.ts:140-144`) but the methods answer NOT_IMPLEMENTED (`application.ts:265`).

**Proposed order.** This follows the user's order (jobs:430) and adds the two pieces both tracks need:

| # | Step | Why it comes here | Rests on |
|---|---|---|---|
| 0 | More models Phase 2 (Anthropic adapter) and the Selenic rename | User's order. Phase 2 is still in design (MZ `docs/orchestration/2026-10-05-more-models/RUN.md:20`). | jobs:430 |
| 1 | **Project memory** | It is the orchestrator's durable ledger: the Plan run saves `plan` and `task` records (MZ `docs/specification/project-memory.md:243`), and only accepted records reach a model (:41). | project-memory.md |
| 2 | **Standing authorization and an engine-enforced stop-list** (needs the user, Q2) | Every autonomous step depends on it. A stop-list written into the prompt does not count. | jobs:428; source-plan.md:112 |
| 3 | **Accounting:** prices with revisions, conservative bounds, reservations, a budget ledger | Missions need it (decisions.md:11), SmartRouter Gate 4 needs it, and so does the user's "spending beyond budget" stop item | SR `gates.md:43-56` |
| 4 | **Self-unblocking with research:** one agent, serial, on an isolated branch; it opens a PR and never merges it | User's order. It needs a GitHub write path (jobs:439) and a public-technical query shown to the user first (jobs:437). | jobs:418-440 |
| 5 | **Background tasks** | Defined as "the first part of the missions phase" | jobs:474-479 |
| 6 | **Serial missions:** a task graph, worker briefs, a separate read-only reviewer bound to a manifest digest, PASS/FIX/ESCALATE verdicts, durable pause/resume that reconciles unknown operations, and the project lock | Option B1 lands here | source-plan.md:2289-2298; decisions.md:12; jobs:391, :518, :574 |
| 7 | **Parallel missions.** Read-only and reviewer agents on cloud profiles run in parallel first. Writers run in parallel only after isolation is qualified, and `maxAgents` is at most 5. | Required by both projects' serial-first rules | plan:350; decisions.md:12; source-plan.md:2290 |

**Reusable from the repository's own skills (`MZ .claude/skills/`).** These are patterns and text, not code. They drive Claude Code's sub-agents and git, which the app does not have.
- **lead-orchestrator:**
  - research before design (`SKILL.md:39-41`);
  - builders and reviewers are separate agents (:44);
  - a run ledger with a resume procedure (:104; `references/run-ledger.md`);
  - each builder in its own worktree (:253-256);
  - its list of actions that need the user's approval (:444-446), which maps almost one-to-one onto the user's stop-list;
  - its worker briefs (`references/agent-briefs.md`).
- **careful-coding:** already planned as Build mode's default behaviour (jobs:468).
- **break-test:** isolates its work in a worktree.

**Conflicts to settle before the design:**
- **Which model to use.** lead-orchestrator says "Default to the most capable model" (`SKILL.md:66`). SmartRouter says prefer `direct` and delegate only when the benefit covers all overhead (SR `gates.md:58-64`).
- **How many retries.** lead-orchestrator allows "at most two focused retries" (:442). SmartRouter allows one corrective dispatch per task, and changing the profile or escalating does not renew it (SR `brief-and-result.md:44-45`).
- **Worktrees versus Moonzila's guards.**
  - Git inspection refuses linked worktrees (MZ `src/tools/git.ts:14,67`).
  - The repository's own practice symlinks `node_modules` into worktrees (MZ `AGENTS.md:104`), but write guards refuse symlinked path parts (MZ `operations.ts:57-61`).
  - There is a reusable seam: `rootFor` already sends a review run's file tools to a separate workspace root (`operations.ts:50`).
- **Commands are not isolated.** A command runs with the user's Windows account and can use the network (MZ `src/renderer/components/ChangesPanel.tsx:68`), so a worktree does not isolate commands. What "isolation is qualified" means is not stated anywhere.

## 4. Readiness criteria for "SmartRouter is finished, integrate it"

**What Moonzila must have first:**
1. A deterministic selector that covers cloud profiles and is the single authority. Today it covers only local models (`src/models/select.ts`).
2. The five-part profile identity, including model and tool-config revisions, and a read-back of which model answered (SR `gates.md:75-76`; review:194).
3. A price list with revisions, a conservative bound for each call, atomic reservations, and persist-before-send (SR `gates.md:43-56`; SR `brief-and-result.md:49-50`).
4. Gate 1 as host code that runs before any bytes leave (SR `gates.md:14-17`).
5. A verifier contract with its own revision (SR `gates.md:77-79`).
6. Durable attempts, with Stop, restart and reconciliation of unknown operations, passing the no-send, cancel and restart tests (plan:348, :352).
7. A mechanism to vendor the skill under a reviewed inventory, pinned by content digest (review:281-282). The skill's own pin `d7c00f96` names a plan revision that has since drifted.

**What SmartRouter must provide** (my proposed definition of "finished"; its own records do not state one):
1. **A completed live Phase 4 pilot**, with cost per verified successful task actually measured and a live-scope decision that satisfies plan:330. The spend is already signed: $1 per task, $20 per pilot (SR `tools/prices-2.json:69-75`).
2. **Fixes for the defects found:**
   - check caps before sending;
   - treat missing usage as unknown, not zero;
   - put the 79-assertion decision suite into its commit gate (it is absent from SR `tools/run_regression.py:30-50`).
3. **Phase 2 independently reviewed and closed** (SR `PHASE2_REVIEW_RECORD.md:51-52`).
4. **A versioned contract a machine can read:**
   - gate inputs, outputs and **reason codes** (review:272-273);
   - fixtures runnable against a host.

   None exists today.
5. **The advisory-screen note:**
   - status made consistent (`:3` against `:164`);
   - the citation errors the review listed corrected.
6. **A tagged release** that names items 1-5 as done.

## 5. Questions only the user can answer

1. **Routing authority.** Should SmartRouter's policy be built into Moonzila's deterministic selector, as the one authority over every orchestrator agent (A, growing into B1)? Or should a model reading the skill choose profiles (B2, which reverses decision 3)?
   - *Recommended:* A then B1. Confirm that decision 3 now covers orchestrator routing.
2. **Standing authorization.** May a mission run without approval per action, inside an isolated branch or worktree, once you have approved its scope, budget and stop-list?
   - *Recommended:* yes, but staged.
     - Start with self-unblocking: one agent, serial, writes kept to one branch, ending in a PR that Moonzila never merges.
     - Parallel writers only after isolation is qualified.
   - Proposed stop-list:
     - merging or force-pushing;
     - spending beyond the budget;
     - deleting data;
     - credentials;
     - private code in public research queries;
     - any change to an invariant.
3. **Budget and what "finished" means.** What cash budget can a mission spend? Does "SmartRouter finished" mean the criteria in §4?
   - *Recommended:*
     - Mission caps mirror SmartRouter's signed pilot caps ($1 per task, $20 total) until accounting has been measured.
     - "Finished" means §4's SmartRouter list, at a tagged release.
     - Before any of this, rotate the exposed GitHub credentials (SR `CREDENTIAL_ROTATION_RUNBOOK.md:45`), because Moonzila will get a GitHub write path.

## 6. Research the track will need: candidate Research-Kit unknowns, not answered here

- **U-a. Anthropic API rate limits** by tier for concurrent requests, how 429 errors and retry headers behave, and the `usage` fields in streamed and non-streamed replies. This sets parallelism and accounting.
- **U-b. Current per-model prices**, including cache and batch modifiers, for Anthropic, OpenAI and Gemini, and whether each publishes a price-list revision or effective date. Gate 4 needs a price list with revisions.
- **U-c. A conservative cost bound before sending:** token-counting endpoints, and how far `max_tokens` bounds output cost.
- **U-d. Model identity read-back:** does each provider's reply carry the model id and revision that actually served it? The SmartRouter identity tuple needs this.
- **U-e. Gemini and OpenAI-compatible limits for parallel agents** beyond the free-tier figures in MZ `docs/evidence/2026-10-11-gemini-probes.md:40-46`.
- **U-f. Git worktrees on Windows:** long paths, file locking, antivirus interference, junctions, per-worktree `npm ci` cost, and interaction with `core.longpaths`. This decides whether writer isolation can qualify.
- **U-g. Options for sandboxing commands on Windows** (job objects, AppContainer, Windows Sandbox): how well each isolates network and filesystem for agent commands.
- **U-h. The minimum GitHub credential for push-branch plus draft-PR**, as a fine-grained PAT or a GitHub App: required permissions, expiry, and API rate limits.
- **U-i. SmartRouter's remote state** (PR #7, issues, CI on `582f0d3`). This is a GitHub read, not an external fact. GitHub returned 403 in this session.

## Corrections to the input maps, and limits

- **`MZ AGENTS.md:113-114` and `:110-113` do not exist.** The file has 104 lines. The `node_modules` symlink rule is at `MZ AGENTS.md:104`.
- **"No remote collector configured" is at `MZ AGENTS.md:100`,** not `:99`.
- **`MZ docs/specification/operate-mode.md:58` is narrower than the map says.** "Auto-approval of any gate" is in a list of things outside Operate mode's own scope, and its example is a bot runtime (KashMula). Do not cite it as a general app invariant.
- **Not stated anywhere I read:**
  - a SmartRouter API or release date;
  - a qualification test for writer isolation;
  - who classifies task difficulty inside a host.

## Critic's corrections (read with the report; the material ones change decisions)

Mostly accurate, but some gaps would change decisions. I re-checked nearly every file:line citation against SR 582f0d3 and MZ 7301d3e, read-only. Almost all are correct, and the core recommendation holds up: SR's gates become deterministic host code, and Moonzila keeps the selection authority. Six problems are material. (1) The report misses that SmartRouter already has two tagged releases, v1.0.0-pilot and v1.0.1, so "finished" has to be defined against them. (2) It describes Option B2 as a conflict with SmartRouter, when B2 is actually the way SmartRouter is designed to be used. It also does not say that Option A is a port: SmartRouter's own files are never loaded. (3) Moonzila's selector has no production caller, and the user already approved an Oct 2 design in which a deterministic mission planner picks each agent's model (jobs:385-389). Both change Q1 and the cost of Option A. (4) The standing authorization conflicts with more approved decisions than the one the report names: approval of GitHub writes, command approval for background tasks, and user acceptance of project-memory records. Method authorization labels are also not enforced. (5) §6 lists research unknowns that Moonzila's existing corpora and its 2026-10-12 Anthropic probes already largely answer. (6) Neither repo resolves a contradiction about which Haiku model SmartRouter's signed rate sheet names. The other findings are wrong paths, off-by-one lines and overstated wording.

- **material**: "It has no release that a host could run as a router" (§1 Verdict); readiness item 6 asks for "A tagged release"; and under limits, "Not stated anywhere I read: a SmartRouter API or release date".
  - Problem: SmartRouter already has two annotated, public releases.
- `v1.0.0-pilot` at b6e04fd and `v1.0.1` at cdcec77. Both tags are in the clone, and the zips are committed under `tools/release/`.
- Evidence: SR `README.md:5-7`, SR `docs/PROJECT_COMPLETION.md:81-110`, and SR `docs/HANDOFF_MOONZILA.md:5-14` (subject line: "v1.0.0-pilot is released").
- PROJECT_COMPLETION.md:21 calls the skills "Executable skills (ready to install in a host, advisory-only, no dispatch)".
- Without this, the user could read v1.0.1 as "finished". The report's definition of finished does not say how it relates to the existing releases.
  - Correction: State that v1.0.0-pilot (2026-10-10) and v1.0.1 exist. They contain three advisory skills, the decision suite and the validator; they have no dispatch and no live evidence. Define "finished" as a release after v1.0.1 that meets §4's criteria, and say v1.0.1 does not meet them.
- **material**: Option B2 conflicts with "SmartRouter's own single-authority rule (plan:50)". Option A is presented as the way to integrate SmartRouter.
  - Problem: A model reading the skill is how SmartRouter is designed to be used.
- The skill says "You are a routing decision procedure" (SR `SKILL.md:13`) and "Use before every new coding task or model dispatch decision" (:3).
- The plan allows a model to generate a route recommendation when that is separately authorized and accounted (plan:42 F5; plan:74). The advisory note's Path B is exactly that (SR `MOONZILA_ADVISORY_UI.md:72-84`).
- plan:50 only stops work when two selection authorities conflict. B2 conflicts with Moonzila's decision 3 and G10, not with SmartRouter itself.
- Option A ports the rules to TypeScript. SmartRouter's skill and release are never loaded at runtime, so every future SmartRouter policy change has to be ported by hand. Q1 does not tell the user this, even though the user asked to "integrate" SmartRouter.
  - Correction: Remove plan:50 from B2's conflicts, or narrow it to "two concurrent authorities". In Q1, state plainly that A and B1 reimplement SmartRouter's rules and do not consume its artifact. Name the sync mechanism (the pinned SR version plus conformance fixtures from §4 SR item 4) as the cost of that choice.
- **material**: Option A: extend `src/models/select.ts` to cloud profiles, and "That code stays the only authority that picks models". On decision 3: B1 widens it "from four rules on a later display" to the orchestrator's routing policy.
  - Problem: The selector is not an authority today.
- It has no production caller, and on the user's PC it answers `host-reserve` for every model size (jobs:403).
- Every run uses the profile the user picks (MZ `src/engine/application.ts:229,235`; review:195).
- So Option A builds production selection from scratch; it is not an extension of an existing selector.

The report also leaves out two prior decisions:
- On Oct 2 the user approved a deterministic mission planner that picks the profile and concurrency for each agent, with the user approving the card (jobs:385-389).
- MANDATE decision 1 reduces direction 3 to "an inference-free eligibility display, later" (MANDATE.md:13-15). B1 changes that decision as well.
  - Correction: Say the selector is tested code with no caller. Cite jobs:385-389 as the approved basis for deterministic choice of each agent's profile. Reframe Q1: what is new is SmartRouter's gates as inputs to that planner, plus any removal of the user's approval of the card. Name decision 1 as well as decision 3.
- **material**: The standing authorization relaxes the approval invariant (MZ `AGENTS.md:8`; jobs:428). Q2 recommends a run that ends in a PR. Step 1: project memory "is the orchestrator's durable ledger".
  - Problem: The standing authorization collides with several more approved rules, and Q2 does not list them.
- jobs:473: "Every write to GitHub needs the user's approval" (approved Oct 2). Opening a PR without per-action approval supersedes it.
- jobs:476: background tasks "never bypass the existing exact command approval".
- project-memory.md:40-42 and :243: plan and task records written by a model stay `proposed` and are never read into a run until the user accepts them. Project memory therefore cannot carry an autonomous plan-to-build handoff as designed.
- review:244-246: method authorization labels such as `user-confirmed` (MZ `src/shared/params.ts:89-91`) have no reader in `src/`. A "standing approval" method gets no enforcement from its label.
  - Correction: In Q2, list each prior decision the standing authorization would supersede (jobs:473, :476; project-memory.md:42, :243) so the user can decide each one. In step 2, require main-process code that enforces the grant and the stop-list, not a method label.
- **material**: §6 lists U-a (Anthropic rate limits, 429 behaviour, `usage` fields), U-b (per-model prices with cache and batch modifiers) and U-c (a conservative pre-send bound) as research "not answered here".
  - Problem: Moonzila already holds evidence for most of these.
- The provider-wire-formats corpus closes Anthropic usage (U-07) and rate-limit signals (U-16), including `retry-after` and the `anthropic-ratelimit-*` headers (BRIEF:65, :74, :219).
- The model-pricing-and-ranking corpus has per-model prices with cache and batch modifiers, dated 2026-10-02 (BRIEF:34-38).
- The 2026-10-12 Anthropic live probes measured streamed versus non-streamed usage (D4) and rate-limit headers (D3). They met no 429 (D8). They booked a conservative bound before each request: "input bound plus the whole max_tokens" (`docs/evidence/2026-10-12-anthropic-probes.md:259-261`).
- lead-orchestrator says to reuse an existing brief rather than collect again (`SKILL.md:101-102`).
  - Correction: For each U-, mark what is already CLOSED and cite the corpus row. Keep only the residue: price-list revision or effective-date publication, model read-back (U-d), parallel limits at a paid tier, and the probes' unmet 429 behaviour. Plan a refresh of the 2026-10-02 prices, not a new collection.
- **material**: "The spend is already signed: $1 per task, $20 per pilot (SR `tools/prices-2.json:69-75`)". Q3 recommends mirroring SmartRouter's signed caps.
  - Problem: The repos contradict each other on the Haiku model, and the report does not flag it.
- SmartRouter's signed rate sheet and adapter name "Claude Haiku 5.5" at $0.10/$0.50, with model id `claude-haiku-5-5` (SR `prices-2.json:36-38`; SR `dispatch_adapter.py:31`; SR `PHASE4_LIVE_START_PACKET.md:22`).
- Moonzila's primary-source shortlist (2026-10-05) lists only `claude-haiku-4-5-20251001` (shortlist BRIEF:47).
- Its pricing corpus gives Haiku 4.5 at $1/$5 (pricing BRIEF:34), and the 2026-10-12 live probes used `haiku-4-5`.
- If `claude-haiku-5-5` is wrong, the cloud-C arm of SmartRouter's live pilot fails or is mispriced. That affects readiness item 1.
  - Correction: Record both readings and do not average them. Add a verification step (the current Anthropic models and pricing pages) as a blocker of SmartRouter's live pilot and as part of U-b.
- **minor**: "Cost is checked after the money is spent. The call is sent first (:217), and the per-task and pilot cost caps are checked afterwards (:224, :230)."
  - Problem: This is partly overstated and partly incomplete.
- Overstated: a check runs before the send. The caller-supplied all-in bound is checked against the per-task cap (SR `tools/live_dispatcher.py:196-200`).
- Missed: a call that is sent and then rejected is logged with cost 0.0 (:153-154), and attempts and spend are not incremented (:224-237). Paid calls therefore go uncounted.
- Missed: `pilot_spent` lives only in memory (:110), and the CLI builds a new dispatcher for each call (:284-288). The $20 pilot cap is not enforced across invocations.
  - Correction: Restate: before sending, only the caller-supplied bound is checked against the per-task cap; amounts already spent are checked only after the send. Add the two missing defects to the list of SmartRouter fixes (item 2).
- **minor**: "Its live pilot has never made a real call (SR README.md:16)"; "Zero live calls."
  - Problem: README.md:16 and PROJECT_COMPLETION.md:16 say only "Open". No SmartRouter document says that zero calls were made. The pilot ledger is gitignored (SR `.gitignore:11`), so the clone cannot show calls either way.
  - Correction: Say "no live call is recorded in the repository", or mark it "not stated".
- **minor**: Finished criterion 2: put the 79-assertion decision suite into SmartRouter's commit gate.
  - Problem: The review found that the suite asserts constants it has just set (S13, SR `tests/smart_router_decisions.py:306-308`). It also found that `classify_terminal` ignores the verification status on advisory paths (:195-211), which mislabels outcomes (review:289-294). Both defects are still present at 582f0d3, so gating the suite alone proves little.
  - Correction: Add: fix S13, S17a/b and `classify_terminal` per review:289-294 before gating. Treat an exit 0 as no evidence for any Moonzila gate.
- **minor**: Step 0: "Phase 2 is still in design (MZ RUN.md:20)".
  - Problem: RUN.md:20 says "Phase 2 design ACTIVE", but the same ledger says otherwise:
- RUN.md:18: Design is DONE for Phase 2.
- RUN.md:7 and :27: U0 is committed (28395c5), and build wave 1 (U1-U3, in worktrees `build/mm-p2-u1..u3`) is running.
  - Correction: Say Phase 2 is in build wave 1, and note that RUN.md:20 is stale.
- **minor**: "Missions need all of these for their budgets anyway (MZ docs/specification/decisions.md:11)", and step 3: "Missions need it (decisions.md:11)".
  - Problem: decisions.md:11 (item 7) says only "count retries/summaries/delegations against budgets". Mission budgets are model-step budgets (source-plan.md:2291; MZ `src/shared/params.ts:140` `modelStepBudget`). No mission spec requires prices, revisions or reservations. The need for a cash budget comes from the user's Oct 12 stop-list (jobs:428). This weakens "most of the cost is shared".
  - Correction: Cite jobs:428 ("spending beyond budget") and SR `gates.md:43-56` as the drivers. Drop the claim that missions need cash accounting.
- **minor**: "Commands are not isolated ... (MZ src/renderer/components/ChangesPanel.tsx:68)"; "only accepted records reach a model (:41)".
  - Problem: Both locations are off:
- The file is `src/renderer/ChangesPanel.tsx`; there is no `components/` folder. Line 68 is correct.
- The accepted-records sentence is at project-memory.md:42, not :41.
  - Correction: Use `MZ src/renderer/ChangesPanel.tsx:68` and `project-memory.md:42`.
- **minor**: Worktrees versus guards: the symlinked `node_modules` (AGENTS.md:104) collides with write guards that "refuse symlinked path parts (MZ operations.ts:57-61)".
  - Problem: `operations.ts:57-61` checks only the parts of the path being written, so a `node_modules` symlink blocks writes only under `node_modules`. The guard that refuses any symlink anywhere in the tree is git inspection's `checkTree` (MZ `src/tools/git.ts:46`).
  - Correction: Cite `git.ts:46` (plus :14 and :67) as the real collision. Keep `operations.ts:57-61` only for writes into a linked folder.
- **minor**: "The skill's own pin d7c00f96 names a plan revision that has since drifted."
  - Problem: The review's point is different: d7c00f96 is a plan commit with no `skills/` folder, so on its own it cannot identify the skill's bytes (review:86-88). The plan's drift since then is two lines (a typo fix, `git diff --stat` d7c00f96..582f0d3).
  - Correction: Say the pin identifies a plan revision, not the skill bytes. Vendor the skill by content digest plus SmartRouter commit.
- **minor**: Proposed order (§3): project memory, then self-unblocking, then missions.
  - Problem: The Oct 3 adopted order puts the coding knowledge base as its own phase between project memory and missions (jobs:555-561). Neither jobs:430 nor the report says whether it moves or is dropped.
  - Correction: Flag the knowledge-base phase's place as open, or ask the user.
- **minor**: "Every phase that could run without real model calls is closed."
  - Problem: This contradicts the report's own table: Phase 2's independent review is outstanding (PHASE2_REVIEW_RECORD.md:51-52), and Phase 3's strict review is open (PROJECT_COMPLETION.md:49-51). The table also omits two related records:
- PROJECT_COMPLETION.md:12, the authoritative ledger per README.md:8, closes Phase 2 on validator evidence alone.
- MOONZILA_ADVISORY_UI.md:21 claims Phase 2 was "already separately reviewed".
  - Correction: Say the non-live phases are recorded as closed, with the independent reviews still outstanding. Cite PROJECT_COMPLETION.md:12 and MOONZILA_ADVISORY_UI.md:21 alongside the review record.
- **minor**: SmartRouter's deferred items are cited only for the paid classifier (plan:427).
  - Problem: plan:427 also defers "parallel teams", and Phase 8 admits concurrency only on measured need (plan:366). SmartRouter will not supply routing for parallel agents, which is the core of the user's orchestrator.
  - Correction: Note that SmartRouter defers parallel teams, so parallel orchestration rests on Moonzila's own design (source-plan.md:2290; decisions.md:12).
- **minor**: Q3: "rotate the exposed GitHub credentials (SR CREDENTIAL_ROTATION_RUNBOOK.md:45)".
  - Problem: Row 45 records plaintext credential files on the owner's Desktop, one of them a copy of the live `github.com` credential. It does not record a public exposure.
  - Correction: Say "replace the plaintext copies of the live GitHub credential and rotate it". Reserve "exposed" for a recorded leak.
