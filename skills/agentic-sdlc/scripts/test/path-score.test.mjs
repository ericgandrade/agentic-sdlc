import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { score, countFiles, parseCodemap, componentsOf, parseRisk } from '../path-score.mjs';
import { extractFencedBlocks, findSection, parseTables, tableToObjects } from '../lib/md.mjs';
import { makeDir, makeRepo, write, commit, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'path-score.mjs');
const SKILL = join(HERE, '..', '..');
const EXAMPLES = join(SKILL, 'examples', 'paths');
const WORKED_SPEC = join(SKILL, 'examples', 'worked-example', 'specs', '001-csv-export', 'spec.md');
const WORKED_MAP = readFileSync(join(SKILL, 'examples', 'worked-example', 'codemap.md'), 'utf8');

function exec(cwd, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// Splits an example command line into argv, honouring double quotes.
function argv(line) {
  return [...line.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]);
}

const SPEC_HEADER = (path, size, risk) => `# Spec: demo

| Field | Value |
|---|---|
| ID | 001-demo |
| Revision | 1 |
| Path | ${path} |
| Size | ${size} |
| Risk | ${risk} |
| Owner | Product Owner · A. Example |
| Issue | #1 |
| Intake | n/a — none found |

## Problem

Text.
`;

// ---- rubric -----------------------------------------------------------------------------------

test('bands and routes: Quick bug, Standard feature, risk beats size', () => {
  assert.equal(score({ files: 2, components: 1, iterations: 1, triggers: [] }).line, 'Path: Quick · S=3 · R=0');
  assert.equal(score({ files: 5, components: 2, iterations: 1, triggers: ['money'] }).line, 'Path: Standard · S=5 · R=1 (money)');
  assert.equal(score({ files: 2, components: 1, iterations: 1, triggers: ['auth'] }).line, 'Path: Standard · S=3 · R=1 (auth)');
  const big = score({ files: 16, components: 3, iterations: 1, triggers: [] });
  assert.equal(big.S, 7);
  assert.equal(big.path, 'Full');
});

test('band edges: files 3/4/15/16, components and iterations 1/2/3', () => {
  const s = (files, components = 1, iterations = 1) => score({ files, components, iterations, triggers: [] }).S;
  assert.equal(s(3), 3);
  assert.equal(s(4), 4);
  assert.equal(s(15), 4);
  assert.equal(s(16), 5);
  assert.equal(s(1, 2, 1), 4);
  assert.equal(s(1, 3, 3), 7);
  assert.equal(s(0), 3);
});

test('Full-forcing triggers and R >= 2 route Full; triggers print in rubric order', () => {
  assert.equal(score({ files: 1, components: 1, iterations: 1, triggers: ['personal/health data'] }).path, 'Full');
  assert.equal(score({ files: 1, components: 1, iterations: 1, triggers: ['irreversible'] }).path, 'Full');
  const two = score({ files: 5, components: 2, iterations: 1, triggers: ['money', 'personal/health data'] });
  assert.equal(two.line, 'Path: Full · S=5 · R=2 (personal/health data, money)');
});

test('missing inputs default to Standard, but never below a known route', () => {
  assert.equal(score({ files: 4, triggers: [] }).line, 'Path: Standard · default: inputs missing (components, iterations)');
  assert.equal(score({ files: 1, components: 1, iterations: 1, triggers: null }).line, 'Path: Standard · default: inputs missing (risk)');
  const pd = score({ triggers: ['personal/health data'] });
  assert.equal(pd.path, 'Full');
  assert.equal(pd.line, 'Path: Full · default: inputs missing (files, components, iterations)');
  assert.equal(score({ files: 20, components: 3, iterations: 3, triggers: null }).path, 'Full');
});

test('risk parsing: aliases, none, unknown trigger is an input error', () => {
  assert.deepEqual(parseRisk('none'), []);
  assert.deepEqual(parseRisk('PII, payments'), ['personal/health data', 'money']);
  assert.deepEqual(parseRisk('schema,migration'), ['schema/migration']);
  assert.throws(() => parseRisk('vibes'), /unknown risk trigger/);
});

test('current path: route-down and file-bound escalation fail, higher path passes', () => {
  const quickFive = score({ files: 5, components: 1, iterations: 1, triggers: [] }, { current: 'Quick' });
  assert.equal(quickFive.S, 4);
  assert.equal(quickFive.sizeRoute, 'Quick');
  assert.equal(quickFive.path, 'Standard', 'the file bound routes 5 files above Quick');
  assert.equal(quickFive.ok, false);
  assert.match(quickFive.problems.join('\n'), /files 5 > 3/);
  const down = score({ files: 2, components: 1, iterations: 1, triggers: ['auth'] }, { current: 'Quick' });
  assert.equal(down.ok, false);
  assert.match(down.problems.join('\n'), /Quick is lower than the scored route Standard/);
  assert.equal(score({ files: 2, components: 1, iterations: 1, triggers: [] }, { current: 'Full' }).ok, true);
  assert.equal(score({ files: 16, components: 1, iterations: 1, triggers: [] }, { current: 'Standard' }).ok, false);
  assert.equal(score({ files: 16, components: 1, iterations: 1, triggers: [] }, { current: 'Full' }).ok, true);
});

test('a scored path never fails its own check, for any file count 0–20', () => {
  for (let files = 0; files <= 20; files++) {
    for (const components of [1, 2, 3]) {
      const first = score({ files, components, iterations: 1, triggers: [] });
      const again = score({ files, components, iterations: 1, triggers: [] }, { current: first.path });
      assert.equal(again.ok, true, `files ${files}, components ${components}: ${again.problems.join('; ')}`);
    }
  }
  assert.equal(score({ files: 16, components: 1, iterations: 1, triggers: [] }).path, 'Full');
  assert.equal(score({ files: 4, components: 1, iterations: 1, triggers: [] }).boundRoute, 'Standard');
});

test('the paths.md §2 scored examples table returns the same Path (no drift)', () => {
  const md = readFileSync(join(SKILL, 'references', 'paths.md'), 'utf8');
  const sec = findSection(md, 'Scored examples');
  assert.ok(sec, 'paths.md has a Scored examples section');
  const rows = tableToObjects(parseTables(sec.body)[0]);
  assert.ok(rows.length >= 6);
  for (const r of rows) {
    const [files, components, iterations] = r['Files · Comp. · Iter.'].split('·').map((x) => Number(x.trim()));
    const t = r.Triggers.trim();
    const triggers = parseRisk(t === '—' ? 'none' : t);
    const got = score({ files, components, iterations, triggers });
    assert.equal(got.path, r.Path.replace(/\*/g, '').trim(), r.Request);
    assert.equal(String(got.S), r.S.trim(), r.Request);
  }
});

// ---- file counting and code map -------------------------------------------------------------------

test('file counting excludes lockfiles, method records and code-map exclusions', () => {
  const files = [
    'src/a.js', 'src/a.test.js', 'package-lock.json', 'web/yarn.lock', 'specs/001-x/spec.md',
    'docs/codemap.md', '.agentic-sdlc/evidence/ledger.jsonl', 'README.md', 'web/dist/app.js', 'db/migrations/001.sql',
  ];
  const r = countFiles(files, { excluded: ['web/dist/'] });
  assert.deepEqual(r.counted, ['src/a.js', 'src/a.test.js', 'db/migrations/001.sql']);
  assert.equal(r.excluded.length, 7);
});

test('code map: components are the distinct deploy units of the touched modules', () => {
  const map = parseCodemap(WORKED_MAP);
  assert.equal(map.modules.length, 6);
  assert.deepEqual(map.excluded, ['docs/', 'specs/', 'web/dist/']);
  const c = componentsOf(['server/src/export/csv.js', 'server/src/routes/reports/index.js', 'web/src/reports/Export.tsx', 'tools/x.sh'], map);
  assert.deepEqual(c.units, ['api', 'web']);
  assert.deepEqual(c.unmapped, ['tools/x.sh']);
});

// ---- CLI --------------------------------------------------------------------------------------

test('CLI prints the score line, --json carries the fields, --help exits 0', () => {
  const dir = makeDir('ps');
  const r = exec(dir, '--files', '2', '--components', '1', '--iterations', '1', '--risk', 'none');
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.stdout.split('\n')[0], 'Path: Quick · S=3 · R=0');
  const j = exec(dir, '--files', '5', '--components', '2', '--iterations', '1', '--risk', 'money', '--json');
  const out = JSON.parse(j.stdout);
  assert.equal(out.line, 'Path: Standard · S=5 · R=1 (money)');
  assert.equal(out.path, 'Standard');
  assert.equal(out.sizeRoute, 'Standard');
  assert.equal(out.riskRoute, 'Standard');
  assert.equal(exec(dir, '--help').code, 0);
});

test('CLI --files accepts a comma list and applies the file definition', () => {
  const dir = makeDir('ps');
  const r = exec(dir, '--files', 'src/a.js,src/b.js,package-lock.json,docs/x.md', '--components', '1', '--iterations', '1', '--risk', 'none', '--json');
  assert.equal(JSON.parse(r.stdout).files, 2);
});

test('CLI bad input exits 2', () => {
  const dir = makeDir('ps');
  assert.equal(exec(dir, '--files', '2', '--components', 'x', '--iterations', '1', '--risk', 'none').code, 2);
  assert.equal(exec(dir, '--files', '2', '--components', '1', '--iterations', '1', '--risk', 'vibes').code, 2);
  assert.equal(exec(dir, '--files', '2', '--components', '0', '--iterations', '1', '--risk', 'none').code, 2);
  assert.equal(exec(dir, '--risk', 'none', '--path', 'Medium').code, 2);
  assert.equal(exec(dir, '--diff', 'main', '--risk', 'none').code, 2);
  assert.equal(exec(dir, '--from-spec', 'specs/404/spec.md').code, 2);
});

test('CLI --path fails with exit 1 on route-down and on file-bound escalation', () => {
  const dir = makeDir('ps');
  const down = exec(dir, '--files', '2', '--components', '1', '--iterations', '1', '--risk', 'auth', '--path', 'Quick');
  assert.equal(down.code, 1);
  assert.match(down.stdout, /never route down/);
  const esc = exec(dir, '--files', '5', '--components', '1', '--iterations', '1', '--risk', 'none', '--path', 'Quick');
  assert.equal(esc.code, 1);
  assert.match(esc.stdout, /ESCALATE/);
  const missing = exec(dir, '--files', '2', '--path', 'Quick');
  assert.equal(missing.code, 1, 'missing inputs default to Standard, above Quick');
  assert.equal(exec(dir, '--files', '2', '--components', '1', '--iterations', '1', '--risk', 'none', '--path', 'Standard').code, 0);
});

test('CLI --from-spec re-computes from the header and guards route-down', () => {
  assert.equal(exec(SKILL, '--from-spec', WORKED_SPEC).code, 0);
  const dir = makeDir('ps');
  write(dir, 'specs/001-demo/spec.md', SPEC_HEADER('Quick', 'S=5 · files 2 + components 2 + iterations 1', 'R=1 · money'));
  const r = exec(dir, '--from-spec', 'specs/001-demo/spec.md');
  assert.equal(r.code, 1);
  assert.equal(r.stdout.split('\n')[0], 'Path: Standard · S=5 · R=1 (money)');
  write(dir, 'specs/002-demo/spec.md', SPEC_HEADER('Full', 'S=3 · files 1 + components 1 + iterations 1', 'R=0 · none'));
  assert.equal(exec(dir, '--from-spec', 'specs/002-demo/spec.md').code, 0);
  write(dir, 'specs/003-demo/spec.md', '# no header\n');
  assert.equal(exec(dir, '--from-spec', 'specs/003-demo/spec.md').code, 2);
});

test('CLI --diff counts committed, uncommitted and untracked files and reads components from the code map', () => {
  const repo = makeRepo('ps');
  write(repo, 'server/src/export/csv.js', 'a\n');
  write(repo, 'docs/codemap.md', WORKED_MAP);
  commit(repo, 'base');
  const base = 'main';
  spawnSync('git', ['checkout', '-q', '-b', 'feat'], { cwd: repo });
  write(repo, 'server/src/export/csv.js', 'b\n');
  write(repo, 'server/test/export/csv.test.js', 't\n');
  commit(repo, 'change');
  write(repo, 'server/src/export/json.js', 'u\n'); // untracked
  write(repo, 'specs/001-x/spec.md', SPEC_HEADER('Quick', 'S=3 · files 1 + components 1 + iterations 1', 'R=0 · none'));
  const ok = exec(repo, '--diff', base, '--from-spec', 'specs/001-x/spec.md', '--json');
  const j = JSON.parse(ok.stdout);
  assert.equal(j.files, 3, JSON.stringify(j));
  assert.equal(j.components, 1);
  assert.equal(ok.code, 0, ok.stdout);
  write(repo, 'web/src/reports/Export.tsx', 'w\n');
  const esc = exec(repo, '--diff', base, '--from-spec', 'specs/001-x/spec.md');
  assert.equal(esc.code, 1, esc.stdout);
  assert.match(esc.stdout, /ESCALATE files 4 > 3/);
  assert.match(esc.stdout, /^Path: Standard · S=5 · R=0/m, 'files 2 + components 2 + iterations 1');
  const quick = exec(repo, '--diff', base, '--path', 'Quick', '--iterations', '1', '--risk', 'none');
  assert.equal(quick.code, 1);
});

test('CLI --diff without a code map takes --components and passes a small Quick change', () => {
  const repo = makeRepo('ps');
  write(repo, 'src/a.js', 'a\n');
  commit(repo, 'base');
  spawnSync('git', ['checkout', '-q', '-b', 'feat'], { cwd: repo });
  write(repo, 'src/a.js', 'b\n');
  write(repo, 'src/a.test.js', 't\n');
  const args = ['--diff', 'main', '--path', 'Quick', '--iterations', '1', '--risk', 'none'];
  const ok = exec(repo, ...args, '--components', '1');
  assert.equal(ok.code, 0, ok.stdout + ok.stderr);
  assert.equal(ok.stdout.split('\n')[0], 'Path: Quick · S=3 · R=0');
  assert.match(ok.stdout, /no docs\/codemap\.md/);
  assert.equal(exec(repo, ...args).code, 1, 'components unknown → Standard default → above Quick');
});

// ---- examples/paths -------------------------------------------------------------------------------

const examples = readdirSync(EXAMPLES).filter((f) => f.endsWith('.md') && f !== 'README.md');

test('examples/paths holds at least 4 worked cases, each with a path-score block', () => {
  assert.ok(examples.length >= 4, `found ${examples.length}`);
  for (const f of examples) {
    const blocks = extractFencedBlocks(readFileSync(join(EXAMPLES, f), 'utf8'), { info: 'path-score' });
    assert.ok(blocks.length >= 1, `${f} has no \`\`\`path-score block`);
  }
});

for (const f of examples) {
  test(`example ${f}: path-score prints the expected score line and exit code`, () => {
    const md = readFileSync(join(EXAMPLES, f), 'utf8');
    for (const b of extractFencedBlocks(md, { info: 'path-score' })) {
      const [cmd, expected, exit] = b.content.split('\n').map((l) => l.trim()).filter(Boolean);
      const m = cmd.match(/path-score\.mjs\s+(.*)$/);
      assert.ok(m, `${f}: first line must run path-score.mjs`);
      assert.match(exit, /^exit \d$/, `${f}: third line must be "exit N"`);
      const r = exec(SKILL, ...argv(m[1]));
      assert.equal(r.stdout.split('\n')[0], expected, `${f}: ${cmd}`);
      assert.equal(r.code, Number(exit.slice(5)), `${f}: ${cmd}\n${r.stdout}${r.stderr}`);
    }
  });
}

test('the Quick example states the evidence, review and trace Quick still keeps', () => {
  const quick = examples.find((f) => /quick/i.test(f));
  assert.ok(quick, 'an example file named *quick*');
  const md = readFileSync(join(EXAMPLES, quick), 'utf8');
  for (const h of ['Evidence', 'Review', 'Trace']) assert.match(md, new RegExp(`^#+ .*${h}`, 'm'), `${quick} lacks a ${h} heading`);
  assert.match(md, /Refs: AC-1/);
  assert.match(md, /## Verification/);
  assert.match(md, /L1/);
});
