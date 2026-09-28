# Discovery Contract - MoonAliza open gaps: accurate context accounting across providers, native SQLite in the packaged Electron app, Research Kit redistribution rights

Started 2026-09-28. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

MoonAliza's next stages need three facts its historical research left open or thin (HANDOFF.md, development-status.md, and the Research Kit's own preflight of `docs/handoff/work`): what each provider reports about token use, so `CONTEXT_LIMIT` can move from a serialized-character estimate to real accounting; how the pinned better-sqlite3 obtains a native binary that loads in the pinned Electron; and whether the Research Kit may be redistributed inside MoonAliza. Done means each is answered from fetched primary pages, so the builder can design context accounting, the packaging of SQLite and the kit-bundling decision without re-researching. This project does not change product code or the immutable snapshot under `docs/handoff/`.

## Unknowns

A fact belongs here when guessing it wrong changes the design: API limits and pricing,
auth model, data schemas, rate limits, licensing/ToS, platform behavior, current library
versions, competitor pricing, data availability.

Status is exactly one of:
- `CLOSED` - proven by an `E-##` row in `research/EVIDENCE.md` (which must point at cached raw text).
- `KNOWN-UNKNOWN` - unreachable now; the `Evidence` cell names the day-one verification step.

Anything else (`OPEN`, blank, "in progress") fails the gate.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|
| U-01 | What token counts does Ollama's native chat report, and how is the context window set? | Accurate accounting for local models needs the exact counts and the window they are measured against. | CLOSED | E-01, E-02: `prompt_eval_count`/`eval_count` after each response; `num_ctx` sets the window; `truncate` silently drops history. |
| U-02 | What does an OpenAI-compatible provider report about token use, and can it set the window? | The OpenAI-compatible loop needs usage from both streamed and unstreamed responses. | CLOSED | E-05, E-03: optional `usage` (prompt/completion tokens), in streams only with `stream_options.include_usage`; Ollama's compatible endpoint supports it but cannot set `num_ctx`. |
| U-03 | Can a request be counted before it is sent? | Deciding to compact or refuse before sending needs a pre-send count, not a post-hoc one. | CLOSED | E-04: only Anthropic offers one (`count_tokens`, an estimate, free, rate-limited, not for server tools or URL images); E-01/E-05 show Ollama and OpenAI report counts only after a response. |
| U-04 | How does better-sqlite3 13.0.3 get a native binary that loads in Electron 44? | Packaging (`npmRebuild: false`, `asarUnpack` of prebuilds) is correct only if no rebuild is needed. | CLOSED | E-13, E-06, E-08, E-07: prebuilds ship inside the npm package on Node-API with no install script; Electron 44 is ABI 149; the GitHub release carries no binaries. |
| U-05 | May the Research Kit be redistributed inside MoonAliza? | Stage E bundling depends on it. | CLOSED | E-11, E-10: the kit's repository declares no license, and without one nobody else may reproduce or distribute it. Its owner can, and can grant a license - see the question below. |
| U-06 | Which Node does Electron 44.4.5 embed (second reading)? | The historical U-01 rested on one source; native and API compatibility depend on it. | CLOSED | E-12: DEPS at v44.4.5 pins Node v24.21.0, agreeing with the snapshot's E-01; E-09 (release notes) does not state it. |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

1. Which license, if any, should the Research Kit carry? You own both repositories, so
   bundling it in MoonAliza for your own use needs no license; distributing MoonAliza to
   anyone else with the kit inside needs one (U-05). Unanswered as of 2026-09-28.

## Already decided

Locked decisions for this project. Do not revisit these without the human.

- The historical corpus under `docs/handoff/work` is immutable evidence; this project re-collects rather than edits it.
- Research only; no product code changes here.
