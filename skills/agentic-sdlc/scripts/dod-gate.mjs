#!/usr/bin/env node
// dod-gate — the Definition of Done gate. `run` executes every sdlc-dod command (plus extension dod.checks)
// in the current worktree and records each result against the evidence fingerprint; `check` passes only
// when every recorded command exited 0 on the CURRENT fingerprint. run-ledger calls runGate() in-process.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { fingerprint, isRepo, topLevel } from './lib/git.mjs';
import { extractFencedBlocks, parseKeyValueBlock, readMarkdownFile } from './lib/md.mjs';
import { checkExtensions } from './ext-check.mjs';

export const RECORD = '.agentic-sdlc/evidence/dod-gate.json'; // excluded from the fingerprint
export const DEFAULT_TIMEOUT_MIN = 30;

const HELP = `Usage: node dod-gate.mjs [run] [--timeout <minutes>] [--json]
       node dod-gate.mjs check [--json]

run    runs each sdlc-dod command (AGENTS.md or CLAUDE.md; "n/a" keys and coverage_min skipped) and each
       dod.checks extension listed by ext-check, then writes ${RECORD}: per command
       {name, cmd, exit, stdoutSha256, fingerprint, agent:{host, model}}. The agent context comes from
       AGENTIC_SDLC_HOST and AGENTIC_SDLC_MODEL ("unknown" when unset).
check  reads the record: passes only when it covers every current DoD command, every exit is 0 and every
       fingerprint equals the current one. Rules: NO_RECORD · RED · STALE.
Exit codes: 0 gate green · 1 a command failed, or the record is missing or stale · 2 no sdlc-dod block.`;

const sha = (text) => createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');

function rootOf(cwd) {
  if (!isRepo(cwd)) throw new InputError(`not a git repository: ${cwd}`);
  return topLevel(cwd);
}

function dodBlock(file) {
  const blocks = extractFencedBlocks(readMarkdownFile(file), { info: 'sdlc-dod' });
  return blocks.length ? parseKeyValueBlock(blocks[0].content) : null;
}

// Commands to run: core sdlc-dod keys, then dod.checks extensions that pass ext-check.
export function gateCommands(root) {
  let entries = null;
  let file = null;
  for (const f of ['AGENTS.md', 'CLAUDE.md']) {
    const p = join(root, f);
    if (existsSync(p) && (entries = dodBlock(p))) { file = f; break; }
  }
  if (!entries) throw new InputError('no ```sdlc-dod block in AGENTS.md or CLAUDE.md (run project-context setup)');
  const commands = [];
  const skipped = [];
  for (const [name, cmd] of Object.entries(entries)) {
    if (name === 'coverage_min') continue;
    if (/^n\/a\b/i.test(cmd)) skipped.push(name);
    else commands.push({ name, cmd });
  }
  const ext = checkExtensions({ cwd: root, point: 'dod.checks' });
  const refused = new Set(ext.errors.map((e) => e.extension));
  for (const e of ext.extensions) {
    if (refused.has(e.name)) continue;
    const extra = dodBlock(join(root, e.entry)) || {};
    for (const [key, cmd] of Object.entries(extra)) commands.push({ name: `ext:${e.name}:${key}`, cmd });
  }
  return { file, commands, skipped, refused: [...refused] };
}

// Runs the gate and writes the record. Returns { ok, fingerprint, records, skipped, refused, failed }.
export function runGate({ cwd = process.cwd(), env = process.env, timeoutMin = DEFAULT_TIMEOUT_MIN } = {}) {
  const root = rootOf(cwd);
  const { commands, skipped, refused } = gateCommands(root);
  const agent = { host: env.AGENTIC_SDLC_HOST || 'unknown', model: env.AGENTIC_SDLC_MODEL || 'unknown' };
  const results = [];
  for (const { name, cmd } of commands) {
    const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', env, timeout: timeoutMin * 60_000, maxBuffer: 64 * 1024 * 1024 });
    const exit = r.error && r.error.code === 'ETIMEDOUT' ? 'timeout' : r.status;
    results.push({ name, cmd, exit, stdoutSha256: sha(r.stdout), tail: String(r.stderr || r.stdout || '').trim().split('\n').slice(-5).join('\n') });
  }
  // The fingerprint of the tree the commands left behind; the record file itself is excluded from it.
  const fp = fingerprint({ cwd: root }).short;
  const records = results.map(({ tail, ...x }) => ({ ...x, fingerprint: fp, agent }));
  const failed = results.filter((x) => x.exit !== 0);
  const record = { v: 1, at: new Date().toISOString(), fingerprint: fp, records, skipped, refused };
  mkdirSync(join(root, '.agentic-sdlc', 'evidence'), { recursive: true });
  writeFileSync(join(root, RECORD), JSON.stringify(record, null, 2) + '\n');
  return { ok: failed.length === 0 && commands.length > 0, fingerprint: fp, records, skipped, refused, failed, empty: commands.length === 0 };
}

// Checks the record against the current tree. Returns { ok, rule, detail, fingerprint }.
export function checkGate({ cwd = process.cwd() } = {}) {
  const root = rootOf(cwd);
  const { commands } = gateCommands(root);
  const current = fingerprint({ cwd: root }).short;
  const p = join(root, RECORD);
  if (!existsSync(p)) return { ok: false, rule: 'NO_RECORD', detail: `no ${RECORD}; run dod-gate`, fingerprint: current };
  let rec;
  try {
    rec = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    throw new InputError(`${RECORD} is not valid JSON: ${e.message}`);
  }
  const red = rec.records.filter((x) => x.exit !== 0);
  if (red.length) return { ok: false, rule: 'RED', detail: red.map((x) => `${x.name} (${x.cmd}) exit ${x.exit}`).join('; '), fingerprint: current };
  const want = commands.map((c) => `${c.name}\0${c.cmd}`).sort().join('\n');
  const have = rec.records.map((c) => `${c.name}\0${c.cmd}`).sort().join('\n');
  if (want !== have) return { ok: false, rule: 'STALE', detail: 'the DoD commands changed since the record; run dod-gate', fingerprint: current };
  const old = rec.records.filter((x) => x.fingerprint !== current);
  if (old.length) return { ok: false, rule: 'STALE', detail: `recorded on ${old[0].fingerprint}, current ${current}; run dod-gate`, fingerprint: current };
  return { ok: true, rule: null, detail: `${rec.records.length} commands green on ${current}`, fingerprint: current };
}

// One-line summary used by run-ledger when it refuses a transition.
export function gateFailureLines(r) {
  if (r.empty) return ['dod-gate: the sdlc-dod block lists no runnable command'];
  return r.failed.map((f) => `dod-gate: FAIL ${f.name}: ${f.cmd} → exit ${f.exit}${f.tail ? ` (${f.tail.split('\n').pop()})` : ''}`);
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv);
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const mode = positional[0] ?? 'run';
  if (mode === 'check') {
    const r = checkGate();
    const lines = [r.ok ? `PASS dod-gate check: ${r.detail}` : `FAIL dod-gate check ${r.rule}: ${r.detail}`];
    return report({ ok: r.ok, json: Boolean(flags.json), result: r, lines }, out);
  }
  if (mode !== 'run') throw new InputError(`unknown mode: ${mode} (run | check)`);
  const timeoutMin = flags.timeout === undefined ? DEFAULT_TIMEOUT_MIN : Number(flags.timeout);
  if (!Number.isFinite(timeoutMin) || timeoutMin <= 0) throw new InputError('--timeout is a positive number of minutes');
  const r = runGate({ timeoutMin });
  const lines = r.records.map((x) => `${x.exit === 0 ? 'PASS' : 'FAIL'}  ${x.name.padEnd(12)} exit ${x.exit}  ${x.cmd}`);
  for (const s of r.skipped) lines.push(`SKIP  ${s.padEnd(12)} n/a`);
  for (const s of r.refused) lines.push(`SKIP  extension ${s}: refused by ext-check`);
  lines.push(r.ok ? `Result: PASS on ${r.fingerprint}` : `Result: FAIL (${r.failed.length} red) on ${r.fingerprint}`);
  return report({ ok: r.ok, json: Boolean(flags.json), result: r, lines }, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
