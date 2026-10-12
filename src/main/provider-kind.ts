import type { ToolSpec } from '../shared';
import type { Completion, InferenceMessage, InferenceProfile } from './inference';

/**
 * The per-kind request builder (docs/specification/more-models-phase2.md section 4): complete() runs the kind-neutral
 * checks, then drives one part per provider kind. Types only; the parts live beside their kinds.
 */

/** The transcript after the kind-neutral checks: strict parse, complete tool groups, owned provider state only. */
export interface CheckedTranscript { readonly messages: readonly InferenceMessage[]; readonly usedIds: ReadonlySet<string> }
export interface ManagedOllamaOptions { numGpu: 0; keepAlive: -1 }

/** One provider kind's wire, driven by complete() (src/main/inference.ts). */
export interface KindPart<Folded> {
  /** The request URL from the validated endpoint (no trailing slash). */
  url(endpoint: string, profile: InferenceProfile): string;
  headers(profile: InferenceProfile, secret: string | undefined): Record<string, string>;
  /** One deadline for every attempt of a call, from its start: 120_000 for the chat kinds, 600_000 for anthropic. */
  readonly timeoutMs: number;
  /** Provider-state formats this kind accepts on input; any other format is refused before a fetch. */
  readonly owns: readonly string[];
  /** Statuses whose body (at most 64 KiB) is read for isOverflow. */
  readonly refusalStatuses: readonly number[];
  /** Pure: the same input gives the same bytes. Throws INVALID_INFERENCE_REQUEST. */
  body(profile: InferenceProfile, transcript: CheckedTranscript, tools: readonly ToolSpec[], extra: { managedOllama?: ManagedOllamaOptions }): string;
  /** Framing and accumulation of a 2xx answer, bounded; decides no outcome. */
  read(response: Response): Promise<Folded>;
  /** Pure: stop map, usage, calls (offered names, unused ids) and provider state. */
  outcome(folded: Folded, check: { tools: readonly ToolSpec[]; usedIds: ReadonlySet<string> }): Completion;
  isOverflow(text: string): boolean;
  /** Milliseconds before retrying this refused answer; undefined = never. attempt is 0 for the first retry. */
  retryDelayMs?(response: Response, attempt: number): number | undefined;
}
