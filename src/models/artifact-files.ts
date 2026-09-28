import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, mkdir, open, rename, statfs, unlink } from 'node:fs/promises';
import { dirname, join, parse, relative, resolve, sep } from 'node:path';

export async function regularFile(path: string) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw new Error('ARTIFACT_PATH');
  return info;
}
export const missing = (error: unknown) => (error as NodeJS.ErrnoException)?.code === 'ENOENT';
export function safeArtifactPath(value: string): boolean {
  return value.length > 0 && value.length <= 1024 && value.split('/').every(part => part.length > 0 && part.length <= 255 && /^[a-zA-Z0-9_(). +@-]+$/.test(part) && !/[. ]$/.test(part) && !/^(con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9]|lpt[1-9])$/i.test(part.split('.')[0]!.trimEnd()));
}
/** App-owned paths only; not a handle-relative defense against a hostile account. */
export async function privateDirectory(path: string): Promise<string> {
  const absolute = resolve(path); let current = parse(absolute).root;
  for (const component of relative(current, absolute).split(sep).filter(Boolean)) {
    current = join(current, component);
    try { await mkdir(current); } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error; }
    const info = await lstat(current);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('ARTIFACT_PATH');
  }
  return absolute;
}
export async function requireSpace(directory: string, bytes: number, reserveBytes = 256 * 1024 ** 2) {
  if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error('ARTIFACT_SIZE');
  const volume = await statfs(directory, { bigint: true });
  if (volume.bavail * volume.bsize < BigInt(bytes) + BigInt(reserveBytes)) throw new Error('STORAGE_FULL');
}
export async function hashFile(path: string, maxBytes: number, signal?: AbortSignal): Promise<{ sha256: string; sizeBytes: number }> {
  const info = await regularFile(path);
  if (info.size > maxBytes) throw new Error('ARTIFACT_SIZE');
  const hash = createHash('sha256'); let sizeBytes = 0;
  for await (const chunk of createReadStream(path, { highWaterMark: 256 * 1024, signal })) {
    sizeBytes += chunk.length; if (sizeBytes > maxBytes) throw new Error('ARTIFACT_SIZE'); hash.update(chunk);
  }
  return { sha256: hash.digest('hex'), sizeBytes };
}
export async function boundedJson(path: string, maxBytes = 1024 * 1024): Promise<unknown> {
  const info = await regularFile(path); if (info.size > maxBytes) throw new Error('ARTIFACT_SIZE');
  const handle = await open(path, 'r');
  try {
    const bytes = Buffer.alloc(maxBytes + 1); const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    if (bytesRead > maxBytes) throw new Error('ARTIFACT_SIZE');
    return JSON.parse(bytes.subarray(0, bytesRead).toString('utf8'));
  } finally { await handle.close(); }
}
export async function atomicJson(path: string, value: unknown) {
  await privateDirectory(dirname(path));
  const temporary = `${path}.${randomUUID()}.tmp`; const handle = await open(temporary, 'wx');
  try { await handle.writeFile(JSON.stringify(value)); await handle.sync(); }
  catch (error) { await handle.close(); await unlink(temporary).catch(() => {}); throw error; }
  await handle.close();
  try { await rename(temporary, path); } catch (error) { await unlink(temporary).catch(() => {}); throw error; }
}
export async function removeFile(path: string) { try { await regularFile(path); await unlink(path); } catch (error) { if (!missing(error)) throw error; } }
const locks = new Map<string, Promise<unknown>>();
export async function serialized<T>(key: string, task: () => Promise<T>): Promise<T> {
  const absolute = resolve(key).toLowerCase(); const previous = locks.get(absolute);
  const current = (previous ?? Promise.resolve()).catch(() => {}).then(task); locks.set(absolute, current);
  try { return await current; } finally { if (locks.get(absolute) === current) locks.delete(absolute); }
}
