# MoonAliza model storage and selection checkpoint

## Model storage and selection source checkpoint

The current source passes **364 tests across 30 files** (184.54 seconds), TypeScript checking, lint and application build. The durable full-suite report is `.build/model-store-tests.json`, with no failed or pending tests. This adds 57 tests to the preceding provider checkpoint.

Verified activation now materializes local GGUF manifests and blobs into a private model store, preserves exact manifest bytes, copies shared blobs once without cache hardlinks, binds lab quantization to the installed configuration and rechecks model integrity on reopening. Interrupted copies remove their incomplete store. Startup validates and clears derived metadata; Stop waits for preparation to settle before another runtime starts. The Stop regression failed with that wait removed and passes with it restored.

Local selection validates linked lab evidence and exact machine identities, freshness, observed backend/adapters, measured quality and responsiveness, current RAM reserve and known GPU memory. It provides deterministic first-probe ordering without manufacturing machine receipts or cloud fallback. Real qualification evidence, production trust inputs and main/engine/setup integration remain required; the selector is not yet wired into the installed application.

The real **Qwen3 0.6B / Ollama 0.34.4** storage check passed in **86.09 seconds**. It verified the pinned 858-byte manifest, five blobs totaling **522,653,767 bytes**, exact runtime inventory digest/name/size/Q4_K_M quantization, all 82 runtime files, valid Ollama Inc. Authenticode, connected-socket ownership, cloud-disabled status, owned Stop, queued port reuse and temporary-store cleanup. No model was loaded for inference and no quality receipt was issued. Available host RAM was about **1.15 GiB**, below the 2 GiB reserve. See [storage and selection details](specification/model-store-selection.md) and [the retained real report](evidence/model-store-runtime.json).

Verification exposed two test-environment issues before the final passing run: framework deep comparison of a 32 MiB buffer consumed excessive memory, so the cancellation test now uses byte-for-byte Buffer comparison; an existing 200-file result-boundary test twice exceeded its 15-second harness limit, so that specific integration case now has 30 seconds while retaining all assertions. Its final run took 4.40 seconds. The initial full run was stopped during the excessive comparison; no success is claimed for that attempt. The first real registry check returned 404 on the manifest-digest route; the supported tag route remains bound to the same exact SHA-256 and size.

The installed desktop app remains **0.5.0** with its earlier tested encrypted Hugging Face profile. No new installer was produced. The user-reported privacy/provider guidance and conservative context-budget behavior remain scheduled Stage C work: retain explicit cloud consent, improve actionable profile selection, add accurate token accounting and bounded/retrievable tool results with controlled continuation. Full product scope remains open.


Repository: `C:/Users/PC/Desktop/CODEX PROJECT FOLDER/2026-09-24/files-mentioned-by-the-user-rework/MoonAliza`

Published draft PR: [https://github.com/StepenkoAnatoli/MoonAliza/pull/2](https://github.com/StepenkoAnatoli/MoonAliza/pull/2)

Branch: `feat/moonaliza-desktop`

Commit: `6fbb3c5c5d079efbbb81025cb8d31318ffd290d9`

Local verification passed; GitHub Windows checks were running at publication.
