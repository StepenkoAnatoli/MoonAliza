# Discovery Contract - Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask

Started 2026-09-29. This file is the definition of "enough information to build".
`node "$HOME/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

Live display of a model's reply in MoonAliza (Stage C streaming). The provider layer now
streams (`src/main/provider-stream.ts`), but the text reaches the user only whole, after
`vault.redact` replaces every exact secret value (`src/main/vault.ts`). Showing text as it
arrives means masking a stream: a secret can arrive split across two deltas, and a
per-delta replace would let both halves through. Done means knowing how two established
stream maskers - the GitHub Actions runner and GitLab Runner, both masking live job logs -
handle a secret that straddles writes, which encodings of a secret they also mask, what
they explicitly do not mask, and what the hold-back costs in latency, so MoonAliza's
design copies a proven one instead of inventing its own.

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
| U-01 | How does each masker handle a secret split across two writes? | The design problem itself: per-chunk replacement leaks a split secret | CLOSED | E-09: GitLab holds back written data until it has as many bytes as the secret, and names the failure without it (a whole secret revealed at a boundary); E-05: Actions masks within one string, merging overlaps |
| U-02 | Which encodings of a secret does each mask besides the literal value? | A model can echo a key base64- or URL-encoded; exact-value redaction misses it | CLOSED | E-06: Actions registers base64 (three alignments), JSON, URI, XML, command-line and shell escapes; E-08: GitLab masks the literal only, and says a modified form is not masked |
| U-03 | What do they state they do not mask, or refuse to mask? | Sets what MoonAliza may promise the user, and which secrets need another guard | CLOSED | E-08: GitLab refuses to mask multi-line values, values with spaces and values under 8 characters, and cannot mask modified output; E-07: GitHub does not redact what is not registered as a secret |
| U-04 | How much output is held back before it can be shown, and when is it released? | The latency cost of live display, and when a held tail is flushed | CLOSED | E-09: as many bytes as the longest secret, capped (4094 bytes in GitLab, whose tail can leak past the cap); E-08: the stray `x` after `[MASKED]` is the visible trace of that buffering |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

- Secrets never reach the renderer unmasked (the vault's rule today); live display must keep it.

Locked decisions for this project. Do not revisit these without the human.
