# Calibration run 2 (wf_fe91e1d6-d78) - lead's notes and the lead's own mistakes

Launched 2026-10-17T23:26Z, finished 2026-10-18T01:24Z: 54 agents (39 items + 15 graders), 7,872,276 reported tokens,
three agents at a time. Preregistered upstream before the launch (SmartRouter `docs/evidence/2026-10-17/claude-code-calibration-2/`,
commit 9cf7079; run id at 98d4c8a). Results: `results-table.md`, `observations.json`, `tokens-and-estimates.md`.

## What the run showed
- **pin 12/12 PASS, fix 12/12 PASS** (every fix committed through the subject's gate with the map staged, lint and
  typecheck clean by the mechanical grade and the self-report). The harder fix (a new re-read step under a lock) did not
  separate the profiles either: the headroom guard, not the pass/fail, is what keeps small profiles off large units.
- **review** separated them: PASS sonnet-high, sonnet-xhigh, opus-high, opus-xhigh, opus-max, fable-medium, fable-high,
  fable-xhigh, fable-max; PARTIAL sonnet-low (R13 only, no false blocking); FAIL haiku-low/medium/high (R11 missed, false
  blocking findings), sonnet-medium (R11 missed, one false), opus-medium (both found, one finding the grader called false:
  see G-1). Every profile found R13; R11 (the rollback's un-named refs) is what the small and low-effort profiles missed.
- **Tokens**: the three review-only profiles cost 1.3-2.0x a high-effort review (sonnet-xhigh 328k and 38 min, opus-max
  307k and 23 min, fable-max 229k and 18 min) for the same PASS the high profiles reached; max effort bought nothing here.

## Usage-window measurement (the run's fourth result)
Readings with nothing in flight: 23:22:51 five_hour 0.12 / seven_day 0.28; 01:23:32 five_hour 0.39 / seven_day 0.36
(the last event before completion). Over 7,872,276 reported tokens: **0.0343 per Mtok five_hour, 0.0102 per Mtok seven_day**,
the lead idle but for one check-in (00:29). The policy declared 0.24 and 0.06: about 7x and 6x too high. Separately,
lead-only work moved five_hour 0.02 -> 0.12 between 23:07 and 23:22 (no sub-agent running): about 0.40 per hour of active
lead work. The lead's own turns are this host's dominant cost; `lead-reserve` 0.05 covers about eight minutes of them.
`rate` could not learn any of this: the run was not dispatched through the adapter, so every pair of readings had T=0
recorded outcome tokens (skipped), and during ordinary work every pair spans a running unit. Policy revision 3 ratifies
measured values (briefs/policy3-builder.md) and the friction log carries the learning-loop gap upstream.

## Harness finding H-1 (corrected from the 00:29 check-in note)
fix:haiku-low was not hung: the harness retried its StructuredOutput five times (cap) because the output kept omitting
the required `mistakes` field, then reported the agent as an error (journal: "StructuredOutput retry cap (5) exceeded").
Its worktree holds a complete, committed fix (8781c1f) that grades PASS mechanically. Recorded as a harness retry, not a
model retry (the protocol's retry_limit 0 is about re-running the task); its self-reported fields are null.

## Grader finding G-1: inconsistent classification of the same 'other' finding across candidates
Seven candidates reported the same defect ("clear() after an open() that could not read the file answers 'durable'
without writing, and the next start signs in"): the graders of five called it true (S2/S3), the graders of haiku-medium
and opus-medium called it false on reachability (the UI offers Sign out only while signed in). Two candidates reported
"cap() ignores a failed removal": one grader true, one false. A per-candidate grader cannot be consistent across
candidates, and opus-medium's FAIL rests on that one classification. Adjudication (workflow `wf_603131fc-773`: three
independent fable-high lenses per distinct claim - reproduce, reachability, refute - majority verdict) is recorded in
this file once it returns and in the upstream evidence as a post-hoc amendment; **the preregistered rule stands for the
scores** (opus-medium review FAIL), and run 3's protocol preregisters a cross-candidate adjudication step.

## Lead mistakes
- **L-3 (duplicate decision record).** The lead ran `route.mjs decide` twice for sr-policy-3 after the policy fix (seq 2
  and seq 3, identical routes); the dispatch (seq 4) names seq 3. Where: the lead's shell, 01:37. Impact: one redundant
  ledger line and decision file; no dispatch or budget effect (a decision reserves nothing). Cause: a second command
  meant as a dry run was a real call. Fix: none possible (the ledger is append-only); recorded here and in RUN.md.
  Verified: `route.mjs status sr-policy-3` (last seq 4, calls 1/6).
- **L-4 (stale headroom).** The accepted sr-policy-2 outcome (770,527 tokens on cc-opus-high) did not raise
  cc-opus-high's headroom-tested (514000), so the first sr-policy-3 decision was blocked (every profile failed the context
  check for a 600,000-token estimate). Impact: one blocked decision, no dispatch. Cause: the adapter proposes no headroom
  raise and the lead did not apply the policy's own definition at the outcome. Fix: policy maintenance commit 490b7ed and
  deliverable F in the policy-3 brief. Verified: decision seq 2/3 route delegate to cc-opus-high.
- The 00:29 check-in note called fix:haiku-low "hung"; see H-1.
