import { createHash } from 'node:crypto';
import { lstat, mkdir, open, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve, isAbsolute } from 'node:path';
import { crc32 } from 'node:zlib';
import type { Readable } from 'node:stream';
import { openPromise, type ZipFile } from 'yauzl';
import { missing, privateDirectory, regularFile, requireSpace, safeArtifactPath } from './artifact-files';
export interface ExtractedArchive { files: Array<{ path: string; sizeBytes: number; sha256: string }>; expandedBytes: number }
/** A private candidate extraction, never an activation or executable launch. */
export async function extractRuntimeArchive(archivePath: string, destination: string, options: { maxExpandedBytes: number; maxEntries: number; signal?: AbortSignal }): Promise<ExtractedArchive> {
  const abort = () => { if (options.signal?.aborted) throw new Error('ARCHIVE_CANCELLED'); }; abort();
  if (!Number.isSafeInteger(options.maxExpandedBytes) || options.maxExpandedBytes < 1 || options.maxExpandedBytes > 100 * 1024 ** 3 || !Number.isInteger(options.maxEntries) || options.maxEntries < 1 || options.maxEntries > 100000) throw new Error('ARCHIVE_LIMIT');
  const target = resolve(destination); const parent = await privateDirectory(dirname(target));
  const inside = relative(parent, target); if (!inside || inside.startsWith('..') || isAbsolute(inside)) throw new Error('ARCHIVE_PATH');
  try { await lstat(target); throw new Error('ARCHIVE_DESTINATION_EXISTS'); } catch (error) { if (!missing(error)) throw error; }
  await regularFile(archivePath); await requireSpace(parent, options.maxExpandedBytes); abort();
  await mkdir(target); let archive: ZipFile | undefined;
  const files: ExtractedArchive['files'] = []; let expandedBytes = 0; let declaredBytes = 0; let entries = 0; let nameBytes = 0;
  const identities = new Map<string, { spelling: string; kind: 'file' | 'directory'; explicit: boolean }>();
  function register(path: string, kind: 'file' | 'directory', explicit: boolean) {
    const key = path.toLowerCase(); const previous = identities.get(key);
    if (previous && (previous.spelling !== path || previous.kind !== kind || previous.explicit && explicit)) throw new Error('ARCHIVE_DUPLICATE');
    identities.set(key, { spelling: path, kind, explicit: explicit || previous?.explicit || false });
  }
  try {
    archive = await openPromise(archivePath, { lazyEntries: true, autoClose: false, decodeStrings: true, validateEntrySizes: true, strictFileNames: true });
    if (archive.entryCount > options.maxEntries) throw new Error('ARCHIVE_LIMIT');
    for await (const entry of archive.eachEntry()) {
      abort(); entries++; nameBytes += entry.fileName.length;
      if (entries > options.maxEntries || nameBytes > 8 * 1024 ** 2) throw new Error('ARCHIVE_LIMIT');
      const directory = entry.fileName.endsWith('/'); const path = directory ? entry.fileName.slice(0, -1) : entry.fileName;
      if (!safeArtifactPath(path)) throw new Error('ARCHIVE_PATH');
      const kind = (entry.externalFileAttributes >>> 16) & 0xf000;
      if (entry.isEncrypted() || entry.externalFileAttributes & 0x400 || ![0, 0x8000, 0x4000].includes(kind) || kind === 0x4000 && !directory || kind === 0x8000 && directory || !directory && entry.externalFileAttributes & 0x10) throw new Error('ARCHIVE_ENTRY');
      if (!Number.isSafeInteger(entry.uncompressedSize) || entry.uncompressedSize < 0 || directory && entry.uncompressedSize !== 0) throw new Error('ARCHIVE_LIMIT');
      declaredBytes += entry.uncompressedSize; if (declaredBytes > options.maxExpandedBytes) throw new Error('ARCHIVE_LIMIT');
      const parts = path.split('/'); for (let i = 1; i < parts.length; i++) register(parts.slice(0, i).join('/'), 'directory', false);
      register(path, directory ? 'directory' : 'file', true);
      const output = join(target, ...parts);
      await privateDirectory(directory ? output : dirname(output));
      if (directory) continue;
      await requireSpace(target, entry.uncompressedSize); abort();
      const handle = await open(output, 'wx'); let stream: Readable | undefined;
      const hash = createHash('sha256'); let sizeBytes = 0; let crc = 0;
      const cancelStream = () => stream?.destroy(new Error('ARCHIVE_CANCELLED'));
      try {
        stream = await archive.openReadStreamPromise(entry);
        // Register the consumer before any filesystem await can let inflation fail.
        options.signal?.addEventListener('abort', cancelStream, { once: true });
        for await (const value of stream) {
          abort(); const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
          sizeBytes += chunk.length; expandedBytes += chunk.length;
          if (sizeBytes > entry.uncompressedSize || expandedBytes > options.maxExpandedBytes) throw new Error('ARCHIVE_LIMIT');
          hash.update(chunk); crc = crc32(chunk, crc); await handle.writeFile(chunk);
        }
        abort(); if (sizeBytes !== entry.uncompressedSize || crc !== entry.crc32) throw new Error('ARCHIVE_INTEGRITY');
        await handle.sync(); files.push({ path, sizeBytes, sha256: hash.digest('hex') });
      } finally { options.signal?.removeEventListener('abort', cancelStream); stream?.destroy(); await handle.close(); }
    }
    abort(); if (entries !== archive.entryCount || expandedBytes !== declaredBytes) throw new Error('ARCHIVE_INTEGRITY');
    return { files, expandedBytes };
  } catch (error) {
    archive?.close(); archive = undefined;
    // target is the verified absolute, absent-before-call directory created above.
    await rm(target, { recursive: true, force: true });
    if (options.signal?.aborted) throw new Error('ARCHIVE_CANCELLED', { cause: error });
    if ((error as NodeJS.ErrnoException).code === 'ENOSPC') throw new Error('STORAGE_FULL', { cause: error });
    if (error instanceof Error && /^(ARCHIVE_|STORAGE_FULL)/.test(error.message)) throw error;
    throw new Error('ARCHIVE_INVALID', { cause: error });
  } finally { archive?.close(); }
}
