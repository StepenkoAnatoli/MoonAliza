---
url: https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines
retrieved: 2026-09-29
command: firecrawl scrape https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Managing Secrets in Github Pipelines
---
For AI agents: visit https://tutorials.akeyless.io/llms.txt for an index of all pages formatted in Markdown and endpoints in OpenAPI. Append .md to any documentation page URL to get its markdown version.

Managing Secrets in Github Actions Pipelines - YouTube

Tap to unmute

[Managing Secrets in Github Actions Pipelines](https://www.youtube.com/watch?v=XZUhHv25NFM) [Akeyless Security](https://www.youtube.com/channel/UCO9dU1TNVMgUjri9SAfwSrw)

Akeyless Security459 subscribers

[Watch on](https://www.youtube.com/watch?v=XZUhHv25NFM)

> 📘
>
> ### Deeper Dive   [Skip link to Deeper Dive](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#deeper-dive)
>
> For more in-depth information, check out our detailed documentation on the following topics:
>
> [Github Actions Community Plugin](https://docs.akeyless.io/docs/github-actions-community-plugin)
>
> [Oauth2.0/JWT Auth Method](https://docs.akeyless.io/docs/oauth20jwt)

> 👍
>
> ### Something not working?   [Skip link to Something not working?](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#something-not-working)
>
> If something in this tutorial isn't working as expected, feel free to contact our support team [via Slack](https://akeylesssupport.slack.com/join/shared_invite/zt-dgjcbscx-rXlZIXsmI1sS5Yc~XrFvGw#/shared-invite/email).

_**Below is a text-only guide for users based on the above video**_

This is a [community plugin](https://github.com/LanceMcCarthy/akeyless-action) that enables you to fetch Static and Dynamic secrets directly from the Akeyless Platform into your Github Actions workflows.

This tutorial will demonstrate running a Github Actions pipeline using OAuth 2.0 / JWT authentication to fetch both a Static and Dynamic secret from Akeyless in order to update a MySQL database table.

## Prerequisites   [Skip link to Prerequisites](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#prerequisites)

1. A Github account and project.
2. A specific job permissions requirement which we will show in the workflow YAML.
3. For Dynamic Secrets, [jq](https://stedolan.github.io/jq/) must be installed on the runner host (this is usually installed by default in Github runners).

## OAuth 2.0 / JWT   [Skip link to OAuth 2.0 / JWT](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#oauth-20--jwt)

### Create Auth Method via Web UI   [Skip link to Create Auth Method via Web UI](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#create-auth-method-via-web-ui)

Go to the console and create your GitLab Auth Method by clicking "Users & Auth Methods" > "New" > "OAuth 2.0 / JWT".

![](https://files.readme.io/6e5e8c2-small-Screenshot_2023-05-01_at_16.50.13_2.png)

Then add the following information:

**Name**: Give the Auth Method a name. In this example, we call it _GitHubAuth_.

**JWKs URL**: Use the following URL - [https://token.actions.githubusercontent.com/.well-known/jwks](https://token.actions.githubusercontent.com/.well-known/jwks)

**Unique Identifier**: `repository` (this will be set in our Access Role's Sub-Claim). Whenever a user logs in with a token, these authentication types issue Sub-Claims that contains details uniquely identifying that user. This sub-claim includes a key containing the ID value you configured and is used to distinguish between users from within the same organization.

**JWT TTL**: Choose the length of time the token will be available for use (in minutes).

**Require Sub Claim on role association**: Tick this box to enforce [Sub-Claims](https://docs.akeyless.io/docs/sub-claims) on role association.

## OAuth 2.0 / JWT   [Skip link to OAuth 2.0 / JWT](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#oauth-20--jwt-1)

### Create Auth Method via Web UI   [Skip link to Create Auth Method via Web UI](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#create-auth-method-via-web-ui-1)

Go to the console and create your GitLab Auth Method by clicking "Users & Auth Methods" > "New" > "OAuth 2.0 / JWT".

### Create Auth Method via CLI   [Skip link to Create Auth Method via CLI](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#create-auth-method-via-cli)

In Akeyless, create a new [OAuth 2.0 / JWT](https://docs.akeyless.io/docs/oauth20jwt) Authentication Method with the following parameters:

Shell

```shell
akeyless create-auth-method-oauth2 --name GitHubAuth \
--jwks-uri https://gitlab.com/-/jwks \
--unique-identifier repository
--force-sub-claims
```

To see how to use the AWS IAM Authentication Method, see the [docs](https://docs.akeyless.io/docs/github-actions-community-plugin).

### Access Role   [Skip link to Access Role](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#access-role)

See the video on [Role-Based Access Controls](https://tutorials.akeyless.io/docs/role-based-access-control-with-api-key-authentication) to create an Access Role, Associate it with the Auth Method, and provide the proper permissions. In this example, we called the role _GithubRole_.

Add an appropriate Sub-Claim: repository=`<your-github-org>`/`<your-github-repo>`.

![](https://files.readme.io/6d66a04-Screenshot_2023-06-18_at_11.13.37.png)

> 🚧
>
> ### Sub Claims:   [Skip link to Sub Claims:](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#sub-claims)
>
> It is mandatory to add an appropriate [Sub Claim](https://docs.akeyless.io/docs/sub-claims) based on the [claims available in the Github documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect#understanding-the-oidc-token) to prevent access by unauthorized users.
>
> Sub-Claim configuration allows Akeyless to grant access to specific workflows, based on the claims that GitHub provides in the JWT.

Set `Read` permissions only for Secrets & Keys. You can also specify a specific secret in the path.

![](https://files.readme.io/8d0e900-Screenshot_2023-06-18_at_11.15.16.png)

> 📘
>
> ### Runner Configuration   [Skip link to Runner Configuration](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#runner-configuration)
>
> If you would like to set up a self-hosted runner, check out our \[docs\](When the job has finished, the VM is automatically decommissioned).
>
> In this demo, we use a Github hosted runner which automatically provisions a new VM for each job which is automatically decommissioned once the job has finished.

## Example Usage   [Skip link to Example Usage](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#example-usage)

In this example, we are updating our Github repo which triggers a workflow that runs a set of commands in order to update a MySQL database. For this to work, you will need to have:

1. A MySQL database with table as well as the host address
2. A MySQL [Dynamic Secret Producer](https://tutorials.akeyless.io/docs/creating-and-fetching-dynamic-secrets)
3. Akeyless Gateway
4. Access ID
5. Private Key for SSH saved as Static Secret

Open your Github repo and add your `ACCESS_ID` as a secret under **Settings** -\> **Secrets and variables** -\> **Actions**.

![](https://files.readme.io/39a0977-Screenshot_2023-06-18_at_13.15.48.png)

Next, make sure you have a folder in your repo called `.github/workflows` along with a `yaml` file in that directory and update it with the below code.

> 📘
>
> ### Important information about this file   [Skip link to Important information about this file](https://tutorials.akeyless.io/docs/managing-secrets-in-github-pipelines\#important-information-about-this-file)
>
> In the below file, you should change the following to your own Akeyless secret names:
>
> `jeremy-demo` is the RSA private key
>
> `jeremy-demo.pem` is the private key - you can call the file whatever you want, just make sure to update it in both places
>
> `mysqlDS` is the MySQL Dynamic Secret Producer
>
> `<mysql-host>` is where you will add your MySQL host address
>
> For the MySQL command, make sure you have your database and table set and change the info to match yours.

job.yml

```yaml
name: 'Fetch Static and Dynamic Secrets to Update MySQL DB'
on: push

jobs:
  fetch_static_dynamic_secrets:
    runs-on: 'ubuntu-latest'
    name: Use MySQL Dynamic Secret to Update DB

    permissions:
      id-token: write
      contents: read

    steps:
    - name: Fetch Private Key Static Secret and MySQL Dynamic Secret from Akeyless
      id: fetch-secrets
      uses: LanceMcCarthy/akeyless-action@v3.1.1
      with:
        access-id: ${{ secrets.ACCESS_ID }}
        static-secrets: '{"jeremy-demo":"MY_RSA"}'
        dynamic-secrets: '{"mysqlDS":"MYSQL_DYNAMIC_SECRET"}'

    - name: Create PEM File & Export Dynamic Secret to Environment
      run: |
        echo ${{ env.MY_RSA }} | base64 -d >> jeremy-demo.pem
        echo '${{ steps.fetch-secrets.outputs.MYSQL_DYNAMIC_SECRET }}' | jq -r 'to_entries|map("JWT_\(.key)=\(.value|tostring)")|.[]' >> $GITHUB_ENV

    - name: Verify Vars
      run: |
        echo "id: ${{ env.JWT_id }}"
        echo "password: ${{ env.JWT_password }}"

    - name: SSH into Host and Update Database Table
      run: |
        echo -e '#!/bin/bash' >> employee.sh
        echo -e "mysql -u\$LC_user -p\$LC_pass -e 'USE Employees; INSERT INTO employees (First_Name,Last_Name) VALUES (\"Gwen\",\"Stacy\");'" >> employee.sh
        export LC_user=${{ env.JWT_id }}
        export LC_pass=${{ env.JWT_password }}
        chmod 600 jeremy-demo.pem
        scp -o StrictHostKeyChecking=no -i "jeremy-demo.pem" employee.sh ubuntu@<mysql-host>:~/.
        ssh -o "SendEnv LC_*" -o StrictHostKeyChecking=no -i "jeremy-demo.pem" ubuntu@<mysql-host> -t "bash employee.sh" # SSH into Remote EC2 Host and update DB
        echo "Database Employees updated!"
```

Here's what is happening in this workflow:

01. We start a Github runner with the latest Ubuntu image.
02. Give it the permissions noted earlier.
03. Use the community project to fetch our Access ID, Static Secret, and Dynamic Secret.
04. Create our pem file and decode our base64 encoded private key into the file from the Stati Secret.
05. Add the Dynamic Secret information, parsed into the temp user and temp password, to our Github Env variable.
06. Check that our variables are giving us valid temporary creds (Optional).
07. Create our bash script on the fly, which will be used to update the database.
08. Export the temp user and password.
09. Give the pem file proper permissions.
10. Then, we run our SSH copy command to copy the employee.sh file into the remote host which is used to update the database.
11. Next, SSH into the remote host again sending the values of the username and the password in order to log into the database and then run the \`employee.sh\` file to log into, and update, the MySQL database.
12. And we just echo that the database called \`employees\` was updated.

Once you commit the file, go to the **Actions** tab and you will see a new workflow with something similar to the following output:

![](https://files.readme.io/c2dea57-Screenshot_2023-06-18_at_13.28.53.png)

You can head over to your database and login with your admin or temporary credentials to see the update was successful:

![](https://files.readme.io/0934bfc-Screenshot_2023-06-18_at_13.30.12.png)

Note that the above image shows the previous state of the database and then the updated state with the new row added.

Updatedover 1 year ago

* * *

### What’s Next

- [Managing Secrets in GitLab Pipelines](https://tutorials.akeyless.io/docs/managing-secrets-in-gitlab-pipelines)

Did this page help you?

Yes

No

Copy Page
