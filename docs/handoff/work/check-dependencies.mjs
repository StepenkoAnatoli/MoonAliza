import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const base = new URL('./', import.meta.url);
await mkdir(new URL('checks/', base), { recursive: true });
const plan = await readFile('C:/Users/PC/Desktop/Rework/REWORK FULL PLAN.txt', 'utf8');
const block = plan.match(/```json\s*(\{\s*"dependencies"[\s\S]*?)```/);
if (!block) throw new Error('Dependency block not found');
const pins = JSON.parse(block[1]);
const entries = Object.entries({ ...pins.dependencies, ...pins.devDependencies });
const checks = [];
async function get(url, headers = {}) {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Rework-plan-review', ...headers },
      signal: AbortSignal.timeout(20000), redirect: 'error'
    });
    return { status: response.status, body: await response.text() };
  } catch { return { status: 'NETWORK_ERROR', body: '' }; }
}
for (let i = 0; i < entries.length; i += 6) {
  checks.push(...await Promise.all(entries.slice(i, i + 6).map(async ([name, version]) => {
    const url = `https://registry.npmjs.org/${encodeURIComponent(name)}/${version}`;
    const response = await get(url);
    let data = {};
    try { data = JSON.parse(response.body); } catch {}
    return { name, requestedVersion: version, url, status: response.status,
      exists: response.status === 200 && data.version === version,
      engines: data.engines ?? null, integrity: data.dist?.integrity ?? null };
  })));
}
const commit = 'e4a799f3fa07eb0c7377a1f350bae7cf987c5110';
const repo = 'StepenkoAnatoli/Research-Kit';
let githubToken;
async function github(path) {
  const url = `https://api.github.com/repos/${repo}/${path}`;
  const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10' };
  let response = await get(url, headers);
  let credentialUsed = false;
  if ([401, 403, 404].includes(response.status)) {
    const text = await readFile('C:/Users/PC/Desktop/FreeBuff/Github Token- 30 days- from 14.9.26.txt', 'utf8');
    const matches = [...new Set(text.match(/github_pat_[A-Za-z0-9_]+|gh[pousr]_[A-Za-z0-9_]+/g) ?? [])];
    if (matches.length !== 1) throw new Error('Expected one GitHub credential');
    githubToken = matches[0];
    response = await get(url, { ...headers, Authorization: `Bearer ${githubToken}` });
    credentialUsed = true;
  }
  let data = {};
  try { data = JSON.parse(response.body); } catch {}
  return { url, status: response.status, credentialUsed, data };
}
const tree = await github(`git/trees/${commit}?recursive=1`);
const relevant = (tree.data.tree ?? []).filter(x => /(^|\/)(LICENSE[^/]*|COPYING[^/]*|package\.json)$|research-kit\/(bin\/(artifact|preflight|handoff)\.mjs|lib\/artifact-validator\.mjs)$/.test(x.path));
const sourceResults = [];
for (const item of relevant.filter(x => /(^|\/)(LICENSE[^/]*|package\.json)$/.test(x.path)).slice(0, 8)) {
  const result = await github(`contents/${encodeURIComponent(item.path).replaceAll('%2F', '/')}?ref=${commit}`);
  let body = '';
  if (result.status === 200 && result.data.encoding === 'base64') {
    body = Buffer.from(result.data.content, 'base64').toString('utf8');
    await writeFile(new URL(`checks/kit-${item.path.replaceAll('/', '_')}.txt`, base), body);
  }
  sourceResults.push({ path: item.path, status: result.status, credentialUsed: result.credentialUsed,
    sha256: body ? createHash('sha256').update(body).digest('hex') : null });
}
const output = { checkedAt: new Date().toISOString(), sourcePlanSha256: createHash('sha256').update(plan).digest('hex'),
  packageCount: checks.length, pins: checks,
  researchKit: { commit, treeStatus: tree.status, credentialUsed: tree.credentialUsed,
    truncated: tree.data.truncated ?? null, relevantPaths: relevant.map(x => ({ path: x.path, sha: x.sha })), files: sourceResults } };
await writeFile(new URL('checks/dependency-audit.json', base), JSON.stringify(output, null, 2));
console.log(JSON.stringify({ packageCount: checks.length, verifiedPins: checks.filter(x => x.exists).length,
  unresolvedPins: checks.filter(x => !x.exists).map(x => ({ name: x.name, version: x.requestedVersion, status: x.status })),
  researchKit: output.researchKit }, null, 2));
