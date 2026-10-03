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
    collected: { actors: ['main'], requires: ['verification'] },
    failed: { actors: ['main'], requires: ['failure'] },
    cancelling: { actors: ['user'] },
  },
  reviewing: { cancelling: { actors: ['user'] } },
  // A cancel can race the collector printing its run id; the id must still be recordable.
  cancelling: { cancelled: { actors: ['main', 'recovery'], allows: ['workflowRunId', 'failure'] } },
};

/** A workflow_dispatch ref may be given in full; the run and the package carry its short name (GITHUB_REF_NAME). */
export const shortResearchRef = (ref: string) => ref.replace(/^refs\/(?:heads|tags)\//, '');

export function assertResearchEdge(existing: StoreResearch, to: StoreResearchStatus, actor: StoreResearchActor, patch: StoreResearchPatch): void {
  const edge = RESEARCH_EDGES[existing.status]?.[to];
  if (!edge || !edge.actors.includes(actor)) throw new Error('RESEARCH_TRANSITION_INVALID');
  const permitted = new Set([...(edge.requires ?? []), ...(edge.allows ?? [])]);
  for (const key of edge.requires ?? []) if (patch[key] === undefined) throw new Error('RESEARCH_TRANSITION_INVALID');
  for (const [key, value] of Object.entries(patch)) if (value === undefined || !permitted.has(key as keyof StoreResearchPatch)) throw new Error('RESEARCH_TRANSITION_INVALID');
  if (patch.workflowRunId !== undefined && existing.workflowRunId !== undefined) throw new Error('RESEARCH_TRANSITION_INVALID');
  // A receipt is bound to the job revision it was validated at and to the admitted policy revision; any other is stale.
  // It must also name the job's own run, client ref and frozen target. The package's workflow is the kit's literal
  // collect.yml, not the target's workflow file, so it is not compared here.
  const verified = patch.verification;
  if (verified && (verified.jobRevision !== existing.revision || verified.projectRevision !== existing.policyRevision || verified.workflowRunId !== existing.workflowRunId
    || verified.clientRef !== existing.clientRef || existing.repository === undefined || verified.repository.toLowerCase() !== existing.repository.toLowerCase()
    || existing.ref === undefined || verified.ref !== shortResearchRef(existing.ref))) throw new Error('RESEARCH_TRANSITION_INVALID');
}
