import { createHash, randomUUID } from 'node:crypto';
import { lstat, mkdir, open, readdir, rename, unlink } from 'node:fs/promises';
import { join } from 'node:path';

export const SNAPSHOT_LIMIT_BYTES = 256 * 1024 * 1024;
const MAX_FILE = 1_048_576;
const validHash = (value: string) => /^[a-f0-9]{64}$/.test(value);
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
type Entry = { hash: string; size: number; age: number };

/** One serialized owner reserves complete proposals before recording their journal references. */
export class SnapshotStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly directory: string, private readonly protectedHashes: () => Set<string>, readonly limitBytes = SNAPSHOT_LIMIT_BYTES) {
    if (!Number.isSafeInteger(limitBytes) || limitBytes < 1) throw new Error('INVALID_SNAPSHOT_QUOTA');
  }
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const task = this.queue.then(work); this.queue = task.catch(() => {}); return task;
  }
  private async root() {
    await mkdir(this.directory, { recursive: true });
    const info = await lstat(this.directory); if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('SNAPSHOT_CORRUPT');
  }
  private async scan(): Promise<Entry[]> {
    await this.root(); const entries: Entry[] = [];
    for (const name of await readdir(this.directory)) {
      const path = join(this.directory, name); const info = await lstat(path);
      if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1) throw new Error('SNAPSHOT_CORRUPT');
      // A prior owner died before publishing this snapshot. No live writer can
      // own a temporary file while the serialized scan is running.
      if (/^\.pending-[a-f0-9-]{36}$/.test(name)) { await unlink(path); continue; }
      if (!validHash(name) || info.size > MAX_FILE) throw new Error('SNAPSHOT_CORRUPT');
      entries.push({ hash: name, size: info.size, age: info.mtimeMs });
    }
    return entries;
  }
  async read(hash: string): Promise<string> {
    if (!validHash(hash)) throw new Error('INVALID_SNAPSHOT'); await this.root();
    const path = join(this.directory, hash); const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || info.size > MAX_FILE) throw new Error('SNAPSHOT_CORRUPT');
    const file = await open(path, 'r');
    try {
      const opened = await file.stat(); if (opened.ino !== info.ino || opened.dev !== info.dev || opened.nlink !== 1 || opened.size > MAX_FILE) throw new Error('SNAPSHOT_CORRUPT');
      const bytes = Buffer.alloc(MAX_FILE + 1); let length = 0;
      while (length < bytes.length) { const part = await file.read(bytes, length, bytes.length - length, length); if (!part.bytesRead) break; length += part.bytesRead; }
      const value = bytes.subarray(0, length);
      if (length > MAX_FILE || digest(value) !== hash) throw new Error('SNAPSHOT_CORRUPT');
      return value.toString('utf8');
    } finally { await file.close(); }
  }
  async available(hash: string | null): Promise<boolean> { if (hash === null) return true; try { await this.read(hash); return true; } catch { return false; } }
  stats() {
    return this.serial(async () => { const entries = await this.scan(); const pinned = this.protectedHashes(); return { usedBytes: entries.reduce((n, e) => n + e.size, 0), limitBytes: this.limitBytes, snapshotCount: entries.length, protectedBytes: entries.filter(e => pinned.has(e.hash)).reduce((n, e) => n + e.size, 0) }; });
  }
  retainExisting<T>(hashes: string[], work: () => Promise<T> | T): Promise<T> {
    return this.serial(async () => { for (const hash of new Set(hashes)) await this.read(hash); return work(); });
  }
  retain<T>(buffers: Buffer[], record: (hashes: string[]) => Promise<T> | T): Promise<T> {
    return this.serial(async () => {
      if (buffers.some(bytes => bytes.length > MAX_FILE)) throw new Error('FILE_TOO_LARGE');
      const values = new Map(buffers.map(bytes => [digest(bytes), bytes]));
      const entries = await this.scan(); const existing = new Set(entries.map(entry => entry.hash));
      for (const hash of values.keys()) if (existing.has(hash)) await this.read(hash);
      const required = [...values].filter(([hash]) => !existing.has(hash)).reduce((n, [, bytes]) => n + bytes.length, 0);
      const pinned = new Set([...this.protectedHashes(), ...values.keys()]);
      let used = entries.reduce((n, entry) => n + entry.size, 0);
      const candidates = entries.filter(entry => !pinned.has(entry.hash)).sort((a, b) => a.age - b.age || a.hash.localeCompare(b.hash));
      if (used + required - candidates.reduce((n, entry) => n + entry.size, 0) > this.limitBytes) throw new Error('SNAPSHOT_QUOTA');
      for (const entry of candidates) {
        if (used + required <= this.limitBytes) break;
        await unlink(join(this.directory, entry.hash)); used -= entry.size;
      }
      for (const [hash, bytes] of values) {
        if (existing.has(hash)) continue;
        const temporary = join(this.directory, `.pending-${randomUUID()}`); const file = await open(temporary, 'wx', 0o600);
        try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
        await rename(temporary, join(this.directory, hash));
      }
      return record(buffers.map(digest));
    });
  }
}
