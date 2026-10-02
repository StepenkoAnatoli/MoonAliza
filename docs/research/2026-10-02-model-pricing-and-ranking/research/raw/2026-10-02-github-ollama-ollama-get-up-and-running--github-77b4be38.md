---
url: https://github.com/ollama/ollama
retrieved: 2026-10-02
command: firecrawl scrape https://github.com/ollama/ollama --only-main-content --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: GitHub - ollama/ollama: Get up and running with Kimi, GLM, MiniMax, DeepSeek, gpt-oss, Qwen, Gemma and other models. · GitHub
---
[Skip to content](https://github.com/ollama/ollama#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/ollama/ollama) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/ollama/ollama) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/ollama/ollama) to refresh your session.Dismiss alert

{{ message }}

[ollama](https://github.com/ollama)/ **[ollama](https://github.com/ollama/ollama)** Public

- [Notifications](https://github.com/login?return_to=%2Follama%2Follama) You must be signed in to change notification settings
- [Fork\\
18.1k](https://github.com/login?return_to=%2Follama%2Follama)
- [Star\\
182k](https://github.com/login?return_to=%2Follama%2Follama)


main

[**465** Branches](https://github.com/ollama/ollama/branches) [**678** Tags](https://github.com/ollama/ollama/tags)

[Go to Branches page](https://github.com/ollama/ollama/branches)[Go to Tags page](https://github.com/ollama/ollama/tags)

Go to file

Code

Open more actions menu

## Latest commit

[![dhiltgen](https://avatars.githubusercontent.com/u/4033016?v=4&size=40)](https://github.com/dhiltgen)[dhiltgen](https://github.com/ollama/ollama/commits?author=dhiltgen)

[ci: fix missing build context (](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce) [#18742](https://github.com/ollama/ollama/pull/18742) [)](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce)

pending

15 hours agoOct 2, 2026

[b0c1ca4](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce) · 15 hours agoOct 2, 2026

## History

[5,806 Commits](https://github.com/ollama/ollama/commits/main/)

Open commit details

[View commit history for this file.](https://github.com/ollama/ollama/commits/main/) 5,806 Commits

## Folders and files

| Name | Name | Last commit message | Last commit date |
| --- | --- | --- | --- |
| [.github](https://github.com/ollama/ollama/tree/main/.github ".github") | [.github](https://github.com/ollama/ollama/tree/main/.github ".github") | [ci: fix missing build context (](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce "ci: fix missing build context (#18742)") [#18742](https://github.com/ollama/ollama/pull/18742) [)](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce "ci: fix missing build context (#18742)") | 15 hours agoOct 2, 2026 |
| [anthropic](https://github.com/ollama/ollama/tree/main/anthropic "anthropic") | [anthropic](https://github.com/ollama/ollama/tree/main/anthropic "anthropic") | [api: expose model thinking levels and defaults (](https://github.com/ollama/ollama/commit/d0c8cdb795d4640890d87c146d674cc311df4138 "api: expose model thinking levels and defaults (#18473)") [#18473](https://github.com/ollama/ollama/pull/18473) [)](https://github.com/ollama/ollama/commit/d0c8cdb795d4640890d87c146d674cc311df4138 "api: expose model thinking levels and defaults (#18473)") | 2 weeks agoSep 18, 2026 |
| [api](https://github.com/ollama/ollama/tree/main/api "api") | [api](https://github.com/ollama/ollama/tree/main/api "api") | [create: support explicit model capabilities (](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") [#18708](https://github.com/ollama/ollama/pull/18708) [)](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") | 3 days agoSep 29, 2026 |
| [app](https://github.com/ollama/ollama/tree/main/app "app") | [app](https://github.com/ollama/ollama/tree/main/app "app") | [app: isolate cloud-setting tests from Windows user config (](https://github.com/ollama/ollama/commit/5f4b01e638db6461d1cb58776aaed7c233059388 "app: isolate cloud-setting tests from Windows user config (#18626)  Set USERPROFILE alongside HOME in both cloud-setting handler tests. On Windows, os.UserHomeDir uses USERPROFILE, so the tests could write to the developer's real server.json and leave cloud disabled.") [#18626](https://github.com/ollama/ollama/pull/18626) [)](https://github.com/ollama/ollama/commit/5f4b01e638db6461d1cb58776aaed7c233059388 "app: isolate cloud-setting tests from Windows user config (#18626)  Set USERPROFILE alongside HOME in both cloud-setting handler tests. On Windows, os.UserHomeDir uses USERPROFILE, so the tests could write to the developer's real server.json and leave cloud disabled.") | last weekSep 24, 2026 |
| [auth](https://github.com/ollama/ollama/tree/main/auth "auth") | [auth](https://github.com/ollama/ollama/tree/main/auth "auth") | [auth: fix problems with the ollama keypairs (](https://github.com/ollama/ollama/commit/64883e3c4c0238dc70fddcc456af569d1489415d "auth: fix problems with the ollama keypairs (#12373)  * auth: fix problems with the ollama keypairs  This change adds several fixes including:   - reading in the pubkey files correctly   - fixing the push unit test to create a keypair file in a temp directory   - not return 500 errors for normal status error") [#12373](https://github.com/ollama/ollama/pull/12373) [)](https://github.com/ollama/ollama/commit/64883e3c4c0238dc70fddcc456af569d1489415d "auth: fix problems with the ollama keypairs (#12373)  * auth: fix problems with the ollama keypairs  This change adds several fixes including:   - reading in the pubkey files correctly   - fixing the push unit test to create a keypair file in a temp directory   - not return 500 errors for normal status error") | last yearSep 23, 2025 |
| [cmake](https://github.com/ollama/ollama/tree/main/cmake "cmake") | [cmake](https://github.com/ollama/ollama/tree/main/cmake "cmake") | [mlxrunner: Update XGrammar to 0.2.7 for structured outputs](https://github.com/ollama/ollama/commit/b2da9e468af2479058ae18c6d908ed29de410684 "mlxrunner: Update XGrammar to 0.2.7 for structured outputs  We pick up schema fixes for typed dictionary values and short arrays.") | last weekSep 23, 2026 |
| [cmd](https://github.com/ollama/ollama/tree/main/cmd "cmd") | [cmd](https://github.com/ollama/ollama/tree/main/cmd "cmd") | [create: support explicit model capabilities (](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") [#18708](https://github.com/ollama/ollama/pull/18708) [)](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") | 3 days agoSep 29, 2026 |
| [create](https://github.com/ollama/ollama/tree/main/create "create") | [create](https://github.com/ollama/ollama/tree/main/create "create") | [create: support explicit model capabilities (](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") [#18708](https://github.com/ollama/ollama/pull/18708) [)](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") | 3 days agoSep 29, 2026 |
| [decision](https://github.com/ollama/ollama/tree/main/decision "decision") | [decision](https://github.com/ollama/ollama/tree/main/decision "decision") | [models: add clef support (](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") [#18741](https://github.com/ollama/ollama/pull/18741) [)](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") | 17 hours agoOct 1, 2026 |
| [discover](https://github.com/ollama/ollama/tree/main/discover "discover") | [discover](https://github.com/ollama/ollama/tree/main/discover "discover") | [Clean up dead code (](https://github.com/ollama/ollama/commit/68793119dffb39b43b2f966bedba359dcdead5e3 "Clean up dead code (#17381)  Largely from the llama-server work.") [#17381](https://github.com/ollama/ollama/pull/17381) [)](https://github.com/ollama/ollama/commit/68793119dffb39b43b2f966bedba359dcdead5e3 "Clean up dead code (#17381)  Largely from the llama-server work.") | 2 months agoAug 27, 2026 |
| [docs](https://github.com/ollama/ollama/tree/main/docs "docs") | [docs](https://github.com/ollama/ollama/tree/main/docs "docs") | [models: add clef support (](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") [#18741](https://github.com/ollama/ollama/pull/18741) [)](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") | 17 hours agoOct 1, 2026 |
| [envconfig](https://github.com/ollama/ollama/tree/main/envconfig "envconfig") | [envconfig](https://github.com/ollama/ollama/tree/main/envconfig "envconfig") | [create: add server-side MLX imports and drop GGUF conversion (](https://github.com/ollama/ollama/commit/98acec40ae2b3ed361fc5117e5b2ae81a4bf5c18 "create: add server-side MLX imports and drop GGUF conversion (#14969)  * create: add server-side MLX imports and drop GGUF conversion  Support safetensors imports through the MLX create pipeline both locally and on the server, including remote upload/staging, draft layer handling, cancellation propagation, transfer limits, and shared manifest/blob writing.  Limit GGUF create to wrapping existing GGUF inputs into Ollama manifests. Remove the in-tree safetensors-to-GGUF converter, server quantization path, and converter-only dependencies so GGUF conversion and quantization stay in llama.cpp tooling.  Keep the MLX path focused on supported safetensors model creation with validation before MLX work, and expose that flow without the --experimental CLI gate.  * address comments  * add client side gguf create fast path  * address comments  * rebase adjustments") [#14969](https://github.com/ollama/ollama/pull/14969) [)](https://github.com/ollama/ollama/commit/98acec40ae2b3ed361fc5117e5b2ae81a4bf5c18 "create: add server-side MLX imports and drop GGUF conversion (#14969)  * create: add server-side MLX imports and drop GGUF conversion  Support safetensors imports through the MLX create pipeline both locally and on the server, including remote upload/staging, draft layer handling, cancellation propagation, transfer limits, and shared manifest/blob writing.  Limit GGUF create to wrapping existing GGUF inputs into Ollama manifests. Remove the in-tree safetensors-to-GGUF converter, server quantization path, and converter-only dependencies so GGUF conversion and quantization stay in llama.cpp tooling.  Keep the MLX path focused on supported safetensors model creation with validation before MLX work, and expose that flow without the --experimental CLI gate.  * address comments  * add client side gguf create fast path  * address comments  * rebase adjustments") | 3 weeks agoSep 15, 2026 |
| [format](https://github.com/ollama/ollama/tree/main/format "format") | [format](https://github.com/ollama/ollama/tree/main/format "format") | [chore(all): replace instances of interface with any (](https://github.com/ollama/ollama/commit/9876c9faa41c7dd7143fa47727520d353559f81b "chore(all): replace instances of interface with any (#10067)  Both interface{} and any (which is just an alias for interface{} introduced in Go 1.18) represent the empty interface that all types satisfy.") [#10067](https://github.com/ollama/ollama/pull/10067) [)](https://github.com/ollama/ollama/commit/9876c9faa41c7dd7143fa47727520d353559f81b "chore(all): replace instances of interface with any (#10067)  Both interface{} and any (which is just an alias for interface{} introduced in Go 1.18) represent the empty interface that all types satisfy.") | last yearApr 2, 2025 |
| [fs](https://github.com/ollama/ollama/tree/main/fs "fs") | [fs](https://github.com/ollama/ollama/tree/main/fs "fs") | [mlx, mlxrunner: move the MLX engine out of x/](https://github.com/ollama/ollama/commit/2e036e7cdf7baccca93045a2e313b5d8d7730ae9 "mlx, mlxrunner: move the MLX engine out of x/  The MLX runner is the only Go inference runner left and is no longer experimental, so its packages leave x/. The bindings become a top-level mlx package beside the carried patches in mlx/compat, mirroring how llama/ holds the llama.cpp integration, and the runner becomes mlxrunner with the architectures nested under the package they implement. Subpackages move with their parent unless listed.    x/mlxrunner/mlx            mlx   x/internal/mlxthread       mlx/mlxthread   x/internal/mlxthreadtest   mlx/mlxthread/mlxthreadtest   x/internal/mlxtest         mlx/mlxtest   x/quant                    mlx/quant   mlx/compat/*.patch         mlx/compat/mlx-c   (MLX patches go in mlx/compat/mlx)   x/mlxrunner                mlxrunner   x/models/nn                mlxrunner/nn   x/models/<arch>            mlxrunner/model/<arch>   x/mlxrunner/imports.go     mlxrunner/model/architectures   (new package)   x/create                   create   x/safetensors              fs/safetensors   x/tokenizer                mlxrunner/tokenizer  Every package keeps its name, so the Go changes are the import path rewrites the moves force, and the CMake, Dockerfile, CI cache keys, drift check and Darwin payload script follow the new paths. Four edits are not paths: the runner's blank architecture imports become the package mlxrunner/model/architectures, so the list to extend for a new model sits beside the architecture directories; a depguard rule keeps the two test harnesses out of non-test code, as the x/internal placement used to; the CI change filter's two entries for the long-deleted x/imagegen/mlx now name the bindings' CMake project and the carried patches, so a change to either builds the payload; and the tokenizer parity test reads its fixtures from its own testdata instead of walking out of x/.  x/server and x/imagegen/manifest stay for the next two commits.") | 2 weeks agoSep 16, 2026 |
| [harmony](https://github.com/ollama/ollama/tree/main/harmony "harmony") | [harmony](https://github.com/ollama/ollama/tree/main/harmony "harmony") | [parsers: report the strings that end a response's thinking](https://github.com/ollama/ollama/commit/a9d8953ab0edce75eeaf6e5f5ce84c9b40d92c37 "parsers: report the strings that end a response's thinking  A format on a thinking model has to leave the thinking free and constrain only the content after it, so whatever enforces the format needs to know where the thinking ends. Today the server guesses whether a parser's response starts inside thinking from the think value alone, which is wrong for parsers whose default differs, and it has no way to learn the closing string at all.  Each parser now answers ThinkingClose after Init: the strings any of which ends the thinking its response begins with, or none when the response starts in content because thinking is off, an assistant prefill continues content, or the parser suppresses thinking for tools. Parsers whose models open a new message before content end the thinking at that message's header. Nothing consumes the answer yet.") | last weekSep 22, 2026 |
| [integration](https://github.com/ollama/ollama/tree/main/integration "integration") | [integration](https://github.com/ollama/ollama/tree/main/integration "integration") | [mlx, mlxrunner: move the MLX engine out of x/](https://github.com/ollama/ollama/commit/2e036e7cdf7baccca93045a2e313b5d8d7730ae9 "mlx, mlxrunner: move the MLX engine out of x/  The MLX runner is the only Go inference runner left and is no longer experimental, so its packages leave x/. The bindings become a top-level mlx package beside the carried patches in mlx/compat, mirroring how llama/ holds the llama.cpp integration, and the runner becomes mlxrunner with the architectures nested under the package they implement. Subpackages move with their parent unless listed.    x/mlxrunner/mlx            mlx   x/internal/mlxthread       mlx/mlxthread   x/internal/mlxthreadtest   mlx/mlxthread/mlxthreadtest   x/internal/mlxtest         mlx/mlxtest   x/quant                    mlx/quant   mlx/compat/*.patch         mlx/compat/mlx-c   (MLX patches go in mlx/compat/mlx)   x/mlxrunner                mlxrunner   x/models/nn                mlxrunner/nn   x/models/<arch>            mlxrunner/model/<arch>   x/mlxrunner/imports.go     mlxrunner/model/architectures   (new package)   x/create                   create   x/safetensors              fs/safetensors   x/tokenizer                mlxrunner/tokenizer  Every package keeps its name, so the Go changes are the import path rewrites the moves force, and the CMake, Dockerfile, CI cache keys, drift check and Darwin payload script follow the new paths. Four edits are not paths: the runner's blank architecture imports become the package mlxrunner/model/architectures, so the list to extend for a new model sits beside the architecture directories; a depguard rule keeps the two test harnesses out of non-test code, as the x/internal placement used to; the CI change filter's two entries for the long-deleted x/imagegen/mlx now name the bindings' CMake project and the carried patches, so a change to either builds the payload; and the tokenizer parity test reads its fixtures from its own testdata instead of walking out of x/.  x/server and x/imagegen/manifest stay for the next two commits.") | 2 weeks agoSep 16, 2026 |
| [internal](https://github.com/ollama/ollama/tree/main/internal "internal") | [internal](https://github.com/ollama/ollama/tree/main/internal "internal") | [api: expose model thinking levels and defaults (](https://github.com/ollama/ollama/commit/d0c8cdb795d4640890d87c146d674cc311df4138 "api: expose model thinking levels and defaults (#18473)") [#18473](https://github.com/ollama/ollama/pull/18473) [)](https://github.com/ollama/ollama/commit/d0c8cdb795d4640890d87c146d674cc311df4138 "api: expose model thinking levels and defaults (#18473)") | 2 weeks agoSep 18, 2026 |
| [llama](https://github.com/ollama/ollama/tree/main/llama "llama") | [llama](https://github.com/ollama/ollama/tree/main/llama "llama") | [models: add clef support (](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") [#18741](https://github.com/ollama/ollama/pull/18741) [)](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") | 17 hours agoOct 1, 2026 |
| [llm](https://github.com/ollama/ollama/tree/main/llm "llm") | [llm](https://github.com/ollama/ollama/tree/main/llm "llm") | [models: add clef support (](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") [#18741](https://github.com/ollama/ollama/pull/18741) [)](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") | 17 hours agoOct 1, 2026 |
| [logutil](https://github.com/ollama/ollama/tree/main/logutil "logutil") | [logutil](https://github.com/ollama/ollama/tree/main/logutil "logutil") | [runner: Remove CGO engines, use llama-server exclusively for GGML mod…](https://github.com/ollama/ollama/commit/9db4bdbad6a4981ad761aa2b603e69e8fb83212c "runner: Remove CGO engines, use llama-server exclusively for GGML models (#16031)  * broad lint fixes to sidestep CI scope glitch  * runner: Remove CGO engines, use llama-server exclusively for GGML models  Remove the vendored GGML and llama.cpp backend, CGO runner, Go model implementations, and sample.  llama-server (built from upstream llama.cpp via FetchContent) is now the sole inference engine for GGUF-based models. (Safetensor based models continue to run on the new MLX engine.)  This allows us to more rapidly pick up new capabilities and fixes from llama.cpp as they come out.  On windows this now requires recent AMD driver versions to support ROCm v7 as llama.cpp currently does not support building against v6.  * llama/compat: load Ollama-format GGUFs in llama-server  Squashed from upstream/jmorganca/llama-compat on 2026-04-29. Source tip: 0c33775d378511a9b3c7f2e3b80eda355511d9f3.  Original source commits: - 25223160d llama/compat: add in-memory shim so llama-server can load Ollama-format GGUFs - 7449b539a llm,server: route Ollama-format gemma3 blobs through llama/compat - 436f2e2b1 llama/compat: make patch-apply idempotent - 8c2c9d4c8 llama/compat: extend gemma3 handler to cover 1B and 270M blobs - 021389f7b llama/compat: shrink clip.cpp injection from 18 lines to 1 - 61b367ec2 llama/compat: shrink patch to pure call-site hooks (34 -> 20 lines) - 36049361c llama/compat: simplify shim (gemma3-tested) - 8fa664865 llama/compat: add qwen35moe text handler - db0c74530 llama/compat: add qwen35moe vision (clip) support - 2a388da77 llama/compat: split shared infra into a util TU - 9a69a17dc llama/compat: document non-public API dependencies - d0f38a915 llama/compat: add gpt-oss and lfm2 handlers - 086071822 llama/compat: add mistral3 text handler (vision TODO) - 63bde9ff7 llama/compat: add mistral3 vision (clip) support - 3a57b89d5 llama/compat: apply LLaMA RoPE permute to mistral3 vision Q/K - 99cb87439 llama/compat: add qwen35, gemma4, deepseek-ocr handlers - 2c7850dba llama/compat: add nemotron_h_moe handler (latent FFN + MTP skip) - 9e3b54225 llama/compat: add llama4 text + clip handlers - 034fee349 llama/compat: add gemma4 clip handler (gemma4v projector) - 9945c5a93 server: remove dhiltgen/* compat redirect table - 5d4539101 llama/compat: rewrite gemma4 tokenizer model to BPE - 7e0765327 llama/compat: add glm-ocr text handler + text-loader load-op hook - f1bd1a25a llama/compat: add glm-ocr clip handler (glm4v projector) - 4b5cf3420 llama/compat: collapse text-loader hook back to one new patch line - eb4ecf4fc llama/compat: extend gemma4 clip handler to gemma4a (audio) - a23a5e76f llama/compat: fix gemma4a per-block norm tensor mapping - cd2dcaff4 llama/compat: add embeddinggemma handler - 1ce8a6b26 llama/compat: add qwen3-vl + qwen2.5-vl handlers - fd98ffa1e llama/compat: add gemma3n + glm4moelite handlers - cc7bdf0bc llama/compat: handle null buft in maybe_load_tensor - 0c33775d3 llama/compat: disable mmap when load_op transforms text-side tensors  * refine implementation  * ci: fix windows MLX build  * ci: fix windows llama-server build  * ci: fix windows rocm build  * ci: windows mlx tuning  Shorten long-tail on build, and get OllamaSetup.exe back under 2g limit  * ci: fix windows dependencies  * win: fix dependency gathering  * disable openmp  * win: arm64 cross-compile build  also DRY out CI steps  * scheduler improvements  * ci: improvements from #15982  * win: favor ninja for faster developer builds  * win: fix build  * win: fix arm64 cross-compile  * win: avoid spaces in compiler path  * misc discovery fixes, and bos handling  * lint fixes  * win: fix arm cross-compile build/CI bugs  * llama.cpp update  * win: handle multiple CRT dirs  * vulkan: add windows iGPU detection  * fix creation bugs for patched models, other refactoring work  * tune batch size for better performance  * ci and lint fixes  * fix repeat_last_n bug  * build: revamp build for better developer UX  * amd, sampler, qwen3next fixes  * version bump  * fix mlx build  * revamp GPU discovery  Scanning the output of llama-server is turning out to be too error prone across llama.cpp updates, so this switches to a thin dynamic library load against the bundled GGML libraries so more details can be gathered from the API.  * version bump  * missing file  * ci: fix cache miss on rocm build  * refine vulkan dep handling  * fix ps reporting bug on full GPU load  * improve cmake wiring for customized local builds  * version bump  * docker build arg cleanup  * improve windows exit error logs  * fix community gemma4 support and ci flakes  * fix mlx unit test  * tighten up ps logic to avoid double counting fit log lines  * version bump  * fix ps view for full gpu layer offload  * add MTP wiring for llama-server and create with GGUFs  * pick best template by capabilities  * version bump  * ci: harden apt repos  * remove unused cpu core discovery  * adjust batch default logic to reduce OOMs  * support larger tool calls  * fix audio support, template show  * qwen35 mtp patch support  * flesh out dtypes  * rocm deps  * version bump  * lint fix  * block broken gfx1150 on windows  * fix qwen3.5 moe mtp tensors in patch  * mmproj oom fallback and vulkan on by default  * qwen MTP compat fix  * version bump  * ci: fix WoA cross-compile  * ci: workaround ui tool in cross-compile  * version bump  * win: enable OpenMP for CPU builds  * build: improve developer UX  * ci: windows path workaround for CPU build  * win: fix WoA dependencies  * win: fix large offset reads for mmproj patched loads  * version bump  * fix vulkan dup detection  * add OLLAMA_IGPU_ENABLE and largely disable iGPUs by default  * opt-in MTP, win large offset, integraton fixes  * fix unit test scheduler interaction hang  * fix multi-gpu filtering  * version bump  * review comments  * fix thinking level  * fix linux rocm ordering and granite 3.3 template  * version bump  * ci fix - non-shallow MLX checkout  * bypass linux sysfs unit test on windows  ---------  Co-authored-by: jmorganca <jmorganca@gmail.com>") | 5 months agoMay 29, 2026 |
| [manifest](https://github.com/ollama/ollama/tree/main/manifest "manifest") | [manifest](https://github.com/ollama/ollama/tree/main/manifest "manifest") | [mlxrunner: read model manifests through the manifest package](https://github.com/ollama/ollama/commit/d27fde67eada546a96dc00758645322cbe087802 "mlxrunner: read model manifests through the manifest package  The runner and its weight loader read a model's manifest through x/imagegen/manifest, the last piece of the removed image generation engine. It was a hand-rolled copy of the manifest package: its own model name parser with the default registry and namespace spelled out, its own blob path builder, and re-spelled media types, plus a model_index.json reader and other helpers that nothing has called since the engine went.  The manifest package gains the three lookups the runner needs, a config layer by path, its contents, and the tensor layers, and ReadConfigJSON is built on the second of them. The weight loader resolves the model name with the shared parser, which fills in the same defaults the copy did, and locates blobs with BlobsPath. The architectures' calls to read their config.json compile unchanged. x/imagegen is gone.") | 2 weeks agoSep 16, 2026 |
| [middleware](https://github.com/ollama/ollama/tree/main/middleware "middleware") | [middleware](https://github.com/ollama/ollama/tree/main/middleware "middleware") | [feat: allow ten web searches per response (](https://github.com/ollama/ollama/commit/05a7a91dae22d7eebd490fca9cf57a074518706b "feat: allow ten web searches per response (#18602)") [#18602](https://github.com/ollama/ollama/pull/18602) [)](https://github.com/ollama/ollama/commit/05a7a91dae22d7eebd490fca9cf57a074518706b "feat: allow ten web searches per response (#18602)") | 4 days agoSep 28, 2026 |
| [ml](https://github.com/ollama/ollama/tree/main/ml "ml") | [ml](https://github.com/ollama/ollama/tree/main/ml "ml") | [tokenizer, ml: remove dead code](https://github.com/ollama/ollama/commit/bef41f710a7f936e5d40ecb0cdf47606ceacb521 "tokenizer, ml: remove dead code  Several pieces outlived the code that used them. The root tokenizer package implemented the GGUF-side vocabularies for the Go engine and the safetensors-to-GGUF converter; nothing has imported it since the converter went. ml/backend.go held the Go engine's Backend, Context and Tensor interfaces, with fs.Config existing only to be returned from them, and a single CUDA template instance under ml/backend/ggml survived the engine removal along with the gitattributes entries for that tree and the CI change-filter globs for it and for the long-gone llama/llama.cpp. From the image generation engine, an integration test group that no test registers, its build tag, and the StepBar progress widget remained. DeviceInfo.IsBetter has no caller at all.  All of it goes. Tidying the module file drops the regexp2 dependency and leaves protobuf as an indirect requirement. The llama3.2 tokenizer fixtures stay: the MLX runner's tokenizer uses them for its GGML parity test.") | 2 weeks agoSep 16, 2026 |
| [mlx](https://github.com/ollama/ollama/tree/main/mlx "mlx") | [mlx](https://github.com/ollama/ollama/tree/main/mlx "mlx") | [mlx: speed up Qwen 3.8 prompt processing (](https://github.com/ollama/ollama/commit/c0f8da35b2f4fee773b1197f797b6482340acc2f "mlx: speed up Qwen 3.8 prompt processing (#18550)  * mlx: speed up Qwen 3.8 prompt processing  Use MLX's gated-delta kernel for long scans and fold dense MLP global scales into SwiGLU.  * address comments") [#18550](https://github.com/ollama/ollama/pull/18550) [)](https://github.com/ollama/ollama/commit/c0f8da35b2f4fee773b1197f797b6482340acc2f "mlx: speed up Qwen 3.8 prompt processing (#18550)  * mlx: speed up Qwen 3.8 prompt processing  Use MLX's gated-delta kernel for long scans and fold dense MLP global scales into SwiGLU.  * address comments") | last weekSep 23, 2026 |
| [mlxrunner](https://github.com/ollama/ollama/tree/main/mlxrunner "mlxrunner") | [mlxrunner](https://github.com/ollama/ollama/tree/main/mlxrunner "mlxrunner") | [xgrammar: add standalone CMake project for native library (](https://github.com/ollama/ollama/commit/b9cd4b1efbbf7bd1b9d202baafc64f0ebe63970e "xgrammar: add standalone CMake project for native library (#18611)  Move the ollama_xgrammar target into mlxrunner/xgrammar/native so it can be configured on its own against an installed xgrammar. cmake/mlx now adds it as a subdirectory and still uses the pinned xgrammar.") [#18611](https://github.com/ollama/ollama/pull/18611) [)](https://github.com/ollama/ollama/commit/b9cd4b1efbbf7bd1b9d202baafc64f0ebe63970e "xgrammar: add standalone CMake project for native library (#18611)  Move the ollama_xgrammar target into mlxrunner/xgrammar/native so it can be configured on its own against an installed xgrammar. cmake/mlx now adds it as a subdirectory and still uses the pinned xgrammar.") | last weekSep 23, 2026 |
| [model](https://github.com/ollama/ollama/tree/main/model "model") | [model](https://github.com/ollama/ollama/tree/main/model "model") | [parsers: report the strings that end a response's thinking](https://github.com/ollama/ollama/commit/a9d8953ab0edce75eeaf6e5f5ce84c9b40d92c37 "parsers: report the strings that end a response's thinking  A format on a thinking model has to leave the thinking free and constrain only the content after it, so whatever enforces the format needs to know where the thinking ends. Today the server guesses whether a parser's response starts inside thinking from the think value alone, which is wrong for parsers whose default differs, and it has no way to learn the closing string at all.  Each parser now answers ThinkingClose after Init: the strings any of which ends the thinking its response begins with, or none when the response starts in content because thinking is off, an assistant prefill continues content, or the parser suppresses thinking for tools. Parsers whose models open a new message before content end the thinking at that message's header. Nothing consumes the answer yet.") | last weekSep 22, 2026 |
| [openai](https://github.com/ollama/ollama/tree/main/openai "openai") | [openai](https://github.com/ollama/ollama/tree/main/openai "openai") | [bench: use HumanEval patch prompts (](https://github.com/ollama/ollama/commit/16b4376aeadbec58a18b9817d49c37b1b64e33d0 "bench: use HumanEval patch prompts (#17480)  * bench: use code prompts for prompt-token runs  Replace the synthetic word-list prompt with packed HumanEval Python prompts so speculative draft models see code-like continuations.  Keep the benchmark on the chat path, and calibrate -prompt-tokens with untimed chat probes that read PromptEvalCount instead of relying on a separate token-count API.  Each request still gets a nonce prefix to avoid prefix-cache hits while timed epochs measure the chat-rendered workload.  * review comments  * use different windows for each epoch  * add OpenAI API support  * address comments") [#17480](https://github.com/ollama/ollama/pull/17480) [)](https://github.com/ollama/ollama/commit/16b4376aeadbec58a18b9817d49c37b1b64e33d0 "bench: use HumanEval patch prompts (#17480)  * bench: use code prompts for prompt-token runs  Replace the synthetic word-list prompt with packed HumanEval Python prompts so speculative draft models see code-like continuations.  Keep the benchmark on the chat path, and calibrate -prompt-tokens with untimed chat probes that read PromptEvalCount instead of relying on a separate token-count API.  Each request still gets a nonce prefix to avoid prefix-cache hits while timed epochs measure the chat-rendered workload.  * review comments  * use different windows for each epoch  * add OpenAI API support  * address comments") | last weekSep 26, 2026 |
| [parser](https://github.com/ollama/ollama/tree/main/parser "parser") | [parser](https://github.com/ollama/ollama/tree/main/parser "parser") | [create: support explicit model capabilities (](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") [#18708](https://github.com/ollama/ollama/pull/18708) [)](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") | 3 days agoSep 29, 2026 |
| [progress](https://github.com/ollama/ollama/tree/main/progress "progress") | [progress](https://github.com/ollama/ollama/tree/main/progress "progress") | [tokenizer, ml: remove dead code](https://github.com/ollama/ollama/commit/bef41f710a7f936e5d40ecb0cdf47606ceacb521 "tokenizer, ml: remove dead code  Several pieces outlived the code that used them. The root tokenizer package implemented the GGUF-side vocabularies for the Go engine and the safetensors-to-GGUF converter; nothing has imported it since the converter went. ml/backend.go held the Go engine's Backend, Context and Tensor interfaces, with fs.Config existing only to be returned from them, and a single CUDA template instance under ml/backend/ggml survived the engine removal along with the gitattributes entries for that tree and the CI change-filter globs for it and for the long-gone llama/llama.cpp. From the image generation engine, an integration test group that no test registers, its build tag, and the StepBar progress widget remained. DeviceInfo.IsBetter has no caller at all.  All of it goes. Tidying the module file drops the regexp2 dependency and leaves protobuf as an indirect requirement. The llama3.2 tokenizer fixtures stay: the MLX runner's tokenizer uses them for its GGML parity test.") | 2 weeks agoSep 16, 2026 |
| [readline](https://github.com/ollama/ollama/tree/main/readline "readline") | [readline](https://github.com/ollama/ollama/tree/main/readline "readline") | [lint fixes (](https://github.com/ollama/ollama/commit/6bba484f1a8a68e862665604ea6396771807b4a7 "lint fixes (#17897)") [#17897](https://github.com/ollama/ollama/pull/17897) [)](https://github.com/ollama/ollama/commit/6bba484f1a8a68e862665604ea6396771807b4a7 "lint fixes (#17897)") | 2 months agoAug 20, 2026 |
| [scripts](https://github.com/ollama/ollama/tree/main/scripts "scripts") | [scripts](https://github.com/ollama/ollama/tree/main/scripts "scripts") | [build: go deps (](https://github.com/ollama/ollama/commit/205a0426905d45f5ed0d120f3c671e3573e01b41 "build: go deps (#18161)  * build: go deps  Gather go dep licenses  * address comments") [#18161](https://github.com/ollama/ollama/pull/18161) [)](https://github.com/ollama/ollama/commit/205a0426905d45f5ed0d120f3c671e3573e01b41 "build: go deps (#18161)  * build: go deps  Gather go dep licenses  * address comments") | last monthSep 1, 2026 |
| [server](https://github.com/ollama/ollama/tree/main/server "server") | [server](https://github.com/ollama/ollama/tree/main/server "server") | [models: add clef support (](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") [#18741](https://github.com/ollama/ollama/pull/18741) [)](https://github.com/ollama/ollama/commit/e4c0d18eb874f721c9a28371918886878918b1aa "models: add clef support (#18741)") | 17 hours agoOct 1, 2026 |
| [template](https://github.com/ollama/ollama/tree/main/template "template") | [template](https://github.com/ollama/ollama/tree/main/template "template") | [create: add server-side MLX imports and drop GGUF conversion (](https://github.com/ollama/ollama/commit/98acec40ae2b3ed361fc5117e5b2ae81a4bf5c18 "create: add server-side MLX imports and drop GGUF conversion (#14969)  * create: add server-side MLX imports and drop GGUF conversion  Support safetensors imports through the MLX create pipeline both locally and on the server, including remote upload/staging, draft layer handling, cancellation propagation, transfer limits, and shared manifest/blob writing.  Limit GGUF create to wrapping existing GGUF inputs into Ollama manifests. Remove the in-tree safetensors-to-GGUF converter, server quantization path, and converter-only dependencies so GGUF conversion and quantization stay in llama.cpp tooling.  Keep the MLX path focused on supported safetensors model creation with validation before MLX work, and expose that flow without the --experimental CLI gate.  * address comments  * add client side gguf create fast path  * address comments  * rebase adjustments") [#14969](https://github.com/ollama/ollama/pull/14969) [)](https://github.com/ollama/ollama/commit/98acec40ae2b3ed361fc5117e5b2ae81a4bf5c18 "create: add server-side MLX imports and drop GGUF conversion (#14969)  * create: add server-side MLX imports and drop GGUF conversion  Support safetensors imports through the MLX create pipeline both locally and on the server, including remote upload/staging, draft layer handling, cancellation propagation, transfer limits, and shared manifest/blob writing.  Limit GGUF create to wrapping existing GGUF inputs into Ollama manifests. Remove the in-tree safetensors-to-GGUF converter, server quantization path, and converter-only dependencies so GGUF conversion and quantization stay in llama.cpp tooling.  Keep the MLX path focused on supported safetensors model creation with validation before MLX work, and expose that flow without the --experimental CLI gate.  * address comments  * add client side gguf create fast path  * address comments  * rebase adjustments") | 3 weeks agoSep 15, 2026 |
| [thinking](https://github.com/ollama/ollama/tree/main/thinking "thinking") | [thinking](https://github.com/ollama/ollama/tree/main/thinking "thinking") | [create: add server-side MLX imports and drop GGUF conversion (](https://github.com/ollama/ollama/commit/98acec40ae2b3ed361fc5117e5b2ae81a4bf5c18 "create: add server-side MLX imports and drop GGUF conversion (#14969)  * create: add server-side MLX imports and drop GGUF conversion  Support safetensors imports through the MLX create pipeline both locally and on the server, including remote upload/staging, draft layer handling, cancellation propagation, transfer limits, and shared manifest/blob writing.  Limit GGUF create to wrapping existing GGUF inputs into Ollama manifests. Remove the in-tree safetensors-to-GGUF converter, server quantization path, and converter-only dependencies so GGUF conversion and quantization stay in llama.cpp tooling.  Keep the MLX path focused on supported safetensors model creation with validation before MLX work, and expose that flow without the --experimental CLI gate.  * address comments  * add client side gguf create fast path  * address comments  * rebase adjustments") [#14969](https://github.com/ollama/ollama/pull/14969) [)](https://github.com/ollama/ollama/commit/98acec40ae2b3ed361fc5117e5b2ae81a4bf5c18 "create: add server-side MLX imports and drop GGUF conversion (#14969)  * create: add server-side MLX imports and drop GGUF conversion  Support safetensors imports through the MLX create pipeline both locally and on the server, including remote upload/staging, draft layer handling, cancellation propagation, transfer limits, and shared manifest/blob writing.  Limit GGUF create to wrapping existing GGUF inputs into Ollama manifests. Remove the in-tree safetensors-to-GGUF converter, server quantization path, and converter-only dependencies so GGUF conversion and quantization stay in llama.cpp tooling.  Keep the MLX path focused on supported safetensors model creation with validation before MLX work, and expose that flow without the --experimental CLI gate.  * address comments  * add client side gguf create fast path  * address comments  * rebase adjustments") | 3 weeks agoSep 15, 2026 |
| [tools](https://github.com/ollama/ollama/tree/main/tools "tools") | [tools](https://github.com/ollama/ollama/tree/main/tools "tools") | [tools: ignore braces inside JSON strings when detecting tool call end (](https://github.com/ollama/ollama/commit/32a97b7493786e5784e4445e80c1a078c14c255f "tools: ignore braces inside JSON strings when detecting tool call end (#16937)  Parser.done() counted the tag's open/close characters ({}, []) without tracking JSON string context, so a streamed tool call whose string argument value contained a closing brace or bracket (e.g. {\"code\": \"if (x) { y }\"}) was treated as complete too early and flushed to the user as plain text instead of being parsed as a tool call.  findArguments() in the same file already tracks string context; apply the same handling in done() so open/close characters inside string values are ignored.") […](https://github.com/ollama/ollama/pull/16937) | 4 months agoJun 27, 2026 |
| [transfer](https://github.com/ollama/ollama/tree/main/transfer "transfer") | [transfer](https://github.com/ollama/ollama/tree/main/transfer "transfer") | [mlx: bound pull stall retries and let the watchdog interrupt them (](https://github.com/ollama/ollama/commit/cc4069396f3ad2c370c53eed2e4a42ac13adab84 "mlx: bound pull stall retries and let the watchdog interrupt them (#18625)  * transfer: bound stall retries and let the watchdog interrupt them  A download that stalls could never recover. copy derived its own cancellable context, but the request was built from the parent, so cancelling on a stall never reached the in-flight body and the read stayed parked. The stall watchdog could detect a stall it had no way to stop.  Stall retries were also unbounded: they never incremented attempt, so the retry loop had no limit, and because backoff was gated on attempt > 0 they retried with no delay at all.  The request now owns the cancellable context and passes its cancel down to copy, so a stall aborts the read. Stalls get their own retry budget before counting against the limit, and backoff is keyed to every retry rather than only the counted ones.  * move out of x/") [#1…](https://github.com/ollama/ollama/pull/18625) | 4 days agoSep 28, 2026 |
| [types](https://github.com/ollama/ollama/tree/main/types "types") | [types](https://github.com/ollama/ollama/tree/main/types "types") | [create: support explicit model capabilities (](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") [#18708](https://github.com/ollama/ollama/pull/18708) [)](https://github.com/ollama/ollama/commit/b3f78b77328bccc4f5af336d16efee69407dbcb1 "create: support explicit model capabilities (#18708)  Add CAPABILITY declarations to Modelfiles and an additive capabilities field to create requests. Preserve declarations across GGUF and safetensors creation, inheritance, and Modelfile export.  Require decision capability before scheduling System One requests instead of matching Qwen architecture/renderer metadata. Retain main's GGUF-only scoring restriction until the separate MLX runtime work lands.  Extracted from the capability foundation in 36d46a0c3 on system_one_mlx; MLX scoring and manifest-list changes are intentionally separate.") | 3 days agoSep 29, 2026 |
| [version](https://github.com/ollama/ollama/tree/main/version "version") | [version](https://github.com/ollama/ollama/tree/main/version "version") | [add version](https://github.com/ollama/ollama/commit/2c7f956b38153eb0d64c9c38276198b59f8a482e "add version") | 3 years agoAug 22, 2023 |
| [.dockerignore](https://github.com/ollama/ollama/blob/main/.dockerignore ".dockerignore") | [.dockerignore](https://github.com/ollama/ollama/blob/main/.dockerignore ".dockerignore") | [next build (](https://github.com/ollama/ollama/commit/dcfb7a105c455ae8d44a06b3380731d8b1ffcc22 "next build (#8539)  * add build to .dockerignore  * test: only build one arch  * add build to .gitignore  * fix ccache path  * filter amdgpu targets  * only filter if autodetecting  * Don't clobber gpu list for default runner  This ensures the GPU specific environment variables are set properly  * explicitly set CXX compiler for HIP  * Update build_windows.ps1  This isn't complete, but is close.  Dependencies are missing, and it only builds the \"default\" preset.  * build: add ollama subdir  * add .git to .dockerignore  * docs: update development.md  * update build_darwin.sh  * remove unused scripts  * llm: add cwd and build/lib/ollama to library paths  * default DYLD_LIBRARY_PATH to LD_LIBRARY_PATH in runner on macOS  * add additional cmake output vars for msvc  * interim edits to make server detection logic work with dll directories like lib/ollama/cuda_v12  * remove unncessary filepath.Dir, cleanup  * add hardware-specific directory to path  * use absolute server path  * build: linux arm  * cmake install targets  * remove unused files  * ml: visit each library path once  * build: skip cpu variants on arm  * build: install cpu targets  * build: fix workflow  * shorter names  * fix rocblas install  * docs: clean up development.md  * consistent build dir removal in development.md  * silence -Wimplicit-function-declaration build warnings in ggml-cpu  * update readme  * update development readme  * llm: update library lookup logic now that there is one runner (#8587)  * tweak development.md  * update docs  * add windows cuda/rocm tests  ---------  Co-authored-by: jmorganca <jmorganca@gmail.com> Co-authored-by: Daniel Hiltgen <daniel@ollama.com>") [#8539](https://github.com/ollama/ollama/pull/8539) [)](https://github.com/ollama/ollama/commit/dcfb7a105c455ae8d44a06b3380731d8b1ffcc22 "next build (#8539)  * add build to .dockerignore  * test: only build one arch  * add build to .gitignore  * fix ccache path  * filter amdgpu targets  * only filter if autodetecting  * Don't clobber gpu list for default runner  This ensures the GPU specific environment variables are set properly  * explicitly set CXX compiler for HIP  * Update build_windows.ps1  This isn't complete, but is close.  Dependencies are missing, and it only builds the \"default\" preset.  * build: add ollama subdir  * add .git to .dockerignore  * docs: update development.md  * update build_darwin.sh  * remove unused scripts  * llm: add cwd and build/lib/ollama to library paths  * default DYLD_LIBRARY_PATH to LD_LIBRARY_PATH in runner on macOS  * add additional cmake output vars for msvc  * interim edits to make server detection logic work with dll directories like lib/ollama/cuda_v12  * remove unncessary filepath.Dir, cleanup  * add hardware-specific directory to path  * use absolute server path  * build: linux arm  * cmake install targets  * remove unused files  * ml: visit each library path once  * build: skip cpu variants on arm  * build: install cpu targets  * build: fix workflow  * shorter names  * fix rocblas install  * docs: clean up development.md  * consistent build dir removal in development.md  * silence -Wimplicit-function-declaration build warnings in ggml-cpu  * update readme  * update development readme  * llm: update library lookup logic now that there is one runner (#8587)  * tweak development.md  * update docs  * add windows cuda/rocm tests  ---------  Co-authored-by: jmorganca <jmorganca@gmail.com> Co-authored-by: Daniel Hiltgen <daniel@ollama.com>") | last yearJan 29, 2025 |
| [.gitattributes](https://github.com/ollama/ollama/blob/main/.gitattributes ".gitattributes") | [.gitattributes](https://github.com/ollama/ollama/blob/main/.gitattributes ".gitattributes") | [tokenizer, ml: remove dead code](https://github.com/ollama/ollama/commit/bef41f710a7f936e5d40ecb0cdf47606ceacb521 "tokenizer, ml: remove dead code  Several pieces outlived the code that used them. The root tokenizer package implemented the GGUF-side vocabularies for the Go engine and the safetensors-to-GGUF converter; nothing has imported it since the converter went. ml/backend.go held the Go engine's Backend, Context and Tensor interfaces, with fs.Config existing only to be returned from them, and a single CUDA template instance under ml/backend/ggml survived the engine removal along with the gitattributes entries for that tree and the CI change-filter globs for it and for the long-gone llama/llama.cpp. From the image generation engine, an integration test group that no test registers, its build tag, and the StepBar progress widget remained. DeviceInfo.IsBetter has no caller at all.  All of it goes. Tidying the module file drops the regexp2 dependency and leaves protobuf as an indirect requirement. The llama3.2 tokenizer fixtures stay: the MLX runner's tokenizer uses them for its GGML parity test.") | 2 weeks agoSep 16, 2026 |
| [.gitignore](https://github.com/ollama/ollama/blob/main/.gitignore ".gitignore") | [.gitignore](https://github.com/ollama/ollama/blob/main/.gitignore ".gitignore") | [create: Clean up experimental paths, fix create from existing safeten…](https://github.com/ollama/ollama/commit/30fdd229a434cfae409cc07456684315bf95a561 "create:  Clean up experimental paths, fix create from existing safetensor model (#14679)  * create:  Clean up experimental paths  This cleans up the experimental features, and adds both unit and integration test coverage to verify no regressions.  * create: preserve config and layer names when creating from safetensors models  When creating a model FROM an existing safetensors model, ModelFormat, Capabilities, and layer Name fields were lost. ModelFormat stayed empty because it's only set from GGML layers (which safetensors models lack), and layer names weren't copied in parseFromModel. This caused derived models to fail loading (\"config.json not found in manifest\").  * review comments") | 6 months agoApr 7, 2026 |
| [.golangci.yaml](https://github.com/ollama/ollama/blob/main/.golangci.yaml ".golangci.yaml") | [.golangci.yaml](https://github.com/ollama/ollama/blob/main/.golangci.yaml ".golangci.yaml") | [mlx, mlxrunner: move the MLX engine out of x/](https://github.com/ollama/ollama/commit/2e036e7cdf7baccca93045a2e313b5d8d7730ae9 "mlx, mlxrunner: move the MLX engine out of x/  The MLX runner is the only Go inference runner left and is no longer experimental, so its packages leave x/. The bindings become a top-level mlx package beside the carried patches in mlx/compat, mirroring how llama/ holds the llama.cpp integration, and the runner becomes mlxrunner with the architectures nested under the package they implement. Subpackages move with their parent unless listed.    x/mlxrunner/mlx            mlx   x/internal/mlxthread       mlx/mlxthread   x/internal/mlxthreadtest   mlx/mlxthread/mlxthreadtest   x/internal/mlxtest         mlx/mlxtest   x/quant                    mlx/quant   mlx/compat/*.patch         mlx/compat/mlx-c   (MLX patches go in mlx/compat/mlx)   x/mlxrunner                mlxrunner   x/models/nn                mlxrunner/nn   x/models/<arch>            mlxrunner/model/<arch>   x/mlxrunner/imports.go     mlxrunner/model/architectures   (new package)   x/create                   create   x/safetensors              fs/safetensors   x/tokenizer                mlxrunner/tokenizer  Every package keeps its name, so the Go changes are the import path rewrites the moves force, and the CMake, Dockerfile, CI cache keys, drift check and Darwin payload script follow the new paths. Four edits are not paths: the runner's blank architecture imports become the package mlxrunner/model/architectures, so the list to extend for a new model sits beside the architecture directories; a depguard rule keeps the two test harnesses out of non-test code, as the x/internal placement used to; the CI change filter's two entries for the long-deleted x/imagegen/mlx now name the bindings' CMake project and the carried patches, so a change to either builds the payload; and the tokenizer parity test reads its fixtures from its own testdata instead of walking out of x/.  x/server and x/imagegen/manifest stay for the next two commits.") | 2 weeks agoSep 16, 2026 |
| [AGENTS.md](https://github.com/ollama/ollama/blob/main/AGENTS.md "AGENTS.md") | [AGENTS.md](https://github.com/ollama/ollama/blob/main/AGENTS.md "AGENTS.md") | [Add AGENTS.md and CLAUDE.md to root repository (](https://github.com/ollama/ollama/commit/96201a623a62b4434ff434a0a4a6b5b247fce481 "Add AGENTS.md and CLAUDE.md to root repository (#16604)") [#16604](https://github.com/ollama/ollama/pull/16604) [)](https://github.com/ollama/ollama/commit/96201a623a62b4434ff434a0a4a6b5b247fce481 "Add AGENTS.md and CLAUDE.md to root repository (#16604)") | 4 months agoJun 7, 2026 |
| [CLAUDE.md](https://github.com/ollama/ollama/blob/main/CLAUDE.md "CLAUDE.md") | [CLAUDE.md](https://github.com/ollama/ollama/blob/main/CLAUDE.md "CLAUDE.md") | [Add AGENTS.md and CLAUDE.md to root repository (](https://github.com/ollama/ollama/commit/96201a623a62b4434ff434a0a4a6b5b247fce481 "Add AGENTS.md and CLAUDE.md to root repository (#16604)") [#16604](https://github.com/ollama/ollama/pull/16604) [)](https://github.com/ollama/ollama/commit/96201a623a62b4434ff434a0a4a6b5b247fce481 "Add AGENTS.md and CLAUDE.md to root repository (#16604)") | 4 months agoJun 7, 2026 |
| [CMakeLists.txt](https://github.com/ollama/ollama/blob/main/CMakeLists.txt "CMakeLists.txt") | [CMakeLists.txt](https://github.com/ollama/ollama/blob/main/CMakeLists.txt "CMakeLists.txt") | [mlx: fix mac assumptions on linux/windows (](https://github.com/ollama/ollama/commit/4e13421378ca2ac9c879b212980149c71456604f "mlx: fix mac assumptions on linux/windows (#17898)  The default packaging was broken due to mac assumptions leaking into windows") [#17898](https://github.com/ollama/ollama/pull/17898) [)](https://github.com/ollama/ollama/commit/4e13421378ca2ac9c879b212980149c71456604f "mlx: fix mac assumptions on linux/windows (#17898)  The default packaging was broken due to mac assumptions leaking into windows") | 2 months agoAug 20, 2026 |
| [CMakePresets.json](https://github.com/ollama/ollama/blob/main/CMakePresets.json "CMakePresets.json") | [CMakePresets.json](https://github.com/ollama/ollama/blob/main/CMakePresets.json "CMakePresets.json") | [runner: Remove CGO engines, use llama-server exclusively for GGML mod…](https://github.com/ollama/ollama/commit/9db4bdbad6a4981ad761aa2b603e69e8fb83212c "runner: Remove CGO engines, use llama-server exclusively for GGML models (#16031)  * broad lint fixes to sidestep CI scope glitch  * runner: Remove CGO engines, use llama-server exclusively for GGML models  Remove the vendored GGML and llama.cpp backend, CGO runner, Go model implementations, and sample.  llama-server (built from upstream llama.cpp via FetchContent) is now the sole inference engine for GGUF-based models. (Safetensor based models continue to run on the new MLX engine.)  This allows us to more rapidly pick up new capabilities and fixes from llama.cpp as they come out.  On windows this now requires recent AMD driver versions to support ROCm v7 as llama.cpp currently does not support building against v6.  * llama/compat: load Ollama-format GGUFs in llama-server  Squashed from upstream/jmorganca/llama-compat on 2026-04-29. Source tip: 0c33775d378511a9b3c7f2e3b80eda355511d9f3.  Original source commits: - 25223160d llama/compat: add in-memory shim so llama-server can load Ollama-format GGUFs - 7449b539a llm,server: route Ollama-format gemma3 blobs through llama/compat - 436f2e2b1 llama/compat: make patch-apply idempotent - 8c2c9d4c8 llama/compat: extend gemma3 handler to cover 1B and 270M blobs - 021389f7b llama/compat: shrink clip.cpp injection from 18 lines to 1 - 61b367ec2 llama/compat: shrink patch to pure call-site hooks (34 -> 20 lines) - 36049361c llama/compat: simplify shim (gemma3-tested) - 8fa664865 llama/compat: add qwen35moe text handler - db0c74530 llama/compat: add qwen35moe vision (clip) support - 2a388da77 llama/compat: split shared infra into a util TU - 9a69a17dc llama/compat: document non-public API dependencies - d0f38a915 llama/compat: add gpt-oss and lfm2 handlers - 086071822 llama/compat: add mistral3 text handler (vision TODO) - 63bde9ff7 llama/compat: add mistral3 vision (clip) support - 3a57b89d5 llama/compat: apply LLaMA RoPE permute to mistral3 vision Q/K - 99cb87439 llama/compat: add qwen35, gemma4, deepseek-ocr handlers - 2c7850dba llama/compat: add nemotron_h_moe handler (latent FFN + MTP skip) - 9e3b54225 llama/compat: add llama4 text + clip handlers - 034fee349 llama/compat: add gemma4 clip handler (gemma4v projector) - 9945c5a93 server: remove dhiltgen/* compat redirect table - 5d4539101 llama/compat: rewrite gemma4 tokenizer model to BPE - 7e0765327 llama/compat: add glm-ocr text handler + text-loader load-op hook - f1bd1a25a llama/compat: add glm-ocr clip handler (glm4v projector) - 4b5cf3420 llama/compat: collapse text-loader hook back to one new patch line - eb4ecf4fc llama/compat: extend gemma4 clip handler to gemma4a (audio) - a23a5e76f llama/compat: fix gemma4a per-block norm tensor mapping - cd2dcaff4 llama/compat: add embeddinggemma handler - 1ce8a6b26 llama/compat: add qwen3-vl + qwen2.5-vl handlers - fd98ffa1e llama/compat: add gemma3n + glm4moelite handlers - cc7bdf0bc llama/compat: handle null buft in maybe_load_tensor - 0c33775d3 llama/compat: disable mmap when load_op transforms text-side tensors  * refine implementation  * ci: fix windows MLX build  * ci: fix windows llama-server build  * ci: fix windows rocm build  * ci: windows mlx tuning  Shorten long-tail on build, and get OllamaSetup.exe back under 2g limit  * ci: fix windows dependencies  * win: fix dependency gathering  * disable openmp  * win: arm64 cross-compile build  also DRY out CI steps  * scheduler improvements  * ci: improvements from #15982  * win: favor ninja for faster developer builds  * win: fix build  * win: fix arm64 cross-compile  * win: avoid spaces in compiler path  * misc discovery fixes, and bos handling  * lint fixes  * win: fix arm cross-compile build/CI bugs  * llama.cpp update  * win: handle multiple CRT dirs  * vulkan: add windows iGPU detection  * fix creation bugs for patched models, other refactoring work  * tune batch size for better performance  * ci and lint fixes  * fix repeat_last_n bug  * build: revamp build for better developer UX  * amd, sampler, qwen3next fixes  * version bump  * fix mlx build  * revamp GPU discovery  Scanning the output of llama-server is turning out to be too error prone across llama.cpp updates, so this switches to a thin dynamic library load against the bundled GGML libraries so more details can be gathered from the API.  * version bump  * missing file  * ci: fix cache miss on rocm build  * refine vulkan dep handling  * fix ps reporting bug on full GPU load  * improve cmake wiring for customized local builds  * version bump  * docker build arg cleanup  * improve windows exit error logs  * fix community gemma4 support and ci flakes  * fix mlx unit test  * tighten up ps logic to avoid double counting fit log lines  * version bump  * fix ps view for full gpu layer offload  * add MTP wiring for llama-server and create with GGUFs  * pick best template by capabilities  * version bump  * ci: harden apt repos  * remove unused cpu core discovery  * adjust batch default logic to reduce OOMs  * support larger tool calls  * fix audio support, template show  * qwen35 mtp patch support  * flesh out dtypes  * rocm deps  * version bump  * lint fix  * block broken gfx1150 on windows  * fix qwen3.5 moe mtp tensors in patch  * mmproj oom fallback and vulkan on by default  * qwen MTP compat fix  * version bump  * ci: fix WoA cross-compile  * ci: workaround ui tool in cross-compile  * version bump  * win: enable OpenMP for CPU builds  * build: improve developer UX  * ci: windows path workaround for CPU build  * win: fix WoA dependencies  * win: fix large offset reads for mmproj patched loads  * version bump  * fix vulkan dup detection  * add OLLAMA_IGPU_ENABLE and largely disable iGPUs by default  * opt-in MTP, win large offset, integraton fixes  * fix unit test scheduler interaction hang  * fix multi-gpu filtering  * version bump  * review comments  * fix thinking level  * fix linux rocm ordering and granite 3.3 template  * version bump  * ci fix - non-shallow MLX checkout  * bypass linux sysfs unit test on windows  ---------  Co-authored-by: jmorganca <jmorganca@gmail.com>") | 5 months agoMay 29, 2026 |
| [CONTRIBUTING.md](https://github.com/ollama/ollama/blob/main/CONTRIBUTING.md "CONTRIBUTING.md") | [CONTRIBUTING.md](https://github.com/ollama/ollama/blob/main/CONTRIBUTING.md "CONTRIBUTING.md") | [docs: fix typos in repository documentation (](https://github.com/ollama/ollama/commit/dd0ed0ef172cdc270ef062ac764a58780c5c8093 "docs: fix typos in repository documentation (#10683)") [#10683](https://github.com/ollama/ollama/pull/10683) [)](https://github.com/ollama/ollama/commit/dd0ed0ef172cdc270ef062ac764a58780c5c8093 "docs: fix typos in repository documentation (#10683)") | 11 months agoNov 16, 2025 |
| [Dockerfile](https://github.com/ollama/ollama/blob/main/Dockerfile "Dockerfile") | [Dockerfile](https://github.com/ollama/ollama/blob/main/Dockerfile "Dockerfile") | [ci: fix missing build context (](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce "ci: fix missing build context (#18742)") [#18742](https://github.com/ollama/ollama/pull/18742) [)](https://github.com/ollama/ollama/commit/b0c1ca4f7549d7acdfa52a7dcffc934bc63a43ce "ci: fix missing build context (#18742)") | 15 hours agoOct 2, 2026 |
| [LICENSE](https://github.com/ollama/ollama/blob/main/LICENSE "LICENSE") | [LICENSE](https://github.com/ollama/ollama/blob/main/LICENSE "LICENSE") | [`proto` -\> `ollama`](https://github.com/ollama/ollama/commit/df5fdd6647e17a546e4bc66d8730541408cdf8a5 "`proto` -> `ollama`") | 3 years agoJun 26, 2023 |
| [LLAMA\_CPP\_VERSION](https://github.com/ollama/ollama/blob/main/LLAMA_CPP_VERSION "LLAMA_CPP_VERSION") | [LLAMA\_CPP\_VERSION](https://github.com/ollama/ollama/blob/main/LLAMA_CPP_VERSION "LLAMA_CPP_VERSION") | [llama.cpp: version bump b11232 (](https://github.com/ollama/ollama/commit/a8aaf9fcfad23dc8d6f07b8109b1ba5ed310d76c "llama.cpp: version bump b11232 (#18652)") [#18652](https://github.com/ollama/ollama/pull/18652) [)](https://github.com/ollama/ollama/commit/a8aaf9fcfad23dc8d6f07b8109b1ba5ed310d76c "llama.cpp: version bump b11232 (#18652)") | 4 days agoSep 29, 2026 |
| [MLX\_C\_VERSION](https://github.com/ollama/ollama/blob/main/MLX_C_VERSION "MLX_C_VERSION") | [MLX\_C\_VERSION](https://github.com/ollama/ollama/blob/main/MLX_C_VERSION "MLX_C_VERSION") | [MLX, MLX-C: version bump (](https://github.com/ollama/ollama/commit/4ea3472496078e3f8273ddb8aee0d350130c3697 "MLX, MLX-C: version bump (#18449)  Includes quantized matmul corruption fix, which impacts nvfp4 multimodal models (gemma4 vision towers). Deferring wiring up the new MLX-C thread-local stream/sync APIs for now.") [#18449](https://github.com/ollama/ollama/pull/18449) [)](https://github.com/ollama/ollama/commit/4ea3472496078e3f8273ddb8aee0d350130c3697 "MLX, MLX-C: version bump (#18449)  Includes quantized matmul corruption fix, which impacts nvfp4 multimodal models (gemma4 vision towers). Deferring wiring up the new MLX-C thread-local stream/sync APIs for now.") | 3 weeks agoSep 15, 2026 |
| [MLX\_VERSION](https://github.com/ollama/ollama/blob/main/MLX_VERSION "MLX_VERSION") | [MLX\_VERSION](https://github.com/ollama/ollama/blob/main/MLX_VERSION "MLX_VERSION") | [MLX: version bump (](https://github.com/ollama/ollama/commit/6bdccd24e4f882ed3bb27e552c894080bb17d63f "MLX: version bump (#18651)") [#18651](https://github.com/ollama/ollama/pull/18651) [)](https://github.com/ollama/ollama/commit/6bdccd24e4f882ed3bb27e552c894080bb17d63f "MLX: version bump (#18651)") | 4 days agoSep 29, 2026 |
| [README.md](https://github.com/ollama/ollama/blob/main/README.md "README.md") | [README.md](https://github.com/ollama/ollama/blob/main/README.md "README.md") | [launch: add DeepSeek Harness integration (](https://github.com/ollama/ollama/commit/39df91c9826b3c0c83677f75cd230d8848d287c3 "launch: add DeepSeek Harness integration (#17733)") [#17733](https://github.com/ollama/ollama/pull/17733) [)](https://github.com/ollama/ollama/commit/39df91c9826b3c0c83677f75cd230d8848d287c3 "launch: add DeepSeek Harness integration (#17733)") | 2 months agoAug 13, 2026 |
| [SECURITY.md](https://github.com/ollama/ollama/blob/main/SECURITY.md "SECURITY.md") | [SECURITY.md](https://github.com/ollama/ollama/blob/main/SECURITY.md "SECURITY.md") | [docs: fix typos in repository documentation (](https://github.com/ollama/ollama/commit/dd0ed0ef172cdc270ef062ac764a58780c5c8093 "docs: fix typos in repository documentation (#10683)") [#10683](https://github.com/ollama/ollama/pull/10683) [)](https://github.com/ollama/ollama/commit/dd0ed0ef172cdc270ef062ac764a58780c5c8093 "docs: fix typos in repository documentation (#10683)") | 11 months agoNov 16, 2025 |
| [go.mod](https://github.com/ollama/ollama/blob/main/go.mod "go.mod") | [go.mod](https://github.com/ollama/ollama/blob/main/go.mod "go.mod") | [tokenizer, ml: remove dead code](https://github.com/ollama/ollama/commit/bef41f710a7f936e5d40ecb0cdf47606ceacb521 "tokenizer, ml: remove dead code  Several pieces outlived the code that used them. The root tokenizer package implemented the GGUF-side vocabularies for the Go engine and the safetensors-to-GGUF converter; nothing has imported it since the converter went. ml/backend.go held the Go engine's Backend, Context and Tensor interfaces, with fs.Config existing only to be returned from them, and a single CUDA template instance under ml/backend/ggml survived the engine removal along with the gitattributes entries for that tree and the CI change-filter globs for it and for the long-gone llama/llama.cpp. From the image generation engine, an integration test group that no test registers, its build tag, and the StepBar progress widget remained. DeviceInfo.IsBetter has no caller at all.  All of it goes. Tidying the module file drops the regexp2 dependency and leaves protobuf as an indirect requirement. The llama3.2 tokenizer fixtures stay: the MLX runner's tokenizer uses them for its GGML parity test.") | 2 weeks agoSep 16, 2026 |
| [go.sum](https://github.com/ollama/ollama/blob/main/go.sum "go.sum") | [go.sum](https://github.com/ollama/ollama/blob/main/go.sum "go.sum") | [tokenizer, ml: remove dead code](https://github.com/ollama/ollama/commit/bef41f710a7f936e5d40ecb0cdf47606ceacb521 "tokenizer, ml: remove dead code  Several pieces outlived the code that used them. The root tokenizer package implemented the GGUF-side vocabularies for the Go engine and the safetensors-to-GGUF converter; nothing has imported it since the converter went. ml/backend.go held the Go engine's Backend, Context and Tensor interfaces, with fs.Config existing only to be returned from them, and a single CUDA template instance under ml/backend/ggml survived the engine removal along with the gitattributes entries for that tree and the CI change-filter globs for it and for the long-gone llama/llama.cpp. From the image generation engine, an integration test group that no test registers, its build tag, and the StepBar progress widget remained. DeviceInfo.IsBetter has no caller at all.  All of it goes. Tidying the module file drops the regexp2 dependency and leaves protobuf as an indirect requirement. The llama3.2 tokenizer fixtures stay: the MLX runner's tokenizer uses them for its GGML parity test.") | 2 weeks agoSep 16, 2026 |
| [main.go](https://github.com/ollama/ollama/blob/main/main.go "main.go") | [main.go](https://github.com/ollama/ollama/blob/main/main.go "main.go") | [lint](https://github.com/ollama/ollama/commit/b732beba6a919b852539bb344b05e25c6a7c3c90 "lint") | 2 years agoAug 2, 2024 |
| View all files |

## Repository files navigation

[![ollama](https://private-user-images.githubusercontent.com/3325447/254932576-0d0b44e2-8f4a-4e99-9b52-a5c1c741c8f7.png?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3OTA5NTk3NDgsIm5iZiI6MTc5MDk1OTQ0OCwicGF0aCI6Ii8zMzI1NDQ3LzI1NDkzMjU3Ni0wZDBiNDRlMi04ZjRhLTRlOTktOWI1Mi1hNWMxYzc0MWM4ZjcucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI2MTAwMiUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjEwMDJUMTY0NDA4WiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9NzQ5ZmE1OGUyOTYzZjMyOWYyMmIwN2JjY2FkNjFhYmNkNmRmOTExODk3ZTI4Y2JlMGU0OTk3YmI0ZWM2MDI4ZiZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QmcmVzcG9uc2UtY29udGVudC10eXBlPWltYWdlJTJGcG5nIn0.9ocFAwa77TYEX6zTtIYYXCNxoRR9PRc_FcpykqrkgBo)](https://ollama.com/)

# Ollama

[Permalink: Ollama](https://github.com/ollama/ollama#ollama)

Start building with open models.

## Download

[Permalink: Download](https://github.com/ollama/ollama#download)

### macOS

[Permalink: macOS](https://github.com/ollama/ollama#macos)

```
curl -fsSL https://ollama.com/install.sh | sh
```

or [download manually](https://ollama.com/download/Ollama.dmg)

### Windows

[Permalink: Windows](https://github.com/ollama/ollama#windows)

```
irm https://ollama.com/install.ps1 | iex
```

or [download manually](https://ollama.com/download/OllamaSetup.exe)

### Linux

[Permalink: Linux](https://github.com/ollama/ollama#linux)

```
curl -fsSL https://ollama.com/install.sh | sh
```

[Manual install instructions](https://docs.ollama.com/linux#manual-install)

### Docker

[Permalink: Docker](https://github.com/ollama/ollama#docker)

The official [Ollama Docker image](https://hub.docker.com/r/ollama/ollama)`ollama/ollama` is available on Docker Hub.

### Libraries

[Permalink: Libraries](https://github.com/ollama/ollama#libraries)

- [ollama-python](https://github.com/ollama/ollama-python)
- [ollama-js](https://github.com/ollama/ollama-js)

### Community

[Permalink: Community](https://github.com/ollama/ollama#community)

- [Discord](https://discord.gg/ollama)
- [𝕏 (Twitter)](https://x.com/ollama)
- [Reddit](https://reddit.com/r/ollama)

## Get started

[Permalink: Get started](https://github.com/ollama/ollama#get-started)

```
ollama
```

You'll be prompted to run a model or connect Ollama to your existing agents or applications such as `Claude Code`, `OpenClaw`, `OpenCode` , `Codex`, `Copilot`, and more.

### Coding

[Permalink: Coding](https://github.com/ollama/ollama#coding)

To launch a specific integration:

```
ollama launch claude
```

Supported integrations include [Claude Code](https://docs.ollama.com/integrations/claude-code), [Codex](https://docs.ollama.com/integrations/codex), [Copilot CLI](https://docs.ollama.com/integrations/copilot-cli), [DeepSeek Harness](https://docs.ollama.com/integrations/deepseek-harness), [Droid](https://docs.ollama.com/integrations/droid), and [OpenCode](https://docs.ollama.com/integrations/opencode).

### AI assistant

[Permalink: AI assistant](https://github.com/ollama/ollama#ai-assistant)

Use [OpenClaw](https://docs.ollama.com/integrations/openclaw) to turn Ollama into a personal AI assistant across WhatsApp, Telegram, Slack, Discord, and more:

```
ollama launch openclaw
```

### Chat with a model

[Permalink: Chat with a model](https://github.com/ollama/ollama#chat-with-a-model)

Run and chat with [Gemma 4](https://ollama.com/library/gemma4):

```
ollama run gemma4
```

See [ollama.com/library](https://ollama.com/library) for the full list.

See the [quickstart guide](https://docs.ollama.com/quickstart) for more details.

## REST API

[Permalink: REST API](https://github.com/ollama/ollama#rest-api)

Ollama has a REST API for running and managing models.

```
curl http://localhost:11434/api/chat -d '{
  "model": "gemma4",
  "messages": [{\
    "role": "user",\
    "content": "Why is the sky blue?"\
  }],
  "stream": false
}'
```

See the [API documentation](https://docs.ollama.com/api) for all endpoints.

### Python

[Permalink: Python](https://github.com/ollama/ollama#python)

```
pip install ollama
```

```
from ollama import chat

response = chat(model='gemma4', messages=[\
  {\
    'role': 'user',\
    'content': 'Why is the sky blue?',\
  },\
])
print(response.message.content)
```

### JavaScript

[Permalink: JavaScript](https://github.com/ollama/ollama#javascript)

```
npm i ollama
```

```
import ollama from "ollama";

const response = await ollama.chat({
  model: "gemma4",
  messages: [{ role: "user", content: "Why is the sky blue?" }],
});
console.log(response.message.content);
```

## Supported backends

[Permalink: Supported backends](https://github.com/ollama/ollama#supported-backends)

- [llama.cpp](https://github.com/ggml-org/llama.cpp) project founded by Georgi Gerganov.

## Documentation

[Permalink: Documentation](https://github.com/ollama/ollama#documentation)

- [CLI reference](https://docs.ollama.com/cli)
- [REST API reference](https://docs.ollama.com/api)
- [Importing models](https://docs.ollama.com/import)
- [Modelfile reference](https://docs.ollama.com/modelfile)
- [Building from source](https://github.com/ollama/ollama/blob/main/docs/development.md)

## Community Integrations

[Permalink: Community Integrations](https://github.com/ollama/ollama#community-integrations)

> Want to add your project? Open a pull request.

### Chat Interfaces

[Permalink: Chat Interfaces](https://github.com/ollama/ollama#chat-interfaces)

#### Web

[Permalink: Web](https://github.com/ollama/ollama#web)

- [Open WebUI](https://github.com/open-webui/open-webui) \- Extensible, self-hosted AI interface
- [Onyx](https://github.com/onyx-dot-app/onyx) \- Connected AI workspace
- [LibreChat](https://github.com/danny-avila/LibreChat) \- Enhanced ChatGPT clone with multi-provider support
- [Lobe Chat](https://github.com/lobehub/lobe-chat) \- Modern chat framework with plugin ecosystem ( [docs](https://lobehub.com/docs/self-hosting/examples/ollama))
- [NextChat](https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web) \- Cross-platform ChatGPT UI ( [docs](https://docs.nextchat.dev/models/ollama))
- [Perplexica](https://github.com/ItzCrazyKns/Perplexica) \- AI-powered search engine, open-source Perplexity alternative
- [big-AGI](https://github.com/enricoros/big-AGI) \- AI suite for professionals
- [Lollms WebUI](https://github.com/ParisNeo/lollms-webui) \- Multi-model web interface
- [ChatOllama](https://github.com/sugarforever/chat-ollama) \- Chatbot with knowledge bases
- [Bionic GPT](https://github.com/bionic-gpt/bionic-gpt) \- On-premise AI platform
- [Chatbot UI](https://github.com/ivanfioravanti/chatbot-ollama) \- ChatGPT-style web interface
- [Hollama](https://github.com/fmaclen/hollama) \- Minimal web interface
- [Chatbox](https://github.com/Bin-Huang/Chatbox) \- Desktop and web AI client
- [chat](https://github.com/swuecho/chat) \- Chat web app for teams
- [Ollama RAG Chatbot](https://github.com/datvodinh/rag-chatbot.git) \- Chat with multiple PDFs using RAG
- [Tkinter-based client](https://github.com/chyok/ollama-gui) \- Python desktop client

#### Desktop

[Permalink: Desktop](https://github.com/ollama/ollama#desktop)

- [Dify.AI](https://github.com/langgenius/dify) \- LLM app development platform
- [AnythingLLM](https://github.com/Mintplex-Labs/anything-llm) \- All-in-one AI app for Mac, Windows, and Linux
- [Maid](https://github.com/Mobile-Artificial-Intelligence/maid) \- Cross-platform mobile and desktop client
- [Witsy](https://github.com/nbonamy/witsy) \- AI desktop app for Mac, Windows, and Linux
- [Cherry Studio](https://github.com/kangfenmao/cherry-studio) \- Multi-provider desktop client
- [Ollama App](https://github.com/JHubi1/ollama-app) \- Multi-platform client for desktop and mobile
- [PyGPT](https://github.com/szczyglis-dev/py-gpt) \- AI desktop assistant for Linux, Windows, and Mac
- [Alpaca](https://github.com/Jeffser/Alpaca) \- GTK4 client for Linux and macOS
- [SwiftChat](https://github.com/aws-samples/swift-chat) \- Cross-platform including iOS, Android, and Apple Vision Pro
- [Enchanted](https://github.com/AugustDev/enchanted) \- Native macOS and iOS client
- [RWKV-Runner](https://github.com/josStorer/RWKV-Runner) \- Multi-model desktop runner
- [Ollama Grid Search](https://github.com/dezoito/ollama-grid-search) \- Evaluate and compare models
- [macai](https://github.com/Renset/macai) \- macOS client for Ollama and ChatGPT
- [AI Studio](https://github.com/MindWorkAI/AI-Studio) \- Multi-provider desktop IDE
- [Reins](https://github.com/ibrahimcetin/reins) \- Parameter tuning and reasoning model support
- [ConfiChat](https://github.com/1runeberg/confichat) \- Privacy-focused with optional encryption
- [LLocal.in](https://github.com/kartikm7/llocal) \- Electron desktop client
- [MindMac](https://mindmac.app/) \- AI chat client for Mac
- [Msty](https://msty.app/) \- Multi-model desktop client
- [BoltAI for Mac](https://boltai.com/) \- AI chat client for Mac
- [IntelliBar](https://intellibar.app/) \- AI-powered assistant for macOS
- [Kerlig AI](https://www.kerlig.com/) \- AI writing assistant for macOS
- [Hillnote](https://hillnote.com/) \- Markdown-first AI workspace
- [Perfect Memory AI](https://www.perfectmemory.ai/) \- Productivity AI personalized by screen and meeting history

#### Mobile

[Permalink: Mobile](https://github.com/ollama/ollama#mobile)

- [Ollama Android Chat](https://github.com/sunshine0523/OllamaServer) \- One-click Ollama on Android

> SwiftChat, Enchanted, Maid, Ollama App, Reins, and ConfiChat listed above also support mobile platforms.

### Code Editors & Development

[Permalink: Code Editors & Development](https://github.com/ollama/ollama#code-editors--development)

- [Cline](https://github.com/cline/cline) \- VS Code extension for multi-file/whole-repo coding
- [Continue](https://github.com/continuedev/continue) \- Open-source AI code assistant for any IDE
- [Void](https://github.com/voideditor/void) \- Open source AI code editor, Cursor alternative
- [Copilot for Obsidian](https://github.com/logancyang/obsidian-copilot) \- AI assistant for Obsidian
- [twinny](https://github.com/rjmacarthy/twinny) \- Copilot and Copilot chat alternative
- [gptel Emacs client](https://github.com/karthink/gptel) \- LLM client for Emacs
- [Ollama Copilot](https://github.com/bernardo-bruning/ollama-copilot) \- Use Ollama as GitHub Copilot
- [Obsidian Local GPT](https://github.com/pfrankov/obsidian-local-gpt) \- Local AI for Obsidian
- [Ellama Emacs client](https://github.com/s-kostyaev/ellama) \- LLM tool for Emacs
- [orbiton](https://github.com/xyproto/orbiton) \- Config-free text editor with Ollama tab completion
- [AI ST Completion](https://github.com/yaroslavyaroslav/OpenAI-sublime-text) \- Sublime Text 4 AI assistant
- [VT Code](https://github.com/vinhnx/vtcode) \- Rust-based terminal coding agent with Tree-sitter
- [QodeAssist](https://github.com/Palm1r/QodeAssist) \- AI coding assistant for Qt Creator
- [AI Toolkit for VS Code](https://aka.ms/ai-tooklit/ollama-docs) \- Microsoft-official VS Code extension
- [Open Interpreter](https://docs.openinterpreter.com/language-model-setup/local-models/ollama) \- Natural language interface for computers

### Libraries & SDKs

[Permalink: Libraries & SDKs](https://github.com/ollama/ollama#libraries--sdks)

- [LiteLLM](https://github.com/BerriAI/litellm) \- Unified API for 100+ LLM providers
- [Semantic Kernel](https://github.com/microsoft/semantic-kernel/tree/main/python/semantic_kernel/connectors/ai/ollama) \- Microsoft AI orchestration SDK
- [LangChain4j](https://github.com/langchain4j/langchain4j) \- Java LangChain ( [example](https://github.com/langchain4j/langchain4j-examples/tree/main/ollama-examples/src/main/java))
- [LangChainGo](https://github.com/tmc/langchaingo/) \- Go LangChain ( [example](https://github.com/tmc/langchaingo/tree/main/examples/ollama-completion-example))
- [Spring AI](https://github.com/spring-projects/spring-ai) \- Spring framework AI support ( [docs](https://docs.spring.io/spring-ai/reference/api/chat/ollama-chat.html))
- [LangChain](https://python.langchain.com/docs/integrations/chat/ollama/) and [LangChain.js](https://js.langchain.com/docs/integrations/chat/ollama/) with [example](https://js.langchain.com/docs/tutorials/local_rag/)
- [Ollama for Ruby](https://github.com/crmne/ruby_llm) \- Ruby LLM library
- [any-llm](https://github.com/mozilla-ai/any-llm) \- Unified LLM interface by Mozilla
- [OllamaSharp for .NET](https://github.com/awaescher/OllamaSharp) \- .NET SDK
- [LangChainRust](https://github.com/Abraxas-365/langchain-rust) \- Rust LangChain ( [example](https://github.com/Abraxas-365/langchain-rust/blob/main/examples/llm_ollama.rs))
- [Agents-Flex for Java](https://github.com/agents-flex/agents-flex) \- Java agent framework ( [example](https://github.com/agents-flex/agents-flex/tree/main/agents-flex-llm/agents-flex-llm-ollama/src/test/java/com/agentsflex/llm/ollama))
- [Elixir LangChain](https://github.com/brainlid/langchain) \- Elixir LangChain
- [Ollama-rs for Rust](https://github.com/pepperoni21/ollama-rs) \- Rust SDK
- [LangChain for .NET](https://github.com/tryAGI/LangChain) \- .NET LangChain ( [example](https://github.com/tryAGI/LangChain/blob/main/examples/LangChain.Samples.OpenAI/Program.cs))
- [chromem-go](https://github.com/philippgille/chromem-go) \- Go vector database with Ollama embeddings ( [example](https://github.com/philippgille/chromem-go/tree/v0.5.0/examples/rag-wikipedia-ollama))
- [LangChainDart](https://github.com/davidmigloz/langchain_dart) \- Dart LangChain
- [LlmTornado](https://github.com/lofcz/llmtornado) \- Unified C# interface for multiple inference APIs
- [Ollama4j for Java](https://github.com/ollama4j/ollama4j) \- Java SDK
- [Ollama for Laravel](https://github.com/cloudstudio/ollama-laravel) \- Laravel integration
- [Ollama for Swift](https://github.com/mattt/ollama-swift) \- Swift SDK
- [LlamaIndex](https://docs.llamaindex.ai/en/stable/examples/llm/ollama/) and [LlamaIndexTS](https://ts.llamaindex.ai/modules/llms/available_llms/ollama) \- Data framework for LLM apps
- [Haystack](https://github.com/deepset-ai/haystack-integrations/blob/main/integrations/ollama.md) \- AI pipeline framework
- [Firebase Genkit](https://firebase.google.com/docs/genkit/plugins/ollama) \- Google AI framework
- [Ollama-hpp for C++](https://github.com/jmont-dev/ollama-hpp) \- C++ SDK
- [PromptingTools.jl](https://github.com/svilupp/PromptingTools.jl) \- Julia LLM toolkit ( [example](https://svilupp.github.io/PromptingTools.jl/dev/examples/working_with_ollama))
- [Ollama for R - rollama](https://github.com/JBGruber/rollama) \- R SDK
- [Portkey](https://portkey.ai/docs/welcome/integration-guides/ollama) \- AI gateway
- [Testcontainers](https://testcontainers.com/modules/ollama/) \- Container-based testing
- [LLPhant](https://github.com/theodo-group/LLPhant?tab=readme-ov-file#ollama) \- PHP AI framework

### Frameworks & Agents

[Permalink: Frameworks & Agents](https://github.com/ollama/ollama#frameworks--agents)

- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT/blob/master/docs/content/platform/ollama.md) \- Autonomous AI agent platform
- [crewAI](https://github.com/crewAIInc/crewAI) \- Multi-agent orchestration framework
- [Strands Agents](https://github.com/strands-agents/sdk-python) \- Model-driven agent building by AWS
- [Cheshire Cat](https://github.com/cheshire-cat-ai/core) \- AI assistant framework
- [any-agent](https://github.com/mozilla-ai/any-agent) \- Unified agent framework interface by Mozilla
- [Stakpak](https://github.com/stakpak/agent) \- Open source DevOps agent
- [Hexabot](https://github.com/hexastack/hexabot) \- Conversational AI builder
- [Neuro SAN](https://github.com/cognizant-ai-lab/neuro-san-studio) \- Multi-agent orchestration ( [docs](https://github.com/cognizant-ai-lab/neuro-san-studio/blob/main/docs/user_guide.md#ollama))

### RAG & Knowledge Bases

[Permalink: RAG & Knowledge Bases](https://github.com/ollama/ollama#rag--knowledge-bases)

- [RAGFlow](https://github.com/infiniflow/ragflow) \- RAG engine based on deep document understanding
- [R2R](https://github.com/SciPhi-AI/R2R) \- Open-source RAG engine
- [MaxKB](https://github.com/1Panel-dev/MaxKB/) \- Ready-to-use RAG chatbot
- [Minima](https://github.com/dmayboroda/minima) \- On-premises or fully local RAG
- [Chipper](https://github.com/TilmanGriesel/chipper) \- AI interface with Haystack RAG
- [ARGO](https://github.com/xark-argo/argo) \- RAG and deep research on Mac/Windows/Linux
- [Archyve](https://github.com/nickthecook/archyve) \- RAG-enabling document library
- [Casibase](https://casibase.org/) \- AI knowledge base with RAG and SSO
- [BrainSoup](https://www.nurgo-software.com/products/brainsoup) \- Native client with RAG and multi-agent automation

### Bots & Messaging

[Permalink: Bots & Messaging](https://github.com/ollama/ollama#bots--messaging)

- [LangBot](https://github.com/RockChinQ/LangBot) \- Multi-platform messaging bots with agents and RAG
- [AstrBot](https://github.com/Soulter/AstrBot/) \- Multi-platform chatbot with RAG and plugins
- [Discord-Ollama Chat Bot](https://github.com/kevinthedang/discord-ollama) \- TypeScript Discord bot
- [Ollama Telegram Bot](https://github.com/ruecat/ollama-telegram) \- Telegram bot
- [LLM Telegram Bot](https://github.com/innightwolfsleep/llm_telegram_bot) \- Telegram bot for roleplay

### Terminal & CLI

[Permalink: Terminal & CLI](https://github.com/ollama/ollama#terminal--cli)

- [aichat](https://github.com/sigoden/aichat) \- All-in-one LLM CLI with Shell Assistant, RAG, and AI tools
- [oterm](https://github.com/ggozad/oterm) \- Terminal client for Ollama
- [gollama](https://github.com/sammcj/gollama) \- Go-based model manager for Ollama
- [tlm](https://github.com/yusufcanb/tlm) \- Local shell copilot
- [tenere](https://github.com/pythops/tenere) \- TUI for LLMs
- [ParLlama](https://github.com/paulrobello/parllama) \- TUI for Ollama
- [llm-ollama](https://github.com/taketwo/llm-ollama) \- Plugin for [Datasette's LLM CLI](https://llm.datasette.io/en/stable/)
- [ShellOracle](https://github.com/djcopley/ShellOracle) \- Shell command suggestions
- [LLM-X](https://github.com/mrdjohnson/llm-x) \- Progressive web app for LLMs
- [cmdh](https://github.com/pgibler/cmdh) \- Natural language to shell commands
- [VT](https://github.com/vinhnx/vt.ai) \- Minimal multimodal AI chat app

### Productivity & Apps

[Permalink: Productivity & Apps](https://github.com/ollama/ollama#productivity--apps)

- [AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) \- AI collaborative workspace, self-hostable Notion alternative
- [Screenpipe](https://github.com/mediar-ai/screenpipe) \- 24/7 screen and mic recording with AI-powered search
- [Vibe](https://github.com/thewh1teagle/vibe) \- Transcribe and analyze meetings
- [Page Assist](https://github.com/n4ze3m/page-assist) \- Chrome extension for AI-powered browsing
- [NativeMind](https://github.com/NativeMindBrowser/NativeMindExtension) \- Private, on-device browser AI assistant
- [Ollama Fortress](https://github.com/ParisNeo/ollama_proxy_server) \- Security proxy for Ollama
- [1Panel](https://github.com/1Panel-dev/1Panel/) \- Web-based Linux server management
- [Writeopia](https://github.com/Writeopia/Writeopia) \- Text editor with Ollama integration
- [QA-Pilot](https://github.com/reid41/QA-Pilot) \- GitHub code repository understanding
- [Raycast extension](https://github.com/MassimilianoPasquini97/raycast_ollama) \- Ollama in Raycast
- [Painting Droid](https://github.com/mateuszmigas/painting-droid) \- Painting app with AI integrations
- [Serene Pub](https://github.com/doolijb/serene-pub) \- AI roleplaying app
- [Mayan EDMS](https://gitlab.com/mayan-edms/mayan-edms) \- Document management with Ollama workflows
- [TagSpaces](https://www.tagspaces.org/) \- File management with [AI tagging](https://docs.tagspaces.org/ai/)

### Observability & Monitoring

[Permalink: Observability & Monitoring](https://github.com/ollama/ollama#observability--monitoring)

- [Opik](https://www.comet.com/docs/opik/cookbook/ollama) \- Debug, evaluate, and monitor LLM applications
- [OpenLIT](https://github.com/openlit/openlit) \- OpenTelemetry-native monitoring for Ollama and GPUs
- [Lunary](https://lunary.ai/docs/integrations/ollama) \- LLM observability with analytics and PII masking
- [Langfuse](https://langfuse.com/docs/integrations/ollama) \- Open source LLM observability
- [HoneyHive](https://docs.honeyhive.ai/integrations/ollama) \- AI observability and evaluation for agents
- [MLflow Tracing](https://mlflow.org/docs/latest/llms/tracing/index.html#automatic-tracing) \- Open source LLM observability

### Database & Embeddings

[Permalink: Database & Embeddings](https://github.com/ollama/ollama#database--embeddings)

- [pgai](https://github.com/timescale/pgai) \- PostgreSQL as a vector database ( [guide](https://github.com/timescale/pgai/blob/main/docs/vectorizer-quick-start.md))
- [MindsDB](https://github.com/mindsdb/mindsdb/blob/staging/mindsdb/integrations/handlers/ollama_handler/README.md) \- Connect Ollama with 200+ data platforms
- [chromem-go](https://github.com/philippgille/chromem-go/blob/v0.5.0/embed_ollama.go) \- Embeddable vector database for Go ( [example](https://github.com/philippgille/chromem-go/tree/v0.5.0/examples/rag-wikipedia-ollama))
- [Kangaroo](https://github.com/dbkangaroo/kangaroo) \- AI-powered SQL client

### Infrastructure & Deployment

[Permalink: Infrastructure & Deployment](https://github.com/ollama/ollama#infrastructure--deployment)

#### Cloud

[Permalink: Cloud](https://github.com/ollama/ollama#cloud)

- [Google Cloud](https://cloud.google.com/run/docs/tutorials/gpu-gemma2-with-ollama)
- [Fly.io](https://fly.io/docs/python/do-more/add-ollama/)
- [Koyeb](https://www.koyeb.com/deploy/ollama)
- [Harbor](https://github.com/av/harbor) \- Containerized LLM toolkit with Ollama as default backend

#### Package Managers

[Permalink: Package Managers](https://github.com/ollama/ollama#package-managers)

- [Pacman](https://archlinux.org/packages/extra/x86_64/ollama/)
- [Homebrew](https://formulae.brew.sh/formula/ollama)
- [Nix package](https://search.nixos.org/packages?show=ollama&from=0&size=50&sort=relevance&type=packages&query=ollama)
- [Helm Chart](https://artifacthub.io/packages/helm/ollama-helm/ollama)
- [Gentoo](https://github.com/gentoo/guru/tree/master/app-misc/ollama)
- [Flox](https://flox.dev/blog/ollama-part-one)
- [Guix channel](https://codeberg.org/tusharhero/ollama-guix)

## About

Get up and running with Kimi, GLM, MiniMax, DeepSeek, gpt-oss, Qwen, Gemma and other models.

[ollama.com](https://ollama.com/)

### Topics

[deepseek](https://github.com/topics/deepseek) [gemma](https://github.com/topics/gemma) [gemma3](https://github.com/topics/gemma3) [glm](https://github.com/topics/glm) [go](https://github.com/topics/go) [golang](https://github.com/topics/golang) [gpt-oss](https://github.com/topics/gpt-oss) [llama](https://github.com/topics/llama) [llama3](https://github.com/topics/llama3) [llm](https://github.com/topics/llm) [llms](https://github.com/topics/llms) [minimax](https://github.com/topics/minimax) [mistral](https://github.com/topics/mistral) [ollama](https://github.com/topics/ollama) [qwen](https://github.com/topics/qwen)

### Resources

[Readme](https://github.com/ollama/ollama#readme-ov-file)

[MIT license](https://github.com/ollama/ollama#MIT-1-ov-file)

### Contributing

[Contributing](https://github.com/ollama/ollama#contributing-ov-file)

### Security policy

[Security policy](https://github.com/ollama/ollama#security-ov-file)

[Activity](https://github.com/ollama/ollama/activity)

[Custom properties](https://github.com/ollama/ollama/custom-properties)

### Stars

**182.1k** stars

### Watchers

**1.0k** watching

### Forks

[**18.1k** forks](https://github.com/ollama/ollama/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2Follama%2Follama&report=ollama+%28user%29)

## [Releases](https://github.com/ollama/ollama/releases) 258 (258)

[v0.35.0Latest\\
\\
4 days agoSep 28, 2026](https://github.com/ollama/ollama/releases/tag/v0.35.0)

[\+ 257 releases](https://github.com/ollama/ollama/releases)

## [Contributors](https://github.com/ollama/ollama/graphs/contributors) 613 (613)

- [![@mxyng](https://avatars.githubusercontent.com/u/2372640?s=64&v=4)](https://github.com/mxyng)
- [![@dhiltgen](https://avatars.githubusercontent.com/u/4033016?s=64&v=4)](https://github.com/dhiltgen)
- [![@jmorganca](https://avatars.githubusercontent.com/u/251292?s=64&v=4)](https://github.com/jmorganca)
- [![@BruceMacD](https://avatars.githubusercontent.com/u/5853428?s=64&v=4)](https://github.com/BruceMacD)
- [![@jessegross](https://avatars.githubusercontent.com/u/6468499?s=64&v=4)](https://github.com/jessegross)
- [![@ParthSareen](https://avatars.githubusercontent.com/u/29360864?s=64&v=4)](https://github.com/ParthSareen)
- [![@pdevine](https://avatars.githubusercontent.com/u/75239?s=64&v=4)](https://github.com/pdevine)
- [![@technovangelist](https://avatars.githubusercontent.com/u/633681?s=64&v=4)](https://github.com/technovangelist)
- [![@drifkin](https://avatars.githubusercontent.com/u/175530?s=64&v=4)](https://github.com/drifkin)
- [![@hoyyeva](https://avatars.githubusercontent.com/u/63033505?s=64&v=4)](https://github.com/hoyyeva)
- [![@bmizerany](https://avatars.githubusercontent.com/u/46?s=64&v=4)](https://github.com/bmizerany)
- [![@mchiang0610](https://avatars.githubusercontent.com/u/3325447?s=64&v=4)](https://github.com/mchiang0610)
- [![@joshyan1](https://avatars.githubusercontent.com/u/76125168?s=64&v=4)](https://github.com/joshyan1)
- [![@rick-github](https://avatars.githubusercontent.com/u/14946854?s=64&v=4)](https://github.com/rick-github)

[\+ 599 contributors](https://github.com/ollama/ollama/graphs/contributors)

## Languages

- [Go69.4%](https://github.com/ollama/ollama/search?l=go)
- [C21.4%](https://github.com/ollama/ollama/search?l=c)
- [TypeScript5.5%](https://github.com/ollama/ollama/search?l=typescript)
- [C++1%](https://github.com/ollama/ollama/search?l=c%2B%2B)
- [Objective-C0.8%](https://github.com/ollama/ollama/search?l=objective-c)
- [CMake0.7%](https://github.com/ollama/ollama/search?l=cmake)
- [Other1.2%](https://github.com/ollama/ollama/search?l=Other)

You can’t perform that action at this time.
