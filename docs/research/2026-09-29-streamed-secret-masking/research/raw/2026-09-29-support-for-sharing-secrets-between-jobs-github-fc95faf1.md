---
url: https://github.com/orgs/community/discussions/13082
retrieved: 2026-09-29
command: firecrawl scrape https://github.com/orgs/community/discussions/13082 --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Support for sharing secrets between jobs · community · Discussion #13082 · GitHub
---
[Skip to content](https://github.com/orgs/community/discussions/13082#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/orgs/community/discussions/13082) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/orgs/community/discussions/13082) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/orgs/community/discussions/13082) to refresh your session.Dismiss alert

{{ message }}

# [![@community](https://avatars.githubusercontent.com/u/93784371?s=60&v=4)\  GitHub Community](https://github.com/community)

# Support for sharing secrets between jobs  \#13082

Unanswered

[danielmarbach](https://github.com/danielmarbach)

asked this question in
[Actions](https://github.com/orgs/community/discussions/categories/actions)

[Support for sharing secrets between jobs](https://github.com/orgs/community/discussions/13082#top)#13082

[![@danielmarbach](https://avatars.githubusercontent.com/u/174258?s=40&v=4)\\
danielmarbach](https://github.com/danielmarbach)

on Mar 20, 2022Mar 20, 2022·
13 comments
·
21 replies


[Return to top](https://github.com/orgs/community/discussions/13082#top)

Discussion options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

## [![](https://avatars.githubusercontent.com/u/174258?s=64&v=4)\ danielmarbach](https://github.com/danielmarbach) [on Mar 20, 2022Mar 20, 2022](https://github.com/orgs/community/discussions/13082\#discussion-3950093)

|     |
| --- |
| [actions/runner#1498 (comment)](https://github.com/actions/runner/issues/1498#issuecomment-1066836352)<br>> To give you some more insights. Normally we would want to do everything we can as part of one job. Yet in this specific case we are setting a server cluster that requires a few nodes to work. That is an expensive operations and we are working against a limited set of resources. By having the setup of the cluster in the same matrix build job we would then setup the cluster per matrix which would quickly lead to resource exhaustion.<br>> <br>> To accomodate that we have created a setup job that creates the cluster. The matrix builds wait for the setup job to be completed. Then there is also a cleanup job that runs after all the matrix builds have run or things have failed. Both the matrix jobs as well as the cleanup need information about how and where to access the cluster in order to be able to connect to it and eventually destroy it again after the run. We want to avoid having this information to be leaked. Hence we were hoping to "just mask the dynamic secrets" and then share them with jobs.<br>> <br>> I can understand though the design and architectural reasons why that is not allowed (or supported). It just means for any such a scenario you are basically forced to reinvent the wheel like we did.<br>> <br>> here is the encryption step we ended up using<br>> <br>> [https://github.com/Particular/NServiceBus.RavenDB/blob/74f4ee2c1ad17327e8da523667a2b9f8aa323df0/.github/workflows/ci.yml#L125-L129](https://github.com/Particular/NServiceBus.RavenDB/blob/74f4ee2c1ad17327e8da523667a2b9f8aa323df0/.github/workflows/ci.yml#L125-L129)<br>> <br>> here the artifact upload<br>> <br>> [https://github.com/Particular/NServiceBus.RavenDB/blob/74f4ee2c1ad17327e8da523667a2b9f8aa323df0/.github/workflows/ci.yml#L130-L137](https://github.com/Particular/NServiceBus.RavenDB/blob/74f4ee2c1ad17327e8da523667a2b9f8aa323df0/.github/workflows/ci.yml#L130-L137)<br>> <br>> then the explicit download, decrypt steps<br>> <br>> [https://github.com/Particular/NServiceBus.RavenDB/blob/74f4ee2c1ad17327e8da523667a2b9f8aa323df0/.github/workflows/ci.yml#L168-L184](https://github.com/Particular/NServiceBus.RavenDB/blob/74f4ee2c1ad17327e8da523667a2b9f8aa323df0/.github/workflows/ci.yml#L168-L184) |

84You must be logged in to vote

❤️22

All reactions

- ❤️22

## Replies:   13 comments  ·  21 replies

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/1130014?s=64&v=4)\ ethomson](https://github.com/ethomson) [on Mar 31, 2022Mar 31, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-2478837)

|     |
| --- |
| Thanks [@danielmarbach](https://github.com/danielmarbach). I appreciate the helpful example - this isn't something that we support today but your use case makes a lot of sense and is something that we'll consider in the future. I've added this to the backlog.<br>Thanks again for the helpful feedback. |

6You must be logged in to vote

👍3👎1

All reactions

- 👍3
- 👎1

1 reply


[![@Alleged627](https://avatars.githubusercontent.com/u/109385093?s=60&v=4)](https://github.com/Alleged627)

### This comment was marked as off-topic.

[Sign in to view](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Forgs%2Fcommunity%2Fdiscussions%2F13082)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/12707550?s=64&v=4)\ KevinMSampson](https://github.com/KevinMSampson) [on May 18, 2022May 19, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-2779958)

|     |
| --- |
| To add to this we should have a way to target jobs that can use secrets. I don't want to have someone print or use a secret from a called workflow job in a caller workflow step afterwards. |

6You must be logged in to vote

All reactions

1 reply


[![@danielmarbach](https://avatars.githubusercontent.com/u/174258?s=60&v=4)](https://github.com/danielmarbach)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [danielmarbach](https://github.com/danielmarbach) [on May 19, 2022May 19, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-2781261)   Author

|     |
| --- |
| Agreed |

All reactions

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/57224483?s=64&v=4)\ mike-kaminski](https://github.com/mike-kaminski) [on May 20, 2022May 21, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-2794435)

|     |
| --- |
| Could this be handled by having the setup job run an API operation to either create a temporary repo secret using an easily constructed naming convention, or simply update a statically assigned secret each run that can be leveraged by subsequent jobs? You could add the temporary secret's ID as an output that the consuming job(s) reference for the value (the secret name/ID) and then utilizes as appropriate? It'd be less "clunky" and could also be used for other workflows, or if it's an organization level secret instead, be used by other repos in the org. Perhaps as a method to share that temporary infrastructure? |

2You must be logged in to vote

All reactions

0 replies


Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/1028103?s=64&v=4)\ jnahmias](https://github.com/jnahmias) [on Aug 18, 2022Aug 18, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3422634)

|     |
| --- |
| I've run into this exact requirement myself, see [https://github.com/orgs/community/discussions/29880](https://github.com/orgs/community/discussions/29880) for more details on my use-case.<br>[@ethomson](https://github.com/ethomson) \- any update on where this is on the roadmap? Having a way to share ephemeral random tokens within a workflow would be really useful. |

3You must be logged in to vote

All reactions

0 replies


Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/13007682?s=64&v=4)\ JeffreyArt1](https://github.com/JeffreyArt1) [on Sep 22, 2022Sep 22, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3709730)

|     |
| --- |
| Any updates on this?<br>![spying](https://camo.githubusercontent.com/613df1d9dd7510d6a440a0c65fdc5646e93cb2f3ff0ad59994e918885ae7d6c3/68747470733a2f2f6d656469612e67697068792e636f6d2f6d656469612f7a51633853547a614f6c4a33712f67697068792e676966)![spying](https://camo.githubusercontent.com/613df1d9dd7510d6a440a0c65fdc5646e93cb2f3ff0ad59994e918885ae7d6c3/68747470733a2f2f6d656469612e67697068792e636f6d2f6d656469612f7a51633853547a614f6c4a33712f67697068792e676966)[Open spying in new window](https://camo.githubusercontent.com/613df1d9dd7510d6a440a0c65fdc5646e93cb2f3ff0ad59994e918885ae7d6c3/68747470733a2f2f6d656469612e67697068792e636f6d2f6d656469612f7a51633853547a614f6c4a33712f67697068792e676966) |

24You must be logged in to vote

All reactions

0 replies


Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/174258?s=64&v=4)\ danielmarbach](https://github.com/danielmarbach) [on Sep 22, 2022Sep 22, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3709971)   Author

|     |
| --- |
| FYI in the meantime we moved away from using multiple jobs towards having custom actions with setup and teardown. I will try to update the links in this issue to point to the previous version |

1You must be logged in to vote

All reactions

3 replies


[![@Alleged627](https://avatars.githubusercontent.com/u/109385093?s=60&v=4)](https://github.com/Alleged627)

### This comment was marked as off-topic.

[Sign in to view](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Forgs%2Fcommunity%2Fdiscussions%2F13082)

[![@mikocot](https://avatars.githubusercontent.com/u/9884950?s=60&v=4)](https://github.com/mikocot)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

#### [mikocot](https://github.com/mikocot) [on Feb 17, 2023Feb 17, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-5009106)

|     |
| --- |
| this is not really a solution or even a workaround, the reason to divide workflow in jobs is not only for readability (which could be indeed achieved by compositw actions instead) but to have independent blocks that can be run or not, that can fail or not and therefore control the flow, and finally to also run matrices.<br>If you have a matrix that is going to trigger 10 runs, you don't want, or often cannot, run all the previous actions that led to it in each of those runs. |

👍2

All reactions

- 👍2

[![@danielmarbach](https://avatars.githubusercontent.com/u/174258?s=60&v=4)](https://github.com/danielmarbach)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [danielmarbach](https://github.com/danielmarbach) [on Feb 17, 2023Feb 17, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-5013801)   Author

|     |
| --- |
| That is true. My FYI was never intended to hint or say what we did was a solution or workaround. I just wanted to give a heads up our reality has changed. The problem as you rightfully pointed out still exists. |

All reactions

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/8947747?s=64&v=4)\ jonashartwig](https://github.com/jonashartwig) [on Oct 20, 2022Oct 20, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3922191)

|     |
| --- |
| Hi, we at Telia Company have a similar requirement that grows out of company directives. They require easy modular reusable workflows and proper secret handling. For secrets Vault is used.<br>So here is what we struggle with:<br>We have a re-usable workflow that deploys any helm chart from either the git repo or a remote helm repo. For lots of use cases that re-usable workflow must be provided with secrets that are external to that workflow. So what we tried to do is this:<br>```<br>name: Build and deploy<br>on:<br>  push:<br>    branches:<br>      - "*"<br>    tags:<br>      - "v*"<br>jobs:<br>  build:<br>    uses: telia-company/devx-cicd-workflows-and-actions/.github/workflows/build-helm.yml@main<br>    with:<br>      squad: "popsicle"<br>      chartValueFiles: values/sit.yaml<br>    # these secrets are ok, and can be loaded inside the re-usable workflow, they are always the same<br>    secrets:<br>      repositoryUsername: ${{ secrets.ARCUS_JFROG_WRITER_USERNAME }}<br>      repositoryPassword: ${{ secrets.ARCUS_JFROG_WRITER_PASSWORD }}<br>  vault:<br>    runs-on: ["telia-managed"]<br>    steps:<br>      - name: Import Secrets<br>        uses: hashicorp/vault-action@v2.4.0<br>        id: vault<br>        with:<br>          url: https://some.url<br>          namespace: Hid100007639<br>          # these must be on the repository anyway<br>          token: ${{ secrets.ARCUS_VAULT_TOKEN }}<br>          # here starts the problem, these secrets must come into the next job<br>          secrets: |<br>            kv/data/github secret1;<br>            kv/data/github secret2<br>  deploy-sit:<br>    needs: [ "vault" ]<br>    uses: telia-company/devx-cicd-workflows-and-actions/.github/workflows/deploy-helm.yml@main<br>    with:<br>      squad: popsicle<br>      namespace: infra<br>      chartValueFiles: values/sit.yaml<br>      releaseName: arcus<br>    secrets:<br>      # here is the problem, this is not easy possible, outputs are rightfully redacted as this are secrets and we do not have another way<br>      chartValues: |<br>        secret1: ${{ needs.vault.secrets.secret1 }}<br>        secret2: ${{ needs.vault.secrets.secret2 }}<br>      k8sConfig: this should also come from vault<br>```<br>What we want is a way to simply and safe share secrets between jobs in one run. It would be great if a workflow like outputs could get secrets like feature so those are available through needs context. Or any other solution of course :)<br>regards |

10You must be logged in to vote

❤️3

All reactions

- ❤️3

3 replies


[![@romain-cambonie](https://avatars.githubusercontent.com/u/1665550?s=60&v=4)](https://github.com/romain-cambonie)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

#### [romain-cambonie](https://github.com/romain-cambonie) [on Oct 20, 2022Oct 20, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3922380)

|     |
| --- |
| [@jonashartwig](https://github.com/jonashartwig)<br>[https://nitratine.net/blog/post/how-to-pass-secrets-between-runners-in-github-actions/](https://nitratine.net/blog/post/how-to-pass-secrets-between-runners-in-github-actions/)<br>TL;DR; you need to encrypt / decrypt the secret.<br>Using this article as base I successfully passed secrets between jobs.<br>An example in a workflow that pass encrypted AWS secrets between jobs : [https://github.com/romain-cambonie/serenity-workflow-dev/blob/master/.github/workflows/\_add-aws-credentials-to-workspace.terraform.reusable.yml](https://github.com/romain-cambonie/serenity-workflow-dev/blob/master/.github/workflows/_add-aws-credentials-to-workspace.terraform.reusable.yml) |

🚀2

All reactions

- 🚀2

[![@jonashartwig](https://avatars.githubusercontent.com/u/8947747?s=60&v=4)](https://github.com/jonashartwig)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [jonashartwig](https://github.com/jonashartwig) [on Oct 21, 2022Oct 21, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3933094)

|     |
| --- |
| Hi, thanks. We have read that article multiple times and considered doing it that way. However we think the setup and maintenance of this is too much. |

All reactions

[![@h-r-k-matsumoto](https://avatars.githubusercontent.com/u/35314064?s=60&v=4)](https://github.com/h-r-k-matsumoto)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [h-r-k-matsumoto](https://github.com/h-r-k-matsumoto) [on Feb 24, 2023Feb 24, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-5100963)

|     |
| --- |
| I faced same issue when using vault-action.<br>I resolved it by distributing the secrets of Vault to secret in a repository like below.<br>[hashicorp/vault-action@ `main...h-r-k-matsumoto:vault-action:feature/gh-secrets`](https://github.com/hashicorp/vault-action/compare/main...h-r-k-matsumoto:vault-action:feature/gh-secrets)<br>I know this is not desirable.<br>It cause to persist secret unnecessarily.<br>However, it is possible to centrally manage secret with Vault. |

All reactions

### This comment was marked as off-topic.

[Sign in to view](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Forgs%2Fcommunity%2Fdiscussions%2F13082)

[![@tvquizphd](https://avatars.githubusercontent.com/u/75504552?s=60&v=4)](https://github.com/tvquizphd)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

#### [tvquizphd](https://github.com/tvquizphd) [on Oct 21, 2022Oct 21, 2022](https://github.com/orgs/community/discussions/13082\#discussioncomment-3933846)

|     |
| --- |
| Hi [@Alleged627](https://github.com/Alleged627). Are you directing your comments to [@danielmarbach](https://github.com/danielmarbach) ? This is a world-wide discussion.<br>I'm running into the same issue on my own project. GitHub Actions allows workflows with multiple jobs.<br>It seems that jobs cannot share "secrets" among themselves.<br>So, any info shared between jobs is publicly visible.<br>The main workaround now is to use encryption before sharing info between jobs. |

🚀1

All reactions

- 🚀1

[![@kesireddymanikanta1](https://avatars.githubusercontent.com/u/124869323?s=60&v=4)](https://github.com/kesireddymanikanta1)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

#### [kesireddymanikanta1](https://github.com/kesireddymanikanta1) [on Apr 26, 2023Apr 26, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-5728492)

|     |
| --- |
| secrets need to encoded in first job and then later decoded in another job |

All reactions

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

### [![](https://avatars.githubusercontent.com/u/19497993?s=64&v=4)\ rdhar](https://github.com/rdhar) [on Aug 21, 2023Aug 21, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-6776428)

|     |
| --- |
| ###### BACKGROUND CONTEXT<br>Although there are now docs on [masking and passing secrets between jobs or workflows](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#example-masking-and-passing-a-secret-between-jobs-or-workflows) (as [@romain-cambonie](https://github.com/romain-cambonie) [linked](https://github.com/orgs/community/discussions/13082#discussioncomment-3922380)), it didn't meet requirements like:<br>- Storing and retrieving from a secret store seems a tad **over-the-top** (as [@jonashartwig](https://github.com/jonashartwig) [mentioned](https://github.com/orgs/community/discussions/13082#discussioncomment-3933094)).<br>  <br>  - The same goes for encrypted artifact upload/download.<br>- For ephemeral, temporary [OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-cloud-providers) tokens, it's **not feasible to dynamically store/retrieve** those secrets (as [@jnahmias](https://github.com/jnahmias) [raised](https://github.com/orgs/community/discussions/13082#discussioncomment-3422634)).<br>###### PROBLEM STATEMENTS<br>With these factors in mind, the main blockers are:<br>- Per docs, to **prevent accidental disclosures**, GitHub Actions [redacts any configured secrets as well as common encodings of those values](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions#using-secrets), like Base64.<br>- For dynamically-generated secrets, those have to **remain masked from the caller workflow** to the reusable workflow to avoid exposing their their values in the workflow logs.<br>###### PROPOSED SOLUTION<br>1. Before going to output secrets from the caller workflow, Base64 encode the values **twice**.<br>   <br>   1. This enables GitHub Actions to output the secrets without exposing them.<br>2. Per docs, pass the encoded values to the reusable workflow as [secret inputs](https://docs.github.com/en/actions/using-workflows/reusing-workflows#passing-inputs-and-secrets-to-a-reusable-workflow).<br>   <br>   1. This enables the reusable workflow accept and treat the encoded values as secrets.<br>3. In the reusable workflow, decode the values from Base64 **twice** before masking them.<br>   <br>   1. This ensures that the secrets remain masked in the workflow logs throughout.<br>   2. They can now be populated as environment variables for use in the subsequent steps of the reusable workflow.<br>###### WORKING EXAMPLE<br>These methods are sourced from [DevSecTop/TF-via-PR](https://github.com/devsectop/tf-via-pr/blob/main/.github/workflows/caller_aws.yml) ( [permalink](https://github.com/devsectop/tf-via-pr/blob/7b251158cc2985139df074c9ed6738d93901495b/.github/workflows/caller_aws.yml)) repository, which hosts a reusable workflow to run Terraform commands via PR comments, like a CLI.<br>As a bonus, any number of secrets can be securely passed into the reusable workflow to be used as environment variables, for example. The repository also contains recent [GitHub Actions workflow runs](https://github.com/devsectop/tf-via-pr/actions) to verify that the secrets remain masked throughout.<br>```<br># caller-workflow.yml<br>jobs:<br>  credentials:<br>    runs-on: ubuntu-latest<br>    outputs:<br>      CREDENTIAL1: ${{ steps.credentials.outputs.CREDENTIAL1 }}<br>      CREDENTIAL2: ${{ steps.credentials.outputs.CREDENTIAL2 }}<br>    steps:<br>      - name: Output encoded credentials<br>        id: credentials<br>        env:<br>          CREDENTIAL1: ${{ secrets.CREDENTIAL1 }}<br>          CREDENTIAL2: ${{ secrets.CREDENTIAL2 }}<br>        run: |<br>          echo "CREDENTIAL1=$(echo $CREDENTIAL1 | base64 -w0 | base64 -w0)" >> $GITHUB_OUTPUT<br>          echo "CREDENTIAL2=$(echo $CREDENTIAL2 | base64 -w0 | base64 -w0)" >> $GITHUB_OUTPUT<br>  reusable-workflow:<br>    needs: credentials<br>    uses: reusable-workflow.yml<br>    secrets:<br>      env_vars: |<br>        CREDENTIAL1=${{ needs.credentials.outputs.CREDENTIAL1 }}<br>        CREDENTIAL2=${{ needs.credentials.outputs.CREDENTIAL2 }}<br>```<br>```<br># reusable-workflow.yml<br>on:<br>  workflow_call:<br>    secrets:<br>      env_vars:<br>        required: true<br>jobs:<br>  parse-credentials:<br>    runs-on: ubuntu-latest<br>    env:<br>      env_vars: ${{ secrets.env_vars }}<br>    steps:<br>      - name: Decode credentials as environment variables<br>        run: |<br>          for i in $env_vars; do<br>            i=$(echo $i | sed 's/=.*//g')=$(echo ${i#*=} | base64 -di | base64 -di)<br>            echo ::add-mask::${i#*=}<br>            printf '%s\n' "$i" >> $GITHUB_ENV<br>          done<br>      - name: Validate credentials<br>        run: |<br>          # Secrets are now available as masked environment variable.<br>          echo $CREDENTIAL1 # or ${{ env.CREDENTIAL1 }}<br>          echo $CREDENTIAL2 # or ${{ env.CREDENTIAL2 }}<br>```<br>Where:<br>- `base64 -w0`: Ensures that the encoded values are outputted in a single line, regardless of the length of the input.<br>- `base64 -di`: Decodes the values from Base64, ignoring any newlines from `echo`'d strings.<br>- `echo ${i#*=}`: Removes the key of the key-value pair using parameter expansion, leaving only the value.<br>- `sed 's/=.*//g'`: Removes the value of the key-value pair, leaving only the key.<br>- `echo ::add-mask::${i#*=}`: Masks the value of the key-value pair [without outputting](https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#example-masking-a-generated-output-within-a-single-job).<br>###### FLAWS<br>- If the workflow is (re-)run in debug mode, then secrets from `credentials` job specifically are output in the workflow log.<br>- The reusable workflow needs to be configured with the steps under `parse-credentials` job. |

3You must be logged in to vote

👍11🎉1

All reactions

- 👍11
- 🎉1

7 replies


Show 2 previous replies

[![@shinebayar-g](https://avatars.githubusercontent.com/u/3091558?s=60&v=4)](https://github.com/shinebayar-g)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [shinebayar-g](https://github.com/shinebayar-g) [on Nov 1, 2023Nov 1, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7448792)

|     |
| --- |
| Hey [@rdhar](https://github.com/rdhar) thanks for letting me know the _missed_ detail. You are right. Job output is not logged. It just says `Set output <name>`. For the reusable workflow, input is received as `secrets:` thus it's hidden from the job input. It's a great workaround _when you have control_ of the reusable workflow. |

👍1

All reactions

- 👍1

[![@shinebayar-g](https://avatars.githubusercontent.com/u/3091558?s=60&v=4)](https://github.com/shinebayar-g)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [shinebayar-g](https://github.com/shinebayar-g) [on Nov 1, 2023Nov 1, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7450483)

|     |
| --- |
| Hey [@rdhar](https://github.com/rdhar) , have you tried running the `credentials` job with `Enable debug logging` checked? I think that might show outputs. |

👍1

All reactions

- 👍1

[![@rdhar](https://avatars.githubusercontent.com/u/19497993?s=60&v=4)](https://github.com/rdhar)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [rdhar](https://github.com/rdhar) [on Nov 1, 2023Nov 1, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7450681)

|     |
| --- |
| Hey [@shinebayar-g](https://github.com/shinebayar-g), you're spot-on, (re-)running the workflow in debug mode does output secrets in the `credentials` job, where it's isolated. And some level of control is required over the reusable workflow in order to parse the encoded credentials from the caller workflow.<br>I've now listed both of these flaws in the original post to ensure users are made aware. |

👍1

All reactions

- 👍1

[![@shinebayar-g](https://avatars.githubusercontent.com/u/3091558?s=60&v=4)](https://github.com/shinebayar-g)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [shinebayar-g](https://github.com/shinebayar-g) [on Nov 1, 2023Nov 1, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7450842)

|     |
| --- |
| Yeah, gotta make sure you're not accidentally leaking secrets in the debug run. I haven't found a way to check if the workflow is running with `Enable debug logging` enabled. _(`ACTIONS_RUNNER_DEBUG` variable mentioned on docs is apparently always empty unless you put some secret on the repo)_ If you ever happen to find that please let me know :) |

👍1

All reactions

- 👍1

[![@awgeorge](https://avatars.githubusercontent.com/u/1777444?s=60&v=4)](https://github.com/awgeorge)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [awgeorge](https://github.com/awgeorge) [on Nov 13, 2023Nov 13, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7553378)

|     |
| --- |
| Try ${{ runner.debug }} |

All reactions

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/3091558?s=64&v=4)\ shinebayar-g](https://github.com/shinebayar-g) [on Oct 31, 2023Nov 1, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7441625)

|     |
| --- |
| > Outputs containing secrets are redacted on the runner and not sent to GitHub Actions.<br>[https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob\_idoutputs](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idoutputs)<br>This makes reusable workflows useless when we want to download some secrets from somewhere and pass it to reusable workflows.<br>Whole encrypt/decrypt thing doesn't work when we want to use someone else's reusable workflow which we cannot control. |

9You must be logged in to vote

All reactions

0 replies


Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/109554334?s=64&v=4)\ ChrisPage-AT](https://github.com/ChrisPage-AT) [on Dec 7, 2023Dec 7, 2023](https://github.com/orgs/community/discussions/13082\#discussioncomment-7793997)

|     |
| --- |
| It would be really fantastic if Github supported secrets in "outputs" variables for jobs. I wouldn't care if it's a separate section named "secret outputs" or keep things in outputs and have the ability to add a "secret: true" flag. In workflows with multiple jobs, it would be really nice to only have to make one call to secrets providers and then be able to use that secret throughout the whole workflow via output.<br>Separate sections example:<br>```<br>jobs:<br>  get-workflow-values:<br>    runs-on: linux-small<br>    name: Get Workflow Values<br>    outputs:<br>     notSecretValue: ${{ steps.get-not-secret-value.outputs.value }}<br>    secret-outputs:<br>     secretValue: ${{ steps.get-secret-value.outputs.value }}<br>```<br>Flag example:<br>```<br>jobs:<br>  get-workflow-values:<br>    runs-on: linux-small<br>    name: Get Workflow Values<br>    outputs:<br>     notSecretValue: ${{ steps.get-not-secret-value.outputs.value }}<br>     secretValue: <br>      description: "This is a secret value for things"<br>      value: ${{ steps.get-secret-value.outputs.value }}<br>      secret: true<br>``` |

35You must be logged in to vote

👍40

All reactions

- 👍40

2 replies


[![@jrbe228](https://avatars.githubusercontent.com/u/88258057?s=60&v=4)](https://github.com/jrbe228)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [jrbe228](https://github.com/jrbe228) [on Dec 18, 2024Dec 18, 2024](https://github.com/orgs/community/discussions/13082\#discussioncomment-11609552)

|     |
| --- |
| [@ChrisPage-AT](https://github.com/ChrisPage-AT) \- does this [action](https://github.com/cloudposse/github-action-secret-outputs) address your use case? |

All reactions

[![@ChrisPage-AT](https://avatars.githubusercontent.com/u/109554334?s=60&v=4)](https://github.com/ChrisPage-AT)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [ChrisPage-AT](https://github.com/ChrisPage-AT) [on Dec 18, 2024Dec 18, 2024](https://github.com/orgs/community/discussions/13082\#discussioncomment-11610165)

|     |
| --- |
| I think that would work in my case, thank you. It looks a little bit cumbersome, but any solution for this not built-in to github is going to be. |

👍1

All reactions

- 👍1

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

### [![](https://avatars.githubusercontent.com/u/916201?s=64&v=4)\ CpuID](https://github.com/CpuID) [on May 20, 2025May 21, 2025](https://github.com/orgs/community/discussions/13082\#discussioncomment-13214705)

|     |
| --- |
| The biggest benefit to this would be being able to use credentials generated in a prior job to access private container registries. These days short-lived credential generation using roles + OIDC etc are preferable to hardcoded secrets (eg. in Github Actions secrets in repo/org settings), as they eventually need rotation for compliance reasons etc.<br>This leads to using actions such as [`aws-actions/amazon-ecr-login`](https://github.com/aws-actions/amazon-ecr-login) in a prior job, which isn't available for all private registry implementations (works for ECR but that's about it), and you still want to take the same approach ideally without reinventing the wheel... |

8You must be logged in to vote

👍7

All reactions

- 👍7

2 replies


[![@sorliem](https://avatars.githubusercontent.com/u/5680010?s=60&v=4)](https://github.com/sorliem)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

#### [sorliem](https://github.com/sorliem) [on Jun 19, 2025Jun 19, 2025](https://github.com/orgs/community/discussions/13082\#discussioncomment-13522607)

|     |
| --- |
| Running into this exact issue with trying to access Google Artifact Registry with workload identity federation shortlived credentials |

All reactions

[![@cedws](https://avatars.githubusercontent.com/u/38229097?s=60&v=4)](https://github.com/cedws)

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

#### [cedws](https://github.com/cedws) [on Apr 6Apr 6, 2026](https://github.com/orgs/community/discussions/13082\#discussioncomment-16463060)

|     |
| --- |
| I was looking to do something similar. I wanted to generate a GitHub app token in an initial job configured with an Environment, so that only it could access the app private key, and then the short lived (1 hour) app token would be passed from the initial job to the main job. This way even if the job were compromised later down the line it would not be able to access the app private key, only the short lived app token. |

All reactions

Comment options

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{title}}

Quote reply

edited

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/orgs/community/discussions/13082).

# {{editor}}'s edit

{{actor}} deleted this content
.

# {{editor}}'s edit

### [![](https://avatars.githubusercontent.com/u/3296866?s=64&v=4)\ MiguelRipoll23](https://github.com/MiguelRipoll23) [on Jun 3, 2025Jun 3, 2025](https://github.com/orgs/community/discussions/13082\#discussioncomment-13358919)

|     |
| --- |
| I create dynamic secret using "gh secret set" with key/values of my variables and secrets to pass it to other workflow, it works but I wish there was a simpler way...<br>Edit: only works if you run the workflow two times when updating variables or secrets |

1You must be logged in to vote

All reactions

0 replies


[Sign up for free](https://github.com/join?source=comment-repo) **to join this conversation on GitHub**.
Already have an account?
[Sign in to comment](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Forgs%2Fcommunity%2Fdiscussions%2F13082)

Category


[🚢\\
\\
Actions](https://github.com/orgs/community/discussions/categories/actions)

Labels


[Actions](https://github.com/orgs/community/discussions?discussions_q=label%3AActions) Build, test, and automate your deployment pipeline with world-class CI/CD [Product Feedback](https://github.com/orgs/community/discussions?discussions_q=label%3A%22Product+Feedback%22) Share your thoughts and suggestions on GitHub features and improvements

22 participants


[![@danielmarbach](https://avatars.githubusercontent.com/u/174258?s=48&v=4)](https://github.com/danielmarbach) [![@CpuID](https://avatars.githubusercontent.com/u/916201?s=48&v=4)](https://github.com/CpuID) [![@jnahmias](https://avatars.githubusercontent.com/u/1028103?s=48&v=4)](https://github.com/jnahmias) [![@ethomson](https://avatars.githubusercontent.com/u/1130014?s=48&v=4)](https://github.com/ethomson) [![@romain-cambonie](https://avatars.githubusercontent.com/u/1665550?s=48&v=4)](https://github.com/romain-cambonie) [![@awgeorge](https://avatars.githubusercontent.com/u/1777444?s=48&v=4)](https://github.com/awgeorge) [![@shinebayar-g](https://avatars.githubusercontent.com/u/3091558?s=48&v=4)](https://github.com/shinebayar-g) [![@MiguelRipoll23](https://avatars.githubusercontent.com/u/3296866?s=48&v=4)](https://github.com/MiguelRipoll23) [![@sorliem](https://avatars.githubusercontent.com/u/5680010?s=48&v=4)](https://github.com/sorliem) [![@jonashartwig](https://avatars.githubusercontent.com/u/8947747?s=48&v=4)](https://github.com/jonashartwig) [![@mikocot](https://avatars.githubusercontent.com/u/9884950?s=48&v=4)](https://github.com/mikocot) [![@KevinMSampson](https://avatars.githubusercontent.com/u/12707550?s=48&v=4)](https://github.com/KevinMSampson) [![@JeffreyArt1](https://avatars.githubusercontent.com/u/13007682?s=48&v=4)](https://github.com/JeffreyArt1) [![@rdhar](https://avatars.githubusercontent.com/u/19497993?s=48&v=4)](https://github.com/rdhar) [![@h-r-k-matsumoto](https://avatars.githubusercontent.com/u/35314064?s=48&v=4)](https://github.com/h-r-k-matsumoto) [![@cedws](https://avatars.githubusercontent.com/u/38229097?s=48&v=4)](https://github.com/cedws) [![@mike-kaminski](https://avatars.githubusercontent.com/u/57224483?s=48&v=4)](https://github.com/mike-kaminski) [![@tvquizphd](https://avatars.githubusercontent.com/u/75504552?s=48&v=4)](https://github.com/tvquizphd) [![@jrbe228](https://avatars.githubusercontent.com/u/88258057?s=48&v=4)](https://github.com/jrbe228) [![@Alleged627](https://avatars.githubusercontent.com/u/109385093?s=48&v=4)](https://github.com/Alleged627) [![@ChrisPage-AT](https://avatars.githubusercontent.com/u/109554334?s=48&v=4)](https://github.com/ChrisPage-AT) and others

Heading

Bold

Italic

Quote

Code

Link

* * *

Numbered list

Unordered list

Task list

* * *

Attach files

Mention

Reference

# Select a reply

Loading

[Create a new saved reply](https://github.com/orgs/community/discussions/13082)

👍1 reacted with thumbs up emoji👎1 reacted with thumbs down emoji😄1 reacted with laugh emoji🎉1 reacted with hooray emoji😕1 reacted with confused emoji❤️1 reacted with heart emoji🚀1 reacted with rocket emoji👀1 reacted with eyes emoji

You can’t perform that action at this time.
