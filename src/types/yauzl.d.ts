declare module 'yauzl' {
  import type { Readable } from 'node:stream';
  export interface Entry { fileName: string; uncompressedSize: number; compressedSize: number; externalFileAttributes: number; generalPurposeBitFlag: number; crc32: number; isEncrypted(): boolean }
  export interface ZipFile { entryCount: number; eachEntry(): AsyncIterable<Entry>; openReadStreamPromise(entry: Entry): Promise<Readable>; close(): void }
  export function openPromise(path: string, options?: { lazyEntries?: boolean; autoClose?: boolean; decodeStrings?: boolean; validateEntrySizes?: boolean; strictFileNames?: boolean }): Promise<ZipFile>;
}
