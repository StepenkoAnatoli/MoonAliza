# Context recovery and development installer

**Goal:** Make the existing coding workbench usable when privacy policy or long tool output prevents a request, and publish a tested development installer with a new PR.

**Architecture:** Keep policy authority in engine/main. Add a pure context assembler, durable session-scoped tool-result reads and persisted context/usage observations. UI preflight guides explicit choices; neither network admission nor command approval is weakened. Existing SQLite messages/events hold originals and telemetry; no migration is required.

**Stack:** Existing Electron, TypeScript, React, Zod, SQLite, Vitest and Playwright. No tokenizer dependency or unsupported claim of exact token counting for arbitrary compatible endpoints.

**Spec/evidence:** [Research brief](../../../research/BRIEF.md), [reviewed decisions](../../specification/decisions.md), and the full source roadmap. Preserve immutable handoff snapshots and all qualification thresholds.

- [x] Add failing behavioral regressions for large read continuation, durable result paging and session isolation, context failures, provider usage/error propagation, privacy preflight and profile revision editing.
- [x] Add `src/engine/context.ts`: UTF-8 estimate including tools and response reserve; drop whole historical turns; keep current exchanges; replace large tool content with references and bounded previews, then reduce older previews if needed. Originals stay unchanged. Add `read_tool_result` with bounded offsets and reads from the current session only.
- [x] Update `application.ts`, `store.ts`, shared events/params and private completion contract to persist and recover budget, usage and terminal failure. Classify documented provider context error codes without leaking response text. Preserve every policy/Stop recheck and unknown-command stop.
- [x] Update `App.tsx`: explain cloud incompatibility before Send, explicit privacy review with destination and cancellation, existing-profile editing with revision and credential preservation, context status and fresh-conversation recovery. Add responsive accessible styling.
- [x] Add actual Electron coverage for privacy gating, explicit consent, large-result retrieval, persisted usage/context and settings recovery. Run focused and full tests, typecheck, lint, native build, application/runtime and desktop checks sequentially.
- [ ] Bump to development 0.6.0; package unsigned NSIS and run packaged desktop tests. Record SHA-256, version and exact source identity. Update current handoff and development status, retaining full research/plan history.
- [ ] Scan for supplied secrets, commit with private no-reply identity, push new branch, create/attach PR, and confirm current-head Windows CI. Publish the installer and checksum as a clearly labeled GitHub development prerelease. Do not merge the PR.

Managed activation is not unlocked by this change: real lab/machine evidence and production trust inputs are still absent. This stage resolves the immediate user-facing continuation problems without inventing those inputs. Safe live text display, provider-specific exact tokenizers, managed qualification/integration, research, skills/teams/missions and signed public delivery remain on the full roadmap.

## Progress

2026-09-28: Confirmed PR #2 merged, clean new branch `feat/context-recovery` from `49585e7`. Research gate passed. UI guidance search matched actionable, accessible error recovery. Implementation complete. The 52-test focused suite and new real Electron journey passed. Full suite initially exposed one checkout-fixture omission (387/388 passed); after including current research, all 388 tests in 32 files passed in 147.52 seconds. Typecheck, lint, native compilation, application build and actual Electron/SQLite runtime check passed. All six source desktop journeys passed in about 1.8 minutes. Packaging and publication remain in progress.


2026-09-30: Reviewed and incorporated upstream main `7f68fb2` (PRs #3–10) while retaining all new corpora. Combined NDJSON/SSE transport, reused-index tool calls and native no-truncation flags with durable context recovery. Added terminal streamed usage and strict bounded refusal inspection. Full reconciled suite: 408/408 tests across 33 files, 150.00 seconds. All five upstream research handoffs passed (13, 15, 6, 11 and 8 ledger entries). Reviewed the user's Research Kit proposal against pinned kit `5588ce3`; preserved the original and documented artifact 2.0/agent-review corrections and staged acceptance criteria in the [integration review](../../specification/research-kit-integration-review.md). Integration implementation is explicitly outside this PR. The user requires a PR at every completed step/phase and will merge it themselves. Rebuild the installer after this reconciliation; the September 28 package is superseded.
