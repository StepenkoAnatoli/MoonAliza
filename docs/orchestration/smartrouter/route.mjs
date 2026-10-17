#!/usr/bin/env node
// SmartRouter host adapter for the MoonAliza build process.
//
// SmartRouter (StepenkoAnatoli/SmartRouter @ fbe7bca, skill 3.0.0) is advisory and stateless; this
// adapter is the host side: it collects the inputs from host-policy.json and the request, walks the
// five ordered gates for every candidate (references/gates.md, tests/smart_router_decisions.py
// run_gates/choose_route), prints the Required output format block plus the Brief (spec-v2 §10.1),
// and keeps the append-only Outcome Ledger (spec-v2 §10.5). It never dispatches anything itself.
//
// CLI:  decide <request.json> | dispatch <task-id> <profile-id> --project-stop <json> | outcome <outcome.json>
//       | status <task-id> | rate        options: --trace <dir> --policy <file> --now <iso> --deviation <reason>
// Exit: 0 done (any decided route, blocked included), 2 invalid input, 3 refused, 4 ledger integrity.
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_POLICY = join(HERE, 'host-policy.json');
export const DEFAULT_TRACE = join(HERE, 'trace');
export const CASH_UNCERTAINTY = 'cash: estimate only, no host accounting (subscription); not a strict cap';
export const ADVISORY_TEXT = 'recommendation only — no dispatch performed or claimed';
export const ADVISORY = `Advisory: ${ADVISORY_TEXT}`;
export const PROVIDER = 'anthropic';

const ISOLATION = ['none', 'directory', 'worktree+branch', 'ephemeral-container'];
const HUMAN_GATES = ['none', 'review-before-dispatch', 'review-before-merge', 'approval-required'];
const OUTCOMES = ['accepted', 'verification-failed', 'partial', 'cost-overrun', 'cancelled', 'blocked', 'escalated'];
const KINDS = ['decision', 'dispatch', 'outcome', 'spend', 'escalation'];
const TASK_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const FINGERPRINT = /^[0-9a-f]{64}$/;
const TUPLE = /^\([^,()]+(, [^,()]+){5}\)$/;
const EXPIRY_WARN_DAYS = 14;

export class RouterError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const invalid = (m) => new RouterError(2, m);
const refused = (m) => new RouterError(3, m);

// ---------------------------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------------------------
function sortKeys(v) {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
}
export function canonicalJson(v) { return JSON.stringify(sortKeys(v)); }
const sha256 = (s) => createHash('sha256').update(s).digest('hex');
export function briefFingerprint(brief) { return sha256(canonicalJson(brief)); }
const round4 = (x) => Math.round(x * 1e4) / 1e4;
const usd = (x) => `$${x.toFixed(2)}`;
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isStrArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isInt = (v, min = 0) => Number.isInteger(v) && v >= min;
// the project stop rules' state, from the request at decide and from the lead at dispatch (Gate 1)
const isProjectStop = (ps) => Boolean(ps) && typeof ps === 'object' && !Array.isArray(ps)
  && ['redSuite', 'gateOff', 'researchGateFailing'].every((k) => typeof ps[k] === 'boolean');
const PROJECT_STOP_USAGE = '--project-stop \'{"redSuite":false,"gateOff":false,"researchGateFailing":false}\'';

function isoMs(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(v)) return null;
  const ms = Date.parse(v);
  return Number.isNaN(ms) ? null : ms;
}
function dayMs(v) {
  if (typeof v !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return Date.parse(`${v}T00:00:00Z`);
  return isoMs(v);
}
const isoOf = (ms) => new Date(ms).toISOString().replace('.000Z', 'Z');
function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'unit';
}
function readJsonFile(path, what) {
  let text;
  try { text = readFileSync(path, 'utf8'); } catch (e) { throw invalid(`cannot read ${what} ${path}: ${e.message}`); }
  try { return JSON.parse(text); } catch (e) { throw invalid(`${what} ${path} is not JSON: ${e.message}`); }
}

// ---------------------------------------------------------------------------------------------
// policy
// ---------------------------------------------------------------------------------------------
export function loadPolicy(path = DEFAULT_POLICY) {
  const p = readJsonFile(path, 'policy');
  validatePolicy(p);
  return p;
}

function validatePolicy(p) {
  const fail = (m) => { throw invalid(`invalid policy: ${m}`); };
  if (!p || typeof p !== 'object') fail('not an object');
  if (!isStr(p.harness?.id)) fail('harness.id missing');
  const a = p.authorization;
  if (!a || !isStrArray(a['data-classes-permitted']) || !isStrArray(a['data-classes-forbidden']) || !isStrArray(a.destinations)) fail('authorization data classes or destinations missing');
  if (!isStrArray(a['project-stop-rules']) || a['project-stop-rules'].length < 3) fail('authorization.project-stop-rules needs the red-suite, gate-off and research-gate rules');
  if (!ISOLATION.includes(p.isolation?.capability)) fail('isolation.capability is not on the lattice');
  const s = p.accounting?.strict;
  if (!s || !isInt(s['calls-per-task'], 1) || !isInt(s['same-profile-repairs-per-task']) || !(s['deadline-per-task-hours'] > 0)) fail('accounting.strict incomplete');
  if (!p.prices || typeof p.prices !== 'object') fail('prices missing');
  if (!p.categories || typeof p.categories !== 'object') fail('categories missing');
  for (const [id, c] of Object.entries(p.categories)) {
    if (!isStrArray(c.verification) || !isStrArray(c['required-tools']) || !isInt(c['median-tokens'], 1) || !isStr(c.risk)) fail(`category ${id} incomplete`);
  }
  if (!Array.isArray(p.profiles) || p.profiles.length === 0) fail('profiles missing');
  const ids = new Set();
  for (const pr of p.profiles) {
    if (!isStr(pr.id) || !isStr(pr.model) || !isStr(pr.effort) || !isStr(pr.config) || !isStrArray(pr['qualified-for'])) fail(`profile ${pr.id} incomplete`);
    if (ids.has(pr.id)) fail(`duplicate profile ${pr.id}`);
    ids.add(pr.id);
  }
  const e = p.economics;
  if (!e || !ids.has(e['lead-direct-profile']) || !isInt(e['direct-max-tokens']) || !isInt(e['delegate-overhead-tokens'])) fail('economics incomplete');
  const lead = p.profiles.find((x) => x.id === e['lead-direct-profile']);
  if (!(p.prices[lead.model]?.output_rate_per_mtok >= 0)) fail('the lead-direct profile has no price; brief overhead cannot be bounded');
}

function profileTuple(policy, pr) {
  return `(${pr.id}, ${policy.harness.id}, ${PROVIDER}, ${pr.model}, ${pr.effort}, ${pr.config})`;
}
// same-profile identity for repairs: the tuple without the host id, so a renamed profile with the same
// harness, provider, model, effort and config is still the same profile (spec-v2 §11.9, brief-and-result.md)
function sameKey(tuple) {
  return typeof tuple === 'string' ? tuple.replace(/^\([^,]+, /, '(') : null;
}
function tupleId(tuple) {
  if (typeof tuple !== 'string') return null;
  const m = /^\(([^,]+),/.exec(tuple);
  return m ? m[1].trim() : tuple;
}
const outRate = (policy, pr) => {
  const r = policy.prices[pr.model]?.output_rate_per_mtok;
  return typeof r === 'number' && r >= 0 ? r : null;
};
function optInsOf(policy, override) {
  const o = { ...policy['host-opt-ins'], ...(override ?? {}) };
  if (typeof o.speculative !== 'boolean') throw invalid('host opt-in speculative must be boolean');
  if (typeof o['nested-allowed'] !== 'boolean') throw invalid('host opt-in nested-allowed must be boolean');
  if (![0, 1, 2].includes(o['max-nesting-depth'])) throw invalid('host opt-in max-nesting-depth must be 0, 1 or 2');
  if (!HUMAN_GATES.includes(o['human-gate'])) throw invalid(`host opt-in human-gate must be one of ${HUMAN_GATES.join(', ')}`);
  return o;
}

// ---------------------------------------------------------------------------------------------
// validation of §10 objects and of the request
// ---------------------------------------------------------------------------------------------
export function validateOutcome(o) {
  const fail = (m) => { throw invalid(`invalid Outcome (spec-v2 §10.3): ${m}`); };
  if (!o || typeof o !== 'object' || Array.isArray(o)) fail('not an object');
  if (!isStr(o['task-id']) || !TASK_ID.test(o['task-id'])) fail('task-id');
  if (!OUTCOMES.includes(o.outcome)) fail(`outcome must be one of ${OUTCOMES.join(' | ')}`);
  const ev = o.evidence;
  if (!ev || typeof ev !== 'object') fail('evidence');
  if (!Array.isArray(ev.checks) || !ev.checks.every((c) => c && typeof c.command === 'string' && Number.isInteger(c['exit-code']) && typeof c['output-ref'] === 'string')) fail('evidence.checks');
  // estimate-only host: actual spend is unknown, so null is the honest value (decision-trace.md §1)
  if (!(ev['actual-spend'] === null || (typeof ev['actual-spend'] === 'number' && ev['actual-spend'] >= 0))) fail('evidence.actual-spend');
  if (!isStrArray(ev['files-touched'])) fail('evidence.files-touched');
  if (typeof ev.notes !== 'string') fail('evidence.notes');
  if (typeof o['original-brief-fingerprint'] !== 'string') fail('original-brief-fingerprint');
  if (!isStr(o['owner-profile'])) fail('owner-profile');
  return o;
}

export function validateBrief(b, { callsRemaining, repairsAllowed, now }) {
  const fail = (m) => { throw new RouterError(2, `refusing to emit an invalid Brief (spec-v2 §10.1, §14): ${m}`); };
  if (!isStr(b.objective)) fail('objective');
  if (!Array.isArray(b.acceptance?.checks) || b.acceptance.checks.length === 0 || !b.acceptance.checks.every((c) => isStr(c.command) && isStr(c.expect))) fail('acceptance.checks');
  for (const k of ['sources', 'permitted-effects', 'non-goals', 'stop-triggers']) if (!isStrArray(b[k])) fail(k);
  if (!ISOLATION.includes(b.isolation)) fail('isolation');
  if (!isStr(b['branch-hint'])) fail('branch-hint');
  const al = b.allowance;
  if (!al || typeof al.cash !== 'number' || al.cash < 0) fail('allowance.cash');
  if (!isInt(al.calls, 1) || al.calls > callsRemaining) fail(`allowance.calls ${al?.calls} exceeds the ${callsRemaining} remaining call slots`);
  const dl = isoMs(al.deadline);
  if (dl === null || !(Date.parse(now) < dl)) fail('allowance.deadline');
  if (!isInt(b.attempts) || b.attempts > repairsAllowed) fail('attempts');
  if (b.ownership !== 'worker') fail('ownership');
  if (b['nested-allowed'] !== false) fail('nested-allowed: this host cannot produce or enforce a NestedBrief');
  if (b['max-nesting-depth'] !== 1) fail('max-nesting-depth');
  return b;
}

function validateSpeculativeSet(s, { callsRemaining }) {
  const fail = (m) => { throw new RouterError(2, `refusing to emit an invalid SpeculativeSet (spec-v2 §10.2): ${m}`); };
  if (!Array.isArray(s.candidates) || s.candidates.length < 2 || !s.candidates.every((c) => isStr(c.profile) && typeof c.weight === 'number')) fail('candidates');
  if (!isInt(s['max-parallel'], 2) || s['max-parallel'] > s.candidates.length) fail('max-parallel');
  if (typeof s['shared-budget']?.cash !== 'number' || !isInt(s['shared-budget'].calls, 2) || s['shared-budget'].calls > callsRemaining) fail('shared-budget');
  if (!['first-success', 'budget-exhausted', 'all-fail'].includes(s['cancel-policy'])) fail('cancel-policy');
  if (s['winner-owns'] !== true) fail('winner-owns');
  return s;
}

function validateLedgerRecord(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return 'not an object';
  if (!isStr(r['task-id'])) return 'task-id';
  if (!isInt(r.seq, 1)) return 'seq';
  if (!KINDS.includes(r.kind)) return 'kind';
  if (isoMs(r.ts) === null) return 'ts';
  if (!(r.profile === null || isStr(r.profile))) return 'profile';
  const c = r.counters;
  if (!c || !isInt(c['calls-used']) || !isInt(c['calls-limit']) || c['calls-used'] > c['calls-limit']) return 'counters.calls';
  if (!isInt(c['repairs-used']) || !isInt(c['repairs-allowed']) || c['repairs-used'] > c['repairs-allowed']) return 'counters.repairs';
  for (const k of ['cash-spent', 'cash-cap']) if (!(c[k] === null || typeof c[k] === 'number')) return `counters.${k}`;
  if (!(r.deadline === null || isoMs(r.deadline) !== null)) return 'deadline';
  if (!(r['brief-fingerprint'] === null || FINGERPRINT.test(r['brief-fingerprint']))) return 'brief-fingerprint';
  if (typeof r.detail !== 'string') return 'detail';
  if (!(r['outcome-ref'] === null || isStr(r['outcome-ref']))) return 'outcome-ref';
  return null;
}

function validateRequest(r, policy) {
  const fail = (m) => { throw invalid(`invalid request: ${m}`); };
  if (!r || typeof r !== 'object' || Array.isArray(r)) fail('not an object');
  if (!isStr(r.taskId) || !TASK_ID.test(r.taskId)) fail('taskId must match [A-Za-z0-9][A-Za-z0-9._-]*');
  for (const k of ['objective', 'category', 'unit']) if (!isStr(r[k])) fail(k);
  for (const k of ['permittedEffects', 'sources', 'nonGoals', 'dataClasses']) if (!isStrArray(r[k])) fail(`${k} must be an array of strings`);
  // Gate 1 is default-deny and a read-only call still transmits prompt bytes (gates.md Gate 1): every dispatch
  // sends at least the objective and sources, so a request that declares no data has nothing Gate 1 can permit
  if (r.dataClasses.length === 0) fail('declare at least one data class');
  if (!Array.isArray(r.acceptanceChecks) || !r.acceptanceChecks.every((c) => c && isStr(c.command) && isStr(c.expect))) fail('acceptanceChecks must be [{command, expect}]');
  if (r.estimatedTokens !== undefined && !isInt(r.estimatedTokens, 1)) fail('estimatedTokens');
  if (r.requiredTools !== undefined && !isStrArray(r.requiredTools)) fail('requiredTools');
  if (typeof r.needsVision !== 'boolean') fail('needsVision must be boolean');
  const ps = r.projectStop;
  if (!isProjectStop(ps)) fail('projectStop needs boolean redSuite, gateOff, researchGateFailing');
  if (r.previousResult !== null && r.previousResult !== undefined) {
    validateOutcome(r.previousResult);
    if (r.previousResult['task-id'] !== r.taskId) fail('previousResult.task-id differs from taskId');
    const owner = r.previousResult['owner-profile'];
    if (!TUPLE.test(owner) && !policy.profiles.some((p) => p.id === owner)) fail('previousResult.owner-profile is neither a policy profile id nor an identity tuple');
  }
  if (isoMs(r.deadline) === null) fail('deadline must be ISO-8601');
  if (isoMs(r.now) === null) fail('now must be ISO-8601');
  if (r.candidates !== undefined && (!isStrArray(r.candidates) || r.candidates.length === 0 || new Set(r.candidates).size !== r.candidates.length)) fail('candidates must be a non-empty list of distinct ids');
  if (r.allowDirect !== undefined && typeof r.allowDirect !== 'boolean') fail('allowDirect');
  if (r.hostOptIns !== undefined && (typeof r.hostOptIns !== 'object' || r.hostOptIns === null)) fail('hostOptIns');
  if (r.uncertainty !== undefined && typeof r.uncertainty !== 'string') fail('uncertainty');
  if (r.requiredIsolation !== undefined && !ISOLATION.includes(r.requiredIsolation)) fail('requiredIsolation');
}

// ---------------------------------------------------------------------------------------------
// ledger
// ---------------------------------------------------------------------------------------------
const ledgerPath = (traceDir) => join(traceDir, 'ledger.jsonl');

export function readLedger(traceDir = DEFAULT_TRACE) {
  const path = ledgerPath(traceDir);
  if (!existsSync(path)) return [];
  const text = readFileSync(path, 'utf8');
  // an append onto an unterminated last line would itself write an unparseable line, repairable only by a rewrite
  if (text.length && !text.endsWith('\n')) throw new RouterError(4, `ledger does not end with a newline (last line unterminated, probably hand-written); refusing to read or append (${path}); the lead terminates the last line, which changes no record`);
  const lines = text.split('\n');
  lines.pop();
  const lastSeq = new Map();
  return lines.map((line, i) => {
    let rec;
    try { rec = JSON.parse(line); } catch { throw new RouterError(4, `ledger line ${i + 1} is unparseable; refusing to read or append (${path})`); }
    const why = validateLedgerRecord(rec);
    if (why) throw new RouterError(4, `ledger line ${i + 1} is not a §10.5 LedgerRecord (${why}); refusing to read or append`);
    const prev = lastSeq.get(rec['task-id']) ?? 0;
    if (rec.seq !== prev + 1) throw new RouterError(4, `ledger line ${i + 1}: seq ${rec.seq} for ${rec['task-id']} does not follow ${prev}; refusing to read or append`);
    lastSeq.set(rec['task-id'], rec.seq);
    return rec;
  });
}

function appendRecord(traceDir, rec) {
  const why = validateLedgerRecord(rec);
  if (why) throw new RouterError(2, `refusing to append an invalid LedgerRecord (${why})`);
  mkdirSync(traceDir, { recursive: true });
  appendFileSync(ledgerPath(traceDir), `${JSON.stringify(rec)}\n`);
  return rec;
}

const isDeviation = (r) => r.deviation === true || /^host deviation/.test(r.detail);

function taskState(records, taskId, policy) {
  const recs = records.filter((r) => r['task-id'] === taskId);
  const strict = policy.accounting.strict;
  const st = {
    records: recs, lastSeq: recs.length ? recs[recs.length - 1].seq : 0, callsUsed: 0, repairsUsed: 0,
    callsLimit: strict['calls-per-task'], repairsAllowed: strict['same-profile-repairs-per-task'],
    dispatched: new Map(), dispatchedKeys: new Map(), startMs: null, latestMs: null, latestTs: null, lastDecision: null, lastOutcomeSeq: 0, fingerprints: new Set()
  };
  for (const r of recs) {
    const ms = isoMs(r.ts);
    if (st.startMs === null || ms < st.startMs) st.startMs = ms;
    if (st.latestMs === null || ms > st.latestMs) { st.latestMs = ms; st.latestTs = r.ts; }
    if (r['brief-fingerprint']) st.fingerprints.add(r['brief-fingerprint']);
    if (r.kind === 'decision') st.lastDecision = r;
    if (r.kind === 'outcome') st.lastOutcomeSeq = r.seq;
    if (r.kind === 'dispatch') {
      st.callsUsed += 1;
      const key = sameKey(r.profile);
      if (st.dispatchedKeys.has(key)) st.repairsUsed += 1;
      st.dispatchedKeys.set(key, r);
      st.dispatched.set(tupleId(r.profile), r);
    }
  }
  return st;
}

// the task clock is monotonic (decision-trace.md §1): a stale `now` could otherwise dodge deadline expiry
function assertClock(st, now, taskId) {
  if (st.latestMs !== null && isoMs(now) < st.latestMs) throw invalid(`now ${now} precedes the latest ledger event for ${taskId} (${st.latestTs}); the task clock is monotonic`);
}

function counters(st, calls = st.callsUsed, repairs = st.repairsUsed) {
  return { 'calls-used': calls, 'calls-limit': st.callsLimit, 'cash-spent': null, 'cash-cap': null, 'repairs-used': repairs, 'repairs-allowed': st.repairsAllowed };
}

function categoryMap(traceDir) {
  const dir = join(traceDir, 'decisions');
  const map = {};
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    let j;
    try { j = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch { throw new RouterError(4, `decision file ${f} is unparseable`); }
    if (isStr(j?.request?.taskId) && isStr(j.request.category)) map[j.request.taskId] = j.request.category;
  }
  return map;
}

// ---------------------------------------------------------------------------------------------
// learning: outcome statistics and proposals (never applied; the lead edits host-policy.json)
// ---------------------------------------------------------------------------------------------
function outcomeValue(r) {
  const m = /^outcome ([a-z-]+)/.exec(r.detail);
  return m && OUTCOMES.includes(m[1]) ? m[1] : null;
}

// one outcome per dispatch: a later outcome for the same (task, dispatch seq) supersedes the earlier one
// (spec-v2 §10.5, decision-trace.md §4), so streams count dispatches, not records
function latestOutcomes(records) {
  const latest = new Map();
  for (const r of records) {
    if (r.kind !== 'outcome') continue;
    const key = `${r['task-id']}#${isInt(r['dispatch-seq'], 1) ? r['dispatch-seq'] : `record-${r.seq}`}`;
    latest.delete(key); // re-inserted at the superseding record's place in ledger order
    latest.set(key, r);
  }
  return [...latest.values()];
}

function learn(policy, records, catMap) {
  const stats = {};
  const streams = {};
  const dispatchBySeq = new Map(records.filter((r) => r.kind === 'dispatch').map((r) => [`${r['task-id']}#${r.seq}`, r]));
  for (const r of latestOutcomes(records)) {
    const value = outcomeValue(r);
    const pid = tupleId(r.profile);
    if (!value || !pid) continue;
    const cat = catMap[r['task-id']] ?? 'unknown';
    stats[pid] ??= {};
    stats[pid][cat] ??= { ...Object.fromEntries(OUTCOMES.map((o) => [o, 0])), deviations: 0 };
    const s = stats[pid][cat];
    s[value] += 1;
    const d = dispatchBySeq.get(`${r['task-id']}#${r['dispatch-seq']}`);
    if (d && isDeviation(d)) s.deviations += 1;
    streams[pid] ??= {};
    streams[pid][cat] ??= [];
    streams[pid][cat].push({ value, task: r['task-id'], ms: isoMs(r.ts) });
  }
  const proposals = [];
  for (const pid of Object.keys(streams).sort()) {
    const pr = policy.profiles.find((p) => p.id === pid);
    if (!pr) continue;
    for (const cat of Object.keys(streams[pid]).sort()) {
      if (cat === 'unknown') continue;
      const qualified = pr['qualified-for'].includes(cat);
      const since = dayMs(pr['qualified-at']);
      const list = streams[pid][cat].filter((o) => since === null || o.ms >= since);
      if (qualified) {
        let run = [];
        let hit = null;
        for (const o of list) {
          run = o.value === 'verification-failed' ? [...run, o.task] : [];
          if (run.length >= 2 && !hit) hit = run.slice(-2);
        }
        const overrun = list.filter((o) => o.value === 'cost-overrun').map((o) => o.task);
        if (hit) proposals.push({ kind: 'demote', profile: pid, category: cat, reason: `2 consecutive verification-failed (${hit.join(', ')})` });
        else if (overrun.length) proposals.push({ kind: 'demote', profile: pid, category: cat, reason: `cost-overrun (${overrun.join(', ')})` });
      } else {
        const acc = list.filter((o) => o.value === 'accepted').map((o) => o.task);
        if (acc.length >= 3) proposals.push({ kind: 'qualify', profile: pid, category: cat, reason: `${acc.length} accepted while unqualified (host deviations: ${acc.join(', ')})` });
      }
    }
  }
  return { stats, proposals };
}

function expiryFlags(policy, nowMs) {
  const flags = [];
  for (const pr of policy.profiles) {
    const ex = dayMs(pr.expires);
    if (ex === null) continue;
    if (ex - nowMs <= EXPIRY_WARN_DAYS * 86400000) flags.push({ kind: 'expiry', profile: pr.id, reason: `qualification expires ${pr.expires} (within ${EXPIRY_WARN_DAYS} days of ${isoOf(nowMs)}); re-qualify with fresh evidence` });
  }
  return flags;
}

function proposalText(p) {
  const head = p.kind === 'demote' ? `demote ${p.profile} from ${p.category}` : p.kind === 'qualify' ? `qualify ${p.profile} for ${p.category}` : `re-qualify ${p.profile}`;
  return `${head}: ${p.reason}`;
}

// ---------------------------------------------------------------------------------------------
// the five gates
// ---------------------------------------------------------------------------------------------
function requiredIsolation(ctx, kind) {
  if (ctx.req.requiredIsolation) return ctx.req.requiredIsolation;
  return kind === 'direct' && ctx.category?.risk === 'low' ? 'none' : 'worktree+branch';
}

function gate1(ctx, pr, id, kind) {
  const a = ctx.policy.authorization;
  for (const c of ctx.req.dataClasses) {
    if (a['data-classes-forbidden'].includes(c)) return `data class '${c}' is forbidden (${a['data-classes-forbidden'].join(', ')}); denied before any transmission to ${PROVIDER}`;
  }
  for (const c of ctx.req.dataClasses) {
    if (!a['data-classes-permitted'].includes(c)) return `data class '${c}' not covered by authorization (default deny)`;
  }
  if (!pr) return `unknown profile '${id}' (default deny)`;
  if (!ctx.category) return `unknown category '${ctx.req.category}' (default deny)`;
  if (!a.destinations.some((d) => d.split(/\s/)[0] === PROVIDER)) return `destination ${PROVIDER} not covered by authorization`;
  for (const p of ctx.req.permittedEffects) {
    if (!isStr(p) || p.startsWith('/') || /^[A-Za-z]:/.test(p) || p.split(/[\\/]/).includes('..')) return `permitted effect '${p}' is outside the repository (unknown path, default deny)`;
  }
  const rules = a['project-stop-rules'];
  const stop = ctx.req.projectStop;
  if (stop.redSuite) return `project stop: ${rules[0]}`;
  if (stop.gateOff) return `project stop: ${rules[1]}`;
  if (stop.researchGateFailing) return `project stop: ${rules[2]}`;
  const need = requiredIsolation(ctx, kind);
  const cap = ctx.policy.isolation.capability;
  if (ISOLATION.indexOf(need) > ISOLATION.indexOf(cap)) return `isolation ${need} required; host provides at most ${cap}`;
  return null;
}

function fingerprintProblem(nowMs, pr) {
  if (!pr['qualified-at'] || !pr.expires) return `missing or stale capability fingerprint (${!pr['qualified-at'] ? 'qualified-at null' : 'expires null'})`;
  const ex = dayMs(pr.expires);
  if (ex === null || nowMs >= ex) return `missing or stale capability fingerprint (expired ${pr.expires})`;
  return null;
}

// the capability walk for one role: the work itself, or the required review (category 'review', its median, its tools)
function capabilities(ctx, pr, id, { category, tokens, tools }) {
  // collect every capability reason, then fail once (run_gates in the fixture runner)
  const reasons = [];
  const fp = fingerprintProblem(ctx.nowMs, pr);
  if (fp) reasons.push(fp);
  if (!pr['qualified-for'].includes(category)) reasons.push(`${id} not qualified for ${category}`);
  const missing = pr.tools === true ? [] : Array.isArray(pr.tools) ? tools.filter((t) => !pr.tools.includes(t)) : tools;
  if (missing.length) reasons.push(`required tools missing on ${id}: ${missing.join(', ')}`);
  if (ctx.req.needsVision && pr.vision !== true) reasons.push(`vision required, ${id} lacks it`);
  const h = pr['headroom-tested'];
  if (!isInt(h, 1)) reasons.push(`context headroom untested on ${id}`);
  else if (!(tokens < h)) reasons.push(`context: ${tokens} tokens not below headroom-tested ${h} on ${id}`);
  return reasons.length ? reasons.join('; ') : null;
}

function gate2(ctx, pr, id) {
  return capabilities(ctx, pr, id, { category: ctx.req.category, tokens: ctx.tokens, tools: ctx.requiredTools });
}

function gate3(ctx) {
  const checks = ctx.req.acceptanceChecks;
  const has = (name) => checks.some((c) => c.command.toLowerCase().includes(name.toLowerCase()) || c.expect.toLowerCase().includes(name.toLowerCase()));
  const missing = ctx.category.verification.filter((n) => !has(n));
  if (missing.length) return `verification prerequisite missing: ${missing.join(', ')} (blocked before start)`;
  if (ctx.reviewName && !ctx.reviewer) {
    const why = Object.entries(ctx.reviewWalk).map(([rid, r]) => `${rid}: ${r}`).join('; ') || 'no candidate other than the lead';
    return `verification prerequisite missing: no candidate passes Gates 1-2 as reviewer for '${ctx.reviewName}' (${why}) (blocked before start)`;
  }
  return null;
}

function bounds(ctx, pr, kind) {
  const rate = outRate(ctx.policy, pr);
  if (rate === null) return null;
  const work = (ctx.tokens * rate) / 1e6;
  if (kind === 'direct') return { work, review: 0, overhead: 0, allIn: work, rate };
  const review = ctx.reviewer ? ctx.reviewer.bound : 0;
  const overhead = (ctx.policy.economics['delegate-overhead-tokens'] * ctx.leadRate) / 1e6;
  return { work, review, overhead, allIn: work + review + overhead, rate };
}

function isRepair(ctx, pr) {
  const key = sameKey(profileTuple(ctx.policy, pr));
  const owner = ctx.req.previousResult?.['owner-profile'];
  const ownerPr = owner && ctx.policy.profiles.find((p) => p.id === owner);
  const ownerKey = owner ? (TUPLE.test(owner) ? sameKey(owner) : ownerPr ? sameKey(profileTuple(ctx.policy, ownerPr)) : null) : null;
  return ownerKey === key || ctx.st.dispatchedKeys.has(key);
}

function gate4(ctx, pr, id, kind, out) {
  const st = ctx.st;
  if (!(st.callsUsed + 1 <= st.callsLimit)) return `call slots exhausted: ${st.callsUsed} used + 1 > ${st.callsLimit} calls-per-task`;
  if (isRepair(ctx, pr) && !(st.repairsUsed + 1 <= st.repairsAllowed)) return `same-profile repairs exhausted: ${st.repairsUsed} used + 1 > ${st.repairsAllowed} allowed (R01-R03); a different profile needs a fresh decision`;
  if (!(ctx.nowMs < ctx.deadlineMs)) return `deadline expired: now ${ctx.req.now} not strictly before ${ctx.deadlineIso}`;
  const b = bounds(ctx, pr, kind);
  if (!b) return `unknown price for ${pr.model}: the bound cannot be computed (no silent zero)`;
  out.bounds = b;
  out.note = `cash estimate ${usd(b.allIn)}: estimate only, never a strict cap in this host`;
  return null;
}

function gate5(ctx, pr, id, kind) {
  if (kind !== 'direct') return null;
  if (ctx.req.allowDirect === false) return 'direct unsuitable: allowDirect is false';
  const max = ctx.policy.economics['direct-max-tokens'];
  if (ctx.tokens > max) return `direct unsuitable: ${ctx.tokens} tokens > direct-max-tokens ${max}`;
  return null;
}

function evaluate(ctx, id, kind) {
  const pr = ctx.policy.profiles.find((p) => p.id === id) ?? null;
  const walkthrough = [];
  const out = {};
  let fail = null;
  const gates = [gate1, gate2, gate3, gate4, gate5];
  gates.forEach((g, i) => {
    if (fail) { walkthrough.push({ gate: i + 1, result: 'not-reached' }); return; }
    const reason = g(ctx, pr, id, kind, out);
    if (reason) {
      fail = { gate: i + 1, reason };
      walkthrough.push({ gate: i + 1, result: 'fail', reason });
    } else {
      walkthrough.push(i === 3 ? { gate: 4, result: 'pass', note: out.note } : { gate: i + 1, result: 'pass' });
    }
  });
  if (fail) return { id, kind, eligible: false, 'first-failing-gate': fail.gate, reason: fail.reason, walkthrough };
  const b = out.bounds;
  return {
    id, kind, eligible: true, 'all-in-bound-usd': round4(b.allIn), 'work-bound-usd': round4(b.work),
    'review-bound-usd': round4(b.review), 'overhead-bound-usd': round4(b.overhead), walkthrough, _allIn: b.allIn, _rate: b.rate
  };
}

const byEconomics = (a, b) => a._allIn - b._allIn || a._rate - b._rate || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

// gates.md: the gates apply to every profile under consideration, the reviewer included. The required reviewer is
// drawn from the request's candidates (never the lead-direct profile) and walked through Gate 1 and Gate 2 for the
// review category, with headroom against the review median; an unpriced reviewer cannot bound the review.
function reviewerFor(ctx, ids, leadId) {
  const rev = ctx.policy.categories.review;
  const walk = {};
  const pool = [];
  for (const id of ids) {
    if (id === leadId) continue;
    const pr = ctx.policy.profiles.find((p) => p.id === id);
    if (!pr) continue;
    const g1 = gate1(ctx, pr, id, 'delegate');
    const g2 = g1 || !rev ? null : capabilities(ctx, pr, id, { category: 'review', tokens: rev['median-tokens'], tools: rev['required-tools'] });
    const why = g1 ? `gate 1: ${g1}` : !rev ? 'gate 2: the policy has no review category' : g2 ? `gate 2: ${g2}` : outRate(ctx.policy, pr) === null ? `gate 4: unknown price for ${pr.model}` : null;
    walk[id] = why;
    if (!why) pool.push(pr);
  }
  pool.sort((a, b) => outRate(ctx.policy, a) - outRate(ctx.policy, b) || (a.id < b.id ? -1 : 1));
  const reviewer = pool.length ? { id: pool[0].id, bound: (rev['median-tokens'] * outRate(ctx.policy, pool[0])) / 1e6 } : null;
  return { reviewer, walk };
}

// ---------------------------------------------------------------------------------------------
// decision
// ---------------------------------------------------------------------------------------------
export function computeDecision(req, policy, records = [], catMap = {}, { probe = null } = {}) {
  validateRequest(req, policy);
  const optIns = optInsOf(policy, req.hostOptIns);
  const category = Object.hasOwn(policy.categories, req.category) ? policy.categories[req.category] : null;
  const leadId = policy.economics['lead-direct-profile'];
  const leadRate = outRate(policy, policy.profiles.find((p) => p.id === leadId));
  const st = taskState(records, req.taskId, policy);
  assertClock(st, req.now, req.taskId);
  const nowMs = isoMs(req.now);
  const startMs = st.startMs === null ? nowMs : Math.min(st.startMs, nowMs);
  const capMs = startMs + policy.accounting.strict['deadline-per-task-hours'] * 3600000;
  const reqDeadlineMs = isoMs(req.deadline);
  const capped = capMs < reqDeadlineMs;
  const deadlineMs = capped ? capMs : reqDeadlineMs;
  const deadlineIso = capped ? isoOf(capMs) : req.deadline;
  const reviewName = category ? category.verification.find((v) => /review/i.test(v)) ?? null : null;
  const ctx = {
    req, policy, category, st, nowMs, deadlineMs, deadlineIso, leadRate, reviewName,
    tokens: req.estimatedTokens ?? category?.['median-tokens'] ?? 0,
    requiredTools: req.requiredTools ?? category?.['required-tools'] ?? [],
    reviewer: null, reviewWalk: {}
  };
  const ids = req.candidates ?? policy.profiles.map((p) => p.id);
  if (reviewName) ({ reviewer: ctx.reviewer, walk: ctx.reviewWalk } = reviewerFor(ctx, ids, leadId));
  const results = ids.map((id) => evaluate(ctx, id, id === leadId ? 'direct' : 'delegate'));
  // a profile walked as a delegate without joining the route choice (the pre-dispatch recheck of a host deviation)
  const probed = probe ? evaluate(ctx, probe, 'delegate') : null;
  const eligible = results.filter((r) => r.eligible).sort(byEconomics);

  let route;
  let chosen = null;
  let specSet = null;
  // no eligible candidate => blocked (SKILL.md decision flow step 3, 'No empty-set resurrection'; fixture E01).
  // A profile outside the candidates that would pass is named in Uncertainty as a hint, never routed to.
  let outside = [];
  if (!eligible.length) {
    route = 'blocked';
    outside = policy.profiles.filter((p) => p.id !== leadId && !ids.includes(p.id))
      .map((p) => evaluate(ctx, p.id, 'delegate')).filter((r) => r.eligible).sort(byEconomics).map((r) => r.id);
  } else {
    const delegates = eligible.filter((r) => r.kind === 'delegate');
    const slots = st.callsLimit - st.callsUsed;
    if (optIns.speculative && req.uncertainty === 'high' && delegates.length >= 2 && slots >= 2) {
      route = 'speculative';
      const set = delegates.slice(0, 2);
      chosen = set[0];
      specSet = {
        candidates: set.map((r) => ({ profile: r.id, weight: 1.0 })), 'max-parallel': set.length,
        'shared-budget': { cash: round4(set.reduce((s, r) => s + r._allIn, 0)), calls: set.length, 'cash-basis': 'estimate-only' },
        'cancel-policy': 'first-success', 'winner-owns': true
      };
      validateSpeculativeSet(specSet, { callsRemaining: slots });
    } else {
      chosen = eligible[0];
      route = chosen.kind === 'direct' ? 'direct' : 'delegate';
    }
  }

  const pr = chosen ? policy.profiles.find((p) => p.id === chosen.id) : null;
  const uncertainty = [CASH_UNCERTAINTY];
  if (optIns['nested-allowed']) uncertainty.push('nested-allowed opt-in refused: this host cannot produce or enforce a NestedBrief (spec-v2 §14)');
  if (req.uncertainty === 'high' && route !== 'speculative') uncertainty.push(`uncertainty high; speculative not used (${optIns.speculative ? 'fewer than two eligible delegates or call slots' : 'no host opt-in'})`);
  if (outside.length) uncertainty.push(`not among candidates: ${outside.join(', ')} would pass all five gates (hint only; the route stays blocked, and a fresh decision must list it as a candidate)`);
  const { proposals } = learn(policy, records, catMap);
  const pending = [...proposals, ...expiryFlags(policy, nowMs)].filter((p) => chosen && p.profile === chosen.id);
  for (const p of pending) uncertainty.push(`pending proposal (not applied): ${proposalText(p)}`);

  const isolation = route === 'blocked' ? 'none' : requiredIsolation(ctx, route === 'direct' ? 'direct' : 'delegate');
  const isolationReason = {
    blocked: 'blocked: nothing is dispatched, nothing to isolate',
    direct: isolation === 'none' ? 'Gate 5: the lead works inline on a low-risk bounded task (<= direct-max-tokens)' : `Gate 1/3: ${category?.risk}-risk work; the lead keeps a ${isolation} even inline`,
    delegate: `Gate 1: concurrent workers in this host never share a tree; Gate 5: the delegated unit owns its ${isolation} (host capability ${policy.isolation.capability})`,
    speculative: `Gate 5: each speculative candidate owns its ${isolation}; losers are cancelled`
  }[route];

  let brief = null;
  let fingerprint = null;
  if (route === 'delegate' || route === 'speculative') {
    const repair = isRepair(ctx, pr) ? 1 : 0;
    const nonGoals = [...req.nonGoals];
    if (!nonGoals.some((g) => /nest|recursive/i.test(g))) nonGoals.push('no recursive delegation (nested-allowed: false)');
    brief = {
      objective: req.objective,
      acceptance: { checks: req.acceptanceChecks.map((c) => ({ command: c.command, expect: c.expect })) },
      sources: [...req.sources],
      'permitted-effects': [...req.permittedEffects],
      'non-goals': nonGoals,
      isolation,
      'branch-hint': `build/${slug(req.unit)}`,
      allowance: { cash: route === 'speculative' ? specSet['shared-budget'].cash : chosen['all-in-bound-usd'], calls: st.callsLimit - st.callsUsed, deadline: deadlineIso, 'cash-basis': 'estimate-only' },
      attempts: st.repairsAllowed - st.repairsUsed - repair,
      'stop-triggers': [
        `verification failure -> outcome record, then a fresh decision; at most ${st.repairsAllowed} same-profile repair per task`,
        'repairs exhausted -> fresh SmartRouter decision (no ownership transfer without it)',
        `call slots exhausted (${st.callsLimit} per task) -> blocked`,
        `deadline ${deadlineIso} reached -> blocked`,
        'project stop rule -> blocked'
      ],
      ownership: 'worker',
      'nested-allowed': false,
      'max-nesting-depth': 1
    };
    validateBrief(brief, { callsRemaining: st.callsLimit - st.callsUsed, repairsAllowed: st.repairsAllowed, now: req.now });
    fingerprint = briefFingerprint(brief);
  }

  const risk = category?.risk;
  const difficulty = !category || risk === 'high' || req.uncertainty === 'high' ? 'high-or-ambiguous' : risk === 'low' ? 'trivial' : 'moderate';
  const owner = { direct: 'orchestrator', delegate: 'worker', speculative: 'worker', blocked: 'none' }[route];
  let profileLine = 'none — blocked';
  if (route === 'speculative') profileLine = specSet.candidates.map((c) => profileTuple(policy, policy.profiles.find((p) => p.id === c.profile))).join(' | ');
  else if (route !== 'blocked') profileLine = profileTuple(policy, pr);
  let allIn = null;
  if (route === 'speculative') allIn = specSet['shared-budget'].cash;
  else if (route !== 'blocked') allIn = chosen['all-in-bound-usd'];
  const reservations = allIn === null ? 'unknown/blocked'
    : `${usd(allIn)} conservative all-in bound, estimate only (work ${usd(chosen['work-bound-usd'])} + review ${usd(chosen['review-bound-usd'])} + brief overhead ${usd(chosen['overhead-bound-usd'])}${route === 'speculative' ? ', first candidate; the set sums its candidates' : ''})`;
  const left = deadlineMs - nowMs;
  const capNote = capped ? `; capped by deadline-per-task-hours ${policy.accounting.strict['deadline-per-task-hours']}` : '';
  const deadlineLine = left > 0
    ? `open until ${deadlineIso} (${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m left${capNote})`
    : `expired at ${deadlineIso} (now ${req.now} is not strictly before it)`;
  const maxDepth = optIns['nested-allowed'] ? 0 : optIns['max-nesting-depth'];

  const lines = [
    ['Difficulty', difficulty], ['Route', route], ['Profile', profileLine], ['Isolation', isolation],
    ['IsolationReason', isolationReason], ['Owner', owner], ['HumanGate', optIns['human-gate']], ['NestedAllowed', 'no'],
    ['MaxNestingDepth', String(maxDepth)], ['Reservations', reservations],
    ['Calls', `${st.callsUsed} / ${st.callsLimit}`], ['Deadline', deadlineLine], ['Uncertainty', uncertainty.join('; ')]
  ].map(([k, v]) => `${`${k}:`.padEnd(19)}${v}`);
  const walk = results.map((r) => `  ${r.id.padEnd(16)}${r.kind.padEnd(10)}${r.eligible ? `eligible, all-in ${usd(r._allIn)}` : `gate ${r['first-failing-gate']}: ${r.reason}`}`);
  let text = `${lines.join('\n')}\n${ADVISORY}\nGate walk (${route === 'blocked' ? 'first failing gate and reason per candidate' : 'per candidate'}):\n${walk.join('\n')}\n`;
  if (specSet) text += `SpeculativeSet:\n${JSON.stringify(specSet, null, 2)}\n`;
  if (brief) text += `Brief:\n${JSON.stringify(brief, null, 2)}\n`;

  const strip = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith('_') && k !== 'id'));
  return {
    route, profile: route === 'blocked' ? null : chosen.id, 'profile-tuple': route === 'blocked' ? null : profileTuple(policy, pr),
    isolation, 'isolation-reason': isolationReason, owner, 'human-gate': optIns['human-gate'], 'nested-allowed': false,
    'max-nesting-depth': maxDepth, difficulty, 'estimated-tokens': ctx.tokens,
    'all-in-bound-usd': allIn, candidates: Object.fromEntries(results.map((r) => [r.id, strip(r)])),
    'eligible-ordered': eligible.map((r) => r.id), 'eligible-outside-candidates': outside, 'speculative-set': specSet, uncertainty,
    advisory: ADVISORY_TEXT, 'pending-proposals': pending, deadline: deadlineIso, 'deadline-capped': capped,
    'review-profile': ctx.reviewer?.id ?? null, 'review-candidates': ctx.reviewWalk, brief, 'brief-fingerprint': fingerprint, text,
    counters: counters(st), ...(probed ? { probe: strip(probed) } : {})
  };
}

function policyBindings(policy, policyPath) {
  return {
    'policy-revision': policy['policy-revision'] ?? null, 'policy-sha256': sha256(readFileSync(policyPath)),
    smartrouter: policy.smartrouter ?? null, harness: `${policy.harness.id}@${policy.harness.version ?? 'unknown'}`
  };
}

export function decide(req, { policyPath = DEFAULT_POLICY, traceDir = DEFAULT_TRACE } = {}) {
  const policy = loadPolicy(policyPath);
  const records = readLedger(traceDir);
  const d = computeDecision(req, policy, records, categoryMap(traceDir));
  const st = taskState(records, req.taskId, policy);
  const seq = st.lastSeq + 1;
  const { text, brief, 'brief-fingerprint': fp, counters: ctr, ...decision } = d;
  const file = {
    request: req,
    'inputs-sha256': sha256(canonicalJson(req)),
    bindings: policyBindings(policy, policyPath),
    'ledger-before': { 'last-seq': st.lastSeq, ...ctr },
    decision,
    estimates: { basis: 'estimate-only', 'cost-bound-rule': policy.accounting['cost-bound-rule'] ?? null, 'all-in-bound-usd': d['all-in-bound-usd'] },
    accounting: { mode: policy.accounting.mode, 'cash-spent': null, 'cash-cap': null, note: 'no per-call USD accounting in this host; spend is unknown, never zero' },
    brief,
    'brief-fingerprint': fp,
    'ledger-seq': seq
  };
  const dir = join(traceDir, 'decisions');
  mkdirSync(dir, { recursive: true });
  const decisionPath = join(dir, `${req.taskId}-${seq}.json`);
  writeFileSync(decisionPath, `${JSON.stringify(file, null, 1)}\n`, { flag: 'wx' });
  const record = appendRecord(traceDir, {
    'task-id': req.taskId, seq, kind: 'decision', ts: req.now, profile: d['profile-tuple'], counters: ctr,
    deadline: d.deadline, 'brief-fingerprint': fp, detail: `route ${d.route}`,
    'outcome-ref': null,
    ...(d['speculative-set'] ? { 'speculative-profiles': d['speculative-set'].candidates.map((c) => c.profile), 'speculative-calls': d['speculative-set']['shared-budget'].calls } : {})
  });
  return { route: d.route, text, decision: d, brief, briefFingerprint: fp, decisionPath, record };
}

// ---------------------------------------------------------------------------------------------
// dispatch, outcome, status, rate
// ---------------------------------------------------------------------------------------------
// the decision file behind a ledger decision record: the stored request is what the recheck re-walks
function storedDecision(traceDir, taskId, dec) {
  const path = join(traceDir, 'decisions', `${taskId}-${dec.seq}.json`);
  if (!existsSync(path)) throw refused(`decision file ${taskId}-${dec.seq}.json is missing: the route cannot be rechecked before dispatch, and unknown evidence invalidates it (gates.md 'Qualification, freshness and pre-dispatch binding' item 3); decide again`);
  let j;
  try { j = JSON.parse(readFileSync(path, 'utf8')); } catch { throw new RouterError(4, `decision file ${taskId}-${dec.seq}.json is unparseable`); }
  if (j?.['ledger-seq'] !== dec.seq || j.request?.taskId !== taskId || (j['brief-fingerprint'] ?? null) !== dec['brief-fingerprint']) {
    throw new RouterError(4, `decision file ${taskId}-${dec.seq}.json does not match ledger decision seq ${dec.seq}`);
  }
  return j;
}

// gates.md 'Qualification, freshness and pre-dispatch binding' items 3-4: immediately before dispatch, re-walk the
// stored request against the current policy, ledger and clock. Changed, expired or revoked evidence invalidates
// the route; revocation always wins over the stored decision.
function recheck({ traceDir, policy, records, taskId, dec, route, profileId, now, projectStop, deviation }) {
  const stored = storedDecision(traceDir, taskId, dec);
  // the re-walk sees the ledger as the decision did: the dispatches made under this same decision (the other members
  // of a speculative set) are its own consumption, not changed evidence; dispatch counts them against the slots itself
  const own = (r) => r['task-id'] === taskId && r.kind === 'dispatch' && r['decision-seq'] === dec.seq;
  // the stop rules are re-walked with the lead's current state, never the snapshot taken at decide time
  const again = computeDecision({ ...stored.request, now, projectStop }, policy, records.filter((r) => !own(r)), {}, { probe: deviation ? profileId : null });
  if (deviation) {
    // a deviation is allowed only to a profile that passes Gates 1-4 on the same request (spec-v2 §11.2, §11.10, §12)
    const p = again.probe;
    if (!p.eligible) throw refused(`pre-dispatch recheck refused deviation ${profileId} (decision seq ${dec.seq}): gate ${p['first-failing-gate']}: ${p.reason}; a host deviation must still pass Gates 1-4 (spec-v2 §11.2)`);
    return;
  }
  const c = again.candidates[profileId];
  if (!c?.eligible) {
    const why = c ? `gate ${c['first-failing-gate']}: ${c.reason}` : 'not among the request\'s candidates';
    throw refused(`pre-dispatch recheck refused ${profileId} (decision seq ${dec.seq}): ${why}; changed, expired or revoked evidence invalidates the route (gates.md pre-dispatch binding); decide again`);
  }
  const choice = route === 'speculative'
    ? again['eligible-ordered'].filter((id) => again.candidates[id].kind === 'delegate').slice(0, 2)
    : again.route === 'delegate' ? [again.profile] : [];
  if (!choice.includes(profileId)) {
    throw refused(`pre-dispatch recheck: the route changed since decision seq ${dec.seq} (now ${again.route}${again.profile ? ` ${again.profile}` : ''}); decide again`);
  }
  // gates.md binding item 3: the worker is handed the decided Brief, so its allowance (calls, deadline, attempts,
  // cash) must still be what the current policy, ledger and clock give; a changed Brief invalidates the route
  if (again['brief-fingerprint'] !== stored['brief-fingerprint']) {
    const changed = Object.keys({ ...stored.brief, ...again.brief }).sort()
      .filter((k) => canonicalJson(stored.brief?.[k] ?? null) !== canonicalJson(again.brief?.[k] ?? null));
    throw refused(`pre-dispatch recheck: the Brief changed since decision seq ${dec.seq}; decide again (changed: ${changed.join(', ') || 'fingerprint'})`);
  }
}

export function dispatch(taskId, profileId, { policyPath = DEFAULT_POLICY, traceDir = DEFAULT_TRACE, now = new Date().toISOString(), deviation = null, projectStop = null } = {}) {
  if (!isStr(taskId) || !TASK_ID.test(taskId)) throw invalid(`invalid task id ${taskId}`);
  if (isoMs(now) === null) throw invalid('--now must be ISO-8601');
  // gates.md binding item 3 rechecks current permission: Gate 1's project stops are part of it, so no default
  if (!isProjectStop(projectStop)) throw invalid(`dispatch needs the current project-stop state: ${PROJECT_STOP_USAGE} (missing or malformed; each of redSuite, gateOff, researchGateFailing a boolean)`);
  const policy = loadPolicy(policyPath);
  const pr = policy.profiles.find((p) => p.id === profileId);
  if (!pr) throw invalid(`unknown profile ${profileId}`);
  const records = readLedger(traceDir);
  const st = taskState(records, taskId, policy);
  assertClock(st, now, taskId);
  const dec = st.lastDecision;
  if (!dec) throw refused(`no decision recorded for task ${taskId}; run decide first`);
  const route = /^route (\S+)/.exec(dec.detail)?.[1] ?? 'unknown';
  if (route === 'blocked') throw refused(`latest decision for ${taskId} is blocked (seq ${dec.seq}); a blocked result is never overridden (spec-v2 §11.2)`);
  if (route !== 'delegate' && route !== 'speculative') throw refused(`latest decision for ${taskId} is ${route}; nothing to dispatch without a fresh decision`);
  if (st.lastOutcomeSeq > dec.seq) throw refused(`an outcome (seq ${st.lastOutcomeSeq}) follows the latest decision (seq ${dec.seq}); decide again with previousResult first`);
  const decided = route === 'speculative' ? dec['speculative-profiles'] ?? [tupleId(dec.profile)] : [tupleId(dec.profile)];
  const after = st.records.filter((r) => r.kind === 'dispatch' && r.seq > dec.seq);
  if (route === 'delegate' && after.length) throw refused(`decision seq ${dec.seq} for ${taskId} was already dispatched (seq ${after[0].seq}); decide again`);
  if (after.some((r) => tupleId(r.profile) === profileId)) throw refused(`decision seq ${dec.seq} already dispatched ${profileId}`);
  const asDecided = decided.includes(profileId);
  if (route === 'speculative') {
    // spec-v2 §8.4: the shared budget is a hard ceiling across the entire set; a record without the ceiling
    // (written before it was stored) is held to the set's size, which is what the adapter emits as calls
    const ceiling = isInt(dec['speculative-calls'], 1) ? dec['speculative-calls'] : decided.length;
    if (after.length >= ceiling) throw refused(`speculative set of decision seq ${dec.seq} has used its shared budget: ${after.length} of ${ceiling} calls dispatched; the shared budget is a hard ceiling across the set (spec-v2 §8.4); decide again`);
    if (!asDecided) throw refused(`decision seq ${dec.seq} is speculative: dispatching ${profileId} outside its set (${decided.join(', ')}) is refused; a speculative route admits no host deviation (its shared budget is a hard ceiling, spec-v2 §8.4); decide again`);
  }
  // the lead-direct profile is walked only as `direct` (Gate 5's direct-max-tokens bound); a deviation probe walks
  // every profile as a delegate, so without this the lead could be dispatched as a worker past that bound
  const leadId = policy.economics['lead-direct-profile'];
  if (!asDecided && profileId === leadId) throw refused(`${profileId} is the lead-direct profile (economics.lead-direct-profile): it works direct only, up to direct-max-tokens ${policy.economics['direct-max-tokens']}, and is never dispatched as a delegated worker, --deviation or not (Gate 5); decide again`);
  if (!asDecided && !isStr(deviation)) throw refused(`decided ${decided.join(', ')}; dispatching ${profileId} is a host deviation: pass --deviation <reason> to record it`);
  if (!(isoMs(now) < isoMs(dec.deadline))) throw refused(`deadline ${dec.deadline} reached: now ${now} is not strictly before it`);
  if (!(st.callsUsed + 1 <= st.callsLimit)) throw refused(`call slots exhausted: ${st.callsUsed} used + 1 > ${st.callsLimit} calls-per-task`);
  const key = sameKey(profileTuple(policy, pr));
  const prior = st.dispatchedKeys.get(key);
  const repair = Boolean(prior);
  if (repair && !(st.repairsUsed + 1 <= st.repairsAllowed)) throw refused(`same-profile repairs exhausted for ${taskId}: ${st.repairsUsed} used + 1 > ${st.repairsAllowed} allowed (R01-R03)`);
  // reconcile first (SKILL.md 'Hard prohibitions', spec-v2 §7 and §12): any earlier dispatch of the task, of any
  // profile, whose acceptance is unknown (no later outcome naming its dispatch-seq) holds every further dispatch;
  // the one exception is the other members of the same speculative decision, which run side by side by design
  const reconciled = (d) => st.records.some((o) => o.kind === 'outcome' && o.seq > d.seq && o['dispatch-seq'] === d.seq);
  const sibling = (d) => route === 'speculative' && asDecided && d['decision-seq'] === dec.seq;
  const open = st.records.find((d) => d.kind === 'dispatch' && !reconciled(d) && !sibling(d));
  if (open) throw refused(`previous dispatch of ${tupleId(open.profile)} (seq ${open.seq}) has no outcome; reconcile before any re-dispatch (spec-v2 §12)`);
  recheck({ traceDir, policy, records, taskId, dec, route, profileId, now, projectStop, deviation: !asDecided });
  const detail = asDecided ? `${repair ? 'same-profile repair dispatch' : 'dispatch'} as decided (decision seq ${dec.seq})` : `host deviation: ${deviation}; route said ${decided.join(', ')}`;
  return appendRecord(traceDir, {
    'task-id': taskId, seq: st.lastSeq + 1, kind: 'dispatch', ts: now, profile: profileTuple(policy, pr),
    counters: counters(st, st.callsUsed + 1, st.repairsUsed + (repair ? 1 : 0)), deadline: dec.deadline,
    'brief-fingerprint': asDecided ? dec['brief-fingerprint'] : null, detail, 'outcome-ref': null,
    'decision-seq': dec.seq, repair, deviation: !asDecided
  });
}

export function recordOutcome(o, { policyPath = DEFAULT_POLICY, traceDir = DEFAULT_TRACE, now = new Date().toISOString() } = {}) {
  validateOutcome(o);
  if (isoMs(now) === null) throw invalid('--now must be ISO-8601');
  const policy = loadPolicy(policyPath);
  const ownerId = tupleId(o['owner-profile']);
  const pr = policy.profiles.find((p) => p.id === ownerId);
  if (!pr) throw invalid(`owner-profile ${o['owner-profile']} is not a policy profile`);
  const records = readLedger(traceDir);
  const st = taskState(records, o['task-id'], policy);
  if (!st.records.length) throw refused(`unknown task ${o['task-id']}: no ledger records`);
  assertClock(st, now, o['task-id']);
  const disp = st.dispatched.get(ownerId);
  if (!disp) throw refused(`no dispatch of ${ownerId} recorded for task ${o['task-id']}; an outcome must reference a dispatch`);
  const fp = o['original-brief-fingerprint'];
  if (st.fingerprints.size && !st.fingerprints.has(fp)) throw refused(`original-brief-fingerprint does not match any Brief recorded for ${o['task-id']}`);
  const seq = st.lastSeq + 1;
  const dir = join(traceDir, 'outcomes');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${o['task-id']}-${seq}.json`), `${JSON.stringify(o, null, 1)}\n`, { flag: 'wx' });
  return appendRecord(traceDir, {
    'task-id': o['task-id'], seq, kind: 'outcome', ts: now, profile: profileTuple(policy, pr), counters: counters(st),
    deadline: st.lastDecision?.deadline ?? null, 'brief-fingerprint': FINGERPRINT.test(fp) ? fp : null,
    detail: `outcome ${o.outcome} (dispatch seq ${disp.seq})`, 'outcome-ref': o['task-id'], 'dispatch-seq': disp.seq
  });
}

export function status(taskId, { policyPath = DEFAULT_POLICY, traceDir = DEFAULT_TRACE } = {}) {
  const policy = loadPolicy(policyPath);
  const st = taskState(readLedger(traceDir), taskId, policy);
  if (!st.records.length) throw invalid(`unknown task ${taskId}: no ledger records`);
  const dec = st.lastDecision;
  const disp = st.records.filter((r) => r.kind === 'dispatch');
  const outs = st.records.filter((r) => r.kind === 'outcome');
  const text = [
    `task: ${taskId}`, `last seq: ${st.lastSeq}`, `calls: ${st.callsUsed} / ${st.callsLimit}`, `repairs: ${st.repairsUsed} / ${st.repairsAllowed}`,
    `deadline: ${dec?.deadline ?? 'none'}`, `latest decision: ${dec ? `seq ${dec.seq} ${dec.detail} ${dec.profile ?? ''}`.trim() : 'none'}`,
    `dispatches: ${disp.length} (deviations: ${disp.filter(isDeviation).length})`,
    `outcomes: ${outs.length ? outs.map((r) => `seq ${r.seq} ${r.detail}`).join('; ') : 'none'}`
  ].join('\n');
  return { text: `${text}\n`, counters: counters(st) };
}

export function rate({ policyPath = DEFAULT_POLICY, traceDir = DEFAULT_TRACE, now = new Date().toISOString() } = {}) {
  if (isoMs(now) === null) throw invalid('--now must be ISO-8601');
  const policy = loadPolicy(policyPath);
  const records = readLedger(traceDir);
  const { stats, proposals } = learn(policy, records, categoryMap(traceDir));
  const path = ledgerPath(traceDir);
  const doc = {
    _comment: 'derived by route.mjs rate from ledger.jsonl and the decision files; regenerated on every run, never hand-edited',
    'policy-revision': policy['policy-revision'] ?? null,
    'ledger-sha256': existsSync(path) ? sha256(readFileSync(path)) : null,
    'outcomes-counted': latestOutcomes(records).length,
    'outcome-records': records.filter((r) => r.kind === 'outcome').length,
    stats,
    proposals
  };
  mkdirSync(traceDir, { recursive: true });
  const statsPath = join(traceDir, 'qualification-stats.json');
  writeFileSync(statsPath, `${JSON.stringify(sortKeys(doc), null, 2)}\n`);
  const flags = expiryFlags(policy, isoMs(now));
  const lines = [`${statsPath} regenerated (${doc['outcomes-counted']} outcomes)`];
  for (const p of proposals) lines.push(`PROPOSAL ${proposalText(p)}; not applied — the lead ratifies by editing host-policy.json`);
  for (const f of flags) lines.push(`FLAG ${f.profile}: ${f.reason}`);
  if (!proposals.length && !flags.length) lines.push('no proposals');
  return { stats: doc, proposals, flags, statsPath, text: `${lines.join('\n')}\n` };
}

// ---------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const pos = [];
  const opt = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith('--')) throw invalid(`${a} needs a value`);
      opt[a.slice(2)] = v;
      i += 1;
    } else pos.push(a);
  }
  return { pos, opt };
}

export function main(argv = process.argv.slice(2)) {
  try {
    const { pos, opt } = parseArgs(argv);
    const unknown = Object.keys(opt).filter((k) => !['trace', 'policy', 'now', 'deviation', 'project-stop'].includes(k));
    if (unknown.length) throw invalid(`unknown option --${unknown[0]}`);
    const base = { traceDir: opt.trace ? resolve(opt.trace) : DEFAULT_TRACE, policyPath: opt.policy ? resolve(opt.policy) : DEFAULT_POLICY };
    const now = opt.now ?? new Date().toISOString();
    const [cmd, a, b] = pos;
    if (cmd === 'decide' && a) {
      process.stdout.write(decide(readJsonFile(a, 'request'), base).text);
    } else if (cmd === 'dispatch' && a && b) {
      let projectStop = null;
      if (opt['project-stop'] !== undefined) {
        try { projectStop = JSON.parse(opt['project-stop']); } catch (e) { throw invalid(`--project-stop is not JSON (${e.message}); expected ${PROJECT_STOP_USAGE}`); }
      }
      const r = dispatch(a, b, { ...base, now, deviation: opt.deviation ?? null, projectStop });
      process.stdout.write(`dispatch recorded: ${r['task-id']} seq ${r.seq} ${r.profile} (calls ${r.counters['calls-used']} / ${r.counters['calls-limit']}, repairs ${r.counters['repairs-used']} / ${r.counters['repairs-allowed']})\n${r.detail}\n`);
    } else if (cmd === 'outcome' && a) {
      const r = recordOutcome(readJsonFile(a, 'outcome'), { ...base, now });
      process.stdout.write(`outcome recorded: ${r['task-id']} seq ${r.seq} ${r.detail}\n`);
    } else if (cmd === 'status' && a) {
      process.stdout.write(status(a, base).text);
    } else if (cmd === 'rate') {
      process.stdout.write(rate({ ...base, now }).text);
    } else {
      throw invalid('usage: route.mjs decide <request.json> | dispatch <task-id> <profile-id> --project-stop <json> | outcome <outcome.json> | status <task-id> | rate  [--trace <dir>] [--policy <file>] [--now <iso>] [--deviation <reason>]');
    }
    return 0;
  } catch (e) {
    if (e instanceof RouterError) {
      process.stderr.write(`route.mjs: ${e.message}\n`);
      return e.code;
    }
    if (e?.code === 'EEXIST') {
      process.stderr.write(`route.mjs: refusing to overwrite ${e.path}\n`);
      return 4;
    }
    throw e;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
