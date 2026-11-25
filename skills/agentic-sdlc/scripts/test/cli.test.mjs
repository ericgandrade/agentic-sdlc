import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXIT, InputError, BoundError, parseArgs, report } from '../lib/cli.mjs';

test('exit codes follow the convention 0/1/2/3', () => {
  assert.deepEqual({ ...EXIT }, { PASS: 0, FAIL: 1, INPUT: 2, BOUND: 3 });
  assert.equal(new InputError('x').exitCode, 2);
  assert.equal(new BoundError('x').exitCode, 3);
});

test('parseArgs handles booleans, key=value, key value and --', () => {
  const { flags, positional } = parseArgs(['spec.md', '--json', '--base=main', '--max', '5', '--', '--literal']);
  assert.deepEqual(flags, { json: true, base: 'main', max: '5' });
  assert.deepEqual(positional, ['spec.md', '--literal']);
});

test('parseArgs does not swallow a positional after a boolean flag', () => {
  const { flags, positional } = parseArgs(['--json', 'plan.md']);
  assert.equal(flags.json, true);
  assert.deepEqual(positional, ['plan.md']);
});

test('report prints JSON with ok and exitCode', () => {
  let out = '';
  const code = report({ ok: false, json: true, result: { errors: ['E1'] } }, { write: (s) => { out += s; } });
  assert.equal(code, 1);
  assert.deepEqual(JSON.parse(out), { ok: false, exitCode: 1, errors: ['E1'] });
});

test('report with explicit bound code returns 3', () => {
  const code = report({ code: EXIT.BOUND, lines: ['bound'] }, { write() {} });
  assert.equal(code, 3);
});
