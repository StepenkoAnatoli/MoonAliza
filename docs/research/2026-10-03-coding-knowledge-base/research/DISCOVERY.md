# Discovery Contract - A local coding knowledge base for MoonAliza's agents: which language and platform documentation (Python, Node.js, Java, the web platform) may be stored offline and redistributed, in what packaging, how the version a project uses is chosen, and how agent-oriented documentation formats (llms.txt, Context7) work

Started 2026-10-03. This file is the definition of "enough information to build".
`node "/root/.agents/research-kit/bin/preflight.mjs"` reads it and blocks the build until every unknown
below is either `CLOSED` with evidence or `KNOWN-UNKNOWN` with a verification step.

## Build intent

MoonAliza's agents write and change code in the user's projects. The user asked (2026-10-03) for a local coding
knowledge base, so agents can look up how a language, runtime or web API works without running a paid research
job each time. Done means a builder knows, from owners' pages: which documentation sets (Python, Node.js, Java,
the web platform) may be downloaded and kept on the user's PC, and under which license and attribution terms;
the packaging an existing offline system uses and how big the sets are; how a project's language version is read
from its own files, so the matching documentation version is chosen; and what the agent-oriented formats llms.txt
and Context7 are, so they can be weighed as refresh or plug-in sources. The knowledge base answers questions
about how to write code; it is not evidence for a build gate, which stays with Research-Kit corpora.

## Unknowns

A fact belongs here when guessing it wrong changes the design: API limits and pricing,
auth model, data schemas, rate limits, licensing/ToS, platform behavior, current library
versions, competitor pricing, data availability.

Status is exactly one of:
- `CLOSED` - proven by an `E-##` row in `research/EVIDENCE.md` (which must point at cached raw text).
- `KNOWN-UNKNOWN` - unreachable now; the `Evidence` cell names the day-one verification step.

Anything else (`OPEN`, blank, "in progress") fails the gate.

| ID | Unknown | Why it blocks the build | Status | Evidence |
|---|---|---|---|---|
| U-01 | How DevDocs packages documentation for offline use, and the terms on its code and its name | Decides whether MoonAliza reuses an existing format or builds one | CLOSED | E-01 |
| U-02 | The license of the Python documentation | Decides whether it may be stored and shipped | CLOSED | E-03 |
| U-03 | The license and attribution terms of MDN's prose and code samples | Decides storage and the attribution MoonAliza must show | CLOSED | E-04 |
| U-04 | The license covering Node.js documentation | Decides whether it may be stored and shipped | CLOSED | E-05 |
| U-05 | The terms of Oracle's Java documentation, and a redistributable alternative | A restrictive license rules out bundling Oracle's Javadoc | CLOSED | E-06, E-07 |
| U-06 | What the llms.txt format is | Decides whether it can be a refresh source | CLOSED | E-08 |
| U-07 | What Context7 is, how it is reached and what it guarantees | Decides whether it is a default, a plug-in or rejected | CLOSED | E-09 |
| U-08 | How a project declares its language version (Node, Python, Java) | Decides how the matching documentation version is chosen | CLOSED | E-16, E-12, E-13 |
| U-09 | Which versions exist per doc set, and how large the sets are | Decides storage cost and update cadence | CLOSED | E-02 |

## Questions for the human (maximum 3)

Intent questions only - things no document can answer. Facts never go here; they go in
the table above. If a question's answer is in public documentation, it is a research
task, not a question.

## Already decided

- The knowledge base is local and read-only for agents; refreshing it is a user-approved job (MoonAliza plan, approvals for every effect).
- Content from any documentation source is untrusted text to the agent (prompt-injection rule).

Locked decisions for this project. Do not revisit these without the human.
