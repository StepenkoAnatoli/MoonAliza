---
url: https://docs.ollama.com/api/chat
retrieved: 2026-09-26
command: firecrawl scrape https://docs.ollama.com/api/chat --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Generate a chat message - Ollama
---
> ## Documentation Index
>
> Fetch the complete documentation index at: [/llms.txt](https://docs.ollama.com/llms.txt)
>
> Use this file to discover all available pages before exploring further.

[Skip to main content](https://docs.ollama.com/api/chat#content-area)

[Guide](https://docs.ollama.com/) [Integrations](https://docs.ollama.com/integrations) [API Reference](https://docs.ollama.com/api/introduction)

POST

/

api

/

chat

cURL

Default

```
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4",
  "messages": [\
    {\
      "role": "user",\
      "content": "why is the sky blue?"\
    }\
  ]
}'
```

200

```
{
  "model": "<string>",
  "created_at": "2023-11-07T05:31:56Z",
  "message": {
    "role": "assistant",
    "content": "<string>",
    "thinking": "<string>",
    "tool_calls": [\
      {\
        "function": {\
          "name": "<string>",\
          "description": "<string>",\
          "arguments": {}\
        }\
      }\
    ],
    "images": [\
      "<string>"\
    ]
  },
  "done": true,
  "done_reason": "<string>",
  "total_duration": 123,
  "load_duration": 123,
  "prompt_eval_count": 123,
  "prompt_eval_cached_count": 123,
  "prompt_eval_duration": 123,
  "eval_count": 123,
  "eval_duration": 123,
  "logprobs": [\
    {\
      "token": "<string>",\
      "logprob": 123,\
      "bytes": [\
        123\
      ],\
      "top_logprobs": [\
        {\
          "token": "<string>",\
          "logprob": 123,\
          "bytes": [\
            123\
          ]\
        }\
      ]\
    }\
  ]
}
```

#### Body

application/json

[​](https://docs.ollama.com/api/chat#body-model)

model

string

required

Model name

[​](https://docs.ollama.com/api/chat#body-messages)

messages

object\[\]

required

Chat history as an array of message objects (each with a role and content)

Showchild attributes

[​](https://docs.ollama.com/api/chat#body-tools)

tools

object\[\]

Optional list of function tools the model may call during the chat

Showchild attributes

[​](https://docs.ollama.com/api/chat#body-format-one-of-0)

format

enum<string>objectenum<string>object

Format to return a response in. Can be `json` or a JSON schema

Available options:

`json`

[​](https://docs.ollama.com/api/chat#body-options)

options

object

Runtime options that control text generation

Showchild attributes

[​](https://docs.ollama.com/api/chat#body-stream)

stream

boolean

default:true

[​](https://docs.ollama.com/api/chat#body-think-one-of-0)

think

booleanstringbooleanstring

Controls a model's thinking output. Use `/api/show` to discover the supported values and default for the selected model. `true` requests thinking, `false` requests no thinking output, and `null` uses the model default. String values are model-defined; supported names must match `/api/show` exactly. Numbers are not supported.

[​](https://docs.ollama.com/api/chat#body-keep-alive-one-of-0)

keep\_alive

stringnumberstringnumber

Model keep-alive duration (for example `5m` or `0` to unload immediately)

[​](https://docs.ollama.com/api/chat#body-logprobs)

logprobs

boolean

Whether to return log probabilities of the output tokens

[​](https://docs.ollama.com/api/chat#body-top-logprobs)

top\_logprobs

integer

Number of most likely tokens to return at each token position when logprobs are enabled

#### Response

200

application/json

Chat response

[​](https://docs.ollama.com/api/chat#response-model)

model

string

Model name used to generate this message

[​](https://docs.ollama.com/api/chat#response-created-at)

created\_at

string<date-time>

Timestamp of response creation (ISO 8601)

[​](https://docs.ollama.com/api/chat#response-message)

message

object

Showchild attributes

[​](https://docs.ollama.com/api/chat#response-done)

done

boolean

Indicates whether the chat response has finished

[​](https://docs.ollama.com/api/chat#response-done-reason)

done\_reason

string

Reason the response finished

[​](https://docs.ollama.com/api/chat#response-total-duration)

total\_duration

integer

Total time spent generating in nanoseconds

[​](https://docs.ollama.com/api/chat#response-load-duration)

load\_duration

integer

Time spent loading the model in nanoseconds

[​](https://docs.ollama.com/api/chat#response-prompt-eval-count)

prompt\_eval\_count

integer

Number of tokens in the prompt

[​](https://docs.ollama.com/api/chat#response-prompt-eval-cached-count)

prompt\_eval\_cached\_count

integer

Number of prompt tokens read from the cache

[​](https://docs.ollama.com/api/chat#response-prompt-eval-duration)

prompt\_eval\_duration

integer

Time spent evaluating uncached prompt tokens in nanoseconds

[​](https://docs.ollama.com/api/chat#response-eval-count)

eval\_count

integer

Number of tokens generated in the response

[​](https://docs.ollama.com/api/chat#response-eval-duration)

eval\_duration

integer

Time spent generating tokens in nanoseconds

[​](https://docs.ollama.com/api/chat#response-logprobs)

logprobs

object\[\]

Log probability information for the generated tokens when logprobs are enabled

Showchild attributes

Ctrl+I

cURL

Default

```
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4",
  "messages": [\
    {\
      "role": "user",\
      "content": "why is the sky blue?"\
    }\
  ]
}'
```

200

```
{
  "model": "<string>",
  "created_at": "2023-11-07T05:31:56Z",
  "message": {
    "role": "assistant",
    "content": "<string>",
    "thinking": "<string>",
    "tool_calls": [\
      {\
        "function": {\
          "name": "<string>",\
          "description": "<string>",\
          "arguments": {}\
        }\
      }\
    ],
    "images": [\
      "<string>"\
    ]
  },
  "done": true,
  "done_reason": "<string>",
  "total_duration": 123,
  "load_duration": 123,
  "prompt_eval_count": 123,
  "prompt_eval_cached_count": 123,
  "prompt_eval_duration": 123,
  "eval_count": 123,
  "eval_duration": 123,
  "logprobs": [\
    {\
      "token": "<string>",\
      "logprob": 123,\
      "bytes": [\
        123\
      ],\
      "top_logprobs": [\
        {\
          "token": "<string>",\
          "logprob": 123,\
          "bytes": [\
            123\
          ]\
        }\
      ]\
    }\
  ]
}
```
