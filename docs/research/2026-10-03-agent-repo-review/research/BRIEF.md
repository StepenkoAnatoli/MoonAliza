# Brief - What MoonAliza can adopt from three public repositories the user named (gpt-pilot, beelzebub, tffm) and the GitHub research-and-development topic: what each is, its license and maintenance state, and which patterns fit a local, approval-gated agent

_Auto-drafted 2026-10-03 by `bin/brief.mjs` from the corpus. Sections marked **TODO**
require the reviewing agent's judgement; everything else is assembled from evidence already
in `research/`. While a **TODO** remains, this brief is **not reviewed** and the
handoff is **not approved** - a structurally valid corpus, a reviewed one, and an
approved handoff are three different states._

Reviewed by: agent

**This is the phase-1 to phase-2 handoff.** **Gate: PASS.** Every blocking unknown is closed with evidence, and every claim below
traces to a cached page in `research/raw/`.

Whoever you are - another agent, a different model, or a person - read this file
first. You should not need to re-research anything to start work. If something
here is not enough to build from, say which fact is missing rather than guessing
it: that is a phase-1 gap to close, not a phase-2 judgment call.

## Intent

On 2026-10-03 the user named three repositories (gpt-pilot, beelzebub, tffm) and the GitHub research-and-development topic, asking what MoonAliza can take from them. MoonAliza is a local, approval-gated desktop agent whose planned phases are research, project memory, missions and sandbox computer use. Done means a builder knows, from each repository's own pages, what it is, its license and maintenance state, and which patterns (not code) fit MoonAliza, plus what to avoid.

## What we verified

| Claim | Source | Type |
|---|---|---|
| gpt-pilot is an unmaintained multi-agent "AI developer" (spec writer, architect, tech lead, developer, code monkey, reviewer, troubleshooter, debugger, technical writer), and its README reports a credential-stealing loader hidden in `core/telemetry/` from August 2025 to 11 June 2026. Its useful pattern is a reviewer that sends each step back until it is right. [quote: **Reviewer agent** reviews every step of the task and if something is done wrong Reviewer sends it back to Code Monkey.] | E-01 `raw.githubusercontent.com` (U-01) | P |
| gpt-pilot is licensed FSL-1.1-MIT (Functional Source License, MIT future license), which forbids a "Competing Use" until it converts to MIT; it is not plain MIT. [quote: FSL-1.1-MIT] | E-02 `raw.githubusercontent.com` (U-02) | P |
| beelzebub is a honeypot framework whose MCP decoys expose bait tools; a call to one during controlled agent testing is evidence of a prompt-injection attempt, though not every attempt is detected. [quote: MCP decoys expose bait tools that make suspicious invocations observable during controlled agent testing.] | E-03 `raw.githubusercontent.com` (U-03) | P |
| beelzebub is licensed GPL-3.0, so its code cannot be folded into a distributed desktop app without copyleft obligations. [quote: GNU GENERAL PUBLIC LICENSE] | E-04 `raw.githubusercontent.com` (U-04) | P |
| tffm is a TensorFlow 1.x implementation of factorization machines (a recommender model), tested on TensorFlow 1.3; it has nothing to do with agents. [quote: tensorflow 1.0+ (tested on 1.3)] | E-05 `raw.githubusercontent.com` (U-05) | P |

## Contradictions and how they were resolved

One correction against an earlier, unrecorded reading. A WebFetch summary on 2026-10-03 called gpt-pilot "MIT" from the GitHub sidebar. The repository's own LICENSE file is FSL-1.1-MIT (E-02), a source-available license that bars competing use until it converts. The LICENSE file is the owner's statement and is trusted. No captured sources disagree.

## Known unknowns

- **U-06** - Which repositories the research-and-development topic lists
  - Day-one verification: github.com/topics refused the keyless fetch (HTTP 403). Day-one step: open the topic page in a browser and name any listed repository that is an agent, research or knowledge tool; collect its README in a new project.

## Decision

Take **patterns only**. No code from any of the three:

- gpt-pilot is FSL and unmaintained (E-01, E-02).
- beelzebub is GPL-3.0 (E-04).
- tffm is unrelated (E-05).

1. **Missions: a reviewer loop** (E-01). Every mission step goes to a reviewer agent that either accepts it or sends it back with the reason before the user sees it. This matches the adopted advisor–orchestrator–worker verdicts (PASS/FIX/ESCALATE).
2. **Prompt-injection tests: bait tools** (E-03). MoonAliza's test harness registers decoy MCP tools that no legitimate task needs. A call to one after reading untrusted content fails the test. This complements the proposed provenance gating; it detects some attempts, not all.
3. **Supply chain: a standing lesson** (E-01). A hidden loader sat in an unmaintained repository for ten months. MoonAliza keeps telemetry out of the engine, pins and reviews every external tool by hash (as it does Research-Kit), and treats an unmaintained dependency as a risk to remove, not a convenience.

**First build step:** when the missions phase starts, write the reviewer step into the mission plan contract (step → review verdict → user approval).

**Out of scope:** running gpt-pilot, beelzebub or tffm; honeypots in MoonAliza itself; recommender models. The research-and-development topic stays a known unknown (U-06).

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "/root/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=0385ec156d8b40a5 inputs=da98ae04d7fbb7ee gate=pass -->
