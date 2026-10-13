# Stage 7 fix brief: in-scope gaps from the gap audit

You fix the in-scope gaps the Stage 7 gap audit confirmed (`reports/stage7-gap-audit.json`: two audits and a refute-first
verifier; read the gaps named below and the verifier's verdicts in full first). Work in the worktree
`/home/user/task5-handoff/wt/s7-fix` on branch `build/s7-fix` (from `main-axuse`). Do not touch `/home/user/moonaliza` or
any other worktree; do not push.

Authority: the More models Mandate (`MANDATE.md`, user: "you have full access. continue") covers defects against the
task statement's outputs. A change of cost, a new public error code (F-21 rules them out), a schema or IPC change, or a
reversal of a recorded design decision is not yours: stop at that item and report it.

## Units (one commit each, in this order)

**FX-1 - say why a step ended without an answer (GA-C1/GA-B1, GA-C2, GA-C4, and the verifier's research-review item).**
Today every outcome other than `complete` throws PROVIDER_ERROR and the user reads "The model or tool request failed.
Check the selected profile and project access." An empty `complete` answer is stored and reported as success with
nothing shown. Nine valid tool calls read as "invalid or not offered, or ... a saved credential".
- Keep the public codes unchanged: PROVIDER_ERROR for incomplete, blocked and empty; PROVIDER_PROTOCOL_ERROR for more
  than 8 tool calls. Only the message changes, chosen where `run.failed` is built (as FROZEN_CONTEXT_LIMIT already is),
  from internal reasons that never leave the engine as codes.
- Texts (adjust wording only if a test or the spec forces it; say so):
  - incomplete: "The model stopped before finishing: it reached its maximum response (thinking counts toward it) or the
    context window, or the answer was cut off. Raise Maximum response or Context window in Model profiles, or split the
    request." (never "continue": history drops partial answers, application.ts `!m.partial`.)
  - blocked: "The provider declined to answer this request. Rephrase it or try another model."
  - empty: "The model ended its turn without an answer. Send the request again or rephrase it."
  - more than 8 calls: "The model asked for more than 8 tool calls in one step, which MoonAliza does not run. Nothing from
    that step was run. Ask for fewer actions at a time."
- An empty answer: `outcome: 'complete'` with content empty or whitespace only and no tool calls (both paths the verifier
  reproduced: an empty `end_turn`, and thinking-only plus `end_turn`; and the chat kinds' empty `stop`). Do not store an
  empty assistant message for it. Existing fixtures that use `{ content: '', outcome: 'complete' }` as an ordinary success
  (`tests/application.test.ts:55`, `tests/policy-guard-control.test.ts:25`, `tests/research-jobs-state.test.ts:1172`,
  `tests/research-purge.test.ts:47`, and any others) get non-empty content: say in the commit which ones and why this
  does not weaken them.
- Research review runs: `reviewEnd` gets the same specific text for these reasons (today `known` is undefined for
  PROVIDER_ERROR, so the user reads only "The research review run failed.").
- The renderer marks a stored partial assistant message (`partial: true`, already in `MessageSchema`): a short visible
  label such as "Incomplete answer" beside the author, so cut-off text is not read as a full answer.
- Tests, red first: one engine test per reason (incomplete with empty and non-empty text, blocked, empty-complete on each
  path, nine calls), a research-review test, a renderer test for the label. Each shown red with its guard removed.

**FX-2 - an empty tool-call argument string is `{}` on the OpenAI-shaped path (GA-C3).** `parseCalls`
(`src/main/inference.ts:98`) runs `JSON.parse('')` for a call whose arguments join to '' and fails the step; the native
Anthropic adapter already treats an empty join as the start object's `{}`. Treat an empty or whitespace-only string as
`{}`; a provider-transport test with the compat-shaped stream the verifier used, red first.

**FX-3 - the Anthropic hint says the token fields need raising (GA-B2, GA-C5).** The form keeps 8,192 / 2,048 when the
kind is switched to Anthropic; the verifier showed a thinking run then ends with the frozen CONTEXT_LIMIT after two steps
and drops all history from the second run on. Prefilling larger values is a cost decision (each request is billed for
the input it sends) and reverses the spec's "No token values are prefilled: presets are Phase 4": not yours. Add one hint
sentence and the same README sentence, e.g. "Raise Context window and Maximum response for these models: at the form's
defaults (8,192 and 2,048 tokens) a task that thinks can stop after a few steps. Each request is billed for the input it
sends, so a larger window costs more per step." The renderer test pins it; the hint still names no Haiku model.

## Rules

- Commit identity `git -c user.name=StepenkoAnatoli -c user.email=318295322+StepenkoAnatoli@users.noreply.github.com`,
  the five-part report (verified / untested / expected), the trailers
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and
  `Claude-Session: https://claude.ai/code/session_01VdJ51CTnHT4Zet6eScsBBh`; no other model identifiers. A commit touching
  `src/` stages `docs/ARCHITECTURE.md` (update the Phase 2 paragraph for what changed). Never `--no-verify`.
- After each commit: `npm run typecheck`, `npm run lint`, `npx eslint e2e`, the touched test files. At the end, the full
  suite once with `npx vitest run --reporter=json --outputFile=<json>` and
  `python3 /tmp/claude-0/-home-user-Research-Kit/5649504a-fc26-5a4a-85c4-62cf875be3b1/scratchpad/compare.py <json> <root>`
  against the 74-failure baseline: no new failure. Node 24 (`export PATH=/versions/node/v24.21.0/bin:$PATH`);
  `node_modules` and `.build` symlinked from `/home/user/moonaliza`.
- Check `e2e/` for any assertion on the old texts or on an empty answer (Windows-only runs); update it in the same commit.
- Do not write key-shaped strings (`sk-` followed by 16 or more key characters) anywhere.

## Report

Per unit: commit, the tests and their red-first proof, the commands and results; the full-suite comparison; anything in
this brief you judged wrong (stop at that item and say why); what you got wrong.
