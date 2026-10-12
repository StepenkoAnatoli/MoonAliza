# MAP - topic decomposition

## Topic

OrchestratorInc agent-orchestrator: architecture, licence

## Subtopics

Classified 2026-10-12 by the researching agent, before the second collection run. Every row is
COVERED by an unknown in `research/DISCOVERY.md` or DISMISSED with its reason; no row is a GAP.
D-## rows are the universal checklist, S-## rows come from recipe `library-selection`, T-## rows
are specific to this topic (the user's orchestrator needs and the comparison they asked for).

| ID | Subtopic | Why it matters | Status | Covered by |
|---|---|---|---|---|
| D-1 | Access model | Public pages, an official API, an auth-walled app, or a paywall - each is a different collection design | COVERED | U-01 |
| D-2 | Auth and credentials | What accounts, keys, or logins the collection and the product need, and who holds them | COVERED | U-04 |
| D-3 | Rate limits and quotas | Caps every cadence in the design, and caps the research collection itself | DISMISSED | no hosted service is called and no API is consumed: the repository and its docs are public pages read once, 7-8 pages in two runs under a 15-credit cap; vendor rate limits for the models it would drive are in docs/research/2026-10-05-provider-wire-formats |
| D-4 | ToS, licensing, legality of the intended use | A prohibition on automated collection, storage, or display ends the design for that source - and sometimes the project | COVERED | U-06 |
| D-5 | Data schema and its stability | How the data is shaped, and how often the source changes the shape without asking | COVERED | U-02 |
| D-6 | Freshness and staleness | How fast the data goes stale, and what staleness costs the product that depends on it | COVERED | U-05 |
| D-7 | Cost at expected volume | The economics at real usage, not the pricing page's first row - this decides viability | DISMISSED | the question is reuse of open code or ideas, not buying a service; model prices are in docs/research/2026-10-02-model-pricing-and-ranking, and any paid tier the repository mentions is recorded under U-01 or U-06 |
| D-8 | Runtime and platform limits | Where this actually executes - OS, runtime version, desktop app, cloud - and what those limits forbid | COVERED | U-03 |
| D-9 | Output obtainability | Does the data your stated "done" depends on exist, and can you actually get it? Load-bearing: a project whose output cannot be produced should die in phase 1, not phase 2 | COVERED | U-01, U-06 |
| S-1 | Current version and release cadence | What is current today, and how often that changes | COVERED | U-05 |
| S-2 | License and its obligations | What the license requires of a project that ships it | COVERED | U-06 |
| S-3 | Maintenance signal | Open issues, last release, and who is actually merging | COVERED | U-05 |
| S-4 | Breaking-change history | What the last two majors broke, and what the upgrade cost | DISMISSED | Moonzila would not take agent-orchestrator as a runtime dependency it upgrades (it is a whole desktop product, and the brief compares it as a reference); upgrade cost applies only if a later design vendors its code, and then its CHANGELOG is collected in a new project |
| T-1 | Orchestration architecture: planner, workers, isolation, review, state and resume | The user's orchestrator needs are exactly these five pieces; how this product builds each is the comparison the brief makes | COVERED | U-02 |
| T-2 | Agent and model plug-in model | Whether it drives model APIs itself or supervises external agent CLIs decides how it could sit beside Moonzila's own selector | COVERED | U-04 |
| T-3 | Budgets and a stop-list | The user named both as orchestrator needs | COVERED | U-02 |
| T-4 | What the project's own lead-orchestrator skill already provides | The user asked to compare with "the skill we already have" | DISMISSED | an internal fact, read from this repository's .claude/skills/lead-orchestrator, not a public page; the comparison is made in the brief from that file, with no collection |

## Coverage notes (per dimension)

- D-1, D-9 (U-01): the repository is public and returned HTTP 200 (E-01), so the output this
  corpus depends on - the project's own pages - is obtainable. The decompose searches did not
  find it (see Candidate material), so every page was named directly from the repository.
- D-2, T-2 (U-04): agents are the user's own installed CLIs with their own sign-ins; the product
  bundles no provider credentials (E-06, E-04). GitHub access is through the user's `gh` login (E-07).
- D-3, D-7: dismissed - no service is bought or called; eight public pages were read once.
- D-4, S-2 (U-06): Apache License 2.0 (E-02, E-01). The terms of the cloud, contracts/cloud and
  private folders were not read; the brief names that as a known unknown with a day-one step.
- D-5, T-1, T-3 (U-02): state is SQLite with derived status and trigger-fed CDC (E-03); planning,
  worktree isolation, review and resume are documented (E-01, E-03, E-04). No captured page
  describes a spending budget or a command stop-list; that is a finding about the pages, not a
  proof that no such control exists in the code.
- D-6, S-1, S-3 (U-05): v0.13.7 on 2026-10-10, nightlies several times a day, a commit on the day
  of retrieval (E-05, E-01): very active, pre-1.0, and fast-moving, so any claim here is stale
  within weeks.
- D-8 (U-03): Go daemon plus Electron/React; Windows supported with ConPTY (E-03, E-08).
- S-4: dismissed - not a dependency Moonzila would upgrade.
- T-4: dismissed - an internal file, compared in the brief without collection.

## Candidate material

Gathered 2026-10-12 with recipe `library-selection` (2 searches, 4 credits). Neither search
returned the OrchestratorInc repository or its docs: the candidates below are generic articles
about agent orchestration and another project's licence page (adoptai/agent-orchestrator), none
of which was collected. The pages that own the facts are the repository itself, its LICENSE and
docs on raw.githubusercontent.com, its releases page, and docs.orchestrator.inc, all reached from
links in the repository page capture.

Likely owners of these facts (by how often a search pointed at them):

- `experienceleague.adobe.com` (2)
- `reddit.com` (2)
- `learn.microsoft.com` (1)
- `ibm.com` (1)
- `github.com/adoptai` (1)
- `jetbrains.com` (1)

Candidate pages:

- [AI Agent Orchestration Patterns - Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns)
- [Adobe Experience Platform Agent Orchestrator | Adobe CX Enterprise](https://experienceleague.adobe.com/en/docs/cx-enterprise-ai/experience-cloud-ai/agents/agent-orchestrator)
- [What is AI Agent Orchestration? - IBM](https://www.ibm.com/think/topics/ai-agent-orchestration)
- [agent-orchestrator/LICENSE at dev - adoptai - GitHub](https://github.com/adoptai/agent-orchestrator/blob/dev/LICENSE)
- [AI Agent Orchestration Explained: How It Works - JetBrains](https://www.jetbrains.com/pages/ai-agents/architecture/ai-agent-orchestration/)
- [What Is an agent orchestrator and Why Is It Needed? - Kore.ai](https://www.kore.ai/ai-glossary/agent-orchestrator)
- [AI Agent Orchestration: A Guide for Enterprise Systems | Databricks Blog](https://www.databricks.com/blog/ai-agent-orchestration)
- [what's the deal with orchestrator agents? Are they actually necessary?](https://www.reddit.com/r/AI_Agents/comments/1qjryam/whats_the_deal_with_orchestrator_agents_are_they/)
- [Armchair Architects: Multi-agent Orchestration and Patterns - YouTube](https://www.youtube.com/watch?v=Dwyx8GomVvQ)
- [9 Open-Source Agent Orchestrators for AI Coding (2026)](https://www.augmentcode.com/tools/open-source-agent-orchestrators)
- [What is Multi-Agent Orchestration? An Overview - Talkdesk](https://www.talkdesk.com/blog/multi-agent-orchestration/)
- [Need to check cost for agents and enterprise license](https://forum.uipath.com/t/need-to-check-cost-for-agents-and-enterprise-license/4962522)
- [How do you actually orchestrate your AI agents? : r/ClaudeAI - Reddit](https://www.reddit.com/r/ClaudeAI/comments/1w989ol/how_do_you_actually_orchestrate_your_ai_agents/)
- [Agent Orchestration 101: Making Multiple AI Agents Work as One - Lyzr](https://www.lyzr.ai/blog/agent-orchestration/)
- [Agent orchestration explained: How enterprises manage multi-agent AI ...](https://www.dataiku.com/blog/agent-orchestration-explained)
- [What is Multi-Agent Orchestration? - Mulesoft](https://www.mulesoft.com/ai/what-is-multi-agent-orchestration)

## Outlines seen in the material

_No outlines - none of these pages is captured yet. `--max-scrapes <n>` captures the first n; their headings appear here._

