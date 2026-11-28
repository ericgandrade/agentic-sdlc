#!/usr/bin/env node
// metrics — retro delivery metrics per cycle from git and local records: lead time, change-failure rate,
// loop rounds and escalations, reverts and hotfixes. Keeps .agentic-sdlc/metrics/history.jsonl (excluded
// from the fingerprint) and applies the trend rule of references/retrospective.md. Never groups by person:
// no author or committer field is read.

import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { defaultBranch, git, isRepo, refsFromMessage, topLevel } from './lib/git.mjs';
import { findSection, parseTables, tableToObjects } from './lib/md.mjs';
import { deriveState, loadLedger, now } from './run-ledger.mjs';

export const HISTORY = '.agentic-sdlc/metrics/history.jsonl';
export const CFR_LIMIT = 0.15; // change-failure rate above 15% at two cycles in a row
export const LEAD_FACTOR = 1.5; // lead time above 1.5 × the median of the previous 3 cycles
const TREND_KEYS = Object.freeze({
  leadTimeHours: (m) => m.leadTimeHours?.median,
  changeFailureRate: (m) => m.changeFailureRate?.rate,
  loopRoundsMax: (m) => m.loopRounds?.max,
  loopRoundsMean: (m) => m.loopRounds?.mean,
  reverts: (m) => m.reverts,
});
const METRIC_NAME = Object.freeze({ leadTimeHours: /lead[ -]time/i, changeFailureRate: /change[ -]failure/i });

const HELP = `Usage: node metrics.mjs [--since <ref|date>] [--cycle <label>] [--record] [--retro <docs/retros/file.md>] [--json]

Computes one cycle on the default branch, from git and local records only (no CI, no network):
  lead time        per merge commit on the default branch's first-parent line: merge time − the earliest
                   commit on the merged branch that names a task (Refs: Tn or [Tn]); committer times, hours.
                   Item = the specs/NNN-slug the branch touched. Squash and fast-forward merges leave no
                   merge commit and are not measured. Cycle value: median and max.
  change-failure   items = specs/NNN-slug folders touched in the cycle; released = has ops.md or
                   release-notes.md. ops.md "Change failed" row: yes → failed, "window open" → pending (outside
                   the denominator), no → not failed. Without that row: failed when ops.md says
                   "Rollback during rollout | yes", a docs/postmortems/*.md file names the item with SEV1/SEV2,
                   or a Revert/hotfix commit in the cycle names the item. Rate = failed ÷ released.
  loop rounds      archived specs/NNN-slug/run-ledger.jsonl of the cycle's items: rounds per plan task (max,
                   mean; PR review rounds excluded; a done task with no round event counts 1) and escalations (round events that reached a breaker).
  reverts          commits in the cycle whose subject starts with 'Revert "'; hotfixes: subject has "hotfix".
--since    lower bound: a commit (range <ref>..<default branch>) or a date (git --since). Default: the head
           recorded by the last history row; no history → the whole default branch.
--record   appends the cycle to ${HISTORY}; needs --cycle; a label already in the history exits 2.
--cycle    label of the cycle (spec slug, release tag or batch). Without --record, a label already in the
           history evaluates the recorded history instead of a fresh row.
Trend: worse | better | flat | n/a per metric, latest cycle against the previous one (higher is worse).
Rule (references/retrospective.md §Trends): change-failure rate > 15% in the latest and the previous cycle,
or median lead time > 1.5 × the median of the previous 3 cycles → a Change item is required. It is present
when the retro record (--retro, else the newest docs/retros/YYYY-MM-DD*.md dated on or after the cycle) has a
§Change row naming the metric ("lead time", "change failure") and an §Actions RA- row whose From cites it.
History: a torn last line (no newline, not JSON) is ignored with a warning and dropped before appending;
any other invalid line → exit 2. No per-person metric: author and committer are never read.
Exit codes: 0 no action required, or the retro holds it · 1 the rule requires a Change item the retro lacks ·
2 input missing or unparsable.`;

const round1 = (x) => Math.round(x * 10) / 10;
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const slugsIn = (files) => [...new Set(files.map((f) => f.match(/^specs\/([^/]+)\//)).filter(Boolean).map((m) => `specs/${m[1]}`))];

// Commits as { sha, at, subject, body }; never asks git for author or committer names.
function commits(root, args) {
  const SEP = '\x1e';
  const out = git(['log', `--format=%H%x1f%cI%x1f%s%x1f%b${SEP}`, ...args], { cwd: root });
  return out.split(SEP).map((r) => r.replace(/^\n/, '')).filter((r) => r.trim()).map((r) => {
    const [sha, at, subject, body = ''] = r.split('\x1f');
    return { sha, at, subject, body };
  });
}

// The cycle window: { range args for git log, since label, head }.
export function windowOf(root, since, branch) {
  const head = git(['rev-parse', branch], { cwd: root }).trim();
  if (!since) return { args: [branch], since: null, head };
  try {
    const sha = git(['rev-parse', '--verify', '--quiet', `${since}^{commit}`], { cwd: root }).trim();
    if (sha) return { args: [`${sha}..${branch}`], since, head };
  } catch { /* not a ref */ }
  if (Number.isNaN(Date.parse(since))) throw new InputError(`--since is neither a commit nor a date: ${since}`);
  return { args: [`--since=${since}`, branch], since, head };
}

export function leadTimes(root, win) {
  const merges = git(['log', '--first-parent', '--merges', '--reverse', '--format=%H%x1f%cI%x1f%P', ...win.args], { cwd: root })
    .split('\n').filter(Boolean).map((l) => l.split('\x1f'));
  const items = [];
  let unmeasured = 0;
  for (const [sha, at, parents] of merges) {
    const [p1, p2] = parents.split(' ');
    const tasked = commits(root, ['--reverse', `${p1}..${p2}`]).filter((c) => refsFromMessage(`${c.subject}\n\n${c.body}`).tasks.length);
    if (!tasked.length) { unmeasured++; continue; }
    const first = tasked.reduce((a, c) => (Date.parse(c.at) < Date.parse(a.at) ? c : a));
    const files = git(['diff', '--name-only', '-z', `${p1}...${p2}`], { cwd: root }).split('\0').filter(Boolean);
    items.push({
      item: slugsIn(files)[0] || `merge ${sha.slice(0, 7)}`,
      hours: round1((Date.parse(at) - Date.parse(first.at)) / 3_600_000),
      first: first.sha.slice(0, 7), merge: sha.slice(0, 7),
    });
  }
  const hours = items.map((x) => x.hours);
  return { median: median(hours), max: hours.length ? Math.max(...hours) : null, n: items.length, unmeasured, items };
}

function cell(rows, re) {
  const r = rows.find((x) => re.test(x.Fact || ''));
  return r ? String(r.Value || '').trim() : null;
}

export function changeFailure(root, slugs, cycleCommits) {
  const pmDir = join(root, 'docs', 'postmortems');
  const postmortems = existsSync(pmDir)
    ? readdirSync(pmDir).filter((f) => f.endsWith('.md')).map((f) => readFileSync(join(pmDir, f), 'utf8')) : [];
  const out = { rate: null, failed: 0, released: 0, pending: 0, items: [] };
  for (const slug of slugs) {
    const ops = join(root, slug, 'ops.md');
    if (!existsSync(ops) && !existsSync(join(root, slug, 'release-notes.md'))) continue;
    const name = basename(slug);
    let rows = [];
    if (existsSync(ops)) {
      const text = readFileSync(ops, 'utf8');
      const sec = findSection(text, /^Delivery facts/i);
      rows = parseTables(sec ? sec.body : text).flatMap(tableToObjects);
    }
    const declared = cell(rows, /^Change failed/i);
    let status;
    let source;
    if (declared && /^yes\b/i.test(declared)) [status, source] = ['failed', 'ops.md Change failed'];
    else if (declared && /window open/i.test(declared)) [status, source] = ['pending', 'ops.md Change failed'];
    else if (declared && /^no\b/i.test(declared)) [status, source] = ['ok', 'ops.md Change failed'];
    else if (/^yes\b/i.test(cell(rows, /^Rollback/i) || '')) [status, source] = ['failed', 'ops.md Rollback'];
    else if (postmortems.some((p) => p.includes(name) && /\bSEV[12]\b/.test(p))) [status, source] = ['failed', 'SEV1/SEV2 postmortem'];
    else if (cycleCommits.some((c) => /^Revert "|hotfix/i.test(c.subject) && `${c.subject}\n${c.body}`.includes(name))) [status, source] = ['failed', 'revert or hotfix commit'];
    else [status, source] = ['ok', 'no failure signal'];
    out.items.push({ item: slug, status, source });
    if (status === 'pending') out.pending++;
    else {
      out.released++;
      if (status === 'failed') out.failed++;
    }
  }
  out.rate = out.released ? Math.round((out.failed / out.released) * 1000) / 1000 : null;
  return out;
}

export function loopRounds(root, slugs) {
  const perTask = [];
  let escalations = 0;
  let ledgers = 0;
  for (const slug of slugs) {
    const p = join(root, slug, 'run-ledger.jsonl');
    if (!existsSync(p)) continue;
    const events = loadLedger(p); // a corrupt archived ledger → exit 2
    ledgers++;
    escalations += events.filter((e) => e.type === 'round' && e.escalation).length;
    // A done task with no round event passed on its first run: 1 round (as the plan.md loop ledger counts it).
    for (const t of deriveState(events).tasks.values()) if (t.id !== 'PR') perTask.push(t.rounds.length || (t.state === 'done' ? 1 : 0));
  }
  const counted = perTask.filter((n) => n > 0);
  return {
    max: counted.length ? Math.max(...counted) : null,
    mean: counted.length ? round1(counted.reduce((a, b) => a + b, 0) / counted.length) : null,
    tasks: counted.length, escalations, ledgers,
  };
}

export function measure(root, { since } = {}) {
  const branch = defaultBranch(root);
  const win = windowOf(root, since, branch);
  const cycleCommits = commits(root, win.args);
  const files = cycleCommits.length
    ? git(['log', '--name-only', '--format=', ...win.args], { cwd: root }).split('\n').filter(Boolean) : [];
  const slugs = slugsIn(files).sort();
  return {
    since: win.since, head: win.head,
    metrics: {
      leadTimeHours: leadTimes(root, win),
      changeFailureRate: changeFailure(root, slugs, cycleCommits),
      loopRounds: loopRounds(root, slugs),
      reverts: cycleCommits.filter((c) => /^Revert "/.test(c.subject)).length,
      hotfixes: cycleCommits.filter((c) => !/^Revert "/.test(c.subject) && /hotfix/i.test(c.subject)).length,
    },
  };
}

// ---------------------------------------------------------------------------------------------
// History (append-only JSONL; torn last line handled like the evidence ledger)

const validRow = (x) => x && typeof x === 'object' && !Array.isArray(x) && x.v === 1 && typeof x.cycle === 'string'
  && x.metrics && typeof x.metrics === 'object';

export function readHistory(root) {
  const p = join(root, HISTORY);
  if (!existsSync(p)) return { rows: [], warnings: [], torn: null, endsWithNewline: true };
  const text = readFileSync(p, 'utf8');
  const lines = text.split('\n');
  const last = lines.pop();
  const rows = [];
  const parse = (line, n) => {
    let x;
    try { x = JSON.parse(line); } catch (e) { throw new InputError(`${HISTORY}:${n} is not valid JSON: ${e.message}`); }
    if (!validRow(x)) throw new InputError(`${HISTORY}:${n} is not a history row (v 1, cycle, metrics)`);
    return x;
  };
  lines.forEach((line, i) => { if (line.trim()) rows.push(parse(line, i + 1)); });
  const warnings = [];
  let torn = null;
  if (last.trim()) {
    let x = null;
    try { x = JSON.parse(last); } catch { /* torn */ }
    if (x === null) {
      torn = text.length - last.length;
      warnings.push(`${HISTORY}:${lines.length + 1}: torn last line ignored`);
    } else rows.push(parse(last, lines.length + 1));
  }
  return { rows, warnings, torn, endsWithNewline: !last };
}

function appendHistory(root, hist, row) {
  const p = join(root, HISTORY);
  mkdirSync(dirname(p), { recursive: true });
  const warnings = [];
  if (hist.torn !== null) {
    writeFileSync(p, readFileSync(p, 'utf8').slice(0, hist.torn));
    warnings.push(`${HISTORY}: torn last line removed before appending`);
  } else if (existsSync(p) && hist.endsWithNewline === false) appendFileSync(p, '\n');
  appendFileSync(p, JSON.stringify(row) + '\n');
  return warnings;
}

// ---------------------------------------------------------------------------------------------
// Trend and rule

export function trends(rows) {
  const out = {};
  for (const [k, get] of Object.entries(TREND_KEYS)) {
    const [a, b] = rows.slice(-2).map((r) => get(r.metrics));
    if (rows.length < 2 || a == null || b == null) out[k] = 'n/a';
    else out[k] = b > a ? 'worse' : b < a ? 'better' : 'flat';
  }
  return out;
}

export function applyRule(rows) {
  const rules = {};
  const required = [];
  const cur = rows.at(-1);
  const prev = rows.at(-2);
  const cfr = (r) => r?.metrics.changeFailureRate?.rate;
  if (!prev || cfr(cur) == null || cfr(prev) == null) rules.changeFailureRate = `n/a — ${rows.length < 2 ? 'fewer than 2 cycles' : 'no released item in one of the last 2 cycles'}`;
  else if (cfr(cur) > CFR_LIMIT && cfr(prev) > CFR_LIMIT) {
    rules.changeFailureRate = `fires — ${cfr(prev)} and ${cfr(cur)} > ${CFR_LIMIT} in two cycles in a row`;
    required.push({ metric: 'changeFailureRate', why: rules.changeFailureRate });
  } else rules.changeFailureRate = `quiet — ${cfr(cur)} (previous ${cfr(prev)}), limit ${CFR_LIMIT}`;
  const earlier = rows.slice(-4, -1).map((r) => r.metrics.leadTimeHours?.median).filter((x) => x != null);
  const lead = cur?.metrics.leadTimeHours?.median;
  if (earlier.length < 3 || lead == null) rules.leadTimeHours = `n/a — ${earlier.length} earlier cycles with a lead time (3 needed)`;
  else {
    const bound = LEAD_FACTOR * median(earlier);
    rules.leadTimeHours = lead > bound ? `fires — ${lead} h > ${LEAD_FACTOR} × median ${median(earlier)} h of the previous 3 cycles`
      : `quiet — ${lead} h ≤ ${bound} h`;
    if (lead > bound) required.push({ metric: 'leadTimeHours', why: rules.leadTimeHours });
  }
  return { rules, required };
}

const retroDate = (file) => (basename(file).match(/^(\d{4}-\d\d-\d\d)(?:-\d+)?\.md$/) || [])[1] || null;

// The retro record that must hold the required Change items: --retro, else the newest dated on or after the cycle.
export function findRetro(root, cycleAt, explicit) {
  if (explicit) {
    const p = resolve(root, explicit);
    if (!existsSync(p)) throw new InputError(`retro record not found: ${explicit}`);
    return p;
  }
  const dir = join(root, 'docs', 'retros');
  if (!existsSync(dir)) return null;
  const day = String(cycleAt || '').slice(0, 10);
  const seq = (f) => Number(f.match(/^\d{4}-\d\d-\d\d-(\d+)\.md$/)?.[1] ?? 1);
  const files = readdirSync(dir).filter((f) => retroDate(f) && retroDate(f) >= day)
    .sort((a, b) => (retroDate(a) === retroDate(b) ? seq(a) - seq(b) : retroDate(a) < retroDate(b) ? -1 : 1));
  return files.length ? join(dir, files.at(-1)) : null;
}

export function checkRetro(path, required) {
  if (!path) return required.map((r) => ({ ...r, satisfied: false, note: 'no retro record for this cycle yet' }));
  const text = readFileSync(path, 'utf8');
  const rowsOf = (title) => {
    const s = findSection(text, title, { level: 2 });
    return s ? parseTables(s.body).flatMap(tableToObjects) : [];
  };
  const changes = rowsOf('Change');
  const actions = rowsOf('Actions').filter((a) => /^RA-\d{8}-\d+$/.test(String(a.ID || '').trim()));
  return required.map((r) => {
    const ids = changes.filter((c) => METRIC_NAME[r.metric].test(c.Observation || '')).map((c) => String(c['#'] || '').trim());
    const acted = ids.find((id) => id && actions.some((a) => new RegExp(`\\b${id}\\b`).test(a.From || '')));
    const note = !ids.length ? 'no §Change row names the metric' : acted ? `${acted} with an action` : `${ids.join(', ')} has no RA- action citing it`;
    return { ...r, satisfied: Boolean(acted), note };
  });
}

// ---------------------------------------------------------------------------------------------

const fmt = (v, unit = '') => (v == null ? 'n/a' : `${v}${unit}`);

export async function main(argv = process.argv.slice(2), out = process.stdout, err = process.stderr) {
  const { flags } = parseArgs(argv, { booleans: ['json', 'help', 'record'] });
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const json = Boolean(flags.json);
  for (const f of ['since', 'cycle', 'retro']) if (f in flags && typeof flags[f] !== 'string') throw new InputError(`--${f} needs a value`);
  if (!isRepo(process.cwd())) throw new InputError(`not a git repository: ${process.cwd()}`);
  const root = topLevel(process.cwd());
  const hist = readHistory(root);
  const warnings = [...hist.warnings];
  const cycle = flags.cycle;
  if (flags.record && !cycle) throw new InputError('--record needs --cycle <label>');
  const known = cycle ? hist.rows.find((r) => r.cycle === cycle) : null;
  if (flags.record && known) throw new InputError(`cycle "${cycle}" is already in ${HISTORY}; the history is append-only`);

  let row;
  let rows;
  if (known) {
    row = known;
    rows = hist.rows.slice(0, hist.rows.indexOf(known) + 1);
  } else {
    const since = flags.since ?? hist.rows.at(-1)?.head ?? undefined;
    const m = measure(root, { since });
    row = { v: 1, cycle: cycle || 'current', at: now().toISOString(), since: m.since, head: m.head, metrics: m.metrics };
    rows = [...hist.rows, row];
    if (flags.record) warnings.push(...appendHistory(root, hist, row));
  }
  const trend = trends(rows);
  const { rules, required } = applyRule(rows);
  const retroPath = required.length || flags.retro ? findRetro(root, row.at, flags.retro) : null;
  const checked = checkRetro(retroPath, required);
  const ok = checked.every((r) => r.satisfied);
  for (const w of warnings) err.write(`WARN ${w}\n`);

  const m = row.metrics;
  const lt = m.leadTimeHours;
  const cf = m.changeFailureRate;
  const lr = m.loopRounds;
  const rel = (p) => (p ? p.slice(root.length + 1) : null);
  const lines = [
    `Cycle ${row.cycle} · since ${row.since || '(start of history)'} · head ${String(row.head || '').slice(0, 7) || 'n/a'}${known ? ' (recorded)' : ''}`,
    `  Lead time, first task commit → merge: median ${fmt(lt.median, ' h')} · max ${fmt(lt.max, ' h')} · ${lt.n} merges${lt.unmeasured ? ` (${lt.unmeasured} without a task commit)` : ''}  [${trend.leadTimeHours}]`,
    ...lt.items.map((x) => `    ${x.item}: ${x.hours} h (${x.first} → merge ${x.merge})`),
    `  Change-failure rate: ${cf.rate == null ? 'n/a — no released item' : `${cf.failed}/${cf.released} = ${cf.rate}`}${cf.pending ? ` · ${cf.pending} window open` : ''}  [${trend.changeFailureRate}]`,
    ...cf.items.map((x) => `    ${x.item}: ${x.status} (${x.source})`),
    `  Loop rounds per task: max ${fmt(lr.max)} · mean ${fmt(lr.mean)} · ${lr.tasks} tasks in ${lr.ledgers} ledgers · escalations ${lr.escalations}  [${trend.loopRoundsMax}/${trend.loopRoundsMean}]`,
    `  Reverts ${m.reverts} [${trend.reverts}] · hotfixes ${m.hotfixes}`,
    `Trend rule: change-failure rate ${rules.changeFailureRate}; lead time ${rules.leadTimeHours}`,
    ...checked.map((r) => `  ${r.satisfied ? 'OK  ' : 'NEED'} Change item and action for ${r.metric}: ${r.note}${retroPath ? ` (${rel(retroPath)})` : ''}`),
    ...(flags.record && !known ? [`Recorded cycle ${row.cycle} in ${HISTORY}`] : []),
    ok ? 'Result: PASS' : 'Result: FAIL (the retro needs a Change item naming the metric and an RA- action from it; references/retrospective.md §Trends)',
  ];
  return report({
    ok, json, lines,
    result: {
      cycle: row.cycle, at: row.at, since: row.since, head: row.head, recorded: Boolean(flags.record && !known),
      metrics: m, trend, rules, required: checked, retro: { path: rel(retroPath), satisfied: ok }, warnings,
    },
  }, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
