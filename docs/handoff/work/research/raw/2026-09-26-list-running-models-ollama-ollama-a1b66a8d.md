---
url: https://docs.ollama.com/api/ps
retrieved: 2026-09-26
command: firecrawl scrape https://docs.ollama.com/api/ps --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: List running models - Ollama
---
> ## Documentation Index
>
> Fetch the complete documentation index at: [/llms.txt](https://docs.ollama.com/llms.txt)
>
> Use this file to discover all available pages before exploring further.

[Skip to main content](https://docs.ollama.com/api/ps#content-area)

[Guide](https://docs.ollama.com/) [Integrations](https://docs.ollama.com/integrations) [API Reference](https://docs.ollama.com/api/introduction)

GET

/

api

/

ps

List running models

cURL

```
curl http://localhost:11434/api/ps
```

200

```
{
  "models": [\
    {\
      "name": "gemma4",\
      "model": "gemma4",\
      "size": 6591830464,\
      "digest": "c6eb396dbd5992bbe3f5cdb947e8bbc0ee413d7c17e2beaae69f5d569cf982eb",\
      "details": {\
        "parent_model": "",\
        "format": "gguf",\
        "family": "gemma4",\
        "families": [\
          "gemma4"\
        ],\
        "parameter_size": "8.0B",\
        "quantization_level": "Q4_K_M"\
      },\
      "expires_at": "2025-10-17T16:47:07.93355-07:00",\
      "size_vram": 5333539264,\
      "context_length": 4096\
    }\
  ]
}
```

#### Response

200 - application/json

Models currently loaded into memory

[​](https://docs.ollama.com/api/ps#response-models)

models

object\[\]

Currently running models

Showchild attributes

Ctrl+I

List running models

cURL

```
curl http://localhost:11434/api/ps
```

200

```
{
  "models": [\
    {\
      "name": "gemma4",\
      "model": "gemma4",\
      "size": 6591830464,\
      "digest": "c6eb396dbd5992bbe3f5cdb947e8bbc0ee413d7c17e2beaae69f5d569cf982eb",\
      "details": {\
        "parent_model": "",\
        "format": "gguf",\
        "family": "gemma4",\
        "families": [\
          "gemma4"\
        ],\
        "parameter_size": "8.0B",\
        "quantization_level": "Q4_K_M"\
      },\
      "expires_at": "2025-10-17T16:47:07.93355-07:00",\
      "size_vram": 5333539264,\
      "context_length": 4096\
    }\
  ]
}
```
