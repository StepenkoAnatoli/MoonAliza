# Builder brief: Phase 2, U3 Anthropic adapter, pure parts

Read `briefs/p2-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p2-u3`, branch
`build/mm-p2-u3`, base `28395c5`.

**Scope:** BREAKDOWN-P2.md row U3 (authoritative). **Spec:** more-models-phase2.md section 5 in full
(5.1 route and headers, 5.2 body, 5.3 message mapping, replay and the state refusal table, 5.4 the reader,
5.5 outcome and state, 5.6 usage, 5.7 errors and CONTEXT_LIMIT, 5.8 retries) and section 4 for `KindPart`.
**Requirements:** F-6 to F-14 (the Anthropic parts), F-22 (`timeoutMs`), S-4, S-5, T-1.

**You own:** `src/main/anthropic.ts` (replace the U0 skeleton's bodies; keep every exported name and
signature); `tests/anthropic.test.ts` (new); `tests/fixtures/anthropic-state-refusals.ts` (new, the spec 5.3
refusal table as data, imported by U4's tests later); the "More models, Phase 2" paragraph of
`docs/ARCHITECTURE.md` (your own sentence). Do not touch `src/main/inference.ts`: the kind joins the table
in U4. `anthropic.ts` may import only types from `inference.ts` and `provider-kind.ts`, plus
`provider-stream.ts` (`readSseEvents`), `engine/control.ts` and `node:util` (no runtime import cycle).

**Tests owed:** the spec's "Tests the builders owe", Anthropic adapter, pure (U3) list, every item; the
verbatim E-10 fixtures (l.198-220 basic with `ping`; l.269-348 tool use with the empty first
`partial_json`; l.388-425 thinking; l.85-86 the error event) each with a capture-match guard; built streams
marked. The state refusal table drives both the encoder test (every row INVALID_INFERENCE_REQUEST) and the
outcome test (every row a stream can produce PROVIDER_INVALID_RESPONSE, no completion).

**Pre-mortem:** BREAKDOWN-P2 row U3 (the stored state drifting from what was received; the reader too
strict or too lax; a coerced non-string start field). Also: the outcome accepting a state the encoder
would refuse, so a step-1 tool runs and step 2 fails locally.
