---
url: https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
retrieved: 2026-10-02
command: http-keyless scrape https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow
statusCode: 200
transport: http-keyless
completeness: partial
omitted: 2 sibling section(s) totalling ~29 words were outside the page's main content and are not in this capture
title: Manually running a workflow - GitHub Docs
---
In this article



# Manually running a workflow

 When a workflow is configured to run on the `workflow_dispatch` event, you can run the workflow using the Actions tab on GitHub, GitHub CLI, or the REST API.

 Copy markdown



## Tool navigation


- [GitHub CLI](?tool=cli)
- [Web browser](?tool=webui)





## In this article


- [Configuring a workflow to run manually](#configuring-a-workflow-to-run-manually)
- [Running a workflow](#running-a-workflow)
- [Running a workflow using the REST API](#running-a-workflow-using-the-rest-api)





## [Configuring a workflow to run manually](#configuring-a-workflow-to-run-manually)

 To run a workflow manually, the workflow must be configured to run on the `workflow_dispatch` event.

 To trigger the `workflow_dispatch` event, your workflow must be in the default branch. For more information about configuring the `workflow_dispatch` event, see [Events that trigger workflows](/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch).

 Write access to the repository is required to perform these steps.

## [Running a workflow](#running-a-workflow)




- On GitHub, navigate to the main page of the repository.

- Under your repository name, click ** Actions**.

- In the left sidebar, click the name of the workflow you want to run.

- Above the list of workflow runs, click the **Run workflow** button.
 Note

To see the **Run workflow** button, your workflow file must use the `workflow_dispatch` event trigger. Only workflow files that use the `workflow_dispatch` event trigger will have the option to run the workflow manually using the **Run workflow** button. For more information about configuring the `workflow_dispatch` event, see [Events that trigger workflows](/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#workflow_dispatch).

- Select the **Branch** dropdown menu and click a branch to run the workflow on.

- If the workflow requires input, fill in the fields.

- Click **Run workflow**.


 Note


To learn more about GitHub CLI, see [About GitHub CLI](/en/github-cli/github-cli/about-github-cli).

 To run a workflow, use the `workflow run` subcommand. Replace the `workflow` parameter with either the name, ID, or file name of the workflow you want to run. For example, `"Link Checker"`, `1234567`, or `"link-check-test.yml"`. If you don't specify a workflow, GitHub CLI returns an interactive menu for you to choose a workflow.

 `gh workflow run WORKFLOW
`
 If your workflow accepts inputs, GitHub CLI will prompt you to enter them. Alternatively, you can use `-f` or `-F` to add an input in `key=value` format. Use `-F` to read from a file.

 `gh workflow run greet.yml -f name=mona -f greeting=hello -F data=@myfile.txt
`
 You can also pass inputs as JSON by using standard input.

 `echo '{"name":"mona", "greeting":"hello"}' | gh workflow run greet.yml --json
`
 To run a workflow on a branch other than the repository's default branch, use the `--ref` flag.

 `gh workflow run WORKFLOW --ref BRANCH
`
 To view the progress of the workflow run, use the `run watch` subcommand and select the run from the interactive list.

 `gh run watch
`

## [Running a workflow using the REST API](#running-a-workflow-using-the-rest-api)

 When using the REST API, you configure the `inputs` and `ref` as request body parameters. If the inputs are omitted, the default values defined in the workflow file are used.

 Note


You can define up to 25 `inputs` for a `workflow_dispatch` event.

 For more information about using the REST API, see [REST API endpoints for workflows](/en/rest/actions/workflows#create-a-workflow-dispatch-event).
