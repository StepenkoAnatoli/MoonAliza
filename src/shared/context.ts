import { z } from 'zod';

const count = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const TokenUsageSchema = z.object({ inputTokens: count, outputTokens: count }).strict();
export const UsageUpdateSchema = TokenUsageSchema.extend({ modelSteps: count });
export const ContextStateSchema = z.object({
  estimator: z.literal('utf8-estimate'), estimatedInputTokens: count, inputBudgetTokens: count,
  contextTokens: count, reservedOutputTokens: count, omittedHistoryMessages: count, compactedToolResults: count,
}).strict();
export type ContextState = z.infer<typeof ContextStateSchema>;
export type TokenUsage = z.infer<typeof TokenUsageSchema>;
