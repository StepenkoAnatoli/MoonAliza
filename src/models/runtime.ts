import { randomUUID } from 'node:crypto';
import { lstat, mkdir, readdir, rename, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import type { Fetcher } from '../main/inference';
import { LabReceiptSchema, type LabReceipt } from '../shared';
import { verifyCatalogue, type Catalogue, type CatalogueTrust } from './catalogue';
import { downloadArtifact } from './download';
import { extractRuntimeArchive } from './archive';
import { atomicJson, boundedJson, hashFile, missing, privateDirectory, safeArtifactPath, serialized } from './artifact-files';
import { materializeModels, verifyModelStore, type MaterializedModel, type ModelArtifactSet } from './model-store';
const Digest = z.string().regex(/^[a-f0-9]{64}$/);
const Pointer = z.object({ schemaVersion: z.literal(1), sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), current: Digest, previous: Digest.nullable() }).strict();
const RuntimeManifest = z.object({ schemaVersion: z.literal(1), files: z.array(z.object({ path: z.string().refine(safeArtifactPath), sha256: Digest, sizeBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) }).strict()).min(1).max(100000) }).strict();
const Layer = z.object({ mediaType: z.string().max(256), size: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), digest: z.string().regex(/^sha256:[a-f0-9]{64}$/) });
const ModelManifest = z.object({ schemaVersion: z.literal(2), mediaType: z.literal('application/vnd.docker.distribution.manifest.v2+json'), config: Layer, layers: z.array(Layer).min(1).max(512) });
type Options = { trust: Omit<CatalogueTrust, 'minimumSequence'>; fetcher: Fetcher; withRuntimeStopped: <T>(task: () => Promise<T>) => Promise<T> };
export interface ActiveSet { digest: string; sequence: number; catalogue: Catalogue; runtimeDirectories: Record<string, string>; modelsDirectory: string; models: MaterializedModel[]; labReceipts: LabReceipt[] }
const checkCancelled = (signal?: AbortSignal) => { if (signal?.aborted) throw new Error('INSTALL_CANCELLED'); };

/** Immutable verified sets with a single commit pointer; no process launch or model selection. */
export class ActivationStore {
  private readonly root: string;
  constructor(root: string, private readonly options: Options) { this.root = resolve(root); }
  private blob(digest: string) { return join(this.root, 'cache', `${digest}.blob`); }
  private modelSpecs(payload: Catalogue): ModelArtifactSet[] {
    const artifacts = new Map(payload.artifacts.map(item => [item.id, item]));
    const identity = (id: string) => { const item = artifacts.get(id)!; return { sha256: item.sha256, sizeBytes: item.sizeBytes }; };
    return payload.configurations.map(config => ({ manifest: identity(config.modelManifestId), blobs: config.modelBlobIds.map(identity) }));
  }
  private async pointer() {
    await privateDirectory(this.root);
    try { return Pointer.parse(await boundedJson(join(this.root, 'current.json'), 4096)); }
    catch (error) { if (missing(error)) return null; throw new Error('ACTIVATION_CORRUPT', { cause: error }); }
  }
  private async proofs(payload: Catalogue) {
    const artifacts = new Map(payload.artifacts.map(item => [item.id, item]));
    const receipts: LabReceipt[] = [];
    const artifact = (id: string) => { const result = artifacts.get(id); if (!result) throw new Error('ARTIFACT_MISSING'); return result; };
    for (const config of payload.configurations) {
      const runtime = payload.runtimes.find(item => item.id === config.runtimeId)!;
      const receipt = LabReceiptSchema.strict().parse(await boundedJson(this.blob(artifact(config.labReceiptId).sha256)));
      if (receipt.suiteVersion !== 'moonaliza-coding-v1' || receipt.modelDigest !== artifact(config.modelManifestId).sha256 || receipt.runtimeDigest !== artifact(runtime.artifactId).sha256 || receipt.evidenceDigest !== artifact(config.evidenceId).sha256 || !runtime.backends.includes(receipt.backend) || receipt.quality < 0.85 || !receipt.toolsPassed || receipt.unauthorizedEffects !== 0 || receipt.writesAfterCancellation !== 0) throw new Error('MODEL_QUALIFICATION');
      const manifest = ModelManifest.parse(await boundedJson(this.blob(artifact(config.modelManifestId).sha256)));
      const blobs = new Map(config.modelBlobIds.map(id => { const blob = artifact(id); return [blob.sha256, blob]; }));
      const references = [manifest.config, ...manifest.layers];
      if (new Set(references.map(ref => ref.digest.slice(7))).size !== blobs.size || references.some(ref => blobs.get(ref.digest.slice(7))?.sizeBytes !== ref.size)) throw new Error('MODEL_MANIFEST');
      receipts.push(receipt);
    }
    return receipts;
  }
  private async runtimeFiles(payload: Catalogue, directory: string, signal?: AbortSignal) {
    const directories: Record<string, string> = {};
    for (const runtime of payload.runtimes) {
      const manifestArtifact = payload.artifacts.find(item => item.id === runtime.manifestId)!;
      const manifest = RuntimeManifest.parse(await boundedJson(this.blob(manifestArtifact.sha256), 4 * 1024 ** 2));
      const expected = new Map(manifest.files.map(file => [file.path.toLowerCase(), file]));
      if (expected.size !== manifest.files.length || !manifest.files.some(file => file.path === runtime.executable) || manifest.files.length > runtime.maxEntries) throw new Error('RUNTIME_MANIFEST');
      const root = join(directory, 'runtimes', runtime.id); const stack = ['']; let visited = 0; let total = 0;
      while (stack.length) {
        checkCancelled(signal); const relative = stack.pop()!; const folder = join(root, relative); const info = await lstat(folder);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('RUNTIME_MANIFEST');
        for (const item of await readdir(folder, { withFileTypes: true })) {
          if (++visited > runtime.maxEntries * 16) throw new Error('RUNTIME_MANIFEST');
          const path = relative ? `${relative}/${item.name}` : item.name;
          if (item.isSymbolicLink() || !safeArtifactPath(path)) throw new Error('RUNTIME_MANIFEST');
          if (item.isDirectory()) { stack.push(path); continue; }
          const file = expected.get(path.toLowerCase());
          if (!file || file.path !== path) throw new Error('RUNTIME_MANIFEST');
          const found = await hashFile(join(root, path), file.sizeBytes, signal);
          if (found.sizeBytes !== file.sizeBytes || found.sha256 !== file.sha256) throw new Error('RUNTIME_MANIFEST');
          total += file.sizeBytes; if (total > runtime.maxExpandedBytes) throw new Error('RUNTIME_MANIFEST'); expected.delete(path.toLowerCase());
        }
      }
      if (expected.size) throw new Error('RUNTIME_MANIFEST'); directories[runtime.id] = root;
    }
    return directories;
  }
  private async readSet(digest: string, signal?: AbortSignal): Promise<ActiveSet> {
    const directory = join(this.root, 'sets', digest);
    const info = await lstat(directory); if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('ACTIVATION_CORRUPT');
    const verified = verifyCatalogue(await boundedJson(join(directory, 'catalogue.json'), 3 * 1024 ** 2), { ...this.options.trust, minimumSequence: 0 });
    if (verified.digest !== digest) throw new Error('ACTIVATION_CORRUPT');
    for (const item of verified.payload.artifacts) {
      checkCancelled(signal); const found = await hashFile(this.blob(item.sha256), item.sizeBytes, signal);
      if (found.sha256 !== item.sha256 || found.sizeBytes !== item.sizeBytes) throw new Error('ARTIFACT_CORRUPT');
    }
    const labReceipts = await this.proofs(verified.payload);
    const modelsDirectory = join(directory, 'models'); const models = await verifyModelStore(this.modelSpecs(verified.payload), modelsDirectory, signal);
    if (labReceipts.some(receipt => models.find(model => model.digest === receipt.modelDigest)?.quantization !== receipt.quantization)) throw new Error('MODEL_QUALIFICATION');
    return { digest, sequence: verified.payload.sequence, catalogue: verified.payload, runtimeDirectories: await this.runtimeFiles(verified.payload, directory, signal), modelsDirectory, models, labReceipts };
  }
  async readActive(): Promise<ActiveSet | null> {
    return serialized(this.root, async () => {
      const pointer = await this.pointer(); if (!pointer) return null;
      const active = await this.readSet(pointer.current); if (active.sequence !== pointer.sequence) throw new Error('ACTIVATION_CORRUPT'); return active;
    });
  }
  async activate(input: unknown, signal?: AbortSignal): Promise<ActiveSet> {
    // The owner must drain its runtime and hold admission closed for this entire lease.
    return this.options.withRuntimeStopped(() => serialized(this.root, async () => {
      checkCancelled(signal);
      const previous = await this.pointer(); const verified = verifyCatalogue(input, { ...this.options.trust, minimumSequence: previous?.sequence ?? 0 });
      if (previous?.current === verified.digest) return this.readSet(verified.digest, signal);
      if (previous && previous.sequence === verified.payload.sequence) throw new Error('CATALOGUE_ROLLBACK');
      const sets = await privateDirectory(join(this.root, 'sets')); const cache = await privateDirectory(join(this.root, 'cache'));
      const destination = join(sets, verified.digest); let candidate: string | undefined; let complete: ActiveSet;
      try {
        const exists = await lstat(destination).then(() => true).catch(error => { if (missing(error)) return false; throw error; });
        if (exists) complete = await this.readSet(verified.digest, signal);
        else {
          for (const item of verified.payload.artifacts) {
            checkCancelled(signal); const { id: _id, role: _role, ...descriptor } = item;
            await downloadArtifact(descriptor, cache, { fetcher: this.options.fetcher, signal });
          }
          checkCancelled(signal); await this.proofs(verified.payload);
          candidate = join(sets, `.staging-${randomUUID()}`); await mkdir(candidate);
          await privateDirectory(join(candidate, 'runtimes'));
          for (const runtime of verified.payload.runtimes) {
            const archive = verified.payload.artifacts.find(item => item.id === runtime.artifactId)!;
            await extractRuntimeArchive(this.blob(archive.sha256), join(candidate, 'runtimes', runtime.id), { maxExpandedBytes: runtime.maxExpandedBytes, maxEntries: runtime.maxEntries, signal });
          }
          await this.runtimeFiles(verified.payload, candidate, signal);
          await materializeModels(this.modelSpecs(verified.payload), join(candidate, 'models'), { cacheDirectory: cache, signal });
          await atomicJson(join(candidate, 'catalogue.json'), verified.envelope); checkCancelled(signal);
          await rename(candidate, destination); candidate = undefined;
          complete = await this.readSet(verified.digest, signal);
        }
        checkCancelled(signal);
        await atomicJson(join(this.root, 'current.json'), { schemaVersion: 1, sequence: verified.payload.sequence, current: verified.digest, previous: previous?.current ?? null });
        return complete;
      } catch (error) {
        if (candidate) await rm(candidate, { recursive: true, force: true });
        if (signal?.aborted) throw new Error('INSTALL_CANCELLED', { cause: error }); throw error;
      }
    }));
  }
}
