---
url: https://github.com/continuedev/continue/issues/9797
retrieved: 2026-09-29
command: firecrawl scrape https://github.com/continuedev/continue/issues/9797 --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Context window not reset between prompts → 400 “request exceeds available context size” with local llama-server · Issue #9797 · continuedev/continue
---
[Skip to content](https://github.com/continuedev/continue/issues/9797#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/continuedev/continue/issues/9797) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/continuedev/continue/issues/9797) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/continuedev/continue/issues/9797) to refresh your session.Dismiss alert

{{ message }}

[continuedev](https://github.com/continuedev)/ **[continue](https://github.com/continuedev/continue)** Public

- [Notifications](https://github.com/login?return_to=%2Fcontinuedev%2Fcontinue) You must be signed in to change notification settings
- [Fork\\
5.4k](https://github.com/login?return_to=%2Fcontinuedev%2Fcontinue)
- [Star\\
36.1k](https://github.com/login?return_to=%2Fcontinuedev%2Fcontinue)


# Context window not reset between prompts → 400 “request exceeds available context size” with local llama-server\#9797

[New issue](https://github.com/login?return_to=https://github.com/continuedev/continue/issues/9797)

Copy link

[New issue](https://github.com/login?return_to=https://github.com/continuedev/continue/issues/9797)

Copy link

Not planned

Not planned

[Context window not reset between prompts → 400 “request exceeds available context size” with local llama-server](https://github.com/continuedev/continue/issues/9797#top)#9797

Copy link

Labels

[area:configurationRelates to configuration options](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22area%3Aconfiguration%22) Relates to configuration options [kind:bugIndicates an unexpected problem or unintended behavior](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22kind%3Abug%22) Indicates an unexpected problem or unintended behavior [os:linuxHappening specifically on Linux](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22os%3Alinux%22) Happening specifically on Linux [stale](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22stale%22)

## Description

[![@girls-whocode](https://avatars.githubusercontent.com/u/29525538?u=114daa726da47bf052d027ad5c84dd11416ad576&v=4&size=48)](https://github.com/girls-whocode)

[girls-whocode](https://github.com/girls-whocode)

opened [on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issue-3843783847)

Issue body actions

## Error Details

- **Model:** Qwen2.5-Coder-32B (LAN)
- **Provider:** OpenAI-compatible (local llama.cpp server)
- **Status Code:** 400
- **Client:** Continue
- **Server:** llama.cpp `llama-server`

### Error Output

```
400 the request exceeds the available context size, try increasing it
```

**Additional Context**

Please add any additional context about the error here

## Server Configuration

`llama-server` is started with the following flags:

```
/opt/llm/llama.cpp/build/bin/llama-server \
  --model /mnt/models/qwen2.5-coder-32b-instruct-q4_k_m/Qwen2.5-Coder-32B-Instruct-Q4_K_M.gguf \
  --host <REDACTED> \
  --port <REDACTED> \
  --ctx-size 16384 \
  --n-predict 1024 \
  --threads 16 \
  --parallel 1 \
  --n-gpu-layers 80
```

Notes:

- `--parallel 1` (single request at a time)
- Context size is explicitly set to **16384**
- Completion cap is **1024 tokens**

## Observed Behavior

- Prompt 1 completes successfully.
- Prompt 2 fails immediately with a 400 context-overflow error.
- Server logs show **prompt tokens continuing to increase across prompts**, rather than starting fresh.

From llama.cpp logs (excerpt):

```
slot update_slots: new prompt, n_ctx_slot = 16384
task.n_tokens = 15953
send_error: the request exceeds the available context size
```

This indicates the effective prompt limit is **16384 tokens**, and that Continue is sending cumulative context rather than a fresh prompt.

Once a prompt completes successfully, shouldn't the next prompt:

- Start with a fresh token budget (aside from intentional chat history)
- Not reuse or accumulate prior prompt tokens unless explicitly required

In this case, Prompt 2 is a new task and should not exceed context limits immediately.

## Reproduction Steps

### Prompt 1 (works)

```
npm run start
```

Output:

```
Error: Cannot find module '/home/jessica/repositories/python/AI-Test/backend/index.js'
```

(Qwen resolves issue successfully)

- Backend starts
- Frontend starts

### Prompt 2 (fails)

```
Backend now running, and frontend started, now we need to build the frontend
```

Result:

```
400 the request exceeds the available context size
```

No additional files or large inputs were manually added between prompts.

## Additional Notes

- This appears **client-side**, as llama.cpp correctly enforces the context window and reports the overflow.
- The issue reproduces consistently after several successful prompts, suggesting **context accumulation across requests**.
- Reducing `--n-predict` mitigates but does not eliminate the issue.
- The same server behaves correctly with other OpenAI-compatible clients when context is reset per request.

It appears Continue may be:

- Retaining full prior prompt context across requests, and/or
- Sending a `max_tokens` value that causes excessive prompt reservation

Resulting in prompt token counts exceeding the effective server context window even on short follow-up prompts.

Happy to provide additional logs or test with a debug build if helpful.

## Activity

### sestinj commented on Jan 22on Jan 22, 2026

[![@sestinj](https://avatars.githubusercontent.com/u/33237525?u=7c64f5fc5890499d6003fdc9d9ba4d9a72b728a0&v=4&size=48)](https://github.com/sestinj)

[sestinj](https://github.com/sestinj)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3785460037)

Contributor

More actions

Related issues:

- [autoadjusting prompt tokens #6616](https://github.com/continuedev/continue/issues/6616) \- Chat history accumulation causing token growth across messages (closed as stale)
- [Context length calculation incorrect for Anthropic Claude models (shows 130k tokens at 70% when actually 200k) #9231](https://github.com/continuedev/continue/issues/9231) \- Context length calculation incorrect for models (token counting mismatch)
- [Ollama models take +50% memory when called by Continue #7583](https://github.com/continuedev/continue/issues/7583) \- Ollama models taking excessive memory when called by Continue (closed as stale)
- [The contextLength setting is not effective #1364](https://github.com/continuedev/continue/issues/1364) \- The contextLength setting is not effective (closed)

[![](https://avatars.githubusercontent.com/in/324583?s=64&v=4)dosubot](https://github.com/apps/dosubot)

added

[area:configurationRelates to configuration options](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22area%3Aconfiguration%22) Relates to configuration options

[kind:bugIndicates an unexpected problem or unintended behavior](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22kind%3Abug%22) Indicates an unexpected problem or unintended behavior

[os:linuxHappening specifically on Linux](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22os%3Alinux%22) Happening specifically on Linux

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#event-22221255189)

### girls-whocode commented on Jan 22on Jan 22, 2026

[![@girls-whocode](https://avatars.githubusercontent.com/u/29525538?u=114daa726da47bf052d027ad5c84dd11416ad576&v=4&size=48)](https://github.com/girls-whocode)

[girls-whocode](https://github.com/girls-whocode)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3785484991)

Author

More actions

I did forget to mention, which I believe you realized, I am using VSCode for Linux, and the server is also Linux, which maybe obvious.

### RomneyDa commented on Jan 22on Jan 22, 2026

[![@RomneyDa](https://avatars.githubusercontent.com/u/6581799?u=66c22ca9ed0a94545763126b3f66872cfedc02b0&v=4&size=48)](https://github.com/RomneyDa)

[RomneyDa](https://github.com/RomneyDa)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3786848898)

Contributor

More actions

Hi [@girls-whocode](https://github.com/girls-whocode), just to clarify is this two _new_ prompts or two successive prompts?

### girls-whocode commented on Jan 22on Jan 22, 2026

[![@girls-whocode](https://avatars.githubusercontent.com/u/29525538?u=114daa726da47bf052d027ad5c84dd11416ad576&v=4&size=48)](https://github.com/girls-whocode)

[girls-whocode](https://github.com/girls-whocode)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3786948646)

Author

More actions

Two successive prompts.

### RomneyDa commented on Jan 22on Jan 22, 2026

[![@RomneyDa](https://avatars.githubusercontent.com/u/6581799?u=66c22ca9ed0a94545763126b3f66872cfedc02b0&v=4&size=48)](https://github.com/RomneyDa)

[RomneyDa](https://github.com/RomneyDa)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3787013223)

Contributor

More actions

Realized my question may have sounded redundant. So 1st message -> response -> 2nd message in the same conversation? Or 1st message, new convo, 1st message?

### girls-whocode commented on Jan 22on Jan 22, 2026

[![@girls-whocode](https://avatars.githubusercontent.com/u/29525538?u=114daa726da47bf052d027ad5c84dd11416ad576&v=4&size=48)](https://github.com/girls-whocode)

[girls-whocode](https://github.com/girls-whocode)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3787033338)

Author

More actions

1st message -> response -> 2nd message in the same conversation? Yes

### RomneyDa commented on Jan 22on Jan 22, 2026

[![@RomneyDa](https://avatars.githubusercontent.com/u/6581799?u=66c22ca9ed0a94545763126b3f66872cfedc02b0&v=4&size=48)](https://github.com/RomneyDa)

[RomneyDa](https://github.com/RomneyDa)

[on Jan 22on Jan 22, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3787050432)

Last edited by RomneyDa

Contributor

More actions

Got it. The context will not reset between 2 messages in the same conversation. This is expected behavior, if the first message and its response nearly fill the context limit, and the 2nd message takes it over the limit, it will fail

### girls-whocode commented on Jan 23on Jan 23, 2026

[![@girls-whocode](https://avatars.githubusercontent.com/u/29525538?u=114daa726da47bf052d027ad5c84dd11416ad576&v=4&size=48)](https://github.com/girls-whocode)

[girls-whocode](https://github.com/girls-whocode)

[on Jan 23on Jan 23, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3788952532)

Last edited by girls-whocode

Author

More actions

Thanks for the clarification, I understand that context is expected to accumulate across messages within the same conversation, and that exceeding the context window will result in a failure.

However, what I’m seeing here goes beyond a simple “2-message overflow” case.

This occurs **after multiple successful turns (6+ in this example)**, even though each individual prompt is small. The issue appears to be **unbounded context growth across turns**, eventually exhausting the context window and KV cache, rather than a single oversized prompt.

From llama.cpp server logs (abridged):

- Turn 1:

`task.n_tokens = 7335`
- Turn 2:

`task.n_tokens = 7605`
- Turn 3:

`task.n_tokens = 9684`
- Turn 4:

`task.n_tokens = 12026`
- Turn 5:

`task.n_tokens = 18277`
- Turn 6:

`task.n_tokens = 19260`

By turn 6, the prompt alone exceeds **19k tokens**, despite no large files or prompts being manually added between turns.

Notably:

- Each request is treated as a _new prompt_ by the server (`new prompt, n_keep = 0`)

- Yet the prompt token count continues to grow monotonically

- This eventually leads to KV cache pressure and slot purging:



```
decode: failed to find a memory slot for batch of size 1
purging slot with 12486 tokens
```


This suggests the client is **re-sending the full accumulated conversation history (and possibly retrieved context / tool output) on every turn**, without trimming or summarization, causing inevitable overflow even with a 32k context window.

### Expected behavior (from a client perspective)

- Accumulating conversational context is expected

- But the client should:
  - Trim older turns
  - Summarize prior context
  - Or otherwise bound total prompt size

Without this, longer interactive coding sessions reliably fail after several turns, even when each user message is small.

This behavior reproduces consistently with:

- `--ctx-size 32768`
- `--parallel 1`
- `--n-predict 1024`

And does **not** reproduce with other OpenAI-compatible clients against the same llama.cpp server, suggesting this is a Continue-side context management issue rather than expected server behavior.

This is using dual 3090s with NVLink and 128GB RAM, I do understand that it does not magically turn two 24 GB cards into a seamless 48 GB GPU for everything so I lowered the model from 32b to 14b and increased the ctx-size for testing. Here is the exact command I ran with the test in my previous 6 turn test.

If there is a model you recommend, although I do not see how the model would be affected by the output of the tests I performed.

```
/opt/llm/llama.cpp/build/bin/llama-server \
  --model /mnt/models/qwen2.5-coder-14b-instruct-q4_k_m/qwen2.5-coder-14b-instruct-q4_k_m.gguf \
  --host <REDACTED> \
  --port <REDACTED> \
  --ctx-size 32768 \           # This is the maximum total context window (prompt + generation).
  --parallel 1 \               # Limits the server to one active sequence at a time.
  --n-gpu-layers 999 \         # Put as many layers on the GPU as possible.
  --n-predict 1024 \           # Caps maximum generated tokens per request.
  --context-shift \            # Enables automatic sliding window behavior
  --threads 16                 # CPU threads
```

Even with 32k context and a smaller model, llama.cpp logs show task.n\_tokens increasing monotonically across turns (e.g., ~7k → 19k+ by turn ~6), indicating the client is re-sending an increasingly large prompt each request. Eventually this triggers context overflow / KV cache pressure.

Other OpenAI-compatible clients against the same llama.cpp server do not show the same unbounded prompt growth under similar usage.

Happy to test any mitigation flags or provide additional logs if helpful.

### RomneyDa commented on Jan 26on Jan 26, 2026

[![@RomneyDa](https://avatars.githubusercontent.com/u/6581799?u=66c22ca9ed0a94545763126b3f66872cfedc02b0&v=4&size=48)](https://github.com/RomneyDa)

[RomneyDa](https://github.com/RomneyDa)

[on Jan 26on Jan 26, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-3802159449)

Contributor

More actions

> This suggests the client is re-sending the full accumulated conversation history (and possibly retrieved context / tool output) on every turn, without trimming or summarization, causing inevitable overflow even with a 32k context window.

Yes, we send the full conversation history which includes retrieved context and tool output on every turn. This is expected behavior.

> even though each individual prompt is small
>
> How small are the prompts and tool outputs? Conversational turns of 500-5000 tokens are reasonable and expected.

Currently in VS Code and Jetbrains, compaction is manual, although it _should_ auto-prune messages off the back when the context limit is reached.

I wonder if the bug is that pruning isn't working automatically

### github-actions commented on Aug 13on Aug 13, 2026

[![@github-actions](https://avatars.githubusercontent.com/in/15368?v=4&size=48)](https://github.com/apps/github-actions)

[github-actions](https://github.com/apps/github-actions) bot

[on Aug 13on Aug 13, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-5288645870) – with [GitHub Actions](https://help.github.com/en/actions)

Contributor

More actions

This issue hasn't been updated in 90 days and will be closed after an additional 10 days without activity. If it's still important, please leave a comment and share any new information that would help us address the issue.

[![](https://avatars.githubusercontent.com/in/15368?s=64&v=4)github-actions](https://github.com/apps/github-actions)

added

[stale](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22stale%22)

[on Aug 13on Aug 13, 2026](https://github.com/continuedev/continue/issues/9797#event-29434816022)

### github-actions commented on Aug 24on Aug 24, 2026

[![@github-actions](https://avatars.githubusercontent.com/in/15368?v=4&size=48)](https://github.com/apps/github-actions)

[github-actions](https://github.com/apps/github-actions) bot

[on Aug 24on Aug 24, 2026](https://github.com/continuedev/continue/issues/9797#issuecomment-5404067398) – with [GitHub Actions](https://help.github.com/en/actions)

Contributor

More actions

This issue was closed because it wasn't updated for 10 days after being marked stale. If it's still important, you are welcome to leave a comment and this will keep the issue open. However please note that this repo is no longer being actively maintained.

### 1 remaining item

Load more

Loading

[Sign up for free](https://github.com/signup?return_to=https://github.com/continuedev/continue/issues/9797)**to join this conversation on GitHub.** Already have an account? [Sign in to comment](https://github.com/login?return_to=https://github.com/continuedev/continue/issues/9797)

## Metadata

## Metadata

### Assignees

No one assigned

### Labels

[area:configurationRelates to configuration options](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22area%3Aconfiguration%22) Relates to configuration options [kind:bugIndicates an unexpected problem or unintended behavior](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22kind%3Abug%22) Indicates an unexpected problem or unintended behavior [os:linuxHappening specifically on Linux](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22os%3Alinux%22) Happening specifically on Linux [stale](https://github.com/continuedev/continue/issues?q=state%3Aopen%20label%3A%22stale%22)

### Type

No type

### Projects

No projects

### Milestone

No milestone

### Relationships

None yet

### Development

No branches or pull requests

## Issue actions

- ![](https://github.githubassets.com/assets/github-copilot-app-light-15ad5534265eeacd.svg)Open in GitHub Copilot app

You can’t perform that action at this time.
