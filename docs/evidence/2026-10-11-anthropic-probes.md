# Anthropic live probes (2026-10-11): not run, no API key

Date: 2026-10-11. Branch `claude/anthropic-probes-2026-10-11`, from `main-axuse` at `b793f13`.

## Result

No probe was run. No request was sent to Anthropic, and the estimated spend is US$0.00.

The brief says to stop and record this if the environment has no Anthropic API key. The session environment has no `ANTHROPIC_API_KEY`. The only Anthropic-named variable is `ANTHROPIC_BASE_URL`, which the Claude Code harness sets for its own model traffic; it is not a key and it does not point at `api.anthropic.com`. I checked variable names only and never printed any value. The harness's own credentials were not used: they are not the owner's API key, and spending them would not measure what the probes are for.

## What was not run, and why

Every probe in the brief was left unrun because there was no key:

| Contract | Probe | Status |
|----------|-------|--------|
| provider-wire-formats U-18 | (1) Moonzila's OpenAI-compatible body on `https://api.anthropic.com/v1/`, `claude-sonnet-5-5` | not run: no key |
| provider-wire-formats U-18 | (2) Over-window error, compatible and native routes, `claude-haiku-4-5-20251001` | not run: no key |
| provider-wire-formats U-18 | (3) SSE framing, compatible and native | not run: no key |
| provider-wire-formats U-18 | (6) Native streaming usage cross-check | not run: no key |
| provider-wire-formats U-18 | (8) Two-turn tool round trip, compatible and native | not run: no key |
| provider-wire-formats U-18 | (11) 429/529 headers | not run: no key (and no rate-limit response was seen) |
| coding-model-shortlist U-06 | 20+ tool-call prompts through `complete()` for `claude-sonnet-5-5`, `claude-opus-5-5` (and `claude-fable-5-1`) | not run: no key |

None of the research briefs' claims were confirmed or contradicted. Rows U-06 and U-18 keep their current status.

## To run it

1. Give the cloud environment an `ANTHROPIC_API_KEY` variable through the environment's settings (the owner's approved secret mechanism). Do not commit it.
2. Start a new session with the same brief. Branch `claude/anthropic-probes-2026-10-11` already holds this record, so that session can replace this file with the measured results.
