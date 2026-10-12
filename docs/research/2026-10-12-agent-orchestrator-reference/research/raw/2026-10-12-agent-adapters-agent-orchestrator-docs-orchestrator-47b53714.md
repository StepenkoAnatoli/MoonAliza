---
url: https://docs.orchestrator.inc/plugins/agents
retrieved: 2026-10-12
command: firecrawl scrape https://docs.orchestrator.inc/plugins/agents --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Agent adapters | Agent Orchestrator Docs
---
[Built-in capabilities](https://docs.orchestrator.inc/plugins/)

# Agent adapters

The agent harnesses built into Orchestrator, with terminal and structured Chat capabilities.

Most agents require a local installation and sign-in. Unreal Agent is built into Orchestrator for macOS and Linux and is Chat-only. For an installed agent, check that Orchestrator can find it and start a session:

```
ao agent ls --refresh
ao spawn --project my-app --name task --agent codex
```

Orchestrator uses the agent CLI and authentication you already installed for external harnesses. It does not bundle external provider credentials or install external adapters from npm.

## Shipped agent harnesses

The current daemon registers the following capabilities. Availability still depends on platform, installed version, credentials, and permissions; a registered adapter is not proof that it is ready on your machine.

| Harness | Terminal UI | Chat | Reviewer |
| --- | --- | --- | --- |
| `claude-code` | Yes | Yes | Yes |
| `codex` | Yes | Yes | Yes |
| `opencode` | Yes | Yes | Yes |
| `opencode-v2` | Yes | Yes | Yes |
| `grok` | Yes | — | Yes |
| `cursor` | Yes | Yes | Yes |
| `qwen` | Yes | Yes | — |
| `gemini` | Yes | — | — |
| `copilot` | Yes | — | Yes |
| `kimi` | Yes | Yes | Yes |
| `muse` | Yes | — | Yes |
| `droid` | Yes | Yes | Yes |
| `amp` | Yes | — | Yes |
| `agy` | Yes | — | Yes |
| `crush` | Yes | — | Yes |
| `aider` | Yes | — | Yes |
| `goose` | Yes | — | — |
| `auggie` | Yes | — | Yes |
| `continue` | Yes | — | — |
| `devin` | Yes | — | Yes |
| `omp` | Yes | Yes | — |
| `cline` | Yes | — | Yes |
| `kiro` | Yes | — | Yes |
| `kilocode` | Yes | — | Yes |
| `vibe` | Yes | — | — |
| `pi` | Yes | Yes | Yes |
| `kimchi` | Yes | Yes | Yes |
| `prime-agent` | Yes | — | — |
| `autohand` | Yes | — | Yes |
| `fx` | Yes | — | — |
| `unreal-agent` | No | Yes | — |
| `mimo-code` | Yes | — | — |
| `deepseek-harness` | Yes | Yes | — |
| `openhands` | Yes | — | — |
| `command-code` | Yes | Yes | — |

The table shows shipped capabilities, not whether an agent is ready on your machine. Run the catalog for current readiness or when scripting:

```
ao agent ls --refresh
ao agent ls --refresh --json
```

The readiness probe reports whether a harness is supported, installed, and authenticated. Spawn still performs authoritative validation.

### fx (experimental)

Install fx from Settings → Harness on macOS or Linux (expected at
`~/.local/bin/fx`; on Windows use WSL), then spawn it in Terminal UI mode.
fx Chat is not supported.

```
ao spawn --name fx-task --agent fx --mode tui
```

## Chat versus Terminal UI

Unreal Agent is Chat-only; the other worker adapters provide a terminal interface. These harnesses have structured Chat drivers:

| Harness | Chat transport |
| --- | --- |
| `codex` | Codex native app-server |
| `claude-code` | `claude-agent-acp` using the user's Claude executable |
| `opencode` | Native ACP (OpenCode 1) |
| `opencode-v2` | Native ACP (OpenCode 2) |
| `droid` | Native ACP |
| `kimi` | Native ACP |
| `kimchi` | Native ACP |
| `pi` | Separately installed ACP adapter; explicit bypass permissions required |
| `cursor` | Native ACP |
| `omp` | Native ACP |
| `qwen` | Native ACP |
| `unreal-agent` | Built into Orchestrator |
| `deepseek-harness` | Native ACP (`dsh --profile acp`) |
| `command-code` | Native ACP (`cmd acp`) |

Every other harness is Terminal UI-only. Choose the initial interface with `ao spawn --mode chat|tui`. Compatible Claude Code and Codex sessions can hand off between Chat and Terminal UI while retaining the Orchestrator session and worktree.

Qwen Chat needs version 0.16 or newer; OMP Chat needs version 15 or newer. MiMo Code needs version 0.1.14 or newer and is Terminal UI-only, as is Gemini. Unreal Agent is built into Orchestrator for macOS/Linux, is Chat-only, and requires bypass permissions because it has no interactive approval flow. DeepSeek Chat uses `dsh --profile acp`. Check readiness and the provider options offered by your installed Orchestrator version before launching.

Chat registration does not imply interface handoff support. Use the switch action and its disabled reason in the session UI. Experimental reviewer modes and prompts do not sandbox tools or network access.

## Choosing and configuring a harness

```
ao spawn --project my-app --name auth-fix --agent claude-code --mode chat
```

To make Codex the default worker, use `ao project set-config my-app --worker-agent codex`. It replaces the full config, even when you use a focused flag, so read the [full-config warning](https://docs.orchestrator.inc/configuration/projects/#update-from-the-cli) before running it.

`--agent` and `--harness` are aliases. The CLI's project-config mirror also omits `effort`: `ao project get --json` cannot show it, and a CLI configuration replacement drops existing effort values. Use Project Settings in the desktop app or the daemon API to preserve or change effort. Use `ao project set-config --help` for supported fields.

[Claude Code\\
\\
Terminal UI and structured Chat.](https://docs.orchestrator.inc/plugins/agents/claude-code/) [Codex\\
\\
Terminal UI and native app-server Chat.](https://docs.orchestrator.inc/plugins/agents/codex/) [OpenCode\\
\\
Terminal UI and native ACP Chat.](https://docs.orchestrator.inc/plugins/agents/opencode/) [Cursor\\
\\
Terminal UI and native ACP Chat.](https://docs.orchestrator.inc/plugins/agents/cursor/) [Aider\\
\\
Built-in terminal harness.](https://docs.orchestrator.inc/plugins/agents/aider/)

[Built-in capabilities\\
\\
Agent, runtime, workspace, tracker, SCM, notification, and terminal support compiled into Orchestrator.](https://docs.orchestrator.inc/plugins/) [Claude Code\\
\\
Built-in Terminal UI and structured Chat support for the user's Claude Code installation.](https://docs.orchestrator.inc/plugins/agents/claude-code/)

### On this page

[Shipped agent harnesses](https://docs.orchestrator.inc/plugins/agents/#shipped-agent-harnesses) [fx (experimental)](https://docs.orchestrator.inc/plugins/agents/#fx-experimental) [Chat versus Terminal UI](https://docs.orchestrator.inc/plugins/agents/#chat-versus-terminal-ui) [Choosing and configuring a harness](https://docs.orchestrator.inc/plugins/agents/#choosing-and-configuring-a-harness)
