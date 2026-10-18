# Unit sr-item4-host (MoonAliza host adapter): write the estimate-only cash markers (Item 4)

Worktree and branch: `/home/user/task5-handoff/wt/sr-item4-host`, branch `build/sr-item4-host`, base `fabf06b`. Work only
under `docs/orchestration/smartrouter/` (`route.mjs`, `route.test.mjs`, `README.md`; never `trace/ledger.jsonl`,
`trace/usage.jsonl`, `trace/decisions/hand-*.json` or any committed trace file). Node 24 at `/versions/node/v24.21.0/bin`;
suite `node --test docs/orchestration/smartrouter/route.test.mjs` (91 green at the base); lint
`npx eslint docs/orchestration/smartrouter/route.mjs docs/orchestration/smartrouter/route.test.mjs`; typecheck is
`node --check`. Conventions as in `briefs/router-builder.md` (commit identity; the trailer names the model that writes the
commit plus the Claude-Session line; five-part reports; red-first with guard proofs; never --no-verify; no push). The
commit gate needs no `docs/ARCHITECTURE.md` change for this path.

## Why

SmartRouter's maintainer accepted proposal Item 4 on 2026-10-18 (`docs/proposals/usage-windows-gate4.md` upstream): a §10.5
LedgerRecord may carry `counters.cash-spent: null` and `cash-cap: null` only when `counters["cash-basis"] ==
"estimate-only"`, and a §10.3 Outcome may carry `evidence.actual-spend: null` only when `evidence["actual-spend-basis"] ==
"estimate-only"`. The adapter writes `null` today (this host has no per-call cash) and must now write the markers, so that
`tools/conform_spec.py --record` upstream accepts its records (friction item 2 of the README's log closes).

## Deliverables

A. `route.mjs`: every ledger record the adapter appends carries `"cash-basis": "estimate-only"` inside `counters` when the
   host policy's accounting is estimate-only (read it from `host-policy.json`'s accounting block; name the exact key you
   read, and if no such key exists, add the smallest one and say so). Every outcome the adapter records: if
   `evidence.actual-spend` is `null` and the outcome file has no `actual-spend-basis`, the stored copy
   (`trace/outcomes/<task>-<seq>.json`) and the ledger record's derived fields carry `actual-spend-basis: "estimate-only"`;
   a supplied basis is kept; a non-null spend needs no marker. Existing committed records are not rewritten (the ledger is
   append-only; old lines stay unmarked and conform_spec keeps refusing them, which the README says).
B. Tests red-first with guard proofs: a decision+dispatch+outcome cycle in a temp trace produces records whose counters
   carry the marker; an outcome with `actual-spend: null` gets the basis; a supplied basis is preserved; the goldens
   (hand-*.json under the host-policy-1 fixture) and the committed-policy assertions stay exact (the marker is additive to
   records, not to decisions).
C. README: the "Enforced vs advisory" or friction section says Item 4 is accepted upstream and the markers are written;
   friction item 2 marked closed with the upstream commit once known (write "upstream unit sr-ci-item4" for now).

## Non-goals and stop triggers

No change to gates, routes, reason texts, the policy's profiles or the usage windows; no rewrite of any committed trace
line. Stop and report if a golden changes.

## Report

Return: commits, tests [{name, red, green}], guards, checks (suite counts, lint, node --check; verified), stoppedAt,
mistakes (six fields or "nothing to report"), notes.
