import { PROVIDER_STATE_FORMATS } from '../engine/control';
import type { ToolSpec } from '../shared';
import type { Completion, InferenceProfile } from './inference';
import type { CheckedTranscript, KindPart } from './provider-kind';

/**
 * The Anthropic Messages adapter (docs/specification/more-models-phase2.md section 5). Frozen skeleton (U0): every
 * function throws NOT_IMPLEMENTED until unit U3 builds it, and the kind joins complete()'s table only in unit U4.
 * Imports only types from inference.ts, so there is no runtime import cycle.
 */
export const ANTHROPIC_VERSION = '2023-06-01';

/** One content block as read: its start object's fields with the applied deltas. */
export interface FoldedBlock { readonly fields: Readonly<Record<string, unknown>>; readonly partialJson: string; readonly replayable: boolean; readonly closed: boolean }
export interface AnthropicFold {
  /** message_start read. */
  readonly started: boolean;
  /** message_stop read. */
  readonly stopped: boolean;
  readonly stopReason: string | null;
  readonly blocks: readonly FoldedBlock[];
  readonly usage: Readonly<{ input_tokens?: number; cache_read_input_tokens?: number; cache_creation_input_tokens?: number; output_tokens?: number }>;
}

const notYet = (): never => { throw new Error('NOT_IMPLEMENTED'); };

export function anthropicHeaders(_profile: InferenceProfile, _secret: string | undefined): Record<string, string> { return notYet(); }
export function encodeAnthropic(_profile: InferenceProfile, _transcript: CheckedTranscript, _tools: readonly ToolSpec[]): string { return notYet(); }
export async function readAnthropic(_response: Response): Promise<AnthropicFold> { return notYet(); }
export function anthropicOutcome(_fold: AnthropicFold, _check: { tools: readonly ToolSpec[]; usedIds: ReadonlySet<string> }): Completion { return notYet(); }
export function isAnthropicOverflow(_text: string): boolean { return notYet(); }
export function anthropicRetryDelayMs(_response: Response, _attempt: number): number | undefined { return notYet(); }

export const anthropicKind: KindPart<AnthropicFold> = {
  url: endpoint => `${endpoint}/messages`,
  headers: anthropicHeaders,
  timeoutMs: 600_000,
  owns: [PROVIDER_STATE_FORMATS.anthropic],
  refusalStatuses: [400],
  body: (profile, transcript, tools) => encodeAnthropic(profile, transcript, tools),
  read: readAnthropic,
  outcome: anthropicOutcome,
  isOverflow: isAnthropicOverflow,
  retryDelayMs: anthropicRetryDelayMs,
};
