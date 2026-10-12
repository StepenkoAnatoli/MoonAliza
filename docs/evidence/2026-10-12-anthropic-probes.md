# Anthropic live probes, 2026-10-12 (in progress)

Partial checkpoint after probe steps 1-2 of the brief; the full report replaces this file.
Raw transcripts, the probe script and the spend ledger are in `docs/evidence/2026-10-12-anthropic-probes/`.

- D2: 400 `invalid_request_error`, "prompt is too long: 340027 tokens > 200000 maximum" (Haiku 4.5).
- D7 over-maximum: 400 `invalid_request_error`, "max_tokens: 70000 > 64000, which is the maximum allowed number of output tokens for claude-haiku-4-5-20251001".
- D11: Haiku 4.5 round trip, no thinking blocks; step 2 accepted.
- D1: `Authorization: Bearer` accepted (200) on Sonnet 5.5 and Haiku 4.5.
- D4: streamed final usage equals the non-streamed usage (input 15, output 5).
