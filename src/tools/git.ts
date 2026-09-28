import { lstat, open, opendir, readdir, realpath } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { ToolSpec } from '../shared';
import { isSensitiveContextPath, resolveProjectPath, validateRelativePath } from './paths';
import { safeCommandEnvironment, type OwnedCommand } from './commands';

const schemas = {
  git_status: z.object({}).strict(),
  git_diff: z.object({ path: z.string().min(1).max(32767).optional(), staged: z.boolean().default(false) }).strict(),
  git_log: z.object({ limit: z.number().int().min(1).max(30).default(10) }).strict(),
};
export const GIT_TOOL_SPECS: ToolSpec[] = [
  { name: 'git_status', description: 'Read bounded Git status. Requires an ordinary repository with supported safe configuration; linked worktrees are currently unsupported.' },
  { name: 'git_diff', description: 'Read a patch for one non-sensitive project file, or a summary when path is omitted. staged selects the index diff. No arbitrary Git arguments.' },
  { name: 'git_log', description: 'Read recent commit hashes and subjects, with a maximum of 30 entries.' },
].map(tool => ({ ...tool, parameters: z.toJSONSchema(schemas[tool.name as keyof typeof schemas]) as ToolSpec['parameters'] }));
const unsafe = () => new Error('GIT_UNSAFE_REPOSITORY');
const allowed: Record<string, Set<string>> = {
  core: new Set(['repositoryformatversion', 'filemode', 'bare', 'logallrefupdates', 'symlinks', 'ignorecase', 'autocrlf', 'eol', 'safecrlf', 'precomposeunicode', 'protectntfs', 'protecthfs', 'longpaths']),
  remote: new Set(['url', 'fetch', 'pushurl']), branch: new Set(['remote', 'merge']), user: new Set(['name', 'email']),
};
// Deliberately recognize a small config grammar. Unknown syntax is rejected rather
// than asking Git to parse a configuration that might include executable settings.
function checkConfig(content: string) {
  if (content.length > 65536 || content.includes('\0') || /\\\r?\n/.test(content)) throw unsafe();
  let section = '';
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim(); if (!line || /^[#;]/.test(line)) continue;
    const header = /^\[([a-z]+)(?: "[^"\\]*")?\]$/i.exec(line);
    if (header) { section = header[1]!.toLowerCase(); if (!allowed[section]) throw unsafe(); continue; }
    const pair = /^([a-z][a-z0-9-]*)\s*=\s*(.*)$/i.exec(line);
    if (!pair || !allowed[section]?.has(pair[1]!.toLowerCase())) throw unsafe();
    if (section === 'core' && pair[1]!.toLowerCase() === 'repositoryformatversion' && pair[2] !== '0') throw unsafe();
    if (section === 'core' && pair[1]!.toLowerCase() === 'bare' && pair[2]!.toLowerCase() !== 'false') throw unsafe();
  }
}
async function checkTree(root: string, signal?: AbortSignal) {
  const queue = [root]; let entries = 0; const deadline = Date.now() + 15000;
  while (queue.length) {
    signal?.throwIfAborted();
    const directory = queue.pop()!;
    for await (const entry of await opendir(directory)) {
      if (++entries > 50000 || Date.now() > deadline) throw new Error('GIT_INSPECTION_LIMIT');
      const path = join(directory, entry.name); const info = await lstat(path);
      if (info.isSymbolicLink() || (info.isFile() && info.nlink > 1)) throw unsafe();
      if (info.isDirectory()) queue.push(path);
      else if (!info.isFile()) throw unsafe();
    }
  }
}
async function readConfig(path: string) {
  const file = await open(path, 'r');
  try {
    const bytes = Buffer.alloc(65537); const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
    if (bytesRead > 65536 || bytesRead !== (await file.stat()).size) throw unsafe();
    return bytes.subarray(0, bytesRead).toString('utf8');
  } finally { await file.close(); }
}
export async function buildGitCommand(executable: string, projectRoot: string, tool: string, raw: unknown, signal?: AbortSignal): Promise<OwnedCommand> {
  if (!Object.hasOwn(schemas, tool)) throw new Error('INVALID_REQUEST');
  const input = schemas[tool as keyof typeof schemas].parse(raw);
  const root = await realpath(projectRoot); const git = join(root, '.git');
  const gitInfo = await lstat(git).catch(() => { throw new Error('GIT_UNAVAILABLE'); });
  if (!gitInfo.isDirectory() || gitInfo.isSymbolicLink()) throw unsafe();
  await checkTree(root, signal);
  for (const name of ['commondir', 'gitdir', 'config.worktree', 'objects/info/alternates', 'objects/info/http-alternates']) {
    if (await lstat(join(git, name)).then(() => true, () => false)) throw unsafe();
  }
  if ((await readdir(join(git, 'objects', 'pack')).catch(() => [] as string[])).some(name => name.endsWith('.promisor'))) throw unsafe();
  checkConfig(await readConfig(join(git, 'config')));
  const base = ['--no-pager', '--no-optional-locks', '--no-lazy-fetch', '--git-dir', git, '--work-tree', root,
    '-c', 'core.fsmonitor=false', '-c', 'core.hooksPath=NUL', '-c', 'core.attributesFile=NUL', '-c', 'core.excludesFile=NUL', '-c', 'core.untrackedCache=false',
    '-c', 'maintenance.auto=false', '-c', 'gc.auto=0', '-c', 'protocol.allow=never', '-c', 'color.ui=false'];
  let args: string[];
  if (tool === 'git_status') args = ['status', '--porcelain=v1', '--untracked-files=normal', '--ignore-submodules=all'];
  else if (tool === 'git_log') args = ['log', `--max-count=${'limit' in input ? input.limit : 10}`, '--no-show-signature', '--no-decorate', '--format=%H %s', '--no-notes', '--'];
  else {
    args = ['diff', '--no-ext-diff', '--no-textconv', '--ignore-submodules=all', '--no-renames', '--no-color', ...('staged' in input && input.staged ? ['--cached'] : [])];
    if ('path' in input && input.path) {
      const name = validateRelativePath(input.path); if (isSensitiveContextPath(name)) throw new Error('PATH_OUTSIDE_PROJECT');
      const target = await resolveProjectPath(root, name, { allowMissing: true });
      const info = await lstat(target).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return null; throw error; });
      if (info && !info.isFile()) throw new Error('PATH_OUTSIDE_PROJECT');
      // Git's literal pathspec still matches directory descendants. Explicitly
      // exclude descendants when a former directory is now missing or a file.
      args.push('--', `:(top,literal)${name}`, `:(top,exclude,literal)${name}/`);
    } else args.push('--stat', '--');
  }
  signal?.throwIfAborted();
  return { executable, args: [...base, ...args], cwd: root, env: { ...safeCommandEnvironment(), GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_SYSTEM: 'NUL', GIT_CONFIG_GLOBAL: 'NUL', GIT_ATTR_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1', GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0', GIT_PAGER: '', LC_ALL: 'C' }, timeoutMs: 15000, maxOutputBytes: 60000 };
}
