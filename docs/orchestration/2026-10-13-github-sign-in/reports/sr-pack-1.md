# sr-pack report 1: the shared synthetic subject pack

Builder: cc-opus-high (dispatch brief `smartrouter/trace/decisions/sr-pack-1.json`; profile cc-opus-high at effort
high). Worktree `/home/user/task5-handoff/wt/sr-pack`, branch `tools/calibration-shared-pack`, stacked on
`tools/calibration-kit` at `229aa1f`. Five commits, not pushed. This report file is not committed.

## Gist

- `tools/calibration/subject-pack/shared/` is the shared pack, version 1: `src/bounded.py` (`read_bounded` + `chunk_kind` + `join_parts`, 60 lines, stdlib), SPEC.md, a 12-case harness with a by-path runner, three trees (review: D-1+D-2; base: D-2; accepted: neither + the two-row pin), `make-repo.sh` building `review0 -> base0 -> accepted0` with host-independent ids, `manifest.json` carrying every field of the format.
- D-1 (S3): a memoryview chunk makes `read_bounded` raise TypeError (review0 only); D-2 (S3): str chunks skip the bound (review0, base0). Accepted fixes: 1 line (D-1, in base0) and 2 lines (D-2, in accepted0).
- grade.sh and run.template.js run this pack unchanged (no stop trigger): the accepted pin and the accepted fix grade PASS, a pin green at base, a pin that touches src/ and a fix that edits SPEC.md grade FAIL; the filled template launches under the stub harness and its refusals hold.
- Kit suite 57 -> 78 tests (21 new in `SharedPack` and `Docs`), red-first where the code under test did not yet exist, about 40 guard-removal proofs; py_compile, bash -n, check_secrets, the K3 hygiene scan and the regression gate green on every commit through the pre-commit hook.
- Four existing kit tests adjusted (lineage header, README listing, the stub test, the CHANGELOG test) and two mistakes of mine fixed in-branch (stale ids; `git tag` under tag.gpgSign), both reported below.

## Commits

| sha | subject |
|---|---|
| `6605855` | tools/calibration: shared pack 1/4 - the subject trees and make-repo.sh, which builds the pack repository with fixed commit ids |
| `163df1a` | tools/calibration: shared pack 2/4 - manifest.json in the kit's format, with the built ids, and grade.sh grading this pack |
| `a80ea3e` | tools/test_calibration_kit.py: shared pack 3/4 - run.template.js filled with the shared pack launches under the stub harness, and its refusals hold |
| `4db14a0` | tools/calibration: shared pack 4/4 - the pack's README, a paragraph each in the kit and pack-format READMEs, the CHANGELOG line |
| `78a873f` | tools/calibration: shared pack - make-repo.sh writes its tags as refs, and SPEC.md states the two edges of the promise a review would otherwise report |

Identity StepenkoAnatoli <318295322+StepenkoAnatoli@users.noreply.github.com>; every message carries the five named
parts and ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and the `Claude-Session` line. No model
name in any committed file. Every commit went through `.githooks/pre-commit` (the full regression gate, about 70 s);
no `--no-verify`.

The current ids (manifest.json): review0 `9f93403b9cdb1d322962ada924c468af653ed19a`, base0
`2b23fc8f2eb167b2a7ac2855b154d50e8ae2af5b`, accepted0 `4c1664069536293e87afba9027844cae45b6af98`.

## Files

All within the permitted effects:

- `tools/calibration/subject-pack/shared/`: `README.md` (replaces the stub), `manifest.json`, `make-repo.sh` (100755),
  `.gitattributes` (`* -text`, so a CRLF host builds the same ids), and `trees/{review,base,accepted}/` each with
  `.gitignore` (bytecode caches, so grade.sh's untracked list stays clean), `SPEC.md`, `src/__init__.py`,
  `src/bounded.py`, `tests/run.py`, `tests/test_bounded.py`; `trees/accepted/tests/test_pin.py` (D-2's accepted pin).
- `tools/test_calibration_kit.py`: helpers (`PACK`, `TREES`, `pack_files`, `build_shared`, `tree_files`,
  `run_pack_tests`, `text_hash`, `strings`, `PROMISE`), the `SharedPack` class (19 tests), 2 new `Docs` tests, 4
  adjusted tests (below).
- `tools/calibration/README.md` (a "The shared pack" paragraph; the files-table row, Pack step and limits bullet no
  longer call the pack a stub or a later unit), `tools/calibration/subject-pack/README.md` (a "The shared pack"
  paragraph), `CHANGELOG.md` (one Unreleased line).

## Design as built (P1-P6)

- **Subject (P1).** `read_bounded(chunks, limit)`: classify each chunk (`chunk_kind`: BINARY for bytes, bytearray,
  memoryview; TEXT for str; None otherwise -> TypeError, outside the promise), encode text as UTF-8 with `replace`
  (a lone surrogate becomes `?`, so the promise holds for every str), take `bytes(chunk)[:limit - taken]` (bytes first,
  so a memoryview of a non-byte format still counts bytes), stop after the chunk that reaches `limit`, join
  (`join_parts`). The module docstring states the brief's promise word for word (tested). The harness (12 cases)
  is byte-identical in the three trees and green on each: it never feeds a memoryview and never mixes str with the
  bound, so it names nothing of either fix.
- **Defects (P2).** D-1 at review0: `chunk_kind`'s isinstance tuple lacks memoryview. D-2 at review0 and base0: the
  TEXT branch does `parts.append(chunk.encode(...)); continue`, skipping the count, the cut and the stop. base0's
  message names D-1, accepted0's names D-2; `findings[D-1].accepted_fix` is base0 (the fixture manifest's lineage).
- **Repository (P3).** No nested `.git`: `make-repo.sh TARGET` hashes every tree file with `hash-object --no-filters`
  into a private index at mode 100644, writes the tree, and `commit-tree --no-gpg-sign` with a fixed identity
  (exported), fixed dates (2026-01-01/02/03 UTC), fixed messages and `i18n.commitEncoding=UTF-8`; tags as refs via
  `update-ref`; it prints `<tag> <id>` and exits 1 when the ids differ from a `manifest.json` beside it (an addition
  past the brief: it tells a host at build time that its copy of the pack is not version 1 as published).
- **Manifest (P4).** Every one of the 61 fields the format README documents is present (tested against the README,
  not the fixture, which omits optional ones); `commit_rule` and `paths.map_file` are null, `allowed_extra` is [],
  `cases.fix.instructions` says SPEC.md stays as it is. Pass rules are the fixture's, verbatim. `source_hashes` covers
  the 22 other pack files under the protocol's convention. No manifest string contains a line either accepted fix adds
  (tested).
- **Docs (P6).** As the brief lists; the README's "How a host runs it" has the host build `<pack dir>/repo` outside the
  kit's tree and copy the manifest unchanged beside it, so `repository` stays `repo` and the manifest hash is the same
  on every host; a host building elsewhere writes the path into its copy (and records the changed hash).

## Tests, red and green

Commands run in `/home/user/task5-handoff/wt/sr-pack` with `python3 tools/test_calibration_kit.py [names]`
(Python 3.11.15; node 22 at /opt/node22 for the template tests).

| test | red | green |
|---|---|---|
| SharedPack.test_make_repo_builds_three_commits_holding_the_trees | no make-repo.sh (bash exit 127; all 7 of commit 1's tests red) | 3 commits, linear, tags, trees byte-equal, mode 100644, D-1/D-2 in messages |
| SharedPack.test_make_repo_ids_do_not_depend_on_the_host | same; in commit 5, red under tag.gpgSign ("There was a problem with the editor") | same ids under a hostile config (clean filter, autocrlf, eol=crlf, commit+tag signing with a failing signer, ISO-8859-1 encoding, other branch, env identity/dates, TZ) and when built elsewhere |
| SharedPack.test_make_repo_refuses_an_existing_target_and_a_bad_call | no script | exit 2, target untouched |
| SharedPack.test_the_shipped_harness_is_green_on_every_tree | no script | 12 cases green on review0, base0, accepted0 |
| SharedPack.test_the_runner_reads_red_on_a_failure_a_broken_file_or_no_test | no script | exit 1 / 1 / 1, no file 2, green+red 1 |
| SharedPack.test_d2_the_accepted_pin_is_red_at_base_and_review_and_green_at_accepted | no script | red (AssertionError) at review0 and base0, green at accepted0 |
| SharedPack.test_d1_a_memoryview_chunk_raises_at_review_only | no script | review "raised TypeError", base and accepted "returned b'abcd'" |
| SharedPack.test_the_manifest_carries_the_built_ids | no manifest (error) | ids, present_at, per-finding accepted_fix; make-repo reports equality |
| SharedPack.test_make_repo_fails_when_the_ids_differ_from_the_manifest | no manifest (fail) | exit 1 naming base0's fields, not review0's |
| SharedPack.test_the_manifest_carries_every_field_of_the_format | no manifest (error) | 61 documented fields, P4 values, promise in each tree's docstring |
| SharedPack.test_no_manifest_text_states_an_accepted_fix | no manifest (error) | no added fix line in any manifest string |
| SharedPack.test_source_hashes_cover_every_pack_file | no manifest (error) | 22 files, each hash matches |
| SharedPack.test_grade_pin_the_accepted_pin_passes | no manifest (grade.sh exit 2) | PASS: redAtHead, greenWithFix, srcClean, lint ok |
| SharedPack.test_grade_pin_a_wrong_pin_fails | same | green-at-base pin FAIL; pin+source-fix FAIL (srcTouched src/bounded.py) |
| SharedPack.test_grade_fix_the_accepted_source_with_a_pin_passes | same | PASS: green, guard red, accepted pin green, scope ok, srcDiffLines 3 |
| SharedPack.test_grade_fix_a_scope_breaking_fix_fails | same | FAIL on scope only (outOfScope SPEC.md) |
| SharedPack.test_the_workflow_template_launches_on_this_pack | green on first run (template and manifest already committed); red shown by guards | no refusal; 4 cells; prompts name only their checkout, never the pack, trees, make-repo, the accepted test path or an id; review prompt free of ground truth |
| SharedPack.test_the_launch_refusals_hold_on_this_pack | same | path-sharing refusals x3 and the unfrozen-protocol refusal, no agent call |
| SharedPack.test_the_spec_states_the_edges_of_the_promise_the_accepted_tree_keeps | SPEC.md without "released" | both edges stated in every SPEC; accepted: released view ValueError, limit 0 pulls exactly one chunk |
| Docs.test_shared_pack_readme_describes_the_pack | stub README | sections, version, D-1/D-2 lines, no fix line, every file listed |
| Docs.test_the_kit_and_format_readmes_name_the_shared_pack | no section | both "The shared pack" sections |

Adjusted existing tests (all in the permitted test file): `test_every_kit_file_has_a_lineage_header` skips
`subject-pack/shared/trees/` (the subject a candidate reads; a lineage header there would sit in every candidate's
checkout); `test_readme_lists_every_kit_file` skips the pack's files other than its README (the pack's README lists
them, tested); `test_shared_pack_is_a_stub_naming_the_unit_that_builds_it` became
`test_shared_pack_holds_its_trees_and_the_script_that_builds_its_repository`; `test_changelog_and_readme_name_the_kit`
expects the kit line and the pack line (two Unreleased lines naming `tools/calibration/`).

## Guard-removal proofs (each red under the mutation, green on restore; verified)

Logs: the scratchpad's `c1-guards.txt` .. `c5-guards.txt` (not committed).

- make-repo.sh: drop `--no-filters`; drop `-c i18n.commitEncoding=UTF-8`; drop the fixed dates; un-export the identity;
  `git tag` instead of `update-ref` -> host-independence test red. Drop the existing-target refusal -> refusal test
  red. `sys.exit(1)` on differing ids -> pass -> differ test red. Drop `--no-gpg-sign` -> nothing red: `git
  commit-tree` ignores `commit.gpgSign`; the flag is kept as a belt (no test can see it).
- Trees: give review0 the D-1 fix -> D-1 test red; take the D-2 fix out of accepted0 or put it into base0 -> D-2 test
  red; a harness row that crosses the bound -> harness test red; run.py always 0, or passing an empty file -> runner
  test red. With the manifest's ids and hashes rewritten for the mutation (so the assertion decides, not the id
  check): drop the released-memoryview sentence, return early on limit 0, swallow the released view's ValueError ->
  edges test red.
- Manifest: wrong per-finding commit or present_at -> ids test red; drop `cases.review.scope` or set a tier T2 ->
  fields test red; a fix line inside a cause -> leak test red; a wrong or missing source hash -> hashes test red; a
  new-test pattern the pin's file misses -> pin PASS test red; SPEC.md in allowed_extra -> scope test red; a source
  list missing src/bounded.py -> fix PASS test red; a `{{placeholder}}` in subject.name, a trees/ path in the reference,
  D-2's summary in the review scope, another commit prefix -> launch test red.
- Kit files in scratch (restored, never committed): grade.sh `red()` always true -> wrong-pin test red;
  run.template.js without the path-sharing refusal -> refusals test red; a review prompt appending the findings'
  causes -> launch test red.
- Docs: a fix line in the pack README, a file it no longer lists, a missing "When it is rewritten" section -> README
  test red; the kit README without its section, the format README without make-repo.sh -> paragraphs test red; the
  CHANGELOG line renamed -> CHANGELOG test red.

## Checks (acceptance list of the dispatch brief)

- typecheck: `python3 -m py_compile tools/calibration/subject-pack/shared/trees/*/src/*.py
  tools/calibration/subject-pack/shared/trees/*/tests/*.py; bash -n tools/calibration/subject-pack/shared/make-repo.sh`
  -> exit 0 (verified at HEAD).
- lint: `python3 tools/check_secrets.py` -> "clean (0 hits)", exit 0; the K3 scan (`Hygiene`) green over the kit
  with the pack in it (verified at HEAD).
- unit: `python3 tools/test_calibration_kit.py` -> 78 tests OK at HEAD (57 before; verified).
- full suite: `python3 tools/run_regression.py` at HEAD -> "REGRESSION GATE: all checks PASS", 52 checks PASS, 73 s
  (verified; baseline at 229aa1f the same), and through the pre-commit hook on each of the five commits (verified by
  the commits landing).
- refute-first review: the lead's step, not run here.

## Findings for the lead

1. No stop trigger: grade.sh and run.template.js run the pack unchanged; no kit file outside the permitted paths was
   edited (the scratch mutations above were restored and never staged).
2. Interim state: between commits 1 and 3 the pack's README was still the stub ("not built here"); the brief ordered
   the docs last. Each commit is green on its own; reverting commit 4 restores the stub wording with a built pack.
3. Commit 5 changed the trees' SPEC.md after the manifest was first written, so the ids moved once
   (`5d5ad12/7e7b748/01e3acb` -> `9f93403/2b23fc8/4c16640`). Nothing was released; the README forbids in-place edits
   after a release.
4. A pin candidate that drives `read_bounded` with an endless generator of str at base0 hangs until the 120 s
   timeout (D-2 skips the stop too); grade.sh reads a timeout as not red, so that cell FAILs. That is the defect's
   honest shape, not a grading error, but it costs two minutes per such cell.
5. Isolation relies on placement: `trees/accepted/` (the accepted fix) and `manifest.json` sit in the kit's tree, so a
   host keeps every checkout outside both the pack directory and the kit's checkout (the pack README says so; the
   launch guard only compares against `host.pack_dir`).
6. Locally Python is 3.11.15 and node 22 (`/opt/node22`); CI runs 3.12. Nothing here needs either newer.

## What I got wrong and fixed

1. **mistake:** the first manifest carried commit ids from a build made before two harness cases were merged into one;
   **where:** the manifest write in commit 2's work; **impact:** every SharedPack test red (make-repo.sh refused the
   differing ids), nothing delivered affected; **cause:** ids copied from an earlier build instead of a fresh one;
   **fix:** rebuilt from the committed trees and rewrote the manifest from that output; **verified:** make-repo.sh
   reports the ids equal and the kit's tests OK.
2. **mistake:** the first field-coverage test compared case keys with the fixture manifest, which omits the optional
   `cases.fix.instructions`; **where:** `test_the_manifest_carries_every_field_of_the_format`; **impact:** a false
   red, nothing delivered affected; **cause:** the fixture taken for the format; **fix:** the test reads the 61 fields
   from the format README; **verified:** removing `cases.review.scope` turns it red, restoring green.
3. **mistake:** the kit-README test refused "a stub" anywhere; **where:**
   `test_the_kit_and_format_readmes_name_the_shared_pack`; **impact:** a false red on "stub harness", nothing
   delivered affected; **cause:** a needle wider than the row it meant; **fix:** it refuses the old row's text;
   **verified:** green, and red when the section is renamed.
4. **mistake:** make-repo.sh tagged with `git tag`, which a host with `tag.gpgSign` turns into a signed annotated tag;
   **where:** make-repo.sh in `6605855`; **impact:** on such a host the build failed after writing the commits (or
   opened an editor), so the host could not run the pack; not pushed, not run on any host; **cause:** the hostile
   config covered commit signing, not tag signing; **fix:** `update-ref` for the tags (`78a873f`) and `tag.gpgSign` +
   `GIT_EDITOR=false` in the hostile config; **verified:** red with `git tag`, green with `update-ref`.
5. **mistake:** one guard for the edges test was ineffective (a released memoryview's `.obj` raises too, so the
   mutation still raised); **where:** the commit-5 guard run; **impact:** a proof that proved nothing, no code
   affected; **cause:** the mutation not checked to change behaviour; **fix:** a mutation that catches the
   ValueError; **verified:** red under it, green on restore.
