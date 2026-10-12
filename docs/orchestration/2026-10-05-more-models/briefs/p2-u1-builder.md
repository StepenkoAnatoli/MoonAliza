# Builder brief: Phase 2, U1 engine - append-only Anthropic runs

Read `briefs/p2-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p2-u1`, branch
`build/mm-p2-u1`, base `28395c5`.

**Scope:** BREAKDOWN-P2.md row U1 (authoritative). **Spec:** more-models-phase2.md sections 2, 3 (all
rules, the reserve, the freeze, the frozen step, the frozen CONTEXT_LIMIT message, known limits), 8 (the
local-only bullet). **Requirements:** F-15, F-16, F-17, S-3, T-3 (and F-2 as built by U0).

**You own:** `src/engine/context.ts`; `src/engine/application.ts` except U0's three edits (`message()`'s
strip, the tool step's carry, the PROVIDER_PROTOCOL_ERROR text in the `failures` map); `tests/context.test.ts`;
`tests/application.test.ts` except U0's two tests; the "More models, Phase 2" paragraph of
`docs/ARCHITECTURE.md` (your own sentence only).

**Build:** `PREFIX_BOUND_KINDS` and `WHOLE_REPLAY_FORMATS` exported from `context.ts` with the E-12 reason;
the history reserve on unfrozen steps of a prefix-bound kind that offers tools (half the input budget and
half the 1000-message cap, by `estimateInput`, before today's loops); the freeze on the first step whose
completion carries `providerState.appendOnly === true`; `continueContext` (the previous request's messages
unchanged, then the added `current` entries, new results at the 3,072-byte excerpt, only unsent results cut
to the 0-byte excerpt, oldest first; `fits` false over budget or over 1000 messages); the estimate projection
for `anthropic-messages@1` (spec section 3 and F-17); the frozen-run CONTEXT_LIMIT text (spec section 3,
rule 6) for a local `fits` false and for a provider overflow crossing from main, review runs keeping
REVIEW_CONTEXT_LIMIT. The profile kind reaches the engine on the stored profile revision: read how
`execute()` gets `profile` and use its `kind`.

**Tests owed:** the spec's "Tests the builders owe", Append-only and policy (U1) list, every item, plus the
F-15, F-16 and S-3 tests BREAKDOWN-P2 row U1 names. S-3 tests are regression pins (green on `28395c5`, red
under the named mutation).

**Pre-mortem:** BREAKDOWN-P2 row U1 (the freeze base taken from the wrong request or the `:43` loop still
reachable when frozen; the reserve computed from different inputs than the step's own assembly). Also: an
`openai-compatible` or `ollama` run whose behaviour changes at all.
