---
url: https://github.com/ollama/ollama/pull/7888
retrieved: 2026-09-29
command: firecrawl scrape https://github.com/ollama/ollama/pull/7888 --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Enable index tracking for tools - openai api support by ParthSareen · Pull Request #7888 · ollama/ollama
---
[Skip to content](https://github.com/ollama/ollama/pull/7888#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/ollama/ollama/pull/7888) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/ollama/ollama/pull/7888) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/ollama/ollama/pull/7888) to refresh your session.Dismiss alert

{{ message }}

[ollama](https://github.com/ollama)/ **[ollama](https://github.com/ollama/ollama)** Public

- [Notifications](https://github.com/login?return_to=%2Follama%2Follama) You must be signed in to change notification settings
- [Fork\\
18k](https://github.com/login?return_to=%2Follama%2Follama)
- [Star\\
182k](https://github.com/login?return_to=%2Follama%2Follama)


## Conversation

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=80&v=4)](https://github.com/ParthSareen)

### ![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=48&v=4)**[ParthSareen](https://github.com/ParthSareen)**     commented   [on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888\#issue-2706590591)•   edited      Loading          \#\#\# Uh oh!        There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).


Copy link


Copy Markdown

Member

Closes [#7881](https://github.com/ollama/ollama/issues/7881)

Now able to use `client.beta.chat.completions.stream`

![image](https://private-user-images.githubusercontent.com/29360864/391210260-32c48aca-b23a-40b8-b32d-2fcb667d2d81.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTA2Nzg0MjgsIm5iZiI6MTc5MDY3ODEyOCwicGF0aCI6Ii8yOTM2MDg2NC8zOTEyMTAyNjAtMzJjNDhhY2EtYjIzYS00MGI4LWIzMmQtMmZjYjY2N2QyZDgxLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjA5MjklMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwOTI5VDEwMzUyOFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTQzNmYzMmI2OGU4NDE2OGYzMDYyZDNhOTQxNDYwNTczZWU4MjkwZjMxMmZiYWFhYmEwMjQ2YjA2OGEzMzMxNTMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtdHlwZT1pbWFnZSUyRnBuZyJ9.dODeYkNCarZKGVbZMcpUSLT8aWUVWk95RGHFeZhC8-E)

Sorry, something went wrong.


### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).

👍1jackmpcollins reacted with thumbs up emoji

All reactions

- 👍1 reaction

[![ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=60&v=4)](https://github.com/ParthSareen)

**[ParthSareen](https://github.com/ParthSareen)**

commented

[on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888#pullrequestreview-2470702928)

[View reviewed changes](https://github.com/ollama/ollama/pull/7888/files)

Comment thread[openai/openai\_test.go](https://github.com/ollama/ollama/pull/7888/files#diff-aba73d6e95ca805f61e9034084f8a989d57f1636a78d6a1917f9b76cb4e4b864)

|     |     |     |
| --- | --- | --- |
|  |  | }, |
|  |  |  |
|  |  | { |
|  |  | name: "chat handler with streaming tools", |

### ![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=48&v=4)**[ParthSareen](https://github.com/ParthSareen)** [on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888\#discussion_r1864067767)


Copy link


Copy Markdown

MemberAuthor

There was a problem hiding this comment.

### Choose a reason for hiding this comment

The reason will be displayed to describe this comment to others. [Learn more](https://docs.github.com/articles/managing-disruptive-comments/#hiding-a-comment).


Choose a reason
SpamAbuseOff TopicOutdatedDuplicateResolvedLow QualityHide comment

Quick test to make sure middleware is catching streamed tools (nothing for this PR but just general tracking regressions)

Sorry, something went wrong.


### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).

All reactions

[![jmorganca](https://avatars.githubusercontent.com/u/251292?s=60&v=4)](https://github.com/jmorganca)

**[jmorganca](https://github.com/jmorganca)**

reviewed

[on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888#pullrequestreview-2470703010)

[View reviewed changes](https://github.com/ollama/ollama/pull/7888/files)

Comment thread[server/routes.go](https://github.com/ollama/ollama/pull/7888/files#diff-829f94fd58de777429c6c25e68de745804cb600031e92995007fa08d7af32078)
Outdated
Show resolvedHide resolved

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).

[![jmorganca](https://avatars.githubusercontent.com/u/251292?s=60&v=4)](https://github.com/jmorganca)

**[jmorganca](https://github.com/jmorganca)**

approved these changes

[on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888#pullrequestreview-2470703018)

[View reviewed changes](https://github.com/ollama/ollama/pull/7888/files)

Comment thread[server/routes.go](https://github.com/ollama/ollama/pull/7888/files#diff-829f94fd58de777429c6c25e68de745804cb600031e92995007fa08d7af32078)
Outdated
Show resolvedHide resolved

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).

Comment thread[server/routes.go](https://github.com/ollama/ollama/pull/7888/files#diff-829f94fd58de777429c6c25e68de745804cb600031e92995007fa08d7af32078)
Outdated
Show resolvedHide resolved

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).

[![jmorganca](https://avatars.githubusercontent.com/u/251292?s=60&v=4)](https://github.com/jmorganca)

**[jmorganca](https://github.com/jmorganca)**

approved these changes

[on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888#pullrequestreview-2470703118)

[View reviewed changes](https://github.com/ollama/ollama/pull/7888/files)

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=40&v=4)](https://github.com/ParthSareen)

`
          Enable index tracking for tools - openai api support
`

`
          0efc014
`

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=40&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)](https://github.com/ParthSareen)

[ParthSareen](https://github.com/ParthSareen) [force-pushed](https://github.com/ollama/ollama/compare/c5d6d64f610f968d49fb921094a22e9c524b88c8..0efc01444f6e5b1fd99817289c4c83fd4fd91dca)
the
parth/add-index-for-tools
branch
from
[`c5d6d64`](https://github.com/ollama/ollama/commit/c5d6d64f610f968d49fb921094a22e9c524b88c8) to
[`0efc014`](https://github.com/ollama/ollama/commit/0efc01444f6e5b1fd99817289c4c83fd4fd91dca) [Compare](https://github.com/ollama/ollama/compare/c5d6d64f610f968d49fb921094a22e9c524b88c8..0efc01444f6e5b1fd99817289c4c83fd4fd91dca) [2 years agoNovember 30, 2024 03:50](https://github.com/ollama/ollama/pull/7888#event-15480049173)

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=40&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)](https://github.com/ParthSareen)

[ParthSareen](https://github.com/ParthSareen)

marked this pull request as ready for review

[2 years agoNovember 30, 2024 03:59](https://github.com/ollama/ollama/pull/7888#event-15480059738)

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=40&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)](https://github.com/ParthSareen)

[ParthSareen](https://github.com/ParthSareen)

merged commit [`5f80511`](https://github.com/ollama/ollama/commit/5f8051180e3b9aeafc153f6b5056e7358a939c88)
into

main[on Nov 29, 2024Nov 30, 2024](https://github.com/ollama/ollama/pull/7888#event-15480060038)

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=40&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)](https://github.com/ParthSareen)

[ParthSareen](https://github.com/ParthSareen)


deleted the

parth/add-index-for-tools

branch

[2 years agoNovember 30, 2024 04:00](https://github.com/ollama/ollama/pull/7888#event-15480060069)

[![@mathisxy](https://avatars.githubusercontent.com/u/59062040?s=80&v=4)](https://github.com/mathisxy)

### **[mathisxy](https://github.com/mathisxy)**     commented   [on Feb 3Feb 3, 2026](https://github.com/ollama/ollama/pull/7888\#issuecomment-3841222334)•   edited      Loading          \#\#\# Uh oh!        There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).


Copy link


Copy Markdown

|     |
| --- |
| When will this be available in the official ollama version?<br>I still have the problem on version 0.15.4<br>Im using: `await self.client.chat.completions.create` with `stream=True` but I just confirmed that its the same with `await self.client.chat.completions.stream`<br>Received tool call delta:<br>\[ChoiceDeltaToolCall(index=0, id='call\_juwdh89s', function=ChoiceDeltaToolCallFunction(arguments='{"sides":6}', name='role\_dice'), type='function')\]<br>Received tool call delta:<br>\[ChoiceDeltaToolCall(index=0, id='call\_itcm7qna', function=ChoiceDeltaToolCallFunction(arguments='{"sides":6}', name='role\_dice'), type='function')\] |

All reactions

Sorry, something went wrong.


### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ollama/ollama/pull/7888).

This file contains hidden or bidirectional Unicode text that may be interpreted or compiled differently than what appears below. To review, open the file in an editor that reveals hidden Unicode characters.
[Learn more about bidirectional Unicode characters](https://github.co/hiddenchars)

[Show hidden characters](https://github.com/ollama/ollama/pull/7888)

[Sign up for free](https://github.com/join?source=comment-repo) **to join this conversation on GitHub**.
Already have an account?
[Sign in to comment](https://github.com/login?return_to=https%3A%2F%2Fgithub.com%2Follama%2Follama%2Fpull%2F7888)

### Reviewers

[![@jmorganca](https://avatars.githubusercontent.com/u/251292?s=40&v=4)](https://github.com/jmorganca)[jmorganca](https://github.com/jmorganca)jmorganca approved these changes

### Assignees

No one assigned

### Labels

None yet

### Projects

None yet

### Milestone

No milestone

### Development

Successfully merging this pull request may close these issues.

[OpenAI-compatible API tool calls have no index](https://github.com/ollama/ollama/issues/7881)

### 3 participants

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=52&v=4)](https://github.com/ParthSareen)[![@mathisxy](https://avatars.githubusercontent.com/u/59062040?s=52&v=4)](https://github.com/mathisxy)[![@jmorganca](https://avatars.githubusercontent.com/u/251292?s=52&v=4)](https://github.com/jmorganca)

Add this suggestion to a batch that can be applied as a single commit.This suggestion is invalid because no changes were made to the code.Suggestions cannot be applied while the pull request is closed.Suggestions cannot be applied while viewing a subset of changes.Only one suggestion per line can be applied in a batch.Add this suggestion to a batch that can be applied as a single commit.Applying suggestions on deleted lines is not supported.You must change the existing code in this line in order to create a valid suggestion.Outdated suggestions cannot be applied.This suggestion has been applied or marked resolved.Suggestions cannot be applied from pending reviews.Suggestions cannot be applied on multi-line comments.Suggestions cannot be applied while the pull request is queued to merge.Suggestion cannot be applied right now. Please check back later.

You can’t perform that action at this time.
