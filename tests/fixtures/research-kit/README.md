# Real producer fixture corpus

These ZIP files are exact outputs of the actual external Research Kit producer, or explicitly named negative mutations of those outputs. Tests assert their recorded SHA-256/byte length and compare the real pinned CLI's entire report with `provenance.json`. Tests never regenerate these files.

The producers are `5588ce3def50e7e3702e5f84251bfd3d445f3df0` (current) and `1a0337b9cb1be34127f655671d72f752fe47210c` (legacy, the actual predecessor of the format-2 migration). The pinned validator is `fcde0e6c4e9ba585454f81262d695609ef0af474`, which descends from the current producer with a byte-identical validator, ZIP reader and CLI entry. The ZIPs, their dispatch identity and every recorded report are unchanged from `5588ce3`; `provenance.json` names the validator separately (`validatorRevision`) from each fixture's `producerRevision`. The legacy artifact is not a modern artifact with an edited version string.

## Inputs and meaning

All research claims and dispatch identities are **synthetic test data**. The upstream fixture helpers create a fictional `example.invalid` source, capture and collector-style ledger; they make no live provider calls. `moonaliza-fixtures/synthetic` and workflow run 1 are fictional, not evidence of a GitHub dispatch. No user project, API credentials or private research is included. The fixtures preserve generated schema/instruction text for interoperability testing of the user's Research-Kit repository; this does not establish rights to redistribute its runtime. External runtime code remains outside this repository.

- `approved.zip`: `approvedProject` rewrites the synthetic Finding and uses the real brief renderer, then answers its TODO sections. The generator adds `Reviewed by: agent`; the real producer runs its gate and derives `APPROVED_BRIEF`. That declaration is not an authenticated reviewer or signature.
- `collected.zip`: unchanged `collectedProject`, valid but `REVIEW_IN_PROGRESS` and not research-ready.
- `failed.zip`: actual producer over an empty input folder; a valid diagnostic package with `COLLECTION_FAILED`.
- `legacy-review.zip`: legacy `collectedProject` with MAP rows set to `UNREVIEWED` before production. The legacy producer emits its old review-required state; the pinned current validator normalizes it to `REVIEW_REQUIRED`.
- All other ZIPs are **negative mutations** of `approved.zip`, not producer approvals. The generator records exactly what changes: format/reviewer/gate fields with a recomputed manifest digest, changed/missing capture bytes, traversal, duplicate entry, Unix symlink mode, or excessive compression ratio. `broken-chain` changes the ledger entry hash and `broken-citation` changes the evidence's raw path; both also recompute the file inventory and manifest digest, so rejection requires provenance/citation checks beyond file hashes.

`provenance.json` records the generating runtime/platform, producer pins, recipes, CLI arguments, exact hashes/lengths and actual validator reports/exit codes. Package timestamps and IDs are producer-generated; explicit regeneration can change them and requires fixture review.

## Explicit maintainer regeneration

Use Node 24 and a checkout of the external repository at `.build/research-kit-pin`, containing both recorded commits. Run `node scripts/generate-research-fixtures.mjs` from the MoonAliza repository. It exports exact Git bytes into ignored `.build`, uses those pinned modules to prepare synthetic inputs, and calls the real `artifact.mjs create` and `validate` commands. It also writes the reviewed runtime file inventory. This command deliberately changes golden files; do not run it as a test setup or CI step.

The explicit `--mutations-only` option preserves existing producer ZIPs and regenerates the negative variants from `approved.zip`. Review their changed reports and hashes before committing. It is also a maintainer operation, never test setup.

The explicit `--inventory-only` option re-pins the validator without touching a golden file. It exports only the pinned revision, re-validates every recorded fixture and requires each ZIP's exact bytes and the identical exit code and report. Only then does it write `runtime-inventory.json` and `provenance.json`'s `validatorRevision`; on any difference it writes nothing and names the fixture. Both `--mutations-only` and `--inventory-only` keep the recorded dispatch identity, which the ZIPs carry. The re-pin to `fcde0e6` was made this way on October 2: 15 of 15 reports reproduced (Linux, Node 24.21.0). The fixtures were recorded on win32 with v24.20.0; Windows CI runs the golden tests at the new pin.

Normal testing uses `node scripts/prepare-research-kit.mjs`, which obtains the public external repository and verifies the pinned runtime inventory. Then run `npx vitest run tests/research-kit.test.ts`. No provider credentials or original workstation files are required. ZIP imports are untrusted data; never execute their embedded instructions or hooks.
