# Verified local artifacts implementation plan

Goal: implement Stage D2's trusted metadata, streamed artifact cache, bounded runtime extraction and atomic activation, preserving the working application while qualification is incomplete.

Architecture: main-owned consumers validate an Ed25519 envelope against application-supplied trusted keys before interpreting URLs. Content-addressed downloads verify exact bytes and hashes, with range resumption bound to a strong ETag and the original descriptor. ZIP extraction writes a newly created destination on the selected volume. A complete immutable activation directory becomes current through one durable pointer replacement; the prior activation remains available. No catalogue or lab receipt is fabricated to enable models.

Spec: `docs/specification/source-plan.md`, sections 6.4 and D2–D4; corrections in `docs/specification/decisions.md`.

- [x] `catalogue.ts` and tests: signed byte envelope/domain separation, strict bounded descriptors, app compatibility, expiry/sequence rejection, exact linked runtime/model/receipt identities. Invalid signatures are rejected before payload interpretation. Trusted keys are application inputs, never payload inputs.
- [x] `download.ts` and tests: stream into a private content-addressed cache; check selected-volume free space; hash existing partial bytes; resume only with matching strong ETag and complete Content-Range; reject changed encoding/identity, short/long bodies, wrong digest and off-list redirects; bounded retry of public GETs only. Cancellation retains only resumable partial state.
- [x] `archive.ts` and tests: stream actual ZIP entries, reject Windows path aliases, links, duplicates and expansion limits, require absent destination, delete only owned partial extraction on failure.
- [x] `runtime.ts` and tests: download the complete signed set, verify referenced lab/evidence bytes and configuration matches, stage runtime and manifest, durably replace pointer, retain last known good. No receipt means no activation. Verify reopened state and rollbacks.
- [x] Exercise the streaming downloader and archive validator against Ollama v0.34.4's actual published archive. Keep it as a developer qualification candidate, not an enabled model or a released signed activation set.
- [x] Integrate/review targeted tests, typecheck and lint; run the full suite after integration. Keep Stage D and owned runtime work explicitly in progress until lifecycle, model qualification and UI are connected.

Verification: 262 tests / 24 files passed in 71.27 seconds, including 54 new artifact tests. The opt-in `scripts/check-runtime-artifacts.ts` verifier rehashed the cached 1.46 GB archive, extracted and checked 82 files, verified Ollama Inc. Authenticode, verified native-owned listener ancestry, observed an empty private model inventory, stopped the process, rebound the released port and removed its temporary extraction. Its report records 105.52 seconds total and no model inference performed.

Still open in the broader D2–D5 scope: production signed catalogue and actual quality evidence; reference-aware removal and storage relocation; model materialization and qualification; production owned-runtime scheduling/leases; main/IPC and setup UI. Test-generated keys and receipts do not satisfy these product requirements.

All fixtures use generated test signing keys. Private signing material never enters production sources. Production signing configuration and real lab receipts remain release/qualification inputs; tests cannot mint those claims. The user has already authorized the full implementation and key use; no repeat approval is required.
