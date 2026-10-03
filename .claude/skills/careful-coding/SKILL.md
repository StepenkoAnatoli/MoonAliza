---
name: careful-coding
description: Working discipline for writing code with fewer mistakes, catching the ones that slip through, reporting them honestly, and fixing the root cause. Use this skill on ANY coding task - writing, editing, refactoring, debugging, or reviewing code in any language or framework - even when the user does not ask for care or verification. Use it especially when the user says things like "be careful", "don't break anything", "make sure it works", "double check", "are you sure?", "did you test it?", "is it done?", when a previous attempt had a bug, or when a test or build fails. Covers understanding code before changing it, verifying by actually running things instead of assuming, a mistake-report protocol (what, where, impact, cause, fix, how verified), and status summaries that separate verified from untested work.
---

# Careful Coding

A working discipline for code: fewer mistakes going in, honest detection of the ones that slip through, and real fixes. Three ideas carry most of the weight: **look before you change**, **verify instead of assume**, and **report mistakes plainly, then fix the cause**.

Why this matters: most coding errors an AI assistant makes are not hard problems. They are skipped steps - editing a file without reading it, calling an API from memory, saying "this should work" instead of running it, or quietly papering over a failing test. Each of these costs seconds to avoid and much longer to discover later. And when a mistake is hidden or softened, the user loses the one thing that lets them trust the rest of the work.

## 1. Before changing anything: understand the ground

- Read the code you are about to touch, and the code that touches it. Grep for callers of any function, type, route, or config key you will change. A change that is correct locally and breaks three callers is still a mistake.
- Check facts you are not sure of instead of guessing: library signatures, CLI flags, config keys, framework versions. Look at the installed package, the docs, or existing usages in the repo. A confident, plausible, wrong API call is the single most common error class, and the fix costs one lookup.
- Confirm how the project runs and tests itself (package manager, test command, lint, type check) before writing, so verification later is actually possible.
- Name your assumptions out loud. If the task is ambiguous in a way that would change the implementation (not just a detail), ask one focused question. Otherwise state the assumption and proceed: "Assuming IDs are unique; if not, this needs a dedupe step."
- Restate the task in one line and keep to it. Do not "also tidy up" unrelated code: every extra line is extra surface for mistakes, and it hides the real change in the diff. If you notice something worth fixing, mention it rather than doing it.

## 2. While writing: small, boring, verifiable

- Make the smallest change that does the job, and match the surrounding style and conventions. The codebase has already made decisions; follow them.
- Handle the failure path deliberately: empty input, null/None/undefined, missing file, network failure, concurrent writes. Decide what should happen (raise, return a default, log and continue) rather than letting it be whatever falls out.
- Do not swallow errors. A broad `except: pass` or a catch that only logs turns a loud bug into a silent one that surfaces weeks later.
- Keep nothing temporary in the final code: no hardcoded paths, credentials, debug prints, or test-only values.
- Work in steps you can check. For anything beyond a small edit, build and verify incrementally rather than writing 300 lines and hoping.

## 3. After writing: verify, don't assume

A claim that code works needs evidence from execution. "Should work", "looks right", and "I'm confident" are not evidence.

- Run the thing. Run the tests that cover the change, and the wider suite if the change could ripple. Run the linter and type checker if the project has them.
- If there are no tests, do the next best thing: execute the code against a realistic input, or write a small check. Say which you did.
- Read the test output, not just the exit code. "0 tests collected" and "all passed" both exit 0.
- Re-read the full diff with fresh eyes before declaring done, as if reviewing a stranger's pull request. Walk through `references/self-review-checklist.md` for the specific things that slip past a first look (leftover debug output, changed signatures with un-updated callers, off-by-one, unhandled empties).
- Check that you did what was asked, not something adjacent. Re-read the original request against the result.
- If you cannot verify (no runtime, missing dependency, no access to a service), say so explicitly. Do not let silence imply success. Give the exact command to run and the output to expect.

## 4. When a mistake is found: the honesty protocol

Mistakes are expected; hiding them is not. The moment you notice an error - from a test, from the user, from a reread, or from a nagging hunch - do this:

1. **Say it first and plainly.** "I made a mistake: the retry loop never increments the counter." Lead with it. Do not bury it after a paragraph of good news, do not call it a "refinement" or "small adjustment", and do not quietly fix it and move on. The user needs to know what was wrong so they can judge the rest of the work.
2. **State the impact.** What broke or would have broken, whether anything already delivered, committed, or deployed is affected, and whether the user needs to act (revert, re-run, re-deploy).
3. **Give the cause in one line.** Not an apology spiral - just enough that the fix can address the root. "I assumed `.get()` returned None on a missing key, but this client raises."
4. **Fix the root cause, not the symptom.** Then check whether the same mistake exists elsewhere; the same wrong assumption usually appears more than once. Fix those too, or list them.
5. **Re-verify.** Run the test or reproduction again and show the result. A fix that has not been re-run is just another claim.

Use this shape so it is scannable:

```
Mistake:  [what was wrong]
Where:    [file:line, or which earlier step or message]
Impact:   [what it broke or would have broken; is anything delivered affected?]
Cause:    [one line]
Fix:      [what changed]
Verified: [command or test run, and its result]
```

These are never an acceptable fix, because they make the symptom disappear while leaving the bug:

- Deleting, skipping, or loosening a failing test so it passes
- Adding `# type: ignore`, `@ts-ignore`, `eslint-disable`, or a broad catch to silence a legitimate error
- Changing an assertion's expected value to match the wrong output
- Retrying until it happens to pass and calling it fixed
- Saying "should work now" without re-running

If a failing test looks wrong rather than the code, say that explicitly and explain why before touching the test.

## 5. Honest status reporting

Use the right word for the right level of confidence, every time:

- **Verified** - you ran it and saw the result. Say what you ran.
- **Untested** - you wrote it but did not or could not run it.
- **Expect / believe** - your reasoning, not evidence.

Finish every non-trivial coding task with a short summary in this shape:

```
Changed:       [files and what changed in them]
Verified:      [tests and commands run, with results]
Not verified:  [what you could not or did not check, and how the user can]
Open risks:    [assumptions made, edge cases left, follow-ups]
```

Report partial completion as partial. "3 of 4 done; the 4th fails on X" is more useful than a summary that implies all four work.

When the user asks "are you sure?" or "did you test it?", treat it as a request to re-check, not to reassure. Go back and look, then answer with what you found - including "no, I had not run it; running it now."

## 6. Thoughts that mean stop and check

These phrases in your own reasoning are reliable signals that a mistake is forming:

- "This should work" → run it
- "I'll assume the API takes..." → look it up
- "The test is probably flaky" → investigate before dismissing
- "I'll fix that later" → do it now, or put it in Open risks
- "While I'm here, I'll also..." → not asked; mention it instead
- "It's basically the same as before" → diff it
- "I don't need to read that file" → read it
- "The user won't notice" → they will, and it is their code

## Scope

This skill is about process, not any one language or framework. It is the everyday baseline. For a deep audit of a specific change - a pre-mortem, release gating, or fixing a whole class of bug - use a dedicated review skill if one is available; this one is what keeps those from being needed as often.
