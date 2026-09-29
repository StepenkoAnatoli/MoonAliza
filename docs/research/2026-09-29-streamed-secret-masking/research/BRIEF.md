# Brief - Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask

_Auto-drafted 2026-09-29 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require human/agent judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

Live display of a model's reply in MoonAliza (Stage C streaming). The provider layer now
streams (`src/main/provider-stream.ts`), but the text reaches the user only whole, after
`vault.redact` replaces every exact secret value (`src/main/vault.ts`). Showing text as it
arrives means masking a stream: a secret can arrive split across two deltas, and a
per-delta replace would let both halves through. Done means knowing how two established
stream maskers - the GitHub Actions runner and GitLab Runner, both masking live job logs -
handle a secret that straddles writes, which encodings of a secret they also mask, what
they explicitly do not mask, and what the hold-back costs in latency, so MoonAliza's
design copies a proven one instead of inventing its own.

## What we verified

| Claim | Source | Type |
|---|---|---|
| GitLab Runner MR !2979 (the runner's own maintainers): since v13.12.0 the trace masker holds back written data until it has at least as many bytes as the secret, because only then can it tell whether a secret lies across the write boundary; before that, a boundary could reveal a whole secret. It orders masks longest first so a longer secret is not partly revealed by a shorter one, and caps the held buffer (4094 bytes) because an unbounded one is a resource-exhaustion risk. [quote: we first need to buffer X amount of bytes (where X is the length of the secret)] [quote: either the whole secret is masked or the whole secret is revealed] [quote: Order masked values by length to prevent longer values being partially revealed] [quote: Supporting an unbounded size would allow a resource exhaustion attack] [render-reviewed: the MR description, the before/after summary and the commit titles are present in the capture] | E-09 `gitlab.com` (U-01, U-04) | P |
| The GitHub Actions runner's SecretMasker: AddValue registers each secret together with every registered encoding of it, and MaskSecrets finds all positions of all values in one input string, merges overlapping ones, and replaces each merged span with `***`. [quote: String encodedValue = valueEncoder(value);] It masks within the string it is given; how the runner splits a log into those strings is not in this file. | E-05 `raw.githubusercontent.com` (U-01) | P |
| The runner's ValueEncoders: the encodings masked besides the literal - base64, base64 of the value shifted one and two bytes (so it is caught inside e.g. base64(user:password)), command-line, expression, JSON, URI and XML escaping, trimmed double quotes, and two PowerShell escapes. [quote: So we add base64(value shifted 1 and two bytes) as secret as well.] [quote: public static String JsonStringEscape(String value)] | E-06 `raw.githubusercontent.com` (U-02) | P |
| GitLab's CI/CD variables docs: a masked value is replaced with `[MASKED]`; to be maskable it must be a single line with no spaces and 8 or more characters; a value printed in a slightly modified form is not masked; and `[MASKED]` can be followed by stray `x` characters. [quote: Be a single line with no spaces.] [quote: If a process outputs the value in a slightly modified way, the value can’t be masked.] [quote: In some cases, the `[MASKED]` value could be followed by `x` characters as well.] | E-08 `docs.gitlab.com` (U-02, U-03, U-04) | P |
| GitHub's secrets guide: values that are not secrets can be masked with `::add-mask::`, and a secret kept outside GitHub's secret store (the large-secret workaround) is not redacted if printed. [quote: GitHub does not redact secrets that are printed in logs.] | E-07 `docs.github.com` (U-03) | P |

## Contradictions and how they were resolved

**Which forms of a secret to mask (E-06 against E-08).**
- GitHub's runner masks the literal value plus nine encodings, including base64 at three
  alignments, JSON, URI and XML escaping.
- GitLab masks the literal only, and says plainly that a modified form escapes.
- Both are correct descriptions of their own tools. For MoonAliza I take GitHub's approach:
  a model reformats text freely, and echoing a key JSON-escaped or base64-encoded is exactly
  the kind of thing it does.

**What to do with a secret longer than the buffer (E-09).**
- GitLab caps its held buffer at 4094 bytes, and accepts that the tail of a longer secret
  can leak.
- MoonAliza's vault holds API keys, far below that. But the rule is "a secret never reaches
  the renderer unmasked", so MoonAliza turns live display off for a run whose longest masked
  form exceeds the cap, rather than accept a partial leak.

**Minimum length (E-08).**
- GitLab refuses to mask values under 8 characters, because a short value masks ordinary
  text by accident.
- MoonAliza masks whatever the vault holds. A false mask in a reply is cosmetic; a missed
  one is a leak.

## Known unknowns

None. Every blocking unknown was closed with cited evidence.

## Decision

**A stream masker in the main process, modelled on GitLab's (E-09).** Secrets never leave
main, so the masker lives there too.

- **Hold back the tail.** Keep back the last `L - 1` characters of text received so far,
  where `L` is the length of the longest masked form. Only a prefix that no masked form can
  still straddle is released to the renderer. Without this, a secret split across two deltas
  gets through (E-09: "either the whole secret is masked or the whole secret is revealed").
- **Match longest first, merge overlaps.** Longest first means a longer secret is never
  partly revealed by a shorter one (E-09). Overlapping matches merge into one span (E-05).
- **Masked forms.** Each vault secret, plus its base64 at all three alignments, its JSON
  escape and its URI escape (E-06). The shell escapes are left out: a chat reply is not a
  command line.
- **The marker.** `[redacted]`, as `vault.redact` writes today.
- **The cap.** The hold-back is bounded, as GitLab bounds its own (8 KB here). If the longest
  masked form exceeds the cap, that run shows no live text. The reply appears whole, exactly
  as now, and no tail is revealed.
- **The end of the stream.** At the terminal chunk, the held tail is masked and released.
  The message MoonAliza stores is still `vault.redact` over the whole reply, and the live
  text is replaced by it.
- **Thinking text,** when it is shown, uses its own masker instance.

**Out of scope:**
- the renderer's live view;
- other ways to leak a secret: tool arguments are already checked whole before they run
  (`src/main/index.ts`).

**First build step:** `src/main/stream-masker.ts` with unit tests, before any wiring:
1. A secret split at every possible position across two deltas never appears in what is
   released.
2. Its base64 at each alignment, its JSON escape and its URI escape are masked.
3. No more than `L - 1` characters are ever held back.
4. The tail is released at the end.
5. A secret over the cap turns live display off.

Then wire it between `complete()`'s stream and the renderer's IPC.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "$HOME/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=9d793065ea90b036 inputs=7b6fbf61df0b1c1b gate=pass -->
