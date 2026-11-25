import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, cpSync, existsSync, readFileSync, rmSync, utimesSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentHash } from '../lib/md.mjs';
import { programOf } from '../preflight.mjs';
import { makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PREFLIGHT = join(HERE, '..', 'preflight.mjs');
const LEDGER = join(HERE, '..', 'run-ledger.mjs');
const FIX = join(HERE, 'fixtures');
const PROJECT = join(FIX, 'run-ledger', 'project');
const PLAN = 'specs/001-demo/plan.md';
const ENV = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}` };
const worktrees = [];

after(() => {
  for (const w of worktrees) rmSync(w, { recursive: true, force: true });
  cleanup();
});

function exec(script, cwd, ...args) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', env: ENV });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
const preflight = (cwd, ...a) => exec(PREFLIGHT, cwd, ...a);
const ledger = (cwd, ...a) => exec(LEDGER, cwd, ...a);

// Fixture project committed on main, then checked out on a feature branch.
function project({ branch = 'feat/001-demo' } = {}) {
  const dir = makeRepo('preflight');
  cpSync(PROJECT, dir, { recursive: true });
  commit(dir, 'fixture project');
  if (branch) sh(dir, 'checkout', '-q', '-b', branch);
  return dir;
}

const json = (r) => JSON.parse(r.out);
const statusOf = (r, id) => json(r).checks.find((c) => c.id === id).status;

test('fixture approval rows bind the current spec and plan hashes', () => {
  const spec = readFileSync(join(PROJECT, 'specs/001-demo/spec.md'), 'utf8');
  const plan = readFileSync(join(PROJECT, PLAN), 'utf8');
  assert.match(spec, new RegExp(`\\| ${contentHash(spec)} \\|`));
  assert.match(plan, new RegExp(`\\| ${contentHash(plan, { exclude: ['Approvals', 'Loop ledger'] })} \\|`));
});

test('passes on a clean feature branch with valid approvals and a green baseline', () => {
  const dir = project();
  const r = preflight(dir, '--plan', PLAN, '--json');
  assert.equal(r.code, 0, r.out + r.err);
  const res = json(r);
  assert.equal(res.ok, true);
  for (const id of ['node', 'clean-tree', 'branch', 'tools', 'approvals', 'baseline-dod']) assert.equal(statusOf(r, id), 'PASS', id);
  assert.equal(statusOf(r, 'isolation'), 'SKIP');
  assert.equal(res.dod.length, 1, 'n/a and coverage_min entries are not run');
  assert.ok(existsSync(join(dir, '.agentic-sdlc/runs/preflight.json')));
  assert.equal(sh(dir, 'status', '--porcelain').trim(), '', 'run state is self-ignored');
});

test('a dirty tree fails and skips the baseline run', () => {
  const dir = project();
  write(dir, 'notes.txt', 'scratch');
  const r = preflight(dir, '--plan', PLAN, '--json');
  assert.equal(r.code, 1);
  assert.equal(statusOf(r, 'clean-tree'), 'FAIL');
  assert.equal(statusOf(r, 'baseline-dod'), 'SKIP');
});

test('the default branch fails', () => {
  const dir = project({ branch: null });
  const r = preflight(dir, '--plan', PLAN, '--json');
  assert.equal(r.code, 1);
  assert.equal(statusOf(r, 'branch'), 'FAIL');
});

test('a plan edited after approval fails the approval check', () => {
  const dir = project();
  cpSync(join(FIX, 'preflight', 'plan-stale.md'), join(dir, PLAN));
  commit(dir, 'edit plan');
  const r = preflight(dir, '--plan', PLAN, '--json');
  assert.equal(r.code, 1);
  assert.equal(statusOf(r, 'approvals'), 'FAIL');
  assert.match(r.out, /approval void/);
});

test('Loop ledger rows never void the Design sign-off', () => {
  const dir = project();
  const plan = readFileSync(join(dir, PLAN), 'utf8').replace('|---|---|---|---|---|---|---|---|\n',
    '|---|---|---|---|---|---|---|---|\n| 2026-11-21 | T1 | build-test | 1 | greet.test AC-1: expected "Hello, Ada" | code | trimmed input | failed |\n');
  write(dir, PLAN, plan);
  commit(dir, 'loop ledger row');
  const r = preflight(dir, '--plan', PLAN, '--json');
  assert.equal(r.code, 0, r.out);
  assert.equal(statusOf(r, 'approvals'), 'PASS');
});

test('a red baseline fails with the last output lines', () => {
  const dir = project();
  write(dir, 'RED', '1');
  commit(dir, 'red baseline');
  const r = preflight(dir, '--plan', PLAN);
  assert.equal(r.code, 1);
  assert.match(r.out, /FAIL baseline-dod +red baseline: test \(exit 1\)/);
  assert.match(r.out, /FAIL AC-1 greets by name/);
});

test('coverage below coverage_min fails the coverage-floor check; no json-summary is a SKIP (F04)', () => {
  assert.equal(statusOf(preflight(project(), '--plan', PLAN, '--json'), 'coverage-floor'), 'SKIP', 'fixture writes no summary');
  for (const [pct, want] of [[50, 'FAIL'], [91.2, 'PASS']]) {
    const dir = project();
    const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8')
      .replace('coverage_min: 0', 'coverage: node tools/cov.mjs\ncoverage_min: 78.4');
    write(dir, 'AGENTS.md', agents);
    write(dir, 'tools/cov.mjs', `import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('coverage', { recursive: true });\nwriteFileSync('coverage/coverage-summary.json', JSON.stringify({ total: { lines: { pct: ${pct} } } }));\n`);
    write(dir, '.gitignore', 'coverage/\n');
    commit(dir, 'coverage');
    const r = preflight(dir, '--plan', PLAN, '--json');
    assert.equal(statusOf(r, 'coverage-floor'), want, r.out);
    assert.equal(r.code, want === 'FAIL' ? 1 : 0);
    assert.match(json(r).checks.find((c) => c.id === 'coverage-floor').detail, new RegExp(`${pct}% .* 78\\.4`));
  }
});

test('a coverage summary older than the run is never compared (N1)', () => {
  const dir = project();
  const agents = readFileSync(join(dir, 'AGENTS.md'), 'utf8').replace('coverage_min: 0', 'coverage: node -e "0"\ncoverage_min: 50');
  write(dir, 'AGENTS.md', agents);
  write(dir, '.gitignore', 'coverage/\n');
  commit(dir, 'coverage command that writes nothing');
  write(dir, 'coverage/coverage-summary.json', JSON.stringify({ total: { lines: { pct: 99 } } }));
  const old = new Date('2020-01-01T00:00:00Z');
  utimesSync(join(dir, 'coverage/coverage-summary.json'), old, old);
  const r = preflight(dir, '--plan', PLAN, '--json');
  assert.equal(statusOf(r, 'coverage-floor'), 'SKIP', r.out);
  assert.match(json(r).checks.find((c) => c.id === 'coverage-floor').detail, /older than this run/);
});

test('a missing sdlc-dod block exits 2', () => {
  const dir = project();
  cpSync(join(FIX, 'preflight', 'AGENTS-no-dod.md'), join(dir, 'AGENTS.md'));
  commit(dir, 'drop dod');
  const r = preflight(dir, '--plan', PLAN);
  assert.equal(r.code, 2);
  assert.match(r.err, /sdlc-dod/);
});

test('a plan without ## Approvals is skipped when attended and fails when unattended', () => {
  const dir = project();
  cpSync(join(FIX, 'preflight', 'plan-no-approvals.md'), join(dir, 'docs/plans/greet.md'));
  commit(dir, 'docs plan');
  const r = preflight(dir, '--plan', 'docs/plans/greet.md', '--json');
  assert.equal(r.code, 0, r.out);
  assert.equal(statusOf(r, 'approvals'), 'SKIP');
  assert.equal(preflight(dir, '--plan', 'docs/plans/greet.md', '--mode', 'unattended').code, 2, 'unattended needs --run');
});

test('unattended mode outside a linked sdlc/* worktree fails isolation', () => {
  const dir = project();
  assert.equal(ledger(dir, 'start', '--run', 'r1', '--plan', PLAN).code, 0);
  const r = preflight(dir, '--run', 'r1', '--mode', 'unattended', '--json');
  assert.equal(r.code, 1);
  assert.equal(statusOf(r, 'isolation'), 'FAIL');
});

test('unattended mode passes inside the worktree created by run-ledger start', () => {
  const dir = project();
  const s = ledger(dir, 'start', '--run', 'iso', '--plan', PLAN, '--mode', 'unattended', '--json');
  assert.equal(s.code, 0, s.out + s.err);
  const wt = JSON.parse(s.out).worktree;
  worktrees.push(wt);
  const r = preflight(wt, '--run', 'iso', '--mode', 'unattended', '--json');
  assert.equal(r.code, 0, r.out + r.err);
  assert.equal(statusOf(r, 'isolation'), 'PASS');
  assert.ok(existsSync(join(wt, '.agentic-sdlc/runs/iso/preflight.json')));
  const events = readFileSync(join(wt, '.agentic-sdlc/runs/iso/ledger.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  assert.deepEqual(events.map((e) => e.type), ['start', 'preflight']);
  assert.equal(events[1].ok, true);
});

test('a corrupt run ledger fails the ledger check', () => {
  const dir = project();
  assert.equal(ledger(dir, 'start', '--run', 'r2', '--plan', PLAN).code, 0);
  appendFileSync(join(dir, '.agentic-sdlc/runs/r2/ledger.jsonl'), '{"v":1,"seq":2,\n');
  const r = preflight(dir, '--run', 'r2', '--json');
  assert.equal(r.code, 1);
  assert.equal(statusOf(r, 'ledger'), 'FAIL');
  assert.equal(preflight(dir, '--run', 'nope').code, 2, 'unknown run');
});

test('programOf skips environment assignments', () => {
  assert.equal(programOf('CI=1 FORCE_COLOR=0 npm test'), 'npm');
  assert.equal(programOf('./gradlew check'), './gradlew');
});

test('--help exits 0', () => {
  const r = preflight(HERE, '--help');
  assert.equal(r.code, 0);
  assert.match(r.out, /baseline-dod/);
});
