#!/usr/bin/env node
// preflight — gate at Build run start and at every resume (mechanisms 8.2, 8.3).
// Dependency-free Node >= 18. Exit codes: 0 every check passed · 1 a check failed (run not started) · 2 input missing.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { currentBranch, defaultBranch, git, headSha, isRepo, topLevel } from './lib/git.mjs';
import {
  appendEvent, approvalState, dodCommands, ensureRunsDir, ledgerPath, loadLedger, now, readDod, runDir,
} from './run-ledger.mjs';

export const MIN_NODE = 18;
export const DEFAULT_TIMEOUT_MIN = 30;
export const TAIL_LINES = 20;
// Paths written by the run itself; they never make the tree dirty.
const RUN_PATHS = ['.agentic-sdlc/runs/', '.agentic-sdlc/evidence/', '.agentic-sdlc/preflight.json'];
const PROTECTED = new Set(['main', 'master', 'trunk', 'develop']);

const HELP = `preflight — Build gate at run start and at every resume

Usage: node preflight.mjs [--run <id>] [--plan <specs/NNN-slug/plan.md>] [--mode attended|unattended]
                          [--timeout <minutes per DoD command, default ${DEFAULT_TIMEOUT_MIN}>] [--json] [--help]

Checks (each PASS, FAIL or SKIP):
  node          Node.js >= ${MIN_NODE}
  clean-tree    no uncommitted or untracked files (run state under .agentic-sdlc/runs|evidence ignored)
  branch        a named branch that is not the default branch (or main/master/trunk/develop)
  isolation     unattended: a linked worktree on an sdlc/* branch (created by run-ledger start)
  tools         the first program of every DoD command resolves on PATH
  approvals     Specify and Design sign-offs bind the current hashes (plan without ## Approvals: SKIP when attended)
  ledger        the run ledger parses (with --run)
  baseline-dod  every command of the AGENTS.md sdlc-dod block exits 0 before any change (SKIP after an earlier FAIL)
  coverage-floor  coverage/coverage-summary.json total.lines.pct ≥ coverage_min (SKIP when not written)

Unattended mode requires --run and a plan (from --plan or the run ledger).
Writes .agentic-sdlc/runs/<id>/preflight.json (or .agentic-sdlc/runs/preflight.json without --run) and appends a
preflight event to the run ledger. run-ledger refuses "task --state started" until a passing preflight follows the
latest start, resume or env-cause failure.
Exit: 0 pass · 1 a check failed (run not started) · 2 input missing (not a repository, no DoD block, unknown run).`;

function check(id, status, detail) {
  return { id, status, detail };
}

function porcelain(root) {
  const recs = git(['status', '--porcelain', '-z', '--untracked-files=all'], { cwd: root }).split('\0');
  const dirty = [];
  for (let i = 0; i < recs.length; i++) {
    const rec = recs[i];
    if (!rec) continue;
    if (rec[0] === 'R' || rec[0] === 'C') i++;
    const path = rec.slice(3);
    if (!RUN_PATHS.some((p) => path === p || path.startsWith(p))) dirty.push(path);
  }
  return dirty;
}

// First program of a shell command, skipping leading VAR=value assignments.
export function programOf(cmd) {
  const tokens = String(cmd).trim().split(/\s+/);
  const prog = tokens.find((t) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(t));
  return prog ? prog.replace(/^['"]|['"]$/g, '') : null;
}

function resolves(prog, root) {
  if (prog.includes('/')) return existsSync(resolve(root, prog));
  const r = spawnSync('sh', ['-c', 'command -v "$1" >/dev/null 2>&1', 'sh', prog], { cwd: root });
  return r.status === 0;
}

function tail(text, n = TAIL_LINES) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').replace(/\n+$/, '').split('\n');
  return lines.slice(-n);
}

// Same reader as the CI floor step: json-summary total.lines.pct (Istanbul, c8, Vitest, Jest).
// Other formats (Go, .NET, JaCoCo, coverage.py) are compared by CI only → SKIP.
export const COVERAGE_SUMMARY = 'coverage/coverage-summary.json';
function coverageFloor(root, entries, dodResults) {
  const min = Number(entries.coverage_min);
  if (entries.coverage_min === undefined || /^n\/a\b/i.test(entries.coverage_min) || !Number.isFinite(min)) return check('coverage-floor', 'SKIP', 'no numeric coverage_min');
  if (!dodResults.some((d) => d.key === 'coverage' || d.key === 'test')) return check('coverage-floor', 'SKIP', 'no coverage or test command ran');
  const file = join(root, COVERAGE_SUMMARY);
  if (!existsSync(file)) return check('coverage-floor', 'SKIP', `${COVERAGE_SUMMARY} not written (non json-summary format: CI compares the floor)`);
  let pct;
  try { pct = Number(JSON.parse(readFileSync(file, 'utf8')).total.lines.pct); } catch { pct = NaN; }
  if (!Number.isFinite(pct)) return check('coverage-floor', 'FAIL', `${COVERAGE_SUMMARY} has no numeric total.lines.pct`);
  return check('coverage-floor', pct >= min ? 'PASS' : 'FAIL', `line coverage ${pct}% ${pct >= min ? '≥' : '<'} coverage_min ${min}`);
}

export function runPreflight({ cwd = process.cwd(), runId = null, plan = null, mode = 'attended', timeoutMin = DEFAULT_TIMEOUT_MIN } = {}) {
  if (!['attended', 'unattended'].includes(mode)) throw new InputError('--mode is attended or unattended');
  if (!isRepo(cwd)) throw new InputError(`not inside a git repository: ${cwd}`);
  const root = topLevel(cwd);
  const dod = readDod(root);
  let ledger = null;
  let events = null;
  if (runId) {
    ledger = ledgerPath(root, runId);
    if (!existsSync(ledger)) throw new InputError(`run ${runId} has no ledger at ${ledger}; start it with run-ledger start`);
  }
  const checks = [];

  const major = Number(process.versions.node.split('.')[0]);
  checks.push(check('node', major >= MIN_NODE ? 'PASS' : 'FAIL', `node ${process.versions.node} (need >= ${MIN_NODE})`));

  const dirty = porcelain(root);
  checks.push(check('clean-tree', dirty.length ? 'FAIL' : 'PASS',
    dirty.length ? `${dirty.length} uncommitted path(s): ${dirty.slice(0, 5).join(', ')}${dirty.length > 5 ? ', …' : ''} — commit or discard them` : 'working tree clean'));

  const branch = currentBranch(root);
  const def = defaultBranch(root);
  const badBranch = branch === 'HEAD' ? 'detached HEAD' : branch === def || PROTECTED.has(branch) ? `on ${branch} (default or protected branch)` : null;
  checks.push(check('branch', badBranch ? 'FAIL' : 'PASS', badBranch ? `${badBranch} — work on a feature or sdlc/* branch` : `on ${branch} (default ${def})`));

  if (runId) {
    try {
      events = loadLedger(ledger);
      checks.push(check('ledger', 'PASS', `${events.length} event(s) in ${relative(root, ledger)}`));
    } catch (e) {
      checks.push(check('ledger', 'FAIL', `${e.message} → NEEDS_HUMAN`));
    }
  } else {
    checks.push(check('ledger', 'SKIP', 'no --run'));
  }
  const start = events ? events[0] : null;
  const planPath = plan ? resolve(cwd, plan) : start ? join(root, start.plan) : null;
  if (mode === 'unattended' && (!runId || !planPath)) throw new InputError('unattended mode requires --run <id> and a plan (--plan or the run ledger)');

  if (mode === 'unattended') {
    const gitDir = resolve(root, git(['rev-parse', '--git-dir'], { cwd: root }).trim());
    const common = resolve(root, git(['rev-parse', '--git-common-dir'], { cwd: root }).trim());
    const linked = gitDir !== common;
    const ok = linked && branch.startsWith('sdlc/');
    checks.push(check('isolation', ok ? 'PASS' : 'FAIL',
      ok ? `linked worktree ${root} on ${branch}` : `${linked ? '' : 'not a linked worktree; '}${branch.startsWith('sdlc/') ? '' : `branch ${branch} is not sdlc/*; `}create isolation with run-ledger start --mode unattended`));
  } else {
    checks.push(check('isolation', 'SKIP', 'attended mode'));
  }

  const cmds = dodCommands(dod.entries);
  if (process.platform === 'win32') {
    checks.push(check('tools', 'SKIP', 'PATH lookup not run on Windows; the baseline DoD run proves the tools'));
  } else {
    const missing = [...new Set(cmds.map((c) => programOf(c.cmd)).filter(Boolean))].filter((p) => !resolves(p, root));
    checks.push(check('tools', missing.length ? 'FAIL' : 'PASS', missing.length ? `not found: ${missing.join(', ')}` : `${cmds.length} DoD command(s) resolve`));
  }

  if (!planPath) {
    checks.push(check('approvals', 'SKIP', 'no plan given (Quick path or ad-hoc run)'));
  } else if (!existsSync(planPath)) {
    throw new InputError(`plan not found: ${relative(cwd, planPath)}`);
  } else {
    const a = approvalState(planPath);
    const problems = [];
    if (!a.plan.section) {
      if (mode === 'unattended') problems.push('plan has no ## Approvals section');
    } else if (!a.plan.valid) {
      problems.push(a.plan.detail || `no approved Design row binds the current plan hash ${a.plan.hash} (approval void → change protocol)`);
    }
    if (a.spec && !a.spec.valid && (a.spec.section || mode === 'unattended')) problems.push(`no approved row binds the current spec hash ${a.spec.hash}`);
    if (mode === 'unattended' && !a.spec) problems.push('spec.md missing next to the plan');
    if (start && start.hashes) {
      if (start.hashes.plan && start.hashes.plan !== a.plan.hash) problems.push(`plan hash ${a.plan.hash} ≠ ${start.hashes.plan} at run start`);
      if (start.hashes.spec && a.spec && start.hashes.spec !== a.spec.hash) problems.push(`spec hash ${a.spec.hash} ≠ ${start.hashes.spec} at run start`);
    }
    const skip = !a.plan.section && mode === 'attended' && !problems.length;
    checks.push(check('approvals', problems.length ? 'FAIL' : skip ? 'SKIP' : 'PASS',
      problems.length ? problems.join('; ') : skip ? 'plan has no ## Approvals section (attended: the human approves in the session)' : `plan ${a.plan.hash}${a.spec ? ` · spec ${a.spec.hash}` : ''} approved`));
  }

  const dodResults = [];
  if (checks.some((c) => c.status === 'FAIL')) {
    checks.push(check('baseline-dod', 'SKIP', 'an earlier check failed'));
  } else {
    for (const { key, cmd } of cmds) {
      const t0 = Date.now();
      const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', timeout: timeoutMin * 60_000, maxBuffer: 64 * 1024 * 1024 });
      const exit = r.error && r.error.code === 'ETIMEDOUT' ? 'timeout' : r.status;
      dodResults.push({ key, cmd, exit, ms: Date.now() - t0, tail: tail(`${r.stdout || ''}${r.stderr || ''}`) });
    }
    const red = dodResults.filter((d) => d.exit !== 0);
    checks.push(check('baseline-dod', red.length ? 'FAIL' : 'PASS',
      red.length ? `red baseline: ${red.map((d) => `${d.key} (exit ${d.exit})`).join(', ')} — fix or record the baseline before any change` : `${dodResults.length} command(s) green`));
    if (!red.length) checks.push(coverageFloor(root, dod.entries, dodResults));
  }

  const ok = checks.every((c) => c.status !== 'FAIL');
  const result = {
    v: 1, ok, run: runId, mode, time: now().toISOString(), root, head: headSha(root), branch,
    plan: planPath ? relative(root, planPath).split('\\').join('/') : null, dodSource: dod.file, checks, dod: dodResults,
  };
  ensureRunsDir(root);
  const outDir = runId ? runDir(root, runId) : join(root, '.agentic-sdlc', 'runs');
  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, 'preflight.json');
  writeFileSync(file, JSON.stringify(result, null, 2) + '\n');
  if (events) {
    appendEvent(ledger, events, { type: 'preflight', ok, head: result.head, failed: checks.filter((c) => c.status === 'FAIL').map((c) => c.id) });
  }
  return { ...result, file };
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags } = parseArgs(argv, { booleans: ['json', 'help'] });
  if (flags.help) { out.write(HELP + '\n'); return EXIT.PASS; }
  const timeoutMin = flags.timeout === undefined ? DEFAULT_TIMEOUT_MIN : Number(flags.timeout);
  if (!Number.isFinite(timeoutMin) || timeoutMin <= 0) throw new InputError('--timeout is a positive number of minutes');
  const r = runPreflight({
    runId: flags.run && flags.run !== true ? String(flags.run) : null,
    plan: flags.plan && flags.plan !== true ? String(flags.plan) : null,
    mode: flags.mode ? String(flags.mode) : 'attended',
    timeoutMin,
  });
  const lines = [
    `preflight ${r.ok ? 'PASS' : 'FAIL'} · ${r.mode}${r.run ? ` · run ${r.run}` : ''} · ${r.branch} @ ${(r.head || 'no commit').slice(0, 12)}`,
    ...r.checks.map((c) => `  ${c.status.padEnd(4)} ${c.id.padEnd(12)} ${c.detail}`),
    ...r.dod.filter((d) => d.exit !== 0).flatMap((d) => [`  --- ${d.key}: ${d.cmd} (exit ${d.exit}), last ${d.tail.length} line(s):`, ...d.tail.map((l) => `      ${l}`)]),
    `written ${r.file}`,
  ];
  if (!r.ok) lines.push('run not started: fix the FAIL rows and re-run preflight');
  return report({ ok: r.ok, code: r.ok ? EXIT.PASS : EXIT.FAIL, json: !!flags.json, result: r, lines }, out);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) run(() => main());
