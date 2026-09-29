---
url: https://github.com/ollama/ollama/issues/7881
retrieved: 2026-09-29
command: firecrawl scrape https://github.com/ollama/ollama/issues/7881 --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: OpenAI-compatible API tool calls have no index · Issue #7881 · ollama/ollama
---
[Skip to content](https://github.com/ollama/ollama/issues/7881#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/ollama/ollama/issues/7881) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/ollama/ollama/issues/7881) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/ollama/ollama/issues/7881) to refresh your session.Dismiss alert

{{ message }}

[ollama](https://github.com/ollama)/ **[ollama](https://github.com/ollama/ollama)** Public

- [Notifications](https://github.com/login?return_to=%2Follama%2Follama) You must be signed in to change notification settings
- [Fork\\
18k](https://github.com/login?return_to=%2Follama%2Follama)
- [Star\\
182k](https://github.com/login?return_to=%2Follama%2Follama)


# OpenAI-compatible API tool calls have no index\#7881

[New issue](https://github.com/login?return_to=https://github.com/ollama/ollama/issues/7881)

Copy link

[New issue](https://github.com/login?return_to=https://github.com/ollama/ollama/issues/7881)

Copy link

Closed

[#7888](https://github.com/ollama/ollama/pull/7888)

Closed

[OpenAI-compatible API tool calls have no index](https://github.com/ollama/ollama/issues/7881#top)#7881

[#7888](https://github.com/ollama/ollama/pull/7888)

Copy link

Assignees

[![ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=64&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)](https://github.com/ParthSareen)

Labels

[bugSomething isn't working](https://github.com/ollama/ollama/issues?q=state%3Aopen%20label%3A%22bug%22) Something isn't working

## Description

[![@jackmpcollins](https://avatars.githubusercontent.com/u/6640905?u=06f5c29f69b688c9206ec412555823e6d8f056fd&v=4&size=48)](https://github.com/jackmpcollins)

[jackmpcollins](https://github.com/jackmpcollins)

opened [on Nov 29, 2024on Nov 29, 2024](https://github.com/ollama/ollama/issues/7881#issue-2704483328)

Issue body actions

### What is the issue?

### What is the issue?

The streamed chat-completion response from ollama's openai-compatible API does not populate the `.choices[].delta.tool_calls[].index` field. This is different to OpenAI's API where this is populated on all tool call chunks and enumerates the tool calls. This breaks compatibility with the `client.beta.chat.completions.stream` helper from the openai package. It also breaks compatibility with [https://github.com/pydantic/logfire](https://github.com/pydantic/logfire) which uses the same underlying code from openai. Please add the index field to the tool calls to match openai.

* * *

OpenAI chunks: tool call `index` is present starting at 0

```
from openai import OpenAI

client = OpenAI()
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is the weather like in Boston?"}],
    stream=True,
    tools=[\
        {\
            "type": "function",\
            "function": {\
                "name": "get_current_weather",\
                "description": "Get the current weather in a given location",\
                "parameters": {\
                    "type": "object",\
                    "properties": {\
                        "location": {\
                            "type": "string",\
                            "description": "The city and state, e.g. San Francisco, CA",\
                        },\
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},\
                    },\
                    "required": ["location"],\
                },\
            },\
        },\
    ],
)
for chunk in response:
    print(chunk.model_dump_json(exclude_none=True))
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"role":"assistant","tool_calls":[{"index":0,"id":"call_2dlDZrcl0VQMiDtzJzwjIN5j","function":{"arguments":"","name":"get_current_weather"},"type":"function"}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\""}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"location"}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\":\""}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"Boston"}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":","}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":" MA"}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\"}"}}]},"index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
{"id":"chatcmpl-AYrJepetKGmoEh6pqPHCwPydZRPI3","choices":[{"delta":{},"finish_reason":"tool_calls","index":0}],"created":1732871462,"model":"gpt-4o-2024-08-06","object":"chat.completion.chunk","system_fingerprint":"fp_7f6be3efb0"}
```

Ollama chunks: tool call `index` is not present

```
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)
response = client.chat.completions.create(
    model="llama3.1",
    # model="gpt-4o",
    messages=[{"role": "user", "content": "What is the weather like in Boston?"}],
    stream=True,
    # stream_options={"include_usage": True},
    tools=[\
        {\
            "type": "function",\
            "function": {\
                "name": "get_current_weather",\
                "description": "Get the current weather in a given location",\
                "parameters": {\
                    "type": "object",\
                    "properties": {\
                        "location": {\
                            "type": "string",\
                            "description": "The city and state, e.g. San Francisco, CA",\
                        },\
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},\
                    },\
                    "required": ["location"],\
                },\
            },\
        },\
    ],
)
for chunk in response:
    print(chunk.model_dump_json(exclude_none=True))
{"id":"chatcmpl-914","choices":[{"delta":{"content":"","role":"assistant","tool_calls":[{"id":"call_rn5g1z57","function":{"arguments":"{\"location\":\"Boston, MA\",\"unit\":\"fahrenheit\"}","name":"get_current_weather"},"type":"function"}]},"index":0}],"created":1732871553,"model":"llama3.1","object":"chat.completion.chunk","system_fingerprint":"fp_ollama"}
{"id":"chatcmpl-914","choices":[{"delta":{"content":"","role":"assistant"},"finish_reason":"stop","index":0}],"created":1732871553,"model":"llama3.1","object":"chat.completion.chunk","system_fingerprint":"fp_ollama"}
```

Using `client.beta.chat.completions.stream` with ollama results in an exception due to `None` value for tool call index.

openai docs for this function: [https://github.com/openai/openai-python/blob/646a579cdb305a9d3fba6c5f9a96011c5e2c2882/helpers.md#chat-completions-api](https://github.com/openai/openai-python/blob/646a579cdb305a9d3fba6c5f9a96011c5e2c2882/helpers.md#chat-completions-api)

```
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama",
)
with client.beta.chat.completions.stream(
    model="llama3.1",
    messages=[{"role": "user", "content": "What is the weather like in Boston?"}],
    tools=[\
        {\
            "type": "function",\
            "function": {\
                "name": "get_current_weather",\
                "description": "Get the current weather in a given location",\
                "parameters": {\
                    "type": "object",\
                    "properties": {\
                        "location": {\
                            "type": "string",\
                            "description": "The city and state, e.g. San Francisco, CA",\
                        },\
                        "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},\
                    },\
                    "required": ["location"],\
                },\
            },\
        },\
    ],
) as stream:
    for event in stream:
        pass

print(stream.get_final_completion().model_dump_json(indent=2))
...
openai/lib/streaming/chat/_completions.py:505, in ChatCompletionStreamState._build_events(self, chunk, completion_snapshot)
    502 assert tool_calls is not None
    504 for tool_call_delta in choice.delta.tool_calls:
--> 505     tool_call = tool_calls[tool_call_delta.index]
    507     if tool_call.type == "function":
    508         assert tool_call_delta.function is not None
TypeError: list indices must be integers or slices, not NoneType
```

### OS

macOS

### GPU

_No response_

### CPU

Apple

### Ollama version

0.4.6

👍React with 👍4Reacted by Jack Collins, Parth Sareen, Greg Richardson and Marc S

## Activity

[![](https://avatars.githubusercontent.com/u/6640905?s=64&u=06f5c29f69b688c9206ec412555823e6d8f056fd&v=4)jackmpcollins](https://github.com/jackmpcollins)

added

[bugSomething isn't working](https://github.com/ollama/ollama/issues?q=state%3Aopen%20label%3A%22bug%22) Something isn't working

[on Nov 29, 2024on Nov 29, 2024](https://github.com/ollama/ollama/issues/7881#event-15473232506)

[![](https://avatars.githubusercontent.com/u/29360864?s=64&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)ParthSareen](https://github.com/ParthSareen)

self-assigned this

[on Nov 29, 2024on Nov 29, 2024](https://github.com/ollama/ollama/issues/7881#event-15473318483)

### gregnr commented on Nov 29, 2024on Nov 29, 2024

[![@gregnr](https://avatars.githubusercontent.com/u/4133076?u=f3f783e0364abe955dbde6af80445ea27d948fdd&v=4&size=48)](https://github.com/gregnr)

[gregnr](https://github.com/gregnr)

[on Nov 29, 2024on Nov 29, 2024](https://github.com/ollama/ollama/issues/7881#issuecomment-2508729728)

Last edited by gregnr

More actions

Experiencing this too using Vercel's AI SDK. The SDK expects that each tool call has an index, and validation fails with Ollama:

```
Error: Type validation failed: Value: {
  "id": "chatcmpl-763",
  "object": "chat.completion.chunk",
  "created": 1732922184,
  "model": "qwen2.5:7b",
  "system_fingerprint": "fp_ollama",
  "choices": [\
    {\
      "index": 0,\
      "delta": {\
        "role": "assistant",\
        "content": "",\
        "tool_calls": [\
          {\
            "id": "call_rcja46yu",\
            "type": "function",\
            "function": { "name": "<redacted>", "arguments": "<redacted>" }\
          }\
        ]\
      },\
      "finish_reason": null\
    }\
  ]
}
.
Error message: [\
  {\
    "code": "invalid_union",\
    "unionErrors": [\
      {\
        "issues": [\
          {\
            "code": "invalid_type",\
            "expected": "number",\
            "received": "undefined",\
            "path": [\
              "choices",\
              0,\
              "delta",\
              "tool_calls",\
              0,\
              "index"\
            ],\
            "message": "Required"\
          }\
        ],\
        "name": "ZodError"\
      },\
      {\
        "issues": [\
          {\
            "code": "invalid_type",\
            "expected": "object",\
            "received": "undefined",\
            "path": [\
              "error"\
            ],\
            "message": "Required"\
          }\
        ],\
        "name": "ZodError"\
      }\
    ],\
    "path": [],\
    "message": "Invalid input"\
  }\
]
```

### ParthSareen commented on Nov 29, 2024on Nov 29, 2024

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4&size=48)](https://github.com/ParthSareen)

[ParthSareen](https://github.com/ParthSareen)

[on Nov 29, 2024on Nov 29, 2024](https://github.com/ollama/ollama/issues/7881#issuecomment-2508734744)

Member

More actions

Sorry about that! Looking into it now!

👍React with 👍2Reacted by Jack Collins and Greg Richardson

[![](https://avatars.githubusercontent.com/u/29360864?s=64&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)ParthSareen](https://github.com/ParthSareen)

closed this as [completed](https://github.com/ollama/ollama/issues?q=is%3Aissue%20state%3Aclosed%20archived%3Afalse%20reason%3Acompleted) in [#7888](https://github.com/ollama/ollama/pull/7888) [on Nov 29, 2024on Nov 29, 2024](https://github.com/ollama/ollama/issues/7881#event-15480060054)

### ParthSareen commented on Dec 1, 2024on Dec 1, 2024

[![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4&size=48)](https://github.com/ParthSareen)

[ParthSareen](https://github.com/ParthSareen)

[on Dec 1, 2024on Dec 1, 2024](https://github.com/ollama/ollama/issues/7881#issuecomment-2510519787)

Member

More actions

[@gregnr](https://github.com/gregnr) [@jackmpcollins](https://github.com/jackmpcollins) just released - [https://github.com/ollama/ollama/releases/tag/v0.4.7](https://github.com/ollama/ollama/releases/tag/v0.4.7)

🚀React with 🚀2Reacted by Greg Richardson and Jack Collins

[Sign up for free](https://github.com/signup?return_to=https://github.com/ollama/ollama/issues/7881)**to join this conversation on GitHub.** Already have an account? [Sign in to comment](https://github.com/login?return_to=https://github.com/ollama/ollama/issues/7881)

## Metadata

## Metadata

### Assignees

- [![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=64&u=74e7372f2aeb2c9a9f7e12a253ab107f78e4782c&v=4)\\
ParthSareen](https://github.com/ParthSareen)

### Labels

[bugSomething isn't working](https://github.com/ollama/ollama/issues?q=state%3Aopen%20label%3A%22bug%22) Something isn't working

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
