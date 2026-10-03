# Evidence

One row per fetched page. `Raw` points at the cached page text under `research/raw/`,
which is what makes the claim checkable - a row without raw evidence fails preflight.

The `Finding` cell arrives as an auto-extracted summary. Rewrite it into a real claim:
what the page actually establishes, with the quote or number that proves it.

| ID | Retrieved | Type | URL | Finding | Raw |
|---|---|---|---|---|---|
| E-01 | 2026-10-03 | P | https://raw.githubusercontent.com/Pythagora-io/gpt-pilot/main/README.md | gpt-pilot is an unmaintained multi-agent "AI developer" (spec writer, architect, tech lead, developer, code monkey, reviewer, troubleshooter, debugger, technical writer), and its README reports a credential-stealing loader hidden in `core/telemetry/` from August 2025 to 11 June 2026. Its useful pattern is a reviewer that sends each step back until it is right. [quote: **Reviewer agent** reviews every step of the task and if something is done wrong Reviewer sends it back to Code Monkey.] | research/raw/2026-10-03-readme-md-githubusercontent-4c38fabe.md |
| E-02 | 2026-10-03 | P | https://raw.githubusercontent.com/Pythagora-io/gpt-pilot/main/LICENSE | gpt-pilot is licensed FSL-1.1-MIT (Functional Source License, MIT future license), which forbids a "Competing Use" until it converts to MIT; it is not plain MIT. [quote: FSL-1.1-MIT] | research/raw/2026-10-03-license-githubusercontent-8b00ba1a.md |
| E-03 | 2026-10-03 | P | https://raw.githubusercontent.com/beelzebub-labs/beelzebub/main/README.md | beelzebub is a honeypot framework whose MCP decoys expose bait tools; a call to one during controlled agent testing is evidence of a prompt-injection attempt, though not every attempt is detected. [quote: MCP decoys expose bait tools that make suspicious invocations observable during controlled agent testing.] | research/raw/2026-10-03-readme-md-githubusercontent-66d18134.md |
| E-04 | 2026-10-03 | P | https://raw.githubusercontent.com/beelzebub-labs/beelzebub/main/LICENSE | beelzebub is licensed GPL-3.0, so its code cannot be folded into a distributed desktop app without copyleft obligations. [quote: GNU GENERAL PUBLIC LICENSE] | research/raw/2026-10-03-license-githubusercontent-45b65d8e.md |
| E-05 | 2026-10-03 | P | https://raw.githubusercontent.com/geffy/tffm/master/README.md | tffm is a TensorFlow 1.x implementation of factorization machines (a recommender model), tested on TensorFlow 1.3; it has nothing to do with agents. [quote: tensorflow 1.0+ (tested on 1.3)] | research/raw/2026-10-03-readme-md-githubusercontent-d5226fea.md |
