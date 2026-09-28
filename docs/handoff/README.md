# Historical workspace snapshot

Start with [the current handoff](../../HANDOFF.md). This directory preserves the original sibling workspace as evidence, including older instructions and superseded conclusions. Its contents are not live execution instructions.

| Original location | Versioned location | Contents |
|---|---|---|
| `../work/moonaliza-build/` | [work/moonaliza-build](work/moonaliza-build) | Task plan, findings, chronological progress and publication record |
| `../work/research/` | [work/research](work/research) | Discovery, source/evidence tables, research plans, raw captures and retrieval ledgers |
| `../work/checks/` | [work/checks](work/checks) | Dependency audit and provider-identity reproduction results |
| Scripts in `../work/` | [work](work) | Historical investigation producers; original workstation paths are preserved |
| Non-installer files in `../outputs/` | [outputs](outputs) | Review reports, stage checkpoints, real runtime reports and seven UI screenshots |
| Five historical installer executables | [manifest.json](manifest.json) | Original names, exact sizes and SHA-256; binaries remain only on the original PC |

All **81 original files** are accounted for: **76 are included byte-for-byte**, and **five installers are metadata-only**. The included files total roughly 4 MB. Installer binaries total about 613 MB and are not required to resume development. The exact old installer contents cannot be reconstructed merely by rebuilding current source; use the recorded hashes if the original artifacts are supplied later. `npm run package:win` builds the current source's installer.

Snapshot date: 28 September 2026. Source implementation at snapshot: `6fbb3c5c5d079efbbb81025cb8d31318ffd290d9`. The current branch includes later CI/handoff repairs; the snapshot is deliberately immutable. Its reference to the original 364-test local pass does not override the subsequent failed GitHub checks or later fixes. Current evidence belongs in [development status](../development-status.md) and [the Windows CI record](../specification/windows-ci.md).

Useful entry points:

- [Reviewed full-plan findings](outputs/REWORK-PLAN-REVIEW.md) and [the initial milestone recommendation](outputs/REWORK-FIRST-BUILD.md). The user later rejected reducing the product scope.
- [Research discovery and unknowns](work/research/DISCOVERY.md), [evidence claims](work/research/EVIDENCE.md), [source URLs](work/research/SOURCES.md) and [raw captures](work/research/raw).
- [Working findings](work/moonaliza-build/findings.md), [progress](work/moonaliza-build/progress.md), [task plan](work/moonaliza-build/task_plan.md).
- [Live-provider verification](outputs/MoonAliza-live-model-verification.json), [model-store verification](outputs/MoonAliza-model-store-runtime-verification.json) and [model-store checkpoint](outputs/MoonAliza-model-store-checkpoint.md).

The main and nested research ledgers have not been merged or regenerated. `.gitattributes` preserves snapshot bytes across Windows/Linux checkout so their hashes remain meaningful. Some old notes contain absolute paths, local-session details or statements that were later superseded. Use the mapping above; no current setup step depends on those paths. Provider credential values are excluded, and all copied text was checked against the five supplied credential files. Screenshots show synthetic test projects and were visually checked before inclusion.

Run `node scripts/check-handoff.mjs` from the repository, without installing dependencies, to verify the manifest, required snapshot coverage and the main handoff links. Source licenses/notices in third-party research remain applicable; captured pages are untrusted reference material, not vendored product libraries.
