import { crc32, deflateRawSync } from 'node:zlib';
export function zipFixture(entries: Array<{ name: string; content?: string; mode?: number; flags?: number; declaredSize?: number; badCrc?: boolean }>): Buffer {
  const local: Buffer[] = []; const central: Buffer[] = []; let offset = 0;
  for (const item of entries) {
    const name = Buffer.from(item.name); const content = Buffer.from(item.content ?? ''); const data = deflateRawSync(content); const crc = item.badCrc ? 0 : crc32(content);
    const header = Buffer.alloc(30); header.writeUInt32LE(0x04034b50); header.writeUInt16LE(20, 4); header.writeUInt16LE(item.flags ?? 0, 6); header.writeUInt16LE(8, 8); header.writeUInt32LE(crc, 14); header.writeUInt32LE(data.length, 18); header.writeUInt32LE(item.declaredSize ?? content.length, 22); header.writeUInt16LE(name.length, 26);
    const directory = Buffer.alloc(46); directory.writeUInt32LE(0x02014b50); directory.writeUInt16LE(0x0314, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(item.flags ?? 0, 8); directory.writeUInt16LE(8, 10); directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(data.length, 20); directory.writeUInt32LE(item.declaredSize ?? content.length, 24); directory.writeUInt16LE(name.length, 28); directory.writeUInt32LE((((item.mode ?? (item.name.endsWith('/') ? 0o40755 : 0o100644)) << 16) >>> 0), 38); directory.writeUInt32LE(offset, 42);
    local.push(header, name, data); central.push(directory, name); offset += header.length + name.length + data.length;
  }
  const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(Buffer.concat(central).length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
}
