---
url: https://aider.chat/docs/troubleshooting/token-limits.html
retrieved: 2026-10-13
command: firecrawl scrape https://aider.chat/docs/troubleshooting/token-limits.html --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Token limits | aider
---
[Skip to main content](https://aider.chat/docs/troubleshooting/token-limits.html#main-content)LinkMenuExpand(external link)DocumentSearchCopyCopied

[![Aider Logo](https://aider.chat/assets/logo.svg)](https://aider.chat/)

# Token limits

Every LLM has limits on how many tokens it can process for each request:

- The model’s **context window** limits how many total tokens of
_input and output_ it can process.
- Each model has limit on how many **output tokens** it can
produce.

Aider will report an error **if a model responds** indicating that
it has exceeded a token limit.
The error will include suggested actions to try and
avoid hitting token limits.

Here’s an example error:

```
Model gpt-3.5-turbo has hit a token limit!

Input tokens: 768 of 16385
Output tokens: 4096 of 4096 -- exceeded output limit!
Total tokens: 4864 of 16385

To reduce output tokens:
- Ask for smaller changes in each request.
- Break your code into smaller source files.
- Try using a stronger model like DeepSeek V3 or Sonnet that can return diffs.

For more info: https://aider.chat/docs/token-limits.html
```

Aider never _enforces_ token limits, it only _reports_ token limit errors
from the API provider.
The token counts that aider reports are _estimates_.

## Input tokens & context window size

The most common problem is trying to send too much data to a
model,
overflowing its context window.
Technically you can exhaust the context window if the input is
too large or if the input plus output are too large.

Strong models like GPT-4o and Sonnet have quite
large context windows, so this sort of error is
typically only an issue when working with weaker models.

The easiest solution is to try and reduce the input tokens
by removing files from the chat.
It’s best to only add the files that aider will need to _edit_
to complete your request.

- Use `/tokens` to see token usage.
- Use `/drop` to remove unneeded files from the chat session.
- Use `/clear` to clear the chat history.
- Break your code into smaller source files.

## Output token limits

Most models have quite small output limits, often as low
as 4k tokens.
If you ask aider to make a large change that affects a lot
of code, the LLM may hit output token limits
as it tries to send back all the changes.

To avoid hitting output token limits:

- Ask for smaller changes in each request.
- Break your code into smaller source files.
- Use a strong model like gpt-4o, sonnet or DeepSeek V3 that can return diffs.
- Use a model that supports [infinite output](https://aider.chat/docs/more/infinite-output.html).

## Other causes

Sometimes token limit errors are caused by
non-compliant API proxy servers
or bugs in the API server you are using to host a local model.
Aider has been well tested when directly connecting to
major
[LLM provider cloud APIs](https://aider.chat/docs/llms.html).
For serving local models,
[Ollama](https://aider.chat/docs/llms/ollama.html) is known to work well with aider.

Try using aider without an API proxy server
or directly with one of the recommended cloud APIs
and see if your token limit problems resolve.

## More help

If you need more help, please check our
[GitHub issues](https://github.com/Aider-AI/aider/issues)
and file a new issue if your problem isn’t discussed.
Or drop into our
[Discord](https://discord.gg/Y7X7bhMQFV)
to chat with us.

When reporting problems, it is very helpful if you can provide:

- Aider version
- LLM model you are using

Including the “announcement” lines that
aider prints at startup
is an easy way to share this helpful info.

```
Aider v0.37.1-dev
Models: gpt-4o with diff edit format, weak model gpt-3.5-turbo
Git repo: .git with 243 files
Repo-map: using 1024 tokens
```

Use `/help <question>` to
[ask for help about using aider](https://aider.chat/docs/troubleshooting/support.html),
customizing settings, troubleshooting, using LLMs, etc.
