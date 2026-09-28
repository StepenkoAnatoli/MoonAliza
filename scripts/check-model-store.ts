import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { isAbsolute, join, relative } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';
import { downloadArtifact } from '../src/models/download';
import { extractRuntimeArchive } from '../src/models/archive';
import { boundedJson, privateDirectory } from '../src/models/artifact-files';
import { materializeModels, verifyModelStore } from '../src/models/model-store';
import { ManagedOllamaRuntime, runtimeJson } from '../src/models/managed-ollama';
import { probeHardware } from '../src/models/hardware';
import { InferenceScheduler } from '../src/engine/scheduler';
import { safeCommandEnvironment, type OwnedResult } from '../src/tools/commands';

// Opt-in storage/inventory verification. No model inference, qualification receipt or activation.
// Official qwen3:0.6b manifest observed 2026-09-28; every transfer is pinned by bytes and SHA-256.
const manifest = { sha256: '7df6b6e09427a769808717c0a93cadc4ae99ed4eb8bf5ca557c90846becea435', sizeBytes: 858 };
const blobs = [
  { sha256: 'b0830f4ff6a0220cfd995455206353b0ed23c0aee865218b154b7a75087b4e55', sizeBytes: 490 },
  { sha256: '7f4030143c1c477224c5434f8272c662a8b042079a0a584f0a27a1684fe2e1fa', sizeBytes: 522640096 },
  { sha256: 'ae370d884f108d16e7cc8fd5259ebc5773a0afa6e078b11f4ed7e39a27e0dfc4', sizeBytes: 1723 },
  { sha256: 'd18a5cc71b84bc4af394a31116bd3932b42241de70c77d2b76d69a314ec8aa12', sizeBytes: 11338 },
  { sha256: 'cff3f395ef3756ab63e58b0ad1b32bb6f802905cae1472e6a12034e4246fbbdb', sizeBytes: 120 },
];
const archive = { sha256: '535193f38f3344e5b08f5d1c171c31ce11aa17f0124ff69ae26d8ec7fe06fa62', sizeBytes: 1461155106, url: 'https://github.com/ollama/ollama/releases/download/v0.34.4/ollama-windows-amd64.zip', redirectHosts: ['release-assets.githubusercontent.com'] };
const registry = 'https://registry.ollama.ai/v2/library/qwen3';
const redirectHosts = ['dd20bb891979d25aebc8bec07b2b3bbc.r2.cloudflarestorage.com'];
const fetcher = (url: string, init?: RequestInit) => fetch(url, init);
if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Windows x64 required');
const root = await privateDirectory('.build/managed-artifact-check'); const cache = join(root, 'model-cache');
const scratch = join(root, `model-check-${randomUUID()}`); await mkdir(scratch);
const modelsDirectory = join(scratch, 'models'), homeDirectory = join(scratch, 'home');
const report: Record<string, unknown> = { checkedAt: new Date().toISOString(), version: '0.34.4', archiveSha256: archive.sha256, manifest, blobs, inferencePerformed: false, modelQualification: 'not-performed', activationPerformed: false };
const owner = new ManagedOllamaRuntime(); let terminal: OwnedResult | undefined; let port: number | undefined;
const scheduler = new InferenceScheduler({ stopRuntime: async () => { const result = await owner.stop(); if (result) { terminal = result; assert.equal(result.status, 'exited'); } } });
const started = Date.now();
async function released(port: number) {
  const listener = createServer();
  await new Promise<void>((done, reject) => { listener.once('error', reject); listener.listen(port, '127.0.0.1', done); });
  await new Promise<void>(done => listener.close(() => done()));
}
try {
  // The registry serves this manifest by tag; the pinned byte identity rejects any tag change.
  const artifacts = [{ ...manifest, url: `${registry}/manifests/0.6b`, redirectHosts: [] }, ...blobs.map(blob => ({ ...blob, url: `${registry}/blobs/sha256:${blob.sha256}`, redirectHosts }))];
  for (const artifact of artifacts) {
    let last = 0;
    await downloadArtifact(artifact, cache, { fetcher, onProgress(bytes) { if (Date.now() - last > 30000) { last = Date.now(); console.log(JSON.stringify({ artifact: artifact.sha256, downloadedBytes: bytes, totalBytes: artifact.sizeBytes })); } } });
  }
  const model = (await materializeModels([{ manifest, blobs }], modelsDirectory, { cacheDirectory: cache }))[0]!;
  report.materialized = model;
  const installedManifest = join(modelsDirectory, 'manifests', 'registry.ollama.ai', 'moonaliza', manifest.sha256, 'verified');
  assert.deepEqual(await readFile(installedManifest), await readFile(join(cache, `${manifest.sha256}.blob`))); report.exactManifestBytes = true;
  let directory = join(root, 'ollama-0.34.4');
  const FileList = z.object({ files: z.array(z.object({ path: z.string(), sizeBytes: z.number(), sha256: z.string() })) });
  let extracted: z.infer<typeof FileList>;
  try { extracted = FileList.parse(await boundedJson(join(root, 'extraction.json'), 1024 ** 2)); }
  catch {
    const path = await downloadArtifact(archive, join(root, 'cache'), { fetcher });
    directory = join(scratch, 'runtime'); extracted = await extractRuntimeArchive(path, directory, { maxExpandedBytes: 2 * 1024 ** 3, maxEntries: 128 });
  }
  const files = extracted.files.map(({ path, sizeBytes, sha256 }) => ({ path, sizeBytes, sha256 })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const fileDigest = createHash('sha256').update(JSON.stringify(files)).digest('hex');
  assert.equal(fileDigest, 'f1ce5ca614931eabda0172e775cd33bd92dab3b346318244c1e4b192844e35d0'); report.runtimeFilesDigest = fileDigest; report.runtimeFileCount = files.length;
  const powershell = join(process.env.SystemRoot ?? 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const signature = await promisify(execFile)(powershell, ['-NoProfile', '-NonInteractive', '-Command', '$s = Get-AuthenticodeSignature -LiteralPath $env:MOONALIZA_CANDIDATE_EXE; [pscustomobject]@{status=$s.Status.ToString();subject=$s.SignerCertificate.Subject} | ConvertTo-Json -Compress'], { windowsHide: true, env: { ...safeCommandEnvironment(), MOONALIZA_CANDIDATE_EXE: join(directory, 'ollama.exe') }, timeout: 20000 });
  const signer = JSON.parse(signature.stdout); assert.equal(signer.status, 'Valid'); assert.match(signer.subject, /(?:^|, )O=Ollama Inc\.(?:,|$)/); report.authenticode = signer;
  const hardware = await probeHardware({ runtimeIdentity: archive.sha256 });
  report.hardware = hardware.hardware ? { totalRamBytes: hardware.hardware.totalRamBytes, availableRamBytes: hardware.hardware.availableRamBytes, adapters: hardware.hardware.adapters } : null;
  const check = scheduler.run(async lease => {
    const at = Date.now(); const session = await owner.start({ directory, executable: 'ollama.exe', version: '0.34.4', files, homeDirectory, modelsDirectory }, lease);
    report.runtimeReadyAfterMs = Date.now() - at; port = Number(new URL(session.endpoint).port);
    report.socketOwnershipVerified = true; report.ownershipMethod = 'established-tuple-pid-creation-time'; report.cloudDisabled = true;
    const inventory = z.object({ models: z.array(z.object({ name: z.string(), digest: z.string(), size: z.number(), details: z.object({ format: z.string(), quantization_level: z.string() }) })) }).parse(await runtimeJson(session, '/api/tags'));
    assert.equal(inventory.models.length, 1);
    const installed = inventory.models[0]!; assert.equal(installed.name, model.name); assert.equal(installed.digest.replace(/^sha256:/, ''), manifest.sha256);
    assert.equal(installed.details.format, 'gguf'); assert.equal(installed.details.quantization_level, model.quantization); assert.equal(installed.size, model.sizeBytes);
    report.inventory = inventory.models; report.inventoryMatched = true;
    assert.deepEqual(z.object({ models: z.array(z.unknown()) }).parse(await runtimeJson(session, '/api/ps')).models, []); report.noLoadedModels = true;
  }, { leaseTimeoutMs: 90000, heartbeatTimeoutMs: 75000 });
  const next = scheduler.run(async lease => { lease.assertCurrent(); assert.equal(report.inventoryMatched, true); await released(port!); report.followupAfterStop = true; });
  for (const result of await Promise.allSettled([check, next])) if (result.status === 'rejected') throw result.reason;
  assert.deepEqual(await verifyModelStore([{ manifest, blobs }], modelsDirectory), [model]); report.storeVerifiedAfterStop = true;
} catch (error) { report.failure = error instanceof Error ? error.message.slice(0, 512) : 'UnknownError'; process.exitCode = 1; }
finally {
  try { await scheduler.shutdown(); } catch { report.cleanupFailure = 'RUNTIME_STOP_UNCONFIRMED'; }
  if (terminal) report.stop = { status: terminal.status, cancelled: terminal.cancelled, timedOut: terminal.timedOut };
  if (port) { try { await released(port); report.portReleased = true; } catch { report.portReleased = false; } }
  // Only remove our unique scratch after the owned process is confirmed stopped (or was never started).
  if (!report.cleanupFailure && (!port || terminal?.status === 'exited')) {
    const child = relative(root, scratch); assert(child && !child.startsWith('..') && !isAbsolute(child));
    await rm(scratch, { recursive: true, force: true }); report.temporaryStoreRemoved = true;
  }
  report.passed = !report.failure && !report.cleanupFailure && report.storeVerifiedAfterStop === true && report.followupAfterStop === true && terminal?.status === 'exited' && terminal.cancelled && report.portReleased === true && report.temporaryStoreRemoved === true;
  if (report.passed !== true) process.exitCode = 1;
  report.elapsedMs = Date.now() - started;
  await writeFile(join(root, 'model-store-verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
}
