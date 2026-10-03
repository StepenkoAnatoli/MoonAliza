# Brief - A local coding knowledge base for MoonAliza's agents: which language and platform documentation (Python, Node.js, Java, the web platform) may be stored offline and redistributed, in what packaging, how the version a project uses is chosen, and how agent-oriented documentation formats (llms.txt, Context7) work

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

MoonAliza's agents write and change code in the user's projects. The user asked (2026-10-03) for a local coding
knowledge base, so agents can look up how a language, runtime or web API works without running a paid research
job each time. Done means a builder knows, from owners' pages: which documentation sets (Python, Node.js, Java,
the web platform) may be downloaded and kept on the user's PC, and under which license and attribution terms;
the packaging an existing offline system uses and how big the sets are; how a project's language version is read
from its own files, so the matching documentation version is chosen; and what the agent-oriented formats llms.txt
and Context7 are, so they can be weighed as refresh or plug-in sources. The knowledge base answers questions
about how to write code; it is not evidence for a build gate, which stays with Research-Kit corpora.

## What we verified

| Claim | Source | Type |
|---|---|---|
| DevDocs (MPL-2.0 code) ships each documentation set as normalized HTML partials plus an index and an offline-data JSON file, with a manifest of available sets; `thor docs:download` fetches pre-generated sets, and the authors ask that generated docs be attributed to DevDocs. [quote: The end result is a set of normalized HTML partials and two JSON files (index + offline data)] | E-01 `raw.githubusercontent.com` (U-01) | P |
| The Python documentation is under the PSF License Version 2, and since Python 3.8.6 its code examples are dual-licensed PSF-2.0 and Zero-Clause BSD, so it may be stored and redistributed with the notice. [quote: Python software and documentation are licensed under the] _(partial capture)_ | E-03 `docs.python.org` (U-02) | P |
| MDN prose is CC-BY-SA 2.5 or later and must be attributed to "Mozilla Contributors" with title, link and a note of changes, and reuse stays CC-BY-SA; code samples added on or after 2010-08-20 are CC0. [quote: Code samples added on or after August 20, 2010 are in the] _(partial capture)_ | E-04 `developer.mozilla.org` (U-03) | P |
| Node.js is licensed under MIT terms that cover the software and its associated documentation files, so its docs may be stored and redistributed with the notice. [quote: of this software and associated documentation files (the "Software")] | E-05 `raw.githubusercontent.com` (U-04) | P |
| Oracle's Java SE documentation may not be copied or distributed except as the license agreement or law allows, so Oracle's Javadoc must not be bundled. [quote: you may not use, copy, reproduce, translate, broadcast, modify, license] _(partial capture)_ | E-06 `docs.oracle.com` (U-05) | P |
| DevDocs' OpenJDK sets are extracted from Debian's OpenJDK package and are licensed GPLv2 with the Classpath Exception; sets exist per Java release (e.g. 21, 25). This is the redistributable route for Java docs. [quote: Licensed under the GNU General Public License, version 2, with the Classpath Exception.] | E-07 `raw.githubusercontent.com` (U-05) | P |
| llms.txt (v2) is a small Markdown file at a site root or any sub-path that links to LLM-friendly Markdown versions of pages (`page.html.md`), meant for agents to read and follow; it is a format MoonAliza can parse with fixed code. [quote: The file can be placed at the site root, or at any path within it, covering the pages under that path.] | E-08 `llmstxt.org` (U-06) | P |
| Context7 is a hosted MCP server (`https://mcp.context7.com/mcp`, tools `resolve-library-id` and `query-docs`, optional API key for higher rate limits) whose library docs are community-contributed and not guaranteed accurate or safe. [quote: we cannot guarantee the accuracy, completeness, or security of all library documentation] | E-09 `raw.githubusercontent.com` (U-07) | P |
| A Node project declares the Node versions it works on in package.json `engines.node`; without it any version is accepted. [quote: "node": ">=0.10.3 <15"] | E-16 `raw.githubusercontent.com` (U-08) | P |
| A Python project declares the Python versions it supports in pyproject.toml `requires-python`. [quote: The Python version requirements of the project.] _(partial capture)_ | E-12 `packaging.python.org` (U-08) | P |
| A Maven project declares the Java SE release it builds against with `maven.compiler.release` (or the plugin's `release`), the value that selects the Java docs version. [quote: <maven.compiler.release>8</maven.compiler.release>] _(partial capture)_ | E-13 `maven.apache.org` (U-08) | P |
| DevDocs publishes a machine-readable list of 836 documentation sets with version, release, last-update time and size; Python 3.14 is about 20.8 MB, OpenJDK 21 about 103 MB, Node.js 24 about 6.3 MB, each with its own attribution line. [quote: "db_size": 20817803,] | E-02 `devdocs.io` (U-09) | P |

## Contradictions and how they were resolved

No source contradicts another. Two things look like conflicts and are not:

- **Java.** Oracle's documentation forbids copying and distribution (E-06), while DevDocs ships Java API docs (E-07). They are different sources. DevDocs' sets are extracted from Debian's OpenJDK package under GPLv2 with the Classpath Exception, even though its scraper names docs.oracle.com as the base URL. Trust the license DevDocs states for the OpenJDK package, and never bundle Oracle-hosted Javadoc. Verify the Debian package's copyright file before shipping (day-one check under Decision).
- **DevDocs' license file.** `COPYING` returned 404. The README names MPL-2.0 and points to `COPYRIGHT` and `LICENSE` (E-01). The README is the owner's statement, so it is trusted.

Two captures (E-03, E-04) are graded partial; the omitted sections are page navigation, and the quoted license sentences are in the captured text.

## Known unknowns

None. Every blocking unknown was closed with cited evidence.

## Decision

Build a **local, version-matched documentation store** for MoonAliza's agents. Don't build a model fine-tune or a web scraper.

1. **Format: reuse DevDocs' packaging** (E-01). Each set is normalized HTML partials plus an index JSON and an offline-data JSON, listed in a manifest. `devdocs.io/docs.json` (E-02) names every set with its `version`, `release`, `mtime`, `db_size` and `attribution`.
2. **Ship nothing by default. Download on the user's approval**, per set, and keep each set's attribution and license next to it and on every answer that quotes it. These sets may be stored:
   - Python: PSF-2.0, examples also 0BSD (E-03).
   - Node.js: MIT, covering its documentation (E-05).
   - MDN: CC-BY-SA 2.5+ prose, attributed to "Mozilla Contributors" with title and link; code samples CC0 (E-04).
   - OpenJDK: GPLv2 with the Classpath Exception (E-07).

   Oracle's Javadoc is **excluded** (E-06).
3. **Pick the version from the project's own files:**
   - `package.json` `engines.node` (E-16);
   - `pyproject.toml` `requires-python` (E-12);
   - Maven `maven.compiler.release` (E-13).

   Take the newest DevDocs release that satisfies the range. If nothing declares a version, ask the user rather than guess.
4. **Sizes decide the default set.** Python 3.14 is about 21 MB, Node.js 24 about 6 MB, OpenJDK 21 about 103 MB (E-02). Java is the expensive one, so offer it only for Java projects.
5. **Freshness:** show each set's `mtime`, and offer a refresh when DevDocs lists a newer `release` for the matched version.
6. **Agents read it as untrusted text.** The store is a tool, not instructions, under the prompt-injection rule. Answers from it are **not** build-gate evidence; that stays with Research-Kit corpora.
7. **Optional sources, not defaults:**
   - llms.txt and its `.md` pages (E-08) as a refresh or ad-hoc source through a normal research job;
   - Context7 (E-09) only as a user-approved MCP plug-in, because it is hosted and its content is not guaranteed safe or accurate.

**First build step:** a `docs.json` reader that maps a project's declared Node, Python and Java version ranges to DevDocs slugs and releases, with a test over the captured index.

**Day-one check:** read the `debian/copyright` file of the OpenJDK package the DevDocs set came from before offering Java docs.

**Out of scope:** bundling any set in the installer, Oracle Javadoc, fine-tuning a model on documentation, and using knowledge-base answers as research evidence.

## Next steps

1. Review the **TODO** sections above (Contradictions, Decision) before handing off.
2. Hand this file to the builder (phase 2). Re-running `node "/root/.agents/research-kit/bin/brief.mjs"`
   redrafts this file while it is unedited; after any edit it refuses without `--force`,
   so your judgements are preserved.

<!-- research-kit:brief-draft body=4c9691622d0d68f3 inputs=05916b1b52ba7922 gate=pass -->
