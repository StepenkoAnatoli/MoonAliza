# U5 extras re-verification: one reviewer per theme (T1-T8)

Worktree: a read-only checkout of the integration head the lead names in the launch prompt (recorded in RUN.md); your
theme is named there too (`T<k>`). Conventions: `briefs/common.md` (Node 24, a private `TMPDIR` per test run, no
network, no token-shaped literals, careful coding) and `briefs/unit-reviewer.md` (refute-first, severity S1-S4). You
commit nothing and push nothing. Difficulty tier, declared by the lead per theme from the adapter's review table:
T1, T2, T3, T4 and T8 are T3, because the specification is inconsistent or silent and the review must say what it
would have to say; T5, T6 and T7 are T1, because each is one module (the service) against its own L-rules, with the
shipped tests as the harness for reproductions.

## Inputs

- Your theme's row in `reports/u5-extras-themes.md` (claim, candidates), and the candidate findings it names in
  `reports/calibration-1-extra-findings.md`. They were judged at `d87f796`: line numbers have moved, and the graders
  did not check reachability (calibration run 2 showed that credit can be wrong).
- Code: `src/main/github-signin.ts` (U5), plus `src/main/github-account-store.ts` and `src/main/vault.ts` where your
  claim crosses into them, and the real callers in `src/main/index.ts` (the wiring) and the renderer's offers
  (`src/renderer/GitHubAccountPanel.tsx`).
- Harness for reproductions: `tests/github-signin.test.ts` and `tests/github-signin-refresh.test.ts` (their fakes,
  clocks and vault doubles), and the loopback fake `tests/fixtures/fake-github-oauth.ts`.
- Spec `docs/specification/github-sign-in.md`: 2.4 (the L-rules), 6.4, 6.5, 6.8, GS-1, GS-2, GS-6, and "As built,
  wave 2 (U5)". A departure that section already records (R6, R7, R9, R12, R13, R14, R16) is documented, not drift.
- Commits since `d87f796` that touched U5: `065eaaa` (U5-R16), `e714930` (U5-R17). Later fixes elsewhere can change
  your path: X2-1 (`ed5fe5c`..`01a8604`, the startup reconcile) and X2-2 (`85cc095`..`97cbfbd`, the vault). Check them.

## The three questions (the three-prong rule; calibration run 3's lead note G-2 is why there are three)

1. **Holds at HEAD.** Reproduce it with the shipped harness: a scratch test file `tests/scratch-u5-T<k>.test.ts`
   that drives the service through its public API, run with a private `TMPDIR`. Record the test text, the command and
   the output, then delete the file. If you cannot reproduce it, say what you tried. A code reading alone is
   "holds: unproven".
2. **Reachable.** The sequence through the spec's flows and the app's real callers that reaches the state. Each step
   is a public call, a user action the renderer offers, or an event the app produces. Name each step that needs a fault
   (an I/O error, a clock step, a crash), and say whether the spec counts that fault (GS-6 local vault errors, 6.8's
   clock rules). If the API reaches it but the app cannot, say so.
3. **Forbidden.** Quote the spec sentence the behaviour breaks, or the one that permits it. When sentences conflict
   (T1), quote both. When the spec is silent, say so: silence is drift, not a defect.

Verdict: **REAL** (holds, reachable, forbidden; give a severity), **DRIFT** (holds, but the spec is silent or only its
pseudo-code differs: a docs change), or **NOT REAL** (name the prong that fails).

## Decision space (the lead decides; you set out the options)

- Spec amendment: the exact replacement sentences, with section numbers.
- Code fix: the change in one paragraph; the red-first test that would pin it (name, steps, assertion); the guard
  whose removal must turn it red.
- Both, when the code is right and the spec wrong, or the reverse.
- Your recommendation in one line, with the reason.

Per theme:

- T1: state both readings (L-12's "3 times in a row" resets on any other answer; 6.5 excludes a 3xx and a GS-6 error
  from the reset), the account-clear consequence of each on `code, 302, code, code`, and which reading the other
  L-rules and GS-2's "holds like a transient failure" imply.
- T2: cover the non-expiring token at negative age on its first 401, as well as the docs gap.
- T5, T6, T7: give the interleaving as a numbered timeline: which `await` yields, and which event lands in that gap.

Stay on your theme: do not re-raise the other themes, or the calibration-2 items recorded as not real.

## Report

Write the full report to `docs/orchestration/2026-10-13-github-sign-in/reports/u5-theme-T<k>-1.md` (Ballast rule) and
return a gist of at most 5 lines plus that path. The file holds: theme, head sha, verdict, severity (REAL only), holds
(the scratch test in a fenced block, the command, an output excerpt), reachable (the steps), forbidden (the quotes),
decisionSpace, recommendation, `git status --porcelain` at the end (empty, the report excepted), mistakes ("nothing to
report" if none).
