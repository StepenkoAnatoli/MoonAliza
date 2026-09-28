import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, readdir, rm, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import { hashFile, missing, privateDirectory, regularFile, requireSpace, serialized } from './artifact-files';

const Identity = z.object({ sha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().positive().max(1_000_000_000_000) }).strict();
const Spec = z.object({ manifest: Identity, blobs: z.array(Identity).min(1).max(512) }).strict();
export type ModelArtifactSet = z.infer<typeof Spec>;
export interface MaterializedModel { digest: string; name: string; quantization: string; sizeBytes: number }
const Layer = z.object({ mediaType: z.string().max(256), digest: z.string().regex(/^sha256:[a-f0-9]{64}$/), size: z.number().int().positive().max(1_000_000_000_000) });
const Manifest = z.object({ schemaVersion: z.literal(2), mediaType: z.literal('application/vnd.docker.distribution.manifest.v2+json'), config: Layer, layers: z.array(Layer).min(1).max(511) });
const layerTypes = new Set(['model', 'adapter', 'projector', 'prompt', 'template', 'system', 'params', 'license', 'messages'].map(type => `application/vnd.ollama.image.${type}`));
const cancelled = (signal?: AbortSignal) => { if (signal?.aborted) throw new Error('INSTALL_CANCELLED'); };
const manifestPath = (digest: string) => `manifests/registry.ollama.ai/moonaliza/${digest}/verified`;
const blobPath = (digest: string) => `blobs/sha256-${digest}`;

async function existingDirectory(path: string) {
  const info = await lstat(path); if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('ARTIFACT_PATH');
  await privateDirectory(path);
}
async function identityBytes(path: string, expected: z.infer<typeof Identity>, signal?: AbortSignal) {
  if (expected.sizeBytes > 1024 ** 2) throw new Error('MODEL_MANIFEST');
  await regularFile(path); const chunks: Buffer[] = []; let size = 0; const hash = createHash('sha256');
  for await (const chunk of createReadStream(path, { highWaterMark: 65536, signal })) {
    size += chunk.length; if (size > expected.sizeBytes) throw new Error('ARTIFACT_CORRUPT'); chunks.push(chunk); hash.update(chunk);
  }
  if (size !== expected.sizeBytes || hash.digest('hex') !== expected.sha256) throw new Error('ARTIFACT_CORRUPT');
  const bytes = Buffer.concat(chunks);
  if (bytes.subarray(0, 3).equals(Buffer.from([239, 187, 191]))) throw new Error('MODEL_MANIFEST');
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
}
async function inventory(input: ModelArtifactSet[], directory: string, source: 'cache' | 'store', signal?: AbortSignal) {
  const specs = z.array(Spec).min(1).max(256).parse(input); const files = new Map<string, z.infer<typeof Identity>>(); const models = new Map<string, MaterializedModel>();
  const add = (path: string, identity: z.infer<typeof Identity>) => {
    const previous = files.get(path); if (previous && (previous.sha256 !== identity.sha256 || previous.sizeBytes !== identity.sizeBytes)) throw new Error('MODEL_MANIFEST');
    files.set(path, identity); if (files.size > 4352) throw new Error('MODEL_MANIFEST');
  };
  for (const spec of specs) {
    cancelled(signal);
    const from = (identity: z.infer<typeof Identity>, path: string) => join(directory, source === 'cache' ? `${identity.sha256}.blob` : path);
    const manifest = Manifest.parse(await identityBytes(from(spec.manifest, manifestPath(spec.manifest.sha256)), spec.manifest, signal));
    if (manifest.config.mediaType !== 'application/vnd.docker.container.image.v1+json' || !manifest.layers.some(layer => layer.mediaType === 'application/vnd.ollama.image.model') || manifest.layers.some(layer => !layerTypes.has(layer.mediaType))) throw new Error('MODEL_FORMAT');
    const declared = new Map(spec.blobs.map(blob => [blob.sha256, blob]));
    if (declared.size !== spec.blobs.length) throw new Error('MODEL_MANIFEST');
    const references = [manifest.config, ...manifest.layers]; const distinct = new Set(references.map(layer => layer.digest.slice(7)));
    if (distinct.size !== declared.size || references.some(layer => declared.get(layer.digest.slice(7))?.sizeBytes !== layer.size)) throw new Error('MODEL_MANIFEST');
    const configIdentity = declared.get(manifest.config.digest.slice(7))!;
    const config = z.object({ model_format: z.literal('gguf'), file_type: z.string().min(1).max(64), remote_host: z.literal('').optional(), remote_model: z.literal('').optional() }).safeParse(await identityBytes(from(configIdentity, blobPath(configIdentity.sha256)), configIdentity, signal));
    if (!config.success) throw new Error('MODEL_CONFIG');
    let sizeBytes = 0;
    for (const blob of declared.values()) { add(blobPath(blob.sha256), blob); sizeBytes += blob.sizeBytes; }
    if (!Number.isSafeInteger(sizeBytes)) throw new Error('MODEL_MANIFEST');
    add(manifestPath(spec.manifest.sha256), spec.manifest);
    models.set(spec.manifest.sha256, Object.freeze({ digest: spec.manifest.sha256, name: `moonaliza/${spec.manifest.sha256}:verified`, quantization: config.data.file_type, sizeBytes }));
  }
  return { files, models: [...models.values()] };
}

async function metadataFiles(directory: string) {
  const path = join(directory, 'metadata');
  try { await existingDirectory(path); } catch (error) { if (missing(error)) return []; throw new Error('MODEL_METADATA_PATH', { cause: error }); }
  const entries = await readdir(path); if (entries.length > 4096) throw new Error('MODEL_METADATA_PATH');
  const files: string[] = [];
  for (const name of entries) {
    if (!/^(?:sha256-[a-f0-9]{64}\.json|\.gguf-metadata-[a-zA-Z0-9-]{1,128}\.tmp)$/.test(name)) throw new Error('MODEL_METADATA_PATH');
    const file = join(path, name);
    try { if ((await regularFile(file)).size > 16 * 1024 ** 2) throw new Error('MODEL_METADATA_PATH'); }
    catch (cause) { throw new Error('MODEL_METADATA_PATH', { cause }); }
    files.push(file);
  }
  return files;
}
/** Owned runtime must be stopped. Derived metadata is never identity/qualification evidence. */
export async function clearModelMetadata(directory: string, signal?: AbortSignal): Promise<void> {
  cancelled(signal);
  await existingDirectory(directory);
  const files = await metadataFiles(directory); // Validate all paths before the first removal.
  for (const file of files) { cancelled(signal); await regularFile(file); cancelled(signal); await unlink(file); }
}

export async function verifyModelStore(specs: ModelArtifactSet[], directory: string, signal?: AbortSignal): Promise<MaterializedModel[]> {
  cancelled(signal); await existingDirectory(directory);
  const { files, models } = await inventory(specs, directory, 'store', signal);
  const expected = new Map(files); const folders = new Set<string>();
  for (const path of files.keys()) for (let i = path.indexOf('/'); i >= 0; i = path.indexOf('/', i + 1)) folders.add(path.slice(0, i));
  const pending = ['']; let count = 0;
  while (pending.length) {
    cancelled(signal); const folder = pending.pop()!; await existingDirectory(join(directory, folder));
    for (const item of await readdir(join(directory, folder), { withFileTypes: true })) {
      if (++count > files.size * 8 + 1) throw new Error('MODEL_STORE_CORRUPT');
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (path === 'metadata') { await metadataFiles(directory); continue; }
      if (item.isSymbolicLink()) throw new Error('MODEL_STORE_CORRUPT');
      if (item.isDirectory()) { if (!folders.has(path)) throw new Error('MODEL_STORE_CORRUPT'); pending.push(path); continue; }
      const identity = expected.get(path); if (!identity) throw new Error('MODEL_STORE_CORRUPT');
      const actual = await hashFile(join(directory, path), identity.sizeBytes, signal);
      if (actual.sha256 !== identity.sha256 || actual.sizeBytes !== identity.sizeBytes) throw new Error('MODEL_STORE_CORRUPT');
      expected.delete(path);
    }
  }
  if (expected.size) throw new Error('MODEL_STORE_CORRUPT'); cancelled(signal); return models;
}

/** New app-owned staging directory only. The activation pointer is the publication boundary. */
export async function materializeModels(specs: ModelArtifactSet[], destination: string, options: { cacheDirectory: string; signal?: AbortSignal }): Promise<MaterializedModel[]> {
  const target = resolve(destination); const parent = dirname(target);
  return serialized(target, async () => {
    cancelled(options.signal);
    try { await lstat(target); throw new Error('MODEL_STORE_EXISTS'); } catch (error) { if (!missing(error)) throw error; }
    await existingDirectory(options.cacheDirectory);
    const { files } = await inventory(specs, options.cacheDirectory, 'cache', options.signal);
    await privateDirectory(parent);
    await requireSpace(parent, [...files.values()].reduce((total, file) => total + file.sizeBytes, 0));
    await mkdir(target);
    try {
      for (const [path, identity] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
        cancelled(options.signal); const source = join(options.cacheDirectory, `${identity.sha256}.blob`); await regularFile(source);
        const output = join(target, path); await privateDirectory(dirname(output)); const handle = await open(output, 'wx');
        const hash = createHash('sha256'); let size = 0;
        try {
          for await (const chunk of createReadStream(source, { highWaterMark: 256 * 1024, signal: options.signal })) {
            cancelled(options.signal); size += chunk.length; if (size > identity.sizeBytes) throw new Error('ARTIFACT_CORRUPT');
            hash.update(chunk); await handle.writeFile(chunk);
          }
          if (size !== identity.sizeBytes || hash.digest('hex') !== identity.sha256) throw new Error('ARTIFACT_CORRUPT');
          await handle.sync();
        } finally { await handle.close(); }
      }
      return await verifyModelStore(specs, target, options.signal);
    } catch (error) {
      const child = relative(parent, target); if (!child || child.startsWith('..') || isAbsolute(child)) throw new Error('ARTIFACT_PATH', { cause: error });
      await rm(target, { recursive: true, force: true }); cancelled(options.signal); throw error;
    }
  });
}
