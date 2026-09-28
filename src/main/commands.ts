import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { lstat, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { CommandInputSchema, CommandPlanSchema, type CommandPlan } from '../shared/commands';
import type { Approval } from '../shared';
import { approvalMatches, assertToolPolicy, canonicalHash, type PolicyProject, type RunMode } from '../engine/policy';
import { resolveProjectPath, isSensitiveContextPath, validateRelativePath } from '../tools/paths';
import { safeCommandEnvironment, type OwnedCommand, type OwnedResult } from '../tools/commands';
import { buildGitCommand } from '../tools/git';

export interface CommandContext {
  run: { id: string; projectId: string; mode: RunMode; status: string; trustRevision: number; policyRevision: number };
  project: PolicyProject & { rootPath: string };
  operation?: { id: string; runId: string; projectId: string; kind: string; status: string; inputHash: string; trustRevision: number; policyRevision: number; input: unknown };
  approval?: Approval;
}
interface Dependencies {
  context(runId: string, operationId?: string): Promise<CommandContext>;
  environment: NodeJS.ProcessEnv; protectedRoots: string[];
  execute(command: OwnedCommand, signal: AbortSignal): Promise<OwnedResult>;
  redact(text: string): Promise<string>;
}
const within = (root: string, target: string) => { const path = relative(root, target); return !path || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path)); };
async function digest(path: string) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 256 * 1024 * 1024) throw new Error('COMMAND_UNAVAILABLE');
  const hash = createHash('sha256'); for await (const bytes of createReadStream(path)) hash.update(bytes); return hash.digest('hex');
}
/** Resolves only installed executables, never the current directory or a project PATH entry. */
export async function findCommand(program: string, environment: NodeJS.ProcessEnv, excluded: string[]): Promise<string> {
  const filename = ({ node: 'node.exe', python: 'python.exe', git: 'git.exe', powershell: 'powershell.exe' } as Record<string, string>)[program];
  if (!filename) throw new Error('COMMAND_UNAVAILABLE');
  const canonicalExcluded = await Promise.all(excluded.map(root => realpath(root)));
  const search = Object.entries(environment).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
  const systemRoot = Object.entries(environment).find(([key]) => key.toLowerCase() === 'systemroot')?.[1];
  const directories = program === 'powershell' && systemRoot ? [join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0')] : search.split(';');
  for (const entry of directories) {
    const directory = entry.replace(/^"|"$/g, ''); if (!isAbsolute(directory)) continue;
    try {
      const path = await realpath(join(directory, filename));
      if (canonicalExcluded.some(root => within(root, path))) continue;
      const info = await lstat(path); if (info.isFile()) return path;
    } catch { /* Try the next installed location. */ }
  }
  throw new Error('COMMAND_UNAVAILABLE');
}
export class CommandBroker {
  private readonly consumed = new Set<string>();
  constructor(private readonly host: Dependencies) {}
  private async publicResult(result: OwnedResult): Promise<OwnedResult> {
    const redacted = await this.host.redact(result.output);
    const bytes = Buffer.from(redacted); let output = redacted; let truncated = result.truncated;
    if (bytes.length > 60000) { output = bytes.subarray(0, 60000).toString('utf8'); truncated = true; }
    // A cut UTF-8 sequence may expand to a replacement character. Also account
    // for JSON escaping before the output is embedded in a tool event/message.
    while (Buffer.byteLength(output) > 60000 || JSON.stringify(output).length > 240000) { output = output.slice(0, Math.floor(output.length * 0.8)); truncated = true; }
    return { ...result, output, truncated };
  }
  async inspectGit(runId: string, name: string, input: unknown, signal: AbortSignal): Promise<OwnedResult> {
    const { project } = await this.context(runId, signal, undefined, true);
    const cwd = await this.cwd(project.rootPath, '');
    const executable = await findCommand('git', this.host.environment, [project.rootPath, ...this.host.protectedRoots]);
    const command = await buildGitCommand(executable, cwd, name, input, signal);
    await this.context(runId, signal, undefined, true);
    const result = await this.host.execute(command, signal);
    return this.publicResult(result);
  }
  private async context(runId: string, signal: AbortSignal, operationId?: string, read = false) {
    const context = await this.host.context(runId, operationId);
    const { run, project } = context;
    assertToolPolicy(run.mode, read ? 'read' : 'command', project, signal);
    if (run.id !== runId || run.projectId !== project.id || run.status !== 'running' || run.trustRevision !== project.trustRevision || run.policyRevision !== project.policy.revision) throw new Error('RUN_CANCELLED');
    return context;
  }
  private async cwd(root: string, path: string) {
    const canonical = await realpath(root); let result = canonical;
    if (path) {
      const name = validateRelativePath(path); if (isSensitiveContextPath(name)) throw new Error('PATH_OUTSIDE_PROJECT');
      let component = canonical;
      for (const part of name.split('/')) { component = join(component, part); if ((await lstat(component)).isSymbolicLink()) throw new Error('PATH_OUTSIDE_PROJECT'); }
      result = await resolveProjectPath(canonical, name);
    }
    const protectedRoots = await Promise.all(this.host.protectedRoots.map(protectedRoot => realpath(protectedRoot)));
    if (!(await lstat(result)).isDirectory() || protectedRoots.some(protectedRoot => within(protectedRoot, result) || within(result, protectedRoot))) throw new Error('PATH_OUTSIDE_PROJECT');
    return result;
  }
  async prepare(runId: string, raw: unknown, signal: AbortSignal): Promise<CommandPlan> {
    const input = CommandInputSchema.parse(raw); const { project } = await this.context(runId, signal);
    const cwd = await this.cwd(project.rootPath, input.cwd);
    const executable = await findCommand(input.program === 'npm' ? 'node' : input.program, this.host.environment, [project.rootPath, ...this.host.protectedRoots]);
    const files = [{ path: executable, sha256: await digest(executable) }];
    let args = input.args;
    if (input.program === 'npm') {
      const cli = await realpath(join(dirname(executable), 'node_modules', 'npm', 'bin', 'npm-cli.js')).catch(() => { throw new Error('COMMAND_UNAVAILABLE'); });
      if (!within(dirname(executable), cli)) throw new Error('COMMAND_UNAVAILABLE');
      files.push({ path: cli, sha256: await digest(cli) }); args = [cli, ...args];
    }
    if (input.program === 'powershell') args = ['-NoLogo', '-NoProfile', '-NonInteractive', ...args];
    await this.context(runId, signal);
    return CommandPlanSchema.parse({ executable, args, cwd, env: safeCommandEnvironment(this.host.environment), timeoutMs: input.timeoutSeconds * 1000, maxOutputBytes: 60000, files, environmentPolicy: 'ordinary-windows-v1' });
  }
  async execute(runId: string, operationId: string, signal: AbortSignal): Promise<OwnedResult> {
    const key = `${runId}:${operationId}`;
    const context = await this.context(runId, signal, operationId);
    const op = context.operation; const approval = context.approval;
    if (!op || op.id !== operationId || op.runId !== runId || op.kind !== 'command' || op.status !== 'started' || !approval || !approvalMatches(op, approval, context.project) || canonicalHash(op.input) !== op.inputHash) throw new Error('APPROVAL_STALE');
    if (this.consumed.has(key)) throw new Error('COMMAND_ALREADY_STARTED');
    this.consumed.add(key);
    const plan = CommandPlanSchema.parse(op.input);
    if (plan.files[0]?.path !== plan.executable) throw new Error('APPROVAL_STALE');
    for (const file of plan.files) if (await digest(file.path) !== file.sha256) throw new Error('COMMAND_CHANGED');
    const canonicalRoot = await realpath(context.project.rootPath);
    const cwd = await this.cwd(canonicalRoot, relative(canonicalRoot, plan.cwd).replaceAll('\\', '/'));
    if (cwd !== plan.cwd) throw new Error('COMMAND_CHANGED');
    await this.context(runId, signal, operationId);
    const result = await this.host.execute(plan, signal);
    return this.publicResult(result);
  }
}
