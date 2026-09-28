---
url: https://docs.ollama.com/api/tags
retrieved: 2026-09-26
command: firecrawl scrape https://docs.ollama.com/api/tags --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: List models - Ollama
---
> ## Documentation Index
>
> Fetch the complete documentation index at: [/llms.txt](https://docs.ollama.com/llms.txt)
>
> Use this file to discover all available pages before exploring further.

[Skip to main content](https://docs.ollama.com/api/tags#content-area)

[Guide](https://docs.ollama.com/) [Integrations](https://docs.ollama.com/integrations) [API Reference](https://docs.ollama.com/api/introduction)

GET

/

api

/

tags

List models

cURL

```
curl http://localhost:11434/api/tags
```

200

```
{
  "models": [\
    {\
      "name": "gemma4",\
      "model": "gemma4",\
      "modified_at": "2025-10-03T23:34:03.409490317-07:00",\
      "size": 9608350245,\
      "digest": "c6eb396dbd5992bbe3f5cdb947e8bbc0ee413d7c17e2beaae69f5d569cf982eb",\
      "details": {\
        "format": "gguf",\
        "family": "gemma4",\
        "families": [\
          "gemma4"\
        ],\
        "parameter_size": "8.0B",\
        "quantization_level": "Q4_K_M"\
      }\
    }\
  ]
}
```

#### Response

200 - application/json

List available models

[​](https://docs.ollama.com/api/tags#response-models)

models

object\[\]

Showchild attributes

Ctrl+I

List models

cURL

```
curl http://localhost:11434/api/tags
```

200

```
{
  "models": [\
    {\
      "name": "gemma4",\
      "model": "gemma4",\
      "modified_at": "2025-10-03T23:34:03.409490317-07:00",\
      "size": 9608350245,\
      "digest": "c6eb396dbd5992bbe3f5cdb947e8bbc0ee413d7c17e2beaae69f5d569cf982eb",\
      "details": {\
        "format": "gguf",\
        "family": "gemma4",\
        "families": [\
          "gemma4"\
        ],\
        "parameter_size": "8.0B",\
        "quantization_level": "Q4_K_M"\
      }\
    }\
  ]
}
```
