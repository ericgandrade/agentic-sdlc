import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runDoctor } from '../doctor.mjs';
import { fingerprint } from '../lib/git.mjs';
import { makeDir, makeRepo, write, commit, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'doctor.mjs');
const TODAY = new Date('2026-12-01T12:00:00Z');

// A directory of fake executables, used as the whole PATH so results never depend on this machine.
function fakeBin(...programs) {
  const dir = makeDir('fakebin');
  for (const p of programs) {
    write(dir, p, '#!/bin/sh\nexit 0\n');
    chmodSync(join(dir, p), 0o755);
  }
  return dir;
}

const block = ({ enforcement = 'Enforcement: prompt-only · permissions: prompt-only', dod = 'lint: npm run lint\ntest: npm test\ntypecheck: n/a — plain JavaScript' } = {}) =>
  `# Project\n<!-- AGENTIC-SDLC:BEGIN -->\n## Agentic SDLC\n- ${enforcement}\n\n## Definition of Done\n\`\`\`sdlc-dod\n${dod}\n\`\`\`\n<!-- AGENTIC-SDLC:END -->\n`;

// A healthy Node project unless overridden: block, vendored scripts with matching sums, no extensions.
function project({ agents = block(), vendored = true, extra = {} } = {}) {
  const dir = makeRepo('doctor');
  if (agents !== null) write(dir, 'AGENTS.md', agents);
  if (vendored) {
    const files = { 'spec-lint.mjs': 'export {};\n', 'lib/cli.mjs': 'export {};\n' };
    for (const [rel, c] of Object.entries(files)) write(dir, `.agentic-sdlc/bin/${rel}`, c);
    const sums = Object.entries(files).map(([rel, c]) => `${createHash('sha256').update(c).digest('hex')}  ${rel}`).join('\n');
    write(dir, '.agentic-sdlc/bin/SHA256SUMS', sums + '\n');
  }
  for (const [rel, c] of Object.entries(extra)) write(dir, rel, c);
  return dir;
}

const NODE_PATH = () => ({ PATH: fakeBin('npm') });
const check = (r, id) => r.checks.find((c) => c.id === id);
const doctor = (cwd, opts = {}) => runDoctor({ cwd, env: NODE_PATH(), today: TODAY, nodeVersion: '18.19.0', ...opts });

test('a healthy Node project passes every check and reports prompt-only enforcement without host config', () => {
  const r = doctor(project());
  assert.deepEqual(r.checks.filter((c) => c.status === 'fail'), []);
  assert.equal(r.ok, true);
  assert.equal(r.enforcement, 'prompt-only');
  assert.deepEqual(r.checks.map((c) => c.id), ['node', 'vendored', 'dod-block', 'dod-commands', 'codemap', 'enforcement', 'extensions']);
  for (const c of r.checks) assert.ok(c.fix !== undefined, `${c.id} carries a fix command field`);
});

test('check 1: Node below 18 fails', () => {
  assert.equal(check(doctor(project(), { nodeVersion: '16.20.0' }), 'node').status, 'fail');
  assert.equal(check(doctor(project(), { nodeVersion: '20.1.0' }), 'node').status, 'ok');
});

test('check 2: vendored scripts must match SHA256SUMS; not vendored is a warning', () => {
  const dir = project();
  write(dir, '.agentic-sdlc/bin/spec-lint.mjs', 'process.exit(0);\n');
  const c = check(doctor(dir), 'vendored');
  assert.equal(c.status, 'fail');
  assert.match(c.detail, /spec-lint\.mjs/);
  assert.match(c.fix, /vendor/);
  assert.equal(check(doctor(project({ vendored: false })), 'vendored').status, 'warn');
});

test('check 3: a missing or unparsable sdlc-dod block fails', () => {
  assert.equal(check(doctor(project({ agents: '# Project\n' })), 'dod-block').status, 'fail');
  assert.equal(check(doctor(project({ agents: block({ dod: 'not a key value line' }) })), 'dod-block').status, 'fail');
  assert.equal(check(doctor(project()), 'dod-block').status, 'ok');
});

test('check 4: each DoD command must resolve on the PATH; n/a keys are skipped', () => {
  const dir = project({ agents: block({ dod: 'test: pytest -q\nlint: npm run lint' }) });
  const c = check(doctor(dir), 'dod-commands');
  assert.equal(c.status, 'fail');
  assert.match(c.detail, /pytest/);
  assert.equal(check(doctor(dir, { env: { PATH: fakeBin('npm', 'pytest') } }), 'dod-commands').status, 'ok');
  // A relative program path resolves against the repository.
  const local = project({ agents: block({ dod: 'test: ./gradlew test' }), extra: { gradlew: '#!/bin/sh\n' } });
  assert.equal(check(doctor(local), 'dod-commands').status, 'ok');
});

test('check 5: a brownfield code map older than 90 days warns; a fresh one passes; greenfield is skipped', () => {
  const map = (d) => `# Code map\n\n\`\`\`sdlc-codemap\nversion: 1\nverified: ${d} at 3f9c2a7d1e04\n\`\`\`\n`;
  const adopted = { '.agentic-sdlc/adoption.md': '# Adoption\n' };
  assert.equal(check(doctor(project({ extra: { ...adopted, 'docs/codemap.md': map('2026-08-01') } })), 'codemap').status, 'warn');
  assert.equal(check(doctor(project({ extra: { ...adopted, 'docs/codemap.md': map('2026-11-20') } })), 'codemap').status, 'ok');
  assert.equal(check(doctor(project({ extra: adopted })), 'codemap').status, 'warn');
  assert.equal(check(doctor(project()), 'codemap').detail, 'greenfield: no adoption ledger and no code map');
});

test('check 6: the Enforcement line must match the CI and host permission files present', () => {
  const claims = block({ enforcement: 'Enforcement: branch-protection · permissions: enforced' });
  const bare = doctor(project({ agents: claims }));
  assert.equal(check(bare, 'enforcement').status, 'fail');
  assert.match(check(bare, 'enforcement').detail, /CI/);
  const real = project({
    agents: claims,
    extra: {
      '.github/workflows/agentic-sdlc.yml': 'name: agentic-sdlc\n',
      '.claude/settings.json': JSON.stringify({ permissions: { deny: ['Bash(git push:*)'] } }),
    },
  });
  const r = doctor(real);
  assert.equal(check(r, 'enforcement').status, 'ok');
  assert.equal(r.enforcement, 'enforced');
  assert.equal(r.ci, 'present');
});

test('check 7: extensions must pass ext-check', () => {
  const dir = project({ extra: { '.agentic-sdlc/extensions/x/extension.json': JSON.stringify({ name: 'x', version: '0.1.0', interface: '^9.0.0', kind: 'review-lens', entry: 'lens.md', attachesTo: 'review.lenses', sha256: 'aa' }), '.agentic-sdlc/extensions/x/lens.md': '# x\n' } });
  const c = check(doctor(dir), 'extensions');
  assert.equal(c.status, 'fail');
  assert.match(c.detail, /EX02/);
  assert.equal(check(doctor(project()), 'extensions').detail, 'extensions: 0');
});

test('a non-Node project with CI gates passes (CI runs the scripts; local enforcement is prompt-only)', () => {
  const dir = project({
    vendored: false,
    agents: block({ enforcement: 'Enforcement: branch-protection · permissions: prompt-only', dod: 'lint: ruff check .\ntest: pytest -q\ntypecheck: mypy .\ncoverage: n/a — measured in CI' }),
    extra: { '.gitlab-ci.yml': 'include: agentic-sdlc\n' },
  });
  const r = doctor(dir, { env: { PATH: fakeBin('ruff', 'pytest', 'mypy') } });
  assert.equal(r.ok, true, JSON.stringify(r.checks.filter((c) => c.status === 'fail')));
  assert.equal(r.enforcement, 'prompt-only');
  assert.equal(r.ci, 'present');
});

test('CLI: writes .agentic-sdlc/doctor.json, exits 1 on any fail, and the record never moves the fingerprint', () => {
  const dir = project();
  commit(dir, 'init');
  const before = fingerprint({ cwd: dir }).fingerprint;
  const ok = spawnSync(process.execPath, [SCRIPT, '--json'], { cwd: dir, encoding: 'utf8', env: NODE_PATH() });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  assert.ok(existsSync(join(dir, '.agentic-sdlc', 'doctor.json')));
  assert.equal(JSON.parse(readFileSync(join(dir, '.agentic-sdlc', 'doctor.json'), 'utf8')).ok, true);
  assert.equal(fingerprint({ cwd: dir }).fingerprint, before);
  const bad = project({ agents: '# none\n' });
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: bad, encoding: 'utf8', env: NODE_PATH() });
  assert.equal(r.status, 1);
  assert.match(r.stdout, /^FAIL\s+dod-block/m);
  assert.match(r.stdout, /fix: /);
});
