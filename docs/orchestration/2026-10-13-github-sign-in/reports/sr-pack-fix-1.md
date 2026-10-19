# sr-pack report: fix round 1 (review sr-pack-review-1: R-1 S2, R-2 S4, R-3 S4)

Builder of unit sr-pack, fix round 1. Worktree `/home/user/task5-handoff/wt/sr-pack`, branch
`tools/calibration-shared-pack`, on top of `78a873f`. Three commits, one per finding, not pushed. This report file is
not committed.

## Gist

- R-1 (S2) fixed: D-2's accepted pin now has the rows `(["héllo"], 3, b"h\xc3\xa9")` (a cut inside a UTF-8 character) and `(["ab", "cd", 3], 4, b"abcd")` (the stop: the rejected chunk 3 is never read). Both wrong fixes the review built (counting characters, truncating at the end) now grade FAIL on `acceptedPinGreen` alone, and a new SharedPack test grades them. D-2's `required_behaviour` (the pin case's rule) now also states the stop.
- R-2 (S4) fixed in docs: step 3 of the pack README says the two guards compare paths with `pack_dir` only, so the host checks the kit's path itself. A kit-side guard would be a change outside this unit's paths and is left to the lead.
- R-3 (S4) fixed in docs: every tree's SPEC.md names `array.array` and `mmap` (bytes-like in Python's sense) as outside the promise. The code is unchanged, and the accepted tree is tested to raise TypeError on both.
- New ids: review0 `46c1cb9c8dc8029a45e3f5c02c5092224c701df2`, base0 `b41a7f9c2c38c3caef06ceb0a3987e19098f759b`, accepted0 `ee3f596b58d8a52a440a116c224f6926bcb3d987`. make-repo.sh at HEAD reports that they equal the manifest's (verified).
- Kit suite 78 -> 79 tests OK, check_secrets clean, typecheck clean, and the regression gate PASS through the pre-commit hook on all three commits. Every finding was fixed red-first with guard-removal proofs (7 proofs). Two of my own mistakes were fixed before their commits and are reported below.

## Commits

| sha | finding | subject |
|---|---|---|
| `0d59cc9` | R-1 | tools/calibration: shared pack R-1 - D-2's accepted pin tests a cut inside a UTF-8 character and the stop, so a fix that counts characters or truncates at the end grades FAIL |
| `8d1f023` | R-2 | tools/calibration: shared pack R-2 - the pack README says the checkout guards cover the pack directory only, so the host checks the kit's path itself |
| `8b72079` | R-3 | tools/calibration: shared pack R-3 - SPEC.md names array.array and mmap, which Python also calls bytes-like, as outside the promise |

All commits are by StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>. Every message carries the five
named parts and ends with the `Co-Authored-By` and `Claude-Session` lines. No commit used `--no-verify`, and each went
through `.githooks/pre-commit` (the full regression gate, about 74 s).

## Files

The files are all within the brief's permitted paths:
`tools/calibration/subject-pack/shared/{README.md,manifest.json,trees/accepted/tests/test_pin.py,trees/{review,base,accepted}/SPEC.md}`
and `tools/test_calibration_kit.py`. No kit file outside those paths changed. No source line of any tree changed, so
D-1, D-2 and their accepted fixes stay where they were.

## Per finding

### R-1 (S2): fixed

- **Pin.** `trees/accepted/tests/test_pin.py` now has the two rows above, as the review suggested. The docstring says what each row tests. The stop row uses a sentinel chunk (`3`, which read_bounded rejects), not an endless generator. A generator would make the pin hang at base0 until grade.sh's 120 s timeout. The sentinel fails at once (TypeError) and tests the same stop.
- **Rule.** The manifest's D-2 `required_behaviour` adds "and once limit bytes are taken read_bounded reads no further chunk". The pin case gives this field to its candidate as "The rule", so with the old wording a pin candidate would be asked to test less than the accepted pin does. D-2's `cause` and SPEC.md already said this. This addition goes slightly past the review's wording, so I am naming it here.
- **Test.** `SharedPack.test_grade_fix_wrong_fixes_of_d2_fail_on_the_accepted_pin` builds both wrong fixes from base0's source:
  - `chars` counts a str chunk by its characters.
  - `trunc` adds `return join_parts(parts)[:limit]`.
  Each is committed with the candidate's own test, using the old pin's rows, and graded as a fix cell. The test expects `candidateGreen`, `guardRed`, `scopeOk` and lint ok, but `acceptedPinGreen` false and `PASS` false. A probe then shows that each fix still breaks the promise: `read_bounded(["éééé"], 4)` gives 8 bytes under `chars`, and the stop row raises TypeError under `trunc`. The test also asserts that the rule names both the UTF-8 byte count and the stop.
- **Red (verified).** On the old pin, both subtests failed with `acceptedPinGreen: True, PASS: True`. This reproduces the review's result.
- **Pin on the trees (verified, scratch copies).** Exit 1 at review and at base (an AssertionError and a TypeError). Exit 0 at accepted.
- **Ids.** accepted0 moved `4c16640` -> `ef25afb` in this commit. review0 and base0 did not change.

### R-2 (S4): fixed (documentation, as the review proposed)

- **Change.** README step 3 now says that `historyless-checkout.sh --pack` and the launch refusal of `run.template.js` compare each path with `pack_dir` only, never with the pack's directory in the kit. So a checkout root inside the kit's `trees/` passes both guards, and the host must check the kit's path itself: no checkout root, adjudication checkout or checkout may be the kit's checkout, sit inside it, or hold it.
- **Claim checked (verified, scratch).** A checkout into `<copy of shared>/trees/cand` with `--pack` set to a pack directory outside the kit exits 0. With the copy itself as `--pack`, the script refuses it ("inside the pack", exit 2). `run.template.js` line 73 compares only with `H.pack_dir` (read).
- **Test.** `Docs.test_shared_pack_readme_describes_the_pack` asserts that step 3 states the duty and names both guards. It was red first, and red again with the sentences removed.
- **Not done: the review's alternative.** The review also offered passing the kit's `shared/` as `pack_dir` with `repo` built there. I left it out because it contradicts step 1, which keeps the repository out of the kit's tree.
- **Not done: a kit-side guard (for the lead).** The kit could refuse paths inside its own tree, in both `historyless-checkout.sh` and `run.template.js`. That would be a kit change outside this unit's paths and is a candidate follow-up unit.

### R-3 (S4): fixed (specification only, as the review proposed)

- **Change.** In every tree's SPEC.md, the none line now says: "So is any other object Python also calls bytes-like (one with the buffer protocol, such as an `array.array` or an `mmap`): the promise's bytes-like kinds are the three named above, no more."
- **Code.** Unchanged. Reading any buffer-protocol chunk was set aside, as 78a873f did for the released memoryview, because it would change the seeded module for an edge that no case is about.
- **Test.** The edges test also asserts that each SPEC's none line names both kinds, and that accepted0 raises TypeError on `array.array('b', [65, 66])` and on `mmap.mmap(-1, 2)`.
- **Ids.** All three moved in this commit, because SPEC.md is in every tree. Nothing is released yet.

## Tests, red and green

Commands were run in `/home/user/task5-handoff/wt/sr-pack` with `python3 tools/test_calibration_kit.py [names]` (Python
3.11.15, with node 22 from `/opt/node22/bin` on PATH for the template tests).

| test | red | green |
|---|---|---|
| SharedPack.test_grade_fix_wrong_fixes_of_d2_fail_on_the_accepted_pin (new) | old pin: both wrong fixes PASS, acceptedPinGreen True | both FAIL on acceptedPinGreen only; probes show the broken promise; rule names both halves |
| Docs.test_shared_pack_readme_describes_the_pack (extended) | old step 3 lacks the guard sentence | step 3 states the pack_dir-only guards and the host's kit-path check |
| SharedPack.test_the_spec_states_the_edges_of_the_promise_the_accepted_tree_keeps (extended) | review's SPEC.md lacks `array.array` | every SPEC names `array.array` and `mmap`; accepted raises TypeError on both |

Existing tests that still hold with the new pin and ids (verified):
- `test_d2_the_accepted_pin_is_red_at_base_and_review_and_green_at_accepted`: AssertionError in stderr at review and base, green at accepted.
- The grade PASS and FAIL tests for pin and fix.
- The manifest id, field, leak and hash tests.
- The template launch and refusal tests.

## Guard-removal proofs

For each mutation, the ids and hashes were rebuilt so that the assertion decides the result, not make-repo's id check.
Each was red under the mutation and green when restored (all verified):

1. **R-1:** stop row replaced by an ASCII row -> red on `trunc`.
2. **R-1:** non-ASCII row replaced by an ASCII row -> red on `chars`.
3. **R-1:** stop clause removed from `required_behaviour` -> red.
4. **R-2:** the new README sentences removed -> red.
5. **R-3:** base's SPEC.md without the two names -> red.
6. **R-3:** accepted `chunk_kind` reading `array.array` -> red ("array: TypeError" missing).
7. **R-1 (red-first):** the old pin -> red, as shown in the table above.

## Checks

- **typecheck:** `python3 -m py_compile tools/calibration/subject-pack/shared/trees/*/src/*.py tools/calibration/subject-pack/shared/trees/*/tests/*.py; bash -n tools/calibration/subject-pack/shared/make-repo.sh` -> ok at HEAD (verified).
- **lint:** `python3 tools/check_secrets.py` -> clean (0 hits) at HEAD (verified). The K3 hygiene scan is green as part of the kit suite (verified).
- **unit:** `python3 tools/test_calibration_kit.py` -> 79 tests OK at HEAD, up from 78 at `78a873f` (verified).
- **full suite:** the regression gate ("REGRESSION GATE: all checks PASS") through the pre-commit hook on each of the three commits (verified by the commits landing).
- **make-repo.sh at HEAD:** into a scratch target, it prints the three new ids and "the ids equal manifest.json's", exit 0 (verified).

## Findings for the lead

1. **The ids moved twice this round** (accepted0 in R-1; all three in R-3). The current ids are listed in the gist. Nothing was released, and any protocol written against the old ids or the old manifest hash is stale. The manifest hash also changed in R-2 (the README is in `source_hashes`).
2. **The pin case's rule now names the stop** (R-1). I made this change on my own judgement to keep the pin case's rule equal to what the accepted pin tests. If the lead prefers the old wording, reverting that one manifest line requires no id change.
3. **Kit-side guard (R-2).** A guard that refuses checkouts inside the kit's own tree is the robust fix. It would change `historyless-checkout.sh` and `run.template.js`, which are outside this unit's permitted paths. Candidate follow-up unit.

## What I got wrong and fixed

1. **R-1 guard edit did not apply.**
   - **mistake:** my edit script for one R-1 guard proof matched the pin's first row as a `é` escape, but the file holds a literal é. The edit raised, and the guard ran on the unmutated pin and reported OK.
   - **where:** the guard run for `0d59cc9`, not the committed code.
   - **impact:** none on delivered code; until rerun, that proof proved nothing.
   - **cause:** I assumed the escape form instead of reading it from the file.
   - **fix:** matched the literal character.
   - **verified:** the guard then went red on `chars` and green on restore.
2. **R-2 assertion compared case-sensitively.**
   - **mistake:** the first form of the R-2 assertion compared case-sensitively, so it stayed red on the README's capitalised sentence.
   - **where:** `Docs.test_shared_pack_readme_describes_the_pack`, before `8d1f023`.
   - **impact:** a false red; nothing delivered was affected.
   - **cause:** I wrote the needle in lower case for a sentence that starts with a capital.
   - **fix:** both sides are now compared in lower case.
   - **verified:** green with the sentence, red without it.
