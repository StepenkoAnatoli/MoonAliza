# MAP - topic decomposition

## Topic

Masking secrets in streamed output: how GitHub Actions and GitLab Runner mask a secret split across chunks, and which encodings they also mask

## Subtopics

Statuses are blank on purpose: phase 0 gathers material, it does not judge. Mark each
row COVERED (cite the U-## rows that cover it), DISMISSED (reason required - dismissing
is fine, omitting is not), or GAP, and add topic-specific subtopics where the checklist
is not enough.

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01, U-02. Both runners are open source; both vendors document masking |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | DISMISSED | the secrets are MoonAliza vault entries; nothing new is authenticated |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | masking runs locally, with no service in the loop |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | DISMISSED | the design is copied from public source and docs, not their code |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-02, U-03. What forms of a secret are masked, and which are refused |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-01. GitLab changed its masker in v13.12.0; the MR records why |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | COVERED | U-04. The cost is held-back latency, bounded by the longest secret |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-04. A bounded buffer, as GitLab bounds it, for a desktop renderer |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01. A proven design exists to copy, with its known edge |

## Coverage notes (per dimension)

_One short paragraph per row once it has a status: what was established, and what the
status rests on._

## Candidate material

Gathered 2026-09-29.

Likely owners of these facts (by how often a search pointed at them):

- `youtube.com` (2)
- `github.com/orgs` (2)
- `blog.stephane-robert.info` (2)
- `nv5geospatialsoftware.com` (2)
- `tutorials.akeyless.io` (2)
- `oneuptime.com` (1)

Candidate pages:

- [How to Use Secrets in GitHub Actions Workflows](https://oneuptime.com/blog/post/2025-12-20-github-actions-secrets/view)
- [Part 4 | Masked Attention and Positional Encoding](https://www.youtube.com/watch?v=5JfnnzUfqg8)
- [GitLab CI/CD vs GitHub Actions for Secrets Management - Infisical](https://infisical.com/blog/gitlab-ci-cd-vs-github-actions-for-secrets-management)
- [Mask encoding: A general instance mask representation for object ...](https://www.sciencedirect.com/science/article/abs/pii/S0031320321006816)
- [Managing Secrets Safely in GitHub Actions | by TheVega.AI](https://medium.com/@TheVega.ai/managing-secrets-safely-in-github-actions-f945ae00b288)
- [Hashing vs Encryption vs Masking vs Salting vs Encoding](https://ammune.ai/blog/hashing-vs-encryption-vs-masking-vs-salting-vs-encoding-and-decoding)
- [Support for sharing secrets between jobs · community · Discussion #13082](https://github.com/orgs/community/discussions/13082)
- [Byte Order Mask: confusing the UTF encoding - Stack Overflow](https://stackoverflow.com/questions/49723890/byte-order-mask-confusing-the-utf-encoding)
- [Secure Secrets Management in CI/CD Pipelines ...](https://sachinnimbalkar.com/secure-secrets-management-in-ci-cd-pipelines-best-practices-with-github-actions-gitlab-and-jenkins/)
- [MDLMPE: Distribution Aware Positional Encoding for ...](https://arxiv.org/html/2608.03769v1)
- [GitHub Actions - Masking Variables and Secrets - YouTube](https://www.youtube.com/watch?v=p7aOmRJ0qcY)
- [Masks for Multiple Language Charsets in UTF-8 - Hashcat](https://hashcat.net/forum/thread-7656-post-41140.html)
- [GitHub Actions secrets and configuration](https://blog.stephane-robert.info/en/docs/pipeline-cicd/github/fondations/secrets/)
- [Character Encoding](https://www.nv5geospatialsoftware.com/docs/Character_Encoding.html)
- [The Hidden Risks of GitHub/GitLab Runners Nobody Talks About](https://medium.com/@DynamoDevOps/the-hidden-risks-of-github-gitlab-runners-nobody-talks-about-d79dd4457988)
- [Behind RoPE: How Does Causal Mask Encode Positional Information?](https://openreview.net/forum?id=IAXBLI2vo5)
- [Managing Secrets in Github Pipelines](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines)
- [MRC encoding using 2 JPX and 1 JBIG2 mask/image #685](https://github.com/pymupdf/PyMuPDF/issues/685)
- [How to pass masked secrets between steps and jobs in Github Actions](https://github.com/orgs/community/discussions/25225)
- [An Introduction to Bitmask Representations and Encodings](https://datature.io/blog/an-introduction-to-bitmask-representations-and-encodings-rle-vs-ree)

## Outlines seen in the material

The section headings of the gathered pages that are captured - what related material
covers, as its own tables of contents say (STORM's perspective step, without the model).
Not a verdict: a heading worth a subtopic becomes a row by your hand.

- [Support for sharing secrets between jobs · community · Discussion #13082](https://github.com/orgs/community/discussions/13082)
  - \ danielmarbach on Mar 20, 2022Mar 20, 2022
  - Replies: 13 comments · 21 replies
  - \ ethomson on Mar 31, 2022Mar 31, 2022
  - This comment was marked as off-topic.
  - \ KevinMSampson on May 18, 2022May 19, 2022
  - \ mike-kaminski on May 20, 2022May 21, 2022
  - \ jnahmias on Aug 18, 2022Aug 18, 2022
  - \ JeffreyArt1 on Sep 22, 2022Sep 22, 2022
  - \ danielmarbach on Sep 22, 2022Sep 22, 2022 Author
  - \ jonashartwig on Oct 20, 2022Oct 20, 2022
  - \ rdhar on Aug 21, 2023Aug 21, 2023
  - \ shinebayar-g on Oct 31, 2023Nov 1, 2023
  - _and 3 more_
- [GitHub Actions - Masking Variables and Secrets - YouTube](https://www.youtube.com/watch?v=p7aOmRJ0qcY)
  - Description
  - Transcript
- [GitHub Actions secrets and configuration](https://blog.stephane-robert.info/en/docs/pipeline-cicd/github/fondations/secrets/)
  - Why not put secrets in the code?
  - The classic beginner mistake
  - What actually happens
  - Real attacks
  - The answer: GitHub secrets
  - What is a GitHub secret?
  - How does it protect your data?
  - The flow: from vault to workflow
  - A concrete example
  - How to create a secret
  - How to use a secret
  - Traps to avoid
  - _and 29 more_
- [Managing Secrets in Github Pipelines](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines)
  - Prerequisites Skip link to Prerequisites
  - OAuth 2.0 / JWT Skip link to OAuth 2.0 / JWT
  - Create Auth Method via Web UI Skip link to Create Auth Method via Web UI
  - Create Auth Method via CLI Skip link to Create Auth Method via CLI
  - Access Role Skip link to Access Role
  - Example Usage Skip link to Example Usage
  - What’s Next

