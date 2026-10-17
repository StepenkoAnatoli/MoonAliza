// Tests for the SmartRouter host adapter (route.mjs). Each test is named after the SmartRouter
// fixture it mirrors (tests/smart_router_decisions.py and references/gates.md at fbe7bca).
// Node built-ins only: node --test docs/orchestration/smartrouter/route.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADVISORY, CASH_UNCERTAINTY, RouterError, briefFingerprint, computeDecision, decide, dispatch,
  loadPolicy, rate, readLedger, recordOutcome, status, validateBrief
} from './route.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROUTE = join(HERE, 'route.mjs');
const POLICY_PATH = join(HERE, 'host-policy.json');
const POLICY_TEXT = readFileSync(POLICY_PATH, 'utf8');
const POLICY = JSON.parse(POLICY_TEXT);
const NOW = '2026-10-17T19:00:00Z';
const DEADLINE = '2026-10-18T06:00:00Z';
const OPUS = POLICY.profiles.find((x) => x.id === 'cc-opus-high');
const OPUS_TUPLE = `(${OPUS.id}, ${POLICY.harness.id}, anthropic, ${OPUS.model}, ${OPUS.effort}, ${OPUS.config})`;

function tmp() { return mkdtempSync(join(tmpdir(), 'sr-host-test-')); }

function checksFor(category) {
  return POLICY.categories[category].verification.map((name) => ({ command: `run ${name}`, expect: 'pass' }));
}

function req(over = {}) {
  const category = over.category ?? 'review';
  return {
    taskId: 't-1', objective: 'an objective', category, unit: 'unit-a', permittedEffects: ['docs/x.md'],
    sources: ['docs/src.md'], nonGoals: ['no push'], acceptanceChecks: checksFor(category), needsVision: false,
    dataClasses: ['repo-code'], projectStop: { redSuite: false, gateOff: false, researchGateFailing: false },
    previousResult: null, deadline: DEADLINE, now: NOW, ...over
  };
}

function policyWith(mutate) {
  const p = JSON.parse(POLICY_TEXT);
  mutate(p);
  const path = join(tmp(), 'host-policy.json');
  writeFileSync(path, JSON.stringify(p, null, 2));
  return path;
}

function cli(args) {
  const r = spawnSync(process.execPath, [ROUTE, ...args], { encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

function writeJson(obj) {
  const path = join(tmp(), 'in.json');
  writeFileSync(path, JSON.stringify(obj));
  return path;
}

function outcome(over = {}) {
  return {
    'task-id': 't-1', outcome: 'verification-failed',
    evidence: { checks: [{ command: 'node --test', 'exit-code': 1, 'output-ref': 'run-1.log' }], 'actual-spend': null, 'files-touched': ['docs/x.md'], notes: 'one failing check' },
    'original-brief-fingerprint': 'none', 'owner-profile': 'cc-opus-high', ...over
  };
}

const run = (r, opts = {}) => decide(r, { policyPath: POLICY_PATH, ...opts });

// ---------------------------------------------------------------------------------------------
// Gate 1 - permissions / privacy / workflow
// ---------------------------------------------------------------------------------------------
test('S03: local-only data denies every cloud profile at Gate 1 before anything else; route blocked', () => {
  const d = computeDecision(req({ dataClasses: ['repo-code', 'local-only'] }), loadPolicy(POLICY_PATH), []);
  assert.equal(d.route, 'blocked');
  for (const p of POLICY.profiles) {
    const c = d.candidates[p.id];
    assert.equal(c.eligible, false, p.id);
    assert.equal(c['first-failing-gate'], 1, p.id);
    assert.match(c.reason, /data class 'local-only' is forbidden/);
    // nothing past Gate 1 was evaluated (S17a/S17b: no Gate 2 reasons leak)
    assert.deepEqual(c.walkthrough.slice(1).map((g) => g.result), ['not-reached', 'not-reached', 'not-reached', 'not-reached']);
  }
});

test('S17a/S17b: unknown profile, unknown category, unknown data class, escaping path and unprovidable isolation deny at Gate 1', () => {
  const policy = loadPolicy(POLICY_PATH);
  const unknownProfile = computeDecision(req({ candidates: ['cc-ghost', 'cc-opus-high'] }), policy, []);
  assert.equal(unknownProfile.candidates['cc-ghost']['first-failing-gate'], 1);
  assert.match(unknownProfile.candidates['cc-ghost'].reason, /unknown profile 'cc-ghost' \(default deny\)/);
  assert.equal(unknownProfile.route, 'delegate');

  const unknownCategory = computeDecision(req({ category: 'review', acceptanceChecks: checksFor('review') }), policy, []);
  assert.equal(unknownCategory.route, 'delegate');
  const badCat = computeDecision({ ...req(), category: 'astrology' }, policy, []);
  assert.equal(badCat.route, 'blocked');
  assert.match(badCat.candidates['cc-opus-high'].reason, /unknown category 'astrology'/);

  const unknownClass = computeDecision(req({ dataClasses: ['customer-pii'] }), policy, []);
  assert.equal(unknownClass.route, 'blocked');
  assert.match(unknownClass.candidates['cc-opus-high'].reason, /data class 'customer-pii' not covered by authorization/);

  const escaping = computeDecision(req({ permittedEffects: ['../outside.txt'] }), policy, []);
  assert.equal(escaping.route, 'blocked');
  assert.match(escaping.candidates['cc-opus-high'].reason, /permitted effect '..\/outside.txt' is outside the repository/);

  const container = computeDecision(req({ requiredIsolation: 'ephemeral-container' }), policy, []);
  assert.equal(container.route, 'blocked');
  assert.match(container.candidates['cc-opus-high'].reason, /isolation ephemeral-container required; host provides at most worktree\+branch/);
});

test('S09: a project stop rule (red suite) blocks new work at Gate 1 and names the stop', () => {
  const d = computeDecision(req({ projectStop: { redSuite: true, gateOff: false, researchGateFailing: false } }), loadPolicy(POLICY_PATH), []);
  assert.equal(d.route, 'blocked');
  for (const p of POLICY.profiles) {
    assert.equal(d.candidates[p.id]['first-failing-gate'], 1);
    assert.match(d.candidates[p.id].reason, /^project stop: red suite/);
  }
  const g = computeDecision(req({ projectStop: { redSuite: false, gateOff: true, researchGateFailing: false } }), loadPolicy(POLICY_PATH), []);
  assert.match(g.candidates['cc-opus-high'].reason, /^project stop: GATE_OFF or --no-verify in use/);
});

// ---------------------------------------------------------------------------------------------
// Gate 2 - capabilities
// ---------------------------------------------------------------------------------------------
test('S04/S05: vision required and lacking is a Gate 2 reason; the expensive label does not cure it; tools are checked', () => {
  const policy = loadPolicy(POLICY_PATH);
  const d = computeDecision(req({ category: 'docs-mechanical', estimatedTokens: 50000, needsVision: true }), policy, []);
  const haiku = d.candidates['cc-haiku-low'];
  assert.equal(haiku['first-failing-gate'], 2);
  assert.match(haiku.reason, /vision required, cc-haiku-low lacks it/);
  // the expensive profile has vision but no declared qualification: still a Gate 2 reject, no fallback
  assert.equal(d.candidates['cc-fable-high']['first-failing-gate'], 2);
  assert.match(d.candidates['cc-fable-high'].reason, /cc-fable-high not qualified for docs-mechanical/);
  assert.equal(d.route, 'blocked');

  const noTools = loadPolicy(policyWith((p) => { p.profiles.find((x) => x.id === 'cc-opus-high').tools = false; }));
  const t = computeDecision(req(), noTools, []);
  assert.match(t.candidates['cc-opus-high'].reason, /required tools missing on cc-opus-high: bash, read/);
  const listed = loadPolicy(policyWith((p) => { p.profiles.find((x) => x.id === 'cc-opus-high').tools = ['bash']; }));
  assert.match(computeDecision(req(), listed, []).candidates['cc-opus-high'].reason, /required tools missing on cc-opus-high: read/);
});

test('fresh fingerprint: an unqualified or expired profile fails Gate 2 with "missing or stale capability fingerprint"', () => {
  const policy = loadPolicy(POLICY_PATH);
  const d = computeDecision(req({ candidates: ['cc-sonnet-high'] }), policy, []);
  assert.equal(d.candidates['cc-sonnet-high']['first-failing-gate'], 2);
  assert.match(d.candidates['cc-sonnet-high'].reason, /missing or stale capability fingerprint/);
  assert.equal(d.route, 'recommend-escalation'); // never dispatched on; a qualified profile outside the list is named
  assert.equal(d.escalation.profile, 'cc-opus-high');

  const expired = loadPolicy(policyWith((p) => { p.profiles.find((x) => x.id === 'cc-opus-high').expires = '2026-10-01'; }));
  const e = computeDecision(req({ candidates: ['cc-opus-high'] }), expired, []);
  assert.equal(e.candidates['cc-opus-high']['first-failing-gate'], 2);
  assert.match(e.candidates['cc-opus-high'].reason, /missing or stale capability fingerprint \(expired 2026-10-01\)/);

  // equality is expiry (gates.md B02a/B02b): expires on the day `now` starts
  const edge = loadPolicy(policyWith((p) => { p.profiles.find((x) => x.id === 'cc-opus-high').expires = '2026-10-17'; }));
  const eq = computeDecision(req({ candidates: ['cc-opus-high'], now: '2026-10-17T00:00:00Z' }), edge, []);
  assert.equal(eq.candidates['cc-opus-high']['first-failing-gate'], 2);
});

test('context headroom: estimated tokens must be strictly below headroom-tested', () => {
  const policy = loadPolicy(POLICY_PATH);
  const at = computeDecision(req({ category: 'docs-mechanical', estimatedTokens: 92000, allowDirect: false }), policy, []);
  assert.match(at.candidates['cc-haiku-low'].reason, /context: 92000 tokens not below headroom-tested 92000 on cc-haiku-low/);
  const below = computeDecision(req({ category: 'docs-mechanical', estimatedTokens: 91999, allowDirect: false }), policy, []);
  assert.equal(below.candidates['cc-haiku-low'].eligible, true);
});

// ---------------------------------------------------------------------------------------------
// Gate 3 - verification
// ---------------------------------------------------------------------------------------------
test('S10/S15c: a missing required verification check blocks at Gate 3 before start', () => {
  const policy = loadPolicy(POLICY_PATH);
  const checks = checksFor('build-core').filter((c) => !/refute-first review/.test(c.command));
  const d = computeDecision(req({ category: 'build-core', acceptanceChecks: checks }), policy, []);
  assert.equal(d.route, 'blocked');
  for (const id of ['cc-opus-high', 'cc-fable-xhigh']) {
    assert.equal(d.candidates[id]['first-failing-gate'], 3, id);
    assert.equal(d.candidates[id].reason, 'verification prerequisite missing: refute-first review (blocked before start)');
  }
  // names are matched case-insensitively against command or expect
  const upper = checksFor('build-core').map((c) => ({ command: c.command.toUpperCase(), expect: 'PASS' }));
  assert.equal(computeDecision(req({ category: 'build-core', acceptanceChecks: upper }), policy, []).route, 'delegate');
  // a required review with no review-qualified fresh profile is an unavailable check
  const noReviewer = loadPolicy(policyWith((p) => { for (const x of p.profiles) x['qualified-for'] = x['qualified-for'].filter((c) => c !== 'review'); }));
  const r = computeDecision(req({ category: 'build-core' }), noReviewer, []);
  assert.equal(r.route, 'blocked');
  assert.match(r.candidates['cc-opus-high'].reason, /verification prerequisite missing: no review-qualified profile with a fresh fingerprint for 'refute-first review'/);
});

// ---------------------------------------------------------------------------------------------
// Gate 4 - affordability
// ---------------------------------------------------------------------------------------------
function dispatchRecords(taskId, profileIds) {
  return profileIds.map((id, i) => {
    const p = POLICY.profiles.find((x) => x.id === id);
    const tuple = `(${p.id}, ${POLICY.harness.id}, anthropic, ${p.model}, ${p.effort}, ${p.config})`;
    return { 'task-id': taskId, seq: i + 1, kind: 'dispatch', ts: NOW, profile: tuple, counters: { 'calls-used': i + 1, 'calls-limit': 6, 'cash-spent': null, 'cash-cap': null, 'repairs-used': 0, 'repairs-allowed': 1 }, deadline: DEADLINE, 'brief-fingerprint': null, detail: 'x', 'outcome-ref': null };
  });
}
const FIVE = ['cc-fable-high', 'cc-opus-high', 'cc-haiku-low', 'cc-sonnet-high', 'cc-fable-xhigh'];

test('S08-shaped: exhausted call slots and deadline equality block at Gate 4; cash never blocks', () => {
  const policy = loadPolicy(POLICY_PATH);
  const full = computeDecision(req(), policy, dispatchRecords('t-1', [...FIVE, 'cc-opus-high']));
  assert.equal(full.route, 'blocked');
  assert.equal(full.candidates['cc-opus-high']['first-failing-gate'], 4);
  assert.match(full.candidates['cc-opus-high'].reason, /call slots exhausted: 6 used \+ 1 > 6 calls-per-task/);
  // five used: equality passes (used + 1 <= limit)
  const five = computeDecision(req(), policy, dispatchRecords('t-1', FIVE));
  assert.equal(five.route, 'delegate');
  assert.equal(five.candidates['cc-opus-high'].eligible, true);

  const eq = computeDecision(req({ now: DEADLINE }), policy, []);
  assert.equal(eq.route, 'blocked');
  assert.match(eq.candidates['cc-opus-high'].reason, /deadline expired: now 2026-10-18T06:00:00Z not strictly before 2026-10-18T06:00:00Z/);
  const justBefore = computeDecision(req({ now: '2026-10-18T05:59:59Z' }), policy, []);
  assert.equal(justBefore.route, 'delegate');

  // cash is estimate-only: a huge bound still routes, and the Uncertainty line says why
  const big = computeDecision(req({ category: 'build-core', estimatedTokens: 500000 }), policy, []);
  assert.equal(big.route, 'delegate');
  assert.ok(big['all-in-bound-usd'] > 15);
  assert.ok(big.uncertainty.includes(CASH_UNCERTAINTY));
  assert.equal(CASH_UNCERTAINTY, 'cash: estimate only, no host accounting (subscription); not a strict cap');

  // an unpriced model is an unknown bound: Gate 4 reject, not a silent zero
  const unpriced = loadPolicy(policyWith((p) => { delete p.prices[OPUS.model]; }));
  const u = computeDecision(req({ candidates: ['cc-opus-high'] }), unpriced, []);
  assert.ok(u.candidates['cc-opus-high'].reason.startsWith(`unknown price for ${OPUS.model}`), u.candidates['cc-opus-high'].reason);
});

test('deadline-per-task-hours caps the Brief deadline from the task start', () => {
  const d = computeDecision(req({ deadline: '2026-10-20T00:00:00Z' }), loadPolicy(POLICY_PATH), []);
  assert.equal(d.brief.allowance.deadline, '2026-10-18T07:00:00Z');
  assert.match(d.text, /capped by deadline-per-task-hours 12/);
});

test('R01-R03: a second same-profile repair is refused by dispatch (exit 3) and by Gate 4; a different profile is a fresh decision', () => {
  const trace = tmp();
  const fixReq = (over) => req({ taskId: 'r-1', category: 'fix', ...over });
  const first = run(fixReq(), { traceDir: trace });
  assert.equal(first.decision.profile, 'cc-opus-high');
  dispatch('r-1', 'cc-opus-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const prev = outcome({ 'task-id': 'r-1', 'original-brief-fingerprint': first.briefFingerprint });
  recordOutcome(prev, { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const second = run(fixReq({ previousResult: prev }), { traceDir: trace });
  assert.equal(second.decision.profile, 'cc-opus-high'); // first repair allowed
  const rep = dispatch('r-1', 'cc-opus-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  assert.equal(rep.counters['repairs-used'], 1);
  recordOutcome({ ...prev, 'original-brief-fingerprint': second.briefFingerprint }, { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const third = run(fixReq({ previousResult: prev }), { traceDir: trace });
  assert.equal(third.decision.candidates['cc-opus-high']['first-failing-gate'], 4);
  assert.match(third.decision.candidates['cc-opus-high'].reason, /same-profile repairs exhausted: 1 used \+ 1 > 1/);
  assert.equal(third.decision.profile, 'cc-fable-high'); // fresh decision on a different profile, not a repair
  const refused = cli(['dispatch', 'r-1', 'cc-opus-high', '--trace', trace, '--now', NOW, '--deviation', 'try anyway']);
  assert.equal(refused.code, 3);
  assert.match(refused.stderr, /same-profile repairs exhausted/);
  const fresh = dispatch('r-1', 'cc-fable-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  assert.equal(fresh.counters['repairs-used'], 1);
  assert.equal(fresh.counters['calls-used'], 3);
});

test('dispatch refuses without a decision, against a blocked decision, on an unrecorded profile switch, and before reconciling', () => {
  const trace = tmp();
  const none = cli(['dispatch', 'd-1', 'cc-opus-high', '--trace', trace, '--now', NOW]);
  assert.equal(none.code, 3);
  assert.match(none.stderr, /no decision recorded for task d-1/);
  run(req({ taskId: 'd-1', projectStop: { redSuite: true, gateOff: false, researchGateFailing: false } }), { traceDir: trace });
  const blocked = cli(['dispatch', 'd-1', 'cc-opus-high', '--trace', trace, '--now', NOW, '--deviation', 'x']);
  assert.equal(blocked.code, 3);
  assert.match(blocked.stderr, /latest decision for d-1 is blocked/);
  run(req({ taskId: 'd-1' }), { traceDir: trace });
  const switched = cli(['dispatch', 'd-1', 'cc-fable-high', '--trace', trace, '--now', NOW]);
  assert.equal(switched.code, 3);
  assert.match(switched.stderr, /decided cc-opus-high; dispatching cc-fable-high is a host deviation: pass --deviation/);
  const ok = cli(['dispatch', 'd-1', 'cc-opus-high', '--trace', trace, '--now', NOW]);
  assert.equal(ok.code, 0, ok.stderr);
  const again = cli(['dispatch', 'd-1', 'cc-opus-high', '--trace', trace, '--now', NOW]);
  assert.equal(again.code, 3);
  assert.match(again.stderr, /already dispatched/);
  const late = cli(['dispatch', 'd-1', 'cc-opus-high', '--trace', trace, '--now', DEADLINE]);
  assert.equal(late.code, 3);
  const unknown = cli(['dispatch', 'd-1', 'cc-ghost', '--trace', trace, '--now', NOW]);
  assert.equal(unknown.code, 2);
  // a recorded deviation is allowed and marked
  run(req({ taskId: 'd-2' }), { traceDir: trace });
  const dev = dispatch('d-2', 'cc-fable-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW, deviation: 'pre-adapter profile' });
  assert.equal(dev.deviation, true);
  assert.match(dev.detail, /^host deviation: pre-adapter profile; route said cc-opus-high/);
});

// ---------------------------------------------------------------------------------------------
// Gate 5 - economics
// ---------------------------------------------------------------------------------------------
test('S02/D01: economics picks the lowest all-in bound; direct wins small tasks, delegation wins above direct-max-tokens', () => {
  const policy = loadPolicy(POLICY_PATH);
  const tiny = computeDecision(req({ category: 'build-core', estimatedTokens: 15000 }), policy, []);
  assert.equal(tiny.route, 'direct');
  assert.equal(tiny.profile, 'cc-fable-xhigh');
  assert.equal(tiny['all-in-bound-usd'], 0.75);
  const above = computeDecision(req({ category: 'build-core', estimatedTokens: 15001 }), policy, []);
  assert.equal(above.route, 'delegate');
  assert.equal(above.candidates['cc-fable-xhigh'].reason, 'direct unsuitable: 15001 tokens > direct-max-tokens 15000');
  const noDirect = computeDecision(req({ category: 'build-core', estimatedTokens: 1000, allowDirect: false }), policy, []);
  assert.equal(noDirect.route, 'delegate');
  assert.equal(noDirect.candidates['cc-fable-xhigh'].reason, 'direct unsuitable: allowDirect is false');

  const core = computeDecision(req({ category: 'build-core' }), policy, []);
  assert.equal(core.route, 'delegate');
  assert.equal(core.profile, 'cc-opus-high');
  assert.equal(core['all-in-bound-usd'], 11.5); // 6.32 work + 4.18 review + 1.00 brief overhead
  const review = computeDecision(req({ category: 'review' }), policy, []);
  assert.equal(review.profile, 'cc-opus-high');
  assert.deepEqual(review['eligible-ordered'], ['cc-opus-high', 'cc-fable-high']);
  assert.equal(review.candidates['cc-fable-high']['all-in-bound-usd'], 11.45);
  assert.equal(review.candidates['cc-opus-high']['review-bound-usd'], 0);
  const docs = computeDecision(req({ category: 'docs-mechanical', estimatedTokens: 50000 }), policy, []);
  assert.equal(docs.route, 'delegate');
  assert.equal(docs.profile, 'cc-haiku-low');

  // ties: lower output rate, then alphabetical id
  const twin = loadPolicy(policyWith((p) => { p.profiles.push({ ...p.profiles.find((x) => x.id === 'cc-opus-high'), id: 'cc-aaa-opus' }); }));
  assert.equal(computeDecision(req(), twin, []).profile, 'cc-aaa-opus');
});

test('E01: when the only qualified profile is absent from candidates, recommend-escalation names it', () => {
  const d = computeDecision(req({ category: 'docs-mechanical', estimatedTokens: 50000, candidates: ['cc-fable-xhigh', 'cc-opus-high'] }), loadPolicy(POLICY_PATH), []);
  assert.equal(d.route, 'recommend-escalation');
  assert.equal(d.escalation.profile, 'cc-haiku-low');
  assert.match(d.text, /^Route: {13}recommend-escalation$/m);
  assert.match(d.text, /^Profile: {11}\(cc-haiku-low, /m);
  assert.equal(d.brief, null);
});

test('speculative only with the host opt-in and high uncertainty', () => {
  const policy = loadPolicy(POLICY_PATH);
  assert.equal(computeDecision(req({ uncertainty: 'high' }), policy, []).route, 'delegate');
  const s = computeDecision(req({ uncertainty: 'high', hostOptIns: { speculative: true } }), policy, []);
  assert.equal(s.route, 'speculative');
  assert.deepEqual(s['speculative-set'].candidates.map((c) => c.profile), ['cc-opus-high', 'cc-fable-high']);
  assert.equal(s['speculative-set']['shared-budget'].calls, 2);
  assert.equal(s['speculative-set']['winner-owns'], true);
  assert.equal(computeDecision(req({ hostOptIns: { speculative: true } }), policy, []).route, 'delegate');
});

// ---------------------------------------------------------------------------------------------
// Output, Brief and ledger
// ---------------------------------------------------------------------------------------------
test('S24: every output carries the Advisory line and the adapter never claims or records a dispatch', () => {
  assert.equal(ADVISORY, 'Advisory: recommendation only — no dispatch performed or claimed');
  const trace = tmp();
  const cases = [req({ taskId: 'a-1' }), req({ taskId: 'a-2', projectStop: { redSuite: true, gateOff: false, researchGateFailing: false } }),
    req({ taskId: 'a-3', estimatedTokens: 1000 }), req({ taskId: 'a-4', category: 'docs-mechanical', estimatedTokens: 50000, candidates: ['cc-opus-high'] })];
  const routes = [];
  for (const r of cases) {
    const out = cli(['decide', writeJson(r), '--trace', trace]);
    assert.equal(out.code, 0, out.stderr);
    assert.ok(out.stdout.includes(`\n${ADVISORY}\n`), out.stdout);
    assert.doesNotMatch(out.stdout, /dispatched to|dispatch performed(?! or claimed)/i);
    routes.push(/^Route: +(\S+)/m.exec(out.stdout)[1]);
  }
  assert.deepEqual(routes, ['delegate', 'blocked', 'direct', 'recommend-escalation']);
  assert.deepEqual(readLedger(trace).map((r) => r.kind), ['decision', 'decision', 'decision', 'decision']);
  const blocked = cli(['decide', writeJson(req({ taskId: 'a-5', dataClasses: ['secrets'] })), '--trace', trace]);
  assert.match(blocked.stdout, /^Profile: {11}none — blocked$/m);
  assert.match(blocked.stdout, /^Reservations: {6}unknown\/blocked$/m);
  // a nested opt-in cannot be honoured: this host cannot produce or enforce a NestedBrief (spec §14)
  const nested = computeDecision(req({ hostOptIns: { 'nested-allowed': true, 'max-nesting-depth': 1 } }), loadPolicy(POLICY_PATH), []);
  assert.match(nested.text, /^NestedAllowed: {5}no$/m);
  assert.ok(nested.uncertainty.some((u) => /nested-allowed opt-in refused/.test(u)));
});

test('decide prints the Required output format block, the Advisory line and the Brief for delegate; exit 2 on an invalid request', () => {
  const trace = tmp();
  const out = cli(['decide', writeJson(req({ taskId: 'o-1', unit: 'Host Adapter' })), '--trace', trace]);
  assert.equal(out.code, 0, out.stderr);
  const labels = out.stdout.split('\n').slice(0, 13).map((l) => l.split(':')[0]);
  assert.deepEqual(labels, ['Difficulty', 'Route', 'Profile', 'Isolation', 'IsolationReason', 'Owner', 'HumanGate', 'NestedAllowed', 'MaxNestingDepth', 'Reservations', 'Calls', 'Deadline', 'Uncertainty']);
  assert.ok(out.stdout.split('\n').includes(`Profile:           ${OPUS_TUPLE}`), out.stdout);
  const brief = JSON.parse(out.stdout.slice(out.stdout.indexOf('Brief:\n') + 7));
  assert.equal(brief['branch-hint'], 'build/host-adapter');
  assert.equal(brief.allowance['cash-basis'], 'estimate-only');
  assert.equal(brief.allowance.calls, 6);
  assert.equal(brief.ownership, 'worker');
  assert.equal(brief['nested-allowed'], false);
  assert.ok(existsSync(join(trace, 'decisions', 'o-1-1.json')));
  const bad = cli(['decide', writeJson({ ...req(), taskId: '../evil' }), '--trace', trace]);
  assert.equal(bad.code, 2);
  const missing = cli(['decide', writeJson({ taskId: 'x' }), '--trace', trace]);
  assert.equal(missing.code, 2);
  // a Brief whose allowance exceeds the remaining slots is refused by validation
  assert.throws(() => validateBrief({ ...brief, allowance: { ...brief.allowance, calls: 7 } }, { callsRemaining: 6, repairsAllowed: 1, now: NOW }), RouterError);
});

test('ledger: seq is monotonic per task, counters are task totals, fingerprints are canonical; bad outcomes and corrupt ledgers are refused', () => {
  const trace = tmp();
  const d1 = run(req({ taskId: 'l-1' }), { traceDir: trace });
  const d1b = run(req({ taskId: 'l-1' }), { traceDir: trace });
  assert.equal(d1.record.seq, 1);
  assert.equal(d1b.record.seq, 2); // a second decision continues, never restarts
  run(req({ taskId: 'l-2' }), { traceDir: trace });
  const disp = dispatch('l-1', 'cc-opus-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  assert.equal(disp.seq, 3);
  assert.equal(disp['brief-fingerprint'], d1b.briefFingerprint);
  const out = recordOutcome(outcome({ 'task-id': 'l-1', outcome: 'accepted', 'original-brief-fingerprint': d1b.briefFingerprint }), { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  assert.equal(out.seq, 4);
  assert.equal(out['outcome-ref'], 'l-1');
  assert.equal(out['dispatch-seq'], 3);
  assert.deepEqual(out.counters, { 'calls-used': 1, 'calls-limit': 6, 'cash-spent': null, 'cash-cap': null, 'repairs-used': 0, 'repairs-allowed': 1 });
  const ledger = readLedger(trace);
  assert.deepEqual(ledger.filter((r) => r['task-id'] === 'l-1').map((r) => [r.seq, r.kind]), [[1, 'decision'], [2, 'decision'], [3, 'dispatch'], [4, 'outcome']]);
  assert.equal(ledger.find((r) => r['task-id'] === 'l-2').seq, 1);

  const s = status('l-1', { traceDir: trace, policyPath: POLICY_PATH });
  assert.match(s.text, /calls: 1 \/ 6/);
  assert.match(s.text, /repairs: 0 \/ 1/);

  // fingerprint: stable for the same Brief (key order irrelevant), different for a changed objective
  assert.equal(d1.briefFingerprint, d1b.briefFingerprint);
  const reordered = Object.fromEntries(Object.entries(d1.brief).reverse());
  assert.equal(briefFingerprint(reordered), d1.briefFingerprint);
  assert.match(d1.briefFingerprint, /^[0-9a-f]{64}$/);
  assert.notEqual(run(req({ taskId: 'l-3', objective: 'another objective' }), { traceDir: trace }).briefFingerprint, d1.briefFingerprint);

  const unknownTask = cli(['outcome', writeJson(outcome({ 'task-id': 'nope' })), '--trace', trace, '--now', NOW]);
  assert.equal(unknownTask.code, 3);
  assert.match(unknownTask.stderr, /unknown task nope/);
  const noDispatch = cli(['outcome', writeJson(outcome({ 'task-id': 'l-2' })), '--trace', trace, '--now', NOW]);
  assert.equal(noDispatch.code, 3);
  assert.match(noDispatch.stderr, /no dispatch of cc-opus-high recorded for task l-2/);
  const wrongFp = cli(['outcome', writeJson(outcome({ 'task-id': 'l-1', 'original-brief-fingerprint': 'f'.repeat(64) })), '--trace', trace, '--now', NOW]);
  assert.equal(wrongFp.code, 3);
  const badEnum = cli(['outcome', writeJson(outcome({ 'task-id': 'l-1', outcome: 'great' })), '--trace', trace, '--now', NOW]);
  assert.equal(badEnum.code, 2);

  const before = readFileSync(join(trace, 'ledger.jsonl'), 'utf8');
  appendFileSync(join(trace, 'ledger.jsonl'), '{"task-id": "l-1", "seq": 5, broken\n');
  const corrupt = cli(['decide', writeJson(req({ taskId: 'l-1' })), '--trace', trace]);
  assert.equal(corrupt.code, 4);
  assert.match(corrupt.stderr, /ledger line \d+ is unparseable; refusing to read or append/);
  assert.equal(readFileSync(join(trace, 'ledger.jsonl'), 'utf8'), `${before}{"task-id": "l-1", "seq": 5, broken\n`);
});

test('determinism: the same request and ledger give a byte-identical decision file', () => {
  const a = tmp();
  const b = tmp();
  run(req({ taskId: 'det-1' }), { traceDir: a });
  run(req({ taskId: 'det-1' }), { traceDir: b });
  assert.equal(readFileSync(join(a, 'decisions', 'det-1-1.json'), 'utf8'), readFileSync(join(b, 'decisions', 'det-1-1.json'), 'utf8'));
  assert.equal(readFileSync(join(a, 'ledger.jsonl'), 'utf8'), readFileSync(join(b, 'ledger.jsonl'), 'utf8'));
});

// ---------------------------------------------------------------------------------------------
// Learning loop
// ---------------------------------------------------------------------------------------------
function cycle(trace, taskId, category, profile, value, deviation) {
  const d = run(req({ taskId, category }), { traceDir: trace });
  dispatch(taskId, profile, { traceDir: trace, policyPath: POLICY_PATH, now: NOW, deviation });
  recordOutcome(outcome({ 'task-id': taskId, outcome: value, 'owner-profile': profile, 'original-brief-fingerprint': d.briefFingerprint }), { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
}
const failedFix = (trace, taskId) => cycle(trace, taskId, 'fix', 'cc-opus-high', 'verification-failed');

test('learning: two verification-failed fixes propose demotion, change no policy, and the next decide names the proposal', () => {
  const trace = tmp();
  failedFix(trace, 'f-1');
  assert.equal(rate({ traceDir: trace, policyPath: POLICY_PATH, now: NOW }).proposals.length, 0);
  failedFix(trace, 'f-2');
  const r = rate({ traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  assert.deepEqual(r.proposals.map((p) => [p.kind, p.profile, p.category]), [['demote', 'cc-opus-high', 'fix']]);
  assert.match(r.text, /PROPOSAL demote cc-opus-high from fix: 2 consecutive verification-failed \(f-1, f-2\); not applied/);
  assert.equal(r.stats.stats['cc-opus-high'].fix['verification-failed'], 2);
  assert.equal(readFileSync(POLICY_PATH, 'utf8'), POLICY_TEXT);
  const next = run(req({ taskId: 'f-3', category: 'fix' }), { traceDir: trace });
  assert.equal(next.decision.profile, 'cc-opus-high'); // routed by the policy as it stands
  assert.ok(next.decision.uncertainty.some((u) => /pending proposal \(not applied\): demote cc-opus-high from fix/.test(u)));
  assert.match(next.text, /^Uncertainty: .*pending proposal \(not applied\): demote cc-opus-high from fix/m);
  rate({ traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const first = readFileSync(join(trace, 'qualification-stats.json'), 'utf8');
  const cliRate = cli(['rate', '--trace', trace, '--now', NOW]);
  assert.equal(cliRate.code, 0, cliRate.stderr);
  assert.equal(readFileSync(join(trace, 'qualification-stats.json'), 'utf8'), first);
  // an accepted outcome in between breaks "consecutive"
  const t2 = tmp();
  failedFix(t2, 'g-1');
  cycle(t2, 'g-2', 'fix', 'cc-opus-high', 'accepted');
  failedFix(t2, 'g-3');
  assert.equal(rate({ traceDir: t2, policyPath: POLICY_PATH, now: NOW }).proposals.length, 0);
});

test('learning: cost-overrun demotes, three accepted host deviations propose qualification, near expiry is flagged', () => {
  const trace = tmp();
  cycle(trace, 'c-1', 'review', 'cc-opus-high', 'cost-overrun');
  for (const id of ['q-1', 'q-2']) cycle(trace, id, 'build-core', 'cc-fable-high', 'accepted', 'lead chose the stronger reviewer profile');
  assert.ok(!rate({ traceDir: trace, policyPath: POLICY_PATH, now: NOW }).proposals.some((p) => p.kind === 'qualify'), 'two accepted outcomes are not enough');
  cycle(trace, 'q-3', 'build-core', 'cc-fable-high', 'accepted', 'lead chose the stronger reviewer profile');
  const r = rate({ traceDir: trace, policyPath: POLICY_PATH, now: '2027-01-05T00:00:00Z' });
  const kinds = r.proposals.map((p) => `${p.kind} ${p.profile} ${p.category}`);
  assert.ok(kinds.includes('demote cc-opus-high review'), kinds.join('|'));
  assert.ok(kinds.includes('qualify cc-fable-high build-core'), kinds.join('|'));
  assert.equal(r.stats.stats['cc-fable-high']['build-core'].deviations, 3);
  assert.ok(r.flags.some((f) => f.profile === 'cc-opus-high' && /expires 2027-01-15/.test(f.reason)));
  assert.equal(rate({ traceDir: trace, policyPath: POLICY_PATH, now: NOW }).flags.length, 0);
});

// ---------------------------------------------------------------------------------------------
// Golden: the lead's hand-walked decisions
// ---------------------------------------------------------------------------------------------
const goldenDir = join(HERE, 'trace', 'decisions');
for (const file of readdirSync(goldenDir).filter((f) => f.startsWith('hand-')).sort()) {
  test(`golden: ${file} is reproduced exactly`, () => {
    const golden = JSON.parse(readFileSync(join(goldenDir, file), 'utf8'));
    const got = run(golden.request, { traceDir: tmp() }).decision;
    const want = golden.decision;
    for (const k of ['route', 'profile', 'isolation', 'owner', 'human-gate', 'nested-allowed', 'max-nesting-depth', 'estimated-tokens', 'all-in-bound-usd', 'eligible-ordered', 'uncertainty', 'advisory']) {
      assert.deepEqual(got[k], want[k], k);
    }
    for (const [id, c] of Object.entries(want.candidates)) {
      assert.equal(got.candidates[id].eligible, c.eligible, id);
      if (c.eligible) {
        for (const k of ['kind', 'all-in-bound-usd', 'work-bound-usd', 'review-bound-usd']) assert.equal(got.candidates[id][k], c[k], `${id} ${k}`);
      } else {
        assert.equal(got.candidates[id]['first-failing-gate'], c['first-failing-gate'], id);
        assert.ok(got.candidates[id].reason.includes(c.reason), `${id}: "${got.candidates[id].reason}" lacks "${c.reason}"`);
      }
    }
  });
}

test('monotonic task clock: decide, dispatch and outcome refuse a `now` earlier than the task\'s latest ledger event', () => {
  const trace = tmp();
  const d = run(req({ taskId: 'm-1', now: '2026-10-17T20:00:00Z' }), { traceDir: trace });
  const early = cli(['decide', writeJson(req({ taskId: 'm-1', now: '2026-10-17T19:59:59Z' })), '--trace', trace]);
  assert.equal(early.code, 2);
  assert.match(early.stderr, /now 2026-10-17T19:59:59Z precedes the latest ledger event for m-1 \(2026-10-17T20:00:00Z\)/);
  const earlyDispatch = cli(['dispatch', 'm-1', 'cc-opus-high', '--trace', trace, '--now', '2026-10-17T19:00:00Z']);
  assert.equal(earlyDispatch.code, 2);
  dispatch('m-1', 'cc-opus-high', { traceDir: trace, policyPath: POLICY_PATH, now: '2026-10-17T20:00:00Z' });
  const earlyOutcome = cli(['outcome', writeJson(outcome({ 'task-id': 'm-1', 'original-brief-fingerprint': d.briefFingerprint })), '--trace', trace, '--now', '2026-10-17T19:00:00Z']);
  assert.equal(earlyOutcome.code, 2);
  assert.deepEqual(readLedger(trace).map((r) => r.kind), ['decision', 'dispatch']);
});

test('S08-shaped dispatch: with calls-per-task dispatches already recorded, dispatch refuses (exit 3) and writes nothing', () => {
  const trace = tmp();
  const ids = [...FIVE, 'cc-opus-high'];
  const recs = dispatchRecords('s-1', ids).map((r, i) => ({ ...r, counters: { ...r.counters, 'repairs-used': i === 5 ? 1 : 0 } }));
  const decided = { ...recs[1], seq: 7, kind: 'decision', counters: recs[5].counters, detail: 'route delegate (hand-walked)' };
  writeFileSync(join(trace, 'ledger.jsonl'), [...recs, decided].map((r) => JSON.stringify(r)).join('\n') + '\n');
  const before = readFileSync(join(trace, 'ledger.jsonl'), 'utf8');
  const out = cli(['dispatch', 's-1', 'cc-opus-high', '--trace', trace, '--now', NOW]);
  assert.equal(out.code, 3);
  assert.match(out.stderr, /call slots exhausted: 6 used \+ 1 > 6 calls-per-task/);
  assert.equal(readFileSync(join(trace, 'ledger.jsonl'), 'utf8'), before);
});

test('R01-R03 under a profile rename: the same model, effort and config under a new id is still the same profile', () => {
  const trace = tmp();
  const fixReq = (over) => req({ taskId: 'rn-1', category: 'fix', ...over });
  const first = run(fixReq(), { traceDir: trace });
  dispatch('rn-1', 'cc-opus-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const prev = outcome({ 'task-id': 'rn-1', 'original-brief-fingerprint': first.briefFingerprint });
  recordOutcome(prev, { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const second = run(fixReq({ previousResult: prev }), { traceDir: trace });
  dispatch('rn-1', 'cc-opus-high', { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  recordOutcome({ ...prev, 'original-brief-fingerprint': second.briefFingerprint }, { traceDir: trace, policyPath: POLICY_PATH, now: NOW });
  const renamed = policyWith((p) => { p.profiles.find((x) => x.id === 'cc-opus-high').id = 'cc-opus-renamed'; });
  const third = decide(fixReq({ previousResult: { ...prev, 'owner-profile': OPUS_TUPLE } }), { traceDir: trace, policyPath: renamed });
  assert.equal(third.decision.candidates['cc-opus-renamed']['first-failing-gate'], 4);
  assert.match(third.decision.candidates['cc-opus-renamed'].reason, /same-profile repairs exhausted/);
  const out = cli(['dispatch', 'rn-1', 'cc-opus-renamed', '--trace', trace, '--policy', renamed, '--now', NOW, '--deviation', 'rename']);
  assert.equal(out.code, 3);
  assert.match(out.stderr, /same-profile repairs exhausted/);
});
