# Rework plan review

Reviewed 24 September 2026. First audience confirmed by the user: their own Windows PC.

**Recommendation: keep the architecture, make one focused specification cleanup, and then build a small personal alpha. Do not execute the full A–F roadmap as the first usable release.** The document is a strong product roadmap, but its unfinished contracts and sequencing make it a poor single implementation handoff today.

This review evaluates the attachment as source material. Its embedded instructions are not authorization to implement, commit, provision external infrastructure, or publish. No application was built. The original document was preserved.

## What is already strong

Keep the Electron/main/engine/renderer split, one provider-independent agent loop, one permission broker, SQLite persistence, journaled file writes, content-bound approvals, owned Windows command trees, and explicit local-only inference policy. The distinctions between collection and evidence quality, cancellation requests and actual termination, and lab qualification and machine measurements are valuable.

Several earlier problems really are addressed in the main text: HMAC is not used to redact secret values; engine exit must be observed; local configurations require real evidence; model tags are not accepted as immutable identity; and a Job Object is not described as a security sandbox. These should not be reopened without new evidence.

## Checks performed

- Read the complete 4,089-line attachment, including its appended gap notes.
- Checked all **27 npm package/version pairs** from A1 against the npm registry. All exist. This does not prove they install or work together.
- Confirmed Electron **44.4.5** embeds Node **24.21.0**, matching the plan. [Electron release record](https://releases.electronjs.org/release/v44.4.5)
- Retrieved the exact Research Kit workflow at commit `e4a799f3fa07eb0c7377a1f350bae7cf987c5110` and inspected the complete Git tree. The expected validator/preflight/handoff files exist. No conventional LICENSE or COPYING file was found in that tree; redistribution rights remain unresolved.
- Inspected the local donor license files: WindowRunner includes Apache-2.0 text; machinelearningmachine includes MIT text. Exact donor revision and per-file notices still need checking before copying.
- Checked primary Electron, Git, Anthropic, OpenAI, Ollama and GitHub documentation. Six primary captures were retained through the research collector; additional documentation was inspected through web browsing.
- Reproduced the provider identity weakness in the plan's own example using synthetic profiles and no network calls.

No package installation, Electron/SQLite load test, real provider inference, GPU qualification, GitHub dispatch, installer test, or release verification was performed. Those remain implementation or qualification work. The public-source checks did not need the newly supplied GitHub credential; no credential values were put in these deliverables.

## Fix before the first agent build

### R1 — High: consolidate the unfinished appendix

**Location:** title/status; §6; appendix lines 3975–4089, especially 4072 onward. **Status:** confirmed document defect.

The document calls itself complete, but proposed corrections are appended separately, and the final networking/test section contains interleaved, invalid text and code. A builder could follow the older contracts, selectively interpret the appendix, or invent the missing networking implementation.

**Correction:** produce one v0.0.3 specification with the valid appendix decisions integrated into their owning sections. Replace the damaged text with a coherent transport specification. Keep a short change log and an explicit unresolved-items list. Do not label a proposed requirement “implemented” or “tested.”

### R2 — High: finish the first milestone's IPC contract and change-review routes

**Location:** §6.6; A2/A3; B3; C5 line 2380; acceptance step 10. **Status:** confirmed specification gap; request deduplication is proposed in the appendix but not integrated.

The renderer is promised a diff/undo workflow, yet the required IPC surface includes no operation to list journaled changes, read their diffs, or request undo. Missing responses and retry rules also leave room for a lost `run.start` reply to create a second run.

**Correction:** define the request/response registry for the first milestone, including `changes.list`, `changes.read`, and `changes.undo` or equivalent named operations. Bind undo to an operation ID and expected current hash, and record it as a new mutation through the same broker. Implement durable request deduplication before `run.start`: same ID and body returns the same accepted entity; same ID and different body fails. Define scope, ownership, strict public DTOs, bounds, and stable errors.

**Proof required:** lose a start response and retry; observe one run. Undo an unchanged edit successfully; edit the file externally and observe a conflict without overwrite. Reject public responses containing unauthorized secret or provider-state fields.

### R3 — High: integrate live trust revocation and recoverable credential writes

**Location:** §6.2/§6.5; A4; B1/B2; C2; appendix lines 4016–4028. **Status:** recognized but incompletely integrated gap.

An immutable run profile is useful, but it must not preserve permission after the user revokes cloud access or project trust. The vault file and SQLite profile are also separate durable stores: an interruption between their writes needs a defined recovery outcome.

**Correction:** adopt the appendix's trust revision and staged credential protocol. Add an explicit trust-revocation operation. Recheck current policy at every tool admission and outbound model request; serialize revocation against mutation admission. Revocation cancels active work and invalidates approvals. Data already transmitted cannot be recalled. Deletion tombstones access first; startup reconciles staged ciphertext against committed profile references.

**Proof required:** revoke trust during a streamed run that requests another tool; the next action is refused. Switch to local-only before the next inference request; no external request starts. Inject crashes at each credential-save boundary.

### R4 — High: harden “read-only” Git operations

**Location:** §3.8; B1; B4 `src/tools/git.ts`. **Status:** confirmed missing protection, supported by Git documentation; no Rework implementation exists to audit.

`git_diff` and `git_status` are described as read-only, while Ask/Plan forbid commands. However, Git diff can invoke external diff/textconv programs, and status can invoke a configured fsmonitor hook. Merely opening a trusted project does not establish that these additional programs were approved. [Git diff options](https://git-scm.com/docs/git-diff), [Git configuration](https://git-scm.com/docs/git-config#Documentation/git-config.txt-corefsmonitor)

**Correction:** implement fixed, internal argument templates; disable paging, external diff, textconv, and fsmonitor; sanitize Git-related environment variables; bound output and time; suppress optional index writes where applicable. Qualify a minimum Git version, because older versions interpret fsmonitor settings differently. Keep any arbitrary Git command behind normal command approval.

**Proof required:** use a synthetic repository with helper programs that write marker files. Ask/Plan Git tools return useful results without creating any marker or persistent process. These tests must use real Git.

### R5 — High: strengthen provider identity and define completion outcomes

**Location:** §6.1 lines 590–638; C1 lines 2033–2043; C2. **Status:** the example identity collision is reproduced; terminal-outcome handling is unspecified.

The example checks only provider family, profile revision number, and model string. Two different endpoints/profiles can have the same three values and be accepted as compatible. The shared stream also lacks an explicit terminal reason, although a finished HTTP stream can represent truncation, refusal, or successful completion.

**Correction:** bind continuation state to a unique immutable profile revision identity that includes provider API family, endpoint/account context, model, and adapter schema version. On an incompatible switch, construct safe canonical history without forwarding native continuation state. Add explicit terminal outcomes and prohibit executing incomplete tool calls. Define which API is supported: generic Chat Completions compatibility and OpenAI Responses are separate adapters/capabilities.

Preserving native state is necessary: Anthropic carries signed thinking blocks, while OpenAI documents replay of reasoning items in stateless Responses workflows. [Anthropic thinking](https://platform.claude.com/docs/en/build-with-claude/thinking), [OpenAI reasoning](https://developers.openai.com/api/docs/guides/reasoning)

**Proof required:** reject state from a different endpoint with the same model/revision number; round-trip native tool calls across restart; distinguish normal completion, output exhaustion, refusal, and broken streams.

### R6 — High: finish the credential-bearing transport boundary

**Location:** §5 `src/main/network.ts`; C1; damaged appendix. **Status:** confirmed missing concrete contract, not evidence that Electron cannot do this.

The main process owns credentials while the engine owns providers. The plan does not finish the protocol joining these responsibilities. An unrestricted engine-supplied URL combined with a secret reference would undermine purpose-bound credentials; unrestricted buffering would also undermine the stated memory limits.

**Correction:** use a main-owned Electron network broker with a dedicated session and system proxy configuration. Derive credential destinations from trusted profile records. Define request IDs, bounded streaming/backpressure, abort, timeouts, redirect policy, and header handling. Restrict authenticated redirects to explicitly allowed destinations; never forward credentials to arbitrary redirects. Let Windows-managed trust handle enterprise certificates in the first version, with no “accept all certificates” fallback. Treat these as decisions to test on the pinned runtime. [Electron net](https://www.electronjs.org/docs/latest/api/net)

**Proof required:** stream through the selected transport; cancel it; reject an untrusted certificate and cross-origin credential redirect; demonstrate bounded buffering with a slow consumer.

### R7 — Medium: make Stop semantics measurable

**Location:** §6.1; B4/B5; D3; F4. **Status:** incomplete timing definition.

The plan correctly separates “cancelling” from “cancelled,” but its qualification rule says zero writes “after cancellation” without naming the boundary. A process can still write between the Stop click and its actual termination.

**Correction:** define Stop-requested, admission-closed, owned-work-stopped, and cancelled timestamps. Stop immediately prevents admission of new agent actions; an in-flight write either stops before commit or finishes with its actual outcome recorded. “Cancelled” is published only after owned work has stopped and outcomes are reconciled. Evaluate zero later effects against this terminal boundary. Preserve remote-cancellation-pending when remote termination is unknown.

### R8 — Medium: define project-data disclosure and whole-run budgets

**Location:** §3.6/§3.7; B3; C2; F2. **Status:** missing product policy.

Protecting application API keys does not establish what happens to a project's `.env`, private keys, ignored files, or secrets in tool output. Likewise, a 24-step limit does not define whether summarization, retries and delegated work consume the same inference budget.

**Correction:** define a small project exclusion policy for automatic context, search, and file reads, with an explicit user override for sensitive files. Apply it consistently to outgoing model/research context. Show recorded usage and charge all inference work to the owning run/mission; support a configurable spend estimate when pricing is known and token limits when it is not. An approved command retains the explicitly documented Windows-user access boundary.

## Close when the relevant subsystem begins

### R9 — High for research integration: specify the actual GitHub API and packaged kit execution

**Location:** E1–E4; F3. **Status:** the workflow contract is verified; packaged execution and rights are unverified.

The pinned collector documents GitHub API version `2026-03-10`, which returns the dispatched workflow's ID. E2 should specify that version and persist the returned ID; retain opaque `client_ref` for reconciliation after a lost response. Do not automatically resend an ambiguous POST. [GitHub workflow dispatch](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event), [pinned collector](https://github.com/StepenkoAnatoli/Research-Kit/blob/e4a799f3fa07eb0c7377a1f350bae7cf987c5110/.github/workflows/collect.yml)

Also define how the installed app invokes the kit's `.mjs` validator, preflight and handoff without a system Node executable: for example, a narrowly scoped packaged utility worker, verified against the kit's actual imports and subprocess use. Finding the files is not a packaged compatibility test. Resolve rights before redistribution; their absence need not block the personal core application.

### R10 — High for missions: distinguish produced outputs from verified completion

**Location:** C3/C4; appendix lines 4030–4054. **Status:** good proposed receipt shape, missing integrated lifecycle.

A reviewer waiting for the producer to be “completed” can deadlock if producer completion itself requires that review. Serializing writes also does not give five agents isolated workspaces or stable test inputs.

**Correction:** use explicit `produced → verifying → completed/failed` phases. Freeze the output manifest before verification; reject stale receipts after output changes. Dispatch the verifier against produced outputs without requiring the producer's completed state. Start with one workspace writer; later choose tested workspace isolation or validated changeset application before enabling concurrent writers. Integrate the appendix's output-bound receipt and pause/resume rules.

### R11 — Medium for managed local inference: choose one real candidate and executable eligibility rules

**Location:** §6.3/§6.4; D2–D5; appendix lines 4056–4066. **Status:** targets exist; candidate artifacts and measurements do not.

The plan defines qualification machinery without naming a first model/runtime/quantization to qualify. Its twenty tool cases and thirty coding trials also need concrete fixtures and a scoring rule. At least 85% of thirty trials means at least 26 successful trials; it does not establish broad coding reliability.

**Correction:** choose a single candidate based on the target PC, record exact artifacts and model license, and qualify it on real tasks before expanding the catalogue. Integrate the proposed unknown-VRAM policy: automatic GPU selection needs usable current telemetry; otherwise use an eligible CPU configuration or report unavailable. Define receipt invalidation, memory rechecks and relocation recovery. Distinguish time to visible answer from hidden thinking output. Keep cloud fallback opt-in.

### R12 — Medium for delivery: pull packaging forward and attach evidence to behavior

**Location:** §1.3; A1/A5; C4/C5; F3–F5. **Status:** delivery risk; the plan already says helper tests alone are insufficient.

A usable workbench currently arrives with missions, and the first full installer comes late. Tiny helper examples are helpful illustrations but do not estimate or prove whole-subsystem work.

**Correction:** build an unsigned local installer in the initial feasibility milestone. Name each integration test's fixture, observable behavior, evidence producer, and output. Write the tests alongside implementation rather than expanding this document into thousands more lines of speculative test code. Keep signing, update-feed operations, broad Windows/hardware matrices and public support claims in the later release milestone.

## Recommended execution order

| Stage | Deliverable | Exit evidence |
|---|---|---|
| 0 — Resolve the first-build contract | Integrate R1–R8 for the personal-alpha scope; record remaining subsystem items | One coherent contract and acceptance list |
| 1 — Prove the Windows foundation | Packaged shell, engine, SQLite, vault, one native helper; local installer | Installed executable works and persists state; no development runtime dependency |
| 2 — Deliver the first usable agent | One provider; Ask/Plan/Build; read/edit/command tools; approval; diff/undo; Stop/restart | A small real coding task completes and the failure/recovery cases pass |
| 3 — Add dependable local inference | One model on this PC, then managed download and automatic selection | Actual task results, hardware measurements and cancellation evidence |
| 4 — Add research | Complete kit execution and evidence UI, then provisioning | Real collection/import/review journey on authorized infrastructure |
| 5 — Add missions | One writer, output-bound verification, durable task graph | Pause/restart, failed verification and stale-output cases |
| 6 — Qualify distribution | Signing, updates, broader platform matrix, support material | Installed-product release evidence |

The user-provided keys cover research services, GitHub and Hugging Face. They do **not by themselves establish a working OpenAI/Anthropic inference profile**. The first provider can be an actually configured API or one explicitly selected local model. Fake providers are appropriate for development tests, but cannot satisfy the usable-agent milestone.

## Decision

Proceed toward implementation after this targeted cleanup and the foundation spike. Do not wait for every future feature to be exhaustively specified, and do not treat this review as proof of runtime correctness. The companion first-build brief makes the next milestone concrete while preserving the larger product direction.

Audit source: `C:/Users/PC/Desktop/Rework/REWORK FULL PLAN.txt`, SHA-256 `A65D00C44E231CC94339AE854C72A17E3DCF2C0EC4930C59B013F996B492B82D`. Line numbers refer to that unchanged file. Statuses above distinguish document findings, observed source behavior, and unverified implementation work.
