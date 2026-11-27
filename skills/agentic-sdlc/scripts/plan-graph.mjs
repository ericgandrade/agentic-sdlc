#!/usr/bin/env node
// plan-graph — mechanism 7.2 of the Agentic SDLC (Design stage).
// Parses the `## Tasks` table of specs/NNN-slug/plan.md into a DAG, detects cycles, unknown
// dependencies and AC gaps, computes waves (frontiers), serializes same-wave tasks whose Files
// overlap, checks that each task whose Adds cell names a component, data model or integration has a
// ## Decisions row (Standard/Full; an ADR link on Full), and writes graph.json. Node >= 18, no dependencies.
// Exit codes: 0 pass · 1 check failed · 2 input missing or unparsable.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import {
  contentHash, countWords, findSection, normalize, parseTables, readMarkdownFile, stripSection,
} from './lib/md.mjs';
import { log as gitLog, refsFromMessage } from './lib/git.mjs';

export const LIMITS = Object.freeze({
  maxTasks: 15,
  maxTaskHours: 8,
  maxParallel: 3,
  combinedReviewMaxTasks: 5,
  words: { Standard: 3000, Full: 6000 },
});

const REQUIRED_COLUMNS = ['ID', 'Title', 'AC', 'Blocked by', 'Files', 'Size'];
const HASH_EXCLUDE = ['Approvals', 'Loop ledger'];
const NONE = /^(—|–|-|none|n\/a)?$/i;
const TASK_ID = /^T\d+$/;
const ADDS_KIND = /^(component|data[ -]model|integration)$/i;
const DECISION_COLUMNS = ['ID', 'Decision', 'Task(s)', 'Options considered', 'ADR'];
const ADR_LINK = /\bdocs\/adr\/\d{4}-[\w.-]+\.md\b/i;

const USAGE = `Usage: plan-graph <plan.md> [options]

Builds the task graph of an Agentic SDLC plan (specs/NNN-slug/plan.md).

Options:
  --spec <path>        spec.md to cross-check AC IDs (default: spec.md next to the plan)
  --no-spec            standalone plan without a spec (skips AC existence and coverage checks)
  --write              write graph.json next to the plan (or to --out)
  --out <path>         graph.json destination
  --check              fail when the committed graph.json differs from the regenerated graph
                       (every run also fails a task whose Adds cell has no ## Decisions row)
  --check-approval     fail unless ## Approvals holds a valid row for the current plan and spec hashes,
                       matching the approvals.md register row when that file exists next to the plan
  --done T1,T2         tasks already committed
  --from-git <range>   mark tasks done from "Refs: Tn" commit trailers in a git range (e.g. main..HEAD)
  --max-parallel <n>   frontier size, 1-3 (default 3)
  --json               machine-readable result
  --help               this text

Exit codes: 0 pass · 1 check failed · 2 input missing or unparsable.`;

// Plan hash: the approval binding. Loop ledger rows are appended during Build and never void approval.
export function planHash(md) {
  return contentHash(md, { exclude: HASH_EXCLUDE });
}

function idNum(id) {
  return Number(String(id).slice(1));
}

function byId(a, b) {
  return idNum(a) - idNum(b);
}

export function parseFiles(cell) {
  const ticks = [...String(cell).matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  const raw = ticks.length ? ticks : String(cell).split(/,|;|<br\s*\/?>/i);
  return [...new Set(raw.map((f) => f.trim().replace(/^\.\//, '')).filter((f) => f && !NONE.test(f)))];
}

// "4h", "1d", "0.5d", "90m" → hours; null when unparsable.
export function parseSize(cell) {
  const m = String(cell).trim().match(/^(\d+(?:\.\d+)?)\s*(h|hours?|d|days?|m|min|minutes?)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2][0].toLowerCase();
  if (unit === 'd') return n * 8;
  if (unit === 'm') return n / 60;
  return n;
}

function parsePathOf(md) {
  const m = md.match(/\bPath:\**\s*(Quick|Standard|Full)\b/i);
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : null;
}

function headerIndex(header) {
  const idx = {};
  header.forEach((h, i) => { idx[h.replace(/\*/g, '').trim().toLowerCase()] = i; });
  return idx;
}

// Parses plan.md. Throws InputError when the Tasks section or a required column is missing.
export function parsePlan(md) {
  const text = stripComments(md);
  const section = findSection(text, 'Tasks', { level: 2 });
  if (!section) throw new InputError('plan has no "## Tasks" section');
  const table = parseTables(section.body)[0];
  if (!table) throw new InputError('"## Tasks" holds no table');
  const idx = headerIndex(table.header);
  const missing = REQUIRED_COLUMNS.filter((c) => idx[c.toLowerCase()] == null);
  if (missing.length) throw new InputError(`"## Tasks" table lacks column(s): ${missing.join(', ')}`);
  const cell = (row, col) => (row[idx[col.toLowerCase()]] ?? '').trim();
  const hasAdds = idx.adds != null;
  const tasks = table.rows.map((row, i) => {
    const blockedCell = cell(row, 'Blocked by');
    return {
      ...(hasAdds ? { adds: parseAdds(cell(row, 'Adds')) } : {}),
      row: i + 1,
      id: cell(row, 'ID').replace(/\*/g, ''),
      title: cell(row, 'Title'),
      acs: [...new Set(cell(row, 'AC').match(/\bAC-\d+\b/g) || [])],
      blockedBy: NONE.test(blockedCell) ? [] : [...new Set(blockedCell.split(/[\s,;]+/).filter(Boolean))],
      files: parseFiles(cell(row, 'Files')),
      sizeRaw: cell(row, 'Size'),
      sizeHours: parseSize(cell(row, 'Size')),
    };
  });
  return { tasks, path: parsePathOf(text), hash: planHash(md), hasAdds, decisions: parseDecisions(text) };
}

// "component, data model" → { raw, kinds, valid }; "—" or "none" → no kinds; an empty cell is invalid.
export function parseAdds(raw) {
  if (!raw) return { raw, kinds: [], valid: false };
  if (NONE.test(raw)) return { raw, kinds: [], valid: true };
  const kinds = raw.split(/[,;]/).map((k) => k.trim()).filter(Boolean);
  return { raw, kinds: kinds.map((k) => k.toLowerCase().replace('-', ' ')), valid: kinds.every((k) => ADDS_KIND.test(k)) };
}

// ## Decisions table rows, [] for a "none — <reason>" line, null without the section;
// { missing: [...] } when the table lacks a column.
function parseDecisions(text) {
  const sec = findSection(text, 'Decisions', { level: 2 });
  if (!sec) return null;
  const table = parseTables(sec.body)[0];
  if (!table) return [];
  const idx = headerIndex(table.header);
  const missing = DECISION_COLUMNS.filter((c) => idx[c.toLowerCase()] == null);
  if (missing.length) return { missing };
  const get = (row, col) => (row[idx[col.toLowerCase()]] ?? '').trim();
  return table.rows.map((row, i) => ({
    row: i + 1,
    id: get(row, 'ID').replace(/\*/g, ''),
    decision: get(row, 'Decision'),
    tasks: [...new Set(get(row, 'Task(s)').match(/\bT\d+\b/g) || [])],
    adr: get(row, 'ADR'),
  }));
}

// Decisions on Standard and Full (Quick has no plan): each task whose Adds cell names a component,
// data model or integration is covered by ≥ 1 ## Decisions row; on Full that row links an ADR.
function checkDecisions(plan, path, ids, err, warnings) {
  if (!plan.hasAdds) {
    warnings.push({ code: 'DECISIONS_UNKNOWN', message: '"## Tasks" has no Adds column; tasks adding a component, data model or integration cannot be checked for a ## Decisions row' });
    return;
  }
  const dec = plan.decisions || [];
  if (dec.missing) { err('DECISION_COLUMNS', `"## Decisions" table lacks column(s): ${dec.missing.join(', ')}`); return; }
  for (const d of dec) {
    const label = `## Decisions row ${d.row}`;
    if (!/^D-\d+$/.test(d.id)) err('DECISION_ROW', `${label}: ID "${d.id}" is not D-<n>`);
    if (!d.decision || NONE.test(d.decision)) err('DECISION_ROW', `${label}: Decision is empty`);
    if (!d.tasks.length) err('DECISION_ROW', `${label}: Task(s) names no task`);
    for (const t of d.tasks) if (!ids.has(t)) err('DECISION_ROW', `${label}: unknown task ${t}`);
  }
  for (const t of plan.tasks) {
    if (!TASK_ID.test(t.id)) continue;
    if (!t.adds.valid) { err('ADDS_INVALID', `${t.id} Adds "${t.adds.raw}" is not component, data model, integration or —`, t.id); continue; }
    if (!t.adds.kinds.length) continue;
    const rows = dec.filter((d) => d.tasks.includes(t.id));
    const what = t.adds.kinds.join(', ');
    if (!rows.length) err('DECISION_MISSING', `${t.id} adds ${what} but no ## Decisions row names it`, t.id);
    else if (path === 'Full' && !rows.some((d) => ADR_LINK.test(d.adr))) {
      err('DECISION_ADR', `${t.id} adds ${what}: on Full its decision row links an ADR (docs/adr/NNNN-slug.md)`, t.id);
    }
  }
}

function stripComments(md) {
  return normalize(md).replace(/<!--[\s\S]*?-->/g, '');
}

const acSort = (a, b) => Number(a.slice(3)) - Number(b.slice(3));

// Active AC IDs of a spec: rows of the "Acceptance criteria" table whose criterion is not
// "Retired in rev N: ..."; without such a table, every AC-n in that section (or in the whole spec
// minus Approvals and Revision log). HTML comments are ignored.
export function specAcIds(specMd) {
  const text = stripComments(specMd);
  const sec = findSection(text, /acceptance criteria/i);
  const table = sec && parseTables(sec.body)[0];
  if (table) {
    const ids = [];
    for (const row of table.rows) {
      const id = (row[0] || '').replace(/[*`]/g, '').trim();
      if (!/^AC-\d+$/.test(id)) continue;
      if (/^retired\b/i.test(row.slice(1).join(' ').trim())) continue;
      ids.push(id);
    }
    if (ids.length) return [...new Set(ids)].sort(acSort);
  }
  const scope = sec ? sec.body : stripSection(stripSection(text, 'Approvals'), 'Revision log');
  return [...new Set(scope.match(/\bAC-\d+\b/g) || [])].sort(acSort);
}

// "Path" of a spec header table (| Path | Standard |) or a "Path:" line; null when absent.
export function specPath(specMd) {
  const text = stripComments(specMd);
  const row = text.match(/^\|\s*Path\s*\|\s*(Quick|Standard|Full)\s*\|/im);
  return row ? row[1][0].toUpperCase() + row[1].slice(1).toLowerCase() : parsePathOf(text);
}

// Directory prefix of a Files entry: "src/api/" or the part of a glob before its first "*".
function prefixOf(p) {
  if (p.includes('*')) return p.slice(0, p.indexOf('*'));
  return p.endsWith('/') ? p : null;
}

// Paths shared by two Files lists (exact match, or one entry is a directory or glob covering the other).
function overlap(a, b) {
  const out = new Set();
  for (const x of a) {
    for (const y of b) {
      const px = prefixOf(x);
      const py = prefixOf(y);
      if (x === y) out.add(x);
      else if (px != null && y.startsWith(px)) out.add(y);
      else if (py != null && x.startsWith(py)) out.add(x);
    }
  }
  return [...out];
}

// Returns cycles as arrays of task IDs (first ID repeated at the end).
function findCycles(ids, deps) {
  const color = new Map(ids.map((id) => [id, 0]));
  const stack = [];
  const cycles = [];
  const seen = new Set();
  const visit = (id) => {
    color.set(id, 1);
    stack.push(id);
    for (const d of deps.get(id) || []) {
      if (!color.has(d)) continue;
      if (color.get(d) === 1) {
        const cyc = stack.slice(stack.indexOf(d)).concat(d);
        const key = [...new Set(cyc)].sort(byId).join(',');
        if (!seen.has(key)) { seen.add(key); cycles.push(cyc.slice().reverse()); }
      } else if (color.get(d) === 0) visit(d);
    }
    stack.pop();
    color.set(id, 2);
  };
  for (const id of [...ids].sort(byId)) if (color.get(id) === 0) visit(id);
  return cycles;
}

// Validates the plan and builds the graph. Returns { errors, warnings, graph }; graph is null on
// structural errors (cycle, unknown dependency, duplicate ID).
export function analyze(plan, { specAcs = null } = {}) {
  const errors = [];
  const warnings = [];
  const err = (code, message, task) => errors.push({ code, message, ...(task ? { task } : {}) });
  const { tasks } = plan;
  const path = plan.path || 'Standard';
  if (!plan.path) warnings.push({ code: 'PATH_DEFAULT', message: 'no "Path:" in the plan header; Standard assumed' });
  if (path === 'Quick') err('PATH_QUICK', 'Quick-path items have no plan.md; use the issue acceptance test');

  if (tasks.length === 0) err('NO_TASKS', '"## Tasks" table has no rows');
  if (tasks.length > LIMITS.maxTasks) {
    err('TASK_BOUND', `${tasks.length} tasks > ${LIMITS.maxTasks}; split the spec into two specs`);
  }

  const ids = new Set();
  let structural = false;
  for (const t of tasks) {
    if (!TASK_ID.test(t.id)) { err('BAD_ID', `row ${t.row}: task ID "${t.id}" is not T<n>`); structural = true; continue; }
    if (ids.has(t.id)) { err('DUPLICATE_ID', `task ID ${t.id} appears twice`, t.id); structural = true; }
    ids.add(t.id);
  }
  const sorted = [...ids].sort(byId);
  const gap = sorted.find((id, i) => idNum(id) !== i + 1);
  if (gap) warnings.push({ code: 'ID_GAP', message: `task IDs are not contiguous at ${gap} (removed tasks keep their IDs out of use)` });

  for (const t of tasks) {
    if (!TASK_ID.test(t.id)) continue;
    if (!t.title) err('NO_TITLE', `${t.id} has no title`, t.id);
    if (t.acs.length === 0) err('NO_AC', `${t.id} lists no AC-n (a prefactor lists the AC it enables)`, t.id);
    if (specAcs) {
      for (const ac of t.acs) if (!specAcs.includes(ac)) err('UNKNOWN_AC', `${t.id} references ${ac}, which the spec does not define`, t.id);
    }
    if (t.files.length === 0) err('NO_FILES', `${t.id} lists no Files`, t.id);
    if (t.sizeHours == null) err('BAD_SIZE', `${t.id} size "${t.sizeRaw}" is not <n>h, <n>d or <n>m`, t.id);
    else if (t.sizeHours > LIMITS.maxTaskHours) err('SIZE_BOUND', `${t.id} size ${t.sizeRaw} > 1 day; split the task`, t.id);
    for (const d of t.blockedBy) {
      if (d === t.id) { err('CYCLE', `${t.id} is blocked by itself`, t.id); structural = true; } else if (!ids.has(d)) { err('UNKNOWN_DEP', `${t.id} is blocked by unknown task ${d}`, t.id); structural = true; }
    }
  }

  if (path !== 'Quick') checkDecisions(plan, path, ids, err, warnings);

  if (specAcs) {
    const covered = new Set(tasks.flatMap((t) => t.acs));
    for (const ac of specAcs) if (!covered.has(ac)) err('UNCOVERED_AC', `${ac} has no task`);
  }

  const taskMap = new Map(tasks.filter((t) => TASK_ID.test(t.id)).map((t) => [t.id, t]));
  const deps = new Map([...taskMap.values()].map((t) => [t.id, t.blockedBy.filter((d) => taskMap.has(d) && d !== t.id)]));
  const cycles = findCycles([...taskMap.keys()], deps);
  for (const c of cycles) err('CYCLE', `dependency cycle: ${c.join(' → ')}`);
  if (structural || cycles.length) return { errors, warnings, graph: null };

  // Level = longest path from a root; processing by (level, ID) is a topological order.
  const level = new Map();
  const levelOf = (id) => {
    if (level.has(id)) return level.get(id);
    const l = 1 + Math.max(0, ...deps.get(id).map(levelOf));
    level.set(id, l);
    return l;
  };
  const order = [...taskMap.keys()].sort((a, b) => levelOf(a) - levelOf(b) || byId(a, b));

  const wave = new Map();
  const members = new Map();
  const conflicts = [];
  const conflictEdges = [];
  for (const id of order) {
    let w = 1 + Math.max(0, ...deps.get(id).map((d) => wave.get(d)));
    for (;;) {
      const clash = (members.get(w) || []).map((o) => ({ o, files: overlap(taskMap.get(o).files, taskMap.get(id).files) })).filter((c) => c.files.length);
      if (!clash.length) break;
      for (const c of clash) {
        conflicts.push({ tasks: [c.o, id], files: c.files });
        conflictEdges.push({ from: c.o, to: id, type: 'file-conflict', files: c.files });
      }
      w += 1;
    }
    wave.set(id, w);
    if (!members.has(w)) members.set(w, []);
    members.get(w).push(id);
  }
  for (const c of conflicts) c.resolution = `${c.tasks[1]} runs in wave ${wave.get(c.tasks[1])}, after ${c.tasks[0]} (wave ${wave.get(c.tasks[0])})`;

  const waveCount = Math.max(0, ...wave.values());
  const waves = [];
  for (let w = 1; w <= waveCount; w++) waves.push((members.get(w) || []).slice().sort(byId));

  const nodes = order.slice().sort(byId).map((id) => {
    const t = taskMap.get(id);
    return { id, title: t.title, acs: t.acs, blockedBy: t.blockedBy, files: t.files, sizeHours: t.sizeHours, wave: wave.get(id) };
  });
  const edges = [];
  for (const n of nodes) for (const d of n.blockedBy) edges.push({ from: d, to: n.id, type: 'blocks' });
  edges.push(...conflictEdges);

  const combinedAllowed = path === 'Standard' && nodes.length <= LIMITS.combinedReviewMaxTasks;
  const graph = {
    schema: 1,
    path,
    planHash: plan.hash,
    review: combinedAllowed ? 'combined' : 'separate',
    taskCount: nodes.length,
    acs: [...new Set(nodes.flatMap((n) => n.acs))].sort(acSort),
    nodes,
    edges,
    waves,
    conflicts,
  };
  graph.initialFrontier = frontier(graph, []).frontier;
  return { errors, warnings, graph };
}

// Ready tasks (all blockers and earlier file-conflict tasks done) and the dispatchable frontier: ready tasks with pairwise
// disjoint Files, in (wave, ID) order, at most maxParallel.
export function frontier(graph, done, maxParallel = LIMITS.maxParallel) {
  const doneSet = new Set(done);
  // A file-conflict edge serializes its two tasks in wave order: the later task waits for the earlier one.
  const conflictPreds = (id) => (graph.edges || []).filter((e) => e.type === 'file-conflict' && e.to === id).map((e) => e.from);
  const ready = graph.nodes
    .filter((n) => !doneSet.has(n.id) && n.blockedBy.every((d) => doneSet.has(d)) && conflictPreds(n.id).every((d) => doneSet.has(d)))
    .sort((a, b) => a.wave - b.wave || byId(a.id, b.id));
  const picked = [];
  const deferred = [];
  for (const n of ready) {
    const clash = picked.find((p) => overlap(p.files, n.files).length);
    if (clash) deferred.push({ id: n.id, reason: `shares files with ${clash.id}` });
    else if (picked.length >= maxParallel) deferred.push({ id: n.id, reason: `frontier full (${maxParallel})` });
    else picked.push(n);
  }
  return {
    ready: ready.map((n) => n.id),
    frontier: picked.map((n) => n.id),
    deferred,
    complete: graph.nodes.every((n) => doneSet.has(n.id)),
  };
}

// Validates the ## Approvals table against the current plan and spec hashes (rule K8 included).
// approvals.md register row for the approved plan revision (references/governance.md §3), checked when
// the register exists: the request was logged first, answered in a later turn, by the role asked, in the same words.
function checkRegister(registerMd, row, label) {
  const at = (v) => { const m = /(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/.exec(v || ''); return m ? Date.parse(`${m[1]}T${m[2]}:${m[3]}:00Z`) : null; };
  const unq = (v) => String(v || '').replace(/`/g, '').trim().replace(/^["“]|["”]$/g, '');
  const table = parseTables(stripComments(registerMd)).find((t) => t.header.some((h) => /requested at/i.test(h)));
  if (!table) return [{ code: 'APPROVAL_REGISTER', message: 'approvals.md has no register table (Requested at column)' }];
  const ix = headerIndex(table.header);
  const get = (r, k) => (ix[k] == null ? '' : String(r[ix[k]] ?? '').trim());
  const rev = Number(String(row['plan rev']).replace(/\D/g, ''));
  const hits = table.rows.filter((r) => /plan\.md/i.test(get(r, 'artifact')) && Number(get(r, 'rev')) === rev);
  if (!hits.length) return [{ code: 'APPROVAL_REGISTER', message: `${label}: approvals.md has no request row for plan.md rev ${rev}` }];
  const e = hits[hits.length - 1];
  const errors = [];
  const asked = at(get(e, 'requested at'));
  const answered = at(get(e, 'answered at'));
  if (asked == null || answered == null) errors.push({ code: 'APPROVAL_REGISTER', message: `${label}: approvals.md Requested at / Answered at must be YYYY-MM-DD HH:MM` });
  else if (answered <= asked) errors.push({ code: 'APPROVAL_REGISTER', message: `${label}: answer is not later than the request; only a reply in a later turn counts` });
  if (unq(get(e, 'exact words')) !== unq(row['exact words'])) errors.push({ code: 'APPROVAL_REGISTER', message: `${label}: exact words differ between ## Approvals and approvals.md` });
  if (get(e, 'asked role').toLowerCase() !== String(row.role).toLowerCase()) errors.push({ code: 'APPROVAL_REGISTER', message: `${label}: role "${row.role}" is not the role asked in approvals.md ("${get(e, 'asked role')}")` });
  return errors;
}

export function checkApproval(md, { graph, specMd = null, registerMd = null }) {
  const errors = [];
  const sec = findSection(normalize(md), 'Approvals', { level: 2 });
  const table = sec && parseTables(sec.body)[0];
  if (!table) return [{ code: 'APPROVAL_MISSING', message: 'no "## Approvals" table' }];
  const idx = headerIndex(table.header);
  const need = ['sign-off', 'plan rev', 'plan hash', 'spec hash', 'role', 'person', 'exact words', 'decision'];
  const lacking = need.filter((c) => idx[c] == null);
  if (lacking.length) return [{ code: 'APPROVAL_COLUMNS', message: `"## Approvals" table lacks column(s): ${lacking.join(', ')}` }];
  const rows = table.rows.map((r) => Object.fromEntries(Object.entries(idx).map(([k, i]) => [k, (r[i] ?? '').replace(/`/g, '').trim()])));
  const approved = rows.filter((r) => /^approved/i.test(r.decision));
  if (!approved.length) return [{ code: 'APPROVAL_MISSING', message: 'no row with Decision "approved"' }];
  const row = approved[approved.length - 1];
  const label = `sign-off row "${row['sign-off']}" (plan rev ${row['plan rev']})`;
  if (row['plan hash'] !== graph.planHash) {
    errors.push({ code: 'APPROVAL_VOID', message: `${label}: plan hash ${row['plan hash'] || '(empty)'} ≠ current ${graph.planHash}; the plan changed after approval — run the change protocol` });
  }
  if (specMd != null) {
    const specHash = contentHash(specMd);
    if (row['spec hash'] !== specHash) {
      errors.push({ code: 'APPROVAL_SPEC_VOID', message: `${label}: spec hash ${row['spec hash'] || '(empty)'} ≠ current ${specHash}; the plan was approved against another spec revision` });
    }
  }
  for (const f of ['role', 'person', 'exact words']) {
    if (!row[f] || NONE.test(row[f])) errors.push({ code: 'APPROVAL_FIELD', message: `${label}: "${f}" is empty` });
  }
  const rev = findSection(normalize(md), 'Revision log', { level: 2 });
  const revTable = rev && parseTables(rev.body)[0];
  if (revTable) {
    const revs = revTable.rows.map((r) => Number(String(r[0]).replace(/\D/g, ''))).filter((n) => Number.isFinite(n) && n > 0);
    const latest = revs.length ? Math.max(...revs) : null;
    const approvedRev = Number(String(row['plan rev']).replace(/\D/g, ''));
    if (latest != null && approvedRev !== latest) {
      errors.push({ code: 'APPROVAL_REV', message: `${label}: approved plan rev ${approvedRev} ≠ latest Revision log rev ${latest}` });
    }
  }
  if (registerMd != null) errors.push(...checkRegister(registerMd, row, label));
  if (/combined/i.test(row['sign-off']) && graph.review !== 'combined') {
    errors.push({
      code: 'COMBINED_NOT_ALLOWED',
      message: `${label}: a combined Specify + Design review requires the Standard path and ≤ ${LIMITS.combinedReviewMaxTasks} tasks (path ${graph.path}, ${graph.taskCount} tasks); hold two reviews`,
    });
  }
  return errors;
}

function doneFromGit(range, cwd) {
  const tasks = new Set();
  for (const c of gitLog({ cwd, range })) for (const t of refsFromMessage(`${c.subject}\n\n${c.body}`).tasks) tasks.add(t);
  return [...tasks];
}

function stable(graph) {
  return JSON.stringify(graph, null, 2) + '\n';
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv, { booleans: ['json', 'help', 'write', 'check', 'check-approval', 'no-spec'] });
  if (flags.help) { out.write(USAGE + '\n'); return EXIT.PASS; }
  const json = Boolean(flags.json);
  const planPath = positional[0];
  if (!planPath) throw new InputError(`plan path missing\n${USAGE}`);
  const planFile = resolve(planPath);
  if (!existsSync(planFile)) throw new InputError(`plan not found: ${planPath}`);
  const md = readMarkdownFile(planFile);

  let specMd = null;
  let specFile = null;
  if (!flags['no-spec']) {
    specFile = resolve(typeof flags.spec === 'string' ? flags.spec : join(dirname(planFile), 'spec.md'));
    if (!existsSync(specFile)) throw new InputError(`spec not found: ${specFile} (pass --spec <path>, or --no-spec for a standalone plan)`);
    specMd = readMarkdownFile(specFile);
  }

  const plan = parsePlan(md);
  const declaredSpecPath = specMd != null ? specPath(specMd) : null;
  const pathMismatch = plan.path && declaredSpecPath && plan.path !== declaredSpecPath;
  if (!plan.path) plan.path = declaredSpecPath;
  let specAcs = null;
  if (specMd != null) {
    specAcs = specAcIds(specMd);
    if (!specAcs.length) throw new InputError(`spec defines no AC-n IDs: ${specFile}`);
  }
  const { errors, warnings, graph } = analyze(plan, { specAcs });
  if (pathMismatch) errors.push({ code: 'PATH_MISMATCH', message: `plan Path ${plan.path} ≠ spec Path ${declaredSpecPath}; re-score and align both (never route down)` });

  const limit = LIMITS.words[plan.path || 'Standard'] ?? LIMITS.words.Standard;
  const words = countWords(stripSection(stripSection(md, 'Loop ledger'), 'Approvals'));
  if (words > limit) errors.push({ code: 'WORD_BOUND', message: `plan prose has ${words} words > ${limit} (${plan.path || 'Standard'}); move detail into the task subsections' code blocks or split the spec` });

  let maxParallel = LIMITS.maxParallel;
  if (flags['max-parallel'] != null) {
    maxParallel = Number(flags['max-parallel']);
    if (!Number.isInteger(maxParallel) || maxParallel < 1 || maxParallel > LIMITS.maxParallel) {
      throw new InputError(`--max-parallel must be an integer from 1 to ${LIMITS.maxParallel}`);
    }
  }

  let done = [];
  if (typeof flags.done === 'string') done.push(...flags.done.split(/[\s,]+/).filter(Boolean));
  if (typeof flags['from-git'] === 'string') done.push(...doneFromGit(flags['from-git'], dirname(planFile)));
  done = [...new Set(done)];

  let state = null;
  const outFile = resolve(typeof flags.out === 'string' ? flags.out : join(dirname(planFile), 'graph.json'));
  if (graph) {
    const known = new Set(graph.nodes.map((n) => n.id));
    for (const d of done) if (!known.has(d)) warnings.push({ code: 'DONE_UNKNOWN', message: `done task ${d} is not in the plan` });
    done = done.filter((d) => known.has(d));
    for (const n of graph.nodes) {
      if (!done.includes(n.id)) continue;
      for (const b of n.blockedBy) if (!done.includes(b)) warnings.push({ code: 'DONE_OUT_OF_ORDER', message: `${n.id} is done but its blocker ${b} is not` });
    }
    state = { done: done.sort(byId), ...frontier(graph, done, maxParallel), maxParallel };

    if (flags['check-approval']) {
      const regFile = join(dirname(planFile), 'approvals.md');
      const registerMd = existsSync(regFile) ? readMarkdownFile(regFile) : null;
      errors.push(...checkApproval(md, { graph, specMd, registerMd }));
    }
    if (flags.check) {
      if (!existsSync(outFile)) errors.push({ code: 'GRAPH_MISSING', message: `${basename(outFile)} missing; run plan-graph --write` });
      else if (readFileSync(outFile, 'utf8') !== stable(graph)) errors.push({ code: 'GRAPH_STALE', message: `${basename(outFile)} differs from the plan; run plan-graph --write and commit it` });
    }
  }

  const ok = errors.length === 0;
  let written = null;
  if (ok && graph && (flags.write || typeof flags.out === 'string')) {
    writeFileSync(outFile, stable(graph));
    written = outFile;
  }

  const lines = [];
  lines.push(`plan-graph: ${planPath} · ${plan.tasks.length} tasks · ${plan.path || 'Standard (assumed)'}${graph ? ` · review: ${graph.review} · planHash ${graph.planHash}` : ''}`);
  if (graph) {
    lines.push(`waves: ${graph.waves.map((w, i) => `W${i + 1} ${w.join(' ')}`).join(' · ')}`);
    for (const c of graph.conflicts) lines.push(`conflict: ${c.tasks.join('/')} share ${c.files.join(', ')} → ${c.resolution}`);
    lines.push(`done: ${state.done.join(', ') || 'none'} · ready: ${state.ready.join(', ') || 'none'} · frontier (max ${maxParallel}): ${state.frontier.join(', ') || (state.complete ? 'none — all tasks done' : 'none')}`);
    for (const d of state.deferred) lines.push(`deferred: ${d.id} — ${d.reason}`);
  }
  for (const w of warnings) lines.push(`WARN ${w.code}: ${w.message}`);
  for (const e of errors) lines.push(`FAIL ${e.code}: ${e.message}`);
  if (written) lines.push(`wrote ${written}`);
  lines.push(ok ? 'PASS' : `FAIL (${errors.length}) — fix the plan before requesting Design sign-off`);

  return report({
    ok,
    json,
    result: { plan: planPath, spec: specFile, errors, warnings, graph, state, written },
    lines,
  }, out);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  run(() => main());
}
