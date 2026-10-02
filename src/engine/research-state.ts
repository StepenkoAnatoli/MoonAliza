import type { StoreResearch, StoreResearchActor, StoreResearchPatch, StoreResearchStatus } from './store';

/** States that hold a project's single research slot (the research_active index). */
export const ACTIVE_RESEARCH = ['queued', 'dispatching', 'collecting', 'reviewing', 'cancelling'] as const satisfies readonly StoreResearchStatus[];

interface Edge { actors: readonly StoreResearchActor[]; requires?: readonly (keyof StoreResearchPatch)[]; allows?: readonly (keyof StoreResearchPatch)[] }

/**
 * The only source of research transitions. `queued` is the sole source of `dispatching`, nothing returns to `queued`,
 * and no actor can reach `approved` in this schema. Review edges (collected -> reviewing -> approved | not_ready) arrive with Task 5.
 */
export const RESEARCH_EDGES: Readonly<Partial<Record<StoreResearchStatus, Partial<Record<StoreResearchStatus, Edge>>>>> = {
  queued: {
    dispatching: { actors: ['main'], requires: ['target'] },
    failed: { actors: ['main'], requires: ['failure'] },
    cancelled: { actors: ['user'] },
  },
  dispatching: {
    collecting: { actors: ['main'], requires: ['workflowRunId'] },
    failed: { actors: ['main', 'recovery'], requires: ['failure'], allows: ['workflowRunId'] },
    cancelling: { actors: ['user'] },
  },
  collecting: {
    collected: { actors: ['main'] },
    failed: { actors: ['main'], requires: ['failure'] },
    cancelling: { actors: ['user'] },
  },
  reviewing: { cancelling: { actors: ['user'] } },
  // A cancel can race the collector printing its run id; the id must still be recordable.
  cancelling: { cancelled: { actors: ['main', 'recovery'], allows: ['workflowRunId', 'failure'] } },
};

export function assertResearchEdge(existing: StoreResearch, to: StoreResearchStatus, actor: StoreResearchActor, patch: StoreResearchPatch): void {
  const edge = RESEARCH_EDGES[existing.status]?.[to];
  if (!edge || !edge.actors.includes(actor)) throw new Error('RESEARCH_TRANSITION_INVALID');
  const permitted = new Set([...(edge.requires ?? []), ...(edge.allows ?? [])]);
  for (const key of edge.requires ?? []) if (patch[key] === undefined) throw new Error('RESEARCH_TRANSITION_INVALID');
  for (const [key, value] of Object.entries(patch)) if (value === undefined || !permitted.has(key as keyof StoreResearchPatch)) throw new Error('RESEARCH_TRANSITION_INVALID');
  if (patch.workflowRunId !== undefined && existing.workflowRunId !== undefined) throw new Error('RESEARCH_TRANSITION_INVALID');
}
