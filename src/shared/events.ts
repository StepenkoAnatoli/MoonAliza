import { z } from 'zod';
import { ApprovalSchema, ChangeSchema, IdSchema, ResearchStatusSchema, MessageSchema, OperationSchema, RunSchema, RunStatusSchema, ToolCallSchema } from './contracts';
import { PublicErrorSchema } from './errors';
import { ContextStateSchema, UsageUpdateSchema } from './context';

const base = { schemaVersion: z.literal(1), engineEpoch: IdSchema, runId: IdSchema, seq: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), at: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER) };
const empty = z.object({}).strict();
const event = <T extends string, S extends z.ZodType>(type: T, payload: S) => z.object({ ...base, type: z.literal(type), payload }).strict();
export const EventSchema = z.discriminatedUnion('type', [
  event('run.started', z.object({ run: RunSchema }).strict()),
  event('run.status', z.object({ status: RunStatusSchema }).strict()),
  event('run.completed', empty),
  event('run.cancelled', empty),
  event('run.failed', z.object({ error: PublicErrorSchema }).strict()),
  event('run.interrupted', z.object({ reason: z.string().min(1).max(2048) }).strict()),
  event('message.created', z.object({ message: MessageSchema }).strict()),
  event('message.delta', z.object({ messageId: IdSchema, text: z.string().max(262144) }).strict()),
  event('thinking.delta', z.object({ messageId: IdSchema, text: z.string().max(262144) }).strict()),
  event('tool.started', z.object({ operationId: IdSchema, call: ToolCallSchema }).strict()),
  event('tool.completed', z.object({ operationId: IdSchema, toolCallId: IdSchema, output: z.string().max(262144), truncated: z.boolean() }).strict()),
  event('tool.failed', z.object({ operationId: IdSchema, toolCallId: IdSchema, error: PublicErrorSchema }).strict()),
  event('approval.required', z.object({ operation: OperationSchema, summary: z.string().min(1).max(16384) }).strict()),
  event('approval.decided', z.object({ approval: ApprovalSchema }).strict()),
  event('operation.updated', z.object({ operation: OperationSchema }).strict()),
  event('operation.unknown', z.object({ operationId: IdSchema, reason: z.string().min(1).max(2048) }).strict()),
  event('change.recorded', z.object({ change: ChangeSchema }).strict()),
  event('usage.updated', UsageUpdateSchema),
  event('context.updated', ContextStateSchema),
  event('research.status', z.object({ researchId: IdSchema, status: ResearchStatusSchema }).strict()),
  event('mission.status', z.object({ missionId: IdSchema, status: z.enum(['queued', 'running', 'paused', 'verifying', 'completed', 'failed', 'cancelling', 'cancelled']) }).strict()),
  event('mission.task', z.object({ missionId: IdSchema, taskId: IdSchema, status: z.enum(['pending', 'running', 'produced', 'verifying', 'completed', 'failed', 'cancelled']) }).strict()),
]);
export type RunEvent = z.infer<typeof EventSchema>;
export type EventType = RunEvent['type'];
export type EventPayload<T extends EventType> = Extract<RunEvent, { type: T }>['payload'];
