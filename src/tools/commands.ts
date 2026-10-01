import { spawn, execFile } from 'node:child_process';
import { resolve, isAbsolute } from 'node:path';
import { promisify } from 'node:util';
import { z } from 'zod';

export interface OwnedCommand { executable: string; args: string[]; cwd: string; env: Record<string, string>; timeoutMs: number; maxOutputBytes: number }
export interface OwnedResult { status: 'exited' | 'unknown' | 'failed'; code: number | null; output: string; truncated: boolean; cancelled: boolean; timedOut: boolean }
export interface OwnedIdentity { pid: number; createdAt: string }
export const OwnedIdentitySchema = z.object({ pid: z.number().int().min(1).max(0xffffffff), createdAt: z.string().regex(/^[1-9][0-9]{0,19}$/).refine(value => BigInt(value) <= 0xffffffffffffffffn) }).strict();
export async function inspectOwnedConnection(identity: OwnedIdentity, serverPort: number, clientPort: number, options: { helperPath?: string; signal?: AbortSignal } = {}): Promise<boolean> {
  const owner = OwnedIdentitySchema.parse(identity);
  if (![serverPort, clientPort].every(port => Number.isInteger(port) && port >= 1 && port <= 65535)) throw new Error('INVALID_CONNECTION');
  const { stdout } = await promisify(execFile)(helper(options.helperPath), ['--inspect-connection', String(owner.pid), owner.createdAt, String(serverPort), String(clientPort)], { windowsHide: true, timeout: 5000, maxBuffer: 4096, env: safeCommandEnvironment(), signal: options.signal });
  return z.object({ owned: z.boolean() }).strict().parse(JSON.parse(stdout)).owned;
}
const allowedEnvironment = new Set(['systemroot', 'windir', 'path', 'pathext', 'temp', 'tmp', 'userprofile', 'localappdata', 'appdata', 'comspec', 'programfiles', 'programfiles(x86)', 'programdata', 'homedrive', 'homepath', 'systemdrive']);
export function safeCommandEnvironment(source: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return Object.fromEntries(Object.entries(source).filter((entry): entry is [string, string] => allowedEnvironment.has(entry[0].toLowerCase()) && typeof entry[1] === 'string'));
}
export function quoteWindowsArg(value: string): string {
  if (!value) return '""';
  if (!/[\s"]/.test(value)) return value;
  return `"${value.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, '$1$1')}"`;
}
function field(value: string): Buffer {
  const bytes = Buffer.from(value, 'utf16le'); if (bytes.length > 262144) throw new Error('COMMAND_TOO_LARGE');
  const length = Buffer.alloc(4); length.writeUInt32LE(bytes.length); return Buffer.concat([length, bytes]);
}
const helper = (override?: string) => override ?? resolve('.build/native/MoonAlizaHost.exe');

export async function inspectProjectPath(path: string, options: { helperPath?: string } = {}): Promise<{ rootPath: string; localFixed: boolean }> {
  const { stdout } = await promisify(execFile)(helper(options.helperPath), ['--inspect-path', path], { windowsHide: true, timeout: 10_000, maxBuffer: 262144, env: safeCommandEnvironment() });
  const result: unknown = JSON.parse(stdout);
  if (!result || typeof result !== 'object' || !('rootPath' in result) || typeof result.rootPath !== 'string' || !('localFixed' in result) || typeof result.localFixed !== 'boolean') throw new Error('INVALID_NATIVE_RESPONSE');
  return { rootPath: result.rootPath, localFixed: result.localFixed };
}

export interface OwnedOptions {
  helperPath?: string;
  onStarted?: (identity: OwnedIdentity) => void;
  readLocks?: string[];
  beforeStart?: () => Promise<void>;
  stopOnOutputLimit?: boolean;
}
export async function spawnOwned(request: OwnedCommand, signal?: AbortSignal, options: OwnedOptions = {}): Promise<OwnedResult> {
  if (process.platform !== 'win32') throw new Error('WINDOWS_REQUIRED');
  if (signal?.aborted) throw new Error('RUN_CANCELLED');
  if (/\.(cmd|bat)$/i.test(request.executable)) throw new Error('BATCH_REQUIRES_EXPLICIT_SHELL');
  if (!isAbsolute(request.executable) || !isAbsolute(request.cwd) || request.executable.includes('\0') || request.cwd.includes('\0') || request.args.some(arg => arg.includes('\0')) || request.args.length > 1000) throw new Error('INVALID_COMMAND');
  if (!Number.isSafeInteger(request.timeoutMs) || request.timeoutMs < 1 || request.timeoutMs > 3_600_000 || !Number.isSafeInteger(request.maxOutputBytes) || request.maxOutputBytes < 0 || request.maxOutputBytes > 16_777_216) throw new Error('INVALID_COMMAND_LIMIT');
  for (const [key, value] of Object.entries(request.env)) {
    if (/^(NODE_OPTIONS|NODE_PATH|ELECTRON_RUN_AS_NODE|ELECTRON_EXTRA_LAUNCH_ARGS)$/i.test(key)) throw new Error('FORBIDDEN_COMMAND_ENV');
    if (!key || /[=\0]/.test(key) || value.includes('\0')) throw new Error('INVALID_COMMAND_ENV');
  }
  const timeout = Buffer.alloc(4); timeout.writeUInt32LE(request.timeoutMs);
  const environment = Object.entries(request.env).sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase())).map(([key, value]) => `${key}=${value}`).join('\0') + '\0';
  const guarded = options.readLocks !== undefined;
  if (guarded !== (options.beforeStart !== undefined)) throw new Error('INVALID_GUARDS');
  const guards: Buffer[] = [];
  if (options.readLocks) {
    if (!options.readLocks.length || options.readLocks.length > 2048) throw new Error('INVALID_GUARDS');
    const count = Buffer.alloc(4); count.writeUInt32LE(options.readLocks.length); guards.push(count);
    for (const path of options.readLocks) {
      if (!/^[a-z]:\\/i.test(path) || path.includes('\0') || path.includes('/') || path.length > 32760 || path !== resolve(path)) throw new Error('INVALID_GUARDS');
      guards.push(field(path));
    }
  }
  const protocol = Buffer.concat([timeout, field(request.executable), field([request.executable, ...request.args].map(quoteWindowsArg).join(' ')), field(request.cwd), field(environment), ...guards]);
  if (protocol.length > 2_097_152) throw new Error('COMMAND_TOO_LARGE');
  return new Promise((resolveResult, reject) => {
    const child = spawn(helper(options.helperPath), [...(guarded ? ['--guarded'] : []), ...(options.onStarted ? ['--report-start'] : [])], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: safeCommandEnvironment() });
    const chunks: Buffer[] = []; let size = 0; let truncated = false; let metadata = ''; let metadataBytes = 0; let reportedStart = false; let reportedLocks = false; let invalidMetadata = false; let closed = false; let admissionError: unknown; let admissionTimedOut = false;
    const cancel = () => { child.stdin.end(); };
    // A stalled verifier must not hold file locks indefinitely, even before launch.
    const admissionTimer = guarded ? setTimeout(() => { admissionTimedOut = true; cancel(); }, request.timeoutMs) : undefined;
    signal?.addEventListener('abort', cancel, { once: true });
    child.stdin.on('error', () => {});
    child.stdout.on('data', (chunk: Buffer) => {
      const keep = Math.min(chunk.length, request.maxOutputBytes - size);
      if (keep > 0) { chunks.push(chunk.subarray(0, keep)); size += keep; }
      if (keep < chunk.length) { truncated = true; if (options.stopOnOutputLimit) cancel(); }
    });
    child.stderr.on('data', (bytes: Buffer) => {
      metadataBytes += bytes.length;
      if (metadataBytes > 8192) { invalidMetadata = true; cancel(); return; }
      metadata += bytes.toString('utf8');
      while (metadata.includes('\n')) {
        const newline = metadata.indexOf('\n');
        try {
          const first = JSON.parse(metadata.slice(0, newline));
          if (first?.event === 'locked') {
            if (!guarded || reportedLocks || Object.keys(first).length !== 1) throw new Error('INVALID_NATIVE_RESPONSE');
            reportedLocks = true; metadata = metadata.slice(newline + 1);
            void Promise.resolve().then(() => options.beforeStart!()).then(() => {
              clearTimeout(admissionTimer);
              if (!closed && !child.stdin.writableEnded && !signal?.aborted) child.stdin.write(Buffer.from([1]));
            }).catch(error => { admissionError = error; cancel(); });
            continue;
          }
          if (first?.event === 'started') {
            if (!options.onStarted || reportedStart || (guarded && !reportedLocks)) throw new Error('INVALID_NATIVE_RESPONSE');
            const { event: _event, ...identity } = first;
            const parsed = OwnedIdentitySchema.parse(identity); reportedStart = true; metadata = metadata.slice(newline + 1);
            options.onStarted(Object.freeze(parsed));
            continue;
          }
          if (first?.event) throw new Error('INVALID_NATIVE_RESPONSE');
        } catch { invalidMetadata = true; cancel(); }
        break;
      }
    });
    child.once('error', error => { closed = true; clearTimeout(admissionTimer); signal?.removeEventListener('abort', cancel); reject(error); });
    child.once('close', () => {
      closed = true; clearTimeout(admissionTimer);
      signal?.removeEventListener('abort', cancel);
      if (admissionError !== undefined) { reject(admissionError); return; }
      const base = { code: null, output: Buffer.concat(chunks).toString('utf8'), truncated, cancelled: signal?.aborted ?? false, timedOut: admissionTimedOut };
      try {
        if (invalidMetadata) throw new Error('INVALID_NATIVE_RESPONSE');
        const result: unknown = JSON.parse(metadata.trim());
        if (result && typeof result === 'object' && 'status' in result && result.status === 'exited' && 'code' in result && typeof result.code === 'number' && 'cancelled' in result && typeof result.cancelled === 'boolean' && 'timedOut' in result && typeof result.timedOut === 'boolean') {
          resolveResult({ ...base, status: 'exited', code: result.code, cancelled: result.cancelled, timedOut: result.timedOut }); return;
        }
        if (result && typeof result === 'object' && 'status' in result && result.status === 'failed') { resolveResult({ ...base, status: 'failed' }); return; }
      } catch { /* A dead helper has no trustworthy terminal state. */ }
      resolveResult({ ...base, status: 'unknown' });
    });
    child.stdin.write(protocol);
    if (signal?.aborted) cancel();
  });
}
