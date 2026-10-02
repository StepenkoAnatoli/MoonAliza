# Recorded collector outputs

`goldens.json` holds the exact exit code and merged stdout/stderr of the real pinned `bin/collect-remote.mjs` (the `kitRevision` it names) for every scenario in `tests/fixtures/collector-scenarios.ts`. Each scenario was run against the loopback fake GitHub in `tests/fixtures/fake-github.ts`. The classifier tests in `tests/research-collector-protocol.test.ts` read these outputs instead of hand-written payloads. The freshness test there re-runs every scenario against the pinned kit and requires the same bytes, so a re-pin that changes what the kit prints fails until the outputs are recaptured and reviewed.

Paths are normalised: the watch's output folder becomes `<out>`, the run's temporary folder becomes `<temp>`, and separators after `<out>` become `/`. The tokens are the test-only `TEST_TOKEN` and `PLAIN_TOKEN`. Neither has a real GitHub token's shape. Three scenarios make the fake echo a token back, to prove that no classifier result carries kit text.

Capture is a maintainer operation, never test setup. Prepare the pinned kit, recapture, then review the diff:

```sh
node scripts/prepare-research-kit.mjs
node --import tsx scripts/capture-collector-golden.ts
```

Recorded on Linux with Node 24.21.0. Windows CI re-runs the freshness test, so its outputs must match these too.
