import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from '../lib/git.mjs';
import { makeDir, makeRepo, write, commit, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'audit-export.mjs');
const EXAMPLE = join(HERE, '..', '..', 'examples', 'worked-example', 'specs', '001-csv-export');
const HEADER = 'record,stage,status,role,person,words,rev,hash,hash_valid,time,path,sha256,ssdf';

function exec(cwd, args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args, '--today', '2026-11-27', '--json'], { cwd, encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr, json: r.stdout ? JSON.parse(r.stdout) : null };
}

// A copy of the worked example inside a temporary repository.
function repo() {
  const dir = makeRepo('audit');
  cpSync(EXAMPLE, join(dir, 'specs', '001-csv-export'), { recursive: true });
  write(dir, 'src/a.js', 'export const a = 1;\n');
  commit(dir, 'init');
  return dir;
}

test('writes the JSON and CSV bundle with sign-offs, artifacts, hashes and SSDF tags', () => {
  const dir = repo();
  const r = exec(dir, ['specs/001-csv-export']);
  assert.equal(r.code, 0, r.out + r.err);
  const jsonPath = join(dir, '.agentic-sdlc/audit/audit-001-csv-export.json');
  const csvPath = join(dir, '.agentic-sdlc/audit/audit-001-csv-export.csv');
  assert.ok(existsSync(jsonPath) && existsSync(csvPath));
  const b = JSON.parse(readFileSync(jsonPath, 'utf8'));
  assert.equal(b.spec, '001-csv-export');
  assert.equal(b.status, 'passed');
  assert.equal(b.approvalCheck.ok, true);
  const specify = b.signOffs.find((s) => s.stage === 'Specify');
  for (const k of ['stage', 'role', 'person', 'words', 'rev', 'hash', 'hashValid', 'time', 'ssdf']) assert.ok(k in specify, k);
  assert.equal(specify.hash, '6b4c7f329c93');
  assert.equal(specify.hashValid, true);
  assert.deepEqual(specify.ssdf, ['PO.1', 'PW.1']);
  assert.deepEqual(b.signOffs.find((s) => s.stage === 'Release').ssdf, ['PS.2', 'PS.3']);
  const files = readdirSync(join(dir, 'specs/001-csv-export')).sort();
  assert.deepEqual(b.artifacts.map((a) => a.path), files.map((f) => `specs/001-csv-export/${f}`));
  for (const a of b.artifacts) {
    const sha = createHash('sha256').update(readFileSync(join(dir, a.path))).digest('hex');
    assert.equal(a.sha256, sha, a.path);
  }
});

test('CSV header is stable and the CSV is byte-identical across runs', () => {
  const dir = repo();
  exec(dir, ['specs/001-csv-export', '--out', 'out']);
  const first = readFileSync(join(dir, 'out/audit-001-csv-export.csv'), 'utf8');
  assert.equal(first.split('\n')[0], HEADER);
  assert.match(first, /\nsign-off,Specify,valid,Product Owner,L\. Rocha,Yes — approved: spec rev 1 and plan rev 1 as presented\.,1,6b4c7f329c93,true,2026-11-23 14:40,specs\/001-csv-export\/spec\.md,,PO\.1 PW\.1\n/);
  assert.match(first, /\nartifact,,,,,,,,,,specs\/001-csv-export\/spec\.md,[0-9a-f]{64},PO\.1 PW\.1\n/);
  exec(dir, ['specs/001-csv-export', '--out', 'out']);
  assert.equal(readFileSync(join(dir, 'out/audit-001-csv-export.csv'), 'utf8'), first);
});

test('failing approvals: exit 1, bundle still written and marked failed', () => {
  const dir = repo();
  const spec = join(dir, 'specs/001-csv-export/spec.md');
  writeFileSync(spec, readFileSync(spec, 'utf8').replace('## Problem\n', '## Problem\n\nEdited after approval.\n'));
  const r = exec(dir, ['specs/001-csv-export']);
  assert.equal(r.code, 1);
  const b = JSON.parse(readFileSync(join(dir, '.agentic-sdlc/audit/audit-001-csv-export.json'), 'utf8'));
  assert.equal(b.status, 'failed');
  assert.ok(b.approvalCheck.findings.some((f) => f.rule === 'SO06'));
  assert.equal(b.signOffs.find((s) => s.stage === 'Specify').hashValid, false);
});

test('writing the bundle does not change the evidence fingerprint', () => {
  const dir = repo();
  const before = fingerprint({ cwd: dir }).short;
  assert.equal(exec(dir, ['specs/001-csv-export']).code, 0);
  assert.equal(fingerprint({ cwd: dir }).short, before);
});

test('missing input exits 2; --help exits 0', () => {
  const dir = makeDir('audit-empty');
  assert.equal(exec(dir, []).code, 2);
  assert.equal(exec(dir, ['specs/404-none']).code, 2);
  const help = spawnSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage/);
});
