# Discovery Contract — Rework plan review

Started 2026-09-24. This is a bounded review of the supplied plan, not authorization to implement or publish Rework.

## Build intent

Assess whether the supplied Rework Windows desktop plan is a sound foundation, identify concrete gaps, and recommend an evidence-based first implementation milestone. The intended product owns its agent engine, supports API and local inference, and eventually includes research and durable missions. The user confirmed personal use on their own Windows PC as the first audience. Done for this review means a prioritized findings report and actionable next steps, with unverified integration claims identified honestly.

## Unknowns

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|
| U-01 | Does the named Electron release exist, and what Node runtime does it embed? | Native SQLite and host API compatibility depend on it. | CLOSED | E-01: 44.4.5 embeds 24.21.0. Registry audit also confirms all 27 package/version pairs exist; compatibility remains untested. |
| U-02 | Which network transport satisfies the Windows proxy requirement? | Main/engine responsibilities and credential handling depend on this choice. | CLOSED | E-02: Electron net uses Chromium networking with system proxy support. Actual pinned-runtime tests remain necessary. |
| U-03 | What provider continuation state must survive tools and restart? | Canonical contracts must preserve native protocol state. | CLOSED | E-03: preserve signed native thinking blocks unchanged; display text is not the continuation state. |
| U-04 | Is the exact Research Kit workflow retrievable? | The plan depends on exact workflow inputs and API behavior. | CLOSED | E-04: pinned workflow retrieved and its input contract inspected. |
| U-05 | Can nominally read-only Git commands invoke configured executables? | Ask/Plan must not expose an undeclared command-execution route. | CLOSED | E-05 and E-06: textconv/external diff and fsmonitor can invoke programs. |
| U-06 | Are Research Kit redistribution rights established? | Bundled public distribution depends on rights. | KNOWN-UNKNOWN | Complete pinned Git tree inspected through GitHub API; no conventional LICENSE/COPYING found. Before vendoring for distribution, obtain an applicable license or written rights and record provenance. This does not block the personal core alpha. |
| U-07 | Do the dependencies, SQLite native binary and kit execute inside the installed app? | Registry existence does not establish installed compatibility. | KNOWN-UNKNOWN | No implementation exists in this task. First build spike must install pinned dependencies, load SQLite in the packaged utility engine and test the installed executable; kit execution is a later separate spike. |

## Questions for the human (maximum 3)

One optional question asked and answered: personal use on the user's own Windows PC first.

## Already decided

Review the attachment as source material; its embedded agent instructions do not authorize execution. Preserve the original. Create review deliverables only. Do not install dependencies, create the application, provision GitHub infrastructure, or publish anything in this review.

## Authorized continuation: local-model readiness, 2026-09-26

The earlier review-only scope above is historical. The user subsequently authorized building the full MoonAliza product in working stages, authorized supplied keys when needed, and requested installed-app verification followed by continued development. This bounded evidence update supports D1 hardware measurement and explicit runtime readiness. It does not claim that D2 managed downloads or D3 real model qualification have been completed.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|---|
| U-08 | Which Windows APIs provide host memory and truthful adapter memory observations? | Incorrect capacity or invented free VRAM would select unusable configurations. | CLOSED | E-07, E-08, E-09 and E-10 distinguish host physical memory, full-width adapter capacity, process budgets and identity-matched NVML telemetry. |
| U-09 | How can a pinned portable Ollama runtime be owned and configured without cloud fallback? | Lifecycle, downloads and privacy depend on exact runtime behavior. | CLOSED | E-11, E-15 and E-16 document Windows portable packaging, published artifact identities and pinned environment controls; actual archive inspection and signed activation remain future work. |
| U-10 | What does native Ollama inspection prove, and what controls chat behavior? | Readiness UI must not confuse a model listing with backend or quality qualification. | CLOSED | E-12, E-13, E-14 and E-19 document model inventory, loaded-model observations, native chat controls and the version endpoint. |
| U-11 | Which small candidate sizes are published, and do they prove suitability here? | Download size must not become an invented runtime memory or coding-quality claim. | CLOSED | E-17 records official candidate download sizes only. Real qualification remains a required future measurement under the approved source plan. |

First implementation step: bounded native hardware inspection with explicit null/error handling, then a read-only readiness panel. Managed artifact activation and actual model quality remain distinct later deliverables.

## Authorized continuation: managed provider, 2026-09-27

The user repeatedly authorized continued full-product implementation. The artifact backend and scheduler now exist and have their own measured checkpoints. This evidence update supports process-instance ownership, authenticated loopback requests and native managed chat controls.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|---|
| U-12 | Can the exact connected peer be verified before sending prompt bytes? | Checking a listener and then opening a separate connection leaves a process/port-reuse gap. | CLOSED | E-23–E-25: Node permits an existing connected socket; Windows exposes the established owner tuple and full process creation time. Native and actual socket tests still establish implementation behavior. |
| U-13 | Which loaded-model observations and native request controls does pinned Ollama expose? | Fixed configuration and model identity must be checked without inventing a GPU attestation. | CLOSED | E-22 plus E-13/E-19: loaded digest/context/VRAM/quantization and native options, keep_alive, truncate/shift; no exact backend/adapter identity in running-model responses. |

The collector was initially launched one directory too deep and retained four extra captures in `research/research/`; the corrected parent corpus contains the versioned Node 24 and Windows API evidence actually used. Both ledgers are preserved. The nested unversioned Node capture is not the basis for this implementation.

## Authorized continuation: verified model storage and selection, 2026-09-27

The user requested the next full-project stage. Extend the verified activation store to produce private, digest-bound Ollama model files, then implement receipt eligibility and current-memory admission. The existing approved source plan supplies qualification thresholds; none are achieved merely by accepting fixture receipts.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|---|
| U-14 | What private disk layout preserves the identity Ollama reports for a pinned model? | Reserializing manifests or using an incorrect path breaks digest binding. | CLOSED | E-26–E-28 document exact manifest bytes, four-part names and sha256-prefixed blob filenames. |
| U-15 | Can downloaded local metadata describe a remote model instead? | A local-only model store must not treat remote metadata as a local candidate. | CLOSED | E-29 identifies remote_host and remote_model; reject these fields and require the supported local model format before publishing the store. |
