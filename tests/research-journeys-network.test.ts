import { afterEach, expect, test } from 'vitest';
import { EventEmitter } from 'node:events';
import { createRequire, syncBuiltinESMExports } from 'node:module';
import { PassThrough } from 'node:stream';
import { spawnOwned } from '../src/tools/commands';

// The e2e harness (e2e/fixtures/collector-network.cjs) rewrites the native helper's input. These run it against the
// real spawnOwned encoder, with the helper replaced by a recording child, so a change to the protocol turns this red
// on any OS instead of only in a Windows desktop run.
const require = createRequire(import.meta.url);
const childProcess = require('node:child_process') as { spawn: (...args: unknown[]) => unknown };
const { install } = require('../e2e/fixtures/collector-network.cjs') as { install(module: unknown, network: unknown): { collectors: number; rewritten: number } };
const original = childProcess.spawn; const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const network = { HTTPS_PROXY: 'http://127.0.0.1:43123', NODE_EXTRA_CA_CERTS: '/fixtures/ca.pem' };
const helperPath = '/helper/MoonAlizaHost.exe';
afterEach(() => { childProcess.spawn = original; syncBuiltinESMExports(); Object.defineProperty(process, 'platform', platform); });

function recordingHelper(writes: Buffer[]) {
  return (_command: unknown, _args: unknown) => {
    const child = Object.assign(new EventEmitter(), { stdin: new PassThrough(), stdout: new PassThrough(), stderr: new PassThrough() });
    child.stdin.on('data', (chunk: Buffer) => {
      writes.push(chunk);
      setImmediate(() => { child.stderr.write('{"status":"exited","code":0,"cancelled":false,"timedOut":false}\n'); child.emit('close'); });
    });
    return child;
  };
}
function decode(protocol: Buffer) {
  const fields: string[] = []; let offset = 4;
  for (let index = 0; index < 4; index++) { const end = offset + 4 + protocol.readUInt32LE(offset); fields.push(protocol.subarray(offset + 4, end).toString('utf16le')); offset = end; }
  return { fields, environment: fields[3]!.split('\0').filter(Boolean), tail: protocol.subarray(offset) };
}
async function run(script: string, writes: Buffer[]) {
  childProcess.spawn = recordingHelper(writes);
  const state = install(childProcess, network); syncBuiltinESMExports();
  Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
  const result = await spawnOwned({ executable: '/kit/node.exe', args: ['--max-old-space-size=256', script, '--json'], cwd: '/work', env: { TEMP: '/t', RESEARCH_KIT_GITHUB_TOKEN: 'test-token', HOME: '/t', TMP: '/t' }, timeoutMs: 1000, maxOutputBytes: 64 }, undefined, { helperPath });
  expect(result.status).toBe('exited');
  return state;
}

test('a collect-remote.mjs launch gains exactly the loopback proxy and the test CA, in spawnOwned order', async () => {
  const writes: Buffer[] = []; const state = await run('/kit/bin/collect-remote.mjs', writes);
  expect(state).toEqual({ collectors: 1, rewritten: 1 });
  const { fields, environment, tail } = decode(writes[0]!);
  expect(fields.slice(0, 3)).toEqual(['/kit/node.exe', '/kit/node.exe --max-old-space-size=256 /kit/bin/collect-remote.mjs --json', '/work']);
  expect(environment).toEqual(['HOME=/t', `HTTPS_PROXY=${network.HTTPS_PROXY}`, `NODE_EXTRA_CA_CERTS=${network.NODE_EXTRA_CA_CERTS}`, 'RESEARCH_KIT_GITHUB_TOKEN=test-token', 'TEMP=/t', 'TMP=/t']);
  expect(tail.length).toBe(0);
});

test('every other helper launch and the guard list pass byte for byte', async () => {
  const writes: Buffer[] = []; const state = await run('/kit/bin/artifact.mjs', writes);
  expect(state).toEqual({ collectors: 0, rewritten: 0 });
  expect(decode(writes[0]!).environment).toEqual(['HOME=/t', 'RESEARCH_KIT_GITHUB_TOKEN=test-token', 'TEMP=/t', 'TMP=/t']);
  // spawnOwned cannot encode a guard list off Windows (drive-letter paths), so the guarded form is the encoded
  // collector protocol plus a guard list, written to the wrapped helper directly.
  const plain: Buffer[] = []; childProcess.spawn = recordingHelper(plain); syncBuiltinESMExports();
  await spawnOwned({ executable: '/kit/node.exe', args: ['/kit/bin/collect-remote.mjs'], cwd: '/work', env: { TEMP: '/t' }, timeoutMs: 1000, maxOutputBytes: 64 }, undefined, { helperPath });
  const guards = Buffer.concat([Buffer.from([1, 0, 0, 0, 6, 0, 0, 0]), Buffer.from('C:\\', 'utf16le')]);
  const seen: Buffer[] = []; childProcess.spawn = recordingHelper(seen); install(childProcess, network);
  const child = childProcess.spawn(helperPath, ['--guarded']) as { stdin: PassThrough };
  child.stdin.write(Buffer.concat([plain[0]!, guards]));
  await new Promise(resolve => setImmediate(resolve));
  const { environment, tail } = decode(seen[0]!);
  expect(tail).toEqual(guards);
  expect(environment).toEqual(['HTTPS_PROXY=http://127.0.0.1:43123', 'NODE_EXTRA_CA_CERTS=/fixtures/ca.pem', 'TEMP=/t']);
});

test('the harness refuses a non-loopback proxy, extra keys, and an environment that already routes the collector', async () => {
  expect(() => install({ spawn: original }, { ...network, HTTPS_PROXY: 'http://10.0.0.1:8080' })).toThrow('E2E_NETWORK_INVALID');
  expect(() => install({ spawn: original }, { ...network, NODE_OPTIONS: '--inspect' })).toThrow('E2E_NETWORK_INVALID');
  expect(() => install({ spawn: original }, { ...network, NODE_EXTRA_CA_CERTS: 'ca.pem' })).toThrow('E2E_NETWORK_INVALID');
  const writes: Buffer[] = []; childProcess.spawn = recordingHelper(writes); install(childProcess, network); syncBuiltinESMExports();
  Object.defineProperty(process, 'platform', { ...platform, value: 'win32' });
  await expect(spawnOwned({ executable: '/kit/node.exe', args: ['/kit/bin/collect-remote.mjs'], cwd: '/work', env: { HTTPS_PROXY: 'http://127.0.0.1:1' }, timeoutMs: 1000, maxOutputBytes: 64 }, undefined, { helperPath })).rejects.toThrow('E2E_NETWORK_ALREADY_SET');
  expect(writes).toEqual([]);
});
