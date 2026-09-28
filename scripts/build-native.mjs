import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';

if (process.platform !== 'win32' || process.arch !== 'x64') throw new Error('Native host build requires Windows x64');
const version = '0.15.2';
const checksum = '3a0ed1e8799a2f8ce2a6e6290a9ff22e6906f8227865911fb7ddedc3cc14cb0c';
const directory = resolve('.tooling'); await mkdir(directory, { recursive: true });
const archive = join(directory, `zig-${version}.zip`);
const executable = join(directory, `zig-x86_64-windows-${version}`, 'zig.exe');
try { await access(executable); } catch {
  let bytes;
  try { bytes = await readFile(archive); } catch {
    process.stdout.write(`Downloading pinned Zig ${version} from ziglang.org\n`);
    const response = await fetch(`https://ziglang.org/download/${version}/zig-x86_64-windows-${version}.zip`);
    if (!response.ok) throw new Error(`Compiler download failed (${response.status})`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (createHash('sha256').update(bytes).digest('hex') !== checksum) throw new Error('Compiler checksum mismatch');
    await writeFile(archive, bytes);
  }
  if (createHash('sha256').update(bytes).digest('hex') !== checksum) throw new Error('Compiler checksum mismatch');
  execFileSync(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'), ['-NoProfile', '-NonInteractive', '-Command', 'Expand-Archive -LiteralPath $env:MOONALIZA_ZIG_ARCHIVE -DestinationPath $env:MOONALIZA_TOOLCHAIN_DIR -Force'], { windowsHide: true, stdio: 'inherit', env: { ...process.env, MOONALIZA_ZIG_ARCHIVE: archive, MOONALIZA_TOOLCHAIN_DIR: directory } });
}
await mkdir('.build/native', { recursive: true });
execFileSync(executable, ['c++', 'native/host.cpp', 'native/hardware.cpp', 'native/connection.cpp', '-std=c++17', '-O2', '-target', 'x86_64-windows-gnu', '-municode', '-ladvapi32', '-liphlpapi', '-lws2_32', '-o', '.build/native/MoonAlizaHost.exe'], { windowsHide: true, stdio: 'inherit', env: { ...process.env, ZIG_GLOBAL_CACHE_DIR: join(directory, 'zig-cache') } });
process.stdout.write('Built .build/native/MoonAlizaHost.exe\n');
