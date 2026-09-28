# MoonAliza managed local artifacts — 27 September 2026

The verified runtime/model artifact backend is implemented and tested. The installed app remains version **0.5.0**, with the working encrypted Hugging Face profile. Managed model installation is not yet exposed in that app.

## Implemented

- Signed catalogue verification before artifact URLs are trusted, with compatibility, expiry and rollback checks.
- Streamed downloads with exact size/SHA-256 verification, resumable transfers bound to a strong ETag and range response, bounded retries, cancellation and disk-space checks.
- Bounded ZIP extraction with CRC and hash checks, rejecting traversal, Windows aliases, links, case collisions, encrypted entries and excessive expansion.
- Verification of runtime files and linked model blobs, qualification receipts and evidence.
- Staged activation through one current pointer, preserving the previous set on failure, checking integrity on reopen and reconciling interrupted pointer commits.

## Verification

**262 tests passed across 24 files**, including 54 artifact tests; no failures or pending tests. TypeScript, lint and build passed. The full test run took 71.27 seconds. An earlier Windows UI-worker startup timeout was resolved by reusing one worker per environment; the final result includes both UI test files.

The actual official Ollama **0.34.4** portable Windows archive passed production download and extraction validation: **1,461,155,106 bytes** compressed, **82 files**, and **1,929,981,750 bytes** expanded. Archive SHA-256: `535193f38f3344e5b08f5d1c171c31ce11aa17f0124ff69ae26d8ec7fe06fa62`.

The repeatable runtime check then passed in **105.52 seconds** with the cached archive rehashed first:

- Windows Authenticode: **Valid**, **Ollama Inc.**
- Real executable started through MoonAliza's native Windows Job Object helper.
- Listening port matched the expected executable and native-helper ancestry.
- Version endpoint returned 0.34.4; private model inventory was empty.
- Stop ended the owned process and the port was immediately reusable.
- Temporary extraction, home and model directories were removed.

The version endpoint became ready after 13.66 seconds. This measures runtime startup, not model loading, generation speed or coding quality. **No model inference or local coding qualification was performed.**

Detailed file identities and runtime results: [verification JSON](MoonAliza-local-runtime-verification.json). Reproduce from the repository with `node --import tsx scripts/check-runtime-artifacts.ts`; it downloads about 1.46 GB if uncached and extracts about 1.93 GB temporarily. Ordinary tests and builds do not run this verifier.

The supplied GitHub token was used only for official release metadata after unauthenticated API access returned 403. An exact-value scan of all 109 non-ignored repository files found neither the GitHub nor Hugging Face token. No commit, push or public release was made.

## Next implementation

Materialize and qualify real model candidates, implement the production runtime scheduler and its exclusive maintenance leases, then connect managed setup to the app. Production catalogue signing, retained quality evidence, reference-aware removal and storage relocation remain open. The full product scope is unchanged.
