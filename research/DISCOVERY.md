# Discovery: context recovery and development delivery

## Build intent

Deliver the next usable MoonAliza stage on the user's Windows PC: explicit privacy guidance, recoverable context limits, bounded and retrievable tool results, truthful provider usage, editable profiles, and a tested development installer attached to a GitHub prerelease. Preserve the complete product roadmap and all existing permission and qualification requirements. The user authorized implementation and a new PR.

## Unknowns

| ID | Unknown | Why it blocks | Status | Evidence |
|---|---|---|---|---|
| U-01 | Can one local tokenizer count arbitrary OpenAI-compatible models accurately? | Incorrect accounting can hide overflow. | CLOSED | E-01: counts depend on model and function framing; arbitrary compatible models require an explicitly labeled fallback. |
| U-02 | Which native response fields report input/output token usage? | Usage must be observed, never invented. | CLOSED | E-02 and E-04: native prompt_eval_count/eval_count and compatible usage.prompt_tokens/completion_tokens; missing usage remains unknown. |

Existing source and immutable research establish managed activation's genuine qualification and signed trust prerequisites. Those inputs remain absent; this delivery does not bypass them or manufacture receipts. No user intent questions remain.


## Stage 1 extension: offline Research Kit consumer (2026-09-30)

After merging PR #11, implement the reviewed consumer contract and offline validation stage. Use real pinned producer artifacts and the actual validator, separate validity/readiness from app permission, bind bytes/job/revision, keep processes bounded and owned, and leave collection/review UI/Build gating to later PRs. A user-provided external kit avoids bundling unlicensed runtime code. Existing process/IPC ownership is established by local source.

| ID | Unknown | Why it blocks | Status | Evidence |
|---|---|---|---|---|
| U-03 | Exact pinned validator CLI, output and exit-code contract | A plausible mock cannot establish interoperability. | CLOSED | E-05/E-06 and actual pinned CLI probe. |
| U-04 | Which manifest/review checks produce readiness and which identity fields need consumer binding? | Exit 0 must not become Build permission. | CLOSED | E-06/E-07 and actual producer outputs. |
| U-05 | Can valid fixture artifacts be generated through real producer derivation rather than claimed authorization? | Golden bytes must have reproducible producer provenance. | CLOSED | E-07 and pinned CLI probe: valid reviewed/unreviewed outputs with derived authorization. |
