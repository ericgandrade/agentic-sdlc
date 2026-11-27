import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from '../lib/git.mjs';
import { makeDir, makeRepo, write, commit, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const EVIDENCE = join(HERE, '..', 'evidence.mjs');
const ENV = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}` };
const LEDGER = '.agentic-sdlc/evidence/ledger.jsonl';
const OK = `node -e "console.log('ok')"`;
const BAD = `node -e "console.error('boom'); process.exit(3)"`;

function repo() {
  const dir = makeRepo('evidence');
  write(dir, 'src/a.js', 'export const a = 1;\n');
  write(dir, 'specs/001-x/spec.md', '# Spec\n\n## Acceptance criteria\n\n| ID | Criterion |\n|---|---|\n| AC-1 | one |\n| AC-2 | two |\n');
  commit(dir, 'init');
  return dir;
}

function exec(cwd, args, env = {}) {
  const r = spawnSync(process.execPath, [EVIDENCE, ...args], { cwd, encoding: 'utf8', env: { ...ENV, ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

const record = (dir, acs, cmd, env) => exec(dir, ['record', ...acs.flatMap((a) => ['--ac', a]), '--json', '--', cmd], env);
const check = (dir, args = []) => {
  const r = exec(dir, ['check', '--json', ...args]);
  return { ...r, json: r.out ? JSON.parse(r.out) : null };
};
const statusOf = (json) => Object.fromEntries(json.acs.map((x) => [x.ac, x.status]));
const rows = (dir) => readFileSync(join(dir, LEDGER), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));

test('record appends one row with the agent context and the current fingerprint; check passes', () => {
  const dir = repo();
  const r = record(dir, ['AC-1', 'AC-2'], OK, { AGENTIC_SDLC_HOST: 'claude-code', AGENTIC_SDLC_MODEL: 'test-model' });
  assert.equal(r.code, 0, r.err);
  const row = JSON.parse(r.out).row;
  assert.equal(row.v, 1);
  assert.deepEqual(row.acs, ['AC-1', 'AC-2']);
  assert.equal(row.exit, 0);
  assert.equal(row.cmd, OK);
  assert.equal(row.name, OK);
  assert.match(row.stdoutSha256, /^[0-9a-f]{64}$/);
  assert.equal(row.tail, 'ok');
  assert.match(row.fingerprint, /^[0-9a-f]{12}$/);
  assert.match(row.at, /^\d{4}-\d\d-\d\dT/);
  assert.deepEqual(row.agent, { host: 'claude-code', model: 'test-model' });
  assert.deepEqual(rows(dir), [row]);
  const c = check(dir, ['--ac', 'AC-1', '--ac', 'AC-2']);
  assert.equal(c.code, 0, c.out);
  assert.deepEqual(statusOf(c.json), { 'AC-1': 'green', 'AC-2': 'green' });
});

test('agent context defaults to unknown; --name labels the row', () => {
  const dir = repo();
  const env = { AGENTIC_SDLC_HOST: '', AGENTIC_SDLC_MODEL: '' };
  const r = exec(dir, ['record', '--ac=AC-1', '--name', 'unit', '--json', '--', OK], env);
  assert.equal(r.code, 0, r.err);
  const row = JSON.parse(r.out).row;
  assert.equal(row.name, 'unit');
  assert.deepEqual(row.agent, { host: 'unknown', model: 'unknown' });
});

test('recording never changes the fingerprint (the ledger is excluded)', () => {
  const dir = repo();
  const before = fingerprint({ cwd: dir }).short;
  const r = record(dir, ['AC-1'], OK);
  assert.equal(JSON.parse(r.out).row.fingerprint, before);
  assert.equal(fingerprint({ cwd: dir }).short, before);
});

test('a failing command exits 1 and its AC is red on the current fingerprint', () => {
  const dir = repo();
  const r = record(dir, ['AC-1'], BAD);
  assert.equal(r.code, 1);
  const row = JSON.parse(r.out).row;
  assert.equal(row.exit, 3);
  assert.equal(row.tail, 'boom');
  const c = check(dir, ['--ac', 'AC-1']);
  assert.equal(c.code, 1);
  assert.equal(statusOf(c.json)['AC-1'], 'red');
});

test('the latest row on the current fingerprint decides: green then red → red', () => {
  const dir = repo();
  record(dir, ['AC-1'], OK);
  record(dir, ['AC-1'], BAD);
  assert.equal(statusOf(check(dir, ['--ac', 'AC-1']).json)['AC-1'], 'red');
  record(dir, ['AC-1'], OK);
  assert.equal(check(dir, ['--ac', 'AC-1']).code, 0);
});

test('editing a tracked file after recording → stale, exit 1', () => {
  const dir = repo();
  record(dir, ['AC-1'], OK);
  write(dir, 'src/a.js', 'export const a = 2;\n');
  const c = check(dir, ['--ac', 'AC-1']);
  assert.equal(c.code, 1);
  assert.equal(statusOf(c.json)['AC-1'], 'stale');
});

test('an AC without rows is missing; no ledger → every AC missing, exit 1', () => {
  const dir = repo();
  let c = check(dir, ['--ac', 'AC-1']);
  assert.equal(c.code, 1);
  assert.equal(statusOf(c.json)['AC-1'], 'missing');
  record(dir, ['AC-1'], OK);
  c = check(dir, ['--ac', 'AC-1', '--ac', 'AC-2']);
  assert.equal(c.code, 1);
  assert.deepEqual(statusOf(c.json), { 'AC-1': 'green', 'AC-2': 'missing' });
});

test('--spec reads the AC IDs from the spec', () => {
  const dir = repo();
  record(dir, ['AC-1'], OK);
  let c = check(dir, ['--spec', 'specs/001-x/spec.md']);
  assert.equal(c.code, 1);
  assert.deepEqual(statusOf(c.json), { 'AC-1': 'green', 'AC-2': 'missing' });
  record(dir, ['AC-2'], OK);
  c = check(dir, ['--spec', 'specs/001-x/spec.md']);
  assert.equal(c.code, 0);
});

test('a torn last line is ignored with a warning, and the next record repairs it', () => {
  const dir = repo();
  record(dir, ['AC-1'], OK);
  appendFileSync(join(dir, LEDGER), '{"v":1,"acs":["AC-1"');
  const c = exec(dir, ['check', '--ac', 'AC-1']);
  assert.equal(c.code, 0, c.out + c.err);
  assert.match(c.err, /torn last line ignored/);
  const r = record(dir, ['AC-2'], OK);
  assert.equal(r.code, 0, r.err);
  assert.match(r.err, /torn last line/);
  assert.equal(rows(dir).length, 2);
  assert.equal(check(dir, ['--ac', 'AC-1', '--ac', 'AC-2']).code, 0);
});

test('an invalid line that is not the torn last line → exit 2', () => {
  const dir = repo();
  record(dir, ['AC-1'], OK);
  appendFileSync(join(dir, LEDGER), 'not json\n');
  record(dir, ['AC-1'], OK);
  assert.equal(exec(dir, ['check', '--ac', 'AC-1']).code, 2);
  assert.equal(exec(dir, ['record', '--ac', 'AC-1', '--', OK]).code, 2);
});

test('a valid JSON row without the required fields → exit 2', () => {
  const dir = repo();
  write(dir, LEDGER, '{"v":1}\n');
  assert.equal(exec(dir, ['check', '--ac', 'AC-1']).code, 2);
});

test('input errors exit 2: no command, bad AC ID, no ACs to check, missing spec, not a repo', () => {
  const dir = repo();
  assert.equal(exec(dir, ['record', '--ac', 'AC-1']).code, 2);
  assert.equal(exec(dir, ['record', '--ac', 'T1', '--', OK]).code, 2);
  assert.equal(exec(dir, ['check']).code, 2);
  assert.equal(exec(dir, ['check', '--spec', 'specs/404/spec.md']).code, 2);
  assert.equal(exec(dir, ['nope']).code, 2);
  assert.equal(existsSync(join(dir, LEDGER)), false);
  const plain = makeDir('plain');
  assert.equal(exec(plain, ['check', '--ac', 'AC-1'], { GIT_CEILING_DIRECTORIES: dirname(plain) }).code, 2);
});

test('--help exits 0', () => {
  const r = exec(repo(), ['--help']);
  assert.equal(r.code, 0);
  assert.match(r.out, /record/);
});

test('a command that changes the tree records treeChanged, exits 1 and never counts as green', () => {
  const dir = repo();
  const r = record(dir, ['AC-1'], `node -e "require('fs').writeFileSync('src/gen.js', '1')"`);
  assert.equal(r.code, 1);
  assert.equal(JSON.parse(r.out).row.treeChanged, true);
  assert.equal(statusOf(check(dir, ['--ac', 'AC-1']).json)['AC-1'], 'red');
  assert.equal(record(dir, ['AC-1'], OK).code, 0);
  assert.equal(check(dir, ['--ac', 'AC-1']).code, 0);
});
