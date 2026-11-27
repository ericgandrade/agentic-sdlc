#!/usr/bin/env node
// evidence — the fingerprint-bound evidence ledger. `record` runs one command in the repository root and
// appends its result to .agentic-sdlc/evidence/ledger.jsonl; `check` passes only when every AC has a
// passing row on the CURRENT fingerprint. The ledger path is excluded from the fingerprint.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { fingerprint, isRepo, topLevel } from './lib/git.mjs';
import { readMarkdownFile } from './lib/md.mjs';
import { specAcIds } from './plan-graph.mjs';

export const LEDGER = '.agentic-sdlc/evidence/ledger.jsonl';
export const DEFAULT_TIMEOUT_MIN = 30;
const TAIL_LINES = 40;
const AC = /^AC-\d+$/;

const HELP = `Usage: node evidence.mjs record [--ac AC-n ...] [--name <label>] [--timeout <minutes>] [--json] -- <cmd...>
       node evidence.mjs check [--ac AC-n ...] [--spec specs/NNN-slug/spec.md] [--json]

record  runs <cmd> through the shell in the repository root and appends one row to ${LEDGER}:
        {v, name, cmd, acs, exit, stdoutSha256, tail (last ${TAIL_LINES} lines of stdout then stderr), fingerprint
        (computed after the command), at, agent:{host, model}}. Agent context: AGENTIC_SDLC_HOST and
        AGENTIC_SDLC_MODEL ("unknown" when unset). A fingerprint that changes during the run marks the row
        treeChanged (never green; re-run). --ac is repeatable and takes comma-separated IDs.
check   reports each AC (from --ac, else the spec's AC IDs): green (the latest row on the current fingerprint
        passed) · red (it failed) · stale (rows only on older fingerprints) · missing (no row).
Ledger: a torn last line (no newline, not JSON) is ignored with a warning; any other invalid line → exit 2.
Exit codes: 0 command passed / every AC green · 1 command failed / an AC not green · 2 input missing or unparsable.`;

const sha = (text) => createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');

function rootOf(cwd) {
  if (!isRepo(cwd)) throw new InputError(`not a git repository: ${cwd}`);
  return topLevel(cwd);
}

// Repeatable "--ac AC-1", "--ac=AC-1,AC-2" before "--"; parseArgs keeps only the last value of a flag.
export function acFlags(argv) {
  const ids = [];
  for (let i = 0; i < argv.length && argv[i] !== '--'; i++) {
    let v = null;
    if (argv[i] === '--ac') v = argv[++i] ?? '';
    else if (argv[i].startsWith('--ac=')) v = argv[i].slice(5);
    if (v === null) continue;
    for (const id of v.split(/[\s,]+/).filter(Boolean)) {
      if (!AC.test(id)) throw new InputError(`not an AC ID: ${id} (AC-n)`);
      ids.push(id);
    }
  }
  return [...new Set(ids)];
}

function validRow(x) {
  return x && typeof x === 'object' && !Array.isArray(x) && x.v === 1 && Array.isArray(x.acs)
    && 'exit' in x && typeof x.fingerprint === 'string';
}

// Reads the ledger: { rows, warnings, torn } where torn is the byte length of the valid prefix when the
// last line is torn. No file → no rows.
export function readLedger(root) {
  const p = join(root, LEDGER);
  if (!existsSync(p)) return { rows: [], warnings: [], torn: null };
  const text = readFileSync(p, 'utf8');
  const lines = text.split('\n');
  const last = lines.pop(); // '' when the file ends with a newline
  const rows = [];
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    let x;
    try { x = JSON.parse(line); } catch (e) { throw new InputError(`${LEDGER}:${i + 1} is not valid JSON: ${e.message}`); }
    if (!validRow(x)) throw new InputError(`${LEDGER}:${i + 1} is not an evidence row (v 1, acs[], exit, fingerprint)`);
    rows.push(x);
  });
  const warnings = [];
  let torn = null;
  if (last.trim()) {
    let x = null;
    try { x = JSON.parse(last); } catch { /* torn */ }
    if (x === null) {
      torn = text.length - last.length;
      warnings.push(`${LEDGER}:${lines.length + 1}: torn last line ignored`);
    } else if (!validRow(x)) {
      throw new InputError(`${LEDGER}:${lines.length + 1} is not an evidence row (v 1, acs[], exit, fingerprint)`);
    } else rows.push(x);
  }
  return { rows, warnings, torn, endsWithNewline: !last };
}

// Runs one command and appends its row. Returns { ok, row, warnings }.
export function recordEvidence({ cwd = process.cwd(), cmd, acs = [], name, env = process.env, timeoutMin = DEFAULT_TIMEOUT_MIN }) {
  if (!cmd || !cmd.trim()) throw new InputError('no command: evidence record [--ac AC-n] -- <cmd...>');
  const root = rootOf(cwd);
  const ledger = readLedger(root); // refuse to append to a corrupt ledger
  const before = fingerprint({ cwd: root }).short;
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', env, timeout: timeoutMin * 60_000, maxBuffer: 64 * 1024 * 1024 });
  let exit = r.status;
  if (r.error) exit = r.error.code === 'ETIMEDOUT' ? 'timeout' : `error:${r.error.code || r.error.message}`;
  else if (exit === null) exit = `signal:${r.signal}`;
  const after = fingerprint({ cwd: root }).short;
  const output = [String(r.stdout || '').trimEnd(), String(r.stderr || '').trimEnd()].filter(Boolean).join('\n');
  const row = {
    v: 1,
    name: name || cmd,
    cmd,
    acs,
    exit,
    stdoutSha256: sha(r.stdout),
    tail: output.split('\n').slice(-TAIL_LINES).join('\n'),
    fingerprint: after,
    at: new Date().toISOString(),
    agent: { host: env.AGENTIC_SDLC_HOST || 'unknown', model: env.AGENTIC_SDLC_MODEL || 'unknown' },
  };
  if (before !== after) row.treeChanged = true;
  const p = join(root, LEDGER);
  mkdirSync(dirname(p), { recursive: true });
  const warnings = [];
  if (ledger.torn !== null) {
    // Drop the torn fragment so the new row never merges with it or turns it into an invalid middle line.
    writeFileSync(p, readFileSync(p, 'utf8').slice(0, ledger.torn));
    warnings.push(`${LEDGER}: torn last line removed before appending`);
  } else if (existsSync(p) && ledger.endsWithNewline === false) appendFileSync(p, '\n');
  appendFileSync(p, JSON.stringify(row) + '\n');
  if (row.treeChanged) warnings.push(`the fingerprint changed during the run (${before} → ${after}); re-run on the settled tree`);
  return { ok: exit === 0 && !row.treeChanged, row, warnings };
}

// Status of each AC against the current fingerprint. Returns { ok, fingerprint, acs, warnings }.
export function checkEvidence({ cwd = process.cwd(), acs }) {
  const root = rootOf(cwd);
  const { rows, warnings } = readLedger(root);
  const current = fingerprint({ cwd: root }).short;
  const result = acs.map((ac) => {
    const mine = rows.filter((x) => x.acs.includes(ac));
    const fresh = mine.filter((x) => x.fingerprint === current);
    if (fresh.length) {
      const latest = fresh[fresh.length - 1];
      const green = latest.exit === 0 && !latest.treeChanged;
      return { ac, status: green ? 'green' : 'red', row: latest };
    }
    if (mine.length) return { ac, status: 'stale', row: mine[mine.length - 1] };
    return { ac, status: 'missing', row: null };
  });
  return { ok: result.every((x) => x.status === 'green'), fingerprint: current, acs: result, warnings };
}

export async function main(argv = process.argv.slice(2), out = process.stdout, err = process.stderr) {
  const sep = argv.indexOf('--');
  const head = sep < 0 ? argv : argv.slice(0, sep);
  const { flags, positional } = parseArgs(head);
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const json = Boolean(flags.json);
  const acs = acFlags(head);
  const mode = positional[0];
  if (mode === 'record') {
    const timeoutMin = flags.timeout === undefined ? DEFAULT_TIMEOUT_MIN : Number(flags.timeout);
    if (!Number.isFinite(timeoutMin) || timeoutMin <= 0) throw new InputError('--timeout is a positive number of minutes');
    const cmd = sep < 0 ? '' : argv.slice(sep + 1).join(' ');
    const r = recordEvidence({ cmd, acs, name: typeof flags.name === 'string' ? flags.name : undefined, timeoutMin });
    for (const w of r.warnings) err.write(`WARN ${w}\n`);
    const { row } = r;
    const lines = [...(row.tail ? [row.tail] : []), `${r.ok ? 'PASS' : 'FAIL'} evidence record ${row.acs.join(' ') || '(no AC)'}: exit ${row.exit} on ${row.fingerprint}  ${row.cmd}`];
    return report({ ok: r.ok, json, result: { row, warnings: r.warnings }, lines }, out);
  }
  if (mode === 'check') {
    let ids = acs;
    if (!ids.length) {
      if (typeof flags.spec !== 'string') throw new InputError('name the ACs to check: --ac AC-n or --spec specs/NNN-slug/spec.md');
      const file = resolve(flags.spec);
      if (!existsSync(file)) throw new InputError(`spec not found: ${flags.spec}`);
      ids = specAcIds(readMarkdownFile(file));
      if (!ids.length) throw new InputError(`spec defines no AC-n IDs: ${flags.spec}`);
    }
    const r = checkEvidence({ acs: ids });
    for (const w of r.warnings) err.write(`WARN ${w}\n`);
    const lines = r.acs.map((x) => `${x.status.padEnd(7)} ${x.ac}${x.row ? `  exit ${x.row.exit} on ${x.row.fingerprint}  ${x.row.name}` : ''}`);
    const bad = r.acs.filter((x) => x.status !== 'green').length;
    lines.push(r.ok ? `Result: PASS (${ids.length} AC green on ${r.fingerprint})` : `Result: FAIL (${bad} of ${ids.length} AC not green on ${r.fingerprint}; record fresh evidence)`);
    return report({ ok: r.ok, json, result: r, lines }, out);
  }
  throw new InputError(`unknown mode: ${mode ?? '(none)'} (record | check); --help for usage`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
