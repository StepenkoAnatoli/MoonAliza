---
url: https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979
retrieved: 2026-09-29
command: firecrawl scrape https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979 --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Fix trace short writes when large masks are configured (!2979) · Merge requests · GitLab.org / gitlab-runner · GitLab
---
[Snippets](https://gitlab.com/explore/snippets) [Groups](https://gitlab.com/explore/groups) [Projects](https://gitlab.com/explore/projects)

# Fix trace short writes when large masks are configured

Rapid Diffs

Beta


- [Learn more](https://gitlab.com/help/user/project/merge_requests/changes#rapid-diffs)
- [Leave feedback](https://gitlab.com/gitlab-org/gitlab/-/work_items/596236)
- Switch to classic loading

Code


- Review changes

  - Check out branch

  - [Open in Workspace](https://gitlab.com/-/remote_development/workspaces/new?project=gitlab-org%2Fgitlab-runner&gitRef=ajwalker/fix-trace-safe-token)
- Download

  - [Patches](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979.patch)
  - [Plain diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979.diff)

Expand sidebar

Merged
[Fix trace short writes when large masks are configured](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#top)

[Arran Walker](https://gitlab.com/ajwalker) requested to merge

[ajwalker/fix-trace-safe-token](https://gitlab.com/gitlab-org/gitlab-runner/-/tree/ajwalker/fix-trace-safe-token "ajwalker/fix-trace-safe-token") into [main](https://gitlab.com/gitlab-org/gitlab-runner/-/tree/main "main") Jun 22, 2021

- [Overview\\
54](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979)
- [Commits\\
1](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/commits)
- [Pipelines\\
0](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/pipelines)
- [Reports\\
  -](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/reports)
- [Changes\\
2](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs)

11 open thread

Thread options


- Show all comments


## What does this MR do? [Link to heading 'What does this MR do?'](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979\#what-does-this-mr-do)

Fixes an issue where trace's `buffer.Write()` can return a `transform: short source` error when exceeding an internal buffer.

If a large mask has been defined, each log line written is buffered until equal or more in length. This is to detect whether a secret lies within that buffer. However, we use `text/transform` to perform this, which has an internal buffer size of 4094 bytes. If a secret exceeds this limit, a `short source` error occurs as the transform asks for more data to be populated, but no more fits.

This MR fixes the `short source` error from bubbling up to the writer, but in certain situations, will have to reveal the tail of a secret (when the secret is over 4096 bytes). It turns out this is not a breaking change as such, as the older masking implementation had a similar edgecase, but would leak the entire secret, not just the tail. This needs to be documented as a technical limitation of masking.

## Why was this MR needed? [Link to heading 'Why was this MR needed?'](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979\#why-was-this-mr-needed)

Trace logs were being truncated and causing jobs to fail.

## What's the best way to test this MR? [Link to heading 'What's the best way to test this MR?'](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979\#whats-the-best-way-to-test-this-mr)

### Manual QA [Link to heading 'Manual QA'](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979\#manual-qa)

Have a job that will print a secret variable many, many times:

```yaml
mask-job:
  script:
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
```

- To test masking up to 4096 bytes, create a project variable `MASK_ME` with 4096 characters of content..
- To test masking beyond 4096 bytes, where the tail of the secret _might_ be revealed, set `MASK_ME` to a much larger secret.

### Fuzzing [Link to heading 'Fuzzing'](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979\#fuzzing)

[!2993 (merged)](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2993 "Fix trace short writes for large log lines") introduced a fuzz test that should already fail on this type of bug.

```plaintext
docker run -v $(pwd):/code --rm -it golang:1.13.8
go get github.com/dvyukov/go-fuzz/go-fuzz && go get github.com/dvyukov/go-fuzz/go-fuzz-build
cd /code/helpers/trace
mkdir corpus
cp testdata/corpus/* corpus/
go-fuzz-build
go-fuzz
```

## What are the relevant issue numbers? [Link to heading 'What are the relevant issue numbers?'](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979\#what-are-the-relevant-issue-numbers)

Closes [#27964 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27964 "Log masking crashes on long data")

Edited Jun 30, 2021 by [Arran Walker](https://gitlab.com/ajwalker)

👍0👎0

## Merge request reports

Approved by

[![Georgi N. Georgiev | GitLab](https://secure.gravatar.com/avatar/d2189187f4fef769508fc45200db57168431557e367631fbbeee519edfce0c37?s=80&d=identicon&width=48)](https://gitlab.com/ggeorgiev_gitlab)


All merge request dependencies have been merged

(1 merged)


- [Fix trace short writes for large log lines](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2993)







!2993



14.1

[![Assigned to Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon&width=48)](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979)


#### Merged by  [![Georgi N. Georgiev | GitLab](https://secure.gravatar.com/avatar/d2189187f4fef769508fc45200db57168431557e367631fbbeee519edfce0c37?s=80&d=identicon)Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) Aug 10, 2021 (August 10, 2021 at 9:28:36 AM EDT) Aug 10, 2021

Revert


Merge details


- Changes merged into main with [9054237d](https://gitlab.com/gitlab-org/gitlab-runner/-/commit/9054237de624bbc9764ee6254491ec264ed290b1).
- Deleted the source branch.

- Closed
[#27964 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/work_items/27964 "Log masking crashes on long data")

- Auto-merge enabled


9 environments impacted.

View all environments.


## Activity

All activity

Filter activity


Deselect all


- Approvals
- Assignees & reviewers
- Comments (from bots)
- Comments (from users)
- Commits & branches
- Edits
- Labels
- Lock status
- Mentions
- Merge request status
- Tracking

- [Arran Walker](https://gitlab.com/ajwalker) added [\[Deprecated\] Category:Runner](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=%5BDeprecated%5D+Category%3ARunner "Please select Runner Core, Runner SaaS, or Runner Fleet")[devopsverify](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=devops%3A%3Averify "<span class=\"gl-font-bold\">Scoped label</span><br>Issues for the Verify stage of the DevOps lifecycle (e.g. CI, Code Quality, Usability Testing)")[grouprunner core](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=group%3A%3Arunner+core "<span class=\"gl-font-bold\">Scoped label</span><br>Issues belonging to the Runner group of the Verify stage of the DevOps lifecycle.") labels [Jun 22, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_e1806016a44617ae4cbe794d928fd68f762d44bc "Tuesday, June 22, 2021 at 3:35:40 PM EDT")











added [\[Deprecated\] Category:Runner](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=%5BDeprecated%5D+Category%3ARunner "Please select Runner Core, Runner SaaS, or Runner Fleet")[devopsverify](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=devops%3A%3Averify "<span class=\"gl-font-bold\">Scoped label</span><br>Issues for the Verify stage of the DevOps lifecycle (e.g. CI, Code Quality, Usability Testing)")[grouprunner core](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=group%3A%3Arunner+core "<span class=\"gl-font-bold\">Scoped label</span><br>Issues belonging to the Runner group of the Verify stage of the DevOps lifecycle.") labels

- [Arran Walker](https://gitlab.com/ajwalker) assigned to [@ajwalker](https://gitlab.com/ajwalker "Arran Walker") [Jun 22, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_608472063 "Tuesday, June 22, 2021 at 3:35:40 PM EDT")











assigned to [@ajwalker](https://gitlab.com/ajwalker "Arran Walker")

- [🤖 GitLab Bot 🤖](https://gitlab.com/gitlab-bot) added [sectionops](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=section%3A%3Aops "<span class=\"gl-font-bold\">Scoped label</span><br>Any issues related to the Ops Section") label [Jun 22, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_58d33efdf22e0cf8c9e0f3e7fff38ca26fef92e2 "Tuesday, June 22, 2021 at 8:15:12 PM EDT")











added [sectionops](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=section%3A%3Aops "<span class=\"gl-font-bold\">Scoped label</span><br>Any issues related to the Ops Section") label

- [Arran Walker](https://gitlab.com/ajwalker) added 17 commits [Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_610576646 "Thursday, June 24, 2021 at 7:27:31 AM EDT")











added 17 commits



  - [737d7cee...327a951d](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/737d7cee018d3bdcf99822708a0dfa76ad3869b4...327a951d1d52a414b07c7c0d44976cd494f71b9f) \- 12 commits from branch `main`
  - [590979a9](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=590979a909aa672dfcdd633946212572ea5655b9 "Fix trace masking safe-token use") \- Fix trace masking safe-token use
  - [ff6f0b8b](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=ff6f0b8b5251d1d58e0f30bf6ce699b42ac38645 "Fix trace masking on large writes with large secrets") \- Fix trace masking on large writes with large secrets
  - [352d8601](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=352d860141ebe87f0a6d37411210ec3e6f239c4e "Order masked values by length to prevent longer values being partially revealed") \- Order masked values by length to prevent longer values being partially revealed
  - [35f8110c](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=35f8110c99d93999b4560a5a911f299237b57b08 "Deduplicate masked secrets to prevent additional trace transformers") \- Deduplicate masked secrets to prevent additional trace transformers
  - [cb26a5b4](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=cb26a5b4b9604f732ae6ef0ce38508bf4f1672a0 "Improve trace fuzz testing") \- Improve trace fuzz testing

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=205638543&start_sha=737d7cee018d3bdcf99822708a0dfa76ad3869b4)

Toggle commit list

- [Arran Walker](https://gitlab.com/ajwalker) changed the description [Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_610590721 "Thursday, June 24, 2021 at 7:44:20 AM EDT")Compare with previous version











changed the description

- [Arran Walker](https://gitlab.com/ajwalker) changed title from **Fix trace masking safe-token use** to **Fix trace masking short writes** [Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_610591079 "Thursday, June 24, 2021 at 7:44:41 AM EDT")











changed title from **Fix trace masking safe-token use** to **Fix trace masking short writes**

- [Arran Walker](https://gitlab.com/ajwalker) added 3 commits [Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_610606427 "Thursday, June 24, 2021 at 8:02:21 AM EDT")











added 3 commits



  - [456f27ea](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=456f27eaaaa4cfc6959b1e612cd7f83e45188e4e "Order masked values by length to prevent longer values being partially revealed") \- Order masked values by length to prevent longer values being partially revealed
  - [13062472](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=130624726b551ed3d68e92e36c5bd4b24c935062 "Deduplicate masked secrets to prevent additional trace transformers") \- Deduplicate masked secrets to prevent additional trace transformers
  - [f9d2b6f4](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=f9d2b6f491ac668450de1d51304910bdcad97241 "Improve trace fuzz testing") \- Improve trace fuzz testing

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=205659656&start_sha=cb26a5b4b9604f732ae6ef0ce38508bf4f1672a0)

- [Arran Walker](https://gitlab.com/ajwalker) added 1 commit [Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_610716151 "Thursday, June 24, 2021 at 9:39:23 AM EDT")











added 1 commit



  - [7ba4f44b](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=7ba4f44bd94be6477bdbb487d38ece4f2fa8e917 "Improve trace fuzz testing") \- Improve trace fuzz testing

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=205732319&start_sha=f9d2b6f491ac668450de1d51304910bdcad97241)

- - [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







      [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_611011938 "Thursday, June 24, 2021 at 2:12:04 PM EDT")






      Author

      Maintainer





      More actions












    - Copy link
      - Report abuse

At the moment, we "support" masking secrets of any size. With the tracing implementation introduced in `13.12.0`, a job with a large secret defined can cause errors whilst writing large continuous log lines.

For example, if you have a mask rule that contains a secret that's 4096 bytes, printing a continous log line over 4096 bytes (that does not include `\n` or `\r`) will cause an error. And that can be any line, it doesn't have to include any secrets.

The reason this problem occurs is that until we're sure that the data being written doesn't contain a secret, we first need to buffer X amount of bytes (where X is the length of the secret). Unfortunately, the buffer limit is something outside of our control and is set to 4096 bytes. Once we exceed this buffer, writes then fail.

The older masking implementation (`< v13.12.0`) didn't have this problem because it did not worry so much about whether secrets were masked or not. Log lines of any size can be printed no matter the length of the defined masks. However, due to lack of buffering, if a secret _was_ printed, there's no guarantee that it will be reliably masked. Depending on where a write boundary sits, either the whole secret is masked or the whole secret is revealed. How the data is printed and the text around it can influence where a write boundary will occur and increase the chances of exposure.

So to summarise:

### `< v13.12.0` masking implementation

    - Masking is _not_ 100% guaranteed for example [https://gitlab.com/steveazz/playground/-/jobs/1395260983](https://gitlab.com/steveazz/playground/-/jobs/1395260983)
    - Can print log lines of any length

### `>= v13.12.0` masking implementation

    - Masking _is_ 100% guaranteed
    - Masking large secrets (>4094 bytes) can truncate trace output.
    - Printing large log lines (>max defined mask length) can truncate trace output and fail the job.

So the `>= v13.12.0` masking implementation is more reliable at masking, but it's strict guarantee of not revealing a secret causes reliability problems in general.

This MR "fixes" this by only masking the first 4094 bytes of a secret. However, I'm struggling on deciding whether this is technically a breaking change or not and whether it's a good enough solution.

With this change, we can guarantee that the first 4094 bytes will be masked. The `< v13.12.0` implementation would either mask the whole secret or reveal the whole secret when encounting a write boundary. If we've never reliably supported large secrets, can this be considered a breaking change? It's also worth noting that it's likely rare to be printing a large secret you care about to your trace output anyway.

We have to ideally have some limit. Supporting an unbounded size would allow a resource exhaustion attack. 4094 might not be ideal, but it's what we get for "free" without increasing complexity.

If we do consider this to be the way forward and also a breaking change, I'm not sure who else we would need involved to sign off on this.

cc [@gitlab-com/runner-maintainers](https://gitlab.com/gitlab-com/runner-maintainers "GitLab.com / runner-maintainers") [@erushton](https://gitlab.com/erushton "Elliot Rushton") [@darbyfrey](https://gitlab.com/darbyfrey "Darby Frey")

Edited


Jul 2, 2021 by [Steve Xuereb](https://gitlab.com/sxuereb)

  - Collapse replies

  - [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







    [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Jun 24, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_611189501 "Thursday, June 24, 2021 at 9:01:33 PM EDT")






    Author

    Maintainer





    More actions












    - Copy link
      - Report abuse

To give some idea on the reliability of masking larger secrets for the old and newer implementations...

## 4094 bytes, echo'd 50 times:

    - Using **`v13.11.0`** (older masking impl)

      [https://gitlab.com/ajwalker/cacheperf/-/jobs/1375717717](https://gitlab.com/ajwalker/cacheperf/-/jobs/1375717717)

      Exposed the secret **4** times.

      Job took 1m6s to complete and runner used 100% of one core whilst masking for the whole duration.

    - Using **`v14.0.1`** (newer masking impl)

      [https://gitlab.com/ajwalker/cacheperf/-/jobs/1375720658](https://gitlab.com/ajwalker/cacheperf/-/jobs/1375720658)

      Exposed the secret zero times.

      Job took 2s to complete.


## 6000 bytes, echo'd 50 times:

    - Using **`v13.11.0`** (older masking impl)

      [https://gitlab.com/ajwalker/cacheperf/-/jobs/1375732604](https://gitlab.com/ajwalker/cacheperf/-/jobs/1375732604)

      Exposed the secret zero times. 2m35s.

      Run the job again immediately after:

      [https://gitlab.com/ajwalker/cacheperf/-/jobs/1375734449](https://gitlab.com/ajwalker/cacheperf/-/jobs/1375734449)

      Exposed the secret **3** times. 2m25s.

    - Using this MR:

      [https://gitlab.com/ajwalker/cacheperf/-/jobs/1375738913](https://gitlab.com/ajwalker/cacheperf/-/jobs/1375738913)

      Exposes **part** of the secret every single time. Masks the first 4094 bytes of the secret every time. 7s.


My preference is that we go ahead with this change, but make it clear in the documentation the size limitation.

Does this count as a breaking change if we're transitioning from sometimes revealing whole secrets at random to now intentionally revealing part of a secret but only at a certain size?

Edited


Jun 24, 2021 by [Arran Walker](https://gitlab.com/ajwalker)

  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)







    [Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)[Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612938188 "Monday, June 28, 2021 at 8:15:30 AM EDT")






    Developer





    More actions












    - Copy link
      - Report abuse

In my mind, it probably counts as a breaking change since builds that were passing before will now potentially fail (even though I think we agree that is better than revealing a secret). Ideally, we'd document the upcoming size limitation to be introduced in [%14.6](https://gitlab.com/groups/gitlab-org/-/milestones/67 "") to allow people to prepare for it.

Would it be possible to enable this new logic selectively on builds for which we know that secrets will fit within 4094 bytes? Then we could enable it everywhere for [%14.6](https://gitlab.com/groups/gitlab-org/-/milestones/67 "") but start reaping the benefits in the vast majority of builds already.

  - [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







    [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612948454 "Monday, June 28, 2021 at 8:26:37 AM EDT")






    Author

    Maintainer





    More actions












    - Copy link
      - Report abuse

[@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") This MR wouldn't break in that way.

When I refer to "New masking implementation", I refer to what we now currently have (as of `13.12`).

This MR would always allow builds to pass, the only change in behaviour would be that in order to have it pass, there would be a limit on the secrets length, where over a certain limit, the remaining part of the secret is visible. The implementation before `13.12` would randomly leak secrets in full when encountering a similar scenario.

I'll update the above comments to try and make it clearer between what I mean by "new masking implementation".

  - [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







    [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612952434 "Monday, June 28, 2021 at 8:30:19 AM EDT")






    Author

    Maintainer





    More actions












    - Copy link
      - Report abuse

I think I'll split this MR up also, so that this only concerns this specific masking size issue.

  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)







    [Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)[Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612953096 "Monday, June 28, 2021 at 8:31:02 AM EDT")






    Developer





    More actions












    - Copy link
      - Report abuse

[@ajwalker](https://gitlab.com/ajwalker "Arran Walker") Thanks for the clarification. Yeah, in that sense it doesn't sound like a breaking change since we're merely improving something (we now only leak the tail of the secret instead of the whole secret).

  - [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







    [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613406448 "Monday, June 28, 2021 at 4:43:19 PM EDT")






    Author

    Maintainer





    More actions












    - Copy link
      - Report abuse

Rather than simply limit the masks length and tail the secret, it now performs a best effort to mask everything unless it has no other choice to tail the secret.

This brings it more in line with the older implementation of "randomly" revealing secrets, but will never reveal the whole thing. I also ensures that it uses the full 4096 characters.

Similar to above, I tested with 6000 bytes, echo'd 50 times: [https://gitlab.com/ajwalker/cacheperf/-/jobs/1383683471](https://gitlab.com/ajwalker/cacheperf/-/jobs/1383683471)

1 partial reveal, 6s job time.

I suspect our documentation should be updated with something like:

> Using a larger mask (above 4096 characters) is not recommended due to a technical limitation and can result in characters beyond the 4096 soft-limit to be revealed.

And perhaps we can show a warning in the UI?

  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)







    [Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)[Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614364133 "Tuesday, June 29, 2021 at 10:08:32 AM EDT")






    Developer





    More actions












    - Copy link
      - Report abuse

> I suspect our documentation should be updated with something like:
>
> > Using a larger mask (above 4096 characters) is not recommended due to a technical limitation and can result in characters beyond the 4096 soft-limit to be revealed.

Agreed.

> And perhaps we can show a warning in the UI?

Yup, warning the user about this potential behavior is definitely the right thing to do. We can also include a link to the documentation.

  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)







    [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)[Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_642596941 "Wednesday, August 4, 2021 at 2:24:25 AM EDT")






    Contributor





    More actions












    - Copy link
      - Report abuse

[@ajwalker](https://gitlab.com/ajwalker "Arran Walker") do we have a merge request to add this information in the [masked variables docs](https://docs.gitlab.com/ee/ci/variables/#mask-a-cicd-variable)?

  - Please [register](https://gitlab.com/users/sign_up?redirect_to_referer=yes) or [sign in](https://gitlab.com/users/sign_in?redirect_to_referer=yes) to reply


- [Arran Walker](https://gitlab.com/ajwalker) mentioned in issue [#27964 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27964 "Log masking crashes on long data") [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612711564 "Monday, June 28, 2021 at 4:26:07 AM EDT")











mentioned in issue [#27964 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27964 "Log masking crashes on long data")

- [Arran Walker](https://gitlab.com/ajwalker) changed the description [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612712029 "Monday, June 28, 2021 at 4:26:38 AM EDT")Compare with previous version











changed the description

- [Arran Walker](https://gitlab.com/ajwalker) requested review from [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_612714153 "Monday, June 28, 2021 at 4:28:57 AM EDT")











requested review from [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro")

- [Arran Walker](https://gitlab.com/ajwalker) added [regression:13.12](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=regression%3A13.12 "") label [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_13039dc108c0c55298271f978c008c0018318f05 "Monday, June 28, 2021 at 4:29:44 AM EDT")











added [regression:13.12](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=regression%3A13.12 "") label

- [Arran Walker](https://gitlab.com/ajwalker) added [typebug](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=type%3A%3Abug "<span class=\"gl-font-bold\">Scoped label</span><br>Issues that report undesirable or incorrect behavior. See https://handbook.gitlab.com/handbook/product/groups/product-analysis/engineering/metrics/#work-type-classification") label [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_b172c4e5090def2b0586f2158b582298fe0d223c "Monday, June 28, 2021 at 4:30:09 AM EDT")











added [typebug](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=type%3A%3Abug "<span class=\"gl-font-bold\">Scoped label</span><br>Issues that report undesirable or incorrect behavior. See https://handbook.gitlab.com/handbook/product/groups/product-analysis/engineering/metrics/#work-type-classification") label

- [Arran Walker](https://gitlab.com/ajwalker) changed milestone to [%14.1](https://gitlab.com/groups/gitlab-org/-/milestones/61) [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_c014964396db97698d59f8ba991eb38ce604efd8 "Monday, June 28, 2021 at 4:30:31 AM EDT")











changed milestone to [%14.1](https://gitlab.com/groups/gitlab-org/-/milestones/61)

- [Arran Walker](https://gitlab.com/ajwalker) mentioned in merge request [!2993 (merged)](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2993 "Fix trace short writes for large log lines") [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613054411 "Monday, June 28, 2021 at 10:01:27 AM EDT")











mentioned in merge request [!2993 (merged)](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2993 "Fix trace short writes for large log lines")

- [Arran Walker](https://gitlab.com/ajwalker) changed title from **Fix trace masking short writes** to **Fix trace short writes when large masks are configured** [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613074067 "Monday, June 28, 2021 at 10:18:44 AM EDT")











changed title from **Fix trace masking short writes** to **Fix trace short writes when large masks are configured**

- [Arran Walker](https://gitlab.com/ajwalker) changed the description [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613074069 "Monday, June 28, 2021 at 10:18:44 AM EDT")Compare with previous version











changed the description

- [Arran Walker](https://gitlab.com/ajwalker) added 16 commits [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613079881 "Monday, June 28, 2021 at 10:22:13 AM EDT")











added 16 commits



  - [7ba4f44b...c561e4f9](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/7ba4f44bd94be6477bdbb487d38ece4f2fa8e917...c561e4f94a565f10327e56116dda66e27077e416 "") \- 10 commits from branch `main`
  - [a02ec6d9](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=a02ec6d9fe402b2c74cc4888ddfce9ab804e9d27 "Fix trace masking safe-token use") \- Fix trace masking safe-token use
  - [f4f39aaf](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=f4f39aaf5e4e476c808a9dc9680a1c293b313afc "Fix trace masking on large writes") \- Fix trace masking on large writes
  - [87c79f1e](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=87c79f1eb9101c4d5252c3a087c8ae67eca4b879 "Order masked values by length to prevent longer values being partially revealed") \- Order masked values by length to prevent longer values being partially revealed
  - [0acddb69](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=0acddb69a054a69c93e0345065e8caf8ee9563d6 "Deduplicate masked secrets to prevent additional trace transformers") \- Deduplicate masked secrets to prevent additional trace transformers
  - [946308a5](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=946308a5cd0f99dbf21d0270be23f6940ca5ddfe "Improve trace fuzz testing") \- Improve trace fuzz testing
  - [8e5db817](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=8e5db8175425436bcc4d9f87036dda2335e191c1 "Limit trace masks length") \- Limit trace masks length

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207158049&start_sha=7ba4f44bd94be6477bdbb487d38ece4f2fa8e917)

Toggle commit list

- [Arran Walker](https://gitlab.com/ajwalker) changed target branch from `main` to `ajwalker/trace-short-writes` [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613080647 "Monday, June 28, 2021 at 10:22:48 AM EDT")











changed target branch from `main` to `ajwalker/trace-short-writes`

- [Arran Walker](https://gitlab.com/ajwalker) added 5 commits [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613393848 "Monday, June 28, 2021 at 4:26:12 PM EDT")











added 5 commits



  - [8e5db817...622667b3](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/8e5db8175425436bcc4d9f87036dda2335e191c1...622667b395061dc4eed454e8270609f9220be41e) \- 4 commits from branch `ajwalker/trace-short-writes`
  - [7a482504](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=7a482504fe744cf331f6594d6dfecfcb9017ae4b "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207352753&start_sha=8e5db8175425436bcc4d9f87036dda2335e191c1)

- [Arran Walker](https://gitlab.com/ajwalker) added 5 commits [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_613595290 "Monday, June 28, 2021 at 7:08:01 PM EDT")











added 5 commits



  - [7a482504...3e7e5790](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/7a482504fe744cf331f6594d6dfecfcb9017ae4b...3e7e5790113c6e0c8ecf252f415229ce76e0d0a8 "") \- 4 commits from branch `ajwalker/trace-short-writes`
  - [e6a14c51](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=e6a14c51d8c28c28dc580be59655a063bed7f545 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207400237&start_sha=7a482504fe744cf331f6594d6dfecfcb9017ae4b)

- [🤖 GitLab Bot 🤖](https://gitlab.com/gitlab-bot) added [regression](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=regression "Issues with this label are regressions from the previous non-patch release") label [Jun 28, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_20d32f815afa45d25bf46a5915e263da7ab955b0 "Monday, June 28, 2021 at 8:02:10 PM EDT")











added [regression](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests?label_name=regression "Issues with this label are regressions from the previous non-patch release") label

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)







[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)[Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614240244 "Tuesday, June 29, 2021 at 8:34:37 AM EDT")






Developer





More actions












  - Copy link
    - Report abuse

[@ajwalker](https://gitlab.com/ajwalker "Arran Walker") could you please rebase this branch?

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=220107941#75cdc128bd9926b1feafcdc49f77e690911f7ac3_26_49) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360306 "Tuesday, June 29, 2021 at 10:05:01 AM EDT")






Resolved


Jun 29, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     2 replies
      Last reply by [Arran Walker](https://gitlab.com/ajwalker) Jun 29, 2021

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207832455#75cdc128bd9926b1feafcdc49f77e690911f7ac3_28_52) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360316 "Tuesday, June 29, 2021 at 10:05:02 AM EDT")






Resolved


Jun 29, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     1 reply
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Jun 29, 2021

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207832455#75cdc128bd9926b1feafcdc49f77e690911f7ac3_28_54) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360322 "Tuesday, June 29, 2021 at 10:05:02 AM EDT")






Resolved


Jun 29, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     1 reply
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Jun 29, 2021

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207832455#75cdc128bd9926b1feafcdc49f77e690911f7ac3_28_55) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360327 "Tuesday, June 29, 2021 at 10:05:02 AM EDT")






Resolved


Jun 29, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     1 reply
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Jun 29, 2021

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207832455#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_88_99) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360336 "Tuesday, June 29, 2021 at 10:05:03 AM EDT")






Resolved


Jun 29, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     1 reply
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Jun 29, 2021

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207832455#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_88_115) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360345 "Tuesday, June 29, 2021 at 10:05:03 AM EDT")






Resolved


Jun 29, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     1 reply
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Jun 29, 2021

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





[Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_128_218) [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614360350 "Tuesday, June 29, 2021 at 10:05:03 AM EDT")






Resolved


Jun 29, 2021 by [Pedro Pombeiro](https://gitlab.com/pedropombeiro)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     2 replies
      Last reply by [Arran Walker](https://gitlab.com/ajwalker) Jun 29, 2021

- [Arran Walker](https://gitlab.com/ajwalker) added 6 commits [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614377659 "Tuesday, June 29, 2021 at 10:19:27 AM EDT")











added 6 commits



  - [e6a14c51...59174d95](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/e6a14c51d8c28c28dc580be59655a063bed7f545...59174d95b1ea23c378432db91b8a0b0cef01346b "") \- 5 commits from branch `ajwalker/trace-short-writes`
  - [3683d67c](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=3683d67c378e912817dcd417b1569b70373cc13d "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207832455&start_sha=e6a14c51d8c28c28dc580be59655a063bed7f545)

- [Arran Walker](https://gitlab.com/ajwalker) added 1 commit [Jun 29, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614402649 "Tuesday, June 29, 2021 at 10:40:13 AM EDT")











added 1 commit



  - [324a69a6](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=324a69a63c543cd59d0aed21dacf9d64d6cf5601 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=207849801&start_sha=3683d67c378e912817dcd417b1569b70373cc13d)

- [Kenneth Chu](https://gitlab.com/kenneth) mentioned in issue [#28001 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28001 "Docker jobs fail with exit code 137") [Jun 30, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_614850420 "Wednesday, June 30, 2021 at 12:53:22 AM EDT")











mentioned in issue [#28001 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28001 "Docker jobs fail with exit code 137")

- [Arran Walker](https://gitlab.com/ajwalker) changed the description [Jun 30, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_615328140 "Wednesday, June 30, 2021 at 9:18:32 AM EDT")Compare with previous version











changed the description

- [Arran Walker](https://gitlab.com/ajwalker) mentioned in issue [#27972 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/work_items/27972 "14.1 Runner team iteration plan") [Jun 30, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_615350310 "Wednesday, June 30, 2021 at 9:37:06 AM EDT")











mentioned in issue [#27972 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/work_items/27972 "14.1 Runner team iteration plan")

- [Arran Walker](https://gitlab.com/ajwalker) added 30 commits [Jul 2, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_617333454 "Friday, July 2, 2021 at 5:44:33 AM EDT")











added 30 commits



  - [324a69a6...7503b778](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/324a69a63c543cd59d0aed21dacf9d64d6cf5601...7503b7789a9778c0580d8ba4e3b7cf925f3503f5) \- 29 commits from branch `ajwalker/trace-short-writes`
  - [3cc9debd](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=3cc9debdf78104ca6bb71dfa95e502607e22179a "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=209592312&start_sha=324a69a63c543cd59d0aed21dacf9d64d6cf5601)

- [Arran Walker](https://gitlab.com/ajwalker) added 1 commit [Jul 2, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_617441234 "Friday, July 2, 2021 at 7:39:06 AM EDT")











added 1 commit



  - [b4f021b8](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=b4f021b8cd1ddf5da54ed6fbcbdc874e61029d04 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=209662253&start_sha=3cc9debdf78104ca6bb71dfa95e502607e22179a)

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)







[Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)[Jul 2, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_617548265 "Friday, July 2, 2021 at 9:37:57 AM EDT")






Contributor





More actions












  - Copy link
    - Report abuse

## Manual QA

1. Use the following `.gitlab-ci.yml`
      .gitlab-ci.yml



     ```yaml
     job:
       image: alpine:3.13
       before_script:
    - apk add --no-cache bash
    - chmod +x ./mask.sh
script:
    - echo SECRETSECRET世界
    - echo ${TEST1}
    - echo ${TEST2}
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
    - echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME
```

  2. Inside of `Settings > CI/CD > Variables define the following [variables](/uploads/e04b3199cbd807272ea2d4c8ef718a6f/Screenshot_2021-07-02_at_15.33.46.png),`MASK\_ME`has a value of`8194\` bytes
      mask\_me value



     ```plaintext
     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
     ```

  3. Run `docker-machine` executor on GCP so we run as production like as possible and have full network hops between machines (gives you a higher chance of failure)
      config.toml



     ```toml
     concurrent = 1
     check_interval = 0

     [session_server]
       session_timeout = 1800

     [[runners]]
       name = "steveazz-runners-manager-1"
       url = "https://gitlab.com/"
       executor = "docker+machine"
       [runners.docker]
         tls_verify = false
         image = "alpine:3.14"
         privileged = false
         disable_entrypoint_overwrite = false
         oom_kill_disable = false
         disable_cache = false
         volumes = ["/cache"]
         shm_size = 0
       [runners.machine]
         IdleCount = 0
         MachineDriver = "google"
         MachineName = "steveazz-%s"
         MachineOptions = [\
           "google-project=group-verify-df9383",\
           "google-zone=europe-west4-b"\
       ]
     ```


  - `v13.11.0` [https://gitlab.com/steveazz/playground/-/jobs/1395514037](https://gitlab.com/steveazz/playground/-/jobs/1395514037): Partial secret leaked and not full trace shown
  - `main` [https://gitlab.com/steveazz/playground/-/jobs/1395535594](https://gitlab.com/steveazz/playground/-/jobs/1395535594): Fails with `ERROR: Job failed: exit code 137`
  - `ajwalker/trace-short-writes` [https://gitlab.com/steveazz/playground/-/jobs/1395549143](https://gitlab.com/steveazz/playground/-/jobs/1395549143): Fails with `ERROR: Job failed: exit code 137`
  - `ajwalker/fix-trace-safe-token`: [https://gitlab.com/steveazz/playground/-/jobs/1395564964](https://gitlab.com/steveazz/playground/-/jobs/1395564964) everything get's masked and job succeeds

Edited


Jul 2, 2021 by [Steve Xuereb](https://gitlab.com/sxuereb)

- [Arran Walker](https://gitlab.com/ajwalker) deleted the `ajwalker/trace-short-writes` branch. This merge request now targets the `main` branch [Jul 2, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_617560059 "Friday, July 2, 2021 at 9:50:21 AM EDT")











  deleted the `ajwalker/trace-short-writes` branch. This merge request now targets the `main` branch

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)







  [Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)[Jul 2, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_617609243 "Friday, July 2, 2021 at 10:42:02 AM EDT")






  Developer





  More actions












  - Copy link
    - Report abuse

[@ajwalker](https://gitlab.com/ajwalker "Arran Walker") can you please rebase on main?

- [Pedro Pombeiro](https://gitlab.com/pedropombeiro) removed review request for [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") [Jul 2, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_617609250 "Friday, July 2, 2021 at 10:42:03 AM EDT")











  removed review request for [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro")

- [Arran Walker](https://gitlab.com/ajwalker) added 20 commits [Jul 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_618243440 "Sunday, July 4, 2021 at 5:19:23 PM EDT")











  added 20 commits



  - [b4f021b8...a8b5db0f](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/b4f021b8cd1ddf5da54ed6fbcbdc874e61029d04...a8b5db0f8b7095135ab02df24393cef8835a6d4e) \- 19 commits from branch `main`
  - [c704dfd7](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=c704dfd70741eefea9525698eb3bfbae2cb68ed0 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=210128832&start_sha=b4f021b8cd1ddf5da54ed6fbcbdc874e61029d04)

- [Arran Walker](https://gitlab.com/ajwalker) changed milestone to [%14.2](https://gitlab.com/groups/gitlab-org/-/milestones/62) [Jul 8, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_f7e6d7ade29546f6c4260f6af15d223218496647 "Thursday, July 8, 2021 at 11:47:11 AM EDT")











  changed milestone to [%14.2](https://gitlab.com/groups/gitlab-org/-/milestones/62)

- [Elliot Rushton](https://gitlab.com/erushton) mentioned in issue [#27994 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27994 "14.2 Runner team iteration plan") [Jul 9, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_623024857 "Friday, July 9, 2021 at 9:03:46 PM EDT")











  mentioned in issue [#27994 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27994 "14.2 Runner team iteration plan")

- [Arran Walker](https://gitlab.com/ajwalker) added 84 commits [Jul 26, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_635037986 "Monday, July 26, 2021 at 2:56:18 AM EDT")











  added 84 commits



  - [c704dfd7...f45efd19](https://gitlab.com/gitlab-org/gitlab-runner/-/compare/c704dfd70741eefea9525698eb3bfbae2cb68ed0...f45efd192a977e25bc14f8faccef1042261f1fc4) \- 83 commits from branch `main`
  - [9a809cd0](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=9a809cd0517b186a92a51762598dc68e7d7cef00 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=220107941&start_sha=c704dfd70741eefea9525698eb3bfbae2cb68ed0)

- [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







  [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Aug 3, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_641878251 "Tuesday, August 3, 2021 at 7:43:42 AM EDT")






  Author

  Maintainer





  More actions












  - Copy link
    - Report abuse

[@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") @steveazz Are you able to review this again?

Not much changed here, but it does now also bring in some fixes that were made in another MR that has since been merged to `main`.

There's one report that this might still have a problem where it overly masks data (replacing random characters really frequently with `[MASKED]`, but I've run several jobs and am not seeing this. [#27964 (comment 640910058)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/27964#note_640910058 "Log masking crashes on long data")

If we don't spot any problem, @steveazz thinks it might be possible that we merge this and then have it run on a private pool of runners, so that it's tested over a wider range of jobs.

- [Arran Walker](https://gitlab.com/ajwalker) requested review from [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") and @steveazz [Aug 3, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_641878259 "Tuesday, August 3, 2021 at 7:43:42 AM EDT")











  requested review from [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") and @steveazz

- - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)







      [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)[Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_642598989 "Wednesday, August 4, 2021 at 2:28:00 AM EDT")






      Contributor





      More actions












    - Copy link
      - Report abuse

Resolved


Aug 4, 2021 by [Arran Walker](https://gitlab.com/ajwalker)

**question:** Looking at the last [fuzzer run](https://gitlab.com/gitlab-org/gitlab-runner/-/jobs/1451278268) it seems like we have a panic, is that something we should be concerned about, it seems like we have a crash for a specific type of input

  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



     2 replies
      Last reply by [Steve Xuereb](https://gitlab.com/sxuereb) Aug 4, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=220107941#75cdc128bd9926b1feafcdc49f77e690911f7ac3_17_19) [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_642736387 "Wednesday, August 4, 2021 at 4:52:16 AM EDT")






  Resolved


  Aug 4, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



     1 reply
      Last reply by [Steve Xuereb](https://gitlab.com/sxuereb) Aug 4, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=220107941#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_229_270) [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_642736391 "Wednesday, August 4, 2021 at 4:52:16 AM EDT")






  Resolved


  Aug 5, 2021 by [Steve Xuereb](https://gitlab.com/sxuereb)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     2 replies
      Last reply by [Arran Walker](https://gitlab.com/ajwalker) Aug 4, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=220107941#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_229_285) [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_642736394 "Wednesday, August 4, 2021 at 4:52:17 AM EDT")






  Resolved


  Aug 5, 2021 by [Steve Xuereb](https://gitlab.com/sxuereb)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     2 replies
      Last reply by [Arran Walker](https://gitlab.com/ajwalker) Aug 4, 2021

- [Steve Xuereb](https://gitlab.com/sxuereb) removed review request for @steveazz [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_642909543 "Wednesday, August 4, 2021 at 7:12:43 AM EDT")











  removed review request for @steveazz

- [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)





  [Pedro Pombeiro](https://gitlab.com/pedropombeiro)[@pedropombeiro](https://gitlab.com/pedropombeiro)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=220107941#75cdc128bd9926b1feafcdc49f77e690911f7ac3_28_55) [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643028514 "Wednesday, August 4, 2021 at 8:48:59 AM EDT")






  Resolved


  Aug 4, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     1 reply
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Aug 4, 2021

- [Arran Walker](https://gitlab.com/ajwalker) added 1 commit [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643353799 "Wednesday, August 4, 2021 at 1:38:47 PM EDT")











  added 1 commit



  - [4920069f](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=4920069f4e4d541889717a66a98622687bbe8882 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=225093155&start_sha=9a809cd0517b186a92a51762598dc68e7d7cef00)

- [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







  [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643415850 "Wednesday, August 4, 2021 at 3:21:20 PM EDT")






  Author

  Maintainer





  More actions












  - Copy link
    - Report abuse

@steveazz [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") I've now fixed the problems we were encountering, and moved some of the logic to a function called "find". This function has it's own tests and was key to solving the problem.

You'll want to review both `find` and `Transform` again.

The biggest issue before was that we were only ever looking for a full match or immediately requesting new data until we had enough to satisfy that the phrase couldn't be found.

This logic works well if you assume that the internal buffer can grow to accomodate, but when it can't, we need to ensure that we're still processing input data if the secret cannot possible be found or at least process up to the partial amount.

The new `find` function does just this, and I think the test cases help provide the understanding of what's happening here. You'll notice that some of the other tests have had to be modified, as it's no longer just a case of the result being the input minus the length of the phrase. We're now processing more data when we can.

This passes all existing tests and I've been running the fuzzer for an hour without problem, but have yet to perform a manual QA. I'm out tomorrow, so if you're able to put this code through its paces I'd greatly appreciate it!

- [Arran Walker](https://gitlab.com/ajwalker) requested review from @steveazz [Aug 4, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643415852 "Wednesday, August 4, 2021 at 3:21:20 PM EDT")











  requested review from @steveazz

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=225093155#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_229_347) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715084 "Thursday, August 5, 2021 at 3:40:58 AM EDT")






  Resolved


  Aug 9, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



     1 reply
      Last reply by [Steve Xuereb](https://gitlab.com/sxuereb) Aug 5, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_89_101) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715092 "Thursday, August 5, 2021 at 3:40:59 AM EDT")






  Resolved


  Aug 6, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



    [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



     2 replies
      Last reply by [Pedro Pombeiro](https://gitlab.com/pedropombeiro) Aug 5, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs#ecf32d50ea3c37bfcf9a56dff22e3a0fdfcee53a_89_119) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715095 "Thursday, August 5, 2021 at 3:40:59 AM EDT")






  Resolved


  Aug 6, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     2 replies
      Last reply by [Arran Walker](https://gitlab.com/ajwalker) Aug 6, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs#75cdc128bd9926b1feafcdc49f77e690911f7ac3_17_21) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715098 "Thursday, August 5, 2021 at 3:40:59 AM EDT")






  Resolved


  Aug 6, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     2 replies
      Last reply by [Arran Walker](https://gitlab.com/ajwalker) Aug 6, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=225093155#75cdc128bd9926b1feafcdc49f77e690911f7ac3_30_42) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715101 "Thursday, August 5, 2021 at 3:40:59 AM EDT")






  Resolved


  Aug 9, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



     1 reply
      Last reply by [Steve Xuereb](https://gitlab.com/sxuereb) Aug 5, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [an old version of the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=225093155#75cdc128bd9926b1feafcdc49f77e690911f7ac3_44_69) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715104 "Thursday, August 5, 2021 at 3:40:59 AM EDT")






  Resolved


  Aug 9, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



     1 reply
      Last reply by [Steve Xuereb](https://gitlab.com/sxuereb) Aug 5, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)





  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)started a thread on [the diff](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs#75cdc128bd9926b1feafcdc49f77e690911f7ac3_17_21) [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715107 "Thursday, August 5, 2021 at 3:41:00 AM EDT")






  Resolved


  Aug 9, 2021 by [Arran Walker](https://gitlab.com/ajwalker)



  - [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)



    [![Pedro Pombeiro](https://gitlab.com/uploads/-/system/user/avatar/1388762/avatar.png?v=1790678855)](https://gitlab.com/pedropombeiro)



    [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)



     4 replies
      Last reply by [Steve Xuereb](https://gitlab.com/sxuereb) Aug 6, 2021

- [![Steve Xuereb](https://secure.gravatar.com/avatar/f40386e7df2990f0a367b0b8894db855a5e4f2df3ef71f5422010d98c4f657bf?s=80&d=identicon)](https://gitlab.com/sxuereb)







  [Steve Xuereb](https://gitlab.com/sxuereb)[@sxuereb](https://gitlab.com/sxuereb)[Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643716761 "Thursday, August 5, 2021 at 3:42:53 AM EDT")






  Contributor





  More actions












  - Copy link
    - Report abuse

Thank you [@ajwalker](https://gitlab.com/ajwalker "Arran Walker") for yet another iteration on this! I think my biggest comment would be [!2979 (comment 643715107)](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643715107 "Fix trace short writes when large masks are configured") where I'm suggesting to chunk the secrets, I'm not sure if it's good idea or it's a terrible one would love to know your thoughts 🙇

I've run the Fuzzer for 10 minutes and didn't find any issues, I'll run a machine overnight to see if it can find any issues.

- [Steve Xuereb](https://gitlab.com/sxuereb) removed review request for @steveazz [Aug 5, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_643716865 "Thursday, August 5, 2021 at 3:42:59 AM EDT")











  removed review request for @steveazz

- [Arran Walker](https://gitlab.com/ajwalker) added 1 commit [Aug 6, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_645254573 "Friday, August 6, 2021 at 12:08:46 PM EDT")











  added 1 commit



  - [ab92d4a2](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?commit_id=ab92d4a2f3144aa5d5bb5807b30646b6d4f56f32 "Lessen chance of partial reveal of trace masks") \- Lessen chance of partial reveal of trace masks

[Compare with previous version](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979/diffs?diff_id=226289818&start_sha=4920069f4e4d541889717a66a98622687bbe8882)

- [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)







  [Arran Walker](https://gitlab.com/ajwalker)[@ajwalker](https://gitlab.com/ajwalker)[Aug 9, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_646459608 "Monday, August 9, 2021 at 7:58:50 AM EDT")






  Author

  Maintainer





  More actions












  - Copy link
    - Report abuse

[@ggeorgiev\_gitlab](https://gitlab.com/ggeorgiev_gitlab "Georgi N. Georgiev") Would you be able to do mostly just a manual QA of this? This was reviewed by @steveazz but we run out of time so another manual QA wasn't performed.

- [Arran Walker](https://gitlab.com/ajwalker) requested review from [@ggeorgiev\_gitlab](https://gitlab.com/ggeorgiev_gitlab "Georgi N. Georgiev | GitLab") and removed review request for [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro") [Aug 9, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_646459623 "Monday, August 9, 2021 at 7:58:51 AM EDT")











  requested review from [@ggeorgiev\_gitlab](https://gitlab.com/ggeorgiev_gitlab "Georgi N. Georgiev | GitLab") and removed review request for [@pedropombeiro](https://gitlab.com/pedropombeiro "Pedro Pombeiro")

- - [![Georgi N. Georgiev | GitLab](https://secure.gravatar.com/avatar/d2189187f4fef769508fc45200db57168431557e367631fbbeee519edfce0c37?s=80&d=identicon)](https://gitlab.com/ggeorgiev_gitlab)







      [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab)[@ggeorgiev\_gitlab](https://gitlab.com/ggeorgiev_gitlab)[Aug 9, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_646859937 "Monday, August 9, 2021 at 2:23:38 PM EDT")






      Maintainer





      More actions












    - Copy link
      - Report abuse

Resolved


Aug 16, 2021 by [Steve Xuereb](https://gitlab.com/sxuereb)

[@ajwalker](https://gitlab.com/ajwalker "Arran Walker") I did a manual QA with Kubernetes and Docker Machine on GCP. I see different output on both. Do you know why that is and if it's expected?

Look at the last lines of the job output: `[MASKED]n[MASKED]n` vs `[MASKED]`

```plaintext
[0KRunning with gitlab-runner development version (HEAD)[0;m\
[0K  on gcp-docker-machine zz-znFrz[0;m\
section_start:1628533097:prepare_executor\
[0K[0K[36;1mPreparing the "docker+machine" executor[0;m[0;m\
[0KUsing Docker executor with image alpine:3.13 ...[0;m\
[0KAuthenticating with credentials from /Users/georgin.georgiev/.docker/config.json[0;m\
[0KPulling docker image alpine:3.13 ...[0;m\
[0KUsing docker image sha256:6dbb9cc54074106d46d4ccb330f2a40a682d49dda5f4844962b7dce9fe44aaec for alpine:3.13 with digest alpine@sha256:1d30d1ba3cb90962067e9b29491fbd56997979d54376f23f01448b5c5cd8b462 ...[0;m\
section_end:1628533242:prepare_executor\
[0Ksection_start:1628533242:prepare_script\
[0K[0K[36;1mPreparing environment[0;m[0;m\
Running on runner-zz-znfrz-project-15339497-concurrent-0 via runner-zz-znfrz-ggeorgiev-1628533097-7c701d80...\
section_end:1628533244:prepare_script\
[0Ksection_start:1628533244:get_sources\
[0K[0K[36;1mGetting source from Git repository[0;m[0;m\
[32;1mFetching changes with git depth set to 50...[0;m\
hint: Using 'master' as the name for the initial branch. This default branch name\
hint: is subject to change. To configure the initial branch name to use in all\
hint: of your new repositories, which will suppress this warning, call:\
hint:\
hint: 	git config --global init.defaultBranch <name>\
hint:\
hint: Names commonly chosen instead of 'master' are 'main', 'trunk' and\
hint: 'development'. The just-created branch can be renamed via this command:\
hint:\
hint: 	git branch -m <name>\
Initialized empty Git repository in /builds/ggeorgiev_gitlab/playground/.git/\
[32;1mCreated fresh repository.[0;m\
[32;1mChecking out 53e7b5bb as master...[0;m\
\
[32;1mSkipping Git submodules setup[0;m\
section_end:1628533246:get_sources\
[0Ksection_start:1628533246:step_script\
[0K[0K[36;1mExecuting "step_script" stage of the job script[0;m[0;m\
[0KUsing docker image sha256:6dbb9cc54074106d46d4ccb330f2a40a682d49dda5f4844962b7dce9fe44aaec for alpine:3.13 with digest alpine@sha256:1d30d1ba3cb90962067e9b29491fbd56997979d54376f23f01448b5c5cd8b462 ...[0;m\
[32;1m$ apk add --no-cache bash[0;m\
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/main/x86_64/APKINDEX.tar.gz\
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/community/x86_64/APKINDEX.tar.gz\
(1/4) Installing ncurses-terminfo-base (6.2_p20210109-r0)\
(2/4) Installing ncurses-libs (6.2_p20210109-r0)\
(3/4) Installing readline (8.1.0-r0)\
(4/4) Installing bash (5.1.0-r0)\
Executing bash-5.1.0-r0.post-install\
Executing busybox-1.32.1-r6.trigger\
OK: 8 MiB in 18 packages\
[32;1m$ echo SECRETSECRET世界[0;m\
SECRETSECRET世界\
[32;1m$ echo ${TEST1}[0;m\
\
[32;1m$ echo ${TEST2}[0;m\
\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]n[MASKED]n\
[MASKED]\
section_end:1628533249:step_script\
[0Ksection_start:1628533249:cleanup_file_variables\
[0K[0K[36;1mCleaning up file based variables[0;m[0;m\
section_end:1628533250:cleanup_file_variables\
[0K[32;1mJob succeeded[0;m\
```\
\
```plaintext\
[0KRunning with gitlab-runner development version (HEAD)[0;m\
[0K  on k8s-local nyvMpe1N[0;m\
section_start:1628532812:prepare_executor\
[0K[0K[36;1mPreparing the "kubernetes" executor[0;m[0;m\
[0;33mWARNING: Namespace is empty, therefore assuming 'default'.[0;m\
[0KUsing Kubernetes namespace: default[0;m\
[0KUsing Kubernetes executor with image alpine:3.13 ...[0;m\
[0KUsing attach strategy to execute scripts...[0;m\
section_end:1628532813:prepare_executor\
[0Ksection_start:1628532813:prepare_script\
[0K[0K[36;1mPreparing environment[0;m[0;m\
Waiting for pod default/runner-nyvmpe1n-project-15339497-concurrent-07lgcc to be running, status is Pending\
Waiting for pod default/runner-nyvmpe1n-project-15339497-concurrent-07lgcc to be running, status is Pending\
	ContainersNotReady: "containers with unready status: [build helper]"\
	ContainersNotReady: "containers with unready status: [build helper]"\
Running on runner-nyvmpe1n-project-15339497-concurrent-07lgcc via Georgis-MacBook-Pro-2.local...\
section_end:1628532819:prepare_script\
[0Ksection_start:1628532819:get_sources\
[0K[0K[36;1mGetting source from Git repository[0;m[0;m\
[32;1mFetching changes with git depth set to 50...[0;m\
Initialized empty Git repository in /builds/nyvMpe1N/0/ggeorgiev_gitlab/playground/.git/\
[32;1mCreated fresh repository.[0;m\
[32;1mChecking out b6b25264 as master...[0;m\
\
[32;1mSkipping Git submodules setup[0;m\
section_end:1628532820:get_sources\
[0Ksection_start:1628532820:step_script\
[0K[0K[36;1mExecuting "step_script" stage of the job script[0;m[0;m\
[32;1m$ apk add --no-cache bash[0;m\
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/main/x86_64/APKINDEX.tar.gz\
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/community/x86_64/APKINDEX.tar.gz\
(1/4) Installing ncurses-terminfo-base (6.2_p20210109-r0)\
(2/4) Installing ncurses-libs (6.2_p20210109-r0)\
(3/4) Installing readline (8.1.0-r0)\
(4/4) Installing bash (5.1.0-r0)\
Executing bash-5.1.0-r0.post-install\
Executing busybox-1.32.1-r6.trigger\
OK: 8 MiB in 18 packages\
[32;1m$ echo SECRETSECRETä¸–ç•Œ[0;m\
SECRETSECRETä¸–ç•Œ\
[32;1m$ echo ${TEST1}[0;m\
\
[32;1m$ echo ${TEST2}[0;m\
\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[32;1m$ echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME; echo $MASK_ME[0;m\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
[MASKED]\
section_end:1628532822:step_script\
[0Ksection_start:1628532822:cleanup_file_variables\
[0K[0K[36;1mCleaning up file based variables[0;m[0;m\
section_end:1628532823:cleanup_file_variables\
[0K[32;1mJob succeeded[0;m\
```\
\
  - [![Arran Walker](https://secure.gravatar.com/avatar/0b8a97827aa56598d80402f5e9fc925e7f824f4bf73538426c32bcf004bb4a06?s=80&d=identicon)](https://gitlab.com/ajwalker)\
\
\
\
    [![Georgi N. Georgiev | GitLab](https://secure.gravatar.com/avatar/d2189187f4fef769508fc45200db57168431557e367631fbbeee519edfce0c37?s=80&d=identicon)](https://gitlab.com/ggeorgiev_gitlab)\
\
\
\
     6 replies\
      Last reply by [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) Aug 10, 2021\
\
- [Arran Walker](https://gitlab.com/ajwalker) mentioned in issue [#28128 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28128 "Continuous masking of masked variables above 4KiB") [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647176601 "Tuesday, August 10, 2021 at 3:05:41 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  mentioned in issue [#28128 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28128 "Continuous masking of masked variables above 4KiB")\
\
- [Arran Walker](https://gitlab.com/ajwalker) mentioned in merge request [gitlab!67829 (merged)](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/67829 "Add warning about Runner's potential masked variable reveal") [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647184868 "Tuesday, August 10, 2021 at 3:16:28 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  mentioned in merge request [gitlab!67829 (merged)](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/67829 "Add warning about Runner's potential masked variable reveal")\
\
- [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) approved this merge request [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647250418 "Tuesday, August 10, 2021 at 4:29:05 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  approved this merge request\
\
- [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) started a merge train [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647250530 "Tuesday, August 10, 2021 at 4:29:13 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  started a merge train\
\
- [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) removed this merge request from the merge train because pipeline did not succeed [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647320575 "Tuesday, August 10, 2021 at 5:34:28 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  removed this merge request from the merge train because pipeline did not succeed\
\
- [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) started a merge train [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647458967 "Tuesday, August 10, 2021 at 8:06:31 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  started a merge train\
\
- [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) merged [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_577d1da95057e1f7ce5eef9aa8e40d866db85aa4 "Tuesday, August 10, 2021 at 9:28:36 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  merged\
\
- [Georgi N. Georgiev \| GitLab](https://gitlab.com/ggeorgiev_gitlab) mentioned in commit [9054237d](https://gitlab.com/gitlab-org/gitlab-runner/-/commit/9054237de624bbc9764ee6254491ec264ed290b1 "Merge branch 'ajwalker/fix-trace-safe-token' into 'main'") [Aug 10, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_647549987 "Tuesday, August 10, 2021 at 9:28:37 AM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  mentioned in commit [9054237d](https://gitlab.com/gitlab-org/gitlab-runner/-/commit/9054237de624bbc9764ee6254491ec264ed290b1 "Merge branch 'ajwalker/fix-trace-safe-token' into 'main'")\
\
- [Alejandro Guerrero](https://gitlab.com/alejguer) mentioned in issue [#28160 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28160 "Masked variables of more than 4096 characters long may cause job steps to be skipped") [Aug 25, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_661048025 "Wednesday, August 25, 2021 at 4:36:17 PM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  mentioned in issue [#28160 (closed)](https://gitlab.com/gitlab-org/gitlab-runner/-/issues/28160 "Masked variables of more than 4096 characters long may cause job steps to be skipped")\
\
- [Arran Walker](https://gitlab.com/ajwalker) mentioned in issue [gitlab#336715 (closed)](https://gitlab.com/gitlab-org/gitlab/-/issues/336715 "RCA: Large trace log lines can result in short writes (DRAFT)") [Oct 21, 2021](https://gitlab.com/gitlab-org/gitlab-runner/-/merge_requests/2979#note_710943948 "Thursday, October 21, 2021 at 5:13:32 PM EDT")\
\
\
\
\
\
\
\
\
\
\
\
  mentioned in issue [gitlab#336715 (closed)](https://gitlab.com/gitlab-org/gitlab/-/issues/336715 "RCA: Large trace log lines can result in short writes (DRAFT)")\
\
\
Please [register](https://gitlab.com/users/sign_up?redirect_to_referer=yes) or [sign in](https://gitlab.com/users/sign_in?redirect_to_referer=yes) to reply\
\
Loading\
\
Loading\
\
Loading
