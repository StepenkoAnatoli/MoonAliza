# Calibration run 1: extra findings the graders classified as true (candidate reviews of U5 at d87f796)

Each was judged "true" by the opus-high grader against the code and spec at d87f796 (not re-verified by the lead). They are inputs to the integration review, not accepted findings. The grader's one-line reason follows each.

## haiku-high R-1 (S3)

**Problem:** A 3xx answer to the refresh does not break the run of identical unknown answers. src/main/github-signin.ts:474 resets sameError only for kinds other than error and unusable, and the 3xx branch at :481 returns failed() without resetting it. Spec L-12 (docs/specification/github-sign-in.md:147, :152) says 'in a row', and the 6.5 comment (spec :764) says 'only consecutive identical answers count', but the 6.5 pseudo-code at spec :764 encodes the same exclusion as the code. The spec is internally inconsistent. [proof: grep -n 'sameError = null' docs/specification/github-sign-in.md and src/main/github-signin.ts]

**Evidence:** Scratch test ZZ-R1 in tests/zz-scratch-refresh-review.test.ts (answers 403, 302, 403, 302, 403, no error code). Fifth read fails with: AssertionError: expected [Function] to throw error matching /^GITHUB_RENEWAL_UNAVAILABLE$/ but got 'GITHUB_SIGN_IN_REQUIRED'. [proof: npx vitest run tests/zz-scratch-refresh-review.test.ts]

**Fix:** Decide the rule. If 'in a row' is intended, add the 3xx status to the reset condition at src/main/github-signin.ts:474 and pin it in a test; otherwise state in spec L-12 and 6.5 that a 3xx does not break the run.

**Grader:** Reproduced (ZZ-R1 red at the fifth read with GITHUB_SIGN_IN_REQUIRED). renew() at :474 excludes every unusable answer, the 3xx included, from the sameError reset, as the 6.5 pseudo-code does. L-12 says 'in a row', the 6.5 comment says 'only consecutive identical answers count', and GS-2 says a 3xx 'holds like a transient failure', which does reset the count. So the spec contradicts itself and the code follows the pseudo-code. This is a real ambiguity with low impact, not a code bug.

## haiku-high R-2 (S3)

**Problem:** A 401 on a token issued less than 0 s before the local clock (negative age, under the 300 s skew bound) starts a refresh. src/main/github-signin.ts:230 and :235 guard the fresh-token rules with 'age >= 0', so the token falls through to the 401 rule. The 6.4 pseudo-code (spec :700) and L-14 (spec :156) say a 401 on any token under transientHoldMs old never starts a refresh, and a negative age is under 30 s. The shipped test 'the clock 100 s behind the token's issue time' at tests/github-signin-refresh.test.ts:1038 pins the refresh and cites 6.8, which does not state this rule (6.8 table, spec :843-844). [proof: sed -n '843,844p' docs/specification/github-sign-in.md]

**Evidence:** Scratch test ZZ-R2: a token seeded with ageMs -100000, then one read answered 401. Observed: AssertionError: expected [ { seq: 2, method: 'POST', …(15) } ] to have a length of +0 but got 1 (refresh count 1, expected 0). [proof: npx vitest run tests/zz-scratch-refresh-review.test.ts]

**Fix:** Decide the rule. If the guard stays, write the negative-age rule into 6.4 and L-14 and correct the citation in test 15. If L-14 stands, drop the 'age >= 0' guards at src/main/github-signin.ts:230 and :235.

**Grader:** Reproduced (ZZ-R2 shows 1 refresh). The 'age >= 0' guards at :230/:235 differ from the 6.4 pseudo-code and L-14, which have no sign condition. The guards are the deliberate U5-R7 fix (73aeec5), which cites 6.8, and the 6.8 row covers steps of more than 300 s only. The divergence and the stale spec are real, but this is spec drift from an accepted decision, not a code defect, and S4 fits better. The candidate did not notice that it was deliberate.

## haiku-high R-3 (S3)

**Problem:** Holds are timed on a monotonic clock, but the spec times them on the wall clock. src/main/github-signin.ts:117, :358 and :362 use monotonic(), defaulting to performance.now() at :132. Spec 2.3 (docs/specification/github-sign-in.md:103) projects 'renewalHeld: now() < hold.until', and 6.5 (spec :765, :782) sets 'until: now() + ...'. The spec never mentions a monotonic clock, and the code comment at src/main/github-signin.ts:353 attributes the system-sleep over-hold to 6.8, which does not say it. The shipped test 15 at tests/github-signin-refresh.test.ts:1020 pins the monotonic behaviour, so the spec is what is out of date. [proof: grep -n -i monotonic docs/specification/github-sign-in.md returns nothing]

**Evidence:** Scratch test ZZ-R3: after a 500 hold, clock.step(-86400000) then clock.t += 31000. Spec 2.3 expects renewalHeld true; observed diff: '- "renewalHeld": true, + "renewalHeld": false'. [proof: npx vitest run tests/zz-scratch-refresh-review.test.ts]

**Fix:** Rewrite spec 2.3 and 6.5 to time holds on monotonic time, and remove the 6.8 citation from the sleep over-hold comment, or add the sleep rule to the 6.8 table.

**Grader:** Confirmed: spec 2.3 and 6.5 time holds as 'now() < hold.until' / 'until: now() + ...', the word monotonic appears nowhere in the spec or its As built section, and code :117/:358/:362 uses monotonic(). ZZ-R3 reproduces renewalHeld false. The monotonic clock is the HEAD commit's own deliberate U5-R13 fix, so the drift is in the spec, as the candidate says. That makes it a doc gap, S4 rather than S3.

## haiku-high R-4 (S2)

**Problem:** A read whose retried token gets 401 after a second rotation fails with GITHUB_SIGN_IN_REQUIRED while a live account exists. src/main/github-signin.ts:234 rotates at most once per call (!budget.retried). At :236 the retried 401 calls clearIf(account.accessRef), which the store refuses because the live account has changed, and the read still throws 'sign in again'. The account stays live and status() reports signed-in. The spec pseudo-code at spec :701 and the clearIf rule at spec 4.3 (a clear never removes a newer sign-in) give the same outcome, so the spec needs the same fix. Shipped test 10 (tests/github-signin-refresh.test.ts:582, :614) covers rotation before the 401 response only, not rotation during it. The same shape exists in freshRejected at src/main/github-signin.ts:425, but I did not reproduce it.

**Evidence:** Scratch test ZZ-R4 (rotation on the 401 for A to B, received 60 s ago, and on the 401 for B to C): AssertionError: expected 'GITHUB_SIGN_IN_REQUIRED' not to be 'GITHUB_SIGN_IN_REQUIRED' // Object.is equality, with store.current() non-null. Control ZZ-R4-control (no second rotation) passes with GITHUB_SIGN_IN_REQUIRED and account null, so the second rotation is the trigger. [proof: npx vitest run tests/zz-scratch-refresh-review.test.ts -t ZZ-R4]

**Fix:** At src/main/github-signin.ts:236, when the retried account is no longer live, throw GITHUB_RENEWAL_UNAVAILABLE and keep the live pair (or continue with the current pair without spending the budget, as withAccess's 'stale' does); apply the same change at :425; add the scenario as a pin.

**Grader:** Reproduced (ZZ-R4 red; ZZ-R4-control green). With A->B rotated before the first 401 and B->C rotated during the retried 401, :236 runs clearIf(B), which the store refuses because C is live, and the call still throws GITHUB_SIGN_IN_REQUIRED while the user is signed in. The spec pseudo-code at :701 gives the same result. The behaviour is real, but it is one call with a misleading error under a double-rotation race, and no data or account is lost, so S2 is overstated and S3 fits better.

## sonnet-medium R-2 (S3)

**Problem:** Spec gap or inconsistency. L-12 and 6.5 say 'the same answer N times in a row', but the pseudo-code and renew() line 474 reset sameError only for answers that are not error and not unusable. A 3xx unusable answer (failed()) therefore does not break the streak: error X, error X, 302, error X clears the account on the third X, although the answers were not consecutive. The code matches the pseudo-code; the pseudo-code contradicts L-12.

**Evidence:** tests/zz-scratch-refresh.test.ts, test 'R-2 a 302 between identical error answers breaks the streak (L-12 "in a row")'. Failing assertion: AssertionError: expected [Function] to throw error matching /^GITHUB_RENEWAL_UNAVAILABLE$/ but got 'GITHUB_SIGN_IN_REQUIRED'.

**Fix:** Decide which is right and align spec and code: either reset sameError in the 3xx branch (line 484), or amend 6.5 and L-12 to say a 3xx does not interrupt the streak.

**Grader:** Reproduced (scratch R-2 red: GITHUB_SIGN_IN_REQUIRED on the 4th read). renew():474 resets sameError only when the answer is neither error nor unusable, and a 3xx is unusable, so error X, error X, 302, error X clears. That matches the pseudo-code (spec :764), but the pseudo-code conflicts with L-12 'in a row' (:147) and with GS-2 (:788), where a 3xx 'holds like a transient failure', and a transient answer does reset. So the spec really is inconsistent with itself, and the ground truth does not mention it.

## sonnet-high R-2 (S2)

**Problem:** withRefresh() (src/main/github-signin.ts ~lines 487-505) calls this.failed() directly for a local vault error (non-DENIED, GS-6) and for 'denied twice'. It does so before renew()'s live-account check (the 'rotated meanwhile: nothing is held or counted' guard, U5-R10/R12), and failed() has no admit. If the account is signed out and another account is signed in while the decrypt is parked, the retired account's late local error sets a hold and failures++ on the NEW account. L-13 then blocks the new account's own due refresh, which breaks the L-6 admission principle that a refresh is admitted against the live account.

**Evidence:** tests/zz-scratch-r1.test.ts 'R-2 late local error of a retired account sets a hold on the next account': expected { state: 'signed-in', login: null, renewalHeld: false, lastOutcome: null } but got renewalHeld: true (it was false before the stale error was released). tests/zz-scratch-r2.test.ts 'R-2b the stale local error also blocks the new account refresh': AssertionError: expected [] to have a length of 1 but got +0 (h.refreshes(); the new account, 100 s from expiry, never refreshes).

**Fix:** In withRefresh, throw or return a marker instead of calling failed() directly, and apply the live.accessRef === from.accessRef check before holding. Equivalently, make failed() a no-op when the store's live account is no longer `from`.

**Grader:** withRefresh returns this.failed() for a non-DENIED local error (github-signin.ts, the `if (!denied(failure)) return this.failed()` line) before renew()'s live-account guard runs. So a retired account's late decrypt error (sign-out deletes the entry, so a missing-entry error is plausible) sets a hold and failures++ on the next account. Both scratch tests are red as described. Two caveats: the spec pseudo-code also orders it this way (6.5 :763), and the 'denied twice' part is wrong, because that check runs after the live check. The impact (one 30 s hold, GS-4 still sends reads) makes S2 overstated.

## sonnet-high R-3 (S3)

**Problem:** Spec 6.5 puts '3xx unusable -> failed()' outside sameOrFail, and the sameError reset applies only to answers that are neither error nor unusable. renew() follows this literally, so a 3xx between two identical unknown codes leaves sameError untouched and does not break the run. X, 302, X, X clears the account on the fourth refresh, although the last two answers are the only consecutive identical ones. This contradicts the stated rule 'only consecutive identical answers count' (6.5, L-12). The pseudo-code and the rule disagree, and the code follows the pseudo-code. No shipped test interleaves a 3xx.

**Evidence:** tests/zz-scratch-r2.test.ts 'R-3 a 3xx between identical unknown codes does not break the consecutive count': AssertionError: expected [Function] to throw error matching /^GITHUB_RENEWAL_UNAVAILABLE$/ but got 'GITHUB_SIGN_IN_REQUIRED' (on the fourth read).

**Fix:** Decide the intent in the spec. Probably reset sameError = null in the 3xx branch (and say so in 6.5), then pin it with a test.

**Grader:** The code follows 6.5 literally: a 3xx is `unusable`, so the sameError reset skips it and it calls failed() outside sameOrFail. The scratch test is red at the 4th read. Spec 6.5 GS-2 says a 3xx 'holds like a transient failure', and a transient answer does reset sameError, so the spec contradicts itself. This is a real spec/code gap with low impact.

## sonnet-high R-5 (S3)

**Problem:** Holds are timed on the monotonic clock (holdActive/setHold, U5-R13), but spec 6.5 pseudo-code and the 'until' wording specify `until: now() + ...`. The word 'monotonic' appears nowhere in docs/specification/github-sign-in.md. A wall-clock step is therefore not reflected in the hold: after a 30 s hold, a +1 h wall step still holds. This is deliberate in the code comments, but the spec was never updated, and no shipped test pins either behaviour apart from the Clock.step helper's comment.

**Evidence:** tests/zz-scratch-r2.test.ts 'R-5 a wall-clock step forward does not end a hold (spec 6.5: until = now() + ...)': AssertionError: expected [ { seq: 1, method: 'POST', ... } ] to have a length of 2 but got 1.

**Fix:** Update spec 6.5, L-13 and 6.8 to say holds run on the monotonic clock, and pin it with a test (the Clock.step helper already supports one).

**Grader:** 'monotonic' appears nowhere in docs/specification/github-sign-in.md, while 6.5 still says `until: now() + ...`. The monotonic hold is intended: it is in HEAD's U5-R13 commit and documented in docs/ARCHITECTURE.md. So this is real spec drift and docs-only, not a code defect. The scratch test asserts the stale spec behaviour, and S3 is generous.

## opus-high R-2 (S3)

**Problem:** Spec gap: the pseudo-code in spec 6.5 is out of date for a late refresh answer. renew() (src/main/github-signin.ts:463-465) re-reads the store after the answer and returns or throws without holding or counting when the account was cleared or rotated meanwhile (U5-R10/R12/R14). Spec 6.5 has no such check. Read literally, a late 500 for the old account after a re-sign-in runs failed() and puts a hold on the new account. The shipped test '13. a refresh of the old account that answers after the re-sign-in commits (a 500) holds nothing against the new account' pins the code, not the spec. The code's behaviour is the sensible one, so the spec is what needs fixing.

**Evidence:** Scratch test 'R-2. spec-literal 6.5: a late 500 for the old account after a re-sign-in runs failed() and holds (no live check in the pseudo-code)', `expect(h.service.status()).toMatchObject({ state: 'signed-in', renewalHeld: true })`, fails with: AssertionError: expected { state: 'signed-in', …(3) } to match object { state: 'signed-in', …(1) }; - "renewalHeld": true, + "renewalHeld": false

**Fix:** Add renew()'s live check (no live account: SIGN_IN_REQUIRED; another access ref: return it, nothing held or counted) to the spec 6.5 pseudo-code, citing U5-R10/R12/R14.

**Grader:** The claim holds. Spec 6.5 renew() (docs/specification/github-sign-in.md:755-783) has no live-account check after the answer, and `transient -> failed()` has no generation guard, so read literally a late 500 holds the new account. The code adds that check at src/main/github-signin.ts:463-465 (U5-R10/R12/R14), and the scratch test R-2 fails exactly as reported. This is spec drift in the docs, not a code bug. The ground-truth review mentioned in passing that a 6.5 note was 'already owed for R12/R14' but never filed it as a finding.

## opus-high R-3 (S3)

**Problem:** Spec gap: the 401 rule in spec 6.4 is out of date for a negative token age. send() (src/main/github-signin.ts:229-235) applies the fresh-token guard and the GS-1 transientHoldMs rule only when `age >= 0`. A token whose obtainedAt lies in the local clock's future therefore goes through the refresh path. The spec pseudo-code (`if now() - acct.obtainedAt < transientHoldMs -> freshRejected(acct)`) has no such bound, so read literally it calls freshRejected and sends no refresh. The shipped test '15. the clock 100 s behind the token's issue time ... a negative age is not a fresh token' pins the code. In the same way, holds are timed on a monotonic clock (holdActive/setHold, lines 356-363, U5-R13), while the spec says `hold = { until: now() + ... }`. Neither the word 'monotonic' nor this age bound appears anywhere in the spec.

**Evidence:** Scratch test 'R-3. spec-literal 6.4: a 401 on a token whose age is negative (-100 s) is under transientHoldMs, so freshRejected: no refresh', `expect(h.refreshes()).toHaveLength(0)`, fails with: AssertionError: expected [ { seq: 2, method: 'POST', …(15) } ] to have a length of +0 but got 1

**Fix:** Update spec 6.4: guard both age checks with `age >= 0`. Update spec 6.5: time holds on the monotonic clock (setAt + lengthMs) instead of `until: now() + ...`.

**Grader:** The claim holds. Spec 6.4 line 700 reads `now() - acct.obtainedAt < transientHoldMs -> freshRejected` with no `age >= 0` bound, while the code at :229-235 has one. Spec 6.5 times holds as `until: now() + ...` (lines 765 and 782), while the code uses a monotonic setAt/lengthMs (:356-363, U5-R13), and 'monotonic' appears nowhere in the spec. The scratch test R-3 fails as reported. Like R-2, this is real spec drift but documentation only; S3 is defensible.

## opus-xhigh R-2 (S3)

**Problem:** How a negative token age is handled is decided in code and test but not in the spec. At src/main/github-signin.ts:230 and :235, the DC-2 fresh-token resend and the GS-1 freshRejected branch are guarded by `age >= 0`. The spec 6.4 pseudo-code (:696, :700) has no such guard, so there a negative age (local clock behind obtainedAt) counts as fresh, while the code counts it as old. Shipped test 15 (tests/github-signin-refresh.test.ts:1038) pins the code's reading only for a token that can still be refreshed. When no refresh is possible (a non-expiring token, or an expired refresh token), the code clears the account on the first 401. L-12 (:151) lists that clear only for a token 'at least transientHoldMs old', and the pseudo-code would resend instead. No text in the spec states the negative-age rule.

**Evidence:** Scratch test 'S-2. (spec 6.4 pseudo-code) a non-expiring token, the clock 100 s behind its issue time, answered 401 then 200: the GS-1/DC-2 path resends instead of clearing at once': "AssertionError: expected 'GITHUB_SIGN_IN_REQUIRED' to be '200:signed-in' // Object.is equality"

**Fix:** Either record in 6.4 and L-12 that a negative age counts as old (matching test 15), or treat age < 0 as fresh when no refresh is possible. Pin the non-expiring case.

**Grader:** The code guards DC-2/GS-1 with age >= 0 at :229/:235, and the 6.4 pseudo-code (:696/:700) has no such guard. The spec has no text on negative age (grep finds none). Scratch S-2 fails as described: a non-expiring token at age -100 s is cleared on its first 401, a clear L-12 lists only for a token at least 30 s old.

## opus-xhigh R-3 (S3)

**Problem:** A refresh request can go out while a hold is active, which breaks L-13 (:155). usable() at src/main/github-signin.ts:376 and the 401 rule at :240 check the hold before waitRefresh. withRefresh, however, sends the refresh at :507-510 only after the await on vault.withSecret's readFile. If another call sets a hold in that gap (freshRejected -> failed(), :425-426, a GS-1 401 on a token under 30 s old), the refresh is still sent. When it succeeds, adopt() then wipes that GS-1 hold. The spec pseudo-code has the same check-then-await shape, so the spec does not guarantee its own invariant. No shipped test covers this.

**Evidence:** Scratch test 'S-3. L-13: a hold set by another call (GS-1 freshRejected) while a pre-check refresh decrypts its refresh token: the refresh request must not go out under the hold'. The token endpoint handler records status().renewalHeld when the refresh arrives: "AssertionError: expected true to be false // Object.is equality". In the same test, the other call's result is GITHUB_RENEWAL_UNAVAILABLE, and exactly one refresh was sent.

**Fix:** Re-check holdActive() inside withRefresh's withSecret callback right before requestToken (throw hold.reason and send nothing), or reword L-13 as 'no refresh is started while a hold is active'.

**Grader:** usable() step 4 and the 401 rule check holdActive() before waitRefresh, and withRefresh dispatches only inside the awaited vault.withSecret callback, so a hold set in that gap is never re-checked. Scratch S-3 reproduces it: renewalHeld is true when the refresh request arrives, which breaks L-13 as written.

## opus-xhigh R-4 (S3)

**Problem:** A 3xx refresh answer does not break an 'in a row' run. GS-2 (spec :788) says a 3xx is held like a transient failure. Unlike a transient answer, though, it does not reset sameError: the code at :474 and :481 follows the pseudo-code at :764 and :769. So the sequence 401-JSON, 302, 401-JSON, 401-JSON clears the account (count 3), although L-12 (:147) requires the same unusable status 3 times in a row. A 500 in the same position does break the run (control S-4c passes). This is an inconsistency inside the spec, and shipped test 4b (tests/github-signin-refresh.test.ts:358) uses only uniform runs.

**Evidence:** Scratch test 'S-4. "in a row" (L-12, GS-2): a 401 JSON answer, a 302 (held like a transient failure), then two more 401s is not three in a row: the account is kept': "AssertionError: expected [Function] to throw error matching /^GITHUB_RENEWAL_UNAVAILABLE$/ but got 'GITHUB_SIGN_IN_REQUIRED'". The control 'S-4c' (a 500 in place of the 302) passes.

**Fix:** Decide in 6.5 whether a 3xx breaks the run. If it does, reset sameError for a 3xx unusable answer the same way as for a transient one, and pin S-4.

**Grader:** Code :474/:481 follows pseudo-code :764, so a 3xx unusable answer neither resets sameError nor counts. 401,302,401,401 therefore clears (scratch S-4 fails; control S-4c with a 500 passes). That conflicts with L-12 'in a row' and with GS-2 'held like a transient failure'. The inconsistency is real, though it sits in the spec.

## opus-xhigh R-5 (S3)

**Problem:** Spec 6.4 usable steps 6-7 (:714) can clear an account whose refresh token is still valid; the code does not. Step 6 keeps the account only when a hold blocks a due refresh. Take a call that has already spent its one refresh (budget.refreshed) and then finds its ref rotated onto a pair that is past expiry, with a valid refresh token and no hold. Step 7 would clear that account, a clear L-12 does not list. The code at src/main/github-signin.ts:380 throws GITHUB_RENEWAL_UNAVAILABLE and keeps the account, which is correct. The spec text is what is wrong.

**Evidence:** Scratch test 'S-5. (spec 6.4 usable steps 6-7) a read that refreshed in its pre-check, then finds its ref rotated onto a pair already past expiry with a valid refresh token and no hold: the spec pseudo-code clears (step 7)': "AssertionError: expected 'GITHUB_RENEWAL_UNAVAILABLE' to be 'GITHUB_SIGN_IN_REQUIRED' // Object.is equality". The code takes its step 6, not the spec's step 7.

**Fix:** Reword usable step 6 as: 'a refresh was due but cannot run now (a hold, or this call's refresh already spent): throw hold.reason or GITHUB_RENEWAL_UNAVAILABLE; the account is kept'. Pin the S-5 scenario.

**Grader:** Spec usable step 6 (:714) covers only 'a hold is active', so with budget.refreshed set and no hold, step 7 would clear an account whose refresh token is still valid. Code :380 throws RENEWAL_UNAVAILABLE for any refreshable account. Scratch S-5 confirms the code takes its own step 6. The defect is in the spec text, as the candidate says.

## fable-high R-2 (S3)

**Problem:** Spec gap: the 6.5 pseudo-code and the code (src/main/github-signin.ts:474-483, :513) route a 3xx `unusable` answer and a GS-6 local vault error straight to failed() without touching sameError, so they do not break a streak of identical unknown error codes. That contradicts the same section's "only consecutive identical answers count" and L-12's "3 times in a row" (2.4 line 149): foo, 302, foo, foo ends the account on the fourth answer, while the shipped test '4. only consecutive identical answers count' shows a 500 in between keeping it. The prose and the pseudo-code disagree; the code follows the pseudo-code.

**Evidence:** tests/zz-scratch-refresh-review.test.ts > 'R-2: a 302 between identical unknown codes does not break the streak: foo, 302, foo, foo ends the account' — AssertionError: expected [Function] to throw error matching /^GITHUB_RENEWAL_UNAVAILABLE$/ but got 'GITHUB_SIGN_IN_REQUIRED' (tests/zz-scratch-refresh-review.test.ts:117, on the 4th read); and 'R-2b: a GS-6 local failure between identical unknown codes does not break the streak' — same assertion failure at :135 (3rd refresh request, with an undecryptable refresh entry between the first two).

**Fix:** Decide one way in the spec: either move `sameError = null` ahead of every failed() path (3xx and GS-6 included, so only strictly consecutive identical answers count) or reword 6.5/L-12 to say a 3xx or a local failure does not interrupt a streak; then pin the chosen behaviour with a shipped test.

**Grader:** Checked: src/main/github-signin.ts:474 resets sameError only for kinds other than error and unusable, a 3xx unusable answer goes to failed() with no reset, and a GS-6 local error leaves through withRefresh's failed() before renew reaches the reset. Spec 6.5 pseudo-code (lines 764/769/763) does the same, which sits against the prose ('only consecutive identical answers count', L-12 '3 times in a row', GS-2 '3xx holds like a transient failure', and a transient failure does reset). Running the scratch tests R-2 and R-2b reproduced it: both end the account at the 3rd identical code even though another answer came between. The tension is real, and the ground-truth review missed it. It is arguably intended, since neither a 302 nor a local failure is an answer from GitHub, so S3 is generous for a spec-wording decision.

## fable-xhigh R-2 (S3)

**Problem:** Spec gap: L-12 (docs/specification/github-sign-in.md:147) clears on the same unknown `error` code "3 times in a row", but the 6.5 pseudo-code (line 764) resets `sameError` only when the answer is "not error and not unusable", and a 3xx is `unusable` routed to failed() (line 769). The code follows the pseudo-code literally: src/main/github-signin.ts:474 excludes every `unusable` from the reset and line 481 sends a 3xx to failed() without touching the streak, so code, 302 (a captive portal, GS-2 "not GitHub refusing"), code, code clears the account after the fourth answer although the three identical answers are not consecutive. The shipped test "4. only consecutive identical answers count" interleaves a 500 only.

**Evidence:** tests/zz-scratch-refresh-review.test.ts, test "Z-2. L-12 \"3 times in a row\": an unknown code, a 302, then the same code twice is not three in a row, so the account is kept" — reads at +0, +30 s, +90 s, +210 s: `AssertionError: expected [ 'GITHUB_RENEWAL_UNAVAILABLE', …(3) ] to deeply equal [ 'GITHUB_RENEWAL_UNAVAILABLE', …(3) ]`, diff `- "GITHUB_RENEWAL_UNAVAILABLE" + "GITHUB_SIGN_IN_REQUIRED"` on the fourth outcome, at tests/zz-scratch-refresh-review.test.ts:131.

**Fix:** Settle the spec one way: amend 6.5 line 764 to reset on a 3xx as well (code: `if (answer.status >= 300 && answer.status < 400) { this.sameError = null; return this.failed(); }` at line 481) and pin it next to test 4, or reword L-12 to say a 3xx does not break the streak.

**Grader:** Confirmed in the code and by running the scratch test. src/main/github-signin.ts:474 resets sameError for neither kind of error answer, and :481 sends a 3xx to failed() without touching the streak, so code, 302, code, code clears the account on the fourth answer (scratch Z-2 fails with SIGN_IN_REQUIRED there; REDIRECT is a real 302 fixture). That breaks L-12 'in a row' (spec :147) and GS-2's 'holds like a transient failure'. The code copies the 6.5 pseudo-code (:764) literally, so this is a spec inconsistency the ground truth missed. S3 is a fair severity.
