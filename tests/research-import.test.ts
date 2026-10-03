import { afterEach, beforeAll, expect, test } from 'vitest';
import { execFile } from 'node:child_process';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import goldenFile from './fixtures/research-kit/collector-golden/goldens.json';
import provenance from './fixtures/research-kit/provenance.json';
import { Store } from '../src/engine/store';
import { ResearchJobs, researchDto } from '../src/engine/research';
import { ControlSchema, engineFailureCode, type Control } from '../src/engine/control';
import { Vault } from '../src/main/vault';
import { CollectorSupervisor, type ImportOutcome, type PackageHandoff } from '../src/main/collector';
import { packageImporter } from '../src/main/research-import';
import { packageFileName } from '../src/adapters/research-kit/collector';
import { ResearchKit, VALIDATOR_REVISION } from '../src/adapters/research-kit/adapter';
import type { CollectorConfig } from '../src/main/collector-settings';
import type { OwnedCommand, OwnedResult, OwnedRunner } from '../src/tools/commands';

// Verified import end to end: the real Store, ResearchJobs and ControlSchema, the real ResearchKit staging the pinned kit
// and running its validator on the recorded fixtures, and a fake GitHub at the network boundary. The native helper is
// replaced by a runner that does what it does before CreateProcessW, then runs node directly (the validator) or replays
// the real kit's recorded collector output (dispatch and watch), so this runs on any OS.
const TOKEN = 'github_pat_test-only-import-0123456789';
const at = '2026-10-03T00:00:00.000Z';
const identity = provenance.identity; const CLIENT_REF = identity.clientRef;
const fixture = (name: string) => provenance.fixtures.find(f => f.name === name)!;
const goldens = new Map(goldenFile.goldens.map(g => [g.name, g]));
const replay = (name: string): OwnedResult => ({ status: 'exited', code: goldens.get(name)!.exitCode, output: goldens.get(name)!.output, truncated: false, cancelled: false, timedOut: false });
const kitRoot = resolve('.build/research-kit-external/research-kit');
let nodeSha256: string;
const roots: string[] = []; const closers: Array<() => Promise<unknown>> = [];
beforeAll(async () => { nodeSha256 = createHash('sha256').update(await readFile(process.execPath)).digest('hex'); });
afterEach(async () => { for (const close of closers.splice(0)) await close().catch(() => {}); for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });

/** The GitHub run the fixtures were packaged from, as GitHub's REST API returns it (extra fields included). */
const RUN = { id: identity.workflowRunId, name: 'collect', run_attempt: identity.runAttempt, head_sha: identity.commit, head_branch: identity.ref, path: '.github/workflows/collect.yml',
  event: 'workflow_dispatch', status: 'completed', conclusion: 'success', html_url: 'https://github.com/x/y/actions/runs/1', repository: { id: 1, full_name: identity.repository, private: true } };
function fakeGitHub(answer: () => Response) {
  const seen: Array<{ url: string; init: RequestInit }> = [];
  return { seen, fetch: async (url: string, init: RequestInit) => { seen.push({ url, init }); return answer(); } };
}
const json = (value: object, status = 200) => () => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });

/** Stands in for the helper: admission first, then the child. collect-remote.mjs replays the kit's goldens. */
function runner(validations: OwnedCommand[], watch = 'collected'): OwnedRunner {
  return async (request, signal, options = {}) => {
    if (signal?.aborted) throw new Error('RUN_CANCELLED');
    await options.beforeStart?.();
    options.onStarted?.({ pid: 4242, createdAt: '1' });
    if (request.args.some(arg => arg.endsWith('collect-remote.mjs'))) {
      if (request.args.includes('--no-wait')) return replay('dispatch-ok');
      await copyFile(resolve(`tests/fixtures/research-kit/${watch}.zip`), join(request.cwd, 'out', packageFileName(CLIENT_REF)));
      return replay('watch-collected');
    }
    validations.push(request);
    return new Promise(done => execFile(request.executable, request.args, { cwd: request.cwd, env: request.env, timeout: request.timeoutMs, maxBuffer: request.maxOutputBytes, encoding: 'utf8' },
      (error, stdout) => done({ status: 'exited', code: error ? (typeof error.code === 'number' ? error.code : null) : 0, output: stdout, truncated: false, cancelled: false, timedOut: false })));
  };
}

async function harness(answer: () => Response, options: { watch?: string } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'moonaliza-import-')); roots.push(root);
  const store = new Store(join(root, 'state.sqlite')); closers.push(async () => store.close());
  const notices: unknown[] = []; const jobs = new ResearchJobs(store, research => notices.push(research));
  store.putProject({ id: 'p', name: 'p', rootPath: 'C:\\work\\p', pathLabel: 'p', trusted: true, trustRevision: 1, policy: { revision: 1, inference: 'local-only', research: 'public-technical' }, missing: false, createdAt: at });
  const key = randomBytes(32);
  const vault = new Vault(join(root, 'vault'), {
    isEncryptionAvailable: () => true,
    encryptString(value: string) { const iv = randomBytes(12); const c = createCipheriv('aes-256-gcm', key, iv); const d = Buffer.concat([c.update(value, 'utf8'), c.final()]); return Buffer.concat([iv, c.getAuthTag(), d]); },
    decryptString(value: Buffer) { const d = createDecipheriv('aes-256-gcm', key, value.subarray(0, 12)); d.setAuthTag(value.subarray(12, 28)); return Buffer.concat([d.update(value.subarray(28)), d.final()]).toString('utf8'); },
  });
  await vault.initialize('epoch-1');
  const secretRef = await vault.saveStaged(TOKEN); await vault.commit(secretRef);
  const config: CollectorConfig = { revision: 1, repository: identity.repository, workflow: 'collect.yml', ref: identity.ref, secretRef };
  const controls: Control[] = [];
  const control = async (raw: Control) => {
    const command = ControlSchema.parse(JSON.parse(JSON.stringify(raw))); controls.push(command);
    try {
      const result = command.method === 'research.context' ? jobs.context(command.researchId)
        : command.method === 'research.transition' ? jobs.transition(command)
          : command.method === 'research.recover' ? jobs.recover(command.owned) : undefined;
      return JSON.parse(JSON.stringify(result));
    } catch (error) { throw new Error(engineFailureCode(error), { cause: error }); }
  };
  const validations: OwnedCommand[] = [];
  const kit = new ResearchKit({ kitRoot, nodePath: process.execPath, nodeSha256, storageRoot: join(root, 'storage'), helperPath: resolve('.build/native/MoonAlizaHost.exe') }, runner(validations, options.watch));
  const github = fakeGitHub(answer);
  const settings = { current: () => config };
  const importer = packageImporter({ epoch: () => 'epoch-1', vault, settings, kit, fetch: github.fetch, packageWorkflow: identity.workflow });
  const handoffs: PackageHandoff[] = []; const outcomes: ImportOutcome[] = [];
  const supervisor = new CollectorSupervisor({
    control, epoch: () => 'epoch-1', vault, settings, kit, spoolDirectory: join(root, 'runs'),
    importPackage: async handoff => { handoffs.push(handoff); const outcome = await importer(handoff); outcomes.push(outcome); return outcome; },
    limits: { backoffFirstMs: 5, stillRunningDelayMs: 5, quitDrainMs: 50 }, retryDelayMs: 10,
  });
  closers.unshift(() => kit.close()); closers.unshift(() => supervisor.close(50));
  const start = async () => {
    await supervisor.attach();
    const { research } = store.createResearch({ id: randomUUID(), projectId: 'p', topic: 'Ollama context limits', inputs: { queries: ['ollama num_ctx'], urls: [], preferDomains: [], depth: 'quick', maxPages: 3 }, clientRef: CLIENT_REF, researchLevel: 'public-technical', policyRevision: 1, trustRevision: 1 }, { actor: 'user' });
    supervisor.observe(researchDto(research)); return research;
  };
  return { root, store, controls, notices, validations, github, handoffs, outcomes, importer, vault, settings, config, kit, start };
}
async function until(check: () => boolean, timeout = 30000) {
  const end = Date.now() + timeout;
  while (!check()) { if (Date.now() > end) throw new Error('timed out waiting'); await new Promise(r => setTimeout(r, 10)); }
}
async function noTokenAnywhere(h: Awaited<ReturnType<typeof harness>>) {
  expect(JSON.stringify(h.controls)).not.toContain(TOKEN);
  expect(JSON.stringify(h.notices)).not.toContain(TOKEN);
  for (const v of h.validations) { expect(JSON.stringify(v)).not.toContain(TOKEN); }
  for (const name of await readdir(h.root)) if (name.startsWith('state.sqlite')) expect((await readFile(join(h.root, name))).includes(Buffer.from(TOKEN))).toBe(false);
}

test('a collected package is verified against the GitHub run and its verification is journaled on collecting -> collected', async () => {
  const h = await harness(json(RUN));
  const job = await h.start();
  await until(() => h.store.getResearch(job.id)!.status === 'collected');
  const collected = fixture('collected');
  const step = h.store.researchEvents(job.id).events.at(-1)!;
  expect(step).toMatchObject({ revision: 4, from: 'collecting', to: 'collected', actor: 'main', cause: 'PACKAGE_VERIFIED' });
  expect(step.detail).toEqual({ verification: {
    artifactSha256: collected.sha256, artifactBytes: collected.byteLength, validatorRevision: VALIDATOR_REVISION, nodeSha256, state: 'REVIEW_IN_PROGRESS',
    jobRevision: 3, projectRevision: 1, repository: identity.repository, ref: identity.ref, workflow: identity.workflow, commit: identity.commit, runAttempt: identity.runAttempt, downloadDigest: 'unverified',
  } });
  // The exact bytes are retained, content-addressed, outside the collector's folder.
  expect(createHash('sha256').update(await readFile(join(h.root, 'storage', 'artifacts', `${collected.sha256}.zip`))).digest('hex')).toBe(collected.sha256);
  // One authenticated GET of the dispatched run; the token is only in its Authorization header and redirects are not followed.
  expect(h.github.seen).toHaveLength(1);
  const { url, init } = h.github.seen[0]!;
  expect(url).toBe(`https://api.github.com/repos/${identity.repository}/actions/runs/1`);
  expect(init).toMatchObject({ method: 'GET', redirect: 'manual', credentials: 'omit' });
  expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
  expect(h.validations).toHaveLength(1);
  expect(h.validations[0]!.args).toEqual(expect.arrayContaining(['validate', '--expect-client-ref', CLIENT_REF, '--json']));
  await noTokenAnywhere(h);
}, 60000);

test('a package from a different run attempt or commit fails as PACKAGE_IDENTITY_MISMATCH', async () => {
  for (const run of [{ ...RUN, run_attempt: 2 }, { ...RUN, head_sha: 'e'.repeat(40) }]) {
    const h = await harness(json(run));
    const job = await h.start();
    await until(() => h.store.getResearch(job.id)!.status === 'failed');
    expect(h.store.getResearch(job.id)).toMatchObject({ failure: 'PACKAGE_IDENTITY_MISMATCH', workflowRunId: '1' });
    expect(h.store.researchEvents(job.id).events.at(-1)).toMatchObject({ from: 'collecting', to: 'failed', cause: 'IMPORT_IDENTITY_MISMATCH', detail: { failure: 'PACKAGE_IDENTITY_MISMATCH' } });
    expect(h.validations).toHaveLength(1);
    await noTokenAnywhere(h);
  }
}, 60000);

test('a run that is not the one the job dispatched fails as RUN_IDENTITY_MISMATCH before any validation', async () => {
  for (const run of [{ ...RUN, path: '.github/workflows/other.yml' }, { ...RUN, head_branch: 'main' }, { ...RUN, event: 'push' }, { ...RUN, id: 2 }, { ...RUN, repository: { full_name: 'someone/else' } }]) {
    const h = await harness(json(run));
    const job = await h.start();
    await until(() => h.store.getResearch(job.id)!.status === 'failed');
    expect(h.store.getResearch(job.id)).toMatchObject({ failure: 'RUN_IDENTITY_MISMATCH' });
    expect(h.store.researchEvents(job.id).events.at(-1)).toMatchObject({ cause: 'IMPORT_RUN_MISMATCH' });
    expect(h.validations).toHaveLength(0);
  }
}, 60000);

test('an unreadable, redirected or still-running GitHub run parks the job for import without validating or failing it', async () => {
  const answers = [json({ message: 'Server Error' }, 503), () => new Response(null, { status: 302, headers: { location: 'https://elsewhere.invalid/run' } }), json({ ...RUN, head_sha: 'not-a-sha' }), json({ ...RUN, status: 'in_progress' })];
  for (const answer of answers) {
    const h = await harness(answer);
    const job = await h.start();
    await until(() => h.outcomes.length === 1);
    expect(h.outcomes).toEqual([{ kind: 'deferred' }]);
    await new Promise(r => setTimeout(r, 150));
    expect(h.handoffs).toHaveLength(1);
    expect(h.github.seen).toHaveLength(1);
    expect(h.store.getResearch(job.id)!.status).toBe('collecting');
    expect(h.validations).toHaveLength(0);
    await noTokenAnywhere(h);
  }
}, 60000);

test('the importer rejects an approval or a failed collection, fails a tampered package, and defers without a kit, token or matching settings', async () => {
  const h = await harness(json(RUN));
  const folder = join(h.root, 'packages'); await mkdir(folder);
  const handoff = async (name: string): Promise<PackageHandoff> => {
    const file = join(folder, `${name}-${randomUUID()}.zip`); await copyFile(resolve(`tests/fixtures/research-kit/${name}.zip`), file);
    return { researchId: randomUUID(), projectId: 'p', expectedRevision: 3, projectRevision: 1, clientRef: CLIENT_REF, workflowRunId: '1', file,
      target: { collectorRevision: 1, repository: identity.repository, workflow: 'collect.yml', ref: `refs/heads/${identity.ref}` }, kit: { status: 'PASS', state: 'REVIEW_REQUIRED' }, signal: new AbortController().signal };
  };
  expect(await h.importer(await handoff('approved'))).toEqual({ kind: 'rejected', failure: 'ARTIFACT_INVALID', cause: 'IMPORT_UNEXPECTED_APPROVAL' });
  expect(await h.importer(await handoff('failed'))).toEqual({ kind: 'rejected', failure: 'COLLECTION_FAILED', cause: 'IMPORT_COLLECTION_FAILED' });
  expect(await h.importer(await handoff('tampered'))).toEqual({ kind: 'rejected', failure: 'ARTIFACT_INVALID', cause: 'IMPORT_FAIL' });
  expect(await h.importer(await handoff('legacy-review'))).toMatchObject({ kind: 'verified', verification: { state: 'REVIEW_REQUIRED', ref: identity.ref, jobRevision: 3 } });
  expect(h.github.seen).toHaveLength(4);
  const seen = h.github.seen.length;
  const deferred = [
    packageImporter({ epoch: () => 'epoch-1', vault: h.vault, settings: h.settings, kit: null, fetch: h.github.fetch }),
    packageImporter({ epoch: () => 'epoch-1', vault: h.vault, settings: { current: () => ({ ...h.config, secretRef: null }) }, kit: h.kit, fetch: h.github.fetch }),
    packageImporter({ epoch: () => 'epoch-1', vault: h.vault, settings: { current: () => ({ ...h.config, repository: 'o/r' }) }, kit: h.kit, fetch: h.github.fetch }),
  ];
  for (const importer of deferred) expect(await importer(await handoff('collected'))).toEqual({ kind: 'deferred' });
  // A grant for another epoch is refused by the vault: no request is made without the token.
  expect(await packageImporter({ epoch: () => 'epoch-0', vault: h.vault, settings: h.settings, kit: h.kit, fetch: h.github.fetch })(await handoff('collected'))).toEqual({ kind: 'deferred' });
  expect(h.github.seen).toHaveLength(seen);
}, 120000);
