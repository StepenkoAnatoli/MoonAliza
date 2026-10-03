# Research-Kit Integration

Research-Kit (https://github.com/StepenkoAnatoli/Research-Kit) makes an agent collect evidence
from real sources before it designs or builds, keeps a hash-chained ledger of where every claim
came from, and refuses to let the build start until its gate passes. The orchestrator uses it for
every fact the repository cannot answer, and treats its gate as a hard entry condition for design
and build.

Two rules carry the integration:

- **Evidence is fetched, never typed.** Every cited page is on disk under `research/raw/` and
  recorded in the ledger `research/raw/.fetches.jsonl` with its hash and transport. A hand-written
  capture, or a page edited afterwards, fails the gate.
- **The gate is enforced.** With the kit's hooks installed, `git commit` refuses a change outside
  `research/` while the gate fails, and the Claude Code edit hook interrupts an agent in the same
  state. Plan the sequence around it; never bypass it.

## Contents

1. Readiness: testing the kit before relying on it
2. Where research lives
3. The protocol, step by step
4. Commands and exit codes
5. Rules for the orchestrator
6. Collector and builder machines
7. Reporting kit defects

---

## 1. Readiness: testing the kit before relying on it

Run inside the project folder, during Phase 0 and again whenever the kit is updated:

```
node "$HOME/.agents/research-kit/bin/doctor.mjs"
```

`doctor` must end with `READY`. Anything else names the problem and prints its fix: apply the
fix, run it again. Common cases:

| `doctor` says                                   | Action                                                                 |
|-------------------------------------------------|------------------------------------------------------------------------|
| deployed copy no longer matches the checkout    | from the kit checkout: `git pull origin main`, `node research-kit/bin/install.mjs`, re-run `doctor` |
| a key is missing (collector role)               | `firecrawl login`, or set `{ "transport": "http-keyless" }` in `~/.agents/research-kit.config.json` |
| this machine is a builder                       | collection is refused here by design; see section 6                    |
| a key is committed inside the project           | stop; report to the user; never commit or move the key                 |
| hooks displaced by a repository-local `core.hooksPath` | report it; the commit gate is not active in this repository until the user decides |

Deeper test, when `doctor` passes but behaviour looks wrong, or after installing or updating the
kit:

```
node "$HOME/.agents/research-kit/bin/selftest.mjs"
```

This runs the kit's full offline suite. It requires Python 3.11+ and **blocks** without it; a
blocked suite is not a pass. Record the result in the Orchestrator facts.

Record in the project's "Orchestrator facts": kit path (`RESEARCH_KIT_HOME` or
`~/.agents/research-kit`), machine role, transport, evidence policy, `doctor` result and date,
and the research folder convention.

## 2. Where research lives

A research project is its own folder and is the **current working directory** for every kit
command. The kit takes no project argument: `cd` into the research project first, every time.

Use the project's convention if the facts section records one. Otherwise:
`docs/research/<YYYY-MM-DD>-<topic>/`, one project per question, each with its own `AGENTS.md`
(written by the scaffold) and its own corpus. The scaffolded `AGENTS.md` is authoritative inside
that folder; follow it.

## 3. The protocol, step by step

One loop per topic. Steps marked *judgement* are done by the researcher and never automated.

| Step | Who        | Command or file                                                         | Leaves behind |
|------|------------|-------------------------------------------------------------------------|---------------|
| 1 Scaffold | researcher | `node "$HOME/.agents/research-kit/bin/new-project.mjs" <dir> --topic "<topic>" --kit '$HOME/.agents/research-kit'`, then `cd <dir>` | `AGENTS.md`, `START_HERE.md`, `research/`, `docs/ARCHITECTURE.md` |
| 2 Decompose | kit     | `node "$HOME/.agents/research-kit/bin/decompose.mjs"` (`--dry-run` spends nothing) | `research/MAP.md`, seeded with nine universal dimensions |
| 3 Classify the map | *judgement* | edit `research/MAP.md`: every row `COVERED` (naming the unknowns that cover it), `DISMISSED` (with a reason) or `GAP` | a complete map |
| 4 Contract | *judgement* | edit `research/DISCOVERY.md`: build intent and the blocking unknowns `U-1`, `U-2`, ..., each tracing to a map row | the contract |
| 5 Plan | *judgement* | edit `research/plan.json`: `queries` and `urls` that close each unknown; prefer the page that owns the fact (official docs, the repository, the pricing page, the statute) | the plan |
| 6 Collect | kit | `node "$HOME/.agents/research-kit/bin/research.mjs" --dry-run`, then without `--dry-run` | cached pages under `research/raw/`, rows in `research/EVIDENCE.md`, ledger entries |
| 7 Review | *judgement* | rewrite each `Finding` cell in `research/EVIDENCE.md` into the claim the page supports; add `[quote: ...]` copied word for word where a claim rests on one sentence; mark genuinely unreachable facts `KNOWN-UNKNOWN` with a day-one verification step | reviewed evidence |
| 8 Gate | kit | `node "$HOME/.agents/research-kit/bin/preflight.mjs"` (`--json` for the record) | `PASS`, or the name of the blocking check and one fix |
| 9 Brief | kit | `node "$HOME/.agents/research-kit/bin/brief.mjs"` | `research/BRIEF.md` |
| 10 Commit | researcher | `git add research/` and `git add -f research/raw/.fetches.jsonl` (the ledger is a dotfile; add it by name), then commit `research: <topic>` | the corpus in git |

Collection is the only step that spends credits (about one per page, two per search). A cached
page is never fetched twice, so re-running a finished project costs nothing. `research.mjs
--status` shows the budget and the corpus.

## 4. Commands and exit codes

| Command                               | Purpose                                                       |
|---------------------------------------|---------------------------------------------------------------|
| `doctor.mjs`                          | machine, project, gate and chain health, with fixes           |
| `new-project.mjs <dir> --topic "..."` | scaffold a research project (`--kit` spells the kit path portably) |
| `decompose.mjs`                       | draft the subtopic map                                        |
| `research.mjs`                        | collect the plan (`--dry-run`, `--status`, `--transport`, `--fallback`, `--depth`, `--refresh-days`, `--force`) |
| `preflight.mjs`                       | the gate (`--json`, `--strict`, `--check <name>`)             |
| `brief.mjs`                           | write the handoff brief                                       |
| `handoff.mjs`                         | on a builder machine: did the corpus arrive whole?            |
| `audit.mjs`                           | one pasteable snapshot of a passing corpus (`--zip`)          |
| `evidence-context.mjs --unknown U-n`  | what one unknown rests on                                     |
| `measure.mjs`                         | how the citations hold up                                     |
| `collect-remote.mjs`                  | run the collector on GitHub Actions and bring the result back |
| `selftest.mjs`                        | the kit's full offline suite                                  |

Every validating command maps its status to an exit code. Read the code, not the prose.

| Status            | Exit | Meaning                                                 |
|-------------------|------|---------------------------------------------------------|
| `PASS`            | 0    | checked, and correct                                    |
| `FAIL` / `REOPEN` | 1    | checked, and wrong                                      |
| `INCOMPLETE`      | 2    | could not be checked; not the same as wrong             |
| `BLOCKED`         | 3    | refused to start                                        |

## 5. Rules for the orchestrator

- Research is phase 1 of the kit's two-phase model and **writes no product code**. Builders read
  `BRIEF.md` and never re-research. A builder who finds a fact missing reports which one; the lead
  sends a researcher to collect it. A page fetched by hand is not evidence.
- `preflight` exit 0 is the entry condition for freezing contracts that depend on the topic and
  for building. `INCOMPLETE` (exit 2) and `BLOCKED` (exit 3) are not passes.
- Reuse before collecting: if a research project with a passing gate already covers the fact,
  cite its brief and evidence rows. Check `evidence-context.mjs --unknown U-n` when in doubt.
- One research project per topic; researchers run in parallel in separate folders. They share
  one collection budget and the kit's cache. Give each a page budget and agree the total with the
  user before collecting anything metered.
- Never bypass the gate: no `git commit --no-verify`, no `research/GATE_OFF`, no editing of
  captures, evidence rows produced by the kit, or the ledger.
- Keys live in the environment or `~/.agents/research-kit.config.json`, never in a project. Never
  run `firecrawl env` inside a repository. Pass tokens through the environment, never on a command
  line.
- In Claude Code, the kit installs a `research-first` skill and an edit-time gate. When that skill
  triggers inside a research folder, follow it; it and the scaffolded `AGENTS.md` agree with this
  protocol.
- Cite in the design and the plan: each externally sourced decision names the brief and the
  evidence row (`E-nn`) or unknown (`U-nn`) it rests on. The spec reviewer checks this.

## 6. Collector and builder machines

Each machine declares a role in `~/.agents/research-kit.config.json` (default `collector`).

| Role      | Holds the key | Runs                                    | Must                                                |
|-----------|---------------|-----------------------------------------|-----------------------------------------------------|
| collector | yes           | `decompose.mjs`, `research.mjs`         | push `research/` including the ledger               |
| builder   | no            | `handoff.mjs`, `preflight.mjs`, the build | not collect; `research.mjs` and `decompose.mjs` refuse here |

On a builder machine, the first command inside the research project is
`node "$HOME/.agents/research-kit/bin/handoff.mjs"`. Exit 1 names what is missing and on which
machine the fix lives (usually: the collector did not `git add -f` the ledger, or line endings
were rewritten; the scaffold ships a `.gitattributes` for `research/raw/*`).

When this machine cannot collect, the lead has two options and reports which it used:

1. Ask the user to collect on the collector machine and push.
2. Run the collector on GitHub Actions in the user's fork, if the user has set it up:
   `RESEARCH_KIT_GITHUB_TOKEN` in the environment, then
   `node "$HOME/.agents/research-kit/bin/collect-remote.mjs" --repository OWNER/REPO --topic "<topic>" --max-pages <n> --json`.
   Read `buildAuthorized` in the result and stop if it is `false`: it is `false` for every freshly
   collected corpus, because the review steps (7 above) remain. Exit 0 means the package is intact,
   never that building may start.

## 7. Reporting kit defects

The kit is the user's own tool, and every orchestrated task exercises it. When a kit command
behaves contrary to its documentation, record a finding rather than working around it:

```
Kit finding: <command as run, from <cwd>>
Expected: <what the README says>
Observed: <output, exit code>
Environment: <OS, Node version, kit version from doctor>
```

Include kit findings in the final report under "Open items". Do not patch the deployed kit from
inside a product task; the user decides whether to fix the kit.
