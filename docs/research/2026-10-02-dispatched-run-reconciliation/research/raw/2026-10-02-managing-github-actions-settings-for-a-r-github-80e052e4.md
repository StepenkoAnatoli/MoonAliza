---
url: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository
retrieved: 2026-10-02
command: http-keyless scrape https://docs.github.com/github/administering-a-repository/managing-repository-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-repository
statusCode: 200
transport: http-keyless
completeness: partial
omitted: 1 sibling section(s) totalling ~24 words were outside the page's main content and are not in this capture
title: Managing GitHub Actions settings for a repository - GitHub Docs
---
In this article



# Managing GitHub Actions settings for a repository

 You can disable or configure GitHub Actions for a specific repository.

 Copy markdown



## In this article


- [About GitHub Actions permissions for your repository](#about-github-actions-permissions-for-your-repository)
- [Managing GitHub Actions permissions for your repository](#managing-github-actions-permissions-for-your-repository)
- [Controlling changes from forks to workflows in public repositories](#controlling-changes-from-forks-to-workflows-in-public-repositories)
- [Enabling workflows for forks of private repositories](#enabling-workflows-for-forks-of-private-repositories)
- [Setting the permissions of the GITHUB_TOKEN for your repository](#setting-the-permissions-of-the-github_token-for-your-repository)
- [Allowing access to components in a private repository](#allowing-access-to-components-in-a-private-repository)
- [Configuring cache settings for your repository](#configuring-cache-settings-for-your-repository)
- [Configuring the retention period for checks, workflow runs, commit statuses, artifacts, and logs in your repository](#configuring-the-retention-period-for-checks-workflow-runs-commit-statuses-artifacts-and-logs-in-your-repository)
- [Setting the check, workflow run, status, artifact and log retention period for a repository](#setting-the-check-workflow-run-status-artifact-and-log-retention-period-for-a-repository)





## [About GitHub Actions permissions for your repository](#about-github-actions-permissions-for-your-repository)

 By default, GitHub Actions is enabled on all repositories and organizations. You can choose to disable GitHub Actions or limit it to actions and reusable workflows in your organization. For more information about GitHub Actions, see [Writing workflows](/en/actions/how-tos/write-workflows).

 You can enable GitHub Actions for your repository. When you enable GitHub Actions, workflows are able to run actions and reusable workflows located within your repository and any other public repository. You can disable GitHub Actions for your repository altogether. When you disable GitHub Actions, no workflows run in your repository.

 Alternatively, you can enable GitHub Actions in your repository but limit the actions and reusable workflows a workflow can run.

## [Managing GitHub Actions permissions for your repository](#managing-github-actions-permissions-for-your-repository)

 You can disable GitHub Actions for a repository, or set a policy that configures which actions and reusable workflows can be used in the repository.

 Note


You might not be able to manage these settings if your organization has an overriding policy or is managed by an enterprise that has overriding policy. For more information, see [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization) or [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise).

 Note


If you see **GitHub Actions is currently disabled for this repository** or **GitHub Actions is currently disabled for your account**, the repository or account may be in a separate GitHub-controlled disabled state, and changing these settings won't restore access.
Contact GitHub Support for review.



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under "Actions permissions", select an option.
 If you choose **Allow *OWNER*, and select non-*OWNER*, actions and reusable workflows**, actions and reusable workflows within your organization are allowed, and there are additional options for allowing other specific actions and reusable workflows. For more information, see [Allowing select actions and reusable workflows to run](#allowing-select-actions-and-reusable-workflows-to-run).
 When you allow actions and reusable workflows from only in your organization, the policy blocks all access to actions authored by GitHub. For example, the [actions/checkout](https://github.com/actions/checkout) action would not be accessible.
 When you enable **Require actions to be pinned to a full-length commit SHA**, all actions must be pinned to a full-length commit SHA to be used. This includes actions from your organization and actions authored by GitHub. Reusable workflows can still be referenced by tag. For more information, see [Secure use reference](/en/actions/reference/security/secure-use#using-third-party-actions).

- Click **Save**.




### [Allowing select actions and reusable workflows to run](#allowing-select-actions-and-reusable-workflows-to-run)

 When you choose **Allow *OWNER*, and select non-*OWNER*, actions and reusable workflows**, local actions (`./` and `$/`) and reusable workflows are allowed, and there are additional options for allowing other specific actions and reusable workflows:

 Note


You might not be able to manage these settings if your organization has an overriding policy or is managed by an enterprise that has overriding policy. For more information, see [Disabling or limiting GitHub Actions for your organization](/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization) or [Enforcing policies for GitHub Actions in your enterprise](/en/enterprise-cloud@latest/admin/enforcing-policies/enforcing-policies-for-your-enterprise/enforcing-policies-for-github-actions-in-your-enterprise).



- **Allow actions created by GitHub:** You can allow all actions created by GitHub to be used by workflows. Actions created by GitHub are located in the `actions` and `github` organizations. For more information, see the [actions](https://github.com/actions) and [github](https://github.com/github) organizations.

- **Allow Marketplace actions by verified creators:** You can allow all GitHub Marketplace actions created by verified creators to be used by workflows. When GitHub has verified the creator of the action as a partner organization, the badge is displayed next to the action in GitHub Marketplace.

- **Allow or block specified actions and reusable workflows:** You can restrict workflows to use actions and reusable workflows in specific organizations and repositories. Specified actions cannot be set to more than 1000.
 To restrict access to specific tags or commit SHAs of an action or reusable workflow, use the same syntax used in the workflow to select the action or reusable workflow.

 For an action, the syntax is `OWNER/REPOSITORY@TAG-OR-SHA`. For example, use `actions/javascript-action@v1.0.1` to select a tag or `actions/javascript-action@a824008085750b8e136effc585c3cd6082bd575f` to select a SHA. For more information, see [Using pre-written building blocks in your workflow](/en/actions/how-tos/write-workflows/choose-what-workflows-do/find-and-customize-actions#using-release-management-for-your-custom-actions).

- For a reusable workflow, the syntax is `OWNER/REPOSITORY/PATH/FILENAME@TAG-OR-SHA`. For example, `octo-org/another-repo/.github/workflows/workflow.yml@v1`. For more information, see [Reuse workflows](/en/actions/how-tos/reuse-automations/reuse-workflows#calling-a-reusable-workflow).

 You can use the `*` wildcard character to match patterns. For example, to allow all actions and reusable workflows in organizations that start with `space-org`, you can specify `space-org*/*`. To allow all actions and reusable workflows in repositories that start with octocat, you can use `*/octocat**@*`. For more information about using the `*` wildcard, see [Workflow syntax for GitHub Actions](/en/actions/reference/workflows-and-actions/workflow-syntax#filter-pattern-cheat-sheet).

 Use `,` to separate patterns. For example, to allow all actions and reusable workflows from the `octocat` and `octokit` organizations, you can specify `octocat/*, octokit/*`.

 Use the `!` prefix to block patterns. For example, to allow all actions and reusable workflows from the `space-org` organization, but block a specific action like `space-org/action`, you can specify `space-org/*, !space-org/action@*`. By default, only actions and reusable workflows specified in the list will be allowed. To allow all actions and reusable workflows while also blocking specific actions, you can specify `*, !space-org/action@*`.



 This procedure demonstrates how to add specific actions and reusable workflows to the list.



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under "Actions permissions", select **Allow *OWNER*, and select non-*OWNER*, actions and reusable workflows** and add your required actions to the list.

- Click **Save**.

## [Controlling changes from forks to workflows in public repositories](#controlling-changes-from-forks-to-workflows-in-public-repositories)

 Anyone can fork a public repository, and then submit a pull request that proposes changes to the repository's GitHub Actions workflows. Although workflows from forks do not have access to sensitive data such as secrets, they can be an annoyance for maintainers if they are modified for abusive purposes.

 To help prevent this, workflows on pull requests to public repositories from some outside contributors will not run automatically, and might need to be approved first. Depending on the "Approval for running fork pull request workflows from contributors" setting, workflows on pull requests to public repositories will not run automatically and may need approval if:



- The pull request is **created by** a user that requires approvals based on the selected policy.

- The pull request event is **triggered by** a user that requires approvals based on the selected policy.

 By default, all first-time contributors require approval to run workflows.

 Workflows triggered by `pull_request_target` events are run in the context of the base branch. Since the base branch is considered trusted, workflows triggered by these events will always run, regardless of approval settings. For more information about the `pull_request_target` event, see [Events that trigger workflows](/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request_target).

 Warning

 These workflow approval policies are intended to restrict the set of users that can execute workflows in GitHub Actions runners that could lead to unexpected resource and compute consumption when using GitHub-hosted runners. If you are using self-hosted runners, potentially malicious user-controlled workflow code will execute automatically if the user is allowed to bypass approval in the set approval policy or if the pull request is approved. You must consider the risk of executing this code in your infrastructure and should review and follow the self-hosted runner security recommendations regardless of the approval settings utilized. See [Secure use reference](/en/actions/reference/security/secure-use#hardening-for-self-hosted-runners).

 You can configure this behavior for a repository using the procedure below. Modifying this setting overrides the configuration set at the organization or enterprise level.



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under **Approval for running fork pull request workflows from contributors**, choose which subset of users will require approval before running workflows on their pull requests. Both the pull request author and the actor of the pull request event triggering the workflow will be checked to determine if approval is required. If approval is required, a user with write access to the repository must approve the pull request workflow to be run. See [Approving workflow runs from forks](/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks).
 Warning
 When requiring approvals only for first-time contributors (the first two settings), a user that has had any commit or pull request merged into the repository will not require approval. A malicious user could meet this requirement by getting a simple typo or other innocuous change accepted by a maintainer, either as part of a pull request they have authored or as part of another user's pull request.


 **Require approval for first-time contributors who are new to GitHub**. Only users who are both new on GitHub and who have never had a commit or pull request merged into this repository will require approval to run workflows.

- **Require approval for first-time contributors**. Only users who have never had a commit or pull request merged into this repository will require approval to run workflows.

- **Require approval for all external contributors** All users that are not a member or owner of this repository and not a member of the organization will require approval to run workflows.



- Click **Save** to apply the settings.

 For more information about approving workflow runs that this policy applies to, see [Approving workflow runs from forks](/en/actions/how-tos/manage-workflow-runs/approve-runs-from-forks).

## [Enabling workflows for forks of private repositories](#enabling-workflows-for-forks-of-private-repositories)

 If you rely on using forks of your private repositories, you can configure policies that control how users can run workflows on `pull_request` events. Available to private repositories only, you can configure these policy settings for organizations or repositories.

 If a policy is disabled for an organization, it cannot be enabled for a repository.



- **Run workflows from fork pull requests** - Allows users to run workflows from fork pull requests, using a `GITHUB_TOKEN` with read-only permission, and with no access to secrets.

- **Send write tokens to workflows from pull requests** - Allows pull requests from forks to use a `GITHUB_TOKEN` with write permission.

- **Send secrets to workflows from pull requests** - Makes all secrets available to the pull request.

- **Require approval for fork pull request workflows** - Workflow runs on pull requests from collaborators without write permission will require approval from someone with write permission before they will run.

### [Configuring the fork policy for a private repository](#configuring-the-fork-policy-for-a-private-repository)



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under **Fork pull request workflows**, select your options.

- Click **Save** to apply the settings.

## [Setting the permissions of the GITHUB_TOKEN for your repository](#setting-the-permissions-of-the-github_token-for-your-repository)

 You can set the default permissions granted to the `GITHUB_TOKEN`. For more information about the `GITHUB_TOKEN`, see [Use GITHUB_TOKEN for authentication in workflows](/en/actions/tutorials/authenticate-with-github_token). You can choose a restricted set of permissions as the default, or apply permissive settings.

 The default permissions can also be configured in the organization settings. If your repository belongs to an organization and a more restrictive default has been selected in the organization settings, the same option is selected in your repository settings and the permissive option is disabled.

 Anyone with write access to a repository can modify the permissions granted to the `GITHUB_TOKEN`, adding or removing access as required, by editing the `permissions` key in the workflow file. For more information, see [permissions](/en/actions/reference/workflows-and-actions/workflow-syntax#permissions).

### [Configuring the default GITHUB_TOKEN permissions](#configuring-the-default-github_token-permissions)

 By default, when you create a new repository in your personal account, `GITHUB_TOKEN` only has read access for the `contents` and `packages` scopes. If you create a new repository in an organization, the setting is inherited from what is configured in the organization settings.



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under "Workflow permissions", choose whether you want the `GITHUB_TOKEN` to have read and write access for all permissions (the permissive setting), or just read access for the `contents` and `packages` permissions (the restricted setting).

- Click **Save** to apply the settings.

### [Preventing GitHub Actions from creating or approving pull requests](#preventing-github-actions-from-creating-or-approving-pull-requests)

 You can choose to allow or prevent GitHub Actions workflows from creating or approving pull requests.

 By default, when you create a new repository in your personal account, workflows are not allowed to create or approve pull requests. If you create a new repository in an organization, the setting is inherited from what is configured in the organization settings.



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under "Workflow permissions", use the **Allow GitHub Actions to create and approve pull requests** setting to configure whether `GITHUB_TOKEN` can create and approve pull requests.

- Click **Save** to apply the settings.

## [Allowing access to components in a private repository](#allowing-access-to-components-in-a-private-repository)

 Actions and reusable workflows in your private repositories can be shared with other private repositories owned by the same user or organization. For information about private repositories, see [About repositories](/en/repositories/creating-and-managing-repositories/about-repositories#about-repository-visibility).

 You can use the steps below to configure whether actions and reusable workflows in a private repository can be accessed from outside the repository. For more information, see [Sharing actions and workflows from your private repository](/en/actions/how-tos/reuse-automations/share-across-private-repositories) and [Sharing actions and workflows with your organization](/en/actions/how-tos/reuse-automations/share-with-your-organization). Alternatively, you can use the REST API to set, or get details of the level of access. For more information, see [REST API endpoints for GitHub Actions permissions](/en/rest/actions/permissions#get-the-level-of-access-for-workflows-outside-of-the-repository) and [REST API endpoints for GitHub Actions permissions](/en/rest/actions/permissions#set-the-level-of-access-for-workflows-outside-of-the-repository).

### [Managing access for a private repository](#managing-access-for-a-private-repository)



- On GitHub, navigate to the main page of the private repository.

- Under your repository name, click ** Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under **Access**, choose one of the access settings:

 **Not accessible** - Workflows in other repositories cannot access this repository.

- **Accessible from repositories owned by 'USER NAME' user** - Workflows in other repositories that are owned by the same user can access the actions and reusable workflows in this repository. Access is allowed only from private repositories.



- Click **Save** to apply the settings.

### [Managing access for a private repository in an organization](#managing-access-for-a-private-repository-in-an-organization)



- On GitHub, navigate to the main page of the private repository.

- Under your repository name, click ** Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under **Access**, choose one of the access settings:

 **Not accessible** - Workflows in other repositories cannot access this repository.

- **Accessible from repositories in the 'ORGANIZATION NAME' organization** - Workflows in other repositories that are part of the 'ORGANIZATION NAME' organization can access the actions and reusable workflows in this repository. Access is allowed only from private repositories.



- Click **Save** to apply the settings.

## [Configuring cache settings for your repository](#configuring-cache-settings-for-your-repository)

 You can configure cache retention and size settings for your repository. This feature is opt-in and available to users with a payment method on file, GitHub Pro, GitHub Team, or GitHub Enterprise Cloud plans.

 If your repository is owned by an organization that has configured cache settings, you can configure limits up to the maximum set by the organization. If your repository is user-owned, you can configure up to the global maximums.



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- In the "Cache settings" section, configure the following settings:

 **Cache retention**: The number of days to retain caches before automatic deletion. The default is 7 days. You can configure up to 90 days for public repositories or 365 days for private and internal repositories (or up to the limit set by your organization).

- **Cache size eviction limit**: The maximum total size of all caches in your repository. The default is 10 GB. You can configure up to 10,000 GB per repository (or up to the limit set by your organization). When this limit is exceeded, older caches will be evicted to make room for new caches.



- Click **Save** to apply the settings.

 For more information about cache eviction, see [Dependency caching reference](/en/actions/reference/workflows-and-actions/dependency-caching#usage-limits-and-eviction-policy).



## [Configuring the retention period for checks, workflow runs, commit statuses, artifacts, and logs in your repository](#configuring-the-retention-period-for-checks-workflow-runs-commit-statuses-artifacts-and-logs-in-your-repository)

 You can configure the retention period for checks, workflow runs, commit statuses, artifacts, and logs in your repository.

 By default, checks, workflow runs, commit statuses, and the artifacts and log files generated by workflows are retained for 90 days before they are automatically deleted.

 Important


Starting October 1, 2026, these policies will apply to checks, workflow runs, and commit statuses in addition to artifacts and logs. Until then, checks, workflow runs, and commit statuses are retained for 400+ days regardless of your configured retention period. Make sure to review your retention setting and make any adjustments before October 1. For more information, see [the GitHub changelog](https://github.blog/changelog/2026-07-17-actions-retention-will-cover-checks-workflow-runs-and-statuses/).

 These retention policies apply to checks data, including check suites and check runs, and to commit statuses, including those created by third-party integrations. The policies are not limited to data created by GitHub Actions.

 You can adjust the retention period, depending on the type of repository:



- For public repositories: you can change this retention period to anywhere between 1 day or 90 days.

- For private repositories: you can change this retention period to anywhere between 1 day or 400 days.

 When you customize the retention period, it only applies to new checks, workflow runs, commit statuses, artifacts, and log files, and does not retroactively apply to existing objects. For managed repositories and organizations, the maximum retention period cannot exceed the limit set by the managing organization or enterprise.

 You can also define a custom retention period for a specific artifact created by a workflow. For more information, see [Removing workflow artifacts](/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts#setting-the-retention-period-for-an-artifact).

## [Setting the check, workflow run, status, artifact and log retention period for a repository](#setting-the-check-workflow-run-status-artifact-and-log-retention-period-for-a-repository)



- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Settings**. If you cannot see the "Settings" tab, select the ** ** dropdown menu, then click **Settings**.

- In the left sidebar, click ** Actions**, then click **General**.

- Under **Check, workflow run, status, artifact and log retention**, enter a new value.

- Click **Save** to apply the change.
