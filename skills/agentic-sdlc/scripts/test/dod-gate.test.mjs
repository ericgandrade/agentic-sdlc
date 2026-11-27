import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkGate, runGate } from '../dod-gate.mjs';
import { fingerprint } from '../lib/git.mjs';
import { makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, '..', 'dod-gate.mjs');
const LEDGER = join(HERE, '..', 'run-ledger.mjs');
const PREFLIGHT = join(HERE, '..', 'preflight.mjs');
const ENV = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}` };
const RECORD = '.agentic-sdlc/evidence/dod-gate.json';

const node = (code) => `node -e "${code}"`;
const block = (dod) => `# P\n<!-- AGENTIC-SDLC:BEGIN -->\n## Definition of Done\n\`\`\`sdlc-dod\n${dod}\n\`\`\`\n<!-- AGENTIC-SDLC:END -->\n`;

function repo(dod = `lint: ${node("console.log('lint ok')")}\ntest: ${node("console.log('tests ok')")}\ntypecheck: n/a — plain JavaScript\ncoverage_min: 0`) {
  const dir = makeRepo('dodgate');
  write(dir, 'AGENTS.md', block(dod));
  write(dir, 'src/a.js', 'export const a = 1;\n');
  commit(dir, 'init');
  return dir;
}

function exec(cwd, args, env = {}) {
  const r = spawnSync(process.execPath, [GATE, ...args], { cwd, encoding: 'utf8', env: { ...ENV, ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

test('all green → exit 0 with one record per command on the current fingerprint', () => {
  const dir = repo();
  const r = runGate({ cwd: dir, env: { ...ENV, AGENTIC_SDLC_HOST: 'claude-code', AGENTIC_SDLC_MODEL: 'test-model' } });
  assert.equal(r.ok, true);
  assert.deepEqual(r.records.map((x) => x.name), ['lint', 'test']);
  const t = r.records[1];
  assert.equal(t.exit, 0);
  assert.equal(t.stdoutSha256, createHash('sha256').update('tests ok\n').digest('hex'));
  assert.equal(t.fingerprint, fingerprint({ cwd: dir }).short);
  assert.deepEqual(t.agent, { host: 'claude-code', model: 'test-model' });
  assert.deepEqual(r.skipped, ['typecheck']);
  assert.ok(existsSync(join(dir, RECORD)));
  const cli = exec(dir, ['--json']);
  assert.equal(cli.code, 0, cli.out + cli.err);
  assert.equal(JSON.parse(cli.out).records[0].agent.host, 'unknown');
  assert.equal(exec(dir, ['check']).code, 0);
});

test('one red → exit 1 naming the command', () => {
  const dir = repo(`lint: ${node("console.log('ok')")}\ntest: ${node('process.exit(3)')}`);
  const r = exec(dir, []);
  assert.equal(r.code, 1);
  assert.match(r.out, /FAIL\s+test/);
  assert.match(r.out, /process\.exit\(3\)/);
  const c = exec(dir, ['check', '--json']);
  assert.equal(c.code, 1);
  assert.equal(JSON.parse(c.out).rule, 'RED');
});

test('no sdlc-dod block → exit 2', () => {
  const dir = makeRepo('nodod');
  write(dir, 'AGENTS.md', '# none\n');
  commit(dir, 'init');
  assert.equal(exec(dir, []).code, 2);
  assert.equal(exec(dir, ['check']).code, 2);
});

test('a file edited after green → check exits 1 STALE; no record → exit 1 NO_RECORD', () => {
  const dir = repo();
  assert.equal(exec(dir, ['check', '--json']).code, 1);
  assert.equal(JSON.parse(exec(dir, ['check', '--json']).out).rule, 'NO_RECORD');
  assert.equal(exec(dir, []).code, 0);
  write(dir, 'src/a.js', 'export const a = 2;\n');
  const c = checkGate({ cwd: dir });
  assert.equal(c.ok, false);
  assert.equal(c.rule, 'STALE');
  assert.equal(exec(dir, ['check']).code, 1);
  // The record itself lives under .agentic-sdlc/evidence/, so writing it never stales it.
  assert.equal(exec(dir, []).code, 0);
  assert.equal(checkGate({ cwd: dir }).ok, true);
});

test('a DoD key added after green → check exits 1 STALE (the record no longer covers the block)', () => {
  const dir = repo();
  assert.equal(exec(dir, []).code, 0);
  write(dir, 'AGENTS.md', block(`lint: ${node("console.log('lint ok')")}\ntest: ${node("console.log('tests ok')")}\ne2e: ${node('0')}`));
  commit(dir, 'add e2e');
  const c = checkGate({ cwd: dir });
  assert.equal(c.rule, 'STALE');
});

test('extension dod.checks run as extra DoD rows', () => {
  const dir = repo();
  const entry = `# Licence check\n\n\`\`\`sdlc-dod\nlicences: ${node("console.log('licences ok')")}\n\`\`\`\n`;
  write(dir, '.agentic-sdlc/extensions/licences/check.md', entry);
  write(dir, '.agentic-sdlc/extensions/licences/extension.json', JSON.stringify({
    name: 'licences', version: '0.1.0', interface: '^1.0.0', kind: 'dod-check', entry: 'check.md',
    attachesTo: 'dod.checks', sha256: createHash('sha256').update(entry).digest('hex'),
  }));
  commit(dir, 'extension');
  const r = runGate({ cwd: dir, env: ENV });
  assert.equal(r.ok, true, JSON.stringify(r.records));
  assert.ok(r.records.some((x) => x.name === 'ext:licences:licences' && x.exit === 0));
});

// run-ledger integration on the run-ledger fixture project (test command red while a RED file exists).
function runFixture() {
  const dir = makeRepo('gate-rl');
  cpSync(join(HERE, 'fixtures', 'run-ledger', 'project'), dir, { recursive: true });
  commit(dir, 'fixture project');
  sh(dir, 'checkout', '-q', '-b', 'feat/001-demo');
  const run = (script, args) => {
    const r = spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: 'utf8', env: ENV });
    return { code: r.status, out: r.stdout, err: r.stderr };
  };
  assert.equal(run(LEDGER, ['start', '--run', 'r1', '--plan', 'specs/001-demo/plan.md']).code, 0);
  assert.equal(run(PREFLIGHT, ['--run', 'r1']).code, 0);
  return { dir, rl: (...a) => run(LEDGER, a) };
}

test('run-ledger task --state done is refused while the gate is red and accepted once it is green', () => {
  const { dir, rl } = runFixture();
  assert.equal(rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started').code, 0);
  assert.equal(rl('red', '--run', 'r1', '--task', 'T1', '--test', 'greet AC-1 greets by name', '--signature', 'expected').code, 0);
  assert.equal(rl('round', '--run', 'r1', '--task', 'T1', '--loop', 'red-green', '--result', 'pass').code, 0);
  write(dir, 'RED', '1');
  const refused = rl('task', '--run', 'r1', '--task', 'T1', '--state', 'done');
  assert.equal(refused.code, 1, refused.out + refused.err);
  assert.match(refused.out, /dod-gate/);
  assert.match(refused.out, /test/);
  rmSync(join(dir, 'RED'));
  const ok = rl('task', '--run', 'r1', '--task', 'T1', '--state', 'done');
  assert.equal(ok.code, 0, ok.out + ok.err);
});

test('run-ledger finish is refused while the gate is red', () => {
  const { dir, rl } = runFixture();
  for (const id of ['T1', 'T2', 'T3']) {
    const plan = readFileSync(join(dir, 'specs/001-demo/plan.md'), 'utf8');
    if (!plan.includes(`| ${id} `) && !plan.includes(`|${id}|`)) continue;
    assert.equal(rl('task', '--run', 'r1', '--task', id, '--state', 'started').code, 0);
    assert.equal(rl('task', '--run', 'r1', '--task', id, '--state', 'done', '--no-red', 'fixture task').code, 0);
  }
  write(dir, 'RED', '1');
  const r = rl('finish', '--run', 'r1');
  assert.equal(r.code, 1, r.out + r.err);
  assert.match(r.out, /dod-gate/);
  rmSync(join(dir, 'RED'));
  assert.equal(rl('finish', '--run', 'r1').code, 0);
});
