# Rework: first build brief

24 September 2026. Recommended scope based on the user's confirmed priority: a usable application on their own Windows PC first.

**Goal:** install Rework, open a project, complete a small coding task with approved edits and commands, inspect/undo the changes, and recover safely after Stop or restart.

This is a proposed implementation brief, not a statement that the application has been built or qualified. The review's first-build contract corrections must be incorporated as implementation begins. Existing source projects remain separate.

## Preserve the architecture

- Electron main owns native capabilities, credential storage, and authenticated outbound transport.
- A utility engine owns SQLite state, conversations, permissions, the operation journal, and the agent loop.
- React uses a narrow validated preload bridge.
- The Windows helper owns spawned command trees.
- API and local providers use the same application loop and tool broker.

Use the checked dependency pins as inputs. All 27 exist, and Electron 44.4.5 embeds Node 24.21.0. Installation, native ABI compatibility and packaged behavior still need testing. Align Node type definitions with the embedded runtime or enforce equivalent API compatibility checks. [Electron release record](https://releases.electronjs.org/release/v44.4.5)

## Include in the personal alpha

One local fixed-drive project at a time; persistent conversations; one working inference provider; Ask, Plan and Build modes; bounded file listing/reading/searching; approved journaled edits; approved commands with captured output; change review and single-file undo; visible Stop; engine restart recovery; credential setup; and an unsigned installer for local use.

Keep default local-only routing until the user explicitly permits an external inference profile. The supplied research/GitHub/Hugging Face keys can support their relevant integrations; a working inference profile must be established separately. If no API profile exists, assess one manually selected local model on this PC. Do not make the entire automatic model catalogue a prerequisite for first use.

Keep the full roadmap, but defer multi-agent missions, managed hardware-wide model selection, Research Kit provisioning, model-storage relocation, auto-updates, production signing, and broad public support qualification until their stages. Local privacy and safe operation remain part of the first milestone.

## First-build contract decisions

| Area | Decision to implement |
|---|---|
| Requests | Versioned envelopes with persistent client request IDs; strict input and output schemas; one owner and authorization rule per method. |
| Retry | Persist mutation acceptance before replying. Reusing an ID with the same body returns the original entity/result; a changed body fails. Ambiguous external work requires reconciliation. |
| Public data | Explicit DTOs with bounds; no secret retrieval or native provider-state fields in renderer results. |
| Trust | Separate project/root identity and trust revision. Recheck current permission at admission; revocation cancels work and invalidates pending approvals. |
| Vault | Stage ciphertext, commit the profile reference, reconcile after crashes. Tombstone credential access before deletion. |
| Provider state | Bind native state to an immutable profile revision identity and API family. Do not transfer it to a different endpoint/model/profile. |
| Completion | Distinguish success, tool continuation, output exhaustion, refusal, failure and cancellation. Never execute partial tool input. |
| Transport | Main-owned Electron transport with trusted destination binding, system proxy support, normal certificate validation, bounded streaming and explicit abort. |
| Context | One exclusion policy across automatic collection, search and reads; explicit override for sensitive files. Summaries and retries consume the run's budget. |
| Writes | Before/after hashes, recoverable before image, adjacent staging, authority/hash recheck, durable outcome, one mutation coordinator. |
| Undo | `changes.list/read/undo` routes or equivalent. Undo targets a journal operation and expected current hash, then creates a new journaled mutation. No arbitrary path input from the renderer. |
| Commands | Approved executable/argv/cwd/environment/limits, direct spawn where possible, tested Windows script handling, owned Job Object, bounded draining, actual exit observation. |
| Git | Fixed read-only argument templates with helper execution disabled and sanitized environment. Arbitrary Git stays behind command approval. |
| Stop | Prevent new admissions, request abort, wait for owned work to stop, reconcile outcomes, then publish terminal cancellation. |
| Recovery | Preserve partial work and unresolved operations. Never repeat a command or mutation simply because its reply was lost. |

Specify the DTOs for the included routes as the first implementation task. Later-phase methods need not be exposed as nonfunctional placeholders in the alpha.

## Stage 1: Windows feasibility spike

Create a fresh application directory when implementation is requested. Preserve both donor trees. Verify donor revision/licenses before selectively porting code.

Build the smallest packaged application that exercises:

1. Packaged renderer assets and the restricted preload bridge.
2. A separately supervised utility engine.
3. SQLite open, transaction, close and reopen inside that packaged engine.
4. Credential encryption/decryption through the main process, with no renderer retrieval route.
5. A native helper that launches a harmless child and grandchild, reports output, and terminates only its owned tree.
6. An unsigned per-user installer that launches the actual installed executable.

**Exit:** retain command logs and the exact executable identity for these checks. Resolve ABI, native packaging and process-ownership failures here. An application window alone is insufficient.

This spike is expected to be disposable in parts. It establishes platform feasibility; it is not the usable coding agent.

## Stage 2: one complete coding journey

Wire the first provider to the durable loop. Make the tool broker enforce modes and project policy before exposing tools to the model. Add the minimal workbench as the functionality is integrated.

The acceptance fixture should be a small synthetic JavaScript or TypeScript project with one intentional bug and a meaningful test. Rework should:

1. Open/trust the project and answer a question from its files.
2. Produce a plan without changing project files or executing arbitrary commands.
3. Show an edit approval tied to the proposed bytes and current file version.
4. Make the approved edit and record its before/after state.
5. Run an approved test command and display the actual exit/output.
6. Show the resulting diff and undo the edit when the file still matches.
7. Refuse undo if the user has since changed the file.
8. Continue correctly after denying a command.
9. Stop a command tree and preserve unrelated processes.
10. Restart after an interrupted operation without repeating its effects.

The real provider's success on this fixture is necessary but does not replace deterministic integration tests.

## Required failure evidence for the alpha

| Scenario | Observable result |
|---|---|
| Start reply is lost and the renderer retries | One accepted run, same identity returned. |
| Project trust or external-inference permission is revoked | No new disallowed request/tool is admitted; active work follows Stop. |
| Crash after file replacement, before success is recorded | Recovery recognizes the after hash; no duplicate edit. |
| Destination changes after approval | Mutation is refused; user's change survives. |
| A Git diff driver or fsmonitor hook is configured | Ask/Plan Git tools do not execute it. |
| Stream ends early or tool JSON is incomplete | Explicit partial/failure outcome; incomplete tool is not executed. |
| Provider profile/endpoint changes | Incompatible native state is rejected. |
| Engine dies while a command has grandchildren | Owned descendants stop; unrelated processes survive. |
| Output exceeds the cap | Capture is bounded and the process does not deadlock. |
| A renderer reconnects after missing events | Ordered replay restores state without duplicate actions. |
| Credential save is interrupted | Profile/vault reconcile to a usable or explicit incomplete state. |
| Disk fills during a write | Existing content is preserved or recovery reports the actual conflict; no false success. |

For each row, name the fixture, test entry point and evidence file during implementation. Prefer behavioral integration tests over checking helper return values alone.

## Stage 3 and later

Once the alpha handles everyday work, add one local model with real measurements and coding fixtures. Build automatic selection around proven configurations. Add research after checking the pinned kit's packaged execution and rights. Add missions after defining produced/verified states, stable output manifests and workspace coordination. Add signed updates and broad release qualification when distribution becomes a goal.

Estimate effort after the feasibility spike, based on observed packaging and provider work. The original “five tasks per subsystem” grouping is a review structure, not an effort estimate.

**Next concrete implementation task:** establish the reduced method registry, lifecycle rules and acceptance fixture, then execute the Windows feasibility spike. This gets useful feedback without requiring the whole roadmap to be finished first.
