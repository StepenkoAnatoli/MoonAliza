import { z } from 'zod';
import { IdSchema } from './contracts';

const PurposeSchema = z.enum(['inference', 'provider-test', 'research', 'provision']);
const binding = { purpose: PurposeSchema, contextId: IdSchema, profileId: IdSchema, profileRevisionId: IdSchema };
export const HostMessageSchema = z.object({
  schemaVersion: z.literal(1), id: IdSchema, engineEpoch: IdSchema, type: z.literal('network.request'),
  payload: z.object({ ...binding, requestId: IdSchema, path: z.string().min(1).max(1024).refine(path => path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') && !path.includes('?') && !path.includes('#')), method: z.literal('POST'), body: z.string().max(2_097_152), timeoutMs: z.number().int().min(1).max(120_000), maxBytes: z.number().int().min(1).max(4_194_304) }).strict(),
}).strict();
export type HostMessage = z.infer<typeof HostMessageSchema>;
export interface HostGrant { engineEpoch: string; purpose: z.infer<typeof PurposeSchema>; contextId: string; profileId: string; profileRevisionId: string; active: boolean; capabilities: readonly string[] }
export function authorizeHostMessage(input: unknown, grant: HostGrant): boolean {
  const result = HostMessageSchema.safeParse(input);
  if (!result.success || !grant.active) return false;
  const message = result.data;
  return message.engineEpoch === grant.engineEpoch && grant.capabilities.includes(message.type)
    && message.payload.purpose === grant.purpose && message.payload.contextId === grant.contextId
    && message.payload.profileId === grant.profileId && message.payload.profileRevisionId === grant.profileRevisionId;
}
