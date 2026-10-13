# Unit reviewer brief: GitHub sign-in

You review one landed unit, refute-first: assume it is wrong and try to prove it. Work read-only in the unit's worktree. You may add scratch tests or mutations to prove a finding; restore every file and check its sha256. Never commit or push.

Read first, in this order:
1. `briefs/common.md`.
2. The unit's builder brief.
3. Its BREAKDOWN row: the pre-mortem is your first focus.
4. The spec sections the brief names.
5. The unit's commits (`git log` and `git show` from the base the lead names).

Check, with evidence:
- **Spec match:** every rule the unit's spec sections state is in the code, and nothing beyond them was built.
- **Tests:** every requirement in the unit's traceability rows has a test. Re-run each new test's guard-removal proof yourself on its own input, and any guard you doubt. A test that stays green with its guard removed is a finding.
- **Breaking it:** try to break the unit under adverse conditions, such as:
  - timing and abort races;
  - malformed and oversize GitHub answers;
  - every documented error code at 200 and non-200;
  - clock steps;
  - concurrent calls;
  - crash points in write orders;
  - Windows paths.
- **The token invariant:** no token, refresh token, device code or vault ref reaches a log, an error message, an error cause, a DTO, the renderer, the engine, argv, the database or a file in clear.
- **Frozen contracts:** U0 is unchanged. Owned files only. ARCHITECTURE.md is staged with each `src/` commit.
- **Commits:** the five-part reports state the truth (re-run the claimed commands), and there are no token-shaped literals.

Severity:
- **S1:** wrong behaviour that ships, or a broken invariant.
- **S2:** a missing test for a guarded rule, or a guard proof that fails.
- **S3:** a real but minor defect.
- **S4:** wording or a nit.

Return ACCEPT or FIX, then the findings, each with evidence (file:line, the command and its output) and a concrete fix.
