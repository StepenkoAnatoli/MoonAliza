# Verified model storage and local selection implementation plan

**Goal:** make verified model downloads usable by the owned runtime and select only configurations supported by valid receipts and current measured resources.

**Architecture:** build a new private model store inside activation staging, preserve exact manifest bytes, copy/hash each distinct blob once, verify the complete authoritative tree, and publish through the existing activation pointer. Treat Ollama metadata as disposable derived data and clear it before runtime launch. Keep receipt eligibility and resource selection deterministic and separate from the still-required real qualification producer.

**Spec:** source-plan.md D2–D5, managed-artifacts.md, managed-provider.md; research/BRIEF.model-store.md in the parent work directory. Existing full-build authorization covers execution. Research preflight passed after E-26–E-30 captures with zero blockers and eight existing warnings.

**Constraints:** Windows, pinned Node 24/Electron runtime and Ollama 0.34.4; no new dependency. No model/provider credentials in artifact transfers. No production receipt from fixtures. Host reserve max(2 GiB,15% total). Receipt identity includes model/runtime/backend/quantization/context/parallelism, current hardware/activation and expected adapters. Explicit local unavailability never enables cloud.

## Tasks

- [x] Implement `src/models/model-store.ts` with `materializeModels(specs,destination,{cacheDirectory,signal})`, `verifyModelStore(specs,directory,signal?)` and bounded `clearModelMetadata(directory)`. Test exact manifest bytes/names, shared-blob deduplication, no cache hardlinks, missing/changed/ambiguous identities, unsafe linked paths, unsupported/remote configurations, no overwrite, interruption cleanup, tampering and derived metadata. Run `npm test -- tests/model-store.test.ts` red then green.
- [x] Integrate materialization and read-time revalidation into ActivationStore before atomic activation. Return private store/name identities and checked lab receipts in ActiveSet; bind quantization to actual config. Clear only bounded regular derived cache files before owned runtime startup. Test actual activation/rollback/corruption and runtime fixture launch; keep the lease-before-store-lock order.
- [x] Implement `src/models/select.ts`: validate lab eligibility, exact machine identity/adapters/freshness/metrics, current reserve and known VRAM; rank valid installed receipts and plan lab-qualified first probes without inventing peak-memory estimates. Test stale/foreign/failed receipts, thresholds, reserve edge cases, unavailable telemetry and hardware, supported backends, deterministic ranking and no cloud fallback.
- [x] Run the materializer and production runtime against official pinned model artifacts, then inspect authenticated inventory and prove cleanup. This is a storage/inventory check unless a separately recorded genuine qualification run is performed; never manufacture lab/machine success evidence.
- [x] Run typecheck, lint, complete regression suite with JSON report, application build and relevant actual runtime verification. Update status, persistent plan, findings and output evidence. Record remaining real qualification producer, production trust inputs, main/setup integration, GPU attestation and storage lifecycle work. Keep user-reported privacy/context UX work visible in the full plan.

The existing installed 0.5 app is a separate checkpoint. A model store alone does not enable a model or establish coding quality. Unsupported local formats remain explicit until their pinned storage/runtime behavior is implemented and qualified.
