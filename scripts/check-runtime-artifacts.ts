import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { isAbsolute, join, relative } from 'node:path';
import { promisify } from 'node:util';
import { downloadArtifact } from '../src/models/download';
import { extractRuntimeArchive } from '../src/models/archive';
import { privateDirectory } from '../src/models/artifact-files';
import { safeCommandEnvironment, type OwnedResult } from '../src/tools/commands';
import { InferenceScheduler } from '../src/engine/scheduler';
import { ManagedOllamaRuntime, runtimeJson } from '../src/models/managed-ollama';

// Opt-in developer verification; ordinary tests/builds never download or run Ollama.
// Published v0.34.4 release identity, independently checked against GitHub's release API.
const artifact = { sha256: '535193f38f3344e5b08f5d1c171c31ce11aa17f0124ff69ae26d8ec7fe06fa62', sizeBytes: 1461155106, url: 'https://github.com/ollama/ollama/releases/download/v0.34.4/ollama-windows-amd64.zip', redirectHosts: ['release-assets.githubusercontent.com'] };
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Windows x64 is required');
const root = await privateDirectory('.build/managed-artifact-check');
const scratch = join(root, `qualification-${randomUUID()}`); await mkdir(scratch);
const runtime = join(scratch, 'runtime'); const home = join(scratch, 'home'); const models = join(scratch, 'models');
const powershell = join(process.env.SystemRoot ?? 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
const report: Record<string, unknown> = { checkedAt: new Date().toISOString(), version: '0.34.4', archiveSha256: artifact.sha256, archiveBytes: artifact.sizeBytes, inferencePerformed: false, modelQualification: 'not-performed' };
let terminal: OwnedResult | undefined; let port: number | undefined;
const owner = new ManagedOllamaRuntime(); const started = Date.now();
const scheduler = new InferenceScheduler({ stopRuntime: async () => {
  const stopped = await owner.stop();
  if (stopped) {
    terminal = stopped;
    report.stop = { status: terminal.status, cancelled: terminal.cancelled, timedOut: terminal.timedOut };
    assert.equal(terminal.status, 'exited', 'RUNTIME_STOP_UNCONFIRMED');
  }
} });
try {
  let progressAt = 0;
  const path = await downloadArtifact(artifact, join(root, 'cache'), { fetcher: (url, init) => fetch(url, init), onProgress(bytes) { if (Date.now() - progressAt > 30000) { progressAt = Date.now(); console.log(JSON.stringify({ downloadedBytes: bytes, totalBytes: artifact.sizeBytes })); } } });
  const extracted = await extractRuntimeArchive(path, runtime, { maxExpandedBytes: 2 * 1024 ** 3, maxEntries: 128 });
  report.files = extracted.files; report.expandedBytes = extracted.expandedBytes;
  const executable = join(runtime, 'ollama.exe');
  const signature = await promisify(execFile)(powershell, ['-NoProfile', '-NonInteractive', '-Command', '$s = Get-AuthenticodeSignature -LiteralPath $env:MOONALIZA_CANDIDATE_EXE; [pscustomobject]@{status=$s.Status.ToString();subject=$s.SignerCertificate.Subject} | ConvertTo-Json -Compress'], { windowsHide: true, env: { ...safeCommandEnvironment(), MOONALIZA_CANDIDATE_EXE: executable }, timeout: 20000 });
  const signer = JSON.parse(signature.stdout); assert.equal(signer.status, 'Valid'); assert.match(signer.subject, /(?:^|, )O=Ollama Inc\.(?:,|$)/); report.authenticode = signer;
  await mkdir(home); await mkdir(models);
  const runtimeCheck = scheduler.run(async lease => {
    const launchAt = Date.now();
    const session = await owner.start({ directory: runtime, executable: 'ollama.exe', version: '0.34.4', files: extracted.files, homeDirectory: home, modelsDirectory: models }, lease);
    report.runtimeReadyAfterMs = Date.now() - launchAt; port = Number(new URL(session.endpoint).port);
    report.socketOwnershipVerified = true; report.ownershipMethod = 'established-tuple-pid-creation-time'; report.ownerIdentity = session.identity; report.cloudDisabled = true;
    const tags = await runtimeJson(session, '/api/tags') as { models?: unknown[] };
    assert.deepEqual(tags.models, []); report.isolatedModelsEmpty = true;
  }, { leaseTimeoutMs: 90000, heartbeatTimeoutMs: 75000 });
  // Queue before startup completes. This callback must see the old runtime gone.
  const nextLease = scheduler.run(async lease => {
    lease.assertCurrent(); assert.equal(report.isolatedModelsEmpty, true);
    const listener = createServer();
    await new Promise<void>((done, reject) => { listener.once('error', reject); listener.listen(port!, '127.0.0.1', done); });
    await new Promise<void>(done => listener.close(() => done()));
    report.schedulerFollowupAfterStop = true;
  });
  const checks = await Promise.allSettled([runtimeCheck, nextLease]);
  for (const check of checks) if (check.status === 'rejected') throw check.reason;
} catch (error) { report.failure = error instanceof Error && /^[A-Z_]+$/.test(error.message) ? error.message : error instanceof Error ? error.name : 'unknown'; process.exitCode = 1; }
finally {
  try { await scheduler.shutdown(); } catch { report.failure = 'SchedulerCleanupFailed'; }
  if (terminal) {
    report.stop = { status: terminal.status, cancelled: terminal.cancelled, timedOut: terminal.timedOut };
    if (port) {
      const listener = createServer();
      try { await new Promise<void>((done, reject) => { listener.once('error', reject); listener.listen(port, '127.0.0.1', done); }); report.portReleased = true; await new Promise<void>(done => listener.close(() => done())); } catch { report.portReleased = false; }
    }
    report.passed = !report.failure && report.schedulerFollowupAfterStop === true && report.socketOwnershipVerified === true && report.cloudDisabled === true && report.isolatedModelsEmpty === true && terminal.status === 'exited' && terminal.cancelled && report.portReleased === true;
  }
  if (report.passed !== true) process.exitCode = 1;
  const child = relative(root, scratch); assert(child && !child.startsWith('..') && !isAbsolute(child));
  await rm(scratch, { recursive: true, force: true }); report.temporaryRuntimeRemoved = true; report.elapsedMs = Date.now() - started;
  await writeFile(join(root, 'verification.json'), JSON.stringify(report, null, 2));
  const { files, ...summary } = report; console.log(JSON.stringify({ ...summary, fileCount: Array.isArray(files) ? files.length : 0 }));
}
