---
url: https://platform.claude.com/docs/en/build-with-claude/token-counting
retrieved: 2026-09-28
command: firecrawl scrape https://platform.claude.com/docs/en/build-with-claude/token-counting --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Token counting - Claude Platform Docs
---
Copy page



Token counting lets you determine the number of tokens in a message before you send it to Claude. This helps you make informed decisions about your prompts and usage. With token counting, you can:

- Proactively manage rate limits and costs
- Make smart model routing decisions
- Optimize prompts to a specific length

* * *

## How to count message tokens

The [token counting](https://platform.claude.com/docs/en/api/messages/count_tokens) endpoint accepts the same structured list of inputs for creating a message, including support for system prompts, [tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview), [images](https://platform.claude.com/docs/en/build-with-claude/vision), and [PDFs](https://platform.claude.com/docs/en/build-with-claude/pdf-support). The response contains the total number of input tokens.

This endpoint returns an `invalid_request_error` for a few inputs that the Messages API accepts: [server tools](https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools) such as web search, web fetch, code execution, and tool search (every server tool except the [advisor tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool)), the [MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector), and `image` or `document` blocks with a `url` or `file` source. Send images and PDFs as base64 to count them. For requests that use server tools or MCP servers, the Messages API response reports the tokens used in its `usage` object.

### Supported models

All [active models](https://platform.claude.com/docs/en/models/overview) support token counting.

### Count tokens in basic messages

cURLCLIPythonTypeScriptC#GoJavaPHPRuby



```
client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-opus-5-5",
    system="You are a scientist",
    messages=[{"role": "user", "content": "Hello, Claude"}],
)

print(response.json())
```

Output



```
{ "input_tokens": 14 }
```

### Count tokens in messages with tools

cURLCLIPythonTypeScriptC#GoJavaPHPRuby



```
client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-opus-5-5",
    tools=[\
        {\
            "name": "get_weather",\
            "description": "Get the current weather in a given location",\
            "input_schema": {\
                "type": "object",\
                "properties": {\
                    "location": {\
                        "type": "string",\
                        "description": "The city and state, e.g. San Francisco, CA",\
                    }\
                },\
                "required": ["location"],\
            },\
        }\
    ],
    messages=[{"role": "user", "content": "What's the weather like in San Francisco?"}],
)

print(response.json())
```

Output



```
{ "input_tokens": 403 }
```

### Count tokens in messages with images

cURLCLIPythonTypeScriptC#GoJavaPHPRuby



```
import base64
import httpx2

image_url = "https://platform.claude.com/docs/images/vision-example.jpg"
image_media_type = "image/jpeg"
image_data = base64.standard_b64encode(httpx2.get(image_url).content).decode("utf-8")

client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-opus-5-5",
    messages=[\
        {\
            "role": "user",\
            "content": [\
                {\
                    "type": "image",\
                    "source": {\
                        "type": "base64",\
                        "media_type": image_media_type,\
                        "data": image_data,\
                    },\
                },\
                {"type": "text", "text": "Describe this image"},\
            ],\
        }\
    ],
)
print(response.json())
```

Output



```
{ "input_tokens": 1028 }
```

An embedded image block that sets [`"oversized_image": "error"`](https://platform.claude.com/docs/en/build-with-claude/vision-coordinates#oversized-image-error) is rejected at count time exactly as the Messages API would reject it.

### Count tokens in messages with thinking

cURLCLIPythonTypeScriptC#GoJavaPHPRuby



```
client = anthropic.Anthropic()

response = client.messages.count_tokens(
    model="claude-opus-5-5",
    thinking={"type": "adaptive"},
    messages=[\
        {\
            "role": "user",\
            "content": "Are there an infinite number of prime numbers such that n mod 4 == 3?",\
        },\
        {\
            "role": "assistant",\
            "content": [\
                {\
                    "type": "thinking",\
                    "thinking": "This is a nice number theory question. Let's think about it step by step...",\
                    "signature": "EuYBCkQYAiJAgCs1le6/Pol5Z4/JMomVOouGrWdhYNsH3ukzUECbB6iWrSQtsQuRHJID6lWV...",\
                },\
                {\
                    "type": "text",\
                    "text": "Yes, there are infinitely many prime numbers p such that p mod 4 = 3...",\
                },\
            ],\
        },\
        {"role": "user", "content": "Can you write a formal proof?"},\
    ],
)

print(response.json())
```

Output



```
{ "input_tokens": 88 }
```

### Count tokens in messages with PDFs

cURLCLIPythonTypeScriptC#GoJavaPHPRuby



```
import base64
import anthropic

client = anthropic.Anthropic()

with open("/path/to/document.pdf", "rb") as pdf_file:
    pdf_base64 = base64.standard_b64encode(pdf_file.read()).decode("utf-8")

response = client.messages.count_tokens(
    model="claude-opus-5-5",
    messages=[\
        {\
            "role": "user",\
            "content": [\
                {\
                    "type": "document",\
                    "source": {\
                        "type": "base64",\
                        "media_type": "application/pdf",\
                        "data": pdf_base64,\
                    },\
                },\
                {"type": "text", "text": "Please summarize this document."},\
            ],\
        }\
    ],
)

print(response.json())
```

Output



```
{ "input_tokens": 2188 }
```

* * *

## Token counts on Claude Fable and Claude Mythos models

Claude Fable 5.1, Claude Mythos 5.1, Claude Fable 5, and Claude Mythos 5 share the tokenizer introduced with Claude Opus 4.7. A prompt counts the same on all four, and roughly 30 percent higher than on models before Claude Opus 4.7 (the exact increase depends on the content). The token counting endpoint counts under the tokenizer of the `model` you pass. To measure the difference for your workload, count the same request twice, once with your current model and once with the model you plan to move to, and compare the two `input_tokens` values.

* * *

## Pricing and rate limits

Token counting is **free to use** but subject to requests per minute rate limits based on your [usage tier](https://platform.claude.com/docs/en/api/rate-limits#rate-limits). If you need higher limits, use **Request rate limit increase** on the [Rate limits](https://platform.claude.com/settings/limits) page.

| Usage tier | Requests per minute (RPM) |
| --- | --- |
| Start | 5,000 |
| Build | 10,000 |
| Scale | 20,000 |

* * *

## FAQ

### Does token counting use prompt caching?

No, token counting provides an estimate without using caching logic. Although you may provide `cache_control` blocks in your token counting request, prompt caching only occurs during actual message creation.

* * *

## Next steps



[Count message tokens](https://platform.claude.com/docs/en/api/messages/count_tokens)

Read the full API reference for the token counting endpoint.



[Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)

Use token counts to keep prompts within a model's context window.



[Rate limits](https://platform.claude.com/docs/en/api/rate-limits)

Check token counts before you send a request to stay within your usage tier.



[Prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)

Reduce cost and latency on repeated prompts by caching prompt prefixes.

## Compatibility

Supported platforms

- Claude API
- Claude Platform on AWS
- Amazon Bedrock
- Google Cloud
- Microsoft Foundry

Was this page helpful?



Token counting

Ask Docs
