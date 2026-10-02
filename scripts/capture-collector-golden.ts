// Maintainer-only operation, like generate-research-fixtures.mjs: never run by tests or CI; review the diff.
// Runs the real pinned collect-remote.mjs (prepare it first) through every scenario against the loopback fake
// GitHub and records its exit code and merged output. Run: node --import tsx scripts/capture-collector-golden.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { startFakeGitHub } from '../tests/fixtures/fake-github';
import { GOLDEN_FILE, SCENARIOS, TEST_TOKEN, runScenario, type Golden } from '../tests/fixtures/collector-scenarios';
import { VALIDATOR_REVISION } from '../src/adapters/research-kit/adapter';

const fake = await startFakeGitHub(TEST_TOKEN);
try {
  const goldens: Golden[] = [];
  for (const scenario of SCENARIOS) {
    const { requests: _requests, ...golden } = await runScenario(fake, scenario);
    goldens.push(golden); console.log(`${golden.name}: exit ${golden.exitCode}`);
  }
  await mkdir(dirname(GOLDEN_FILE), { recursive: true });
  await writeFile(GOLDEN_FILE, JSON.stringify({ kitRevision: VALIDATOR_REVISION, node: process.version, platform: process.platform, goldens }, null, 2) + '\n');
} finally { await fake.close(); }
