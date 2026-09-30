# MoonAliza architecture and current decisions

The full product architecture is defined in [reviewed decisions](specification/decisions.md) and the [implementation roadmap](superpowers/plans/2026-09-24-moonaliza.md). This document records the current context-recovery stage, not a replacement roadmap.

Electron main owns credentials, provider transport, native dialogs and the process broker. The utility-process engine owns durable SQLite state, project policy, operation approval, journaling and the agent loop. The renderer accesses only the validated preload bridge; its preflight guidance never grants tool or network authority.

Context assembly is a pure engine operation before every model step. It reserves output capacity, evicts complete historical turns and compacts saved tool outputs into bounded references while retaining current call/result relationships. Originals remain in SQLite; retrieval is bound to the current session and passes live policy and cancellation checks. The UTF-8 estimate is a heuristic. Validated provider usage is a separate optional observation, never an invented exact preflight count. See [context recovery](specification/context-recovery.md) and its [primary evidence](../research/BRIEF.md).

Privacy changes require an explicit project-policy update. Profile edits bind to their revision; moving a credential-bearing profile to another endpoint or provider requires a new credential or explicit removal. Context recovery prepares a draft and never automatically repeats model calls, commands or edits. No schema migration or new dependency is needed.

Provider streaming and later Research Kit integration must preserve these process boundaries. Research documents and imported artifacts are untrusted reference data, never instructions or permission grants. Genuine managed-model qualification, production trust inputs and signed delivery remain separate requirements.

At each completed project step or phase, verify the work, push a branch and open a pull request. The user reviews and merges it. Do not merge on the user's behalf.

The September 30 reconciliation preserves upstream NDJSON/SSE transport, reused-index Ollama tool calls and native no-truncation flags. Accumulators retain validated optional terminal usage for the existing completion/event contract. Malformed usage does not invalidate an otherwise valid answer. Provider refusal inspection is limited to 64 KiB and its text never crosses into the engine. Incremental renderer output is deferred until the reviewed stream masker is implemented. The [Research Kit integration review](specification/research-kit-integration-review.md) is a future-stage design; it adds no runtime dependency or permission bypass.
