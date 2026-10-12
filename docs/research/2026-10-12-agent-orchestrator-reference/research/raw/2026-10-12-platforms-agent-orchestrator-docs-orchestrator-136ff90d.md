---
url: https://docs.orchestrator.inc/platforms/
retrieved: 2026-10-12
command: firecrawl scrape https://docs.orchestrator.inc/platforms/ --only-main-content --max-age 0 --format markdown,rawHtml --json
statusCode: 200
transport: firecrawl-cli
completeness: full
title: Platforms | Agent Orchestrator Docs
---
# Platforms

Install and use Orchestrator on macOS, Windows, Linux, and mobile.

Orchestrator has a desktop app for macOS, Windows, and Linux. The basic workflow is the same on each platform: add a repository, start an isolated worker, and follow its pull request in Chat or Terminal UI.

a

macOSSupported

l

LinuxSupported

w

WindowsSupported

New Terminal UI sessions use Orchestrator's native terminal hosts on macOS/Linux and ConPTY on Windows. Older sessions and fallback launches can use tmux. Available agents vary by platform.

## Desktop downloads

| Platform | Available packages |
| --- | --- |
| macOS Apple silicon | Application zip and disk image |
| macOS Intel | Application zip and disk image |
| Windows x64 | Desktop installer |
| Linux x64 | AppImage, Debian/Ubuntu package, and Fedora/RHEL package |

Use the download selector on [Installation](https://docs.orchestrator.inc/installation/) for the current release. Installed builds check for updates on launch and periodically while running.

## macOS

Both Chat and Terminal UI are supported when the selected agent allows them. New terminal sessions use Orchestrator's native pseudo-terminal (PTY) host. Packaged builds include tmux for older sessions and fallback launches. macOS still checks that tmux is available when starting a session. Source builds can install it with:

```
brew install tmux
```

macOS packages include both a `.dmg` for first installation and a `.zip` used by the updater. Keep both release artifacts available.

If macOS says the developer cannot be verified, follow [Common Installation Problems](https://docs.orchestrator.inc/installation/#common-installation-problems).

## Linux

Linux supports the desktop app, Chat, Orchestrator's native terminal host, and the browser inspector. Older sessions and fallback launches still use tmux; desktop packages include it. Source builds can install tmux with the distribution package manager, for example `sudo apt install tmux`.

Choose the AppImage for a portable launch, or the `.deb`/`.rpm` package that matches your distribution. `ao doctor` still probes tmux even though new Linux sessions normally use the native host.

## Windows

Windows supports the desktop workflow, structured Chat, and native Terminal UI through Orchestrator's conpty host. It does not require tmux, and iTerm2-specific helpers do not apply.

Use PowerShell, Command Prompt, or Git Bash for optional CLI commands. Orchestrator suppresses transient console windows for tools launched by the desktop daemon.

## Mobile companion

Orchestrator's Expo mobile app is a second interface to the desktop daemon. In desktop settings, choose **Connect Mobile** to enable a separate LAN listener and pair the phone.

Security properties:

- The LAN listener is off by default and exists only while Connect Mobile is enabled.
- It is protected by a rotating connection password.
- Scanning the pairing QR fills the advertised host, port, connection password, and any secure transport mode automatically. Treat the QR as a bearer credential: do not share it or screenshots of it, and rotate the connection password if it is exposed.
- Direct LAN traffic is plaintext and belongs on a trusted network. Managed HTTPS access and current Tailscale pairing limits are described in [Connect Mobile](https://docs.orchestrator.inc/configuration/remote-access/).
- Daemon control, telemetry, and browser-control routes remain loopback-only.

Mobile defaults new workers and orchestrators to Chat when the selected harness supports it. Terminal UI remains available as a compatibility choice.

## Remote and server use

The primary desktop listener is fixed to `127.0.0.1` and has no authentication. Do not expose it with a public bind or reverse proxy. Connect Mobile provides a separate authenticated listener for local or secure remote connections. Never publish the primary listener.

For unattended work, keep the desktop host awake and reachable on its local network. Orchestrator does not turn the local desktop product into a hosted multi-user service.

When Cloud is enabled for your build and account, its remote sessions use a separate control plane. Availability and provider choices are gated; local desktop installation alone does not grant Cloud access.

## Next steps

[Installation\\
\\
Download Orchestrator and connect GitHub and an agent harness.](https://docs.orchestrator.inc/installation/) [Dashboard\\
\\
Learn the desktop and mobile control surfaces.](https://docs.orchestrator.inc/dashboard/) [Troubleshooting\\
\\
Resolve platform-specific startup and terminal issues.](https://docs.orchestrator.inc/troubleshooting/)

[Quickstart\\
\\
Add a project, start one worker, and follow it from task to pull request.](https://docs.orchestrator.inc/quickstart/) [Dashboard\\
\\
Use the Orchestrator desktop app to supervise projects, sessions, pull requests, reviews, and previews.](https://docs.orchestrator.inc/dashboard/)

### On this page

[Desktop downloads](https://docs.orchestrator.inc/platforms/#desktop-downloads) [macOS](https://docs.orchestrator.inc/platforms/#macos) [Linux](https://docs.orchestrator.inc/platforms/#linux) [Windows](https://docs.orchestrator.inc/platforms/#windows) [Mobile companion](https://docs.orchestrator.inc/platforms/#mobile-companion) [Remote and server use](https://docs.orchestrator.inc/platforms/#remote-and-server-use) [Next steps](https://docs.orchestrator.inc/platforms/#next-steps)
