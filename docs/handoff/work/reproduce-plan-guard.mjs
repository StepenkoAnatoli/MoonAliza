import { writeFile } from 'node:fs/promises';
// Reproduce only the published C1 example. This is not Rework implementation.
function compatibleWireState(state, profile) {
  return state.provider === profile.provider
    && state.profileRevision === profile.profileRevision
    && state.model === profile.model;
}
const state = { provider: 'openai', profileRevision: 1, model: 'shared-model-name',
  schemaVersion: 1, data: { continuation: 'synthetic-fixture' } };
const first = { id: 'profile-A', provider: 'openai', profileRevision: 1,
  model: 'shared-model-name', endpoint: 'https://provider-a.invalid/v1' };
const second = { id: 'profile-B', provider: 'openai', profileRevision: 1,
  model: 'shared-model-name', endpoint: 'https://provider-b.invalid/v1' };
const result = { source: 'REWORK FULL PLAN.txt, C1 lines 2033-2043',
  fixtureOnly: true, firstAccepted: compatibleWireState(state, first),
  differentProfileAndEndpointAccepted: compatibleWireState(state, second),
  conclusion: 'The example guard cannot distinguish these profiles. Production needs an identity binding.' };
if (!result.differentProfileAndEndpointAccepted) throw new Error('Reproduction did not match the plan');
await writeFile(new URL('checks/provider-identity-reproduction.json', import.meta.url), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
