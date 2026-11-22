import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeHours, evaluateRound, inPlan, loadLedger, readPlanTasks, renderTable } from '../run-ledger.mjs';
import { makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEDGER = join(HERE, '..', 'run-ledger.mjs');
const PREFLIGHT = join(HERE, '..', 'preflight.mjs');
const FIX = join(HERE, 'fixtures', 'run-ledger');
const PLAN = 'specs/001-demo/plan.md';
const WORKED = join(HERE, '..', '..', 'examples', 'worked-example', 'specs', '001-csv-export', 'run-ledger.jsonl');
const ENV = { ...process.env, PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}` };
const worktrees = [];

after(() => {
  for (const w of worktrees) rmSync(w, { recursive: true, force: true });
  cleanup();
});

function exec(script, cwd, args, env = {}) {
  const r = spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', env: { ...ENV, ...env } });
  return { code: r.status, out: r.stdout, err: r.stderr };
}

// A started attended run "r1" on the fixture project with a passing preflight; returns helpers.
function runFixture({ startArgs = [], preflight = true } = {}) {
  const dir = makeRepo('runledger');
  cpSync(join(FIX, 'project'), dir, { recursive: true });
  commit(dir, 'fixture project');
  sh(dir, 'checkout', '-q', '-b', 'feat/001-demo');
  const rl = (...args) => exec(LEDGER, dir, args);
  const s = rl('start', '--run', 'r1', '--plan', PLAN, ...startArgs);
  assert.equal(s.code, 0, s.out + s.err);
  if (preflight) {
    const p = exec(PREFLIGHT, dir, ['--run', 'r1']);
    assert.equal(p.code, 0, p.out + p.err);
  }
  const events = () => loadLedger(join(dir, '.agentic-sdlc/runs/r1/ledger.jsonl'));
  return { dir, rl, events };
}

const fail = (rl, task, loop, sig, tried, cause = 'code') =>
  rl('round', '--run', 'r1', '--task', task, '--loop', loop, '--result', 'fail', '--signature', sig, '--cause', cause, '--tried', tried);

function finishT1(rl) {
  assert.equal(rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started').code, 0);
  assert.equal(rl('red', '--run', 'r1', '--task', 'T1', '--test', 'greet AC-1 greets by name', '--signature', 'expected "Hello, Ada"').code, 0);
  assert.equal(rl('round', '--run', 'r1', '--task', 'T1', '--loop', 'red-green', '--result', 'pass').code, 0);
  const d = rl('task', '--run', 'r1', '--task', 'T1', '--state', 'done');
  assert.equal(d.code, 0, d.out + d.err);
}

test('a task starts only after a passing preflight and after its blockers are done', () => {
  const { dir, rl } = runFixture({ preflight: false });
  const r = rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  assert.equal(r.code, 1);
  assert.match(r.out, /no passing preflight/);
  assert.equal(exec(PREFLIGHT, dir, ['--run', 'r1']).code, 0);
  assert.equal(rl('task', '--run', 'r1', '--task', 'T2', '--state', 'started').code, 1, 'T2 is blocked by T1');
  assert.equal(rl('task', '--run', 'r1', '--task', 'T9', '--state', 'started').code, 1, 'not in the approved plan');
  finishT1(rl);
  assert.equal(rl('task', '--run', 'r1', '--task', 'T2', '--state', 'started').code, 0);
});

test('a task without recorded red output is not done', () => {
  const { rl, events } = runFixture();
  rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  rl('round', '--run', 'r1', '--task', 'T1', '--loop', 'red-green', '--result', 'pass');
  const r = rl('task', '--run', 'r1', '--task', 'T1', '--state', 'done');
  assert.equal(r.code, 1);
  assert.match(r.out, /no red output recorded/);
  assert.equal(rl('task', '--run', 'r1', '--task', 'T1', '--state', 'done', '--no-red', 'config-only change, no executable behaviour').code, 0);
  assert.equal(events().at(-1).noRed, 'config-only change, no executable behaviour');
});

test('a red test name without an AC or bug ID prints a concern', () => {
  const { rl } = runFixture();
  rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  const r = rl('red', '--run', 'r1', '--task', 'T1', '--test', 'greets by name', '--signature', 'expected');
  assert.equal(r.code, 0);
  assert.match(r.out, /concern: test name states no AC-n/);
});

test('the same failure signature in 2 consecutive rounds escalates B2 and blocks further rounds until a ruling', () => {
  const { rl } = runFixture();
  rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  assert.equal(fail(rl, 'T1', 'build-test', 'greet.test AC-1: expected "Hello, Ada" (12ms)', 'trim input').code, 0);
  const r = fail(rl, 'T1', 'build-test', 'greet.test AC-1: expected "Hello, Ada" (9ms)', 'escape template');
  assert.equal(r.code, 3);
  assert.match(r.out, /ESCALATE .* B2 anti-thrash → Architect/);
  assert.match(r.out, /1\) \[build-test r1\] trim input → fail/);
  assert.equal(fail(rl, 'T1', 'build-test', 'other', 'third idea').code, 3, 'no round while escalated');
  assert.equal(rl('task', '--run', 'r1', '--task', 'T1', '--state', 'done').code, 3);
  assert.equal(rl('ruling', '--run', 'r1', '--task', 'T1', '--decision', 'continue', '--by', 'Architect: K. Lee').code, 2, 'continue needs --note');
  assert.equal(rl('ruling', '--run', 'r1', '--task', 'T1', '--decision', 'continue', '--by', 'Architect: K. Lee', '--note', 'move formatting into greet()').code, 0);
  assert.equal(rl('round', '--run', 'r1', '--task', 'T1', '--loop', 'build-test', '--result', 'pass').code, 0);
});

test('3 failed fixes escalate B2, and the 5th failed build-test round escalates B3 with no "continue" ruling', () => {
  const { rl, events } = runFixture();
  rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  assert.equal(fail(rl, 'T1', 'build-test', 'sig a', 'fix a').code, 0);
  assert.equal(fail(rl, 'T1', 'build-test', 'sig b', 'fix b').code, 0);
  const b2 = fail(rl, 'T1', 'build-test', 'sig c', 'fix c');
  assert.equal(b2.code, 3);
  assert.match(b2.out, /3 failed fixes/);
  rl('ruling', '--run', 'r1', '--task', 'T1', '--decision', 'continue', '--by', 'Architect: K. Lee', '--note', 'new approach');
  assert.equal(fail(rl, 'T1', 'build-test', 'sig d', 'fix d').code, 0);
  const b3 = fail(rl, 'T1', 'build-test', 'sig e', 'fix e');
  assert.equal(b3.code, 3);
  assert.match(b3.out, /B3 build-test cap → Tech Lead/);
  assert.equal(rl('ruling', '--run', 'r1', '--task', 'T1', '--decision', 'continue', '--by', 'Tech Lead: J. Park', '--note', 'x').code, 1);
  assert.equal(rl('ruling', '--run', 'r1', '--task', 'T1', '--decision', 'split', '--by', 'Tech Lead: J. Park').code, 0);
  assert.equal(events().filter((e) => e.type === 'round').at(-1).escalation.breaker, 'B3');
  const table = rl('render', '--run', 'r1').out;
  assert.match(table, /^\| Date \| Task \| Loop \| Round \| Failure signature \| Cause \| Tried \| Result \|$/m);
  assert.match(table, /\| T1 \| build-test \| 5 \| sig e \| code \| fix e \| escalated — B3/);
  assert.match(table, /\| T1 \| ruling \| .* split by Tech Lead: J\. Park \(B3\) \|/);
});

test('a repeated "tried" entry is refused', () => {
  const { rl } = runFixture();
  rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  fail(rl, 'T1', 'build-test', 'sig a', 'Trim the input');
  const r = fail(rl, 'T1', 'build-test', 'sig b', '  trim the   INPUT ');
  assert.equal(r.code, 1);
  assert.match(r.out, /already tried/);
});

test('3 failed red-green attempts switch to the debug loop; a debug pass reopens red-green', () => {
  const { rl } = runFixture();
  rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  assert.equal(fail(rl, 'T1', 'red-green', 'AC-1 expected Ada', 'concat').code, 0);
  assert.equal(fail(rl, 'T1', 'red-green', 'AC-1 expected Ada v2', 'template').code, 0);
  const b1 = fail(rl, 'T1', 'red-green', 'AC-1 expected Ada v3', 'join');
  assert.equal(b1.code, 3);
  assert.match(b1.out, /debug loop/);
  assert.equal(fail(rl, 'T1', 'red-green', 'x', 'again').code, 3, 'red-green refused during debug');
  assert.equal(rl('round', '--run', 'r1', '--task', 'T1', '--loop', 'debug', '--result', 'pass', '--tried', 'hypothesis: name is undefined; proven by AC-1 test').code, 0);
  assert.equal(fail(rl, 'T1', 'red-green', 'AC-1 new', 'fix after root cause').code, 0);
});

test('a spec or design cause escalates B6 at once; an unknown cause twice is treated as design', () => {
  const a = runFixture();
  a.rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  const r = fail(a.rl, 'T1', 'build-test', 'AC-1 contradicts AC-2', 'read spec', 'spec');
  assert.equal(r.code, 3);
  assert.match(r.out, /B6 .* → Product Owner/);
  assert.match(r.out, /route Specify \(Specify sign-off void\)/);
  assert.equal(a.rl('ruling', '--run', 'r1', '--task', 'T1', '--decision', 'continue', '--by', 'PO: R. Diaz', '--note', 'x').code, 1);

  const b = runFixture();
  b.rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  assert.equal(fail(b.rl, 'T1', 'build-test', 'sig 1', 'try 1', 'unknown').code, 0);
  const u = fail(b.rl, 'T1', 'build-test', 'sig 2', 'try 2', 'unknown');
  assert.equal(u.code, 3);
  assert.match(u.out, /cause unknown after 2 rounds → treated as design/);
});

test('check halts on more than 3 out-of-plan files, reports 1-3 as a concern, and blocks the run', () => {
  const { dir, rl } = runFixture();
  write(dir, 'src/extra1.mjs', 'x');
  write(dir, 'test/greet.test.mjs', 'x');
  const ok = rl('check', '--run', 'r1');
  assert.equal(ok.code, 0, ok.out + ok.err);
  assert.match(ok.out, /concern: 1 file\(s\) outside plan Files: src\/extra1\.mjs/);
  for (const n of [2, 3, 4]) write(dir, `src/extra${n}.mjs`, 'x');
  const r = rl('check', '--run', 'r1');
  assert.equal(r.code, 3);
  assert.match(r.out, /HALT out-of-plan-files: 4 files outside plan Files/);
  assert.equal(rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started').code, 3, 'halted run refuses work');
  assert.equal(rl('status', '--run', 'r1').code, 3);
});

test('check halts on a dependency manifest outside plan Files', () => {
  const { dir, rl } = runFixture();
  write(dir, 'package.json', '{"dependencies":{"left-pad":"1.3.0"}}');
  const r = rl('check', '--run', 'r1');
  assert.equal(r.code, 3);
  assert.match(r.out, /HALT dependency-added: .*package\.json/);
});

test('check halts on a secret and never prints its value', () => {
  const { dir, rl } = runFixture();
  const key = 'AKIA' + 'Q'.repeat(16);
  write(dir, 'src/greet.mjs', `export const greet = (n) => \`Hello, \${n}\`;\nconst k = '${key}';\n`);
  const r = rl('check', '--run', 'r1');
  assert.equal(r.code, 3);
  assert.match(r.out, /HALT secret-detected: src\/greet\.mjs:2 \(aws-access-key-id\)/);
  assert.ok(!r.out.includes(key));
  assert.ok(!readFileSync(join(dir, '.agentic-sdlc/runs/r1/ledger.jsonl'), 'utf8').includes(key));
});

test('check halts when the approved plan changes during the run', () => {
  const { dir, rl } = runFixture();
  const plan = readFileSync(join(dir, PLAN), 'utf8');
  write(dir, PLAN, plan.replace('| T3 | Trim names |', '| T3 | Trim and lowercase names |'));
  const r = rl('check', '--run', 'r1');
  assert.equal(r.code, 3);
  assert.match(r.out, /HALT approval-void: plan\.md changed since run start/);
});

test('budgets: plan larger than max-tasks, ceilings never raised, turns and active hours halt', () => {
  const dir = makeRepo('budget');
  cpSync(join(FIX, 'project'), dir, { recursive: true });
  commit(dir, 'fixture');
  sh(dir, 'checkout', '-q', '-b', 'feat/x');
  const rl = (args, env) => exec(LEDGER, dir, args, env);
  assert.equal(rl(['start', '--run', 'a', '--plan', PLAN, '--max-tasks', '2']).code, 3);
  assert.equal(rl(['start', '--run', 'a', '--plan', PLAN, '--max-tasks', '20']).code, 2);
  mkdirSync(join(dir, '.agentic-sdlc'), { recursive: true });
  write(dir, '.agentic-sdlc/config.json', '{"budgets":{"max_turns":400}}');
  assert.equal(rl(['start', '--run', 'a', '--plan', PLAN]).code, 2, 'config cannot raise a ceiling');
  rmSync(join(dir, '.agentic-sdlc/config.json'));

  assert.equal(rl(['start', '--run', 'turns', '--plan', PLAN, '--max-turns', '10']).code, 0);
  assert.equal(exec(PREFLIGHT, dir, ['--run', 'turns']).code, 0);
  rl(['task', '--run', 'turns', '--task', 'T1', '--state', 'started', '--turns', '6']);
  const t = rl(['round', '--run', 'turns', '--task', 'T1', '--loop', 'red-green', '--result', 'pass', '--turns', '11']);
  assert.equal(t.code, 0, 'counters are recorded with the event that reports them');
  const t2 = rl(['round', '--run', 'turns', '--task', 'T1', '--loop', 'build-test', '--result', 'pass']);
  assert.equal(t2.code, 3);
  assert.match(t2.out, /HALT budget: agent turns 11 > 10/);
  const fin = rl(['finish', '--run', 'turns']);
  assert.equal(fin.code, 1);
  assert.match(fin.out, /finished: BLOCKED — budget: agent turns/);
  commit(dir, 'archive run ledger');

  const T0 = Date.parse('2026-11-21T09:00:00Z');
  const at = (min) => ({ SDLC_NOW: new Date(T0 + min * 60_000).toISOString() });
  assert.equal(rl(['start', '--run', 'hours', '--plan', PLAN, '--max-hours', '1'], at(0)).code, 0);
  const ph = exec(PREFLIGHT, dir, ['--run', 'hours'], at(1));
  assert.equal(ph.code, 0, ph.out + ph.err);
  assert.equal(rl(['task', '--run', 'hours', '--task', 'T1', '--state', 'started'], at(25)).code, 0);
  assert.equal(rl(['round', '--run', 'hours', '--task', 'T1', '--loop', 'red-green', '--result', 'pass'], at(50)).code, 0);
  assert.equal(rl(['round', '--run', 'hours', '--task', 'T1', '--loop', 'build-test', '--result', 'pass'], at(300)).code, 0, 'idle gaps over 30 min do not count');
  const h = rl(['round', '--run', 'hours', '--task', 'T1', '--loop', 'build-test', '--result', 'pass'], at(325));
  assert.equal(h.code, 3);
  assert.match(h.out, /HALT budget: active hours 1\.25 > 1/);
});

test('activeHours ignores idle gaps over 30 minutes', () => {
  const ev = ['09:00', '09:20', '11:00', '11:10'].map((t) => ({ ts: `2026-11-21T${t}:00.000Z` }));
  assert.equal(activeHours(ev, new Date('2026-11-21T11:10:00Z')).toFixed(2), '0.50');
});

test('unattended start refuses stale approvals, creates the worktree, halts and resumes only with an acknowledgement', () => {
  const dir = makeRepo('unattended');
  cpSync(join(FIX, 'project'), dir, { recursive: true });
  const planText = readFileSync(join(dir, PLAN), 'utf8');
  write(dir, PLAN, planText.replace('| T3 | Trim names |', '| T3 | Trim it |'));
  commit(dir, 'stale plan');
  const refused = exec(LEDGER, dir, ['start', '--run', 'u1', '--plan', PLAN, '--mode', 'unattended']);
  assert.equal(refused.code, 1);
  assert.match(refused.out, /REFUSED: unattended mode starts only after valid Specify and Design sign-offs/);
  write(dir, PLAN, planText);
  commit(dir, 'approved plan');

  const s = exec(LEDGER, dir, ['start', '--run', 'u1', '--plan', PLAN, '--mode', 'unattended', '--json']);
  assert.equal(s.code, 0, s.out + s.err);
  const wt = JSON.parse(s.out).worktree;
  worktrees.push(wt);
  assert.equal(sh(wt, 'rev-parse', '--abbrev-ref', 'HEAD').trim(), 'sdlc/001-u1');
  assert.ok(wt.endsWith(`-sdlc-u1`));
  const rl = (...args) => exec(LEDGER, wt, args);
  assert.equal(exec(PREFLIGHT, wt, ['--run', 'u1', '--mode', 'unattended']).code, 0);
  assert.equal(rl('task', '--run', 'u1', '--task', 'T1', '--state', 'started').code, 0);
  write(wt, 'tmp1.txt', 'x');

  // An escalation in unattended mode halts the run.
  rl('round', '--run', 'u1', '--task', 'T1', '--loop', 'build-test', '--result', 'fail', '--signature', 'AC-2 vs AC-1', '--cause', 'design', '--tried', 'n/a');
  const st = rl('status', '--run', 'u1', '--json');
  assert.equal(st.code, 3);
  assert.equal(JSON.parse(st.out).halt.reason, 'spec-design-cause');
  assert.equal(rl('resume', '--run', 'u1').code, 3, 'resume needs --ack after a halt');
  const pending = rl('resume', '--run', 'u1', '--ack', 'J. Park: design question answered in ADR 0002');
  assert.equal(pending.code, 0, pending.out + pending.err);
  assert.match(pending.out, /T1 awaits a ruling on B6/);
  assert.equal(rl('ruling', '--run', 'u1', '--task', 'T1', '--decision', 'reroute', '--by', 'Tech Lead: J. Park', '--note', 'back to Design: plan rev 2').code, 0);
  const st2 = JSON.parse(rl('status', '--run', 'u1', '--json').out);
  assert.equal(st2.tasks.find((t) => t.id === 'T1').state, 'rerouted');
});

test('resume after a crash continues from the first task not done and requires a fresh preflight', () => {
  const { dir, rl } = runFixture();
  finishT1(rl);
  const r = rl('resume', '--run', 'r1');
  assert.equal(r.code, 0);
  assert.match(r.out, /next task: T2/);
  assert.equal(rl('task', '--run', 'r1', '--task', 'T2', '--state', 'started').code, 1, 'preflight required after resume');
  assert.equal(exec(PREFLIGHT, dir, ['--run', 'r1']).code, 0);
  assert.equal(rl('task', '--run', 'r1', '--task', 'T2', '--state', 'started').code, 0);
});

test('a corrupt or gapped ledger exits 2 with NEEDS_HUMAN; a halted fixture needs an acknowledgement', () => {
  const dir = makeRepo('corrupt');
  cpSync(join(FIX, 'project'), dir, { recursive: true });
  commit(dir, 'fixture');
  for (const [id, file] of [['c1', 'corrupt.jsonl'], ['c2', 'seq-gap.jsonl'], ['h1', 'halted.jsonl']]) {
    mkdirSync(join(dir, `.agentic-sdlc/runs/${id}`), { recursive: true });
    cpSync(join(FIX, file), join(dir, `.agentic-sdlc/runs/${id}/ledger.jsonl`));
  }
  const c1 = exec(LEDGER, dir, ['resume', '--run', 'c1']);
  assert.equal(c1.code, 2);
  assert.match(c1.err, /line 2 is not JSON → run status NEEDS_HUMAN/);
  const c2 = exec(LEDGER, dir, ['status', '--run', 'c2']);
  assert.equal(c2.code, 2);
  assert.match(c2.err, /seq 3, expected 2/);
  assert.equal(exec(LEDGER, dir, ['status', '--run', 'h1']).code, 3);
  assert.equal(exec(LEDGER, dir, ['resume', '--run', 'h1']).code, 3);
  assert.equal(exec(LEDGER, dir, ['resume', '--run', 'h1', '--ack', 'J. Park: package.json change approved in plan rev 2']).code, 0);
});

test('finish writes result.json and archives the ledger next to the spec', () => {
  const { dir, rl } = runFixture();
  finishT1(rl);
  for (const id of ['T2', 'T3']) {
    rl('task', '--run', 'r1', '--task', id, '--state', 'started');
    rl('red', '--run', 'r1', '--task', id, '--test', `AC-${id.slice(1)} test`, '--signature', 'expected');
    rl('round', '--run', 'r1', '--task', id, '--loop', 'red-green', '--result', 'pass');
    assert.equal(rl('task', '--run', 'r1', '--task', id, '--state', 'done').code, 0);
  }
  const f = rl('finish', '--run', 'r1');
  assert.equal(f.code, 0, f.out + f.err);
  const result = JSON.parse(readFileSync(join(dir, '.agentic-sdlc/runs/r1/result.json'), 'utf8'));
  assert.equal(result.status, 'DONE');
  assert.deepEqual(result.tasks.map((t) => t.state), ['done', 'done', 'done']);
  assert.ok(existsSync(join(dir, 'specs/001-demo/run-ledger.jsonl')));
  assert.equal(rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started').code, 1, 'finished run is closed');
});

test('finish reports NEEDS_HUMAN on a pending ruling or a non-budget halt and BLOCKED on unfinished tasks', () => {
  const a = runFixture();
  a.rl('task', '--run', 'r1', '--task', 'T1', '--state', 'started');
  fail(a.rl, 'T1', 'build-test', 'AC-1 conflicts', 'n/a', 'design');
  const fa = a.rl('finish', '--run', 'r1', '--json');
  assert.equal(fa.code, 3);
  assert.equal(JSON.parse(fa.out).status, 'NEEDS_HUMAN');

  const b = runFixture();
  b.rl('halt', '--run', 'r1', '--reason', 'authority', '--detail', 'git push requested');
  assert.equal(b.rl('finish', '--run', 'r1').code, 3);

  const c = runFixture();
  finishT1(c.rl);
  const fc = c.rl('finish', '--run', 'r1');
  assert.equal(fc.code, 1);
  assert.match(fc.out, /BLOCKED — tasks not done: T2=pending, T3=pending/);
});

test('a heading-form plan yields tasks without Files; check reports the skipped file check', () => {
  const parsed = readPlanTasks(readFileSync(join(FIX, 'plan-headings.md'), 'utf8'));
  assert.equal(parsed.source, 'headings');
  assert.deepEqual(parsed.tasks.map((t) => [t.id, t.blockedBy, t.files]), [['T1', [], null], ['T2', ['T1'], null]]);
  const dir = makeRepo('headings');
  cpSync(join(FIX, 'project'), dir, { recursive: true });
  cpSync(join(FIX, 'plan-headings.md'), join(dir, 'docs/plans/greet.md'));
  commit(dir, 'fixture');
  sh(dir, 'checkout', '-q', '-b', 'feat/h');
  assert.equal(exec(LEDGER, dir, ['start', '--run', 'h', '--plan', 'docs/plans/greet.md']).code, 0);
  const r = exec(LEDGER, dir, ['check', '--run', 'h']);
  assert.equal(r.code, 0, r.out + r.err);
  assert.match(r.out, /plan lists no Files column/);
});

test('inPlan accepts exact paths, directories, globs and test twins of planned files', () => {
  const files = ['src/greet.mjs', 'docs/', 'lib/**/*.ts'];
  assert.ok(inPlan('src/greet.mjs', files));
  assert.ok(inPlan('docs/a/b.md', files));
  assert.ok(inPlan('lib/x/y.ts', files));
  assert.ok(inPlan('test/greet.test.mjs', files));
  assert.ok(!inPlan('src/other.mjs', files));
});

test('evaluateRound gives root-cause routing precedence over loop bounds', () => {
  const st = { start: { budgets: { max_rounds: 5 } } };
  const t = { rounds: [], rulingSeq: 0, debugSeq: 0 };
  assert.equal(evaluateRound(st, t, { result: 'fail', loop: 'build-test', cause: 'plan', signature: 's' }).breaker, 'B6');
  assert.equal(evaluateRound(st, t, { result: 'pass', loop: 'build-test' }), null);
});

test('the worked-example run ledger is a finished DONE run and renders the loop ledger', () => {
  const events = loadLedger(WORKED);
  assert.equal(events.at(-1).type, 'finish');
  assert.equal(events.at(-1).status, 'DONE');
  const r = exec(LEDGER, HERE, ['status', '--ledger', WORKED, '--json']);
  assert.equal(r.code, 0, r.out + r.err);
  assert.equal(JSON.parse(r.out).result, 'DONE');
  const table = renderTable(events);
  assert.match(table, /\| fixed \|/);
  assert.match(table, /\| failed \|/);
});
