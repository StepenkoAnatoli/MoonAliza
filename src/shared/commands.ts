import { z } from 'zod';
import type { ToolSpec } from './contracts';

const text = z.string().max(32767).refine(value => !value.includes('\0'));
export const CommandInputSchema = z.object({
  program: z.enum(['node', 'npm', 'python', 'git', 'powershell']),
  args: z.array(text).max(128), cwd: text.default(''), timeoutSeconds: z.number().int().min(1).max(600).default(120),
}).strict().refine(value => JSON.stringify(value).length <= 24000, 'Command is too large');
export type CommandInput = z.infer<typeof CommandInputSchema>;
export const CommandPlanSchema = z.object({
  executable: text, args: z.array(text).max(132), cwd: text,
  env: z.record(z.string().max(128), text), timeoutMs: z.number().int().min(1).max(600000), maxOutputBytes: z.literal(60000),
  files: z.array(z.object({ path: text, sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()).min(1).max(2),
  environmentPolicy: z.literal('ordinary-windows-v1'),
}).strict();
export type CommandPlan = z.infer<typeof CommandPlanSchema>;
export const CommandResultSchema = z.object({ status: z.enum(['exited', 'unknown', 'failed']), code: z.number().int().nullable(), output: z.string().max(120000), truncated: z.boolean(), cancelled: z.boolean(), timedOut: z.boolean() }).strict();
export const COMMAND_TOOL_SPECS: ToolSpec[] = [{ name: 'run_command', description: 'Propose a command for explicit review in Build mode. Programs: node, npm, python, git, powershell. Arguments are a literal array; no implicit shell. cwd is project-relative (empty for root). PowerShell uses -NoProfile -NonInteractive. Commands can modify files and access the network; effects are not covered by file Undo. Nonzero exits are failures; unknown outcomes must never be retried automatically.', parameters: z.toJSONSchema(CommandInputSchema) as ToolSpec['parameters'] }];
