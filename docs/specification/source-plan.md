# Rework Windows Desktop Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Document version: 0.0.2
Date: 2026-09-24
Status: Consolidated implementation specification; application implementation and release qualification remain to be completed.

Goal: Build a professional Windows desktop application with its own durable coding-agent engine, interchangeable API and local models, automatic hardware-aware local configuration, research, skills, teams, missions, and an installable Windows executable.

Architecture: Electron hosts a packaged React interface and a narrow, validated preload bridge. A separate engine process owns conversations, tools, permissions, research, scheduling, and SQLite persistence. Replaceable inference providers supply model responses, while an owned Windows helper supervises commands and collects hardware information.

Tech Stack: Windows x64; Electron; React; TypeScript; SQLite; Zod; esbuild; Vitest; Testing Library; Playwright; C++17 and Windows APIs; electron-builder with NSIS; managed Ollama for initial local inference.

Spec: This document is the complete product specification and implementation plan. Earlier conversations and gap-analysis documents are background only.

Intended implementation directory: rework-desktop/

Intended plan location after creating the implementation repository:
docs/superpowers/plans/2026-09-24-rework-final.md

---

# 1. Authority, scope, and execution rules

## 1.1 Document authority

This document replaces the earlier Rework implementation plans.

Do not carry forward conflicting instructions from previous versions. In particular:

- Do not configure the Research Kit environment marker as a repository variable.
- Do not give the permanent research credential provisioning permissions.
- Do not install only the Research Kit workflow while omitting the code it imports.
- Do not use `client_ref` as a file path or invent an oversized-brief upload mechanism.
- Do not implement credential redaction by comparing text with HMAC fingerprints.
- Do not assume setting `NODE_OPTIONS` configures the packaged Electron engine's V8 heap.
- Do not assume `UtilityProcess.kill()` blocks until the child exits.
- Do not use fire-and-forget `taskkill /T` as ordinary process supervision.
- Do not require a 300-character filename component to succeed.
- Do not declare Vulkan absent from an Ollama package without inspecting the exact package.
- Do not select a machine configuration using incomplete qualification records.
- Do not treat a checkpoint boolean as sufficient authorization to install an update.
- Do not treat schema-valid evidence as proof that a benchmark actually ran.

## 1.2 Scope organization

The application spans several independent subsystems. Keep one portable handoff document, but execute six subsystem plans:

1. A — Foundation, contracts, persistence, credentials, and desktop shell.
2. B — Permissions, filesystem operations, command ownership, and recovery.
3. C — Providers, agent execution, context, skills, teams, and workbench UI.
4. D — Local inference, hardware probing, qualification, and model management.
5. E — Research Kit provisioning, collection, evidence, and review.
6. F — Updates, diagnostics, installer, qualification, and release evidence.

Each subsystem contains five tasks and ends with a working, testable milestone.

The tasks are review units. Within a task, implement its listed behaviors through small red–green cycles. A task is not complete merely because its first example test passes.

## 1.3 Implementation sequence

Execute A → B → C → D → E → F.

The following dependencies are mandatory:

- Validated shared contracts precede their consumers.
- The store and operation journal precede mutating tools.
- Permission enforcement precedes exposing tools to a model.
- Command ownership precedes command cancellation tests.
- Provider round-trip tests precede real provider use.
- Lab receipt definitions precede automatic local selection.
- Runtime/backend verification precedes issuing machine receipts.
- Research provisioning precedes collection integration.
- Research artifact integrity precedes evidence review.
- Global quiescence precedes application installation or migration.
- Installed-application tests precede production release claims.

## 1.4 Work discipline

- Inspect the current branch and Git status before consequential Git operations.
- Preserve unrelated files and changes.
- Create the new application inside `rework-desktop/`.
- Do not transform either donor project in place.
- Commit only files and hunks created or changed for the current task.
- Keep commits small and describe the behavior introduced.
- Use fake services for ordinary tests.
- Use actual Windows processes for process-ownership tests.
- Use actual hardware and models for qualification.
- Record failed checks honestly.
- Do not publish, push, sign a public release, or modify external repositories merely because application implementation was requested.

A plan requirement can be fully specified before implementation. It cannot be marked implemented or verified until its required evidence exists.

---

# 2. Global Constraints

These requirements apply to every task.

- G01: The delivered product is a Windows x64 desktop application with a per-user `.exe` installer.
- G02: The production interface loads packaged assets and does not require a browser window or a local HTTP UI server.
- G03: End users do not need Node.js, Python, a compiler, or a terminal to install and use the application.
- G04: The application owns the agent engine independently of any model provider.
- G05: API and local inference use the same canonical conversation and tool contracts.
- G06: A local-only project never switches to cloud inference automatically.
- G07: Research-network permission and inference-provider permission are separate settings.
- G08: Automatic model selection chooses a qualified model, runtime, backend, quantization, context limit, and concurrency configuration.
- G09: Unknown hardware measurements remain unknown; they are not converted to zero or treated as reliable capacity estimates.
- G10: Skills, model output, repository instructions, and research pages cannot grant permissions.
- G11: Every mutating operation has an application-generated identity and a durable execution record.
- G12: Completed external operations are not repeated automatically after an ambiguous interruption.
- G13: Approval is bound to the project, operation, inputs, applicable file versions, and permission-policy revision.
- G14: API keys and tokens are encrypted at rest and are excluded from transcripts, diagnostic exports, and ordinary logs.
- G15: Only the application's owned processes may be terminated by its process supervisor.
- G16: A successful research collection does not establish sufficient evidence or authorize a research-dependent build.
- G17: The original projects and unrelated user changes remain intact.
- G18: Unit and integration tests use fake services and synthetic projects; they do not require real API credentials.
- G19: Production model qualification requires actual measurements and cannot be satisfied by mock responses.
- G20: Production release signing, publishing credentials, and benchmark results must never be fabricated.
- G21: Code and dependency versions are pinned; changes to a pinned version require recorded verification.
- G22: No release, repository push, or public publication occurs merely because an agent has been instructed to build the application.
- G23: A timeout does not prove that an external operation stopped.
- G24: Imported source material cannot change the application's trusted instruction or permission state.
- G25: Application updates activate only after admission of new work has stopped and existing owned work has reached a verified safe state.
- G26: Production support claims apply only to configurations represented by retained qualification evidence.
- G27: Secrets are never transmitted to the renderer through a credential-retrieval API.
- G28: A demonstration, mock, or minimal example cannot satisfy the Definition of Done for a production feature.

---

# 3. Product specification

## 3.1 Product identity

Working name: Rework.

Initial supported platform:

- Windows x64.
- Windows 10 22H2 and Windows 11, subject to successful qualification of the selected Electron and local-runtime releases.
- Local fixed-drive workspaces.
- API inference.
- Qualified CPU and NVIDIA local configurations.
- Other GPU configurations only when their exact runtime/backend combinations pass qualification.

Do not advertise Windows ARM, macOS, Linux, network-drive workspaces, or arbitrary GPU support in the first release.

## 3.2 Main journey

1. Install Rework using a per-user installer.
2. Launch a normal application window.
3. Open or create a project folder.
4. Review and accept project trust.
5. Add an API profile, enable a local model, or configure both.
6. Enter a request and select a mode.
7. Observe model output, tools, approvals, research, and changes.
8. Inspect results and recorded file changes.
9. Continue the conversation or mission after restarting Rework.

The application must launch without credentials or downloaded models.

## 3.3 Modes

| Mode | Behavior |
|---|---|
| Ask | Read trusted project context and answer questions. |
| Plan | Read and research as permitted; produce a plan without project mutations or commands. |
| Research | Collect, inspect, compare, and synthesize external evidence. |
| Build | Execute the user's task through the permission broker. |
| Mission | Execute a durable, bounded task graph with dependencies, verification, and checkpoints. |

Mode restrictions are enforced in code.

## 3.4 What “our own agent” means

Rework owns:

- Agent execution.
- Tool definitions.
- Permission decisions.
- Context management.
- Memory and persistence.
- Research orchestration.
- Skills.
- Team coordination.
- Missions.
- Recovery.
- User experience.

A model is a replaceable inference component.

Initially use API providers and qualified open-weight models. A later in-house model or fine-tune enters through the same provider/import/qualification interfaces.

Training or fine-tuning a foundation model is outside this application project.

## 3.5 Interface

Window:

- Default: 1440 × 960.
- Minimum: 960 × 640.
- Left sidebar: projects, conversations, missions, settings.
- Main pane: conversation or mission activity.
- Right pane: changes, research evidence, task details, approvals.
- Bottom status area: provider/model, connectivity, resource state, run status.

At narrow widths, the right pane becomes a drawer.

Required states:

- First-run onboarding.
- No project.
- Untrusted project.
- Missing or moved project.
- No provider configured.
- Local setup downloading.
- Local setup probing.
- Local model unavailable.
- Running.
- Awaiting approval.
- Awaiting research review.
- Cancelling.
- Remote cancellation pending.
- Interrupted.
- Recovering engine.
- Offline.
- Update available.
- Update waiting for work to stop.
- Storage full.
- Recoverable rendering failure.

Design:

- Segoe UI interface font.
- Cascadia Mono or Consolas for code.
- System light/dark preference with manual override.
- Semantic color tokens.
- Accessible SVG icons.
- Visible keyboard focus.
- Reduced-motion support.
- High-contrast support.
- Virtualized activity history.
- Collapsible reasoning summaries.
- No executable HTML in model or research Markdown.
- No implementation jargon in ordinary user flows.

Keyboard:

- Ctrl+N: new conversation.
- Ctrl+O: open project.
- Ctrl+K: command palette.
- Ctrl+Enter: submit.
- Escape: close dialog/drawer.
- A visible, keyboard-accessible Stop button during work.

## 3.6 Initial budgets

| Limit | Default |
|---|---:|
| Ordinary model steps | 24 |
| Ordinary run duration | 20 minutes |
| Command timeout | 120 seconds |
| Captured command output | 256 KiB total |
| Ordinary text-file read | 2 MiB |
| Queued local inference requests | 20 |
| Managed local inference concurrency | 1 |
| Concurrent mission agents | 5 |
| Mission model-step budget | 120 |
| Automatically selected skills | 3 |
| Skill body | 16 KiB |
| Research pages per collection | 10 |
| Active remote research jobs per project | 1 |
| Automatic follow-up collections per research task | 2 |
| Research deadline | 15 minutes |
| File-undo storage per project | 256 MiB |

Advanced settings may change documented ranges. They cannot remove permission checks, privacy rules, or process ownership.

## 3.7 Privacy and permissions

New projects default to local-only inference until the user allows an external provider.

“Local-only inference” describes inference routing. It does not claim that approved commands are network-isolated or that approved research is offline.

Treat externally configured endpoints as external providers unless their local execution properties are verified. A loopback URL alone does not prove that its server never forwards requests to a cloud service.

Ordinary command execution runs as the Windows user. A working directory and a Job Object do not create a filesystem or network sandbox.

Show that boundary in the command-grant interface.

## 3.8 Tools

Initial tools:

- list_files
- read_file
- search_files
- write_file
- edit_file
- run_command
- git_status
- git_diff
- read_skill
- search_history
- research_start
- research_status
- research_read

There is no automatic publishing, Git push, administrator, or Git commit tool in v1.

Git is an optional external prerequisite. Missing Git disables Git tools with `GIT_UNAVAILABLE`; it does not prevent ordinary file editing or application startup.

---

# 4. Reconnaissance and reuse

Inspect these sources before porting code:

| Source | Purpose |
|---|---|
| WindowRunner-main/packages/server/src/providers/types.ts | Provider contracts. |
| WindowRunner-main/packages/server/src/providers/openai-compatible.ts | Streaming OpenAI-compatible adapter. |
| WindowRunner-main/packages/server/src/providers/anthropic.ts | Native Anthropic adapter. |
| WindowRunner-main/packages/server/src/providers/sse.ts | Incremental stream parsing. |
| WindowRunner-main/packages/server/src/providers/retry.ts | Retry reference. |
| WindowRunner-main/packages/server/src/agent/loop.ts | Tool-loop reference. |
| WindowRunner-main/packages/server/src/project-root.ts | Filesystem boundary reference. |
| WindowRunner-main/packages/desktop/electron-builder.yml | Windows packaging reference. |
| machinelearningmachine-main/machinelearningmachine/agents/base.py | Role orchestration concepts. |
| machinelearningmachine-main/machinelearningmachine/topologies/ | Team topology concepts. |

Observed source revisions:

```text
WindowRunner:
b50ff36756ccf00e6554f7d020d43627b3feadc8

machinelearningmachine:
05474a5237fb00bda7e5da87510e900643b79c77

Research-Kit:
e4a799f3fa07eb0c7377a1f350bae7cf987c5110

pc-capability-check:
eeade98c7fb4aa12eec21f05a368d2ce0e63f72a
```

Repositories:

```text
https://github.com/StepenkoAnatoli/WindowRunner
https://github.com/StepenkoAnatoli/machinelearningmachine
https://github.com/StepenkoAnatoli/Research-Kit
https://github.com/StepenkoAnatoli/pc-capability-check
```

Reuse policy:

- Preserve applicable licenses and notices.
- Verify the actual revision before copying.
- Port provider parsing and tests selectively.
- Rebuild application orchestration in TypeScript.
- Treat the capability-check project as reference material.
- Do not carry forward plaintext credential storage or browser-server assumptions.
- Do not assume donor provider contracts already support reasoning signatures.
- Do not bundle Research Kit code without documented redistribution rights.

If Research Kit redistribution permission is absent, mark that dependency blocked for distribution. Continue independent work, but do not silently replace only part of the kit and claim full preflight compatibility.

---

# 5. File structure and responsibilities

All paths below are relative to `rework-desktop/`.

```text
package.json
package-lock.json
tsconfig.json
vitest.config.ts
playwright.config.ts
eslint.config.mjs
electron-builder.yml
THIRD_PARTY_NOTICES.md

.github/workflows/ci.yml

buildResources/icon.ico

scripts/
  build.mjs
  verify-release.mjs
  qualify-model.mts
  fetch-catalogue-locks.mts

src/shared/
  contracts.ts          Canonical domain types.
  protocol.ts           Renderer request envelope.
  params.ts             Exact request schemas.
  events.ts             Versioned event schemas.
  host.ts               Main/engine capability protocol.
  errors.ts             Stable public errors.

src/main/
  index.ts              Application lifecycle and windows.
  ipc.ts                Sender authentication and routing.
  bridge.ts             Engine messages and renderer events.
  supervise.ts          Engine ownership and restart policy.
  vault.ts              Encryption and trusted redaction.
  projects.ts           Native folder selection and trust.
  network.ts            Proxy resolution and host network services.
  updates.ts            Update download and quiescent installation.

src/preload/
  index.ts              Minimal renderer-facing API.

src/engine/
  index.ts              Engine boot.
  application.ts        Application services and request handlers.
  store.ts              SQLite ownership and transactions.
  migrations.ts         Ordered schema migrations.
  loop.ts               Agent execution.
  context.ts            Context construction and summaries.
  history.ts            History search and complete interaction groups.
  policy.ts             Mode and privacy policy.
  approvals.ts          Approval lifecycle.
  operations.ts         Durable operation journal.
  recovery.ts           Interrupted-work reconciliation.
  scheduler.ts          Resource leases.
  quiescence.ts         Admission freeze and drain protocol.

src/tools/
  paths.ts              Project path authority.
  files.ts              Read/search/edit/write behavior.
  commands.ts           Owned command wrapper.
  git.ts                Read-only Git integration.
  registry.ts           Tool schemas and broker mapping.

src/providers/
  profiles.ts           Versioned profile records.
  factory.ts            Policy-aware construction.
  openai.ts             OpenAI-compatible adapter.
  anthropic.ts          Anthropic adapter.
  ollama.ts             Native Ollama adapter.
  transport.ts          HTTP, proxy, TLS, cancellation.
  wire-state.ts         Provider-specific continuation state.

src/models/
  catalogue.ts          Signed activation-set validation.
  download.ts           Resumable verified downloads.
  runtime.ts            Owned runtime lifecycle.
  hardware.ts           Hardware normalization and fingerprints.
  qualify.ts            Qualification receipts.
  select.ts             Probe ordering and machine selection.
  import.ts             User-owned model import.

src/research/
  provision.ts          GitHub setup and contract inspection.
  policy.ts             Disclosure, depth, and budgets.
  github.ts             Dispatch/poll/cancel API.
  corpus.ts             Artifact verification and import.
  coverage.ts           Question and contradiction coverage.
  review.ts             Content-bound human review.
  service.ts            Research lifecycle.

src/skills/
  load.ts               Metadata/body parsing.
  select.ts             Deterministic selection.
  instructions.ts       Prompt assembly without authority changes.

src/missions/
  graph.ts              Graph validation.
  topologies.ts         Bounded preset expansion.
  presets.ts            Versioned presets.
  run.ts                Durable mission scheduling.

src/diagnostics/
  redact.ts             Non-secret pattern defenses.
  export.ts             Previewed redacted ZIP export.

src/renderer/
  index.html
  index.tsx
  App.tsx
  state.ts
  styles.css
  Onboarding.tsx
  Conversation.tsx
  ApprovalPanel.tsx
  ChangesPanel.tsx
  ModelsPanel.tsx
  ResearchPanel.tsx
  MissionsPanel.tsx
  SettingsPanel.tsx

native/
  CMakeLists.txt
  host.cpp
  hardware.cpp
  hardware.hpp

resources/
  models/catalogue.json
  runtime/manifest.json
  qualification/lab-receipts.json
  research/workflow-contract.json

vendor/
  windowrunner/providers/
  research-kit/

tests/
  contracts.test.ts
  store.test.ts
  vault.test.ts
  bridge.test.ts
  policy.test.ts
  paths.test.ts
  tools.test.ts
  journal.test.ts
  providers.test.ts
  loop.test.ts
  context.test.ts
  skills.test.ts
  missions.test.ts
  hardware.test.ts
  download.test.ts
  selection.test.ts
  scheduler.test.ts
  research-provision.test.ts
  research-jobs.test.ts
  corpus.test.ts
  research-review.test.ts
  migrations.test.ts
  diagnostics.test.ts
  release.test.ts
  ui.test.tsx

e2e/
  desktop.spec.ts
  agent.spec.ts
  models.spec.ts
  research.spec.ts
  missions.spec.ts
  installer.spec.ts

docs/
  architecture.md
  permissions.md
  model-qualification.md
  research-integration.md
  release.md
  support.md
```

Add files only for an identified responsibility. Do not introduce a second permission broker, a second authoritative conversation store, or a separate agent loop for local models.

---

# 6. Shared contracts and architectural invariants

## 6.1 Canonical inference contracts

Create these in `src/shared/contracts.ts`.

```ts
export type Mode = "ask" | "plan" | "research" | "build" | "mission";

export type RunStatus =
  | "queued"
  | "running"
  | "awaiting_approval"
  | "awaiting_review"
  | "cancelling"
  | "completed"
  | "failed"
  | "cancelled"
  | "interrupted";

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
  inputError?: string;
}

export interface ProviderWireState {
  provider: "openai" | "anthropic" | "ollama";
  profileRevision: number;
  model: string;
  schemaVersion: 1;
  data: unknown;
}

export interface Message {
  id: string;
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: ToolCall[];
  wireState?: ProviderWireState;
  partial?: boolean;
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export type ModelChunk =
  | { type: "text_delta"; text: string }
  | { type: "thinking_delta"; text: string }
  | { type: "tool_call"; call: ToolCall }
  | { type: "wire_state"; state: ProviderWireState }
  | {
      type: "usage";
      inputTokens?: number;
      outputTokens?: number;
    };

export interface ModelRequest {
  messages: Message[];
  tools: ToolSpec[];
  contextLimit: number;
  outputLimit: number;
}

export interface ModelProvider {
  stream(
    request: ModelRequest,
    options: { signal: AbortSignal },
  ): AsyncIterable<ModelChunk>;
}
```

Rules:

- Display reasoning text separately from final assistant text.
- Preserve provider-required continuation blocks and signatures losslessly.
- Validate `wireState.data` using the owning adapter's schema.
- Never send one provider's wire state to another provider.
- Do not reconstruct signed thinking blocks from displayed text.
- Preserve complete tool interaction groups when trimming history.
- A profile is immutable for the duration of a run.
- A later run may use another profile and must recalculate its context budget.
- Image input is outside v1; vision-capable models are used as text models.

## 6.2 Operations and approvals

```ts
export interface ProjectPolicy {
  revision: number;
  inference: "local-only" | "cloud-allowed";
  research: "off" | "public-technical" | "private-connected";
}

export interface Operation {
  id: string;
  runId: string;
  projectId: string;
  kind: "read" | "write" | "command" | "research";
  inputHash: string;
  policyRevision: number;
  status: "prepared" | "started" | "completed" | "failed" | "unknown";
}

export interface Approval {
  operationId: string;
  projectId: string;
  inputHash: string;
  policyRevision: number;
  decision: "allow" | "deny";
}
```

Operation hashes include all execution-relevant data.

For writes:

- Canonical project identity.
- Relative path.
- Expected before hash.
- Proposed after-content hash.
- Encoding and newline policy.
- Relevant policy revision.

For commands:

- Resolved executable path.
- Argument vector.
- Working directory.
- Explicit environment.
- Timeout and output limits.
- Relevant policy revision.

Approving `npm test` approves the script's current behavior. It does not prove that nested scripts or hooks are harmless.

## 6.3 Hardware and qualification

```ts
export type Backend = "cpu" | "cuda" | "vulkan" | "rocm";

export interface Hardware {
  fingerprint: string;
  totalRamBytes: number;
  availableRamBytes: number;
  adapters: Array<{
    id: string;
    vendorId: number;
    deviceId: number;
    dedicatedBytes: number;
    availableBytes: number | null;
    driver: string | null;
  }>;
}

export interface ConfigurationIdentity {
  modelDigest: string;
  runtimeDigest: string;
  backend: Backend;
  quantization: string;
  contextTokens: number;
  parallelism: 1;
}

export interface LabReceipt extends ConfigurationIdentity {
  id: string;
  schemaVersion: 1;
  suiteVersion: string;
  quality: number;
  toolsPassed: boolean;
  unauthorizedEffects: number;
  writesAfterCancellation: number;
  labHardwareFingerprint: string;
  qualifiedAt: string;
  evidenceDigest: string;
}

export interface MachineReceipt extends ConfigurationIdentity {
  id: string;
  schemaVersion: 1;
  receiptKind: "machine";
  labReceiptId: string;
  activationSetId: string;
  hardwareFingerprint: string;
  observedBackend: Backend;
  adapterIds: string[];
  requiredRamBytes: number;
  requiredVramBytes: number | null;
  loadLatencyMs: number;
  firstTokenMs: number;
  tokensPerSecond: number;
  toolsPassed: boolean;
  quality: number;
  measuredAt: string;
}
```

Rules:

- Lab receipts certify quality and tool behavior for exact configuration identities.
- Machine receipts certify operation on the user's actual hardware.
- A fresh installation uses lab-qualified candidates to plan probes.
- `selectLocal` selects machine receipts only.
- Lab receipts must not require the user's hardware fingerprint.
- A backend mismatch invalidates a probe.
- Unknown VRAM remains unknown.
- Multi-GPU free-memory values are not added together without a qualified sharding configuration.
- Initial managed concurrency is one.
- A future concurrency increase requires a separate measured configuration and scheduler change.

## 6.4 Signed activation sets

A local activation set contains:

- Set ID and monotonically increasing sequence.
- Supported application version range.
- Catalogue schema version.
- Runtime manifest digest.
- Model manifest/blob digests.
- Lab receipt digests.
- Backend inventory for each runtime archive.
- Signature metadata.
- Expiry or refresh policy.

Validate the signature against a bundled trusted public key before using its contents.

Model/catalogue/runtime updates activate a complete compatible set atomically. Do not activate a new runtime with stale lab receipts.

Retain the last-known-good set for recovery.

Key rotation and emergency revocation are delivered through a trusted application update. Private signing keys never ship with the application.

## 6.5 Host credential capabilities

Credential access is purpose-bound.

Allowed purposes:

- An active inference run.
- An explicitly requested provider test.
- Research provisioning.
- An active research job.
- Trusted redaction.

The main process validates the caller's engine epoch, purpose, context identity, secret reference, and lifecycle state.

Redaction is a main-process service returning sanitized text. HMAC fingerprints are audit identifiers only.

JavaScript strings cannot be reliably zeroized. Minimize plaintext lifetime and copies; do not claim guaranteed zeroization.

## 6.6 IPC methods

Define one strict Zod parameter schema for each method.

Required surface:

```text
project.pick
project.list
project.trust
project.relink
project.forget
project.policy.update

session.create
session.list
session.read
session.delete

run.start
run.cancel
run.events

approval.decide

profile.list
profile.save
profile.test
profile.delete

model.list
model.enable
model.cancel
model.import
model.remove
model.storage.change

research.provision
research.start
research.read
research.cancel
research.review
research.purge

skill.list

mission.create
mission.read
mission.pause
mission.resume
mission.cancel

settings.read
settings.save

diagnostics.export
external.open
```

Schemas must reject unknown fields.

Native pickers issue opaque project/import/export references. The renderer cannot submit arbitrary filesystem roots, output paths, executable paths, or secret-retrieval requests.

`run.events` parameters:

```ts
{
  runId: string;
  after: number; // integer >= 0
  limit: number; // integer 1..1000, default 500
}
```

Response:

```ts
{
  events: RunEvent[];
  hasMore: boolean;
}
```

Live activity uses push events. Pull requests are for replay and pagination.

## 6.7 Durable events

```ts
export interface RunEvent {
  schemaVersion: 1;
  engineEpoch: string;
  runId: string;
  seq: number;
  type: string;
  payload: unknown;
  at: number;
}
```

Every event type and payload has a schema.

- Sequence numbers are durable and monotonic within a run.
- Persist before publishing an event.
- Reconnection replays after the last acknowledged sequence.
- Duplicate events are ignored.
- Sequence gaps trigger replay.
- Messages from an old engine epoch cannot authorize actions.
- Slow renderers cannot cause unbounded engine queues.

## 6.8 Global quiescence

Updates use a drain protocol:

1. Main issues `prepareForUpdate(epoch)`.
2. Engine rejects new runs, tools, missions, downloads, and local leases.
3. Active work completes or follows the ordinary Stop path.
4. Operation outcomes and remote-job identities are persisted.
5. Local leases are released.
6. Owned command/runtime work is stopped as required.
7. Store transactions and journal writes finish.
8. Engine emits `quiescent(epoch, finalSequence)`.
9. Main validates the current epoch and waits for engine exit.
10. Only then may installation proceed.

A stale checkpoint, completed individual task, or timeout is not a quiescence receipt.

---

# A. Foundation Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Goal: Deliver a secure desktop shell with validated contracts, durable storage, and encrypted credentials.

Architecture: Main owns OS capabilities and credentials; the utility engine owns application state; the renderer has no direct system access.

Tech Stack: Electron, React, TypeScript, SQLite, Zod, Vitest, Playwright.

Spec: Sections 1–6.

Global Constraints: G01–G28 apply unchanged.

## Task A1: Establish the reproducible scaffold

Type: Setup.

Files:

- Create: package.json
- Create: package-lock.json
- Create: tsconfig.json
- Create: vitest.config.ts
- Create: playwright.config.ts
- Create: eslint.config.mjs
- Create: scripts/build.mjs
- Create: .github/workflows/ci.yml
- Create: .gitignore

Interfaces:

- Produces: build, typecheck, lint, test, test:e2e, native:build, package:win, package:release.

Definition of Done:

- Dependencies are installed with exact versions and a committed lockfile.
- CI runs on Windows.
- No source project is modified.
- Dependencies and runtime compatibility are recorded.
- New libraries require explicit addition to the dependency record.

Baseline pins carried from the reviewed plan:

```json
{
  "dependencies": {
    "@tanstack/react-virtual": "3.14.13",
    "better-sqlite3": "13.0.3",
    "electron-updater": "6.8.9",
    "markdown-it": "15.0.2",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "yauzl": "3.4.0",
    "zod": "4.6.5"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@playwright/test": "1.63.0",
    "@testing-library/dom": "10.4.2",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.7",
    "@types/better-sqlite3": "9.6.0",
    "@types/node": "26.6.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "electron": "44.4.5",
    "electron-builder": "26.15.3",
    "esbuild": "0.28.2",
    "eslint": "10.11.0",
    "jsdom": "30.1.1",
    "tsx": "4.23.15",
    "typescript": "5.9.3",
    "typescript-eslint": "8.70.1",
    "vite": "8.3.0",
    "vitest": "5.0.1"
  }
}
```

These are input pins, not a substitute for compatibility checks.

- [ ] Verify each package/version exists in its official registry.
- [ ] Record package integrity values in package-lock.json.
- [ ] Use Node 24.21.0 for the build environment.
- [ ] Ensure application code uses APIs supported by the embedded Electron runtime.
- [ ] If a pin fails compatibility, record the failure and replacement in docs/release.md before continuing.
- [ ] Do not add native rebuild tooling unless inspection and an actual Electron load test show it is necessary.

Build script:

```js
import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";

await mkdir("dist/renderer", { recursive: true });

await build({
  entryPoints: {
    main: "src/main/index.ts",
    preload: "src/preload/index.ts",
    engine: "src/engine/index.ts"
  },
  outdir: "dist",
  outExtension: { ".js": ".cjs" },
  bundle: true,
  platform: "node",
  format: "cjs",
  external: ["electron", "better-sqlite3"]
});

await build({
  entryPoints: ["src/renderer/index.tsx"],
  outfile: "dist/renderer/index.js",
  bundle: true,
  platform: "browser",
  format: "esm",
  jsx: "automatic"
});

await copyFile("src/renderer/index.html", "dist/renderer/index.html");
await copyFile("src/renderer/styles.css", "dist/renderer/styles.css");
```

Run the complete build after A5 creates its entry points.

Verification:

```powershell
npm ci
npm run typecheck
npm run lint
```

Commit:

```powershell
git add package.json package-lock.json tsconfig.json vitest.config.ts playwright.config.ts eslint.config.mjs scripts/build.mjs .github/workflows/ci.yml .gitignore
git commit -m "chore: establish reproducible Windows desktop scaffold"
```

## Task A2: Define validated contracts and routing

Type: TDD.

Files:

- Create: src/shared/contracts.ts
- Create: src/shared/errors.ts
- Create: src/shared/protocol.ts
- Create: src/shared/params.ts
- Create: src/shared/events.ts
- Create: src/shared/host.ts
- Test: tests/contracts.test.ts
- Test: tests/bridge.test.ts

Interfaces:

- Consumes: Section 6 contracts.
- Produces: RequestSchema, MethodParams, EventSchema, HostMessageSchema.

Definition of Done:

- Every IPC method has one strict schema and one owner.
- Main handles native pickers, vault operations, external links, and update lifecycle.
- Engine handles application behavior.
- Invalid messages fail before reaching handlers.
- No hard-coded method-count assertion is used; compare actual key sets.

Step 1: Write the failing test.

```ts
import { expect, test } from "vitest";
import { RunEventsParams } from "../src/shared/params";

test("bounds history pagination and rejects extra fields", () => {
  expect(RunEventsParams.safeParse({
    runId: "r1", after: 0, limit: 500
  }).success).toBe(true);

  expect(RunEventsParams.safeParse({
    runId: "r1", after: 0, limit: 1001
  }).success).toBe(false);

  expect(RunEventsParams.safeParse({
    runId: "r1", after: 0, limit: 10, root: "C:\\"
  }).success).toBe(false);
});
```

Step 2: Run and confirm failure.

```powershell
npm test -- tests/contracts.test.ts
```

Expected: FAIL because the schema module is absent.

Step 3: Write the minimal implementation.

```ts
import { z } from "zod";

export const RunEventsParams = z.object({
  runId: z.string().min(1).max(128),
  after: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(1000).default(500)
}).strict();
```

Complete all method schemas, routing ownership, event payload schemas, and host capability schemas before finishing the task.

Step 4: Verify.

```powershell
npm test -- tests/contracts.test.ts tests/bridge.test.ts
npm run typecheck
npm run lint
```

Include cases for unknown methods, extra fields, oversized strings, invalid IDs, stale engine epochs, and unauthorized host capabilities.

Step 5: Commit.

```powershell
git add src/shared tests/contracts.test.ts tests/bridge.test.ts
git commit -m "feat: define validated desktop and engine contracts"
```

## Task A3: Implement durable storage

Type: TDD.

Files:

- Create: src/engine/store.ts
- Create: src/engine/migrations.ts
- Test: tests/store.test.ts

Interfaces:

- Produces: Store.append, Store.events, Store.transaction, Store.close.
- Produces: typed tables for projects, sessions, runs, operations, approvals, missions, research jobs, receipts, and settings.

Definition of Done:

- WAL is enabled.
- Foreign keys are enabled.
- Schema version is checked before mutation.
- State transitions and their events commit in one transaction.
- Command acceptance deduplicates using an application-generated command ID.
- History uses append-only records.
- FTS5 indexes searchable history.
- FTS triggers handle insert, update, and deletion.
- Searches are scoped to the current project/session unless the user explicitly chooses broader scope.

Step 1: Write the failing test.

```ts
import { expect, test } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Store } from "../src/engine/store";

test("event sequence survives reopening", () => {
  const file = join(mkdtempSync(join(tmpdir(), "rework-")), "state.db");
  const a = new Store(file);
  expect(a.append("r1", "started", {}).seq).toBe(1);
  a.close();

  const b = new Store(file);
  expect(b.append("r1", "completed", {}).seq).toBe(2);
  expect(b.events("r1", 1, 100).events).toHaveLength(1);
  b.close();
});
```

Step 2:

```powershell
npm test -- tests/store.test.ts
```

Expected: FAIL because Store is absent.

Step 3: Implement the store around this transactional sequence allocator.

```ts
const appendEvent = db.transaction(
  (runId: string, type: string, payload: unknown) => {
    const row = db.prepare(`
      SELECT COALESCE(MAX(seq), 0) AS seq
      FROM events WHERE run_id = ?
    `).get(runId) as { seq: number };

    const seq = row.seq + 1;
    db.prepare(`
      INSERT INTO events(run_id, seq, type, payload, at)
      VALUES (?, ?, ?, ?, ?)
    `).run(runId, seq, type, JSON.stringify(payload), Date.now());

    return seq;
  }
);
```

Create typed entity tables, indexes, foreign keys, record schemas, pagination, and FTS triggers. Use `.immediate()` for mutations requiring writer serialization.

Step 4:

```powershell
npm test -- tests/store.test.ts
npm run typecheck
```

Additional required cases:

- Duplicate command ID returns the previously accepted result.
- A failed transaction emits no committed event.
- Unknown-newer database version refuses to open for writing.
- Deleted sessions disappear from FTS results.
- Ten thousand events paginate without loading the full history.
- Search cannot return another project's records.

Step 5:

```powershell
git add src/engine/store.ts src/engine/migrations.ts tests/store.test.ts
git commit -m "feat: persist typed state and ordered searchable history"
```

## Task A4: Implement purpose-bound credentials

Type: TDD.

Files:

- Create: src/main/vault.ts
- Create: src/providers/profiles.ts
- Test: tests/vault.test.ts

Interfaces:

- Produces: saveSecret, deleteSecret, withSecret, redactSecrets.
- Consumes: validated host-purpose records.

Definition of Done:

- Electron safeStorage encryption is available before accepting a secret.
- Ciphertext is stored under application data, one opaque reference per file.
- Profiles contain secret references.
- Provider tests work without an active agent run.
- Research jobs can use their own credential class.
- Provisioning credentials are transient and separate from runtime credentials.
- Deletion invalidates affected runs and pending contexts.
- HMAC fingerprints are audit-only.
- No plaintext retrieval route reaches the renderer.

Step 1:

```ts
import { expect, test } from "vitest";
import { purposeMatches } from "../src/main/vault";

test("a provider-test grant cannot authorize another context", () => {
  const grant = {
    purpose: "provider-test",
    contextId: "test-1",
    secretRef: "secret-1"
  };

  expect(purposeMatches(grant, grant)).toBe(true);
  expect(purposeMatches(grant, {
    ...grant, contextId: "run-2"
  })).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/vault.test.ts
```

Expected: FAIL because purposeMatches is absent.

Step 3:

```ts
export interface SecretPurpose {
  purpose: "inference" | "provider-test" | "research" | "provision";
  contextId: string;
  secretRef: string;
}

export function purposeMatches(
  allowed: SecretPurpose,
  requested: SecretPurpose
): boolean {
  return allowed.purpose === requested.purpose
    && allowed.contextId === requested.contextId
    && allowed.secretRef === requested.secretRef;
}
```

Add engine-epoch and live-context validation at the host boundary. `withSecret` invokes a trusted operation and releases references afterward.

Step 4:

```powershell
npm test -- tests/vault.test.ts tests/bridge.test.ts
npm run typecheck
```

Test encryption failure, cancelled profile tests, deleted credentials, research credentials, expired purpose contexts, and absence of plaintext in saved profiles.

Step 5:

```powershell
git add src/main/vault.ts src/providers/profiles.ts tests/vault.test.ts
git commit -m "feat: secure credentials with purpose-bound access"
```

## Task A5: Wire the desktop shell and engine supervisor

Type: Integration.

Files:

- Create: src/main/index.ts
- Create: src/main/ipc.ts
- Create: src/main/bridge.ts
- Create: src/main/supervise.ts
- Create: src/preload/index.ts
- Create: src/engine/index.ts
- Create: src/engine/application.ts
- Create: renderer entry files
- Test: e2e/desktop.spec.ts

Interfaces:

- Consumes: A2–A4 contracts and services.
- Produces: window.rework.request and window.rework.onEvent.

Required window configuration:

```ts
const window = new BrowserWindow({
  width: 1440,
  height: 960,
  minWidth: 960,
  minHeight: 640,
  show: false,
  webPreferences: {
    preload: preloadPath,
    contextIsolation: true,
    sandbox: true,
    nodeIntegration: false,
    webviewTag: false
  }
});
```

Implementation:

- Register the application protocol before app readiness.
- Serve only packaged renderer assets with an explicit MIME map.
- Reject traversal, non-GET requests, navigation, and new windows.
- Verify the sending webContents, main frame, and application URL.
- Acquire the single-instance lock.
- Start the engine after app readiness.
- Use the default engine heap configuration.
- Bound application buffers instead of depending on packaged `NODE_OPTIONS`.
- Stop gracefully, then use the owned utility-process termination API if necessary.
- Observe actual exit; do not infer exit from a termination request.
- Restart at most three times in five minutes.
- Display manual recovery after exhausting the restart budget.
- Replay persisted events after engine restart.
- Use a React error boundary.

CSP:

```text
default-src 'none';
script-src 'self';
style-src 'self';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
object-src 'none';
base-uri 'none';
```

Verification:

```powershell
npm run build
npm test -- tests/bridge.test.ts tests/ui.test.tsx
npm run test:e2e -- e2e/desktop.spec.ts
npx electron-builder --dir
```

The smoke test must load SQLite inside the actual Electron process. A Node-only database test does not establish packaged Electron compatibility.

Commit:

```powershell
git add src/main src/preload src/engine/index.ts src/engine/application.ts src/renderer e2e/desktop.spec.ts tests/bridge.test.ts tests/ui.test.tsx
git commit -m "feat: wire secure desktop shell and supervised engine"
```

Milestone A: Rework launches as a desktop application, stores state, protects credentials, and recovers its engine.

---

# B. Tools and Execution Safety Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Goal: Deliver permission-controlled, recoverable project tools and owned Windows commands.

Architecture: Every tool passes through one broker, one path authority, and the durable operation journal.

Tech Stack: TypeScript, SQLite, C++17, Windows APIs, Vitest.

Spec: Sections 2, 3.7, 3.8, and 6.2.

Global Constraints: G01–G28 apply unchanged.

## Task B1: Enforce modes and approval identity

Type: TDD.

Files:

- Create: src/engine/policy.ts
- Create: src/engine/approvals.ts
- Test: tests/policy.test.ts

Interfaces:

- Produces: modeAllows and approvalMatches.
- Consumes: Mode, Operation, Approval.

Definition of Done:

- Ask/Plan cannot mutate files or run commands.
- Research still requires independent research permission.
- Pending approval becomes stale after any bound input changes.
- Denial is durable.
- Run-scoped grants are re-evaluated after policy changes.
- Mission tool scope is enforced in addition to mode policy.

Step 1:

```ts
import { expect, test } from "vitest";
import { modeAllows } from "../src/engine/policy";

test.each(["ask", "plan", "research"] as const)(
  "%s cannot execute commands", mode => {
    expect(modeAllows(mode, "command")).toBe(false);
  }
);
```

Step 2:

```powershell
npm test -- tests/policy.test.ts
```

Expected: FAIL because policy is absent.

Step 3:

```ts
import type { Mode, Operation, Approval } from "../shared/contracts";

export function modeAllows(mode: Mode, kind: Operation["kind"]): boolean {
  if (kind === "read" || kind === "research") return true;
  return mode === "build" || mode === "mission";
}

export function approvalMatches(op: Operation, a: Approval): boolean {
  return a.decision === "allow"
    && a.operationId === op.id
    && a.projectId === op.projectId
    && a.inputHash === op.inputHash
    && a.policyRevision === op.policyRevision;
}
```

Step 4:

```powershell
npm test -- tests/policy.test.ts
```

Add table-driven tests changing each bound field and proposed write content independently.

Step 5:

```powershell
git add src/engine/policy.ts src/engine/approvals.ts tests/policy.test.ts
git commit -m "feat: enforce modes and content-bound approvals"
```

## Task B2: Enforce Windows project boundaries

Type: TDD.

Files:

- Create: src/main/projects.ts
- Create: src/tools/paths.ts
- Test: tests/paths.test.ts

Interfaces:

- Produces: validateRelativePath and resolveProjectPath.
- Produces: persisted project trust and explicit relinking.

Definition of Done:

- Reject traversal, absolute paths, UNC paths, device paths, alternate streams, reserved names, invalid characters, and oversized components.
- Resolve existing ancestors and junctions.
- Validate the resolved root's volume as a local fixed drive.
- Recheck authority immediately before mutation.
- Detect hard links; require explicit review for anomalous operations.
- A moved project requires explicit relinking.
- Relinking revalidates trust and invalidates pending path-bound approvals.

Step 1:

```ts
import { expect, test } from "vitest";
import { validateRelativePath } from "../src/tools/paths";

test.each([
  "../x", "C:\\x", "src/NUL", "src/a:stream",
  "src/a?.txt", "src/" + "a".repeat(300)
])("rejects %s", value => {
  expect(() => validateRelativePath(value)).toThrow();
});
```

Step 2:

```powershell
npm test -- tests/paths.test.ts
```

Expected: FAIL because path validation is absent.

Step 3:

```ts
import path from "node:path";

export function validateRelativePath(value: string): string {
  const normalized = value.replaceAll("\\", "/");
  const parts = normalized.split("/");
  const reserved = /^(con|prn|aux|nul|com[1-9¹²³]|lpt[1-9¹²³])(\.|$)/i;

  if (
    !normalized ||
    path.win32.isAbsolute(value) ||
    normalized.startsWith("/") ||
    normalized.includes(":") ||
    parts.some(p =>
      !p || p === "." || p === ".." || p.length > 255 ||
      /[<>|"?*\u0000-\u001f]/.test(p) ||
      /[. ]$/.test(p) ||
      reserved.test(p)
    )
  ) throw new Error("PATH_OUTSIDE_PROJECT");

  return normalized;
}
```

Long-path tests use a total path longer than 260 characters with every individual component within the filesystem's supported limit.

Step 4:

```powershell
npm test -- tests/paths.test.ts
```

Test junction escape, parent replacement, hard links, missing roots, relinking, remote volumes, and long total paths.

Step 5:

```powershell
git add src/main/projects.ts src/tools/paths.ts tests/paths.test.ts
git commit -m "feat: enforce trusted Windows project boundaries"
```

## Task B3: Implement file tools and journaled writes

Type: TDD.

Files:

- Create: src/tools/files.ts
- Create: src/tools/registry.ts
- Create: src/engine/operations.ts
- Test: tests/tools.test.ts
- Test: tests/journal.test.ts

Interfaces:

- Produces: executeTool(call, context, signal): Promise<string>.
- Produces: classifyWriteRecovery(actual, before, after).
- Consumes: path authority and permission broker.

Definition of Done:

- Tool arguments have strict schemas.
- Reads are bounded.
- Traversal excludes application credential/storage directories.
- UTF-8 with or without BOM is supported.
- Invalid UTF-8 and UTF-16 are rejected.
- Edits preserve BOM and dominant line endings.
- Exact-match editing rejects zero or multiple matches.
- Writes include before content, before hash, after hash, and operation identity.
- Undo requires the current file to match the recorded after hash.
- Snapshot eviction is visible.
- File mutations serialize through project/path leases.

Step 1:

```ts
import { expect, test } from "vitest";
import { classifyWriteRecovery } from "../src/engine/operations";

test("does not overwrite an unrelated edit during recovery", () => {
  expect(classifyWriteRecovery("other", "before", "after"))
    .toBe("conflict");
  expect(classifyWriteRecovery("after", "before", "after"))
    .toBe("committed");
});
```

Step 2:

```powershell
npm test -- tests/journal.test.ts
```

Expected: FAIL because recovery classification is absent.

Step 3:

```ts
export function classifyWriteRecovery(
  actual: string,
  before: string,
  after: string
): "not-committed" | "committed" | "conflict" {
  if (actual === after) return "committed";
  if (actual === before) return "not-committed";
  return "conflict";
}
```

Required write algorithm:

1. Validate input.
2. Acquire the mutation lease.
3. Resolve authority.
4. Read and hash the current bytes.
5. Match the approval, including proposed content.
6. Persist the prepared operation and recoverable before image.
7. Write a unique adjacent temporary file.
8. Flush and close it.
9. Revalidate parent authority and current destination identity/hash.
10. Abort on any mismatch.
11. Replace the destination.
12. Persist the outcome.
13. Release the lease.

Do not claim protection against arbitrary hostile same-user processes. Document the remaining external-process race boundary.

Step 4:

```powershell
npm test -- tests/tools.test.ts tests/journal.test.ts tests/paths.test.ts
```

Inject failure before temporary write, before replacement, and after replacement but before recording success.

Step 5:

```powershell
git add src/tools/files.ts src/tools/registry.ts src/engine/operations.ts tests/tools.test.ts tests/journal.test.ts
git commit -m "feat: add bounded file tools and recoverable writes"
```

## Task B4: Implement owned command execution

Type: TDD.

Files:

- Create: native/CMakeLists.txt
- Create: native/host.cpp
- Create: src/tools/commands.ts
- Create: src/tools/git.ts
- Test: tests/tools.test.ts

Interfaces:

- Produces: spawnOwned(executable, args, cwd, env, limits, signal).
- Returns: Promise<{ code: number; output: string; truncated: boolean }>.

Definition of Done:

- Resolve the executable before approval.
- Direct spawning is the default.
- `.cmd` handling is explicit and tested.
- Commands receive a recorded environment allowlist.
- Vault secrets and engine tuning variables are not inherited.
- Commands have noninteractive stdin.
- Output is continuously drained after the capture cap.
- Parent failure terminates owned descendants.
- Unrelated processes survive cancellation.
- A command holds the project's mutation lease while it can modify the workspace.

Step 1:

```ts
import { expect, test } from "vitest";
import { quoteWindowsArg } from "../src/tools/commands";

test("quotes spaces and embedded quotes", () => {
  expect(quoteWindowsArg("hello world")).toBe('"hello world"');
  expect(quoteWindowsArg('a"b')).toBe('"a\\"b"');
});
```

Step 2:

```powershell
npm test -- tests/tools.test.ts
```

Expected: FAIL because command argument handling is absent.

Step 3:

```ts
export function quoteWindowsArg(value: string): string {
  if (value !== "" && !/[\s"]/.test(value)) return value;
  return '"' + value
    .replace(/(\\*)"/g, "$1$1\\\"")
    .replace(/(\\+)$/g, "$1$1") + '"';
}
```

Native process ownership:

```cpp
HANDLE job = CreateJobObjectW(nullptr, nullptr);
if (!job) return GetLastError();

JOBOBJECT_EXTENDED_LIMIT_INFORMATION limits{};
limits.BasicLimitInformation.LimitFlags =
    JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE;

if (!SetInformationJobObject(
    job,
    JobObjectExtendedLimitInformation,
    &limits,
    sizeof(limits))) {
  CloseHandle(job);
  return GetLastError();
}
```

Complete the helper:

- Read bounded framed requests.
- Create commands suspended.
- Assign the Job Object before resuming.
- Abort when assignment fails.
- Keep the job handle non-inheritable.
- Forward bounded stdout/stderr frames.
- Terminate the job when the controlling pipe closes.
- Return the actual exit record.
- Close remaining descendants after command completion.

A helper crash marks an in-flight operation `unknown`, preserving partial output.

Step 4:

```powershell
npm run native:build
npm test -- tests/tools.test.ts
```

Required actual-process cases:

- Success and nonzero exit.
- Spaces, quotes, and trailing backslashes.
- Grandchild creation.
- Stop kills child and grandchild.
- Engine death kills descendants.
- Unrelated process remains alive.
- Output cap does not deadlock.
- Timeout.
- Helper crash.
- A subsequent command works after helper restart.

Step 5:

```powershell
git add native src/tools/commands.ts src/tools/git.ts tests/tools.test.ts
git commit -m "feat: supervise owned Windows command trees"
```

## Task B5: Reconcile interrupted work and approvals

Type: TDD.

Files:

- Create: src/engine/recovery.ts
- Test: tests/journal.test.ts
- Test: e2e/agent.spec.ts

Interfaces:

- Produces: recoverOperation(status): Operation["status"].
- Consumes: operations, events, snapshots, command identities.

Definition of Done:

- Active runs become interrupted after engine loss.
- Started external operations become unknown until reconciled.
- No ambiguous command is repeated automatically.
- Approvals are grouped by run and ordered by request time.
- Stale approvals cannot be accepted.
- No bulk approval spans unrelated runs.
- UI acknowledges Stop as cancelling before actual termination.
- Remote cancellation pending is distinct from cancelled.

Step 1:

```ts
import { expect, test } from "vitest";
import { recoverOperation } from "../src/engine/recovery";

test("an interrupted external operation is not assumed failed", () => {
  expect(recoverOperation("started")).toBe("unknown");
  expect(recoverOperation("completed")).toBe("completed");
});
```

Step 2:

```powershell
npm test -- tests/journal.test.ts
```

Expected: FAIL because recovery is absent.

Step 3:

```ts
import type { Operation } from "../shared/contracts";

export function recoverOperation(
  status: Operation["status"]
): Operation["status"] {
  return status === "started" ? "unknown" : status;
}
```

Add explicit resume decisions after reconciliation. Never resume by blindly replaying the last model tool call.

Step 4:

```powershell
npm test -- tests/journal.test.ts
npm run build
npm run test:e2e -- e2e/agent.spec.ts
```

Step 5:

```powershell
git add src/engine/recovery.ts tests/journal.test.ts e2e/agent.spec.ts
git commit -m "feat: reconcile interrupted operations without replay"
```

Milestone B: File and command operations are controlled, journaled, cancellable, and recoverable.

---

# C. Agent and Workbench Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Goal: Deliver a working provider-independent agent with context, skills, teams, and a complete desktop workbench.

Architecture: One canonical loop consumes provider streams and executes validated tools through the broker. Missions schedule bounded runs using the same engine.

Tech Stack: TypeScript, React, SQLite, Vitest, Playwright.

Spec: Sections 3 and 6.

Global Constraints: G01–G28 apply unchanged.

## Task C1: Integrate API providers and continuation state

Type: TDD with donor-code refactoring.

Files:

- Create: src/providers/openai.ts
- Create: src/providers/anthropic.ts
- Create: src/providers/factory.ts
- Create: src/providers/transport.ts
- Create: src/providers/wire-state.ts
- Create: vendor/windowrunner/providers/
- Test: tests/providers.test.ts
- Modify: THIRD_PARTY_NOTICES.md

Interfaces:

- Produces: createProvider(profile, secret, transport): ModelProvider.
- Produces: compatibleWireState(message, profile).

Definition of Done:

- Streaming parsing handles split UTF-8 and split JSON.
- Retries occur only before the first emitted response chunk.
- Abort propagates.
- Output limits are mapped per provider.
- Anthropic thinking/signatures survive tool round trips.
- Provider-specific state is never sent to another provider/model identity.
- A local-only run cannot construct an external provider.
- Transport honors Windows proxy decisions.
- Custom trust configuration is applied to the actual transport in use.
- Do not assume `NODE_EXTRA_CA_CERTS` changes Chromium networking.

Step 1:

```ts
import { expect, test } from "vitest";
import { compatibleWireState } from "../src/providers/wire-state";

test("does not reuse one provider's continuation state elsewhere", () => {
  const state = {
    provider: "anthropic" as const,
    profileRevision: 1,
    model: "model-a",
    schemaVersion: 1 as const,
    data: { signature: "test-signature" }
  };

  expect(compatibleWireState(state, {
    provider: "openai", profileRevision: 1, model: "model-a"
  })).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/providers.test.ts
```

Expected: FAIL because the adapter state guard is absent.

Step 3:

```ts
import type { ProviderWireState } from "../shared/contracts";

export function compatibleWireState(
  state: ProviderWireState,
  profile: {
    provider: ProviderWireState["provider"];
    profileRevision: number;
    model: string;
  }
): boolean {
  return state.provider === profile.provider
    && state.profileRevision === profile.profileRevision
    && state.model === profile.model;
}
```

Port donor parsers, then add provider-native continuation serialization. Preserve signed blocks as opaque validated data.

Step 4:

```powershell
npm test -- tests/providers.test.ts
npm run typecheck
```

Required cases: malformed JSON, missing completion marker, 401, 429 with Retry-After, 500, mid-stream failure, cancellation, signed thinking followed by a tool result, profile switching, system proxy, and TLS rejection.

Step 5:

```powershell
git add src/providers vendor/windowrunner/providers tests/providers.test.ts THIRD_PARTY_NOTICES.md
git commit -m "feat: integrate policy-aware streaming providers"
```

## Task C2: Implement the durable agent loop and context

Type: TDD.

Files:

- Create: src/engine/loop.ts
- Create: src/engine/context.ts
- Create: src/engine/history.ts
- Test: tests/loop.test.ts
- Test: tests/context.test.ts

Interfaces:

- Produces: runTurn.
- Produces: selectCompleteGroups.
- Consumes: providers, broker, event store, operation journal.

Definition of Done:

- Prior turns are included.
- Tools execute sequentially per run.
- Operation identity exists before execution.
- Tool errors become structured tool results.
- Cancellation is not converted into an ordinary tool error.
- Partial model responses are persisted as partial.
- Context trimming preserves complete tool groups.
- Summaries use the run's selected profile.
- Pending approvals and unresolved operations remain outside lossy summaries.
- `search_history` queries the scoped FTS index.
- Budget exhaustion has an explicit terminal state.

Step 1:

```ts
import { expect, test } from "vitest";
import { selectCompleteGroups } from "../src/engine/context";

test("never splits an interaction group", () => {
  expect(selectCompleteGroups([
    { id: "old", tokens: 8 },
    { id: "tool-group", tokens: 7 }
  ], 10)).toEqual([{ id: "tool-group", tokens: 7 }]);
});
```

Step 2:

```powershell
npm test -- tests/context.test.ts
```

Expected: FAIL because context selection is absent.

Step 3:

```ts
export function selectCompleteGroups<T extends { tokens: number }>(
  groups: T[],
  budget: number
): T[] {
  const selected: T[] = [];
  let used = 0;

  for (let i = groups.length - 1; i >= 0; i--) {
    if (used + groups[i].tokens > budget) break;
    selected.unshift(groups[i]);
    used += groups[i].tokens;
  }
  return selected;
}
```

Agent-loop algorithm:

1. Validate run policy and immutable profile snapshot.
2. Build context from policy, instructions, selected skills, current task, complete history groups, and retrieved summaries.
3. Reserve output and tool-schema overhead.
4. Stream and persist response activity.
5. Preserve native continuation state.
6. Persist each requested tool operation before execution.
7. Request approval when needed.
8. Execute through the broker.
9. Persist result and operation outcome.
10. Continue until no tool calls remain or a budget/state transition stops the run.

The byte-based token estimator must be conservative and tested. An actual context rejection triggers smaller context construction without replaying completed tools.

Step 4:

```powershell
npm test -- tests/loop.test.ts tests/context.test.ts
```

Required cases:

- Earlier user preference survives compaction.
- Assistant tool call/result remain paired.
- Current request too large produces controlled failure.
- Oversized tool output becomes an artifact plus bounded excerpt.
- Context rejection does not repeat a write.
- Crash between tool completion and next inference does not repeat the tool.
- Profile switch changes the next run's budget.
- Ordinary budget exhaustion produces failed with partial-work summary.

Step 5:

```powershell
git add src/engine/loop.ts src/engine/context.ts src/engine/history.ts tests/loop.test.ts tests/context.test.ts
git commit -m "feat: implement durable agent execution and bounded context"
```

## Task C3: Implement skills and bounded team graphs

Type: TDD.

Files:

- Create: src/skills/load.ts
- Create: src/skills/select.ts
- Create: src/skills/instructions.ts
- Create: src/missions/graph.ts
- Create: src/missions/topologies.ts
- Create: src/missions/presets.ts
- Test: tests/skills.test.ts
- Test: tests/missions.test.ts

Interfaces:

- Produces: selectSkills.
- Produces: validateGraph.
- Produces: bounded preset expansion.

Definition of Done:

- Skills require name/description frontmatter.
- Bodies are limited to 16 KiB.
- At most three distinct skill bodies are loaded per run.
- Project skills deterministically shadow user skills.
- Selection uses description/goal token overlap, then name.
- Skills cannot change permissions.
- Graphs reject missing dependencies and cycles.
- Debate and peer collaboration expand into finite steps.
- Presets are versioned and snapshotted.

Step 1:

```ts
import { expect, test } from "vitest";
import { selectSkills } from "../src/skills/select";

test("breaks equal skill scores by name", () => {
  expect(selectSkills([
    { name: "z", description: "typescript" },
    { name: "a", description: "typescript" }
  ], "typescript", 1).map(x => x.name)).toEqual(["a"]);
});
```

Step 2:

```powershell
npm test -- tests/skills.test.ts
```

Expected: FAIL because skill selection is absent.

Step 3:

```ts
export function selectSkills<T extends {
  name: string;
  description: string;
}>(skills: T[], goal: string, limit: number): T[] {
  const words = new Set(goal.toLowerCase().match(/\p{L}+/gu) ?? []);
  const score = (s: T) => new Set(
    s.description.toLowerCase().match(/\p{L}+/gu) ?? []
  );

  return skills.map(skill => ({
    skill,
    score: [...score(skill)].filter(w => words.has(w)).length
  }))
    .filter(x => x.score > 0)
    .sort((a, b) =>
      b.score - a.score || a.skill.name.localeCompare(b.skill.name))
    .slice(0, limit)
    .map(x => x.skill);
}
```

Step 4:

```powershell
npm test -- tests/skills.test.ts tests/missions.test.ts
```

Test malformed frontmatter, oversized bodies, symlink escape, shadowing, repeated reads, cycles, missing dependencies, and hostile skill instructions.

Step 5:

```powershell
git add src/skills src/missions/graph.ts src/missions/topologies.ts src/missions/presets.ts tests/skills.test.ts tests/missions.test.ts
git commit -m "feat: add bounded skills and team topology presets"
```

## Task C4: Schedule durable missions

Type: TDD.

Files:

- Create: src/missions/run.ts
- Test: tests/missions.test.ts
- Test: e2e/missions.spec.ts

Interfaces:

- Produces: dependencyState.
- Produces: persisted task acceptance and verified completion.
- Consumes: graph, run service, tool scope, budgets, resource scheduler.

Definition of Done:

- Each task has an immutable role/profile snapshot.
- At most five mission agents run concurrently.
- Default mission budget is 120 model steps.
- Run acceptance is transactional and deduplicated.
- Completion requires a verification record.
- Failed/cancelled/blocked dependencies block downstream tasks.
- Pause stops new dispatch and reaches a recorded boundary.
- Resume reconciles unknown operations first.
- Local agents share the local scheduler.
- Mutations serialize through the same broker as ordinary runs.

Step 1:

```ts
import { expect, test } from "vitest";
import { dependencyState } from "../src/missions/run";

test("failed verification cannot unlock a dependent task", () => {
  expect(dependencyState(["completed", "failed"])).toBe("blocked");
  expect(dependencyState(["completed"])).toBe("ready");
});
```

Step 2:

```powershell
npm test -- tests/missions.test.ts
```

Expected: FAIL because mission scheduling is absent.

Step 3:

```ts
export function dependencyState(
  states: string[]
): "ready" | "pending" | "blocked" {
  if (states.some(s =>
    s === "failed" || s === "cancelled" || s === "blocked"
  )) return "blocked";

  return states.every(s => s === "completed") ? "ready" : "pending";
}
```

Verification records are either:

- A permission-controlled command and required exit code.
- A reviewer-role receipt tied to the reviewed outputs.

A task cannot author its own successful verification after seeing failure.

Step 4:

```powershell
npm test -- tests/missions.test.ts
npm run build
npm run test:e2e -- e2e/missions.spec.ts
```

Step 5:

```powershell
git add src/missions/run.ts tests/missions.test.ts e2e/missions.spec.ts
git commit -m "feat: execute durable verified mission graphs"
```

## Task C5: Complete the workbench interface

Type: Integration.

Files:

- Modify: src/renderer/
- Test: tests/ui.test.tsx
- Test: e2e/agent.spec.ts
- Test: e2e/missions.spec.ts

Interfaces:

- Consumes: validated request/event APIs.
- Produces: complete Section 3.5 workflows.

Implementation:

- Render Markdown with HTML disabled.
- Route links through validated main-process opening.
- Virtualize long histories.
- Buffer streaming deltas and flush at most once per animation frame.
- Show reasoning separately.
- Show actual approval, cancellation, interruption, and recovery states.
- Display diff and undo from the content journal.
- Keep approvals attributable to session/run.
- Preserve drafts during engine restart.
- Support keyboard, high contrast, reduced motion, and system theme.
- Expose credential and profile tests without requiring a run.

Verification:

```powershell
npm test -- tests/ui.test.tsx
npm run build
npm run test:e2e -- e2e/agent.spec.ts e2e/missions.spec.ts
```

Required journeys:

- Open/trust project → ask → plan → approved edit → command → inspect diff.
- Deny a command and continue the conversation.
- Stop during streaming.
- Restart during a pending approval.
- Recover a renderer error.
- View 10,000 events without rendering every row.
- Operate the primary journey using only the keyboard.

Commit:

```powershell
git add src/renderer tests/ui.test.tsx e2e/agent.spec.ts e2e/missions.spec.ts
git commit -m "feat: complete coding and mission workbench"
```

Milestone C: Rework is a usable API-powered coding-agent application with skills and durable missions.

---

# D. Local Inference Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Goal: Safely choose and operate a qualified local model configuration for the user's PC.

Architecture: Signed activation sets describe supported artifacts; lab receipts certify quality; machine probes certify actual operation; one scheduler owns managed inference.

Tech Stack: TypeScript, Windows hardware APIs, Ollama, Vitest, real-hardware qualification.

Spec: Sections 3.4, 3.6, 6.3, and 6.4.

Global Constraints: G01–G28 apply unchanged.

## Task D1: Collect trustworthy hardware facts

Type: TDD.

Files:

- Create: native/hardware.cpp
- Create: native/hardware.hpp
- Create: src/models/hardware.ts
- Test: tests/hardware.test.ts

Interfaces:

- Produces: normalizeBytes and probeHardware(): Promise<Hardware>.

Definition of Done:

- Use GlobalMemoryStatusEx for host memory.
- Use DXGI full-width adapter capacities.
- Do not use AdapterRAM as authoritative VRAM.
- Load NVML dynamically for supported NVIDIA telemetry.
- Match telemetry to the actual adapter identity.
- Unknown free memory remains null.
- Do not substitute process DXGI budget for global free VRAM.
- Fingerprints include CPU class, adapters, driver versions, and runtime identity.
- Probe failures do not prevent API use.

Step 1:

```ts
import { expect, test } from "vitest";
import { normalizeBytes } from "../src/models/hardware";

test("unknown is preserved and invalid precision is rejected", () => {
  expect(normalizeBytes(null)).toBeNull();
  expect(() => normalizeBytes(-1)).toThrow();
  expect(() => normalizeBytes(1.5)).toThrow();
});
```

Step 2:

```powershell
npm test -- tests/hardware.test.ts
```

Expected: FAIL because normalization is absent.

Step 3:

```ts
export function normalizeBytes(value: number | null): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error("INVALID_HARDWARE_MEASUREMENT");
  return value;
}
```

Step 4:

```powershell
npm run native:build
npm test -- tests/hardware.test.ts
```

Include absent-driver, integrated-GPU, multiple-adapter, driver-change, and null-propagation cases.

Step 5:

```powershell
git add native/hardware.cpp native/hardware.hpp src/models/hardware.ts tests/hardware.test.ts
git commit -m "feat: probe Windows hardware without invented capacity"
```

## Task D2: Manage verified runtime and model artifacts

Type: TDD.

Files:

- Create: src/models/catalogue.ts
- Create: src/models/download.ts
- Create: src/models/runtime.ts
- Create: scripts/fetch-catalogue-locks.mts
- Test: tests/download.test.ts

Interfaces:

- Produces: streaming digest verification and staged activation.
- Consumes: signed activation sets.

Definition of Done:

- Verify signed metadata before trusting artifact URLs or digests.
- Download models by pinned manifest/blob identities.
- Do not delegate catalogue identity to mutable `ollama pull` tags.
- Resume only with valid range and identity responses.
- Stream multi-gigabyte files; do not buffer them entirely.
- Reject archive traversal, links escaping staging, and excessive expansion.
- Check disk space at the selected storage location.
- Activate runtime/catalogue/lab receipts atomically.
- Preserve the previous activation set on failure.
- Model removal respects shared-blob references and active leases.

Step 1:

```ts
import { expect, test } from "vitest";
import { createHash } from "node:crypto";
import { matchesDigest } from "../src/models/download";

test("rejects different artifact bytes", () => {
  const expected = createHash("sha256").update("good").digest("hex");
  expect(matchesDigest(Buffer.from("bad"), expected)).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/download.test.ts
```

Expected: FAIL because digest verification is absent.

Step 3:

```ts
import { createHash } from "node:crypto";

export function matchesDigest(bytes: Uint8Array, expected: string): boolean {
  return createHash("sha256").update(bytes).digest("hex") === expected;
}
```

Use this small-buffer form for fixtures only. Production hashes streams incrementally.

Retry public registry GETs using bounded exponential backoff, honoring Retry-After. Display rate limiting. Never automatically retry an ambiguous mutating request.

Step 4:

```powershell
npm test -- tests/download.test.ts
```

Test corrupt blobs, changed manifests, interrupted ranges, disk-full, cancelled extraction, invalid signatures, rollback attempts, missing receipts, and interrupted activation.

Step 5:

```powershell
git add src/models/catalogue.ts src/models/download.ts src/models/runtime.ts scripts/fetch-catalogue-locks.mts tests/download.test.ts
git commit -m "feat: manage signed and verified local inference artifacts"
```

## Task D3: Implement lab qualification and machine selection

Type: TDD.

Files:

- Create: src/models/qualify.ts
- Create: src/models/select.ts
- Create: scripts/qualify-model.mts
- Test: tests/selection.test.ts

Interfaces:

- Produces: planProbeCandidates and selectLocal.
- Consumes: LabReceipt, MachineReceipt, Hardware, activation set.

Definition of Done:

- Fresh installations can choose candidates before machine receipts exist.
- A candidate must have a compatible lab receipt before probing.
- Machine receipts bind exact model/runtime/backend/context/quantization identities.
- Select only receipts matching current hardware and activation set.
- Verify the actually used backend and adapters.
- Unknown telemetry cannot become a fabricated capacity estimate.
- No local failure triggers automatic cloud fallback.

Step 1:

```ts
import { expect, test } from "vitest";
import { machineReceiptEligible } from "../src/models/select";
import type { MachineReceipt } from "../src/shared/contracts";

test("rejects a receipt from a different observed backend", () => {
  const r: MachineReceipt = {
    id: "r", schemaVersion: 1, receiptKind: "machine",
    labReceiptId: "lab", activationSetId: "set",
    modelDigest: "model", runtimeDigest: "runtime",
    backend: "cpu", observedBackend: "cuda",
    quantization: "Q4_K_M", contextTokens: 4096, parallelism: 1,
    hardwareFingerprint: "pc", adapterIds: [],
    requiredRamBytes: 1024, requiredVramBytes: null,
    loadLatencyMs: 1000, firstTokenMs: 1000,
    tokensPerSecond: 8, toolsPassed: true, quality: 0.9,
    measuredAt: "2026-09-24T00:00:00Z"
  };

  expect(machineReceiptEligible(r, "pc", "set")).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/selection.test.ts
```

Expected: FAIL because receipt eligibility is absent.

Step 3:

```ts
import type { MachineReceipt } from "../shared/contracts";

export function machineReceiptEligible(
  r: MachineReceipt,
  fingerprint: string,
  activationSetId: string
): boolean {
  return r.receiptKind === "machine"
    && r.hardwareFingerprint === fingerprint
    && r.activationSetId === activationSetId
    && r.backend === r.observedBackend
    && r.parallelism === 1
    && r.toolsPassed
    && r.loadLatencyMs <= 90_000
    && r.firstTokenMs <= 30_000
    && r.tokensPerSecond >= 4;
}
```

Selection:

1. Enforce privacy.
2. Validate the active set and linked lab receipt.
3. Exclude stale or incompatible machine receipts.
4. Reserve max(2 GiB, 15% of total RAM).
5. Apply current memory constraints.
6. Rank by measured quality, then responsiveness.
7. Prefer installed configurations when quality is comparable.
8. Re-probe when required.
9. Try a smaller qualified configuration if a probe fails.
10. Report local unavailability when none qualifies.

Qualification suite:

- Twenty structured tool-call cases: all pass.
- Ten coding fixtures, three runs each: at least 85% verified completion.
- Zero unauthorized side effects.
- Zero writes after cancellation.
- Load within 90 seconds.
- First token within 30 seconds.
- At least four generated tokens per second.
- No OOM.
- Required host-memory reserve maintained.

These are targets, not claims already achieved.

Step 4:

```powershell
npm test -- tests/selection.test.ts
npx tsx scripts/qualify-model.mts --help
```

Run real qualification separately. Retain logs, fixtures, digests, fingerprints, and measurements. The harness checkpoints completed cases and resumes after interruption.

Step 5:

```powershell
git add src/models/qualify.ts src/models/select.ts scripts/qualify-model.mts tests/selection.test.ts
git commit -m "feat: qualify and select hardware-specific local configurations"
```

## Task D4: Implement inference leases and runtime control

Type: TDD.

Files:

- Create: src/engine/scheduler.ts
- Create: src/providers/ollama.ts
- Create: src/models/import.ts
- Test: tests/scheduler.test.ts
- Test: tests/providers.test.ts

Interfaces:

- Produces: FIFO inference leases with generation tokens.
- Produces: managed Ollama provider.

Definition of Done:

- One managed inference request runs at a time.
- Queue length is bounded.
- Queued cancellation removes the request.
- Cancellation fences the old holder before another lease is granted.
- A heartbeat timeout does not immediately authorize overlapping inference.
- Confirm completion/unload or terminate the owned runtime before regranting.
- Native Ollama message conversion is explicit.
- Context and output limits are sent.
- Runtime/backend selection is verified by probe results.
- User-owned runtimes are never terminated or upgraded.

Step 1:

```ts
import { expect, test } from "vitest";
import { LeaseFence } from "../src/engine/scheduler";

test("expired work must stop before capacity is reused", () => {
  const f = new LeaseFence();
  const token = f.acquire();
  f.beginStop(token);
  expect(() => f.acquire()).toThrow("BUSY");
  f.confirmStopped(token);
  expect(f.acquire()).not.toBe(token);
});
```

Step 2:

```powershell
npm test -- tests/scheduler.test.ts
```

Expected: FAIL because lease fencing is absent.

Step 3:

```ts
export class LeaseFence {
  private generation = 0;
  private active: number | null = null;

  acquire(): number {
    if (this.active !== null) throw new Error("BUSY");
    this.active = ++this.generation;
    return this.active;
  }

  beginStop(token: number): void {
    if (this.active !== token) throw new Error("STALE_LEASE");
  }

  confirmStopped(token: number): void {
    if (this.active !== token) throw new Error("STALE_LEASE");
    this.active = null;
  }
}
```

The production scheduler adds FIFO waiting, deadlines, heartbeat monitoring, cancellation, and runtime ownership around this fence.

Runtime defaults:

```text
OLLAMA_HOST=127.0.0.1:<owned-port>
OLLAMA_MODELS=<owned-model-directory>
OLLAMA_NO_CLOUD=1
OLLAMA_NUM_PARALLEL=1
OLLAMA_MAX_LOADED_MODELS=1
OLLAMA_KEEP_ALIVE=0
```

Hold the model during an active lease through explicit request options. Release it explicitly afterward.

Inspect the pinned runtime's actual backend inventory. Do not assume CUDA/ROCm/Vulkan packaging from an older release.

Step 4:

```powershell
npm test -- tests/scheduler.test.ts tests/providers.test.ts
```

Test delayed cancellation, stale lease release, runtime death, owned-port identity, missing completion marker, malformed native messages, and backend mismatch.

Step 5:

```powershell
git add src/engine/scheduler.ts src/providers/ollama.ts src/models/import.ts tests/scheduler.test.ts tests/providers.test.ts
git commit -m "feat: schedule and fence managed local inference"
```

## Task D5: Complete local onboarding and import

Type: Integration.

Files:

- Modify: src/renderer/ModelsPanel.tsx
- Modify: src/renderer/Onboarding.tsx
- Test: e2e/models.spec.ts

Implementation:

- Show detected hardware and unknown measurements honestly.
- Explain the recommended setup.
- Show download size, storage location, and cancellation.
- Download only after the user enables local setup.
- Probe the selected candidate and mint a machine receipt.
- Separate lab quality from measurements made on this PC.
- Try another eligible configuration on failure.
- Keep API operation available when local setup fails.
- Import user-owned compatible artifacts without executing repository code.
- Imported models remain unqualified until evaluated.
- Model removal reclaims only unreferenced, inactive blobs.
- Storage relocation stops local work and uses verified copy/activation recovery.

Verification:

```powershell
npm run build
npm run test:e2e -- e2e/models.spec.ts
```

Required cases: clean installation, CPU-only machine, insufficient RAM, unknown VRAM, failed probe, interrupted download, changed driver, import failure, model deletion, and external-runtime survival.

Commit:

```powershell
git add src/renderer/ModelsPanel.tsx src/renderer/Onboarding.tsx e2e/models.spec.ts
git commit -m "feat: complete automatic local-model onboarding"
```

Milestone D: Rework can explain, install, qualify, select, and operate an eligible local configuration without silently using cloud inference.

---

# E. Research Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Goal: Let the agent perform bounded, privacy-aware research using the Research Kit and produce reviewable evidence.

Architecture: GitHub workflows collect evidence; the application tracks durable job identity, validates artifacts, synthesizes claims, runs kit readiness checks, and records separate human review.

Tech Stack: TypeScript, Research Kit, GitHub REST API, SQLite, Vitest, Playwright.

Spec: Sections 2, 3, and the following research contract.

Global Constraints: G01–G28 apply unchanged.

## Research contract

Pinned kit:

```text
StepenkoAnatoli/Research-Kit
e4a799f3fa07eb0c7377a1f350bae7cf987c5110
```

Required workflow inputs:

```text
topic
max_pages
depth
prefer
queries
prior
client_ref
search_transport
runner
```

`client_ref` is always an opaque identifier matching:

```regex
^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$
```

Never use it as a path, topic, private project name, or brief reference.

Application payload policy:

- At most 8,000 UTF-8 bytes for the serialized input object.
- At most ten pages per ordinary application collection.
- Reject oversized inputs before dispatch with `RESEARCH_INPUT_TOO_LARGE`.
- Ask the agent to produce a smaller public technical brief.
- Do not silently truncate.
- Do not commit research briefs to a repository as an automatic fallback.
- Do not assume workflow concurrency provides durable exactly-once execution.

Research setup is an explicit external configuration operation. It is separate from implementing the application.

## Task E1: Provision the exact research dependency

Type: TDD plus external integration.

Files:

- Create: src/research/provision.ts
- Create: resources/research/workflow-contract.json
- Modify: src/main/vault.ts
- Test: tests/research-provision.test.ts

Interfaces:

- Produces: validated provisioning record.
- Records: repository, environment, workflow digest, kit-tree digest, source commit, input schema.

Definition of Done:

- Deploy the legally reusable pinned kit tree and required workflow together.
- Do not overwrite an unrelated kit tree without an explicit setup decision.
- Store the permanent runtime credential separately.
- Provisioning credentials are discarded after setup.
- Environment secrets remain environment-scoped.
- `RESEARCH_KIT_COLLECTION_ENV` is an environment variable, not a repository variable.
- Verify repository visibility and environment support.
- Test against a repository with no previous kit installation.

Permission matrix:

| Operation | Required permission |
|---|---|
| Install kit files | Contents: write |
| Install workflow files | Contents: write and Workflows: write |
| Create research environment | Administration: write |
| Set environment secrets/variables | Environments: write |
| Runtime dispatch/cancel/list/artifact access | Actions: write/read as required |
| Runtime inspect pinned contents | Contents: read |

Keep the runtime credential limited to Actions read/write, Contents read, and implicit Metadata read.

Step 1:

```ts
import { expect, test } from "vitest";
import { validEnvironmentMarker } from "../src/research/provision";

test("rejects a repository-scoped collection marker", () => {
  expect(validEnvironmentMarker({
    environment: "research-collection",
    environmentValue: "research-collection",
    repositoryValue: undefined
  })).toBe(true);

  expect(validEnvironmentMarker({
    environment: "research-collection",
    environmentValue: undefined,
    repositoryValue: "research-collection"
  })).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/research-provision.test.ts
```

Expected: FAIL because provisioning checks are absent.

Step 3:

```ts
export function validEnvironmentMarker(input: {
  environment: string;
  environmentValue?: string;
  repositoryValue?: string;
}): boolean {
  return input.environment === "research-collection"
    && input.environmentValue === "research-collection"
    && input.repositoryValue === undefined;
}
```

Step 4:

```powershell
npm test -- tests/research-provision.test.ts
```

Use fakes in ordinary tests. A real throwaway-repository provisioning and dispatch run is a separately authorized release-qualification activity.

Step 5:

```powershell
git add src/research/provision.ts resources/research/workflow-contract.json src/main/vault.ts tests/research-provision.test.ts
git commit -m "feat: provision the pinned research pipeline"
```

## Task E2: Persist and reconcile research jobs

Type: TDD.

Files:

- Create: src/research/policy.ts
- Create: src/research/github.ts
- Create: src/research/service.ts
- Test: tests/research-jobs.test.ts

Interfaces:

- Produces: validateDispatchInputs and durable job state.
- Consumes: pinned workflow contract and purpose-bound runtime credential.

Definition of Done:

- Persist job/client identity before dispatch.
- Lost POST responses become uncertain.
- Reconcile by unique identity before any retry.
- Restart resumes polling.
- Poll at 3 seconds initially, multiply by 1.5, cap at 30 seconds.
- Use a 15-minute application deadline.
- Deadline expiration requests cancellation; it does not assert remote termination.
- Respect rate-limit responses.
- Stop uses the GitHub cancellation endpoint.
- Offline cancellation remains pending.

Step 1:

```ts
import { expect, test } from "vitest";
import { validateDispatchInputs } from "../src/research/github";

test("oversized research never becomes an automatic repository write", () => {
  expect(() => validateDispatchInputs({
    client_ref: "job-1",
    topic: "x".repeat(9000)
  })).toThrow("RESEARCH_INPUT_TOO_LARGE");
});
```

Step 2:

```powershell
npm test -- tests/research-jobs.test.ts
```

Expected: FAIL because input validation is absent.

Step 3:

```ts
export function validateDispatchInputs(
  inputs: Record<string, string>
): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(inputs.client_ref ?? ""))
    throw new Error("INVALID_CLIENT_REF");

  if (Buffer.byteLength(JSON.stringify(inputs), "utf8") > 8000)
    throw new Error("RESEARCH_INPUT_TOO_LARGE");
}
```

Also validate the exact allowed input names, depth, runner, search transport, and page bounds.

Step 4:

```powershell
npm test -- tests/research-jobs.test.ts
```

Test accepted-response loss, duplicate matching runs, 401, 403, 429, queued workflows, failed workflows, restart, and offline cancellation.

Step 5:

```powershell
git add src/research/policy.ts src/research/github.ts src/research/service.ts tests/research-jobs.test.ts
git commit -m "feat: track and reconcile bounded research jobs"
```

## Task E3: Validate and import research artifacts

Type: TDD.

Files:

- Create: src/research/corpus.ts
- Create: vendor/research-kit/
- Test: tests/corpus.test.ts
- Modify: THIRD_PARTY_NOTICES.md

Interfaces:

- Produces: verified corpus records bound to the expected remote job.
- Consumes: the kit's validator, artifact format, and pinned resources.

Definition of Done:

- Validate repository, run ID, attempt, correlation identity, workflow identity, and artifact digest.
- Validate ZIP paths and expansion limits before extraction.
- Verify all manifest file hashes and ledger integrity.
- Preserve the original collected artifact.
- Extract into app-owned research storage.
- Imported AGENTS.md and similar files remain data.
- Collection integrity and build readiness remain separate.
- Download completed artifacts promptly; 24 hours is the application target.
- Missed retention windows produce an honest unavailable result.

Step 1:

```ts
import { expect, test } from "vitest";
import { matchesResearchJob } from "../src/research/corpus";

test("rejects a valid artifact from a different run", () => {
  expect(matchesResearchJob(
    { repository: "owner/repo", runId: 10, clientRef: "job-a" },
    { repository: "owner/repo", runId: 11, clientRef: "job-a" }
  )).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/corpus.test.ts
```

Expected: FAIL because artifact identity checking is absent.

Step 3:

```ts
interface ResearchIdentity {
  repository: string;
  runId: number;
  clientRef: string;
}

export function matchesResearchJob(
  expected: ResearchIdentity,
  actual: ResearchIdentity
): boolean {
  return expected.repository === actual.repository
    && expected.runId === actual.runId
    && expected.clientRef === actual.clientRef;
}
```

Invoke the actual pinned kit validator for its complete format/ledger rules. Package the full resources needed by validation, preflight, and handoff.

Do not declare a partial clean-room validator equivalent to all three.

Step 4:

```powershell
npm test -- tests/corpus.test.ts
```

Run the pinned kit's verified self-test command in CI after resolving its actual vendored layout.

Required corruption cases: wrong job, wrong attempt, altered file, missing file, broken ledger, traversal, duplicate path, excessive expansion, and unsupported format version.

Step 5:

```powershell
git add src/research/corpus.ts vendor/research-kit tests/corpus.test.ts THIRD_PARTY_NOTICES.md
git commit -m "feat: validate and import correlated research artifacts"
```

## Task E4: Gate research-dependent builds on evidence

Type: TDD.

Files:

- Create: src/research/coverage.ts
- Create: src/research/review.ts
- Test: tests/research-review.test.ts

Interfaces:

- Produces: uncoveredQuestions.
- Produces: immutable evidence versions and human review receipts.

Definition of Done:

- Every blocking question needs supported coverage.
- Source IDs must resolve to verified captures.
- Contradictions are separate records.
- Any unresolved blocking contradiction prevents readiness.
- “Primary” and “verified” claims remain auditable judgments, not automatic truth.
- Run actual kit preflight and handoff on the authored workspace.
- Human review is a separate application event.
- Review binds project, policy revision, questions, source digests, claims, and brief.
- Changing any bound content invalidates review.

Step 1:

```ts
import { expect, test } from "vitest";
import { evidenceReady } from "../src/research/coverage";

test("a supported claim cannot hide a blocking contradiction", () => {
  expect(evidenceReady({
    uncoveredQuestionIds: [],
    unresolvedBlockingContradictions: ["conflict-1"],
    kitPassed: true
  })).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/research-review.test.ts
```

Expected: FAIL because readiness logic is absent.

Step 3:

```ts
export function evidenceReady(input: {
  uncoveredQuestionIds: string[];
  unresolvedBlockingContradictions: string[];
  kitPassed: boolean;
}): boolean {
  return input.uncoveredQuestionIds.length === 0
    && input.unresolvedBlockingContradictions.length === 0
    && input.kitPassed;
}
```

Final authorization additionally requires a matching real user review receipt. Models cannot invoke that action through their tools.

Step 4:

```powershell
npm test -- tests/research-review.test.ts
```

Test changed briefs, source changes, stale policy, invented source IDs, conflicting evidence, failed kit checks, missing human review, and model attempts to approve itself.

Step 5:

```powershell
git add src/research/coverage.ts src/research/review.ts tests/research-review.test.ts
git commit -m "feat: require covered and reviewed research evidence"
```

## Task E5: Complete the research experience

Type: Integration.

Files:

- Modify: src/renderer/ResearchPanel.tsx
- Modify: src/renderer/SettingsPanel.tsx
- Test: e2e/research.spec.ts
- Create: docs/research-integration.md

Implementation:

- Explain which providers receive queries and captures.
- Show public-repository disclosure before enabling public research.
- Show collecting, validating, synthesizing, and awaiting-review separately.
- Link claims to source captures.
- Allow bounded follow-up research.
- Expose actual remote cancellation state.
- Keep build continuation bound to the approved evidence version.
- Render hostile research text without granting it authority.
- Provide corpus retention and purge controls.
- Preserve review metadata and hashes when a corpus is purged; mark source bodies unavailable.

Verification:

```powershell
npm run build
npm run test:e2e -- e2e/research.spec.ts
```

Commit:

```powershell
git add src/renderer/ResearchPanel.tsx src/renderer/SettingsPanel.tsx e2e/research.spec.ts docs/research-integration.md
git commit -m "feat: complete research collection and evidence review"
```

Milestone E: The agent can perform real research, preserve its provenance, and request review before a research-dependent build.

---

# F. Release and Reliability Implementation Plan

For agentic workers: This is a living plan. Steps use checkbox (- [ ]) syntax so progress can be tracked. Adjust, reorder, or expand tasks freely before or during implementation.

Skill version: writing-plans@2.1

Goal: Deliver an installable, recoverable Windows application with evidence-backed support claims.

Architecture: Global quiescence protects updates; verified backups protect migrations; installed-app and hardware tests establish release readiness.

Tech Stack: Electron updater, NSIS, SQLite, Vitest, Playwright, Windows qualification machines.

Spec: All preceding sections.

Global Constraints: G01–G28 apply unchanged.

## Task F1: Implement quiescent updates and recoverable migrations

Type: TDD.

Files:

- Create: src/engine/quiescence.ts
- Create: src/main/updates.ts
- Modify: src/engine/migrations.ts
- Test: tests/migrations.test.ts

Interfaces:

- Produces: mayInstall.
- Produces: prepareForUpdate/quiescent protocol.
- Consumes: engine epoch, admission state, operation journal, leases.

Definition of Done:

- New work is rejected after drain begins.
- A matching quiescence receipt is required.
- Main observes engine exit before installation.
- Force restart uses ordinary cancellation/reconciliation.
- Back up SQLite consistently using the backup API.
- Verify backup integrity before migration.
- Apply ordered transactional migrations.
- Reject unsupported downgrades.
- Recover from interruption using verified backup and journal state.

Step 1:

```ts
import { expect, test } from "vitest";
import { mayInstall } from "../src/engine/quiescence";

test("a stale checkpoint cannot authorize installation", () => {
  expect(mayInstall({
    currentEpoch: "new",
    receiptEpoch: "old",
    admissionClosed: true,
    activeOwnedWork: 0,
    engineExited: true
  })).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/migrations.test.ts
```

Expected: FAIL because the installation gate is absent.

Step 3:

```ts
export function mayInstall(input: {
  currentEpoch: string;
  receiptEpoch: string;
  admissionClosed: boolean;
  activeOwnedWork: number;
  engineExited: boolean;
}): boolean {
  return input.currentEpoch === input.receiptEpoch
    && input.admissionClosed
    && input.activeOwnedWork === 0
    && input.engineExited;
}
```

Step 4:

```powershell
npm test -- tests/migrations.test.ts
```

Test new-work admission during drain, stale receipts, active commands, active inference, pending remote cancellation, corrupted backup, process death during migration, and unsupported downgrade.

Step 5:

```powershell
git add src/engine/quiescence.ts src/main/updates.ts src/engine/migrations.ts tests/migrations.test.ts
git commit -m "feat: protect updates with quiescence and verified recovery"
```

## Task F2: Implement redacted diagnostics

Type: TDD.

Files:

- Create: src/diagnostics/redact.ts
- Create: src/diagnostics/export.ts
- Test: tests/diagnostics.test.ts
- Create: docs/support.md

Interfaces:

- Produces: user-previewed diagnostic ZIP.
- Consumes: trusted vault redaction.

Definition of Done:

- Logs are field-allowlisted and redacted before writing.
- Managed secret values are matched inside the vault boundary.
- Longer overlapping secrets are removed first.
- Pattern detection is a secondary defense.
- Export categories are individually selectable.
- Source code and transcripts are excluded by default.
- No automatic upload occurs.

ZIP contents:

```text
diagnostics.json
logs/
```

Categories:

- Versions.
- Hardware summary.
- Operation counts/statuses.
- Error codes.
- Redacted configuration.
- Redacted logs, when selected.

Step 1:

```ts
import { expect, test } from "vitest";
import { replaceKnownSecrets } from "../src/diagnostics/redact";

test("redacts longer overlapping values first", () => {
  expect(replaceKnownSecrets("abc123 abc", ["abc", "abc123"]))
    .toBe("[redacted] [redacted]");
});
```

Step 2:

```powershell
npm test -- tests/diagnostics.test.ts
```

Expected: FAIL because the redaction helper is absent.

Step 3:

```ts
export function replaceKnownSecrets(text: string, secrets: string[]): string {
  return [...secrets]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .reduce((result, secret) =>
      result.split(secret).join("[redacted]"), text);
}
```

Production invocation remains inside the trusted credential boundary. The engine/renderer diagnostic path never receives the secret list.

Step 4:

```powershell
npm test -- tests/diagnostics.test.ts
```

Test overlapping credentials, authorization headers, JWT/PEM patterns, deselected categories, path redaction, ZIP structure, and absence of source/transcript content by default.

Step 5:

```powershell
git add src/diagnostics tests/diagnostics.test.ts docs/support.md
git commit -m "feat: export previewed redacted diagnostics"
```

## Task F3: Package the Windows installer

Type: Setup and integration.

Files:

- Create: electron-builder.yml
- Create: buildResources/icon.ico
- Modify: package.json
- Modify: scripts/build.mjs
- Create: docs/release.md
- Test: e2e/installer.spec.ts

Definition of Done:

- Per-user NSIS installer.
- Start Menu entry.
- Real application branding.
- No end-user development tools required.
- Native helper and kit resources resolve in the installed application.
- SQLite loads in the packaged engine.
- Ordinary uninstall preserves user data.
- Production signing is required.
- Update verification remains enabled.
- Both package commands build current JS and native sources first.

Required scripts:

```json
{
  "scripts": {
    "main:check": "node -e \"require('fs').accessSync('dist/main.cjs')\"",
    "native:build": "cmake -S native -B .build/native -A x64 && cmake --build .build/native --config Release",
    "prepackage:win": "npm run native:build && npm run build && npm run main:check",
    "package:win": "electron-builder --win nsis",
    "prepackage:release": "npm run native:build && npm run build && npm run main:check",
    "package:release": "electron-builder --win nsis -c.forceCodeSigning=true"
  }
}
```

Packaging requirements:

- Main entry: dist/main.cjs.
- Include dist and production dependencies.
- Unpack native SQLite binaries as required.
- Include rework-host.exe under resources.
- Include runtime/catalogue/qualification metadata.
- Include all legally reusable kit resources required at runtime.
- Exclude credentials, local models, source-project copies, and test result secrets.
- Supply the real update feed and publisher identity through the release environment.
- Reject missing or example-valued production update configuration.

Verification:

```powershell
npm ci
npm test
npm run typecheck
npm run lint
npm run package:win
```

Install on a clean Windows VM and run the full installed-app suite using an explicit installed executable path.

Do not treat launching `electron .` as installer validation.

Commit:

```powershell
git add electron-builder.yml buildResources/icon.ico package.json scripts/build.mjs docs/release.md e2e/installer.spec.ts
git commit -m "build: package and verify the Windows installer"
```

## Task F4: Qualify the actual product

Type: Integration.

Files:

- Modify: e2e/
- Create: docs/model-qualification.md
- Create: docs/permissions.md
- Create: docs/architecture.md
- Produce: test-results/performance.json

Required matrix:

- Clean Windows installation without developer tools.
- Windows 10 22H2 and Windows 11.
- CPU-only configuration.
- Qualified NVIDIA configuration.
- Unsupported/unknown GPU.
- Low available memory.
- Offline startup.
- Provider authentication failure.
- Rate limiting.
- Long total paths and Unicode paths.
- Missing Git.
- Interrupted command.
- Engine crash.
- Interrupted model download.
- Interrupted migration.
- Research response loss.
- Research cancellation while offline.
- Installed application update.
- High contrast and display scaling.
- Keyboard-only journey.
- Narrator or NVDA screen-reader pass.

Performance targets:

| Measurement | Target |
|---|---|
| Cold launch to interactive workbench | p95 ≤ 5 seconds on reference SSD |
| Idle owned Electron-process working sets, without model | ≤ 500 MiB on reference machine |
| Stop UI acknowledgement as cancelling | ≤ 250 ms |
| Owned command-tree termination after Stop | ≤ 5 seconds |
| Long history | 10,000 events with virtualization |

Methodology:

- Use at least twenty measured cold launches.
- Record process start and interactive-renderer readiness.
- Include renderer, GPU, utility, and main processes in the defined memory measurement.
- State that summed working sets may count shared pages more than once.
- Measure Stop acknowledgement separately from actual termination.
- Record machine identity, OS, driver, app hash, runtime/model identities, and test version.

One real Research Kit setup/dispatch/import/review journey must run against authorized throwaway infrastructure.

Real local qualification must use actual models. No mock can satisfy it.

Commit:

```powershell
git add e2e docs/model-qualification.md docs/permissions.md docs/architecture.md
git commit -m "test: qualify installed desktop behavior and local configurations"
```

## Task F5: Enforce evidence-backed release readiness

Type: TDD.

Files:

- Create: scripts/verify-release.mjs
- Test: tests/release.test.ts
- Modify: docs/release.md

Interfaces:

- Produces: releaseReady from validated evidence records.
- Consumes: current build identity and retained test artifacts.

Definition of Done:

- Evidence schemas are strict.
- Missing evidence fails.
- Stale evidence from another build fails.
- Installer hash matches the artifact tested and signed.
- Qualification records match the shipped activation set.
- Signing verification is performed on the actual installer.
- Review status distinguishes specified, implemented, tested, and qualified.
- No source document's “closed” label substitutes for test evidence.

Required evidence:

```text
test-results/unit.json
test-results/e2e-dev.json
test-results/e2e-installed.json
test-results/search-history.json
test-results/performance.json
packaging/installer.sha256
packaging/signature-verification.json
migration/migration-test-report.json
qualification/<configuration-id>/receipt.json
research/real-dispatch-record.json
catalogue-freeze/runtime-lock.json
catalogue-freeze/catalogue-lock.json
register/requirement-status.json
```

Evidence records bind to relevant identities:

- Source revision and clean-tree status.
- Dependency lock digest.
- Build ID.
- Tested executable/installer hash.
- Activation-set digest.
- Test/qualification suite version.
- Producer and execution timestamp.
- Machine/environment where relevant.

Step 1:

```ts
import { expect, test } from "vitest";
import { sameBuildEvidence } from "../scripts/verify-release.mjs";

test("rejects passing results from another build", () => {
  expect(sameBuildEvidence(
    { buildId: "current", artifactHash: "hash-a" },
    { buildId: "old", artifactHash: "hash-a", passed: true }
  )).toBe(false);
});
```

Step 2:

```powershell
npm test -- tests/release.test.ts
```

Expected: FAIL because release evidence validation is absent.

Step 3:

```js
export function sameBuildEvidence(build, evidence) {
  return evidence.passed === true
    && evidence.buildId === build.buildId
    && evidence.artifactHash === build.artifactHash;
}
```

The production verifier additionally validates schemas, actual files, signatures, required case coverage, qualification identities, and provenance records. This helper alone is not release readiness.

Step 4:

```powershell
npm test -- tests/release.test.ts
node scripts/verify-release.mjs
```

Required negative cases:

- Missing file.
- Malformed JSON.
- Wrong schema version.
- Failed test.
- Empty test suite.
- Wrong build ID.
- Wrong installer hash.
- Unsigned installer.
- Invalid signature.
- Mock qualification.
- Qualification for another runtime/backend.
- Missing lab receipt.
- Unverified Research Kit integration.
- Unresolved critical requirement.

Step 5:

```powershell
git add scripts/verify-release.mjs tests/release.test.ts docs/release.md
git commit -m "build: enforce current-artifact release evidence"
```

Milestone F: Rework has a verified Windows installer and documented evidence for its supported capabilities.

---

# 7. Final acceptance journey

The release is complete only when this journey succeeds in the installed application:

1. Install on a clean supported Windows machine.
2. Launch without Node.js, Python, a compiler, credentials, or downloaded models.
3. Open and trust a local project.
4. Configure and test an API profile.
5. Ask a question using project context.
6. Produce a plan without project mutation.
7. Approve a build operation.
8. Perform a journaled file edit.
9. Run an approved command and capture its result.
10. Review the diff and undo an unchanged recorded edit.
11. Stop a command tree without terminating unrelated processes.
12. Restart during work and recover without blindly repeating side effects.
13. Enable local inference with visible storage and download information.
14. Probe and select an eligible configuration for this PC.
15. Show a clear local-unavailable result when no configuration qualifies.
16. Confirm that a local-only project never silently uses an external model.
17. Perform a real Research Kit collection.
18. Inspect sources, claims, contradictions, and coverage.
19. Approve the exact research version before a dependent build.
20. Run a bounded multi-agent mission with verified dependencies.
21. Pause, restart, and resume that mission.
22. Delete a conversation and verify that its history search entries disappear.
23. Remove an inactive model without deleting shared active blobs.
24. Export diagnostics without credentials or project contents by default.
25. Install a signed application update through the quiescence protocol.
26. Confirm that projects, history, credentials, and model configuration survive.
27. Uninstall ordinarily and confirm that preserved user data is documented.

---

# 8. Release inputs and honest completion

The following are real external inputs, not values an AI may invent:

- Rights to redistribute any bundled upstream code.
- Production signing identity and credentials.
- Production update-feed ownership and URL.
- Actual qualification hardware.
- Actual model benchmark results.
- Authorized GitHub infrastructure for the real research integration test.
- Real model/runtime artifacts matching the recorded digests.

Their absence does not prevent unrelated implementation work.

Their absence does prevent claiming the corresponding distribution or support requirement is complete.

If no candidate model meets qualification targets:

- Keep API operation usable.
- Report local unavailability honestly.
- Retain failure evidence.
- Evaluate additional candidates or change requirements explicitly.
- Do not lower qualification thresholds silently.

---

# 9. Requirement tracking

Create `register/requirement-status.json` during implementation.

Each requirement record contains:

```json
{
  "id": "G06",
  "ownerTask": "D3",
  "status": "specified",
  "tests": [],
  "evidence": [],
  "notes": ""
}
```

Allowed statuses:

```text
specified
implemented
tested
qualified
blocked-external
```

Rules:

- `implemented` requires actual application code.
- `tested` requires retained passing behavior tests.
- `qualified` requires installed-product or real-hardware evidence where applicable.
- A code snippet in this plan is not implementation evidence.
- A reviewer's statement that a gap is closed is not test evidence.
- JSON schema validity does not prove a benchmark was executed.
- Release verification checks consistency and provenance; it does not make fabricated evidence truthful.

---

# 10. Primary technical references

These references explain mechanisms. The pinned source or dependency version governs implementation when current documentation differs.

- Electron process model:
  https://www.electronjs.org/docs/latest/tutorial/process-model

- Electron utility processes:
  https://www.electronjs.org/docs/latest/api/utility-process

- Electron environment-variable limitations:
  https://www.electronjs.org/docs/latest/api/environment-variables

- Electron security:
  https://www.electronjs.org/docs/latest/tutorial/security

- Electron safeStorage:
  https://www.electronjs.org/docs/latest/api/safe-storage

- Electron networking:
  https://www.electronjs.org/docs/latest/api/net

- Windows Job Objects:
  https://learn.microsoft.com/en-us/windows/win32/procthread/job-objects

- Windows maximum path limitations:
  https://learn.microsoft.com/en-us/windows/win32/fileio/maximum-file-path-limitation

- SQLite backup API:
  https://www.sqlite.org/backup.html

- SQLite FTS5:
  https://www.sqlite.org/fts5.html

- Ollama Windows:
  https://docs.ollama.com/windows

- Ollama chat:
  https://docs.ollama.com/api/chat

- Ollama GPU support:
  https://docs.ollama.com/gpu

- Anthropic thinking and tool-use continuation:
  https://platform.claude.com/docs/en/build-with-claude/thinking

- GitHub repository contents:
  https://docs.github.com/en/rest/repos/contents

- GitHub environments:
  https://docs.github.com/en/rest/deployments/environments

- GitHub Actions variables:
  https://docs.github.com/en/rest/actions/variables

- GitHub workflow runs:
  https://docs.github.com/en/rest/actions/workflow-runs

- Research Kit pinned collector:
  https://github.com/StepenkoAnatoli/Research-Kit/blob/e4a799f3fa07eb0c7377a1f350bae7cf987c5110/.github/workflows/collect.yml

- Electron Builder updates:
  https://www.electron.build/docs/features/auto-update/

---

# 11. Instructions for the reviewing AI

Review this plan before implementation.

Prioritize:

1. Contradictions between contracts, tests, and production behavior.
2. Missing transitions in cancellation, recovery, and updates.
3. Provider-specific conversation round-trip requirements.
4. Actual backend identity and local-model qualification.
5. Research Kit compatibility with the pinned workflow.
6. Permissions and credential lifecycle.
7. Installer behavior on clean Windows machines.
8. Evidence that could pass without exercising the real feature.

For each finding, provide:

- Severity.
- Exact section/task.
- A concrete failure scenario.
- Whether the issue is confirmed or an unverified assumption.
- A primary source or executable reproduction when available.
- The smallest correction preserving the intended product.

Do not count an issue as fixed solely because a paragraph promises a future test.

Do not reopen a previously corrected issue without explaining why this document still contains it.

Do not implement the application until implementation is requested.

---

The plan is intentionally a living document. Tasks may be split, reordered within their dependencies, or expanded when evidence requires it. Preserve the product requirements, permission boundaries, and acceptance criteria when making those changes.
````


gaps to close:

I’ll close the remaining specification gaps and check that the contracts, implementation steps, and tests agree. I’ll provide the new Markdown here for you to save; this session’s read-only access prevents me from creating the local file.

I’m using the writing-plans skill (v2) to create a living implementation plan.

This revision will include the full request-and-response schemas, a specific proxy/TLS implementation, concrete model-evaluation fixtures, and precise recovery rules. I’ll keep those contracts inside the document so the next AI won’t need the earlier reviews.

Five concrete closures to carry into the new plan:

1. **Make IPC a complete contract, including retry and authorization semantics.**

   v0.0.2 lists methods and one parameter schema, but leaves every response, error, and most retry behavior to the implementer. Define one `MethodSpec` registry containing request schema, response schema, owner, effect class, and authorization rule; generate TypeScript request/response unions from this registry.

   Use this exact envelope:

   ```ts
   type Request<M extends Method> = {
     protocolVersion: 1;
     clientRequestId: string; // UUID generated before submission
     method: M;
     params: Params<M>;
   };

   type Response<M extends Method> =
     | { clientRequestId: string; ok: true; result: Result<M> }
     | {
         clientRequestId: string;
         ok: false;
         error: {
           code: ErrorCode;
           message: string;
           retry: "never" | "same-request" | "after-reconcile";
         };
       };
   ```

   For mutations, persist `(method, clientRequestId, canonicalInputHash, acceptedEntityId, response)` transactionally. Same identity/body returns the existing result; same identity/different body produces `REQUEST_ID_REUSED`. A lost `run.start` reply must never create another run. Research dispatch similarly returns a persisted job identity before remote execution.

   Use strict schemas for responses as well as inputs. A response test must reject an accidentally included `secret`, `rootPath`, or provider wire-state field where the public result does not authorize it. Enumerate actual DTO fields and bounds in the plan; “one schema per method” does not close this gap.

2. **Specify trust revocation and credential writes across the main/engine boundary.**

   v0.0.2 improves secret-purpose handling but does not define distributed save/deletion recovery or active-run privacy revocation.

   Add `Project.trustRevision` and bind runs/operations to it. Every tool admission and external inference request rechecks current project trust and privacy policy. Trust revocation prevents new reads/mutations immediately, cancels active project runs, and invalidates pending approvals. Changing to local-only cancels external streams and forbids the next provider request; it does not rewrite completed history. Rel

inking changes root identity and trust revision, requires renewed trust, and invalidates old path approvals.

   Native folder selection returns a main-issued single-use ticket, expiring after ten minutes; the renderer never submits an arbitrary root. `project.trust` consumes that ticket and returns the registered project DTO.

   Credential save sequence: main durably writes ciphertext under a new opaque reference; engine transaction creates the profile revision referring to it; main marks the reference committed. Startup deletes only staged orphan references unreferenced by any committed profile/job. Credential deletion first tombstones access and cancels authorized contexts, then removes ciphertext. A crash cannot leave an apparently valid profile pointing to a silently deleted secret.

   `profile.test` creates its own durable `testId`, binds it to a specific profile revision and secret reference, permits only the inert provider probe, and expires after 30 seconds. It must not require an ordinary agent run.

3. **Replace mission “verification” prose with typed, output-bound receipts.**

   Current mission examples prove dependency sorting, not verified completion. Define:

   ```ts
   type VerificationSpec =
     | { kind: "command"; commandTemplateId: string; expectedExitCode: 0 }
     | { kind: "review"; reviewerTaskId: string };

   interface VerificationReceipt {
     id: string;
     taskId: string;
     taskRevision: number;
     outputManifestDigest: string;
     verifierRunId: string;
     verificationSpecDigest: string;
     verdict: "pass" | "fail";
     evidenceArtifactIds: string[];
     createdAt: string;
   }
   ```

   `outputManifestDigest` hashes an engine-generated manifest of artifact IDs and file-after hashes. Completion is a store transaction that validates the receipt against the task revision, output manifest, declared verifier, and verification specification. A reviewer cannot submit a receipt for its own producer task. No free-text “tests passed” field can satisfy command verification.

   Clarify pause: stop admitting new tasks; let running tasks reach verified terminal boundaries. Explicit force-pause uses Stop and leaves those tasks interrupted. Resume uses existing run identities and reconciles unknown side effects. Budget exhaustion is blocked, never an automatic retry. Tests must exercise “producer succeeds but verifier fails,” stale output receipts, duplicate acceptance after restart, and interruption during verification.

4. **Choose an executable policy for unknown GPU memory and storage relocation.**

   Preserving `null` is necessary but does not specify selection. For v1, define:

   - GPU automatic selection requires trustworthy current free-VRAM telemetry matched to the receipt’s actual adapter and sufficient host memory.
   - If free VRAM is unknown, automatic selection chooses an eligible CPU configuration; it never adds adapter capacities or substitutes total VRAM.
   - Optional GPU use under unknown telemetry is an explicit user-selected experimental configuration, excluded from “automatically qualified” support claims.
   - A backend mismatch invalidates the probe rather than producing a receipt under the requested backend label.
   - Each receipt references an immutable activation set containing its exact runtime, model, and lab receipt.

   Define `model.storage.change` as a persisted relocation job: close admission of local work; drain owned inference/downloads; calculate required destination capacity; copy into destination staging; verify every referenced artifact; transactionally switch the storage-root setting; retain the old root until verification succeeds; then offer cleanup. Cancellation before switching deletes staging only. Restart after switching uses the committed root. Do not implement this as a raw directory move.

5. **Close handoff completeness with behavioral test code and evidence producers.**

   The previous task templates often test a one-line helper while the Definition of Done describes an entire subsystem. This is the principal gap against the requested writing skill.

   For every high-risk behavior, include an actual failing test and the concrete service interface under test. At minimum include executable tests for lost `run.start` responses, trust revocation during streaming, command-grandchild termination, crash after file replacement, thinking-signature round trips, leaseUse the fencing after following replacement networking specification. It selects one implementation and explicitly closes custom-certificate support through Windows-managed trust, avoiding an unverified app-local timeout certificate verifier.

,**Architecture and files**

Create `src/main/network.ts`, oversized research rejection `,src/providers wrong/-runtransport artifacts.ts,`, ` and staletests quies/networkcence.test receipts.ts`, and.

   Define ` exacte fixture2 ande/network output files.spec..ts Example`.

:All ` application-ownedtests provider/,fixtures/m Researchissions Kit/ver REST,ifier model-f-manails/ifest`,, ` andqualification artifact/ requestsfixtures use a/edit main-json-array-process/`, and broker ` backed by Electron `scriptsnet/.requestcollect`.-release-e Its dedicatedvidence,.mts non`.persistent session The latter is invokes named:

``` testts reporters,
const outbound hashes their actual = session outputs.from andPartition(" the testedre executablework,-out andbound", emits { the records cache: consumed by ` falseverify });
-releaseawait.m outboundjs.set`. EachProxy evidence filename must have a named producer({, schema, build binding, and verification command. A manually authored “success” JSON or an isolated `sameBuildEvidence` mode: test "system cannot" });
```

Chromium satisfy supplies Windows completion system proxy/P.

These closuresAC handling, preserve the architecture while eliminating HTTPS decisions the next tunn AIeling would otherwise invent., and supported proxy authentication. Do not introduce an independent Node/Undici network
