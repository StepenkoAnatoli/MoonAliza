# Builder brief: Phase 2, U5 Windows e2e

Read `briefs/p2-common.md` first. Worktree: `/home/user/task5-handoff/wt/mm-p2-u5`, branch `build/mm-p2-u5`,
base: `main-axuse` after U4 is integrated (the lead names the commit).

**Scope:** BREAKDOWN-P2.md row U5 (authoritative). **Spec:** more-models-phase2.md, "Tests the builders owe",
Windows e2e; T-4. **You own:** `e2e/anthropic.spec.ts` (new), `e2e/fixtures/anthropic-fake.ts` (new), one
assertion block in `e2e/workbench.spec.ts`.

**The D10 verdict: commit 3 stays**, so the no-cookie assertions are in: plant a cookie for the fake's origin
in the provider session (and, in the workbench spec, in the local session) and assert the fake sees no
`cookie` header, while `authorization` is present.

**The fake's streams:** built, and marked "built from E-10 shapes and the 2026-10-12 live recordings, not a
capture". Follow the live framing recorded in `docs/evidence/2026-10-12-anthropic-probes/` (for example
`D5-think-sonnet-step1.response.raw`): `event:` line equal to the data type, LF line ends, exactly one `ping`
right after the first `content_block_start` (inside the open block), a thinking block that starts with
`"thinking":"","signature":""` followed by one `thinking_delta` ("") and one `signature_delta` (your
base64-alphabet marker), then a text block, then a `tool_use` block for `list_files` with `{"path":"."}` and the
live `"caller":{"type":"direct"}` field, `stop_reason` `tool_use`; step 2 answers with a text block and
`end_turn`.

**The journey:** as BREAKDOWN-P2 row U5 says, step for step (profile save, Test connection, "Review cloud
access" then "Allow for this project" exactly as `e2e/context-recovery.spec.ts:50-51`, Ask mode, one tool
round trip), with every fake assertion named there, the canonical-JSON equality of `system`, `tools`, `model`,
`max_tokens` and `stream` between requests 1 and 2, and the userData byte scan for the marker after the app
closes.

**Linux cannot run this journey past project trust** (the Windows-only native helper), so: run what Linux
can (typecheck, lint, the spec file's own syntax via `npx playwright test --list`), reason carefully through
every UI step against the real renderer code, and expect the lead to push it for Windows CI. Each assertion
needs its guard named so the first Windows round can show it red (the lead decides whether to spend that round).

**Pre-mortem:** BREAKDOWN-P2 row U5 (each mistake costs a Windows CI round; a fake that accepts anything; a
tool the mode does not offer). Phase 1's P1-CI-1: every fake Ollama a local-only run reaches must answer
`/api/status` (`e2e/fixtures/ollama-status.ts`); your project is cloud-allowed, but say so in a comment.
