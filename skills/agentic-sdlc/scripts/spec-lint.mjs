#!/usr/bin/env node
// spec-lint — deterministic validation of specs/NNN-slug/spec.md (mechanisms 2.2, 2.3, 10.1, 10.3, 11.1, 12.1).
// Dependency-free, Node >= 18. Exit codes: 0 pass, 1 check failed, 2 input missing or unparsable.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import {
  normalize, readMarkdownFile, parseSections, parseTables, tableToObjects, countWords, contentHash, stripSection,
} from './lib/md.mjs';

const HELP = `Usage: node spec-lint.mjs <spec.md>... [options]

Validates a spec written from templates/spec.md before the Specify sign-off request.

Options:
  --check-approval   Also verify the binding Specify sign-off: rev and hash match the current file,
                     explicit "yes", request logged earlier in approvals.md, waivers unexpired.
                     Run before Build (preflight) and in CI.
  --hash             Print the spec hash (first 12 hex of SHA-256 without ## Approvals) and exit 0.
  --path <P>         Override the header path (Quick | Standard | Full).
  --today <date>     Date used for waiver expiry (YYYY-MM-DD, default: today in UTC).
  --json             Machine-readable result on stdout.
  --help             This text.

Exit codes: 0 pass · 1 check failed (do not request approval / do not start Build)
            2 file missing or not built from the template (no header table).`;

export const PATHS = ['Quick', 'Standard', 'Full'];
export const BUDGET = { Quick: 1500, Standard: 1500, Full: 3000 };
export const PATH_RANK = { Quick: 0, Standard: 1, Full: 2 };

// The 30 vague terms flagged unless the same sentence holds a number with a unit.
export const VAGUE_TERMS = [
  'fast', 'quick', 'quickly', 'slow', 'robust', 'user-friendly', 'intuitive', 'easy', 'simple', 'seamless',
  'scalable', 'flexible', 'efficient', 'performant', 'reliable', 'appropriate', 'adequate', 'sufficient',
  'reasonable', 'optimal', 'minimal', 'large', 'small', 'many', 'several', 'few', 'various', 'etc.',
  'normally', 'gracefully',
];

// Path risk triggers (references/paths.md §Score). Aliases map to the canonical name.
export const TRIGGER_ALIASES = {
  auth: 'auth', authentication: 'auth', authorization: 'auth',
  'personal data': 'personal/health data', 'health data': 'personal/health data',
  'personal/health data': 'personal/health data', pii: 'personal/health data',
  money: 'money', payments: 'money',
  'public api': 'public API',
  'schema/migration': 'schema/migration', schema: 'schema/migration', migration: 'schema/migration',
  irreversible: 'irreversible', regulated: 'regulated',
};
const THREAT_MODEL_TRIGGERS = new Set(['auth', 'personal/health data', 'money', 'public API']);

const SECTIONS = [
  { key: 'problem', name: 'Problem', re: /^problem\b/i },
  { key: 'users', name: 'Users', re: /^users\b/i },
  { key: 'stories', name: 'Stories', re: /^(user )?stories\b/i },
  { key: 'ac', name: 'Acceptance criteria', re: /^acceptance criteria\b/i },
  { key: 'nongoals', name: 'Non-goals', re: /^non-goals\b/i },
  { key: 'constraints', name: 'Constraints', re: /^constraints\b/i },
  { key: 'security', name: 'Security notes', re: /^security notes\b/i },
  { key: 'rollback', name: 'Rollback', re: /^rollback\b/i },
  { key: 'release', name: 'Release & observability', re: /^release (&|and) observability\b/i },
  { key: 'indicator', name: 'Indicator', re: /^indicators?\b/i },
  { key: 'questions', name: 'Open questions', re: /^open questions\b/i },
  { key: 'revisions', name: 'Revision log', re: /^revision (log|history)\b/i },
  { key: 'approvals', name: 'Approvals', re: /^approvals\b/i },
];
// Sections whose prose is not checked for vague terms and does not count toward the word budget.
const NON_PROSE = new Set(['questions', 'revisions', 'approvals']);

const UNIT = String.raw`(?:%|ms|milliseconds?|s|secs?|seconds?|min|mins|minutes?|h|hrs?|hours?|d|days?|weeks?|months?|` +
  String.raw`rows?|records?|items?|requests?|req\/s|rps|calls?|users?|sessions?|errors?|retries|attempts?|times|` +
  String.raw`bytes?|kb|mb|gb|tb|kib|mib|gib|characters?|chars?|words?|pages?|files?|clicks?|steps?|px|fps|usd|eur|tickets?|reports?|exports?)`;
const NUM_UNIT = new RegExp(String.raw`(?:[$€£]\s?\d|\d[\d,]*(?:\.\d+)?\s*${UNIT}(?![\p{L}\p{N}]))`, 'iu');
const WINDOW = new RegExp(String.raw`\b(?:over|in|within|per|for)\s+(?:\d[\d,]*\s*)?(?:s|secs?|seconds?|min|mins|minutes?|h|hrs?|hours?|d|days?)\b`, 'i');
const COMPARATOR = /(>=|<=|[<>≥≤]|\b(?:above|below|over|under|exceeds?|at least|at most|more than|less than|fewer than)\b)/i;
const GWT = /\bgiven\b[\s\S]*\bwhen\b[\s\S]*\bthen\b/i;
const PLACEHOLDER = /\{\{[^}]*\}\}/;
const UNRESOLVED = /\b(?:TODO|FIXME|XXX)\b|\?\?\?/;
const CODE_SPAN = /`[^`\n]+`/g;
const HAS_CODE = /`[^`\n]+`/;
export const EXPLICIT_YES = /\b(?:yes|approved?)\b/i;
// Words that never count as approval even next to a "yes" (references/governance.md §2).
export const NOT_APPROVAL = /\b(?:not approved|rejected|revoked|void|pending|silence|no reply|sounds good|whatever you think|probably fine)\b/i;
const DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/;

function blankComments(md) {
  return normalize(md).replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ''));
}

function hasWords(text) {
  return /[\p{L}\p{N}]/u.test(text || '');
}

function termRegex(term) {
  if (term === 'etc.') return /(^|[^\p{L}\p{N}])etc\.?(?![\p{L}\p{N}])/iu;
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}-])${esc}(?![\\p{L}\\p{N}-])`, 'iu');
}
const TERM_RES = VAGUE_TERMS.map((t) => [t, termRegex(t)]);

export function sizeRoute(s) {
  return s <= 4 ? 'Quick' : s <= 6 ? 'Standard' : 'Full';
}

export function riskRoute(triggers) {
  if (triggers.length === 0) return 'Quick';
  if (triggers.length >= 2 || triggers.includes('personal/health data') || triggers.includes('irreversible')) return 'Full';
  return 'Standard';
}

export function parseDate(text) {
  const m = String(text || '').trim().match(DATE);
  if (!m) return null;
  const d = Date.UTC(+m[1], +m[2] - 1, +m[3], m[4] ? +m[4] : 0, m[5] ? +m[5] : 0);
  return Number.isNaN(d) ? null : { ms: d, day: `${m[1]}-${m[2]}-${m[3]}`, hasTime: m[4] != null };
}

export function unquote(text) {
  return String(text || '').trim().replace(/^["“'‘]+|["”'’]+$/g, '').trim();
}

function col(row, ...patterns) {
  for (const re of patterns) {
    const key = Object.keys(row).find((k) => re.test(k));
    if (key) return row[key];
  }
  return '';
}

function sectionMap(clean) {
  const all = parseSections(clean);
  const map = {};
  for (const def of SECTIONS) {
    const s = all.find((x) => x.level === 2 && def.re.test(x.title));
    if (s) map[def.key] = s;
  }
  return map;
}

function firstTable(body, headerTest = () => true) {
  return parseTables(body).find((t) => headerTest(t.header)) || null;
}

function bullets(body) {
  return body.split('\n').filter((l) => /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(l));
}

function parseHeader(clean, sections) {
  const firstH2 = Math.min(...Object.values(sections).map((s) => s.line), Infinity);
  const head = clean.split('\n').slice(0, Number.isFinite(firstH2) ? firstH2 : undefined).join('\n');
  const table = firstTable(head, (h) => /^field$/i.test(h[0] || '') && /^value$/i.test(h[1] || ''));
  if (!table) throw new InputError('no header table (| Field | Value |): the spec does not start from templates/spec.md');
  const fields = {};
  for (const [k, v] of table.rows) fields[String(k).toLowerCase()] = (v || '').trim();
  return fields;
}

// Lints one spec. `dir` is the spec's folder (for threat-model.md and approvals.md); `readSibling`
// returns a sibling file's text or null.
export function lintSpec(md, { pathOverride, checkApproval = false, today, readSibling = () => null } = {}) {
  const findings = [];
  const add = (level, rule, message, line) => findings.push({ level, rule, message, ...(line != null ? { line } : {}) });
  const err = (rule, message, line) => add('error', rule, message, line);
  const warn = (rule, message, line) => add('warn', rule, message, line);

  const raw = normalize(md);
  const clean = blankComments(raw);
  const lines = clean.split('\n');
  const sections = sectionMap(clean);
  const header = parseHeader(clean, sections);
  const hash = contentHash(raw);

  // Header: revision, path, size, risk.
  const revision = /^\d+$/.test(header.revision || '') ? Number(header.revision) : null;
  if (!revision || revision < 1) err('H01', `header Revision must be an integer ≥ 1 (found "${header.revision ?? ''}")`);
  let path = pathOverride || (header.path || '').split(/[\s·]/)[0];
  path = PATHS.find((p) => p.toLowerCase() === String(path).toLowerCase()) || null;
  if (!path) {
    err('H02', `header Path must be Quick, Standard or Full (found "${header.path ?? ''}")`);
    path = 'Standard';
  }
  for (const key of ['id', 'owner', 'issue']) {
    if (!hasWords(header[key])) err('H06', `header field ${key} is empty`);
  }
  // Intake decision (K6): duplicate / prior rejection linked, or "n/a — <reason>".
  const intake = header.intake || '';
  if (!/^(n\/a\s*[—–-]\s*\S|duplicate\b.*(#\d+|https?:\/\/|[A-Z][A-Z0-9]+-\d+)|prior rejection\b.*(#\d+|https?:\/\/|[A-Z][A-Z0-9]+-\d+))/i.test(intake.trim())) {
    err('H07', `header Intake must be "n/a — <reason>", "duplicate of #n" or "prior rejection #n — <why this differs>" (found "${intake}")`);
  }
  const sm = (header.size || '').match(/S\s*=\s*(\d+)/);
  const size = sm ? Number(sm[1]) : null;
  if (size == null) err('H03', 'header Size must state S=<n>');
  const parts = (header.size || '').match(/files\s+(\d)\s*\+\s*components\s+(\d)\s*\+\s*iterations\s+(\d)/i);
  if (size != null && parts) {
    const p = parts.slice(1).map(Number);
    if (p.some((x) => x < 1 || x > 3)) err('H03', 'each Size part (files, components, iterations) scores 1–3');
    else if (p[0] + p[1] + p[2] !== size) err('H03', `Size parts sum to ${p[0] + p[1] + p[2]}, not S=${size}`);
  }
  const rm = (header.risk || '').match(/R\s*=\s*(\d+)/);
  const riskCount = rm ? Number(rm[1]) : null;
  const triggers = [];
  if (riskCount == null) err('H04', 'header Risk must state R=<n> · <triggers> (or R=0 · none)');
  else {
    const rest = (header.risk || '').split('·').slice(1).join('·').trim();
    const names = /^(none|—|-)?$/i.test(rest) ? [] : rest.split(/[,;]/).map((x) => x.trim().toLowerCase()).filter(Boolean);
    for (const n of names) {
      const canon = TRIGGER_ALIASES[n];
      if (!canon) err('H04', `unknown risk trigger "${n}" (known: ${Object.keys(TRIGGER_ALIASES).join(', ')})`);
      else if (!triggers.includes(canon)) triggers.push(canon);
    }
    if (names.length !== riskCount) err('H04', `Risk R=${riskCount} but ${names.length} trigger(s) listed`);
  }
  if (size != null && riskCount != null) {
    const required = [sizeRoute(size), riskRoute(triggers)].sort((a, b) => PATH_RANK[b] - PATH_RANK[a])[0];
    if (PATH_RANK[path] < PATH_RANK[required]) {
      err('H05', `path ${path} is lower than the scored route ${required} (size ${sizeRoute(size)}, risk ${riskRoute(triggers)}); never route down`);
    }
  }

  // Placeholders and unresolved markers anywhere outside comments.
  lines.forEach((l, i) => {
    if (PLACEHOLDER.test(l)) err('P01', `unfilled template placeholder: ${l.trim().slice(0, 80)}`, i + 1);
    if (UNRESOLVED.test(l.replace(CODE_SPAN, ''))) err('P02', `unresolved marker (TODO/FIXME/XXX/???): ${l.trim().slice(0, 80)}`, i + 1);
  });

  // Required sections present and non-empty.
  for (const def of SECTIONS) {
    const s = sections[def.key];
    if (!s) { err('S01', `required section missing: ## ${def.name}`); continue; }
    if (def.key !== 'approvals' && !hasWords(s.body)) err('S02', `required section is empty: ## ${def.name}`, s.line + 1);
  }

  // Acceptance criteria.
  const acs = [];
  if (sections.ac) {
    const t = firstTable(sections.ac.body, (h) => h.some((c) => /^id$/i.test(c)));
    if (!t || t.rows.length === 0) err('AC01', 'Acceptance criteria needs a table | ID | Criterion | Priority | with ≥ 1 row', sections.ac.line + 1);
    else {
      const rows = tableToObjects(t);
      const seen = new Set();
      rows.forEach((r, idx) => {
        const line = sections.ac.start + t.line + 3 + idx;
        const id = col(r, /^id$/i).trim();
        const text = col(r, /criterion/i, /given/i, /statement/i);
        const prio = col(r, /priority/i).trim().toLowerCase();
        const m = id.match(/^AC-(\d+)$/);
        if (!m) { err('AC02', `"${id}" is not an AC-n ID`, line); return; }
        const n = Number(m[1]);
        if (seen.has(n)) err('AC02', `duplicate ID ${id}`, line);
        seen.add(n);
        const retired = /^retired in rev \d+/i.test(text.trim());
        acs.push({ id, n, priority: retired ? null : prio, retired });
        if (retired) return;
        if (!GWT.test(text) && !NUM_UNIT.test(text)) {
          err('AC03', `${id} is neither Given/When/Then nor a measurable statement with number + unit`, line);
        }
        if (!['critical', 'normal'].includes(prio)) err('AC04', `${id} priority must be critical or normal (found "${prio}")`, line);
      });
      const nums = [...seen].sort((a, b) => a - b);
      nums.forEach((n, i) => {
        if (n !== i + 1) err('AC02', `IDs must be contiguous from AC-1: expected AC-${i + 1}, found AC-${n}`);
      });
      if (acs.length > 0 && acs.every((a) => a.retired)) err('AC01', 'every criterion is retired; ≥ 1 active AC is required');
    }
  }

  // Non-goals.
  if (sections.nongoals && bullets(sections.nongoals.body).length < 1) {
    err('NG01', '## Non-goals needs ≥ 1 bullet', sections.nongoals.line + 1);
  }

  // Security notes (11.1).
  if (sections.security) {
    const t = firstTable(sections.security.body);
    const rows = t ? Object.fromEntries(t.rows.map((r) => [String(r[0] || '').toLowerCase(), r[1] || ''])) : {};
    const need = [['data', 'Data classes'], ['auth', 'Authentication and authorization'], ['input', 'Inputs'], ['secret', 'Secrets']];
    for (const [k, name] of need) {
      const key = Object.keys(rows).find((x) => x.includes(k));
      if (!key || !hasWords(rows[key])) err('SEC01', `Security notes row "${name}" missing or empty (write "none — <reason>" when it does not apply)`, sections.security.line + 1);
    }
  }

  // Rollback: command + verify command.
  if (sections.rollback) {
    const spans = sections.rollback.body.match(CODE_SPAN) || [];
    if (spans.length < 2 || !/verif/i.test(sections.rollback.body)) {
      err('RB01', '## Rollback needs the rollback command and a verify command, each in backticks', sections.rollback.line + 1);
    }
  }

  // Release & observability (12.1, K2).
  if (sections.release) {
    const t = firstTable(sections.release.body);
    const rows = t ? Object.fromEntries(t.rows.map((r) => [String(r[0] || '').toLowerCase(), r[1] || ''])) : {};
    const get = (k) => { const key = Object.keys(rows).find((x) => x.startsWith(k)); return key ? rows[key] : ''; };
    // Report the offending row's line; fall back to the heading line when the row is missing.
    const rowAt = (k) => {
      const idx = t ? t.rows.findIndex((r) => String(r[0] || '').toLowerCase().startsWith(k)) : -1;
      return idx < 0 ? sections.release.line + 1 : sections.release.start + t.line + 3 + idx;
    };
    const required = path === 'Quick' ? ['signal', 'rollback command'] : ['signal', 'alert', 'dashboard', 'owner', 'rollout', 'rollback command'];
    for (const k of required) if (!hasWords(get(k))) err('OBS01', `Release & observability row "${k}" missing or empty`, rowAt(k));
    const signal = get('signal');
    if (hasWords(signal) && path !== 'Quick' && !/\bAC-\d+\b/.test(signal)) err('OBS02', 'Signal must name the AC-n it observes', rowAt('signal'));
    // No production deployment (library, CLI, internal tool): "n/a — <reason>" is accepted for Alert and Rollout.
    const notApplicable = (v) => /^\s*n\/a\s*[—–-]\s*\S+/i.test(v);
    const alert = get('alert');
    if (hasWords(alert) && !notApplicable(alert) && !(COMPARATOR.test(alert) && /\d/.test(alert) && WINDOW.test(alert))) {
      err('OBS03', `Alert needs a comparator, a numeric threshold and a window (e.g. "> 2% over 15 min"): "${alert}"`, rowAt('alert'));
    }
    const rollout = get('rollout');
    if (hasWords(rollout) && !notApplicable(rollout) && !(/\bflag\b/i.test(rollout) && /\boff\b/i.test(rollout)) && (rollout.match(/\d+\s*%/g) || []).length < 2) {
      err('OBS04', 'Rollout needs a feature flag with default off, or ≥ 2 percentage stages (1% → 10% → 100%)', rowAt('rollout'));
    }
    const rb = get('rollback command');
    if (hasWords(rb) && !HAS_CODE.test(rb)) err('OBS05', 'Rollback command must be a command in backticks', rowAt('rollback command'));
  }

  // Indicator: baseline and target are numbers.
  if (sections.indicator) {
    const t = firstTable(sections.indicator.body, (h) => h.some((c) => /baseline/i.test(c)));
    if (!t || t.rows.length === 0) err('IND01', 'Indicator needs a table with Baseline and Target columns and ≥ 1 row', sections.indicator.line + 1);
    else for (const r of tableToObjects(t)) {
      if (!/\d/.test(col(r, /baseline/i)) || !/\d/.test(col(r, /target/i))) {
        err('IND01', `indicator "${col(r, /indicator/i, /name/i)}" needs a numeric baseline and target`, sections.indicator.line + 1);
      }
    }
  }

  // Open questions: zero, or each deferred to an owner.
  if (sections.questions) {
    const body = sections.questions.body;
    const items = [...bullets(body), ...(parseTables(body)[0]?.rows.map((r) => r.join(' | ')) || [])];
    if (items.length === 0 && !/^\s*none\.?\s*$/i.test(body.trim())) {
      err('OQ01', 'Open questions must be "None." or a list whose items end with "deferred: <owner>"', sections.questions.line + 1);
    }
    for (const it of items) {
      if (!/deferred:\s*[\p{L}]/iu.test(it)) err('OQ01', `open question not deferred to an owner: ${it.trim().slice(0, 80)}`, sections.questions.line + 1);
    }
  }

  // Revision log + critique of the current revision (2.4).
  if (sections.revisions) {
    const t = firstTable(sections.revisions.body, (h) => h.some((c) => /^rev/i.test(c)));
    const rows = t ? tableToObjects(t) : [];
    if (rows.length === 0) err('REV01', 'Revision log needs a table with ≥ 1 row', sections.revisions.line + 1);
    const revs = rows.map((r) => Number(col(r, /^rev/i)));
    revs.forEach((n, i) => { if (n !== i + 1) err('REV01', `Revision log revs must run 1..N in order (row ${i + 1} is "${n}")`); });
    if (revision && revs.length && revs[revs.length - 1] !== revision) {
      err('REV02', `last Revision log row is rev ${revs[revs.length - 1]}, header Revision is ${revision}`);
    }
    const current = rows.find((r) => Number(col(r, /^rev/i)) === revision);
    const critique = current ? col(current, /critique/i) : '';
    if (current && !(/\b(fresh-context|self-review)\b/i.test(critique) && /\b12\s*\/\s*12\b/.test(critique))) {
      err('REV03', `rev ${revision} has no complete critique: write "<fresh-context | self-review> · 12/12 · ..." (mechanism 2.4)`);
    }
  }

  // Vague terms in prose sections, unless quantified in the same sentence.
  for (const [key, s] of Object.entries(sections)) {
    if (NON_PROSE.has(key)) continue;
    for (let i = s.start; i < s.end; i++) {
      const text = lines[i].replace(CODE_SPAN, ' ').replace(/https?:\/\/\S+/g, ' ');
      for (const sentence of text.split(/(?<=[.!?;])\s+|\s\|\s/)) {
        for (const [term, re] of TERM_RES) {
          if (re.test(sentence) && !NUM_UNIT.test(sentence)) {
            err('V01', `vague term "${term}" not quantified in the same sentence: ${sentence.trim().slice(0, 80)}`, i + 1);
          }
        }
      }
    }
  }

  // Word budget (comments, Revision log, Approvals and Open questions excluded).
  let budgetText = clean;
  for (const def of SECTIONS.filter((d) => NON_PROSE.has(d.key))) budgetText = stripSection(budgetText, def.re);
  const words = countWords(budgetText);
  if (words > BUDGET[path]) err('BUD01', `${words} words > ${BUDGET[path]} budget for the ${path} path`);

  // Threat model (11.4) on Full and risk-flagged specs.
  const activeIds = new Set(acs.filter((a) => !a.retired).map((a) => a.id));
  const flagged = path === 'Full' || triggers.some((t) => THREAT_MODEL_TRIGGERS.has(t));
  const tm = readSibling('threat-model.md');
  // A Security notes row "Threat model | n/a — <reason>" records the Security Auditor's judgment (references/security.md).
  const tmRow = sections.security ? (firstTable(sections.security.body)?.rows || []).find((r) => /^threat model/i.test(String(r[0] || '').trim())) : null;
  const threatModelNotApplicable = !!tmRow && /^\s*n\/a\s*[—–-]\s*\S+/i.test(String(tmRow[1] || ''));
  if (tm == null && path === 'Full') err('TM01', 'Full path requires threat-model.md next to spec.md');
  else if (tm == null && flagged && !threatModelNotApplicable) warn('TM02', `risk-flagged spec (${triggers.join(', ')}) without threat-model.md; the Security Auditor writes it before the Specify sign-off request, or records "n/a — <reason>" in the Security notes "Threat model" row`);
  if (tm != null) {
    for (const t of parseTables(blankComments(tm))) {
      const rk = t.header.findIndex((h) => /rating|severity/i.test(h));
      const mk = t.header.findIndex((h) => /mitigation/i.test(h));
      if (rk < 0 || mk < 0) continue;
      for (const r of t.rows) {
        if (!/\b(high|critical)\b/i.test(r[rk] || '')) continue;
        const cited = (r[mk] || '').match(/\bAC-\d+\b/g) || [];
        if (!cited.some((id) => activeIds.has(id))) err('TM03', `threat rated ${r[rk]} has no mitigation citing an active AC-n: ${r.join(' | ').slice(0, 80)}`);
      }
    }
  }

  // Waivers (10.3) and the approval gate (2.3, 10.1).
  const todayDate = parseDate(today || new Date().toISOString().slice(0, 10));
  const approvalsBody = sections.approvals ? sections.approvals.body : '';
  const waiverTable = parseTables(approvalsBody).find((t) => t.header.some((h) => /^kind$/i.test(h)));
  const waivers = waiverTable ? tableToObjects(waiverTable) : [];
  for (const w of waivers) {
    for (const f of waiverFindings(w, todayDate)) (f.rule === 'WV05' && !checkApproval ? warn : err)(f.rule, f.message);
  }

  let approval = null;
  if (checkApproval) approval = checkSpecApproval({ approvalsBody, hash, revision, readSibling, err });

  return {
    path, revision, hash, size, risk: riskCount, triggers, words, budget: BUDGET[path],
    acs: acs.map(({ id, priority, retired }) => ({ id, priority, retired })),
    waivers: waivers.length, approval, findings,
  };
}

function checkSpecApproval({ approvalsBody, hash, revision, readSibling, err }) {
  const t = parseTables(approvalsBody).find((x) => x.header.some((h) => /^sign-off$/i.test(h)) && x.header.some((h) => /hash/i.test(h)));
  const rows = t ? tableToObjects(t).filter((r) => /^specify(\s*\+\s*design)?(\s*\(combined\))?$/i.test(col(r, /^sign-off$/i).trim())) : [];
  if (rows.length === 0) { err('AP01', 'no Specify sign-off row in ## Approvals: request approval and record the decision'); return null; }
  const row = rows[rows.length - 1];
  const rec = {
    signOff: col(row, /^sign-off$/i).trim(),
    rev: Number(col(row, /^spec rev$/i, /^rev$/i)),
    hash: col(row, /^spec hash$/i, /^hash$/i).replace(/`/g, '').replace(/^sha256[:\s]*/i, '').trim(),
    date: col(row, /^date/i).trim(),
    role: col(row, /^role$/i).trim(),
    person: col(row, /^person$/i).trim(),
    words: unquote(col(row, /exact words/i)),
    decision: col(row, /^decision$/i).trim().toLowerCase(),
  };
  if (!/^approved( with conditions)?$/.test(rec.decision)) err('AP02', `binding Specify sign-off decision is "${rec.decision || 'empty'}", not approved`);
  if (rec.rev !== revision) err('AP03', `approval is for rev ${rec.rev}, spec is rev ${revision}: request approval of rev ${revision}`);
  if (rec.hash !== hash) err('AP04', `approval void: recorded hash ${rec.hash || '(none)'} ≠ current ${hash}; run the change protocol (references/rules.md) and request approval again`);
  if (!EXPLICIT_YES.test(rec.words) || NOT_APPROVAL.test(rec.words)) err('AP05', `exact words "${rec.words}" contain no explicit "yes" or "approved", or a non-approval phrase`);
  if (!parseDate(rec.date)) err('AP06', `approval date "${rec.date}" is not YYYY-MM-DD[ HH:MM]`);
  for (const [k, v] of [['role', rec.role], ['person', rec.person], ['evidence reviewed', col(row, /evidence/i)], ['residual risks', col(row, /residual/i)]]) {
    if (!hasWords(v)) err('AP06', `approval field "${k}" is empty`);
  }

  // Register: the request was logged earlier, in a previous turn, to the same role (10.1).
  const reg = readSibling('approvals.md');
  if (reg == null) { err('AP07', 'approvals.md (approval register) missing next to spec.md'); return rec; }
  const rt = parseTables(blankComments(reg)).find((x) => x.header.some((h) => /requested at/i.test(h)));
  const entries = rt ? tableToObjects(rt).filter((r) => /spec\.md/i.test(col(r, /artifact/i)) && Number(col(r, /^rev$/i)) === rec.rev) : [];
  if (entries.length === 0) { err('AP07', `approvals.md has no request row for spec.md rev ${rec.rev}`); return rec; }
  const e = entries[entries.length - 1];
  const asked = parseDate(col(e, /requested at/i));
  const answered = parseDate(col(e, /answered at/i));
  const approvedOn = parseDate(rec.date);
  if (!asked?.hasTime || !answered?.hasTime) err('AP08', 'approvals.md Requested at / Answered at must be YYYY-MM-DD HH:MM');
  else if (answered.ms <= asked.ms) err('AP08', 'answer is not later than the request: only a reply in a later turn counts');
  if (answered && approvedOn && answered.day !== approvedOn.day) err('AP08', `approval date ${approvedOn.day} ≠ register answer date ${answered.day}`);
  if (unquote(col(e, /exact words/i)) !== rec.words) err('AP08', 'exact words differ between ## Approvals and approvals.md');
  if (col(e, /asked role/i).trim().toLowerCase() !== rec.role.toLowerCase()) err('AP08', `approval role "${rec.role}" is not the role asked in approvals.md ("${col(e, /asked role/i)}")`);
  return rec;
}

// Rules WV01–WV05 for one waiver row (references/governance.md §6). Columns are matched by their leading
// word, so template headers such as "Owner (≠ requester)" or "Kind (accept-risk | defer | emergency)" work.
export function waiverFindings(w, todayDate = parseDate(new Date().toISOString().slice(0, 10))) {
  const out = [];
  const err = (rule, message) => out.push({ rule, message });
  const id = col(w, /^id$/i) || '(no id)';
  const kind = col(w, /^kind\b/i).toLowerCase().trim().replace(/\s+/g, '-');
  const sev = col(w, /^severity/i).toLowerCase();
  const granted = parseDate(col(w, /^granted/i));
  const expires = parseDate(col(w, /^expir/i));
  const owner = col(w, /^owner/i).trim().toLowerCase();
  const requester = col(w, /^requester/i).trim().toLowerCase();
  if (!['accept-risk', 'defer', 'emergency'].includes(kind)) err('WV01', `waiver ${id}: kind must be accept-risk, defer or emergency`);
  if (!hasWords(col(w, /reason/i)) || !hasWords(col(w, /^gate/i))) err('WV01', `waiver ${id}: gate waived and reason are required`);
  if (!/#\d+|https?:\/\/\S+|\b[A-Z][A-Z0-9]+-\d+\b/.test(col(w, /^follow/i))) err('WV01', `waiver ${id}: follow-up issue (#n, KEY-n or URL) is required`);
  const soloTeam = /1-person team/.test(owner);
  if (!owner || !requester || (owner === requester && !soloTeam)) {
    err('WV02', `waiver ${id}: owner and requester are required and must differ (1-person team: owner "self · 1-person team")`);
  }
  if (sev === 'critical' && kind !== 'emergency') err('WV03', `waiver ${id}: a Critical item can only be waived by an emergency waiver`);
  if (!granted || !expires) err('WV01', `waiver ${id}: Granted and Expires must be YYYY-MM-DD`);
  else {
    const days = (expires.ms - granted.ms) / 86400000;
    const max = kind === 'emergency' ? 7 : 30;
    if (days < 0 || days > max) err('WV04', `waiver ${id}: expiry is ${days} days after grant; allowed 0–${max}`);
    if (todayDate && expires.ms < todayDate.ms) err('WV05', `waiver ${id} expired on ${expires.day}`);
  }
  return out;
}

export function lintFile(file, opts = {}) {
  if (!existsSync(file)) throw new InputError(`spec not found: ${file}`);
  const md = readMarkdownFile(file);
  const dir = dirname(file);
  const readSibling = (name) => (existsSync(join(dir, name)) ? readMarkdownFile(join(dir, name)) : null);
  return { file, ...lintSpec(md, { ...opts, readSibling }) };
}

function format(r) {
  const errors = r.findings.filter((f) => f.level === 'error');
  const warns = r.findings.filter((f) => f.level === 'warn');
  const out = [`spec-lint ${r.file} · ${r.path} · rev ${r.revision} · hash ${r.hash} · ${r.words}/${r.budget} words · ${r.acs.length} AC`];
  for (const f of r.findings) out.push(`  ${f.level === 'error' ? 'ERROR' : 'WARN '} ${f.rule}${f.line ? ` line ${f.line}` : ''}: ${f.message}`);
  if (r.approval) out.push(`  sign-off: ${r.approval.signOff} rev ${r.approval.rev} · ${r.approval.hash} · ${r.approval.role} · ${r.approval.decision}`);
  out.push(`${errors.length ? 'FAIL' : 'PASS'} (${errors.length} errors, ${warns.length} warnings)`);
  return out;
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv, { booleans: ['json', 'help', 'check-approval', 'hash'] });
  if (flags.help) { out.write(HELP + '\n'); return EXIT.PASS; }
  if (positional.length === 0) throw new InputError('no spec file given (see --help)');
  if (flags.path && !PATHS.includes(flags.path)) throw new InputError(`--path must be one of ${PATHS.join(', ')}`);
  if (flags.today && !parseDate(flags.today)) throw new InputError('--today must be YYYY-MM-DD');

  if (flags.hash) {
    const files = positional.map((file) => {
      if (!existsSync(file)) throw new InputError(`spec not found: ${file}`);
      return { file, hash: contentHash(readMarkdownFile(file)) };
    });
    return report({ ok: true, json: flags.json, result: { files }, lines: files.map((f) => `${f.hash}  ${f.file}`) }, out);
  }

  const results = [];
  let inputError = null;
  for (const file of positional) {
    try {
      results.push(lintFile(file, { pathOverride: flags.path, checkApproval: !!flags['check-approval'], today: flags.today }));
    } catch (e) {
      if (!(e instanceof InputError)) throw e;
      inputError = e;
      results.push({ file, error: e.message });
    }
  }
  const failed = results.some((r) => r.findings?.some((f) => f.level === 'error'));
  const code = inputError ? EXIT.INPUT : failed ? EXIT.FAIL : EXIT.PASS;
  const lines = results.flatMap((r) => (r.error ? [`spec-lint ${r.file}: INPUT ERROR ${r.error}`] : format(r)));
  return report({ code, json: flags.json, result: { results }, lines }, out);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run(() => main());
