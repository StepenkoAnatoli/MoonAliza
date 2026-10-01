import { fromBufferPromise } from 'yauzl';
import { safeArtifactPath } from '../../models/artifact-files';

export const MAX_ARCHIVE = 32 * 1024 ** 2;
// Inspect from the same captured buffer passed to the external validator; never extract.
export async function inspectArchive(bytes: Buffer): Promise<unknown> {
  if (bytes.length > MAX_ARCHIVE) throw new Error('INPUT_LIMIT');
  const zip = await fromBufferPromise(bytes, { lazyEntries: true, autoClose: false, validateEntrySizes: true, strictFileNames: true });
  try {
    if (zip.entryCount > 5000) throw new Error('INPUT_LIMIT');
    const names = new Set<string>(); let total = 0; let manifest: Buffer | undefined;
    for await (const entry of zip.eachEntry()) {
      const name = entry.fileName; const mode = (entry.externalFileAttributes >>> 16) & 0xf000;
      if (!safeArtifactPath(name) || entry.isEncrypted() || (mode !== 0 && mode !== 0x8000) || names.has(name.toLowerCase())) throw new Error('ARTIFACT_INVALID');
      names.add(name.toLowerCase()); total += entry.uncompressedSize;
      if (entry.uncompressedSize > 16 * 1024 ** 2 || total > 64 * 1024 ** 2 || (entry.uncompressedSize > 1024 ** 2 && entry.uncompressedSize > 200 * entry.compressedSize)) throw new Error('INPUT_LIMIT');
      if (name === 'manifest.json') {
        if (entry.uncompressedSize > 256 * 1024) throw new Error('INPUT_LIMIT');
        const stream = await zip.openReadStreamPromise(entry); const chunks: Buffer[] = []; let size = 0;
        try { for await (const chunk of stream) { size += chunk.length; if (size > 256 * 1024) throw new Error('INPUT_LIMIT'); chunks.push(chunk); } }
        finally { stream.destroy(); }
        manifest = Buffer.concat(chunks);
      }
    }
    if (!manifest) throw new Error('ARTIFACT_INVALID');
    return JSON.parse(manifest.toString('utf8'));
  } finally { zip.close(); }
}
