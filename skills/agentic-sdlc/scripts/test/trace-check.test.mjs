import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from '../lib/git.mjs';
import { makeDir, makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'trace-check.mjs');
const EXAMPLE = join(HERE, '..', '..', 'examples', 'worked-example', 'specs', '001-csv-export');
const TODAY = '2026-11-27';
const SPEC = 'specs/001-x';

const spec = (acs = ['AC-1', 'AC-2'], path = 'Standard') => `# Spec: export\n\n| Field | Value |\n|---|---|\n| ID | 001-x |\n| Revision | 1 |\n| Path | ${path} |\n\n` +
  '## Acceptance criteria\n\n| ID | Criterion | Priority |\n|---|---|---|\n' + acs.map((a) => `| ${a} | Given x, when y, then z. | normal |`).join('\n') + '\n';

const plan = (rows = [['T1', 'AC-1'], ['T2', 'AC-2']]) => '# Plan: export\n\n**Path:** Standard\n\n## Tasks\n\n| ID | Title | AC | Blocked by | Files | Size |\n|---|---|---|---|---|---|\n' +
  rows.map(([id, ac]) => `| ${id} | Task ${id} | ${ac} | — | \`src/${id}.js\` | 2h |`).join('\n') + '\n';

const filter = (ac) => `\`node --test --test-name-pattern="^${ac}(?![0-9])" test/x.test.js\``;
const tests = (rows = [['AC-1', 'AT-1a', 'AC-1 exports the rows'], ['AC-2', 'AT-2a', 'AC-2 escapes formulas']], cmd = filter) => '# Acceptance tests — 001-x\n\n## Map\n\n' +
  '| AC | Critical | Test ID | Test name (contains the AC ID) | Level | File | Failure it catches | Negative |\n|---|---|---|---|---|---|---|---|\n' +
  rows.map(([ac, id, name]) => `| ${ac} | no | ${id} | \`${name}\` | unit | \`test/x.test.js\` | defect | no |`).join('\n') +
  '\n\n## Green at the PR head\n\n| Test ID | Command | Exit | Fingerprint | Time (ISO-8601) |\n|---|---|---|---|---|\n' +
  [...new Set(rows.map((r) => r[0]))].map((ac) => `| AT-${ac.slice(3)}a | ${cmd(ac)} | 0 | \`aaaaaaaaaaaa\` | 2026-11-25T09:42:10Z |`).join('\n') + '\n';

const prBody = (rows = [['AC-1', 'ok'], ['AC-2', 'ok']]) => '**Spec:** `specs/001-x/spec.md`\n\n## Verification\n\n| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |\n|---|---|---|---|---|---|---|\n' +
  '| DoD:test | — | `npm test` | 0 | `aaaaaaaaaaaa` | 2026-11-25T09:40:00Z | Reviewer |\n\n## Trace\n\n| AC | Tasks | Commits | Tests | Verification rows | Status |\n|---|---|---|---|---|---|\n' +
  rows.map(([ac, st]) => `| ${ac} | T1 | \`abc1234\` | AT-1a | ${ac} | ${st} |`).join('\n') + '\n\n**Orphans:** none\n';

// A Standard repo: spec, plan and acceptance tests on main; on feat an acceptance-test commit (artifact)
// and one code commit per task. Overrides change any input; `commits` replaces the code commits.
function fixture(o = {}) {
  const repo = makeRepo('trace');
  write(repo, `${SPEC}/spec.md`, o.spec ?? spec());
  if (o.plan !== false) write(repo, `${SPEC}/plan.md`, o.plan ?? plan());
  if (o.tests !== false) write(repo, `${SPEC}/acceptance-tests.md`, o.tests ?? tests());
  write(repo, 'README.md', 'x\n');
  commit(repo, 'docs: spec, plan and acceptance tests');
  sh(repo, 'checkout', '-q', '-b', 'feat/001-x');
  write(repo, 'test/x.test.js', '// AC-1 exports the rows\n// AC-2 escapes formulas\n');
  commit(repo, 'test: acceptance tests for 001-x\n\nRefs: AC-1 AC-2');
  for (const [file, msg] of o.commits ?? [['src/T1.js', 'feat: one\n\nRefs: T1 AC-1'], ['src/T2.js', 'feat: two\n\nRefs: T2 AC-2']]) {
    write(repo, file, `${msg}\n`);
    commit(repo, msg);
  }
  const pr = join(makeDir('trace-pr'), 'pr-body.md');
  write(dirname(pr), 'pr-body.md', o.pr ?? prBody());
  return { repo, dir: join(repo, SPEC), pr };
}

function exec(args, cwd, env = process.env) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args, '--json'], { encoding: 'utf8', cwd, env });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* not JSON */ }
  return { code: r.status, json, stdout: r.stdout, stderr: r.stderr };
}

const run = (f, extra = []) => exec([f.dir, '--base', 'main', '--pr', f.pr, '--today', TODAY, ...extra], f.repo);
const rules = (r) => [...new Set(r.json.findings.map((x) => x.rule))].sort();

test('a complete Standard trace passes; artifact commits are listed as artifact', () => {
  const f = fixture();
  const r = run(f);
  assert.equal(r.code, 0, r.stdout + r.stderr);
  assert.deepEqual(r.json.findings, []);
  assert.deepEqual(r.json.acs.map((a) => [a.ac, a.status]), [['AC-1', 'ok'], ['AC-2', 'ok']]);
  assert.deepEqual(r.json.commits.map((c) => c.kind), ['artifact', 'code', 'code']);
  assert.deepEqual(r.json.acs[0].tasks, ['T1']);
  assert.deepEqual(r.json.acs[0].tests, ['AT-1a']);
});

test('TR01 AC with no task, TR02 task with no AC, TR03 task cites an unknown AC', () => {
  const f = fixture({ plan: plan([['T1', 'AC-1'], ['T2', 'AC-1'], ['T3', '—'], ['T4', 'AC-9']]) });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR01', 'TR02', 'TR03']);
  assert.match(r.json.findings.find((x) => x.rule === 'TR01').message, /AC-2/);
  assert.match(r.json.findings.find((x) => x.rule === 'TR02').message, /T3/);
  assert.match(r.json.findings.find((x) => x.rule === 'TR03').message, /T4.*AC-9/);
});

test('TR04 AC with no code commit; an artifact commit citing the AC does not count', () => {
  const f = fixture({ commits: [['src/T1.js', 'feat: one\n\nRefs: T1 AC-1']] });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR04']);
  assert.match(r.json.findings[0].message, /AC-2/);
});

test('a commit naming only its task covers the task ACs', () => {
  const f = fixture({ commits: [['src/T1.js', 'feat: one [T1]'], ['src/T2.js', 'feat: two\n\nRefs: T2']] });
  assert.equal(run(f).code, 0);
});

test('TR05 code commit with no task; docs commit touching only method artifacts is exempt; merge commits are skipped', () => {
  const f = fixture();
  write(f.repo, `${SPEC}/review.md`, 'notes\n');
  commit(f.repo, 'docs: review record');
  sh(f.repo, 'checkout', '-q', 'main');
  write(f.repo, 'other.txt', 'main moved\n');
  commit(f.repo, 'chore: unrelated main change');
  sh(f.repo, 'checkout', '-q', 'feat/001-x');
  sh(f.repo, 'merge', '-q', '--no-edit', 'main');
  assert.equal(run(f).code, 0, 'artifact commit and merge commit are not orphans');

  write(f.repo, 'src/extra.js', 'x\n');
  commit(f.repo, 'feat: extra');
  write(f.repo, 'src/docs-but-code.js', 'x\n');
  commit(f.repo, 'docs: touches code\n\nRefs: AC-1');
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR05']);
  assert.equal(r.json.findings.length, 2);
});

test('TR06 commit cites an unknown task or AC', () => {
  const f = fixture({ commits: [['src/T1.js', 'feat: one\n\nRefs: T1 AC-1 AC-7'], ['src/T2.js', 'feat: two\n\nRefs: T2 T9 AC-2']] });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR06']);
  assert.equal(r.json.findings.length, 2);
});

test('TR07 AC with no test, TR08 test mapped to an unknown AC, TR09 test name without its AC ID', () => {
  const f = fixture({
    tests: tests([['AC-1', 'AT-1a', 'AC-1 exports the rows'], ['AC-9', 'AT-9a', 'AC-9 ghost'], ['AC-1', 'AT-1b', 'AC-10 wrong id'], ['AC-1', 'AT-1c', 'exports AC-1 late']]),
  });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR07', 'TR08', 'TR09']);
  assert.match(r.json.findings.find((x) => x.rule === 'TR07').message, /AC-2/);
  assert.equal(r.json.findings.filter((x) => x.rule === 'TR09').length, 2, 'AC-10 is not AC-1; Standard names start with the AC ID');
});

test('TR10 AC missing from the PR Trace table, marked orphan, or unknown there', () => {
  const f = fixture({ pr: prBody([['AC-1', 'orphan: no test'], ['AC-5', 'ok']]) });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR10']);
  assert.equal(r.json.findings.length, 3);
  const tmpl = run(fixture({ pr: readFileSync(join(HERE, '..', '..', 'templates', 'pr-body.md'), 'utf8') }));
  assert.deepEqual(rules(tmpl), ['TR10'], 'an unfilled template Trace table is not a trace');
});

test('the PR segment is not reached without --pr or review.md; review.md is read when present', () => {
  const f = fixture({ pr: prBody([['AC-1', 'ok']]) });
  const r = exec([f.dir, '--base', 'main', '--today', TODAY], f.repo);
  assert.equal(r.code, 0);
  assert.equal(r.json.segments.pr, 'not-reached');
  write(f.repo, `${SPEC}/review.md`, prBody([['AC-1', 'ok']]));
  const r2 = exec([f.dir, '--base', 'main', '--today', TODAY], f.repo);
  assert.equal(r2.code, 1);
  assert.deepEqual(rules(r2), ['TR10']);
});

test('stage-aware: a spec and plan with no code commit yet passes with segments not reached', () => {
  const repo = makeRepo('trace-early');
  write(repo, `${SPEC}/spec.md`, spec());
  commit(repo, 'docs: spec');
  sh(repo, 'checkout', '-q', '-b', 'feat/001-x');
  write(repo, `${SPEC}/plan.md`, plan());
  commit(repo, 'docs: plan\n\nRefs: AC-1 AC-2');
  const r = exec([join(repo, SPEC), '--base', 'main', '--today', TODAY], repo);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(r.json.segments.commits, 'not-reached');
  assert.equal(r.json.segments.tests, 'not-reached');
  assert.equal(r.json.segments.tasks, 'checked');
});

test('code commits without a plan fail every AC (Build before Design)', () => {
  const f = fixture({ plan: false });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('TR01'));
});

test('TR11 AC missing from release notes once they exist', () => {
  const f = fixture();
  write(f.repo, `${SPEC}/release-notes.md`, '# Release notes\n\n## Shipped acceptance criteria\n\n| AC | Title | Critical | Evidence | Fingerprint | Result |\n|---|---|---|---|---|---|\n| AC-1 | t | no | e | `aaaaaaaaaaaa` | PASS |\n| AC-8 | t | no | e | `aaaaaaaaaaaa` | PASS |\n');
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR11']);
  assert.equal(r.json.findings.length, 2, 'AC-2 missing and AC-8 unknown');
});

const released = (date) => '# Release notes\n\n## Shipped acceptance criteria\n\n| AC | Title | Critical | Evidence | Fingerprint | Result |\n|---|---|---|---|---|---|\n' +
  '| AC-1 | t | no | e | `aaaaaaaaaaaa` | PASS |\n| AC-2 | t | no | e | `aaaaaaaaaaaa` | PASS |\n\n## Approval\n\n' +
  '| Sign-off | Bound to (tag · rehearsal) | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |\n|---|---|---|---|---|---|---|---|---|\n' +
  `| Release | \`v1.0.0\` | ${date} | Release Owner | P. Nair | "Yes, release." | all | none | approved |\n\n## Deploy log\n\n` +
  '| Stage | Start (ISO) | End (ISO) | Command | Error rate | p95 | Alert | Decision |\n|---|---|---|---|---|---|---|---|\n' +
  `| 1 | ${date}T10:00:00Z | ${date}T11:00:00Z | \`flag on\` | 0.1% | 300 ms | silent | closed |\n`;
const ops = (readAt, result = 'open — watching') => '# Ops record — 001-x\n\n**Release:** v1.0.0 · **Release date:** 2026-11-01\n\n## Indicator readings\n\n' +
  '| Read at (UTC) | Indicator | Reading (window) | Baseline | Target | Source | PM verdict |\n|---|---|---|---|---|---|---|\n' +
  (readAt ? `| ${readAt}T10:00Z | exports | 120 | 0 | 100 | query | met |\n` : '| <YYYY-MM-DDTHH:MMZ> | <name> | <value> | <b> | <t> | <q> | <v> |\n') +
  `\n## Watch period result\n\n| Item | Value |\n|---|---|\n| Result | ${result} |\n`;

test('TR12 ops reading: missing 14 days after release, stale while the watch is open, unchecked once closed', () => {
  const f = fixture();
  write(f.repo, `${SPEC}/release-notes.md`, released('2026-11-01'));
  let r = run(f);
  assert.deepEqual(rules(r), ['TR12'], 'no ops.md 26 days after release');
  assert.equal(exec([f.dir, '--base', 'main', '--pr', f.pr, '--today', '2026-11-10'], f.repo).code, 0, 'within 14 days: not due yet');
  write(f.repo, `${SPEC}/ops.md`, ops(null));
  assert.deepEqual(rules(run(f)), ['TR12'], 'ops.md with no reading');
  write(f.repo, `${SPEC}/ops.md`, ops('2026-11-20'));
  assert.equal(run(f).code, 0, 'fresh reading');
  write(f.repo, `${SPEC}/ops.md`, ops('2026-11-05'));
  r = run(f);
  assert.deepEqual(rules(r), ['TR12'], 'reading 22 days old with the watch open');
  write(f.repo, `${SPEC}/ops.md`, ops('2026-11-05', 'closed clean'));
  assert.equal(run(f).code, 0, 'watch period closed: age no longer checked');
});

test('TR13 filter without a non-digit lookahead, TR14 filter not anchored on Standard', () => {
  const f = fixture({ tests: tests(undefined, (ac) => `\`npx vitest run test/x.test.js -t "${ac}"\``) });
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR13', 'TR14']);
  assert.match(r.json.findings.find((x) => x.rule === 'TR13').message, /AC-10|AC-20|0 tests/);
  const g = fixture({ tests: tests(undefined, (ac) => `\`npx vitest run test/x.test.js -t "${ac}(?!\\d)"\``) });
  assert.deepEqual(rules(run(g)), ['TR14'], 'lookahead present, anchor missing');
});

test('TR15 a green evidence row whose output shows 0 tests; a real count passes', () => {
  const f = fixture();
  const row = (tail, cmd = 'node --test --test-name-pattern="^AC-1(?![0-9])" test/x.test.js') => JSON.stringify({ v: 1, name: cmd, cmd, acs: ['AC-1'], exit: 0, tail, fingerprint: 'aaaaaaaaaaaa' });
  write(f.repo, '.agentic-sdlc/evidence/ledger.jsonl', row('# tests 12\n# pass 12\n# fail 0') + '\n');
  assert.equal(run(f).code, 0, 'tests 12 and fail 0 are not a zero-test run');
  write(f.repo, '.agentic-sdlc/evidence/ledger.jsonl', row('# tests 12') + '\n' + row('# tests 0\n# pass 0') + '\n');
  const r = run(f);
  assert.equal(r.code, 1);
  assert.deepEqual(rules(r), ['TR15']);
  for (const tail of ['0 passing (2ms)', 'No test files found, exiting with code 0', 'collected 0 items']) {
    write(f.repo, '.agentic-sdlc/evidence/ledger.jsonl', row(tail) + '\n');
    assert.deepEqual(rules(run(f)), ['TR15'], tail);
  }
  write(f.repo, '.agentic-sdlc/evidence/ledger.jsonl', row('# tests 3', 'npx vitest test/x.test.js -t "AC-1"') + '\n');
  assert.deepEqual(rules(run(f)), ['TR13', 'TR14'], 'the ledger command is a filter too');
});

test('ledger rows of other items (Quick #n rows, other spec files) are ignored', () => {
  const f = fixture();
  const other = (cmd, tail) => JSON.stringify({ v: 1, name: cmd, cmd, acs: ['AC-1'], exit: 0, tail, fingerprint: 'aaaaaaaaaaaa' });
  write(f.repo, '.agentic-sdlc/evidence/ledger.jsonl', [
    other('npx vitest run test/x.test.js -t "#142 AC-1(?![0-9])"', 'tests 0'),
    other('npx vitest run specs-002/test/y.test.js -t "AC-1"', 'no tests found'),
  ].join('\n') + '\n');
  const r = run(f);
  assert.equal(r.code, 0, JSON.stringify(r.json.findings));
});

test('--write writes trace.md without staling evidence (record file)', () => {
  const f = fixture();
  const before = fingerprint({ cwd: f.repo }).fingerprint;
  const r = run(f, ['--write']);
  assert.equal(r.code, 0);
  const md = readFileSync(join(f.dir, 'trace.md'), 'utf8');
  assert.match(md, /^# Trace — 001-x/m);
  assert.match(md, /\| AC-1 \| T1 \|/);
  assert.match(md, /\*\*Orphans:\*\* none/);
  assert.equal(fingerprint({ cwd: f.repo }).fingerprint, before, 'trace.md never changes the fingerprint');
  const bad = fixture({ commits: [['src/T1.js', 'feat: one\n\nRefs: T1 AC-1']] });
  assert.equal(run(bad, ['--write']).code, 1, 'written even when failing');
  assert.match(readFileSync(join(bad.dir, 'trace.md'), 'utf8'), /TR04/);
});

test('text output lists the matrix and a Result line', () => {
  const f = fixture();
  const r = spawnSync(process.execPath, [SCRIPT, f.dir, '--base', 'main', '--pr', f.pr, '--today', TODAY], { encoding: 'utf8', cwd: f.repo });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /AC-1 .*ok/);
  assert.match(r.stdout, /Result: PASS/);
});

test('exit 2 on missing or unparsable input', () => {
  const f = fixture();
  assert.equal(exec([join(f.repo, 'specs/009-none'), '--base', 'main'], f.repo).code, 2, 'missing folder');
  assert.equal(exec([], f.repo).code, 2, 'no folder');
  assert.equal(exec([f.dir, '--base', 'main', '--pr', join(f.repo, 'nope.md')], f.repo).code, 2, 'missing --pr file');
  assert.equal(exec([f.dir, '--base', 'no-such-branch'], f.repo).code, 2, 'unknown base');
  assert.equal(exec([f.dir, '--base', 'main', '--today', '27/11/2026'], f.repo).code, 2, 'bad --today');
  write(f.repo, `${SPEC}/spec.md`, '# Spec\n\nNo criteria.\n');
  assert.equal(exec([f.dir, '--base', 'main'], f.repo).code, 2, 'spec without AC IDs');
  const plain = makeDir('trace-plain');
  write(plain, `${SPEC}/spec.md`, spec());
  assert.equal(exec([join(plain, SPEC)], plain, { ...process.env, GIT_CEILING_DIRECTORIES: dirname(plain) }).code, 2, 'not a git repository');
});

test('--help exits 0', () => {
  const r = spawnSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /TR01/);
});

// The worked example has no git history here: replay its 8 commits (pr-body "Commits on") in a .work repo.
function workedExample() {
  const repo = makeRepo('trace-worked');
  const dir = join(repo, 'specs', '001-csv-export');
  cpSync(EXAMPLE, dir, { recursive: true });
  commit(repo, 'docs: 001-csv-export spec, plan and acceptance tests');
  sh(repo, 'checkout', '-q', '-b', 'feat/001-csv-export');
  const files = {
    T1: ['server/src/export/csv.ts', 'server/test/export/csv.test.ts'],
    T2: ['server/src/auth/permissions.ts', 'server/test/auth/permissions.test.ts'],
    T3: ['server/src/routes/reports/export.ts', 'server/test/routes/reports/export.test.ts'],
    T4: ['server/src/export/csv.ts'],
    T5: ['web/src/reports/ExportButton.tsx', 'web/src/api/reports.ts'],
  };
  const replay = [
    ['T1', 'feat(export): CSV serializer with formula escaping', 'T1 AC-2'],
    ['T2', 'feat(auth): reports:export permission', 'T2 AC-3'],
    ['T3', 'feat(reports): CSV export route with 50,000-row limit', 'T3 AC-1 AC-4'],
    ['T4', 'feat(export): fixed CSV columns, ISO dates, 2-decimal totals', 'T4 AC-1'],
    ['T5', 'feat(reports-web): Export CSV button', 'T5 AC-1'],
    ['T3', 'fix(reports): F-1', 'T3'],
    ['T3', 'fix(reports): F-2', 'T3 AC-4'],
    ['T2', 'fix(auth): F-3', 'T2 AC-3'],
  ];
  replay.forEach(([task, subject, refs], i) => {
    for (const p of files[task]) write(repo, p, `// ${subject} ${i}\n`);
    commit(repo, `${subject}\n\nRefs: ${refs}`);
  });
  return { repo, dir };
}

test('the worked example traces clean on its replayed history, and its ops reading falls due', () => {
  const { repo, dir } = workedExample();
  const args = [dir, '--base', 'main', '--pr', join(dir, 'pr-body.md')];
  const r = exec([...args, '--today', '2026-12-07'], repo);
  assert.equal(r.code, 0, JSON.stringify(r.json?.findings, null, 2) + r.stderr);
  assert.deepEqual(r.json.acs.map((a) => a.status), ['ok', 'ok', 'ok', 'ok']);
  assert.equal(r.json.segments.release, 'checked');
  const late = exec([...args, '--today', '2026-12-20'], repo);
  assert.equal(late.code, 1, 'released 2026-11-30, no ops.md 20 days later');
  assert.deepEqual(rules(late), ['TR12']);
  assert.equal(existsSync(join(dir, 'trace.md')), false, 'no --write, no file');
});
