import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMITS, parseFiles, parseSize, planHash, specAcIds } from '../plan-graph.mjs';
import { contentHash } from '../lib/md.mjs';
import { makeDir, makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'plan-graph.mjs');
const SKILL = join(HERE, '..', '..');
const EXAMPLE_DIR = join(SKILL, 'examples', 'worked-example', 'specs', '001-csv-export');
const EXAMPLE = join(EXAMPLE_DIR, 'plan.md');
const FIX = join(HERE, 'fixtures', 'plan-graph');
const SPEC = readFileSync(join(FIX, 'spec.md'), 'utf8');
const VALID = readFileSync(join(FIX, 'valid.plan.md'), 'utf8');

function exec(...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  let json = null;
  if (args.includes('--json')) { try { json = JSON.parse(r.stdout); } catch { json = null; } }
  return { code: r.status, stdout: r.stdout, stderr: r.stderr, json };
}

const codes = (r) => r.json.errors.map((e) => e.code);

// Writes a plan (and the fixture spec unless spec === null) into a fresh .work directory.
function stage(plan, { spec = SPEC, name = 'plan' } = {}) {
  const dir = makeDir(name);
  write(dir, 'plan.md', plan);
  if (spec !== null) write(dir, 'spec.md', spec);
  return join(dir, 'plan.md');
}

function taskRows(n, { size = '1h' } = {}) {
  return Array.from({ length: n }, (_, i) => {
    const ac = `AC-${(i % 3) + 1}`;
    return `| T${i + 1} | Task ${i + 1} | ${ac} | — | \`src/f${i + 1}.ts\` | ${size} |`;
  }).join('\n');
}

function withTasks(plan, rows) {
  return plan.replace(/(\|---\|---\|---\|---\|---\|---\|\n)[\s\S]*?\n\n/, `$1${rows}\n\n`);
}

function approve(plan, { spec = SPEC, approval = 'Specify + Design (combined)', planRev = 1, hash = null } = {}) {
  const row = `| ${approval} | ${planRev} | ${hash ?? planHash(plan)} | 2 | ${contentHash(spec)} | 2026-11-21 10:00 | Tech Lead | A. Lee | "Approved." | plan-graph exit 0 | none | approved |`;
  return `${plan.trimEnd()}\n${row}\n`;
}

test('worked example: passes, graph.json is current, approval row is valid', () => {
  const r = exec(EXAMPLE, '--check', '--check-approval', '--json');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.deepEqual(r.json.errors, []);
  const g = r.json.graph;
  assert.equal(g.review, 'combined');
  assert.deepEqual(g.waves, [['T1', 'T2'], ['T3'], ['T4', 'T5']]);
  assert.deepEqual(g.conflicts.map((c) => c.tasks), [['T3', 'T4']]);
  assert.ok(g.edges.some((e) => e.type === 'file-conflict' && e.from === 'T3' && e.to === 'T4'));
  const committed = JSON.parse(readFileSync(join(EXAMPLE_DIR, 'graph.json'), 'utf8'));
  assert.equal(committed.planHash, g.planHash);
});

test('worked example: frontier follows done tasks and serializes file conflicts', () => {
  // T3/T4 share a file: T4 waits for T3 even though its own blocker (T1) is done.
  let r = exec(EXAMPLE, '--done', 'T1', '--json');
  assert.deepEqual(r.json.state.ready, ['T2']);
  r = exec(EXAMPLE, '--done', 'T1,T2', '--json');
  assert.deepEqual(r.json.state.ready, ['T3']);
  assert.deepEqual(r.json.state.frontier, ['T3']);
  r = exec(EXAMPLE, '--done', 'T1,T2,T3', '--json');
  assert.deepEqual(r.json.state.frontier, ['T4', 'T5']);
  r = exec(EXAMPLE, '--max-parallel', '1', '--json');
  assert.deepEqual(r.json.state.frontier, ['T1']);
  r = exec(EXAMPLE, '--done', 'T1,T2,T3,T4,T5', '--json');
  assert.equal(r.json.state.complete, true);
  assert.deepEqual(r.json.state.frontier, []);
});

test('valid fixture: waves, retired AC ignored, comment AC ignored', () => {
  assert.deepEqual(specAcIds(SPEC), ['AC-1', 'AC-2', 'AC-3']);
  const r = exec(join(FIX, 'valid.plan.md'), '--json');
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.graph.waves, [['T1'], ['T2', 'T3']]);
  assert.equal(r.json.graph.nodes.find((n) => n.id === 'T3').sizeHours, 1.5);
});

const INVALID = [
  ['cycle.plan.md', ['CYCLE']],
  ['self-dep.plan.md', ['CYCLE']],
  ['unknown-dep.plan.md', ['UNKNOWN_DEP']],
  ['missing-ac.plan.md', ['NO_AC', 'UNKNOWN_AC', 'UNKNOWN_AC', 'UNCOVERED_AC']],
  ['oversize.plan.md', ['SIZE_BOUND', 'NO_FILES', 'BAD_SIZE']],
  ['bad-id.plan.md', ['DUPLICATE_ID', 'BAD_ID']],
];
for (const [file, expected] of INVALID) {
  test(`invalid fixture ${file} → exit 1 with ${expected.join(', ')}`, () => {
    const r = exec(join(FIX, file), '--json');
    assert.equal(r.code, 1, r.stdout);
    assert.deepEqual(codes(r).sort(), [...expected].sort());
    assert.equal(r.json.ok, false);
  });
}

test('unparsable input → exit 2', () => {
  assert.equal(exec(join(FIX, 'no-tasks.plan.md')).code, 2);
  assert.equal(exec(join(FIX, 'missing-column.plan.md')).code, 2);
  assert.equal(exec(join(FIX, 'absent.plan.md')).code, 2);
  assert.equal(exec().code, 2);
  assert.equal(exec(stage(VALID, { spec: null })).code, 2, 'missing sibling spec.md');
  assert.equal(exec(stage(VALID, { spec: '# Spec\n\nNo criteria.\n' })).code, 2, 'spec without AC IDs');
  assert.equal(exec(EXAMPLE, '--max-parallel', '4').code, 2);
});

test('--no-spec skips AC existence and coverage checks', () => {
  const r = exec(join(FIX, 'missing-ac.plan.md'), '--no-spec', '--json');
  assert.deepEqual(codes(r), ['NO_AC']);
});

test('task bound, word bound and path rules', () => {
  let r = exec(stage(withTasks(VALID, taskRows(LIMITS.maxTasks + 1))), '--json');
  assert.ok(codes(r).includes('TASK_BOUND'));

  const prose = `\n## Goal and architecture\n\n${'word '.repeat(LIMITS.words.Standard + 1)}\n`;
  r = exec(stage(VALID.replace('\n## Tasks', `${prose}\n## Tasks`)), '--json');
  assert.ok(codes(r).includes('WORD_BOUND'));
  r = exec(stage(VALID.replace('\n## Tasks', `${prose}\n## Tasks`).replace('Path:** Standard', 'Path:** Full'), { spec: SPEC.replace('| Path | Standard |', '| Path | Full |') }), '--json');
  assert.equal(r.code, 0, r.stdout);

  r = exec(stage(VALID.replace('Path:** Standard', 'Path:** Full')), '--json');
  assert.deepEqual(codes(r), ['PATH_MISMATCH']);
  r = exec(stage(VALID.replace('Path:** Standard', 'Path:** Quick'), { spec: SPEC.replace('| Path | Standard |', '| Path | Quick |') }), '--json');
  assert.ok(codes(r).includes('PATH_QUICK'));
  r = exec(stage(VALID.replace('**Path:** Standard · ', '')), '--json');
  assert.equal(r.code, 0);
  assert.equal(r.json.graph.path, 'Standard', 'path falls back to the spec header');
});

test('--write then --check detects a stale or missing graph.json', () => {
  const plan = stage(VALID);
  assert.equal(exec(plan, '--check', '--json').json.errors[0].code, 'GRAPH_MISSING');
  assert.equal(exec(plan, '--write').code, 0);
  const first = readFileSync(join(dirname(plan), 'graph.json'), 'utf8');
  assert.equal(exec(plan, '--write').code, 0);
  assert.equal(readFileSync(join(dirname(plan), 'graph.json'), 'utf8'), first, 'deterministic output');
  assert.equal(exec(plan, '--check').code, 0);
  write(dirname(plan), 'plan.md', VALID.replace('| 90m |', '| 2h |'));
  const r = exec(plan, '--check', '--json');
  assert.equal(r.code, 1);
  assert.deepEqual(codes(r), ['GRAPH_STALE']);
});

test('a failing plan never writes graph.json', () => {
  const plan = stage(readFileSync(join(FIX, 'cycle.plan.md'), 'utf8'));
  assert.equal(exec(plan, '--write').code, 1);
  assert.equal(existsSync(join(dirname(plan), 'graph.json')), false);
});

test('--check-approval binds the plan hash and the spec hash', () => {
  const approved = approve(VALID);
  assert.equal(exec(stage(approved), '--check-approval').code, 0);

  let r = exec(stage(VALID), '--check-approval', '--json');
  assert.deepEqual(codes(r), ['APPROVAL_MISSING']);

  r = exec(stage(approved.replace('| 90m |', '| 2h |')), '--check-approval', '--json');
  assert.deepEqual(codes(r), ['APPROVAL_VOID']);

  const spec2 = SPEC.replace('every row appears once', 'every row appears exactly once');
  r = exec(stage(approved, { spec: spec2 }), '--check-approval', '--json');
  assert.deepEqual(codes(r), ['APPROVAL_SPEC_VOID']);

  const rev2 = VALID.replace('| 1 | 2026-11-20 | First plan | — |', '| 1 | 2026-11-20 | First plan | — |\n| 2 | 2026-11-21 | Split T1 | review |');
  r = exec(stage(approve(rev2, { planRev: 1 })), '--check-approval', '--json');
  assert.deepEqual(codes(r), ['APPROVAL_REV']);
  assert.equal(exec(stage(approve(rev2, { planRev: 2 })), '--check-approval').code, 0);

  r = exec(stage(approved.replace('| Tech Lead | A. Lee |', '| Tech Lead | — |')), '--check-approval', '--json');
  assert.deepEqual(codes(r), ['APPROVAL_FIELD']);
});

test('Loop ledger rows never void Design sign-off', () => {
  const ledger = '\n## Loop ledger\n\n| Date | Task | Loop | Round | Failure signature | Cause | Tried | Result |\n|---|---|---|---|---|---|---|---|\n';
  const base = VALID.replace('\n## Revision log', `${ledger}\n## Revision log`);
  const approved = approve(base);
  const appended = approved.replace(/(\|---\|---\|---\|---\|---\|---\|---\|---\|\n)/, '$1| 2026-11-22 | T2 | build-test | 1 | `auth > 403` → expected 403 | code | moved the check | fixed |\n');
  assert.notEqual(appended, approved);
  assert.equal(planHash(appended), planHash(approved));
  assert.equal(exec(stage(appended), '--check-approval').code, 0);
});

test('combined Specify + Design review: Standard with ≤ 5 tasks only (K8)', () => {
  const five = withTasks(VALID, taskRows(5));
  let r = exec(stage(approve(five)), '--check-approval', '--json');
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.graph.review, 'combined');

  const six = withTasks(VALID, taskRows(6));
  r = exec(stage(approve(six)), '--check-approval', '--json');
  assert.equal(r.json.graph.review, 'separate');
  assert.deepEqual(codes(r), ['COMBINED_NOT_ALLOWED']);
  assert.equal(exec(stage(approve(six, { approval: 'Design' })), '--check-approval').code, 0);

  const full = five.replace('Path:** Standard', 'Path:** Full');
  const fullSpec = SPEC.replace('| Path | Standard |', '| Path | Full |');
  r = exec(stage(approve(full, { spec: fullSpec }), { spec: fullSpec }), '--check-approval', '--json');
  assert.deepEqual(codes(r), ['COMBINED_NOT_ALLOWED']);
});

test('--from-git marks tasks done from Refs trailers', () => {
  const repo = makeRepo('plan-graph');
  write(repo, 'plan.md', VALID);
  write(repo, 'spec.md', SPEC);
  commit(repo, 'docs: plan');
  sh(repo, 'checkout', '-q', '-b', 'feat');
  write(repo, 'src/export.ts', 'export {};\n');
  commit(repo, 'feat: export rows\n\nRefs: T1 AC-1 AC-2');
  const r = exec(join(repo, 'plan.md'), '--from-git', 'main..HEAD', '--json');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.deepEqual(r.json.state.done, ['T1']);
  assert.deepEqual(r.json.state.frontier, ['T2', 'T3']);
});

test('done-state warnings', () => {
  const r = exec(join(FIX, 'valid.plan.md'), '--done', 'T2,T7', '--json');
  assert.equal(r.code, 0);
  assert.deepEqual(r.json.warnings.map((w) => w.code).sort(), ['DONE_OUT_OF_ORDER', 'DONE_UNKNOWN']);
});

test('helpers: files and sizes', () => {
  assert.deepEqual(parseFiles('`a.ts`, `b/`'), ['a.ts', 'b/']);
  assert.deepEqual(parseFiles('a.ts; ./b.ts'), ['a.ts', 'b.ts']);
  assert.deepEqual(parseFiles('—'), []);
  assert.equal(parseSize('1d'), 8);
  assert.equal(parseSize('30m'), 0.5);
  assert.equal(parseSize('4 hours'), 4);
  assert.equal(parseSize('large'), null);
});

test('directory and glob entries count as overlapping Files', () => {
  const rows = '| T1 | A | AC-1 | — | `src/export/` | 1h |\n| T2 | B | AC-2 | — | `src/export/csv.ts` | 1h |\n| T3 | C | AC-3 | — | `src/auth/*.ts` | 1h |\n| T4 | D | AC-1 | — | `src/auth/x.ts` | 1h |';
  const r = exec(stage(withTasks(VALID, rows)), '--json');
  assert.equal(r.code, 0, r.stdout);
  assert.deepEqual(r.json.graph.waves, [['T1', 'T3'], ['T2', 'T4']]);
  assert.equal(r.json.graph.conflicts.length, 2);
});

test('--help prints usage and exits 0', () => {
  const r = exec('--help');
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Usage: plan-graph/);
  assert.match(r.stdout, /Exit codes/);
});
