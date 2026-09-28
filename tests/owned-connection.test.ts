import { expect, test } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { createConnection, type Socket } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { spawnOwned, safeCommandEnvironment, inspectOwnedConnection, type OwnedIdentity } from '../src/tools/commands';

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'moonaliza-owned-http-')); const file = join(directory, 'ready.json'); const body = join(directory, 'body');
  const stop = new AbortController(); let identity: OwnedIdentity | undefined;
  const result = spawnOwned({ executable: process.execPath, args: [resolve('tests/fixtures/processes/http-owner.mjs'), file, body], cwd: directory, env: safeCommandEnvironment(), timeoutMs: 10000, maxOutputBytes: 4096 }, stop.signal, { onStarted: value => { identity = value; } });
  const close = async () => {
    stop.abort(); await result;
    const child = relative(resolve(tmpdir()), directory); expect(child && !child.startsWith('..') && !isAbsolute(child)).toBeTruthy();
    await rm(directory, { recursive: true, force: true });
  };
  try {
    for (let n = 0; n < 100; n++) {
      try { const info = JSON.parse(await readFile(file, 'utf8')) as { pid: number; port: number }; return { info, identity: () => identity, result, stop, body, close }; } catch { await delay(25); }
    }
    throw new Error('OWNER_FIXTURE_STARTUP');
  } catch (error) { await close(); throw error; }
}
async function connect(port: number): Promise<Socket> {
  const socket = createConnection({ host: '127.0.0.1', port });
  return new Promise((done, reject) => { socket.once('connect', () => done(socket)); socket.once('error', reject); });
}

test('native startup identity names the actual job-owned process instance', async () => {
  const f = await fixture();
  try { expect(f.identity()?.pid).toBe(f.info.pid); expect(f.identity()?.createdAt).toMatch(/^[1-9][0-9]{15,19}$/); }
  finally { await f.close(); }
});

test('native socket ownership binds both the established tuple and process creation time', async () => {
  const f = await fixture(); const socket = await connect(f.info.port);
  try {
    expect(f.identity()).toBeDefined(); const owner = f.identity()!;
    expect(await inspectOwnedConnection(owner, f.info.port, socket.localPort!)).toBe(true);
    expect(await inspectOwnedConnection({ ...owner, createdAt: '1' }, f.info.port, socket.localPort!)).toBe(false);
    expect(await inspectOwnedConnection({ ...owner, pid: process.pid }, f.info.port, socket.localPort!)).toBe(false);
    expect(await inspectOwnedConnection(owner, f.info.port, f.info.port)).toBe(false);
  } finally { socket.destroy(); await f.close(); }
});

test('a stopped owner can never authenticate a later connection', async () => {
  const f = await fixture(); const socket = await connect(f.info.port);
  try {
    expect(f.identity()).toBeDefined(); f.stop.abort(); await f.result;
    expect(await inspectOwnedConnection(f.identity()!, f.info.port, socket.localPort ?? 1)).toBe(false);
  } finally { socket.destroy(); await f.close(); }
});
