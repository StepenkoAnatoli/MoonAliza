# U5 extra findings from calibration run 1, grouped into themes for re-verification at the integration head

Source: `reports/calibration-1-extra-findings.md` (16 grader-true findings of candidate reviews at `d87f796`; the graders
did not re-verify reachability, and run 2's adjudication showed that credit can be wrong). Each theme is re-verified at
the integration head by one reviewer with three questions: does it hold at HEAD (reproduce with the real harness), is it
reachable through the spec's flows, and what is the lead's decision space (spec amendment, code fix, or both). The lead
decides afterwards; nothing here is accepted yet.

| theme | claim | candidates | kind at first sight |
|---|---|---|---|
| T1 | a 3xx `unusable` answer (and a GS-6 local vault error) does not reset `sameError`, so `code, 302, code, code` clears the account although L-12 says "3 times in a row" and GS-2 says a 3xx "holds like a transient failure" (which does reset); the 6.5 pseudo-code encodes the exclusion | haiku-high R-1, sonnet-medium R-2, sonnet-high R-3, opus-xhigh R-4, fable-high R-2, fable-xhigh R-2 | spec inconsistency; the lead must decide the rule and pin it (code change if "in a row" wins) |
| T2 | a negative token age (local clock behind `obtainedAt`) is treated as not fresh (`age >= 0` guards, the U5-R7 fix), which the 6.4 pseudo-code and L-14 do not say; and a non-expiring token at negative age is cleared on its first 401, a clear L-12 lists only for a token at least 30 s old | haiku-high R-2, opus-high R-3, opus-xhigh R-2 | spec drift (docs) plus one possible code case (the non-expiring token) |
| T3 | holds are timed on the monotonic clock (U5-R13) but the spec times them on `now()`; 'monotonic' appears nowhere in the spec | haiku-high R-3, sonnet-high R-5, opus-high R-3 | spec drift (docs) |
| T4 | the 6.5 pseudo-code lacks renew()'s live-account check after the answer (U5-R10/R12/R14), so read literally a late 500 for the old account holds the new one | opus-high R-2 | spec drift (docs) |
| T5 | a read whose retried token gets a 401 after a second rotation fails with GITHUB_SIGN_IN_REQUIRED while a live account exists (`clearIf` refused, the error still thrown; :236 and :425) | haiku-high R-4 (S2, grader: S3) | code behaviour under a double-rotation race |
| T6 | withRefresh() calls failed() for a local vault error (GS-6) before renew()'s live-account check, so a retired account's late decrypt error sets a hold and counts a failure on the NEW account, blocking its due refresh (L-13 vs L-6) | sonnet-high R-2 (S2) | code behaviour under a sign-out/sign-in race |
| T7 | a refresh request can go out while a hold is active: usable() and the 401 rule check the hold before `waitRefresh`, but withRefresh sends only inside the awaited `vault.withSecret` callback, so a hold set in that gap (GS-1 freshRejected) is never re-checked; a success then wipes that hold | opus-xhigh R-3 | code behaviour (L-13) |
| T8 | spec 6.4 usable steps 6-7 would clear an account whose refresh token is still valid (a call that spent its refresh, then finds its ref rotated onto an expired pair with no hold); the code keeps it (:380) | opus-xhigh R-5 | spec text wrong (docs) |

Verification at HEAD (`02aa858` or later): the U5 files are `src/main/github-signin.ts`, `tests/github-signin.test.ts`,
`tests/github-signin-refresh.test.ts`; the spec is `docs/specification/github-sign-in.md` (2.4 L-rules, 6.4, 6.5, 6.8,
GS-1/GS-2/GS-6). Commits after d87f796 that touched U5: `065eaaa` (U5-R16), `e714930` (U5-R17).
