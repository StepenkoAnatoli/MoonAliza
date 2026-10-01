import { z } from 'zod';
import { ApprovalSchema, ChangeSchema, DateTimeSchema, DigestSchema, HttpUrlSchema, IdSchema, MessageSchema, ModeSchema, OperationSchema, ProfileKindSchema, ProfileSchema, ProjectPolicySchema, ProjectSchema, RevisionSchema, RunSchema, SessionSchema } from './contracts';
import { EventSchema } from './events';
import { HardwareSchema } from './contracts';
import { ContextStateSchema, UsageUpdateSchema } from './context';
import { PublicErrorSchema } from './errors';

const Empty = z.object({}).strict();
const Deleted = z.object({ deleted: z.literal(true) }).strict();
const Cancelled = z.object({ cancelled: z.literal(true) }).strict();
const ProjectId = z.object({ projectId: IdSchema }).strict();
const SessionId = z.object({ sessionId: IdSchema }).strict();
const ProfileId = z.object({ profileId: IdSchema }).strict();
const ModelId = z.object({ modelId: IdSchema }).strict();
const ResearchId = z.object({ researchId: IdSchema }).strict();
const MissionId = z.object({ missionId: IdSchema }).strict();
const projectResult = z.object({ project: ProjectSchema }).strict();
const sessionResult = z.object({ session: SessionSchema }).strict();
const runResult = z.object({ run: RunSchema }).strict();
const profileResult = z.object({ profile: ProfileSchema }).strict();
const Page = { after: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).default(0), limit: z.number().int().min(1).max(1000).default(500) };
export const RunEventsParams = z.object({ runId: IdSchema, ...Page }).strict();
export const ProfileSaveParams = z.object({
  id: IdSchema.optional(), expectedRevision: RevisionSchema.optional(), name: z.string().trim().min(1).max(128), kind: ProfileKindSchema,
  endpoint: HttpUrlSchema, model: z.string().trim().min(1).max(256), contextTokens: z.number().int().min(512).max(2_000_000),
  outputTokens: z.number().int().min(1).max(200_000), secret: z.string().min(1).max(16384).optional(), clearCredential: z.boolean().optional(),
}).strict().refine(value => value.outputTokens <= value.contextTokens, 'Output budget exceeds context budget')
  .refine(value => !(value.secret && value.clearCredential), 'Cannot save and clear a credential together')
  .refine(value => (value.id === undefined) === (value.expectedRevision === undefined), 'Updating a profile requires its current revision');

export const ModelSchema = z.object({ id: IdSchema, name: z.string().min(1).max(256), status: z.enum(['available', 'downloading', 'probing', 'enabled', 'unavailable', 'failed']), modelDigest: DigestSchema.optional(), sizeBytes: z.number().int().nonnegative().optional(), qualified: z.boolean(), progress: z.number().min(0).max(1).optional(), unavailableReason: z.string().max(2048).optional() }).strict();
export type Model = z.infer<typeof ModelSchema>;
const modelResult = z.object({ model: ModelSchema }).strict();
export const ResearchSchema = z.object({ id: IdSchema, projectId: IdSchema, runId: IdSchema.optional(), brief: z.string().min(1).max(32768), status: z.enum(['queued', 'provisioning', 'collecting', 'awaiting_review', 'sufficient', 'insufficient', 'cancelling', 'cancel_pending', 'cancelled', 'failed']), clientRef: IdSchema, workflowRunId: z.string().regex(/^\d+$/).optional(), createdAt: DateTimeSchema, updatedAt: DateTimeSchema }).strict();
export type Research = z.infer<typeof ResearchSchema>;
export const ResearchSourceSchema = z.object({ id: IdSchema, url: HttpUrlSchema, title: z.string().max(1024), collectedAt: DateTimeSchema, contentDigest: DigestSchema, excerpt: z.string().max(16384) }).strict();
const researchResult = z.object({ research: ResearchSchema }).strict();
export const MissionTaskSchema = z.object({ id: IdSchema, title: z.string().min(1).max(256), instructions: z.string().min(1).max(32768), dependencies: z.array(IdSchema).max(128), status: z.enum(['pending', 'running', 'produced', 'verifying', 'completed', 'failed', 'cancelled']), runId: IdSchema.optional(), outputManifestDigest: DigestSchema.optional(), verificationRunId: IdSchema.optional() }).strict();
export const MissionSchema = z.object({ id: IdSchema, projectId: IdSchema, title: z.string().min(1).max(256), instructions: z.string().min(1).max(65536), status: z.enum(['queued', 'running', 'paused', 'verifying', 'completed', 'failed', 'cancelling', 'cancelled']), profileId: IdSchema, modelStepBudget: z.number().int().min(1).max(1000), maxAgents: z.number().int().min(1).max(5), tasks: z.array(MissionTaskSchema).max(128), createdAt: DateTimeSchema, updatedAt: DateTimeSchema }).strict();
export type Mission = z.infer<typeof MissionSchema>;
const missionResult = z.object({ mission: MissionSchema }).strict();
export const SettingsSchema = z.object({ revision: RevisionSchema, theme: z.enum(['system', 'light', 'dark']), defaultMode: ModeSchema, modelStepBudget: z.number().int().min(1).max(120), runDurationMinutes: z.number().int().min(1).max(120), commandTimeoutSeconds: z.number().int().min(1).max(600), autoSelectSkills: z.number().int().min(0).max(3), reducedMotion: z.enum(['system', 'on', 'off']) }).strict();
export type Settings = z.infer<typeof SettingsSchema>;
const settingsResult = z.object({ settings: SettingsSchema }).strict();
export const RecoveryIdentitySchema = ApprovalSchema.omit({ decision: true });
export type RecoveryIdentity = z.infer<typeof RecoveryIdentitySchema>;
export const RecoveryItemSchema = z.object({
  operation: OperationSchema, summary: z.string().max(32767),
  observation: z.enum(['uninspected', 'applied', 'not-applied', 'conflict']),
  inspectedAt: DateTimeSchema.optional(), acknowledgedAt: DateTimeSchema.optional(),
}).strict();
export type RecoveryItem = z.infer<typeof RecoveryItemSchema>;
export const SkillSchema = z.object({ id: IdSchema, name: z.string().min(1).max(256), description: z.string().max(4096), source: z.enum(['bundled', 'user', 'project']), available: z.boolean() }).strict();
export type Skill = z.infer<typeof SkillSchema>;
export type MethodOwner = 'main' | 'engine';
export type MethodEffect = 'read' | 'write' | 'network' | 'native' | 'lifecycle';
export type AuthorizationRule = 'authenticated' | 'project-member' | 'trusted-project' | 'native-selection' | 'profile-owner' | 'operation-bound' | 'research-policy' | 'mission-owner' | 'user-confirmed';
export interface MethodDefinition<P extends z.ZodType = z.ZodType, R extends z.ZodType = z.ZodType> { params: P; result: R; owner: MethodOwner; effect: MethodEffect; authorization: AuthorizationRule }
function method<P extends z.ZodType, R extends z.ZodType>(params: P, result: R, owner: MethodOwner, effect: MethodEffect, authorization: AuthorizationRule): MethodDefinition<P, R> { return { params, result, owner, effect, authorization }; }

/** The sole renderer-method registry. Types, validation and routing metadata derive from it. */
export const MethodSpec = {
  'project.pick': method(z.object({ create: z.boolean().optional() }).strict(), z.union([z.object({ ticketId: IdSchema, name: z.string().min(1).max(256), pathLabel: z.string().min(1).max(1024) }).strict(), Cancelled]), 'main', 'native', 'authenticated'),
  'project.list': method(Empty, z.object({ projects: z.array(ProjectSchema).max(10000) }).strict(), 'engine', 'read', 'authenticated'),
  'project.trust': method(z.object({ ticketId: IdSchema }).strict(), projectResult, 'main', 'write', 'native-selection'),
  'project.revokeTrust': method(ProjectId, projectResult, 'engine', 'write', 'project-member'),
  'project.relink': method(z.object({ projectId: IdSchema, ticketId: IdSchema }).strict(), projectResult, 'main', 'write', 'native-selection'),
  'project.forget': method(ProjectId, Deleted, 'engine', 'write', 'project-member'),
  'project.policy.update': method(z.object({ projectId: IdSchema, expectedRevision: RevisionSchema, policy: ProjectPolicySchema.omit({ revision: true }) }).strict(), projectResult, 'engine', 'write', 'project-member'),
  'session.create': method(z.object({ projectId: IdSchema.nullable(), title: z.string().trim().min(1).max(256).optional() }).strict(), sessionResult, 'engine', 'write', 'project-member'),
  'session.list': method(z.object({ projectId: IdSchema.nullable() }).strict(), z.object({ sessions: z.array(SessionSchema).max(10000) }).strict(), 'engine', 'read', 'project-member'),
  'session.policy.update': method(z.object({ sessionId: IdSchema, expectedRevision: RevisionSchema, inference: z.enum(['local-only', 'cloud-allowed']) }).strict(), sessionResult, 'engine', 'write', 'user-confirmed'),
  'session.branch': method(z.object({ sessionId: IdSchema, projectId: IdSchema.nullable(), context: z.string().max(65536) }).strict(), sessionResult, 'engine', 'write', 'user-confirmed'),
  'session.read': method(SessionId, z.object({ session: SessionSchema, messages: z.array(MessageSchema).max(10000), runs: z.array(RunSchema).max(10000), context: ContextStateSchema.nullable(), usage: UsageUpdateSchema.nullable(), failure: PublicErrorSchema.nullable() }).strict(), 'engine', 'read', 'project-member'),
  'session.delete': method(SessionId, Deleted, 'engine', 'write', 'project-member'),
  'run.start': method(z.object({ sessionId: IdSchema, profileId: IdSchema, mode: ModeSchema, prompt: z.string().trim().min(1).max(131072) }).strict(), runResult, 'engine', 'write', 'trusted-project'),
  'run.cancel': method(z.object({ runId: IdSchema }).strict(), runResult, 'engine', 'lifecycle', 'project-member'),
  'run.events': method(RunEventsParams, z.object({ events: z.array(EventSchema).max(1000), hasMore: z.boolean() }).strict(), 'engine', 'read', 'project-member'),
  'approval.decide': method(ApprovalSchema, z.object({ approval: ApprovalSchema }).strict(), 'engine', 'write', 'operation-bound'),
  'approval.list': method(z.object({ runId: IdSchema }).strict(), z.object({ operations: z.array(OperationSchema).max(128) }).strict(), 'engine', 'read', 'project-member'),
  'approval.read': method(z.object({ projectId: IdSchema, operationId: IdSchema }).strict(), z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('write'), operation: OperationSchema, path: z.string().max(32767), before: z.string().max(2097152).nullable(), after: z.string().max(2097152).nullable() }).strict(),
    z.object({ kind: z.literal('command'), operation: OperationSchema, executable: z.string().max(32767), args: z.array(z.string().max(32767)).max(132), cwd: z.string().max(32767), timeoutMs: z.number().int().min(1).max(600000) }).strict(),
  ]), 'engine', 'read', 'project-member'),
  'profile.list': method(Empty, z.object({ profiles: z.array(ProfileSchema).max(1000) }).strict(), 'engine', 'read', 'authenticated'),
  'profile.save': method(ProfileSaveParams, profileResult, 'main', 'write', 'profile-owner'),
  'profile.test': method(ProfileId, z.object({ profileId: IdSchema, profileRevisionId: IdSchema, success: z.boolean(), latencyMs: z.number().nonnegative(), message: z.string().max(2048) }).strict(), 'main', 'network', 'profile-owner'),
  'profile.delete': method(ProfileId, Deleted, 'main', 'write', 'profile-owner'),
  'model.list': method(Empty, z.object({ models: z.array(ModelSchema).max(10000) }).strict(), 'engine', 'read', 'authenticated'),
  'model.enable': method(ModelId, modelResult, 'engine', 'network', 'user-confirmed'),
  'model.cancel': method(ModelId, modelResult, 'engine', 'lifecycle', 'authenticated'),
  'model.import': method(Empty, z.union([modelResult, Cancelled]), 'main', 'native', 'native-selection'),
  'model.remove': method(ModelId, Deleted, 'engine', 'write', 'user-confirmed'),
  'model.storage.change': method(Empty, z.union([z.object({ operationId: IdSchema, pathLabel: z.string().min(1).max(1024) }).strict(), Cancelled]), 'main', 'native', 'native-selection'),
  'research.provision': method(z.object({ projectId: IdSchema, owner: z.string().min(1).max(100).regex(/^[a-zA-Z0-9-]+$/), repository: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_.-]+$/), provisioningSecret: z.string().min(1).max(16384), runtimeSecret: z.string().min(1).max(16384) }).strict(), z.object({ provisionId: IdSchema, status: z.enum(['accepted', 'ready']) }).strict(), 'main', 'network', 'research-policy'),
  'research.start': method(z.object({ projectId: IdSchema, runId: IdSchema.optional(), brief: z.string().trim().min(1).max(32768) }).strict(), researchResult, 'engine', 'network', 'research-policy'),
  'research.read': method(ResearchId, z.object({ research: ResearchSchema, sources: z.array(ResearchSourceSchema).max(100), synthesis: z.string().max(262144).optional() }).strict(), 'engine', 'read', 'project-member'),
  'research.cancel': method(ResearchId, researchResult, 'engine', 'lifecycle', 'project-member'),
  'research.review': method(z.object({ researchId: IdSchema, evidenceDigest: DigestSchema, decision: z.enum(['sufficient', 'insufficient']), notes: z.string().max(16384) }).strict(), researchResult, 'engine', 'write', 'user-confirmed'),
  'research.purge': method(ResearchId, Deleted, 'engine', 'write', 'project-member'),
  'skill.list': method(ProjectId, z.object({ skills: z.array(SkillSchema).max(1000) }).strict(), 'engine', 'read', 'project-member'),
  'mission.create': method(z.object({ projectId: IdSchema, profileId: IdSchema, title: z.string().trim().min(1).max(256), instructions: z.string().trim().min(1).max(65536), modelStepBudget: z.number().int().min(1).max(1000).default(120), maxAgents: z.number().int().min(1).max(5).default(5) }).strict(), missionResult, 'engine', 'write', 'trusted-project'),
  'mission.read': method(MissionId, missionResult, 'engine', 'read', 'mission-owner'),
  'mission.pause': method(MissionId, missionResult, 'engine', 'lifecycle', 'mission-owner'),
  'mission.resume': method(MissionId, missionResult, 'engine', 'lifecycle', 'trusted-project'),
  'mission.cancel': method(MissionId, missionResult, 'engine', 'lifecycle', 'mission-owner'),
  'settings.read': method(Empty, settingsResult, 'engine', 'read', 'authenticated'),
  'hardware.read': method(Empty, z.object({ hardware: HardwareSchema.nullable(), error: z.literal('HARDWARE_UNAVAILABLE').nullable(), checkedAt: DateTimeSchema }).strict(), 'main', 'native', 'authenticated'),
  'runtime.inspect': method(Empty, z.object({ endpoint: z.literal('http://127.0.0.1:11434'), ownership: z.literal('external'), checkedAt: DateTimeSchema, status: z.enum(['available', 'unavailable', 'incompatible']), version: z.string().max(128).nullable(), models: z.array(z.object({ name: z.string().min(1).max(256), digest: DigestSchema, sizeBytes: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), quantization: z.string().max(128).nullable(), qualified: z.literal(false) }).strict()).max(1000) }).strict(), 'main', 'network', 'authenticated'),
  'storage.read': method(Empty, z.object({ usedBytes: z.number().int().nonnegative(), limitBytes: z.number().int().positive(), snapshotCount: z.number().int().nonnegative(), protectedBytes: z.number().int().nonnegative() }).strict(), 'engine', 'read', 'authenticated'),
  'recovery.list': method(z.object({ projectId: IdSchema, ...Page }).strict(), z.object({ items: z.array(RecoveryItemSchema).max(1000), hasMore: z.boolean(), pendingCount: z.number().int().nonnegative() }).strict(), 'engine', 'read', 'project-member'),
  'recovery.inspect': method(RecoveryIdentitySchema, z.object({ item: RecoveryItemSchema }).strict(), 'engine', 'write', 'operation-bound'),
  'recovery.acknowledge': method(RecoveryIdentitySchema, z.object({ item: RecoveryItemSchema }).strict(), 'engine', 'write', 'operation-bound'),
  'settings.save': method(z.object({ expectedRevision: RevisionSchema, settings: SettingsSchema.omit({ revision: true }) }).strict(), settingsResult, 'engine', 'write', 'authenticated'),
  'diagnostics.export': method(z.object({ categories: z.array(z.enum(['versions', 'hardware', 'operations', 'errors', 'configuration', 'logs'])).min(1).max(6) }).strict(), z.union([z.object({ exportId: IdSchema, fileName: z.string().min(1).max(256) }).strict(), Cancelled]), 'main', 'native', 'user-confirmed'),
  'external.open': method(z.object({ url: HttpUrlSchema }).strict(), z.object({ opened: z.literal(true) }).strict(), 'main', 'native', 'user-confirmed'),
  'changes.list': method(z.object({ projectId: IdSchema, runId: IdSchema.optional(), ...Page }).strict(), z.object({ changes: z.array(ChangeSchema).max(1000), hasMore: z.boolean() }).strict(), 'engine', 'read', 'project-member'),
  'changes.read': method(z.object({ projectId: IdSchema, changeId: IdSchema }).strict(), z.object({ change: ChangeSchema, before: z.string().max(2097152).nullable(), after: z.string().max(2097152).nullable(), diff: z.string().max(4194304), truncated: z.boolean() }).strict(), 'engine', 'read', 'project-member'),
  'changes.undo': method(z.object({ projectId: IdSchema, changeId: IdSchema, expectedAfterHash: DigestSchema.nullable() }).strict(), z.object({ change: ChangeSchema, operationId: IdSchema }).strict(), 'engine', 'write', 'trusted-project'),
} as const;
export const methodSpecs = MethodSpec;
export type MethodName = keyof typeof MethodSpec;
export type MethodParams<M extends MethodName> = z.input<(typeof MethodSpec)[M]['params']>;
export type MethodInput<M extends MethodName> = z.output<(typeof MethodSpec)[M]['params']>;
export type MethodResult<M extends MethodName> = z.output<(typeof MethodSpec)[M]['result']>;
