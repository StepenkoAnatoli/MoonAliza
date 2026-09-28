import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { spawnOwned, safeCommandEnvironment, type OwnedIdentity } from '../../src/tools/commands';

export async function ownedHttpFixture() {
  const directory = await mkdtemp(join(tmpdir(), 'moonaliza-owned-http-')); const file = join(directory, 'ready.json'); const body = join(directory, 'body');
  const stop = new AbortController(); let identity: OwnedIdentity | undefined;
  const result = spawnOwned({ executable: process.execPath, args: [resolve('tests/fixtures/processes/http-owner.mjs'), file, body], cwd: directory, env: safeCommandEnvironment(), timeoutMs: 15000, maxOutputBytes: 4096 }, stop.signal, { onStarted: value => { identity = value; } });
  void result.catch(() => {});
  const close = async () => {
    stop.abort(); await result;
    const child = relative(resolve(tmpdir()), directory); if (!child || child.startsWith('..') || isAbsolute(child)) throw new Error('FIXTURE_PATH');
    await rm(directory, { recursive: true, force: true });
  };
  try {
    for (let n = 0; n < 100; n++) {
      try { const info = JSON.parse(await readFile(file, 'utf8')) as { pid: number; port: number }; if (identity) return { info, identity, result, stop, body, wire: `${body}.wire`, close }; } catch { /* Wait for the owned fixture. */ }
      await delay(25);
    }
    throw new Error('OWNER_FIXTURE_STARTUP');
  } catch (error) { await close(); throw error; }
}
