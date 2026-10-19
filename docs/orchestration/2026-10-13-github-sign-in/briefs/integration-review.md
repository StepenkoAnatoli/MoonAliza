# Integration review: GitHub sign-in (four reviewers: spec, invariants, mutation, breaker)

When: after fix-c1-c3 is accepted and integrated and U8 is integrated. The lead names the integration head in the launch
prompt and in RUN.md. Base: `6ac1007` (Stage 5's start, PR #46's head; main's tree). Your role (spec, invariants,
mutation or breaker) is named in the launch prompt. You work read-only in a full (not shallow) checkout of the head:
scratch tests and mutations are allowed, but restore every file, check its sha256, and leave `git status --porcelain`
empty apart from your report. Conventions: `briefs/common.md` and `briefs/unit-reviewer.md` (refute-first, severity
S1-S4, evidence for every finding). Difficulty tier: T3 (declared by the lead: the whole feature, and findings that can
exist only where two units meet).

## What every reviewer reads

- `docs/specification/github-sign-in.md` (all of it, the As built sections included), `REQUIREMENTS.md` (54 rows),
  `BREAKDOWN.md` (rows U0-U9 and the Lead row; the pre-mortems first), `DECISIONS.md`, `MANDATE.md` (read-only scope;
  "private text like local files"; UD-1 open, so the app ships unconfigured).
- `git diff 6ac1007..<head> -- src tests e2e docs/specification docs/ARCHITECTURE.md`, and `git log` for the unit
  histories (RUN.md's Units table maps each unit to its commits).

## Earlier findings: their state, and who checks what (do not re-derive the rest)

| Item | State | Checked by |
|---|---|---|
| U1-R11 (S3, the lead's fix `348aa2d`, never fresh-reviewed) | a body stream yielding non-bytes is a failed read | mutation: re-run its guard proof; invariants: no body text in any rejection |
| U2-R15 (S2, the lead's port of the reviewer's pins, `97b0b9e`) | the rollback's own cap pinned | mutation: the RBNOCAP and RBCAP0 mutations each turn a pin red |
| U5-R18 (S4, open) | the reset sits after the live-account check, but a comment carries that claim, not a pin (mutation M16-above stays green) | mutation: confirm M16-above still survives at head (expected); the integration fix round adds the pin |
| U6-R2 (S4, deferred) | the reason scan does not read template-literal reasons | invariants: does any `throw` site in `src/main/github*.ts` build its reason from a template or a variable? None: it stays S4. Any: S3 |
| U7-R17, U7-R18 (S3 each; the lead's fix `b32af8d` after the two-round cap, never fresh-reviewed); U7-R19 (S4, a known limit) | the by-reference guard covers every export the recorder swaps; the recorder has positive controls | invariants: re-review both, and say whether R19's limit is stated truthfully |
| fix-c1-c3 (calibration run 3, C-1..C-3) | accepted on its own fresh re-review | breaker: the wire under the real `fetch` in Electron only; do not re-review the unit |
| X2-1, X2-2 (calibration run 2) | accepted on their fresh re-reviews | spec: spec 4.5 row 2 and the vault's As built text match the fixes |
| Calibration-1 extras (16 findings, themes T1-T8) | the U5 theme reviewers own them (`reports/u5-theme-T*-1.md`) | nobody here; raise one only for a consequence the theme report does not cover |
| Not real: calibration-2 C-A, C-D, C-E, C-F; calibration-3 C-4, C-5 (the spec permits them; `trace/calibration-3/lead-notes.md` G-2) | recorded | do not re-raise without a new reachability argument and a reproduction |
| The awaited-cancel and unraced-read pattern outside the wire: `src/main/github-signin.ts:228` (6.4's `await sent.body?.cancel()`), `src/main/github.ts:19`, `:57`, `:59` | not judged yet | breaker: the three prongs for each (holds with an injected fetcher; reachable with the production fetcher; forbidden by which sentence). `src/main/inference.ts` and `src/main/ollama-locality.ts` predate this feature: one line each, marked outside this PR's scope |

## Reviewer 1: spec

- Every rule in spec sections 2-10 is in the code, or an As built section records the departure; nothing was built
  beyond the spec (F-27 is out of scope).
- Each REQUIREMENTS row names a test that exists and exercises that row. List each row whose test does not.
- Each As built claim is true at head. U0's frozen contracts are unchanged since `8f86232` (`git diff 8f86232..<head>`
  on the five files `briefs/common.md` names). The ARCHITECTURE.md "GitHub sign-in" paragraph is true at head.
- X2-1 and X2-2, as in the table.
- An input list for the lead's docs unit, not findings: per BREAKDOWN's Lead row, each document to change and what it
  must say.

## Reviewer 2: invariants

- The token invariant (S-1..S-8, T-6, DC-9). Run `tests/github-signin-invariants.test.ts` at head and read it. Then
  plant a marker into each sink the spec lists, one mutation in `src/` at a time: a log, an error message or cause, a
  DTO, the renderer, the engine, argv, the database with `-wal` and `-shm`, a file in clear, `process.env`, an IPC
  result. Each must turn the suite red; a mutation it misses is S2.
- The static guards: `tests/github-token-literals.test.ts`, the `client` + `_secret` scan, the renderer staying
  network-less (S-8).
- U1-R11, U6-R2, U7-R17/R18/R19, as in the table.

## Reviewer 3: mutation

- The seams: U1-U5 (wire results to the refresh classes), U2-U5 (the commit point, the rollback, `clearIf`), U3-U5
  (the credential seam, `withAccess`, `stale`, one re-grant), U5-U6 (the `handle()` cases, `finishStartup`, the
  `before-quit` order), U4-U6 (the IPC shapes, the poll only while pending).
- At least 3 mutants per seam and at most 25 in all. Each mutant is one edit in `src/`: an operator flipped, a guard
  removed, an order swapped or an `await` dropped. Run the test files that own the seam, then the full suite for every
  survivor. Restore each file and check its sha256.
- Re-run U1-R11's guard proof (`git show 348aa2d`), U2-R15's RBNOCAP and RBCAP0 (`git show 97b0b9e`), and U5-R18's
  M16-above (`reports/wave2-u5-fix4.json`).
- A survivor is S2, unless you prove it equivalent.

## Reviewer 4: breaker (real Electron on Windows)

- On the Windows host, with `npm ci` done: `npm run native:build`, `npm run build`, then `npm run test:e2e` (the whole
  e2e, including U8's journey A; journey B must be a visible skip while UD-1 is open).
- Then try to break it in real Electron, with a scratch spec in `e2e/` that reuses U8's routing (delete it afterwards):
  - close the dialog mid-flow;
  - sign out while a sign-in is pending;
  - quit during a refresh (the `before-quit` order);
  - a routed GitHub that stalls, so the wire's timeout runs under the real `fetch`;
  - a `userData` path with non-ASCII characters and a long path;
  - a locked `index.json` (a second open handle) on X2-2's path.
- The sibling sites, as in the table.
- Linux proves nothing here: the proof is your Windows run plus Windows CI on the exact head.

## Report (each reviewer)

Write the full report to `docs/orchestration/2026-10-13-github-sign-in/reports/integration-review-<role>-1.md`
(Ballast rule) and return a gist of at most 5 lines plus that path. The file holds:

- the verdict, ACCEPT or FIX;
- the findings, each with an id `IR-<role initial>-<n>`, a severity, file:line at head, the evidence (command and
  output), a concrete fix and a red-first test sketch;
- the outcome for each table row assigned to you;
- the mutants or plants with their results (mutation and invariants);
- `git status --porcelain` at the end;
- mistakes ("nothing to report" if none).
