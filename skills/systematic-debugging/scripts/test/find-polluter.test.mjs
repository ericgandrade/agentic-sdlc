import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bisect, globToRegExp, quote } from '../find-polluter.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'find-polluter.mjs');
const SUITE = join(HERE, 'fixtures', 'suite');
const NODE = quote(process.execPath);
const RUNNER = quote(join(HERE, 'fixtures', 'fixture-runner.mjs'));
const IN_PROCESS = `${NODE} ${RUNNER} {files}`;
const scratch = mkdtempSync(join(HERE, '.scratch-'));

after(() => rmSync(scratch, { recursive: true, force: true }));

function fp(...args) {
  const r = spawnSync(process.execPath, [SCRIPT, '--cwd', SUITE, ...args, '--json'], { encoding: 'utf8' });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* reported by the assertion below */ }
  assert.ok(json, `stdout is JSON: ${r.stdout}${r.stderr}`);
  return { code: r.status, json };
}

test('finds the in-process polluter among 8 candidates by bisection', () => {
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', '*.test.mjs');
  assert.equal(code, 0);
  assert.equal(json.status, 'found');
  assert.equal(json.polluter, 'cache.test.mjs');
  assert.equal(json.candidates, 8);
  assert.ok(json.runCount <= 2 + 2 * 3, `runs ${json.runCount}`);
  assert.equal(json.runs[0].label, 'target alone');
  assert.equal(json.runs[0].failed, false);
  assert.equal(json.runs[1].failed, true);
});

test('finds a persistent polluter in {file} mode with --reset between runs', () => {
  const state = quote(scratch);
  const { code, json } = fp(
    '--cmd', `${NODE} ${RUNNER} --state ${state} {file}`,
    '--reset', `${NODE} ${RUNNER} --state ${state} --reset`,
    '--target', 'target.test.mjs', '--files', '*.test.mjs',
  );
  assert.equal(code, 0);
  assert.equal(json.mode, 'file');
  assert.equal(json.polluter, 'cache.test.mjs');
  assert.equal(json.runs[0].failed, false, 'reset cleared the marker before the target-alone run');
});

test('without --reset the persistent marker leaks into the target-alone run', () => {
  const state = quote(scratch);
  spawnSync(`${NODE} ${RUNNER} --state ${state} cache.test.mjs`, { cwd: SUITE, shell: true });
  assert.equal(existsSync(join(scratch, 'leftover.lock')), true);
  const { code, json } = fp('--cmd', `${NODE} ${RUNNER} --state ${state} {file}`, '--target', 'target.test.mjs', '--files', '*.test.mjs');
  assert.equal(code, 1);
  assert.match(json.reason, /fails on its own/);
});

test('--match ignores an unrelated failing candidate', () => {
  const files = ['alpha.test.mjs', 'noisy.check.mjs', 'beta.test.mjs', 'cache.test.mjs', 'target.test.mjs'];
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--match', 'TARGET polluted', '--files', files.join(','));
  assert.equal(code, 0);
  assert.equal(json.polluter, 'cache.test.mjs');
});

test('target failing on its own is not pollution (exit 1)', () => {
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'broken.check.mjs', '--files', '*.test.mjs');
  assert.equal(code, 1);
  assert.equal(json.status, 'not-found');
  assert.match(json.reason, /fails on its own/);
  assert.equal(json.runCount, 1);
});

test('failure not reproduced in the full run (exit 1)', () => {
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', 'alpha.test.mjs,beta.test.mjs');
  assert.equal(code, 1);
  assert.match(json.reason, /not reproduced/);
});

test('a failure that needs two files reports the smallest failing set (exit 1)', () => {
  const files = ['combo-a.check.mjs', 'alpha.test.mjs', 'combo-b.check.mjs', 'beta.test.mjs'];
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', files.join(','));
  assert.equal(code, 1);
  assert.match(json.reason, /both halves/);
  assert.deepEqual(json.narrowed, files);
});

test('max runs bound reached → exit 3 with the remaining candidates', () => {
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', '*.test.mjs', '--max-runs', '3');
  assert.equal(code, 3);
  assert.equal(json.status, 'bound');
  assert.equal(json.runCount, 3);
  assert.ok(json.narrowed.includes('cache.test.mjs'));
  assert.ok(json.narrowed.length < 8);
});

test('--only-before keeps only files listed before the target', () => {
  const files = ['alpha.test.mjs', 'target.test.mjs', 'cache.test.mjs'];
  const { code, json } = fp('--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--only-before', '--files', files.join(','));
  assert.equal(code, 1);
  assert.equal(json.candidates, 1);
});

test('bad input → exit 2', () => {
  const cases = [
    ['--target', 'target.test.mjs', '--files', '*.test.mjs'],
    ['--cmd', 'node run.mjs', '--target', 'target.test.mjs', '--files', '*.test.mjs'],
    ['--cmd', 'x {file} {files}', '--target', 'target.test.mjs', '--files', '*.test.mjs'],
    ['--cmd', IN_PROCESS, '--target', 'missing.test.mjs', '--files', '*.test.mjs'],
    ['--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', '*.nothing'],
    ['--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', 'target.test.mjs'],
    ['--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', '*.test.mjs', '--max-runs', '1'],
    ['--cmd', IN_PROCESS, '--target', 'target.test.mjs', '--files', '*.test.mjs', '--match', '('],
  ];
  for (const args of cases) {
    const { code, json } = fp(...args);
    assert.equal(code, 2, args.join(' '));
    assert.equal(json.status, 'input-error');
  }
});

test('bisect logic halves the set and keeps the failing half', () => {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const r = bisect(files, (subset) => ({ failed: subset.includes('f') }), 20);
  assert.equal(r.status, 'found');
  assert.equal(r.polluter, 'f');
  assert.ok(r.runs.length <= 2 + 2 * 3);
});

test('globToRegExp handles ** at any depth, * within a segment and ?', () => {
  assert.ok(globToRegExp('src/**/*.test.ts').test('src/a.test.ts'));
  assert.ok(globToRegExp('src/**/*.test.ts').test('src/x/y/a.test.ts'));
  assert.ok(!globToRegExp('src/*.test.ts').test('src/x/a.test.ts'));
  assert.ok(globToRegExp('t?.js').test('t1.js'));
});
