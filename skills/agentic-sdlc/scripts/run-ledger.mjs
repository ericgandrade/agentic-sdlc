#!/usr/bin/env node
// run-ledger — progress ledger, loop bounds, halts and budgets for Build runs (mechanisms 6.1–6.5, 8.3, 8.5).
// Dependency-free Node >= 18. Exit codes: 0 pass · 1 check failed · 2 input missing or unparsable · 3 bound reached.

import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { git, headSha, currentBranch, isRepo, topLevel } from './lib/git.mjs';
import {
  contentHash, extractFencedBlocks, findSection, parseKeyValueBlock, parseSections, parseTables, readMarkdownFile,
} from './lib/md.mjs';

// ---------------------------------------------------------------------------------------------
// Constants (references/loops.md, references/autonomous.md)

export const LOOP_BOUNDS = Object.freeze({ 'red-green': 3, 'build-test': 5, 'review-fix': 3, debug: 3 });
export const FAILED_FIXES_BREAKER = 3; // anti-thrash: 3 failed build-test fixes since the last ruling
export const UNKNOWN_CAUSE_LIMIT = 2; // unknown cause after 2 rounds → treated as design
export const BUDGET_DEFAULTS = Object.freeze({ max_tasks: 15, max_rounds: 5, max_hours: 4, max_turns: 300, max_tokens: null });
export const IDLE_GAP_MS = 30 * 60 * 1000;
export const OUT_OF_PLAN_LIMIT = 3;
export const HALT_REASONS = Object.freeze([
  'loop-bound', 'path-escalation', 'spec-design-cause', 'dependency-added', 'secret-detected',
  'out-of-plan-files', 'red-baseline', 'approval-void', 'budget', 'authority',
]);
export const CAUSES = Object.freeze(['spec', 'design', 'plan', 'code', 'test', 'env', 'unknown']);
export const ROUTES = Object.freeze({
  spec: 'Specify (Specify sign-off void)', design: 'Design (Design sign-off void)', plan: 'Design (Design sign-off void)',
  code: 'Build', test: 'Build', env: 'preflight', unknown: 'Build',
});
const RULINGS = Object.freeze(['continue', 'reroute', 'split', 'handover', 'drop']);
const BREAKERS = Object.freeze({
  B1: { name: 'red-green bound', target: 'none (automatic)', allowed: [] },
  B2: { name: 'anti-thrash', target: 'Architect', allowed: ['continue', 'reroute', 'split', 'handover', 'drop'] },
  B3: { name: 'build-test cap', target: 'Tech Lead', allowed: ['reroute', 'split', 'handover', 'drop'] },
  B4: { name: 'review-fix cap', target: 'Tech Lead', allowed: ['reroute', 'handover', 'drop'] },
  B5: { name: 'debug cap', target: 'Architect', allowed: ['reroute', 'split', 'handover', 'drop'] },
  B6: { name: 'root cause outside Build', target: 'Product Owner (spec cause) or Tech Lead', allowed: ['reroute', 'handover'] },
});
const CLOSED = new Set(['done', 'dropped', 'split', 'rerouted', 'handover']);
const EVENT_TYPES = new Set(['start', 'preflight', 'resume', 'task', 'red', 'round', 'ruling', 'halt', 'check', 'finish']);
const RUN_ID = /^[a-z0-9][a-z0-9-]{0,40}$/;
const MANIFESTS = new Set([
  'package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock', 'bun.lockb',
  'requirements.txt', 'Pipfile', 'Pipfile.lock', 'pyproject.toml', 'poetry.lock', 'uv.lock', 'go.mod', 'go.sum',
  'Cargo.toml', 'Cargo.lock', 'Gemfile', 'Gemfile.lock', 'pom.xml', 'build.gradle', 'build.gradle.kts',
  'composer.json', 'composer.lock', 'packages.lock.json',
]);
const SECRET_PATTERNS = [
  ['aws-access-key-id', /\bAKIA[0-9A-Z]{16}\b/],
  ['private-key', /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/],
  ['github-token', /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['stripe-live-key', /\bsk_live_[0-9A-Za-z]{24,}\b/],
  ['google-api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['assigned-secret', /(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*['"][^'"\s]{16,}['"]/i],
];

export function now() {
  const forced = process.env.SDLC_NOW;
  const d = forced ? new Date(forced) : new Date();
  if (Number.isNaN(d.getTime())) throw new InputError(`SDLC_NOW is not an ISO date: ${forced}`);
  return d;
}

// ---------------------------------------------------------------------------------------------
// Plan, spec and Definition of Done parsing (shared with preflight.mjs)

const clean = (s) => String(s ?? '').replace(/\*\*/g, '').replace(/`/g, '').trim();
const idsIn = (s, re) => [...new Set([...String(s ?? '').matchAll(re)].map((m) => m[0]))];

function splitFiles(cell) {
  const spans = [...String(cell ?? '').matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  const items = spans.length ? spans : String(cell ?? '').split(/<br\s*\/?>|,|;/i).map(clean);
  return items.filter((x) => x && !/^[—–-]+$/.test(x) && !/^n\/a$/i.test(x));
}

// Tasks from the plan: the first table with an ID/Task column holding T<n> rows (preferring a
// "Tasks" section), else "### Task N" / "### T<n>" headings. Returns { source, tasks: [{ id, files, blockedBy, acs }] };
// files is null when the plan lists no Files/Touches column.
export function readPlanTasks(md) {
  const sections = parseSections(md);
  const sec = sections.find((s) => /^(tasks?|task graph)\b/i.test(s.title));
  const tables = [...(sec ? parseTables(sec.body) : []), ...parseTables(md)];
  for (const t of tables) {
    const col = (re) => t.header.findIndex((h) => re.test(clean(h)));
    const idCol = col(/^(id|task|task id)$/i);
    if (idCol < 0) continue;
    const rows = t.rows.filter((r) => /^T\d+$/.test(clean(r[idCol])));
    if (!rows.length) continue;
    const filesCol = col(/^(files|touches)$/i);
    const blockedCol = col(/^blocked[ -]by$/i);
    const acCol = col(/^(acs?|satisfies|refs)$/i);
    return {
      source: 'table',
      tasks: rows.map((r) => ({
        id: clean(r[idCol]),
        files: filesCol >= 0 ? splitFiles(r[filesCol]) : null,
        blockedBy: blockedCol >= 0 ? idsIn(r[blockedCol], /\bT\d+\b/g) : [],
        acs: acCol >= 0 ? idsIn(r[acCol], /\bAC-\d+\b/g) : [],
      })),
    };
  }
  const tasks = [];
  for (const s of sections) {
    const m = s.title.match(/^(?:Task\s+(\d+)|T(\d+))\b/i);
    if (!m) continue;
    const id = `T${m[1] || m[2]}`;
    if (tasks.some((t) => t.id === id)) continue;
    const blocked = s.body.match(/Blocked by:?\**\s*(.*)/i);
    tasks.push({ id, files: null, blockedBy: blocked ? idsIn(blocked[1], /\bT\d+\b/g) : [], acs: idsIn(s.body, /\bAC-\d+\b/g) });
  }
  if (tasks.length) return { source: 'headings', tasks };
  throw new InputError('plan has no task table (ID or Task column with T<n> rows) and no "Task N" headings');
}

// Approval hashes (references/governance.md): plan hash = body without ## Approvals and ## Loop ledger
// (Loop ledger rows never void Design sign-off, same as plan-graph planHash); spec hash = body without ## Approvals.
export function planHashOf(md) {
  return contentHash(md, { exclude: ['Approvals', 'Loop ledger'] });
}

export function specHashOf(md) {
  return contentHash(md);
}

// Approved rows of the ## Approvals section. Table rows use the Decision column when present
// ("approved…"), else the row text; non-table lines count when they say "approved" and not
// "not approved" / "rejected" / "revoked" / "void". Returns null when the section is absent.
function approvedRows(md) {
  const s = findSection(md, 'Approvals', { level: 2 }) || findSection(md, 'Approvals');
  if (!s) return null;
  const body = s.body.replace(/<!--[\s\S]*?-->/g, '');
  const rows = [];
  const NEG = /\b(not approved|rejected|revoked|void)\b/i;
  for (const t of parseTables(body)) {
    const head = t.header.map((h) => clean(h).toLowerCase());
    const at = (re) => head.findIndex((h) => re.test(h));
    const dec = at(/^decision$/);
    const ph = at(/^plan hash$/);
    const sh = at(/^spec hash$/);
    const kind = at(/^sign-off$/);
    for (const r of t.rows) {
      const text = r.map(clean).join(' | ');
      const ok = dec >= 0 ? /^approved\b/i.test(clean(r[dec])) : /\bapproved\b/i.test(text) && !NEG.test(text);
      if (!ok) continue;
      rows.push({
        text, kind: kind >= 0 ? clean(r[kind]) : '',
        planHash: ph >= 0 ? clean(r[ph]) : null, specHash: sh >= 0 ? clean(r[sh]) : null,
      });
    }
  }
  for (const l of body.split('\n')) {
    if (l.includes('|')) continue;
    if (/\bapproved\b/i.test(l) && !NEG.test(l)) rows.push({ text: l, kind: '', planHash: null, specHash: null });
  }
  return rows;
}

const binds = (row, col, hash) => (row[col] != null ? row[col] === hash : row.text.includes(hash));

// Specify and Design sign-off validity for a plan file and its sibling spec.md. The Design sign-off binds
// the plan hash; the Specify sign-off comes from spec.md (Specify or combined row) or from a plan row
// that binds the current spec hash.
export function approvalState(planPath) {
  const plan = readMarkdownFile(planPath);
  const specPath = join(dirname(planPath), 'spec.md');
  const spec = existsSync(specPath) ? readMarkdownFile(specPath) : null;
  const planHash = planHashOf(plan);
  const planRows = approvedRows(plan);
  const planRow = (planRows || []).filter((r) => binds(r, 'planHash', planHash)).pop() || null;
  const out = { plan: { path: planPath, hash: planHash, section: planRows !== null, valid: !!planRow }, spec: null };
  if (spec !== null) {
    const specHash = specHashOf(spec);
    const specRows = approvedRows(spec);
    const fromSpec = (specRows || []).some((r) => binds(r, 'specHash', specHash));
    const fromPlan = (planRows || []).some((r) => r.specHash != null ? r.specHash === specHash : r.text.includes(specHash));
    out.spec = { path: specPath, hash: specHash, section: specRows !== null || planRows !== null, valid: fromSpec || fromPlan };
    if (planRow && planRow.specHash != null && planRow.specHash !== specHash) {
      out.plan.valid = false;
      out.plan.detail = `plan approved against spec hash ${planRow.specHash}, current ${specHash}`;
    }
  }
  return out;
}

// The sdlc-dod block from AGENTS.md or CLAUDE.md: { file, entries }.
export function readDod(root) {
  for (const f of ['AGENTS.md', 'CLAUDE.md']) {
    const p = join(root, f);
    if (!existsSync(p)) continue;
    const blocks = extractFencedBlocks(readMarkdownFile(p), { info: 'sdlc-dod' });
    if (blocks.length) return { file: f, entries: parseKeyValueBlock(blocks[0].content) };
  }
  throw new InputError('no ```sdlc-dod block in AGENTS.md or CLAUDE.md (run project-context setup)');
}

export function dodCommands(entries) {
  return Object.entries(entries)
    .filter(([k, v]) => k !== 'coverage_min' && !/^n\/a\b/i.test(v))
    .map(([key, cmd]) => ({ key, cmd }));
}

// ---------------------------------------------------------------------------------------------
// Ledger I/O

export function runDir(root, id) {
  return join(root, '.agentic-sdlc', 'runs', id);
}

export function ledgerPath(root, id) {
  return join(runDir(root, id), 'ledger.jsonl');
}

export function ensureRunsDir(root) {
  const runs = join(root, '.agentic-sdlc', 'runs');
  mkdirSync(runs, { recursive: true });
  const gi = join(runs, '.gitignore');
  if (!existsSync(gi)) writeFileSync(gi, '# run state is local; finish archives the ledger into specs/NNN-slug/\n*\n');
  return runs;
}

// Reads and validates a ledger. Any defect → InputError (exit 2): the run needs a human.
export function loadLedger(path) {
  if (!existsSync(path)) throw new InputError(`ledger not found: ${path}`);
  const lines = readFileSync(path, 'utf8').replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim());
  const events = [];
  lines.forEach((line, i) => {
    let e;
    try { e = JSON.parse(line); } catch { throw new InputError(`corrupt ledger ${path}: line ${i + 1} is not JSON`); }
    const where = `corrupt ledger ${path}: line ${i + 1}`;
    if (!e || typeof e !== 'object' || Array.isArray(e)) throw new InputError(`${where}: not an object`);
    if (e.v !== 1) throw new InputError(`${where}: unsupported version ${e.v}`);
    if (e.seq !== i + 1) throw new InputError(`${where}: seq ${e.seq}, expected ${i + 1}`);
    if (!EVENT_TYPES.has(e.type)) throw new InputError(`${where}: unknown type ${e.type}`);
    if (Number.isNaN(new Date(e.ts).getTime())) throw new InputError(`${where}: bad ts`);
    if (i === 0 && e.type !== 'start') throw new InputError(`${where}: first event must be start`);
    if (i > 0 && e.type === 'start') throw new InputError(`${where}: second start event`);
    events.push(e);
  });
  if (!events.length) throw new InputError(`corrupt ledger ${path}: empty`);
  return events;
}

export function appendEvent(path, events, fields) {
  const e = { v: 1, seq: events.length + 1, ts: now().toISOString(), ...fields };
  appendFileSync(path, JSON.stringify(e) + '\n');
  events.push(e);
  return e;
}

// ---------------------------------------------------------------------------------------------
// State derived from the ledger (the ledger is the only source of truth)

const norm = (s) => String(s ?? '').toLowerCase()
  .replace(/\(\d+(\.\d+)?\s*m?s\)/g, '').replace(/:\d+:\d+/g, '').replace(/0x[0-9a-f]+/g, '')
  .replace(/\s+/g, ' ').trim();

function newTask(id, blockedBy = []) {
  return { id, blockedBy, state: 'pending', rounds: [], red: [], escalation: null, rulingSeq: 0, debugSeq: 0, inDebug: false, commit: null, noRed: null };
}

export function deriveState(events) {
  const start = events[0];
  const tasks = new Map(start.tasks.map((t) => [t.id, newTask(t.id, t.blockedBy || [])]));
  const st = {
    start, tasks, halt: null, finish: null, lastPreflight: null, resetSeq: start.seq,
    turns: 0, tokens: 0, started: new Set(), rulings: [], halts: [],
  };
  const task = (id) => {
    if (!tasks.has(id)) tasks.set(id, newTask(id));
    return tasks.get(id);
  };
  for (const e of events) {
    if (Number.isFinite(e.turns)) st.turns = Math.max(st.turns, e.turns);
    if (Number.isFinite(e.tokens)) st.tokens = Math.max(st.tokens, e.tokens);
    switch (e.type) {
      case 'preflight': st.lastPreflight = e; break;
      case 'resume':
        st.resetSeq = e.seq;
        if (st.halt && e.ack) st.halt = null;
        break;
      case 'task': {
        const t = task(e.task);
        t.state = e.state;
        if (e.state === 'started') st.started.add(e.task);
        if (e.state === 'done') { t.commit = e.commit || null; t.noRed = e.noRed || null; }
        break;
      }
      case 'red': task(e.task).red.push(e); break;
      case 'round': {
        const t = task(e.task);
        t.rounds.push(e);
        if (e.cause === 'env') st.resetSeq = e.seq;
        if (e.loop === 'debug' && e.result === 'pass') { t.inDebug = false; t.debugSeq = e.seq; }
        if (e.transition === 'debug') t.inDebug = true;
        if (e.escalation) t.escalation = { ...e.escalation, seq: e.seq };
        break;
      }
      case 'ruling': {
        const t = task(e.task);
        t.escalation = null;
        t.rulingSeq = e.seq;
        st.rulings.push(e);
        const next = { reroute: 'rerouted', split: 'split', handover: 'handover', drop: 'dropped' }[e.decision];
        if (next) t.state = next;
        break;
      }
      case 'halt': st.halt = e; st.halts.push(e); break;
      case 'finish': st.finish = e; break;
      default: break;
    }
  }
  st.preflightFresh = !!(st.lastPreflight && st.lastPreflight.ok && st.lastPreflight.seq > st.resetSeq);
  return st;
}

// Active wall-clock hours: gaps between consecutive events (and now) count only when ≤ 30 min.
export function activeHours(events, at = now()) {
  const times = events.map((e) => new Date(e.ts).getTime()).concat(at.getTime());
  let ms = 0;
  for (let i = 1; i < times.length; i++) {
    const gap = times[i] - times[i - 1];
    if (gap > 0 && gap <= IDLE_GAP_MS) ms += gap;
  }
  return ms / 3_600_000;
}

export function budgetUse(st, events, { addTask = 0 } = {}) {
  const b = st.start.budgets;
  const use = {
    tasks: st.started.size + addTask, hours: Number(activeHours(events).toFixed(2)), turns: st.turns, tokens: st.tokens,
  };
  const over = [];
  if (use.tasks > b.max_tasks) over.push(`tasks ${use.tasks} > ${b.max_tasks}`);
  if (use.hours > b.max_hours) over.push(`active hours ${use.hours} > ${b.max_hours}`);
  if (use.turns > b.max_turns) over.push(`agent turns ${use.turns} > ${b.max_turns}`);
  if (b.max_tokens != null && use.tokens > b.max_tokens) over.push(`tokens ${use.tokens} > ${b.max_tokens}`);
  return { use, over };
}

export function nextTask(st) {
  for (const t of st.start.tasks) {
    const s = st.tasks.get(t.id);
    if (CLOSED.has(s.state) || s.escalation) continue;
    if ((t.blockedBy || []).every((b) => st.tasks.get(b)?.state === 'done')) return t.id;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Loop rules (references/loops.md §Bounds, §Anti-thrash, §Routing)

export function evaluateRound(st, t, round) {
  if (round.result !== 'fail') return null;
  const bound = round.loop === 'build-test' ? Math.min(LOOP_BOUNDS['build-test'], st.start.budgets.max_rounds) : LOOP_BOUNDS[round.loop];
  const prior = t.rounds;
  const sinceRedReset = (r) => r.loop === 'red-green' && r.seq > t.debugSeq;
  const failedInLoop = prior.filter((r) => r.result === 'fail' && (round.loop === 'red-green' ? sinceRedReset(r) : r.loop === round.loop)).length + 1;

  if (['spec', 'design', 'plan'].includes(round.cause)) {
    return { breaker: 'B6', target: round.cause === 'spec' ? 'Product Owner' : 'Tech Lead', route: ROUTES[round.cause], why: `root cause ${round.cause}` };
  }
  if (round.cause === 'unknown' && prior.filter((r) => r.result === 'fail' && r.cause === 'unknown').length + 1 >= UNKNOWN_CAUSE_LIMIT) {
    return { breaker: 'B6', target: 'Tech Lead', route: ROUTES.design, why: `cause unknown after ${UNKNOWN_CAUSE_LIMIT} rounds → treated as design` };
  }
  if (failedInLoop >= bound) {
    if (round.loop === 'red-green') return { transition: 'debug', why: `${bound} failed red-green attempts → debug loop` };
    const breaker = { 'build-test': 'B3', 'review-fix': 'B4', debug: 'B5' }[round.loop];
    return { breaker, target: BREAKERS[breaker].target, route: 'ruling', why: `${round.loop} bound ${bound} reached` };
  }
  if (['build-test', 'review-fix'].includes(round.loop)) {
    const since = prior.filter((r) => r.seq > t.rulingSeq);
    const last = since[since.length - 1];
    if (last && last.result === 'fail' && last.signature && norm(last.signature) === norm(round.signature)) {
      return { breaker: 'B2', target: 'Architect', route: 'design question', why: 'same failure signature in 2 consecutive rounds' };
    }
    const failedFixes = since.filter((r) => r.loop === 'build-test' && r.result === 'fail').length + (round.loop === 'build-test' ? 1 : 0);
    if (failedFixes >= FAILED_FIXES_BREAKER) {
      return { breaker: 'B2', target: 'Architect', route: 'design question', why: `${FAILED_FIXES_BREAKER} failed fixes on the task` };
    }
  }
  return null;
}

export function escalationBrief(st, t, e) {
  const esc = e.escalation;
  const tried = t.rounds.filter((r) => r.tried).map((r, i) => `  ${i + 1}) [${r.loop} r${r.round}] ${r.tried} → ${r.result}`);
  return [
    `ESCALATE · run ${st.start.run} · ${t.id} · ${esc.breaker} ${BREAKERS[esc.breaker].name} → ${esc.target}`,
    `Why: ${esc.why} · loop ${e.loop} · round ${e.round} · cause ${e.cause}${esc.route ? ` · route ${esc.route}` : ''}`,
    `Failure signature: ${e.signature}`,
    'Tried:', ...tried,
    `Ruling requested (one of): ${BREAKERS[esc.breaker].allowed.join(' | ')}`,
    `Record: run-ledger ruling --run ${st.start.run} --task ${t.id} --by "<role: name>" --decision <ruling> --note "<text>"`,
  ];
}

// ---------------------------------------------------------------------------------------------
// Repository checks used by `check`

function changedSince(root, base) {
  const tracked = git(['diff', '--name-only', '-z', base], { cwd: root }).split('\0').filter(Boolean);
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root }).split('\0').filter(Boolean);
  return [...new Set([...tracked, ...untracked])].sort();
}

const stem = (p) => basename(p).replace(/\.[^.]+$/, '').replace(/(\.test|\.spec|_test|_spec)$/i, '').replace(/^test_/i, '');

function globToRe(g) {
  const esc = g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\0').replace(/\*/g, '[^/]*').replace(/\0/g, '.*');
  return new RegExp(`^${esc}$`);
}

export function inPlan(file, planFiles) {
  return planFiles.some((p) => {
    if (p === file) return true;
    if (p.endsWith('/') && file.startsWith(p)) return true;
    if (p.includes('*') && globToRe(p).test(file)) return true;
    return stem(p) === stem(file) && stem(p).length > 0 && /(\.test|\.spec|_test|_spec|^test_)/i.test(basename(file));
  });
}

function scanSecrets(root, base) {
  const hits = [];
  const diff = git(['diff', '-U0', '--no-color', base], { cwd: root });
  let file = null;
  let line = 0;
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) { file = l.slice(4).replace(/^b\//, ''); continue; }
    const h = l.match(/^@@ -\d+(?:,\d+)? \+(\d+)/);
    if (h) { line = Number(h[1]); continue; }
    if (l.startsWith('+') && file && !file.startsWith('.agentic-sdlc/')) {
      for (const [name, re] of SECRET_PATTERNS) if (re.test(l)) hits.push({ file, line, pattern: name });
      line++;
    }
  }
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'], { cwd: root }).split('\0').filter(Boolean);
  for (const f of untracked) {
    if (f.startsWith('.agentic-sdlc/')) continue;
    const p = join(root, f);
    if (statSync(p).size > 1024 * 1024) continue;
    const text = readFileSync(p, 'utf8');
    if (text.includes('\0')) continue;
    text.split('\n').forEach((l, i) => {
      for (const [name, re] of SECRET_PATTERNS) if (re.test(l)) hits.push({ file: f, line: i + 1, pattern: name });
    });
  }
  return hits;
}

// ---------------------------------------------------------------------------------------------
// Commands

function need(flags, key, hint = '') {
  const v = flags[key];
  if (v === undefined || v === true || String(v).trim() === '') throw new InputError(`--${key} is required${hint ? ` (${hint})` : ''}`);
  return String(v);
}

function readBudgets(root, flags) {
  const out = { ...BUDGET_DEFAULTS };
  const cfg = join(root, '.agentic-sdlc', 'config.json');
  if (existsSync(cfg)) {
    let data;
    try { data = JSON.parse(readFileSync(cfg, 'utf8')); } catch { throw new InputError(`unparsable ${cfg}`); }
    Object.assign(out, data.budgets || {});
  }
  for (const k of Object.keys(BUDGET_DEFAULTS)) {
    const f = flags[k.replace(/_/g, '-')];
    if (f !== undefined) out[k] = Number(f);
  }
  for (const [k, v] of Object.entries(out)) {
    if (!(k in BUDGET_DEFAULTS)) throw new InputError(`unknown budget ${k}`);
    if (k === 'max_tokens' && v == null) continue;
    if (!Number.isFinite(v) || v <= 0) throw new InputError(`budget ${k} must be a positive number`);
    if (BUDGET_DEFAULTS[k] != null && v > BUDGET_DEFAULTS[k]) throw new InputError(`budget ${k}=${v} exceeds the ceiling ${BUDGET_DEFAULTS[k]}; budgets are lowered, never raised`);
  }
  return out;
}

function counters(flags) {
  const out = {};
  for (const k of ['turns', 'tokens']) {
    if (flags[k] === undefined) continue;
    const n = Number(flags[k]);
    if (!Number.isInteger(n) || n < 0) throw new InputError(`--${k} must be a non-negative integer`);
    out[k] = n;
  }
  return out;
}

function open(flags) {
  const id = need(flags, 'run');
  if (!RUN_ID.test(id)) throw new InputError(`bad run id "${id}" (lowercase letters, digits, hyphens; ≤ 41 chars)`);
  if (!isRepo()) throw new InputError('not inside a git repository');
  const root = topLevel();
  const path = ledgerPath(root, id);
  const events = loadLedger(path);
  return { id, root, path, events, st: deriveState(events) };
}

// Test-stage review-fix rounds on the PR come after the Build run finishes; they stay recordable.
const prReview = (flags) => String(flags.task) === 'PR' && (flags.loop === undefined || String(flags.loop) === 'review-fix');

function guardOpen(ctx, out, { afterFinish = false } = {}) {
  if (ctx.st.finish && !afterFinish) return out({ ok: false, code: EXIT.FAIL, lines: [`run ${ctx.id} is finished (${ctx.st.finish.status})`] });
  if (ctx.st.halt) {
    return out({ ok: false, code: EXIT.BOUND, lines: [`HALTED (${ctx.st.halt.reason}): ${ctx.st.halt.detail}`, `status NEEDS_HUMAN · a human resumes with: run-ledger resume --run ${ctx.id} --ack "<name>: <decision>"`] });
  }
  return null;
}

function haltNow(ctx, reason, detail, out, extra = []) {
  const e = appendEvent(ctx.path, ctx.events, { type: 'halt', reason, detail });
  if (ctx.st.finish) rearchive(ctx);
  return out({
    ok: false, code: EXIT.BOUND, result: { halt: e },
    lines: [...extra, `HALT ${reason}: ${detail}`, `run status NEEDS_HUMAN${reason === 'budget' ? ' (result BLOCKED: budget)' : ''} · stop now; report to a human`],
  });
}

function budgetGuard(ctx, out, opts) {
  const { over } = budgetUse(ctx.st, ctx.events, opts);
  return over.length ? haltNow(ctx, 'budget', over.join('; '), out) : null;
}

function cmdStart(flags, out) {
  const id = need(flags, 'run');
  if (!RUN_ID.test(id)) throw new InputError(`bad run id "${id}"`);
  const mode = flags.mode ? String(flags.mode) : 'attended';
  if (!['attended', 'unattended'].includes(mode)) throw new InputError('--mode is attended or unattended');
  if (!isRepo()) throw new InputError('not inside a git repository');
  const root = topLevel();
  const planArg = need(flags, 'plan', 'path to plan.md; Quick path has no run: keep loop rows by hand in the PR, references/loops.md §3');
  const planAbs = resolve(planArg);
  if (!existsSync(planAbs)) throw new InputError(`plan not found: ${planArg}`);
  const planRel = relative(root, planAbs).split('\\').join('/');
  const { tasks } = readPlanTasks(readMarkdownFile(planAbs));
  const budgets = readBudgets(root, flags);
  const approvals = approvalState(planAbs);
  if (mode === 'unattended') {
    const missing = [];
    if (!approvals.plan.valid) missing.push('Design sign-off missing or hash void');
    if (!approvals.spec) missing.push('spec.md missing (unattended mode runs Standard/Full items only)');
    else if (!approvals.spec.valid) missing.push('Specify sign-off missing or hash void');
    if (missing.length) return out({ ok: false, code: EXIT.FAIL, lines: ['REFUSED: unattended mode starts only after valid Specify and Design sign-offs', ...missing.map((m) => `- ${m}`)] });
  }
  if (tasks.length > budgets.max_tasks) {
    return out({ ok: false, code: EXIT.BOUND, lines: [`BOUND: plan has ${tasks.length} tasks > max_tasks ${budgets.max_tasks}; split the plan into runs of ≤ ${budgets.max_tasks} tasks`] });
  }
  const base = git(['rev-parse', flags.base ? String(flags.base) : 'HEAD'], { cwd: root }).trim();
  let ledgerRoot = root;
  let worktree = null;
  let branch = currentBranch(root);
  if (mode === 'unattended') {
    const nnn = (basename(dirname(planAbs)).match(/^(\d{3})/) || [])[1] || 'run';
    branch = `sdlc/${nnn}-${id}`;
    worktree = join(dirname(root), `${basename(root)}-sdlc-${id}`);
    if (existsSync(worktree)) return out({ ok: false, code: EXIT.FAIL, lines: [`isolation failed: ${worktree} already exists`] });
    try {
      git(['worktree', 'add', '-q', '-b', branch, worktree, base], { cwd: root });
    } catch (e) {
      return out({ ok: false, code: EXIT.FAIL, lines: [`isolation failed: ${e.message}`] });
    }
    if (!existsSync(join(worktree, planRel))) {
      return out({ ok: false, code: EXIT.FAIL, lines: [`isolation failed: ${planRel} is not committed at ${base.slice(0, 12)}; commit the approved plan first`] });
    }
    ledgerRoot = worktree;
  }
  const path = ledgerPath(ledgerRoot, id);
  if (existsSync(path)) return out({ ok: false, code: EXIT.FAIL, lines: [`run ${id} exists; use: run-ledger resume --run ${id}`] });
  ensureRunsDir(ledgerRoot);
  mkdirSync(runDir(ledgerRoot, id), { recursive: true });
  const events = [];
  const e = appendEvent(path, events, {
    type: 'start', run: id, mode, plan: planRel, spec: approvals.spec ? relative(root, approvals.spec.path).split('\\').join('/') : null,
    base, branch, worktree: worktree ? relative(root, worktree).split('\\').join('/') : null,
    hashes: { plan: approvals.plan.hash, spec: approvals.spec ? approvals.spec.hash : null },
    budgets, tasks: tasks.map((t) => ({ id: t.id, blockedBy: t.blockedBy })), ...counters(flags),
  });
  return out({
    ok: true, result: { event: e, ledger: path, worktree },
    lines: [
      `run ${id} started (${mode}) · ${tasks.length} tasks · branch ${branch}${worktree ? ` · worktree ${worktree}` : ''}`,
      `ledger ${path}`,
      `next: ${worktree ? `cd "${worktree}" && ` : ''}node preflight.mjs --run ${id} --plan ${planRel}${mode === 'unattended' ? ' --mode unattended' : ''}`,
    ],
  });
}

function cmdTask(flags, out) {
  const ctx = open(flags);
  const blocked = guardOpen(ctx, out);
  if (blocked !== null) return blocked;
  const id = need(flags, 'task');
  const state = need(flags, 'state', 'started | done | blocked');
  const t = ctx.st.tasks.get(id);
  if (!t || !ctx.st.start.tasks.some((x) => x.id === id)) return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is not a task of the approved plan (scope = approved tasks only)`] });
  if (flags['no-red'] !== undefined && state !== 'done') throw new InputError('--no-red applies only to --state done');
  const fields = { type: 'task', task: id, state, ...counters(flags) };
  if (state === 'started') {
    if (!ctx.st.preflightFresh) return out({ ok: false, code: EXIT.FAIL, lines: [`no passing preflight since the last start/resume/env failure; run preflight --run ${ctx.id}`] });
    if (CLOSED.has(t.state)) return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is ${t.state}`] });
    const waiting = t.blockedBy.filter((b) => ctx.st.tasks.get(b)?.state !== 'done');
    if (waiting.length) return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is blocked by ${waiting.join(', ')} (not done)`] });
    const g = budgetGuard(ctx, out, { addTask: ctx.st.started.has(id) ? 0 : 1 });
    if (g !== null) return g;
  } else if (state === 'done') {
    if (t.state !== 'started') return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is ${t.state}, not started`] });
    if (t.escalation) return out({ ok: false, code: EXIT.BOUND, lines: [`${id} awaits a ruling on ${t.escalation.breaker}`] });
    const last = t.rounds[t.rounds.length - 1];
    if (last && last.result !== 'pass') return out({ ok: false, code: EXIT.FAIL, lines: [`${id}: last round (${last.loop} r${last.round}) failed; done needs a passing round`] });
    if (!t.red.length) {
      if (!flags['no-red'] || flags['no-red'] === true) return out({ ok: false, code: EXIT.FAIL, lines: [`${id}: no red output recorded → task not done (references/tdd.md). Record it with: run-ledger red`, 'A task that changes no executable behaviour passes --no-red "<reason>"; the Reviewer checks that reason.'] });
      fields.noRed = String(flags['no-red']);
    }
    fields.commit = flags.commit ? String(flags.commit) : headSha(ctx.root);
  } else if (state === 'blocked') {
    fields.note = need(flags, 'note', 'what blocks the task and what unblocks it');
  } else {
    throw new InputError('--state is started, done or blocked');
  }
  if (flags.note && !fields.note) fields.note = String(flags.note);
  const e = appendEvent(ctx.path, ctx.events, fields);
  const st = deriveState(ctx.events);
  return out({ ok: true, result: { event: e, next: nextTask(st) }, lines: [`${id} → ${state}`, `next task: ${nextTask(st) || 'none'}`] });
}

function cmdRed(flags, out) {
  const ctx = open(flags);
  const blocked = guardOpen(ctx, out);
  if (blocked !== null) return blocked;
  const id = need(flags, 'task');
  const t = ctx.st.tasks.get(id);
  if (!t || t.state !== 'started') return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is not started`] });
  const e = appendEvent(ctx.path, ctx.events, {
    type: 'red', task: id, test: need(flags, 'test', 'test name with its AC-n'), signature: need(flags, 'signature', 'first failing line'), ...counters(flags),
  });
  const warn = /\bAC-\d+\b|\bCHAR-\d+\b|\bBUG\b|#\d+/i.test(e.test) ? [] : ['concern: test name states no AC-n, CHAR-n or bug ID (references/tdd.md rule 4)'];
  return out({ ok: true, result: { event: e, concerns: warn }, lines: [`${id} red recorded: ${e.test}`, ...warn] });
}

function cmdRound(flags, out) {
  const ctx = open(flags);
  const blocked = guardOpen(ctx, out, { afterFinish: prReview(flags) });
  if (blocked !== null) return blocked;
  const id = need(flags, 'task');
  const loop = need(flags, 'loop', Object.keys(LOOP_BOUNDS).join(' | '));
  if (!(loop in LOOP_BOUNDS)) throw new InputError(`--loop is one of ${Object.keys(LOOP_BOUNDS).join(', ')}`);
  const result = need(flags, 'result', 'pass | fail');
  if (!['pass', 'fail'].includes(result)) throw new InputError('--result is pass or fail');
  if (id === 'PR' && loop !== 'review-fix') throw new InputError('task PR is used only by the review-fix loop');
  if (id !== 'PR' && !ctx.st.start.tasks.some((x) => x.id === id)) return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is not a task of the approved plan`] });
  const t = ctx.st.tasks.get(id) || newTask(id);
  const reviewable = loop === 'review-fix' && t.state === 'done';
  if (id !== 'PR' && t.state !== 'started' && !reviewable) return out({ ok: false, code: EXIT.FAIL, lines: [`${id} is ${t.state}, not started${loop === 'review-fix' ? ' or done' : ''}`] });
  if (t.escalation) return out({ ok: false, code: EXIT.BOUND, lines: [`${id} awaits a ruling on ${t.escalation.breaker} (${t.escalation.why}); no further rounds`] });
  if (loop === 'red-green' && t.inDebug) return out({ ok: false, code: EXIT.BOUND, lines: [`${id}: red-green bound reached; run the debug loop until a test proves the root cause`] });
  if (!ctx.st.finish && !ctx.st.preflightFresh) return out({ ok: false, code: EXIT.FAIL, lines: [`no passing preflight since the last start/resume/env failure; run preflight --run ${ctx.id}`] });
  // Build budgets end with the run; after finish no halt is written, because a finished run cannot be resumed.
  const g = ctx.st.finish ? null : budgetGuard(ctx, out);
  if (g !== null) return g;
  const fields = { type: 'round', task: id, loop, result, ...counters(flags) };
  if (result === 'fail') {
    fields.signature = need(flags, 'signature', 'first failing test + error line');
    fields.cause = need(flags, 'cause', CAUSES.join(' | '));
    if (!CAUSES.includes(fields.cause)) throw new InputError(`--cause is one of ${CAUSES.join(', ')}`);
    fields.tried = need(flags, 'tried', 'what this round changed or which hypothesis it tested');
    const dup = t.rounds.find((r) => r.loop === loop && r.tried && norm(r.tried) === norm(fields.tried));
    if (dup) return out({ ok: false, code: EXIT.FAIL, lines: [`${id}: "${fields.tried}" was already tried in ${dup.loop} round ${dup.round}; read the ledger and change the approach`] });
  } else {
    if (flags.signature) fields.signature = String(flags.signature);
    if (flags.tried) fields.tried = String(flags.tried);
    fields.cause = flags.cause ? String(flags.cause) : null;
  }
  fields.round = t.rounds.filter((r) => r.loop === loop).length + 1;
  const verdict = evaluateRound(ctx.st, t, fields);
  if (verdict?.transition) fields.transition = verdict.transition;
  else if (verdict) fields.escalation = verdict;
  const e = appendEvent(ctx.path, ctx.events, fields);
  if (ctx.st.finish) rearchive(ctx);
  const st = deriveState(ctx.events);
  const tt = st.tasks.get(id);
  const lines = [`${id} ${loop} round ${e.round}: ${result}${e.cause ? ` · cause ${e.cause} → ${ROUTES[e.cause]}` : ''}`];
  if (result === 'fail' && e.cause === 'env') lines.push('env cause: re-run preflight before the next round');
  if (result === 'fail' && !verdict) lines.push(`scoped re-check next: the failing check + mapped tests of touched files; full DoD only at loop exit (references/loops.md §Scoped re-check)`);
  if (verdict?.transition) return out({ ok: false, code: EXIT.BOUND, result: { event: e }, lines: [...lines, `BOUND: ${verdict.why}. Next: debug loop — state a hypothesis, prove it with a test (≤ ${LOOP_BOUNDS.debug} refuted hypotheses)`] });
  if (verdict) {
    const brief = escalationBrief(st, tt, e);
    if (ctx.st.start.mode === 'unattended' && !ctx.st.finish) {
      const reason = verdict.breaker === 'B6' ? 'spec-design-cause' : 'loop-bound';
      return haltNow({ ...ctx, events: ctx.events }, reason, `${id} ${verdict.breaker}: ${verdict.why}`, out, brief);
    }
    return out({ ok: false, code: EXIT.BOUND, result: { event: e, escalation: verdict }, lines: [...lines, ...brief] });
  }
  return out({ ok: true, result: { event: e }, lines });
}

function cmdRuling(flags, out) {
  const ctx = open(flags);
  if (ctx.st.finish && !prReview(flags)) return out({ ok: false, code: EXIT.FAIL, lines: ['run is finished; only PR review-fix rounds and rulings are recorded after finish'] });
  const id = need(flags, 'task');
  const t = ctx.st.tasks.get(id);
  if (!t || !t.escalation) return out({ ok: false, code: EXIT.FAIL, lines: [`${id} has no open escalation`] });
  const decision = need(flags, 'decision', RULINGS.join(' | '));
  const allowed = BREAKERS[t.escalation.breaker].allowed;
  if (!allowed.includes(decision)) return out({ ok: false, code: EXIT.FAIL, lines: [`ruling "${decision}" is not allowed at ${t.escalation.breaker} ${BREAKERS[t.escalation.breaker].name}; allowed: ${allowed.join(', ')}`] });
  const by = need(flags, 'by', '"<role: name>" of the human ruling');
  const note = decision === 'continue' ? need(flags, 'note', 'the new approach') : (flags.note ? String(flags.note) : '');
  const e = appendEvent(ctx.path, ctx.events, { type: 'ruling', task: id, breaker: t.escalation.breaker, decision, by, note });
  if (ctx.st.finish) rearchive(ctx);
  return out({ ok: true, result: { event: e }, lines: [`${id} ruling ${decision} by ${by} on ${e.breaker}`] });
}

function cmdHalt(flags, out) {
  const ctx = open(flags);
  if (ctx.st.finish) return out({ ok: false, code: EXIT.FAIL, lines: ['run is finished'] });
  const reason = need(flags, 'reason', HALT_REASONS.join(' | '));
  if (!HALT_REASONS.includes(reason)) throw new InputError(`--reason is one of ${HALT_REASONS.join(', ')}`);
  return haltNow(ctx, reason, need(flags, 'detail'), out);
}

// Acceptance-test files belong to the Test Engineer, not to a task: the File column of the
// ## Map table in specs/NNN-slug/acceptance-tests.md counts as in-plan.
export function acceptanceTestFiles(specDirAbs) {
  const p = join(specDirAbs, 'acceptance-tests.md');
  if (!existsSync(p)) return [];
  const map = findSection(readMarkdownFile(p), 'Map');
  if (!map) return [];
  const t = parseTables(map.body)[0];
  const col = t ? t.header.findIndex((h) => /^file$/i.test(h.trim())) : -1;
  if (col < 0) return [];
  return t.rows.map((r) => String(r[col] || '').replace(/`/g, '').trim()).filter((f) => f && !f.startsWith('<'));
}

function cmdCheck(flags, out) {
  const ctx = open(flags);
  const blocked = guardOpen(ctx, out);
  if (blocked !== null) return blocked;
  const { start } = ctx.st;
  const planAbs = join(ctx.root, start.plan);
  if (!existsSync(planAbs)) throw new InputError(`plan not found: ${start.plan}`);
  const { tasks } = readPlanTasks(readMarkdownFile(planAbs));
  const specDir = dirname(start.plan);
  const changed = changedSince(ctx.root, start.base).filter((f) => !f.startsWith('.agentic-sdlc/') && !f.startsWith(`${specDir}/`));
  const planFiles = tasks.some((t) => t.files) ? [...tasks.flatMap((t) => t.files || []), ...acceptanceTestFiles(join(ctx.root, specDir))] : null;
  const findings = { changed: changed.length, outOfPlan: [], dependency: [], secrets: [], approvals: null, budget: null };
  const halts = [];
  if (planFiles) {
    findings.outOfPlan = changed.filter((f) => !inPlan(f, planFiles));
    if (findings.outOfPlan.length > OUT_OF_PLAN_LIMIT) halts.push(['out-of-plan-files', `${findings.outOfPlan.length} files outside plan Files (> ${OUT_OF_PLAN_LIMIT}): ${findings.outOfPlan.slice(0, 8).join(', ')}`]);
  }
  findings.dependency = changed.filter((f) => (MANIFESTS.has(basename(f)) || /^requirements.*\.txt$/.test(basename(f)) || /\.csproj$/.test(f)) && !(planFiles && planFiles.some((p) => p === f || (p.includes('*') && globToRe(p).test(f)))));
  if (findings.dependency.length) halts.push(['dependency-added', `dependency manifest changed outside plan Files: ${findings.dependency.join(', ')} (Design sign-off note required, references/rules.md rule 10)`]);
  findings.secrets = scanSecrets(ctx.root, start.base);
  if (findings.secrets.length) halts.push(['secret-detected', findings.secrets.map((s) => `${s.file}:${s.line} (${s.pattern})`).join(', ')]);
  const appr = approvalState(planAbs);
  const specChanged = start.hashes.spec && appr.spec && specHashOf(readMarkdownFile(appr.spec.path)) !== start.hashes.spec;
  const planChanged = planHashOf(readMarkdownFile(planAbs)) !== start.hashes.plan;
  findings.approvals = { specChanged: !!specChanged, planChanged };
  if (specChanged || planChanged) halts.push(['approval-void', `${[specChanged && 'spec.md', planChanged && 'plan.md'].filter(Boolean).join(' and ')} changed since run start; approval void → change protocol (references/rules.md)`]);
  const budget = budgetUse(ctx.st, ctx.events);
  findings.budget = budget;
  if (budget.over.length) halts.push(['budget', budget.over.join('; ')]);
  appendEvent(ctx.path, ctx.events, { type: 'check', findings: { ...findings, secrets: findings.secrets.map(({ file, line, pattern }) => ({ file, line, pattern })) }, ...counters(flags) });
  const concerns = findings.outOfPlan.length && findings.outOfPlan.length <= OUT_OF_PLAN_LIMIT ? [`concern: ${findings.outOfPlan.length} file(s) outside plan Files: ${findings.outOfPlan.join(', ')} — list them in the task report`] : [];
  if (!planFiles) concerns.push('concern: plan lists no Files column; out-of-plan check not run, every manifest change halts');
  if (halts.length) {
    const [reason, detail] = halts[0];
    const extra = halts.slice(1).map(([r, d]) => `also: ${r}: ${d}`);
    return haltNow(ctx, reason, detail, out, [...concerns, ...extra]);
  }
  return out({ ok: true, result: { findings, concerns }, lines: [`check OK · ${changed.length} changed file(s) · budgets ${JSON.stringify(budget.use)}`, ...concerns] });
}

function cmdResume(flags, out) {
  const id = need(flags, 'run');
  if (!isRepo()) throw new InputError('not inside a git repository');
  let ctx;
  try {
    ctx = open(flags);
  } catch (e) {
    if (e instanceof InputError) throw new InputError(`${e.message} → run status NEEDS_HUMAN; repair or restore the ledger from git history before resuming`);
    throw e;
  }
  if (ctx.st.finish) return out({ ok: false, code: EXIT.FAIL, lines: [`run ${id} is finished (${ctx.st.finish.status})`] });
  if (ctx.st.halt && (!flags.ack || flags.ack === true)) {
    return out({ ok: false, code: EXIT.BOUND, lines: [`HALTED (${ctx.st.halt.reason}): ${ctx.st.halt.detail}`, 'a human acknowledges the halt and its resolution: --ack "<name>: <decision>"'] });
  }
  const e = appendEvent(ctx.path, ctx.events, { type: 'resume', ack: flags.ack && flags.ack !== true ? String(flags.ack) : null, ...counters(flags) });
  const st = deriveState(ctx.events);
  const n = nextTask(st);
  return out({
    ok: true, result: { event: e, next: n },
    lines: [
      `run ${id} resumed · next task: ${n || 'none'} (first task not done)`,
      ...[...st.tasks.values()].filter((t) => t.escalation).map((t) => `${t.id} awaits a ruling on ${t.escalation.breaker} (${t.escalation.why}) from ${t.escalation.target}`),
      `run preflight --run ${id} before starting ${n || 'the next step'}`,
    ],
  });
}

function summarize(st, events) {
  const tasks = [...st.tasks.values()].map((t) => ({
    // PR has no task lifecycle: show the state of its review-fix loop instead of "pending".
    id: t.id, state: t.id === 'PR' ? (t.rounds.at(-1)?.result === 'pass' ? 'passed' : 'open') : t.state,
    rounds: t.rounds.length, red: t.red.length > 0 || !!t.noRed,
    // Only an open failure is shown; a later passing round clears it.
    lastSignature: t.rounds.at(-1)?.result === 'fail' ? t.rounds.at(-1).signature || null : null,
    escalation: t.escalation ? `${t.escalation.breaker} → ${t.escalation.target}` : null, commit: t.commit,
  }));
  const budget = budgetUse(st, events);
  return {
    run: st.start.run, mode: st.start.mode, plan: st.start.plan, branch: st.start.branch, worktree: st.start.worktree,
    state: st.finish ? 'finished' : st.halt ? 'halted' : 'running', result: st.finish ? st.finish.status : null,
    halt: st.halt ? { reason: st.halt.reason, detail: st.halt.detail } : null,
    preflightFresh: st.preflightFresh, next: st.finish ? null : nextTask(st), tasks, budget,
  };
}

function loadFor(flags) {
  if (flags.ledger && flags.ledger !== true) {
    const events = loadLedger(resolve(String(flags.ledger)));
    return { events, st: deriveState(events) };
  }
  const ctx = open(flags);
  return { events: ctx.events, st: ctx.st };
}

function cmdStatus(flags, out) {
  const { events, st } = loadFor(flags);
  const s = summarize(st, events);
  const escalated = s.tasks.filter((t) => t.escalation);
  const code = s.state === 'halted' || escalated.length || (s.state === 'running' && s.budget.over.length) ? EXIT.BOUND : EXIT.PASS;
  const lines = [
    `run ${s.run} · ${s.mode} · ${s.state}${s.result ? ` · result ${s.result}` : ''} · branch ${s.branch}${s.worktree ? ` · worktree ${s.worktree}` : ''}`,
    ...s.tasks.map((t) => `  ${t.id.padEnd(4)} ${t.state.padEnd(9)} rounds ${t.rounds}${t.escalation ? ` · ESCALATED ${t.escalation}` : ''}${t.lastSignature ? ` · last failure: ${t.lastSignature}` : ''}`),
    `budgets used: ${JSON.stringify(s.budget.use)}${s.budget.over.length ? ` · OVER: ${s.budget.over.join('; ')}` : ''}`,
  ];
  if (s.halt) lines.push(`HALTED (${s.halt.reason}): ${s.halt.detail}`);
  if (s.state === 'running') lines.push(`next task: ${s.next || 'none'} · preflight ${s.preflightFresh ? 'fresh' : 'required'}`);
  return out({ ok: code === EXIT.PASS, code, result: s, lines });
}

const cell = (s) => String(s ?? '—').replace(/\|/g, '\\|').replace(/\n/g, ' ') || '—';

// Rows for plan.md "## Loop ledger" (templates/plan.md columns): one row per failed round, per round
// that fixed a failure, per ruling and per halt. Result: failed | fixed | escalated.
export function renderTable(events) {
  const rows = ['| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |', '|---|---|---|---|---|---|---|---|'];
  const lastFail = new Map();
  for (const e of events) {
    const date = String(e.ts).slice(0, 10);
    if (e.type === 'round') {
      const key = `${e.task}:${e.loop}`;
      if (e.result === 'pass') {
        const f = lastFail.get(key);
        if (!f) continue;
        lastFail.delete(key);
        rows.push(`| ${date} | ${e.task} | ${e.loop} | ${e.round} | ${cell(e.signature || f.signature)} | ${cell(e.cause || f.cause)} | ${cell(e.tried)} | fixed |`);
        continue;
      }
      lastFail.set(key, e);
      const res = e.escalation ? `escalated — ${e.escalation.breaker} → ${e.escalation.target}: ${e.escalation.why}` : e.transition ? 'failed → debug loop' : 'failed';
      rows.push(`| ${date} | ${e.task} | ${e.loop} | ${e.round} | ${cell(e.signature)} | ${cell(e.cause)} | ${cell(e.tried)} | ${cell(res)} |`);
    } else if (e.type === 'ruling') {
      rows.push(`| ${date} | ${e.task} | ruling | — | — | — | ${cell(e.note)} | ${cell(`${e.decision} by ${e.by} (${e.breaker})`)} |`);
    } else if (e.type === 'halt') {
      rows.push(`| ${date} | — | halt | — | ${cell(e.detail)} | — | — | ${cell(`HALT ${e.reason}`)} |`);
    }
  }
  return rows.join('\n');
}

function cmdRender(flags, out) {
  const { events } = loadFor(flags);
  const table = renderTable(events);
  return out({ ok: true, result: { markdown: table }, lines: [table] });
}

// After finish, keep specs/NNN-slug/run-ledger.jsonl equal to the live ledger.
function rearchive(ctx) {
  const archive = join(ctx.root, dirname(ctx.st.start.plan), 'run-ledger.jsonl');
  if (existsSync(archive)) copyFileSync(ctx.path, archive);
}

function cmdFinish(flags, out) {
  const ctx = open(flags);
  if (ctx.st.finish) return out({ ok: false, code: EXIT.FAIL, lines: [`run ${ctx.id} is already finished (${ctx.st.finish.status})`] });
  const { st } = ctx;
  const planTasks = st.start.tasks.map((t) => st.tasks.get(t.id));
  let status;
  let reason;
  if (st.halt) {
    status = st.halt.reason === 'budget' ? 'BLOCKED' : 'NEEDS_HUMAN';
    reason = `${st.halt.reason === 'budget' ? 'budget: ' : `halt ${st.halt.reason}: `}${st.halt.detail}`;
  } else if ([...st.tasks.values()].some((t) => t.escalation)) {
    status = 'NEEDS_HUMAN';
    reason = `awaiting ruling: ${[...st.tasks.values()].filter((t) => t.escalation).map((t) => `${t.id} ${t.escalation.breaker}`).join(', ')}`;
  } else if (planTasks.every((t) => t.state === 'done' && t.rounds.at(-1)?.result !== 'fail') && st.tasks.get('PR')?.rounds.at(-1)?.result !== 'fail') {
    status = 'DONE';
    reason = `${planTasks.length} of ${planTasks.length} tasks done`;
  } else {
    status = 'BLOCKED';
    const lp = st.lastPreflight;
    const open = [...st.tasks.values()].filter((t) => t.rounds.at(-1)?.result === 'fail').map((t) => `${t.id} ${t.rounds.at(-1).loop} r${t.rounds.at(-1).round} failed`);
    const notDone = planTasks.filter((t) => t.state !== 'done').map((t) => `${t.id}=${t.state}`);
    reason = lp && !lp.ok ? `preflight failed: ${(lp.failed || []).join(', ')}` : [notDone.length && `tasks not done: ${notDone.join(', ')}`, open.length && `open failures: ${open.join(', ')}`].filter(Boolean).join('; ');
  }
  // finish is terminal: a BLOCKED result with no halt behind it (tasks still open, preflight red) needs explicit consent.
  if (status === 'BLOCKED' && !st.halt && !flags['confirm-blocked']) {
    return out({ ok: false, code: EXIT.FAIL, lines: [`REFUSED: finish would close the run as BLOCKED (${reason}); the run stays open`, 'finish the open tasks, or pass --confirm-blocked to close it for good (a new run starts over)'] });
  }
  const specDir = join(ctx.root, dirname(st.start.plan));
  const archive = join(specDir, 'run-ledger.jsonl');
  const e = appendEvent(ctx.path, ctx.events, { type: 'finish', status, reason, ...counters(flags) });
  const s = summarize(deriveState(ctx.events), ctx.events);
  const resultPath = join(runDir(ctx.root, ctx.id), 'result.json');
  const result = {
    v: 1, run: ctx.id, status, reason, finished: e.ts, mode: st.start.mode, branch: st.start.branch, base: st.start.base, head: headSha(ctx.root),
    tasks: s.tasks.map(({ id, state, rounds, commit, red }) => ({ id, state, rounds, commit, red })),
    budgets: s.budget.use, evidence: { ledger: relative(ctx.root, archive).split('\\').join('/'), preflight: st.lastPreflight ? { ok: st.lastPreflight.ok, seq: st.lastPreflight.seq } : null },
  };
  writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  if (existsSync(specDir)) copyFileSync(ctx.path, archive);
  const code = { DONE: EXIT.PASS, BLOCKED: EXIT.FAIL, NEEDS_HUMAN: EXIT.BOUND }[status];
  return out({ ok: code === EXIT.PASS, code, result, lines: [`run ${ctx.id} finished: ${status} — ${reason}`, `result ${resultPath}`, `ledger archived to ${archive}`] });
}

const HELP = `run-ledger — progress ledger, loop bounds, halts and budgets for Build runs

Usage: node run-ledger.mjs <command> [options] [--json]

Commands
  start   --run <id> --plan <specs/NNN-slug/plan.md> [--mode attended|unattended] [--base <ref>]
          [--max-tasks N --max-rounds N --max-hours N --max-turns N --max-tokens N]
          Unattended: refuses without valid Specify and Design sign-offs; creates worktree
          ../<repo>-sdlc-<id> on branch sdlc/NNN-<id>.
  task    --run <id> --task Tn --state started|done|blocked [--note <text>] [--no-red <reason>] [--commit <sha>]
  red     --run <id> --task Tn --test "<AC-n test name>" --signature "<first failing line>"
  round   --run <id> --task Tn|PR --loop red-green|build-test|review-fix|debug --result pass|fail
          [--signature <text> --cause spec|design|plan|code|test|env|unknown --tried <text>] (required on fail)
  ruling  --run <id> --task Tn|PR --decision continue|reroute|split|handover|drop --by "<role: name>" [--note <text>]
  halt    --run <id> --reason <${HALT_REASONS.join('|')}> --detail <text>
  check   --run <id>     halt checks at each task boundary (files, dependencies, secrets, approvals, budgets)
  resume  --run <id> [--ack "<name>: <decision>"]   (--ack required after a halt)
  status  --run <id> | --ledger <file>
  render  --run <id> | --ledger <file>   Markdown loop-ledger table for plan.md and the PR
  finish  --run <id> [--confirm-blocked]  writes result.json, archives the ledger to specs/NNN-slug/run-ledger.jsonl;
                         a BLOCKED close with open tasks and no halt needs --confirm-blocked

Every command accepts --turns N and --tokens N (cumulative agent counters) for budgets.
Bounds: red-green 3 · build-test 5 · review-fix 3 · debug 3 · anti-thrash: same signature twice or 3 failed fixes.
Budgets (ceilings): 15 tasks · 5 rounds/task · 4 active hours · 300 agent turns · tokens when configured.
Ledger: .agentic-sdlc/runs/<id>/ledger.jsonl (JSON Lines, append-only). SDLC_NOW overrides the clock (tests).
Exit: 0 pass · 1 check failed · 2 input missing or ledger corrupt · 3 bound reached, halt or escalation.`;

export async function main(argv = process.argv.slice(2), stdout = process.stdout) {
  const { flags, positional } = parseArgs(argv, { booleans: ['json', 'help', 'confirm-blocked'] });
  const cmd = positional[0];
  if (flags.help || !cmd) {
    stdout.write(HELP + '\n');
    return flags.help ? EXIT.PASS : EXIT.INPUT;
  }
  const out = (r) => report({ ...r, json: !!flags.json }, stdout);
  const commands = { start: cmdStart, task: cmdTask, red: cmdRed, round: cmdRound, ruling: cmdRuling, halt: cmdHalt, check: cmdCheck, resume: cmdResume, status: cmdStatus, render: cmdRender, finish: cmdFinish };
  if (!commands[cmd]) throw new InputError(`unknown command ${cmd} (see --help)`);
  return commands[cmd](flags, out);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) run(() => main());
