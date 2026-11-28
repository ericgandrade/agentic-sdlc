import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const METRICS = join(HERE, '..', 'metrics.mjs');
const HISTORY = '.agentic-sdlc/metrics/history.jsonl';
const NOW = '2026-11-28T12:00:00Z';
const AUTHOR = 'Zebulon Quasar';
const EMAIL = 'zquasar@example.org';

// Runs a git step with fixed author and committer dates, so lead times are exact.
function dated(iso, fn) {
  const keep = [process.env.GIT_AUTHOR_DATE, process.env.GIT_COMMITTER_DATE];
  process.env.GIT_AUTHOR_DATE = iso;
  process.env.GIT_COMMITTER_DATE = iso;
  try { return fn(); } finally {
    if (keep[0] === undefined) delete process.env.GIT_AUTHOR_DATE; else process.env.GIT_AUTHOR_DATE = keep[0];
    if (keep[1] === undefined) delete process.env.GIT_COMMITTER_DATE; else process.env.GIT_COMMITTER_DATE = keep[1];
  }
}

const ev = (seq, type, extra = {}) => JSON.stringify({ v: 1, seq, ts: `2026-11-02T0${Math.min(seq, 9)}:00:00Z`, type, ...extra });
const LEDGER = [
  ev(1, 'start', { tasks: [{ id: 'T1' }, { id: 'T2' }, { id: 'T3' }], budgets: {} }),
  ev(2, 'round', { task: 'T1', loop: 'build-test', round: 1, result: 'fail', cause: 'code' }),
  ev(3, 'round', { task: 'T1', loop: 'build-test', round: 2, result: 'fail', cause: 'code' }),
  ev(4, 'round', { task: 'T1', loop: 'build-test', round: 3, result: 'pass' }),
  ev(5, 'round', { task: 'T2', loop: 'build-test', round: 1, result: 'fail', cause: 'design', escalation: { breaker: 'B6', target: 'Tech Lead', why: 'design cause' } }),
  ev(6, 'ruling', { task: 'T2', breaker: 'B6', decision: 'reroute', by: 'Tech Lead' }),
  ev(7, 'task', { task: 'T3', state: 'done', commit: 'abc1234' }),
  ev(8, 'round', { task: 'PR', loop: 'review-fix', round: 1, result: 'pass' }),
].join('\n') + '\n';

const opsRecord = (failed) => `# Ops record\n\n## Delivery facts for this release\n\n| Fact | Value | Source |\n|---|---|---|\n| Rollback during rollout | no | §Deploy log |\n| Change failed (any of the three above) | ${failed} | this table |\n`;

// main: init → merge of 001-a (T1 at 11-02 00:00, merge 11-04 00:00 = 48 h) → merge of 002-b (12 h)
// → a revert and a hotfix on main. 001-a failed (ops.md), 002-b did not.
function fixture() {
  const dir = makeRepo('metrics');
  sh(dir, 'config', 'user.name', AUTHOR);
  sh(dir, 'config', 'user.email', EMAIL);
  dated('2026-11-01T00:00:00Z', () => { write(dir, 'README.md', 'x\n'); commit(dir, 'init'); });
  sh(dir, 'checkout', '-q', '-b', 'feat-a');
  dated('2026-11-02T00:00:00Z', () => { write(dir, 'specs/001-a/plan.md', '# Plan\n'); write(dir, 'src/a.js', '1\n'); commit(dir, 'feat: add a\n\nRefs: T1'); });
  dated('2026-11-03T00:00:00Z', () => { write(dir, 'src/a.js', '2\n'); write(dir, 'specs/001-a/run-ledger.jsonl', LEDGER); commit(dir, 'feat: finish a\n\nRefs: T2'); });
  sh(dir, 'checkout', '-q', 'main');
  dated('2026-11-04T00:00:00Z', () => sh(dir, 'merge', '-q', '--no-ff', '-m', `Merge pull request #1 from ${AUTHOR}/feat-a`, 'feat-a'));
  const between = sh(dir, 'rev-parse', 'HEAD').trim();
  sh(dir, 'checkout', '-q', '-b', 'feat-b');
  dated('2026-11-05T00:00:00Z', () => { write(dir, 'specs/002-b/plan.md', '# Plan\n'); write(dir, 'src/b.js', '1\n'); commit(dir, 'feat: add b\n\nRefs: T1'); });
  sh(dir, 'checkout', '-q', 'main');
  dated('2026-11-05T12:00:00Z', () => sh(dir, 'merge', '-q', '--no-ff', '-m', 'Merge branch feat-b', 'feat-b'));
  dated('2026-11-06T00:00:00Z', () => { write(dir, 'src/b.js', '1\n// revert\n'); commit(dir, 'Revert "feat: add b"'); });
  dated('2026-11-06T01:00:00Z', () => { write(dir, 'src/b.js', '1\n// fix\n'); commit(dir, 'hotfix: guard b'); });
  write(dir, 'specs/001-a/ops.md', opsRecord('yes'));
  write(dir, 'specs/002-b/ops.md', opsRecord('no'));
  return { dir, between };
}

function exec(cwd, args) {
  const r = spawnSync(process.execPath, [METRICS, ...args], { cwd, encoding: 'utf8', env: { ...process.env, SDLC_NOW: NOW } });
  let json = null;
  if (args.includes('--json') && r.stdout) json = JSON.parse(r.stdout);
  return { code: r.status, out: r.stdout, err: r.stderr, json };
}

const row = (cycle, lead, cfr, at = '2026-11-01T00:00:00Z') => JSON.stringify({
  v: 1, cycle, at, since: null, head: null,
  metrics: {
    leadTimeHours: { median: lead, max: lead, n: 1, unmeasured: 0, items: [] },
    changeFailureRate: { rate: cfr, failed: cfr ? 1 : 0, released: cfr ? 5 : 1, pending: 0, items: [] },
    loopRounds: { max: 1, mean: 1, tasks: 1, escalations: 0, ledgers: 1 },
    reverts: 0, hotfixes: 0,
  },
});
const historyLines = (dir) => readFileSync(join(dir, HISTORY), 'utf8').split('\n').filter(Boolean);

test('lead time: first task commit → merge into the default branch, per merge commit', () => {
  const { dir } = fixture();
  const r = exec(dir, ['--json']);
  assert.equal(r.code, 0, r.err + r.out);
  const lt = r.json.metrics.leadTimeHours;
  assert.deepEqual(lt.items.map((x) => [x.item, x.hours]), [['specs/001-a', 48], ['specs/002-b', 12]]);
  assert.equal(lt.median, 30);
  assert.equal(lt.max, 48);
  assert.equal(lt.n, 2);
});

test('--since <ref> limits the cycle to later commits', () => {
  const { dir, between } = fixture();
  const r = exec(dir, ['--since', between, '--json']);
  assert.equal(r.code, 0, r.err);
  assert.deepEqual(r.json.metrics.leadTimeHours.items.map((x) => x.item), ['specs/002-b']);
  const d = exec(dir, ['--since', '2026-11-04T06:00:00Z', '--json']);
  assert.deepEqual(d.json.metrics.leadTimeHours.items.map((x) => x.item), ['specs/002-b'], 'a date works too');
  assert.equal(exec(dir, ['--since', 'no-such-ref-or-date']).code, 2);
});

test('change-failure rate counts released items with a failed change (ops.md, postmortem)', () => {
  const { dir } = fixture();
  let c = exec(dir, ['--json']).json.metrics.changeFailureRate;
  assert.deepEqual([c.failed, c.released, c.rate], [1, 2, 0.5]);
  write(dir, 'specs/002-b/ops.md', '# Ops record\n');
  write(dir, 'docs/postmortems/2026-11-07-002-b.md', '# Postmortem\n\n**Severity:** SEV2 · spec `specs/002-b`\n');
  c = exec(dir, ['--json']).json.metrics.changeFailureRate;
  assert.deepEqual([c.failed, c.released], [2, 2], 'a SEV1/SEV2 postmortem naming the item fails it');
  write(dir, 'specs/002-b/ops.md', opsRecord('window open until 2026-12-01'));
  c = exec(dir, ['--json']).json.metrics.changeFailureRate;
  assert.deepEqual([c.failed, c.released, c.pending], [1, 1, 1], 'an open window is pending, outside the denominator');
});

test('loop rounds and escalations come from the archived run ledgers; reverts and hotfixes from git', () => {
  const { dir } = fixture();
  const m = exec(dir, ['--json']).json.metrics;
  assert.deepEqual(m.loopRounds, { max: 3, mean: 1.7, tasks: 3, escalations: 1, ledgers: 1 }, 'a done task with no round event ran 1 round');
  assert.equal(m.reverts, 1);
  assert.equal(m.hotfixes, 1);
  write(dir, 'specs/001-a/run-ledger.jsonl', LEDGER + '{"v":1,"seq":99}\n');
  assert.equal(exec(dir, []).code, 2, 'a corrupt archived ledger is unparsable input');
});

test('--record appends one row per cycle; the trend rule fires and needs a Change item in the retro', () => {
  const { dir } = fixture();
  write(dir, HISTORY, [row('c1', 10, 0), row('c2', 10, 0), row('c3', 10, 0.2)].join('\n') + '\n');
  assert.equal(exec(dir, ['--record', '--json']).code, 2, '--record needs --cycle');
  const r = exec(dir, ['--record', '--cycle', 'c4', '--json']);
  assert.equal(r.code, 1, r.out);
  assert.equal(historyLines(dir).length, 4);
  const last = JSON.parse(historyLines(dir)[3]);
  assert.equal(last.cycle, 'c4');
  assert.equal(last.metrics.leadTimeHours.median, 30);
  assert.equal(r.json.trend.leadTimeHours, 'worse');
  assert.equal(r.json.trend.changeFailureRate, 'worse');
  assert.equal(r.json.trend.reverts, 'worse');
  assert.deepEqual(r.json.required.map((x) => x.metric).sort(), ['changeFailureRate', 'leadTimeHours']);
  assert.equal(r.json.retro.satisfied, false);

  assert.equal(exec(dir, ['--record', '--cycle', 'c4']).code, 2, 'the same cycle is never recorded twice');
  assert.equal(historyLines(dir).length, 4);

  write(dir, 'docs/retros/2026-11-28.md', `# Retro — 2026-11-28

## Change

| # | Observation | Cause tag | Seen before (≤ 90 days) |
|---|---|---|---|
| C-1 | Lead time 30 h, above 1.5 × median | process | none |
| C-2 | Change failure rate above 15% at two retros | test-gap | none |

## Actions

| ID | Action | Owner (role, person) | Target file | From | Control approved by (recurrence only) | Due (≤ 14 days) | Status |
|---|---|---|---|---|---|---|---|
| RA-20261128-1 | Split items above size M | Tech Lead, X | \`references/paths.md\` | C-1 | n/a | 2026-12-10 | open |
`);
  let ok = exec(dir, ['--cycle', 'c4', '--json']);
  assert.equal(ok.code, 1, 'C-2 has no action yet');
  assert.deepEqual(ok.json.required.filter((x) => !x.satisfied).map((x) => x.metric), ['changeFailureRate']);
  write(dir, 'docs/retros/2026-11-28.md', readFileSync(join(dir, 'docs/retros/2026-11-28.md'), 'utf8')
    + '| RA-20261128-2 | Add a contract test for b | Tech Lead, X | `test/b.test.js` | C-2 | n/a | 2026-12-10 | open |\n');
  ok = exec(dir, ['--cycle', 'c4', '--json']);
  assert.equal(ok.code, 0, ok.out);
  assert.equal(ok.json.retro.satisfied, true);
});

test('the trend rule is n/a with fewer than 3 earlier cycles and quiet when metrics improve', () => {
  const { dir } = fixture();
  write(dir, HISTORY, row('c1', 100, 0) + '\n');
  const r = exec(dir, ['--json']);
  assert.equal(r.code, 0, r.out);
  assert.equal(r.json.trend.leadTimeHours, 'better');
  assert.match(r.json.rules.leadTimeHours, /^n\/a/);
  assert.deepEqual(r.json.required, []);
});

test('no per-person metrics: author names never appear in output or history', () => {
  const { dir } = fixture();
  const t = exec(dir, ['--record', '--cycle', 'c1']);
  const j = exec(dir, ['--json', '--cycle', 'c1']);
  for (const text of [t.out, t.err, j.out, readFileSync(join(dir, HISTORY), 'utf8')]) {
    assert.ok(!text.includes(AUTHOR) && !text.includes('Zebulon') && !text.includes(EMAIL), text);
  }
});

test('history: a torn last line is ignored and dropped before appending; any other bad line exits 2', () => {
  const { dir } = fixture();
  write(dir, HISTORY, row('c1', 10, 0) + '\n{"v":1,"cyc');
  const r = exec(dir, ['--json']);
  assert.equal(r.code, 0, r.err);
  assert.match(r.err, /torn last line ignored/);
  const w = exec(dir, ['--record', '--cycle', 'c2']);
  assert.match(w.err, /torn last line removed/);
  assert.deepEqual(historyLines(dir).map((l) => JSON.parse(l).cycle), ['c1', 'c2']);

  write(dir, HISTORY, row('c1', 10, 0) + '\nnot json\n' + row('c2', 10, 0) + '\n');
  assert.equal(exec(dir, []).code, 2);
  write(dir, HISTORY, '{"v":2}\n');
  assert.equal(exec(dir, []).code, 2, 'a row that is not a history row exits 2');
  assert.ok(existsSync(join(dir, HISTORY)));
});

test('--help prints usage and exits 0', () => {
  const r = spawnSync(process.execPath, [METRICS, '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Usage: node metrics\.mjs/);
});
