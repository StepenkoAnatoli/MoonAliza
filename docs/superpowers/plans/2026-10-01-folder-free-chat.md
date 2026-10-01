# Folder-free chat implementation plan

> Execute locally with the executing-plans workflow, using behavioral tests and review checkpoints.

**Goal:** Saved chat without a folder, followed by deliberate workspace creation/attachment/switching.

**Architecture:** Nullable session/run workspace identity; shared engine; revisioned conversation policy intersected with project policy; reviewed text-only branching across scopes.

**Tech stack:** Existing Electron, React, TypeScript, Zod and SQLite dependencies.

**Spec:** [Design](../specs/2026-10-01-folder-free-chat-design.md), [product requirement](../../specification/folder-free-chat.md).

## Constraints

Preserve journal-before-effect, exact approvals, Stop, secrets and project trust. No research requirement for chat. No fake folder. No merged PR by the agent. Heavy checks run sequentially on this Windows host.

## Tasks

- [x] Add failing behavioral cases in tests/folder-free-chat.test.ts and a real v1 schema fixture: chat creation/restart, policy admission/revocation, no tools, branching isolation and SQLite migration/cascades.
- [x] Update src/engine/migrations.ts and store.ts plus shared contracts/params: nullable scope, session policy, run revision, strict branch/update methods and foreign-key integrity.
- [x] Update application.ts, engine/index.ts, main/index.ts and project-tool entry points: shared live admission, null scope denied for all tools, cancellation and main-owned folder creation.
- [x] Update renderer/App.tsx: usable no-folder composer, general-chat navigation, explicit privacy review, editable branch handoff and workspace selection; preserve existing project UI and keyboard access. Add renderer regressions.
- [x] Add real Electron folder-free/restart/create/attach/edit journey; run relevant tests, typecheck, lint, then full tests/build/runtime/desktop checks sequentially.
- [x] Update architecture, specification, HANDOFF.md, AGENTS.md and development status with actual behavior/evidence. Verify portable handoff and credentials scan.

Delivery is recorded by the phase PR and [0.7 release record](../../releases/0.7.0-dev.1.md): push, open/attach the PR, and inspect its exact-head CI. The user merges. Inspect the current remote status instead of inferring merge or CI state from this plan.

## Delivery evidence

Implemented. Complete 470-test run passed across 36 files in 234.98 seconds. Two additional recovery regressions reproduced lost drafts and weakened conversation privacy; all 12 final UI tests passed after their fixes. Final typecheck, lint, build, Electron/SQLite loading and all seven desktop workflows passed (1.5 minutes). Native compilation passed. The installer built successfully and all seven packaged desktop workflows passed (1.6 minutes). Installer identity and PR delivery are tracked in the release record and phase PR. PR #12 is merged at f98cee3 and both Windows checks on its source head 0475775 passed; this is baseline evidence only.
