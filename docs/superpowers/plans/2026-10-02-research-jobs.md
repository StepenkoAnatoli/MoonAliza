# Research jobs and review implementation plan

**Status:** proposed for user review, not approved and not started. This is Stage 2 of the [integration review](../../specification/research-kit-integration-review.md), building on the [offline consumer](../../specification/research-kit-offline.md). Decisions D1–D4 below need the user's answer before Task 1 begins.

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

1. [ ] **Revise contracts.** Replace the declared research methods with: `research.start` (topic, queries, URLs, preferred domains, depth, page budget), `research.read`, `research.cancel`, `research.review.start` and `research.purge`. Collector settings and the token move to a main-only setup method with no secret in its response. Normalise `research.status` to the job states below. Write failing contract tests first, including rejection of secrets in any research payload.
2. [ ] **Durable job state.** A schema v3 migration for job identity and dispatch columns, or a strict typed `state` document if columns are unnecessary, with a tested v2→v3 upgrade. States: `queued → dispatching → collecting → collected → reviewing → approved | not_ready`, plus `failed`, `cancelling` and `cancelled`. Every transition is revisioned and journaled before its effect.
3. [ ] **Owned collection process.** Main runs the pinned `collect-remote.mjs --json` with fixed arguments, the token as its only credential, bounded output and the run id captured before waiting. Map exit codes 0–4 to job states. Use `--run-id` for resume after restart or timeout. Test dispatch, resume, Stop mid-wait, timeout, invalid package, failed run, missing token and redaction of tokens in output. Tests use a local fake GitHub API at the network boundary, not a fake collector.
4. [ ] **Verified import.** Pass downloaded packages through the existing adapter with the recorded binding (clientRef, repository, ref, commit, workflow, run id, attempt). Store the digest, validator identity and job revision on the job, and reject packages from a different run.
5. [ ] **Review (per D3).** Under (a): materialise the verified corpus into a private research workspace and run an agent review with exact edit approvals. Then run the kit's preflight and `artifact.mjs create`, and validate the new package as above. Readiness is shown only from that validation. Test a passing review, a failing gate, tampering between review and packaging, and restart mid-review.
6. [ ] **Renderer.** A research panel per project: start form showing what becomes public, live status, evidence and brief reader (bounded, rendered as untrusted text), review progress and actionable failures (missing kit, missing token, collection failed, review required, invalid evidence, stale, ready). No "authorize" control.
7. [ ] **Delivery.** Typecheck, lint, full tests, build/runtime and desktop journeys (start, restart mid-collection, cancel, review to ready). Package the Windows app, update the handoff, development status and release record, scan for secrets, push and open the phase PR, and verify exact-head Windows CI. The user merges.

## Acceptance

- With research off, all existing tests and desktop journeys pass unchanged.
- A job survives restart at every state and never dispatches twice.
- No token appears in the database, events, logs, renderer state or PR artifacts.
- `approved` is reachable only through the kit's own gate and a fresh validation of exact bytes. No MoonAliza control can produce it.
