import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INTERFACE_VERSION, POINTS, checkExtensions, satisfies } from '../ext-check.mjs';
import { makeDir, write, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'ext-check.mjs');
const SKILL = join(HERE, '..', '..');

const sha = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const LENS = '# Lens\n\nCheck one thing.\n';

function exec(cwd, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// A core skill directory carrying every extension-point marker unless `skip` names one.
function core(skip = []) {
  const dir = makeDir('core');
  write(dir, 'SKILL.md', '# core\n');
  if (!skip.includes('review.lenses')) write(dir, 'references/review.md', '# Review\n<!-- ext:review.lenses -->\n');
  if (!skip.includes('dod.checks')) write(dir, 'references/verification.md', '# Verification\n<!-- ext:dod.checks -->\n');
  if (!skip.includes('templates')) write(dir, 'templates/README.md', '# Templates\n<!-- ext:templates -->\n');
  write(dir, 'templates/pr-body.md', '# PR\n');
  return dir;
}

// A project with one extension under .agentic-sdlc/extensions/<name>/; `manifest` overrides fields (null drops one).
function project(manifest = {}, { entry = 'lens.md', content = LENS, raw } = {}) {
  const root = makeDir('proj');
  const name = manifest.name ?? 'demo-lens';
  const base = {
    name, version: '0.1.0', interface: '^1.0.0', kind: 'review-lens',
    entry, attachesTo: 'review.lenses', sha256: sha(content ?? LENS),
  };
  const m = { ...base, ...manifest };
  for (const k of Object.keys(m)) if (m[k] === null) delete m[k];
  const dir = `.agentic-sdlc/extensions/${name}`;
  write(root, `${dir}/extension.json`, raw ?? JSON.stringify(m));
  if (content !== null) write(root, `${dir}/${entry}`, content);
  return root;
}

const rules = (r) => r.errors.map((e) => e.rule);

test('valid manifest, entry present and hash matching passes with exit 0', () => {
  const root = project();
  const r = checkExtensions({ cwd: root, core: core() });
  assert.deepEqual(r.errors, []);
  assert.equal(r.count, 1);
  assert.equal(r.extensions[0].entry, '.agentic-sdlc/extensions/demo-lens/lens.md');
  assert.equal(r.extensions[0].layer, 'project');
  const cli = exec(root, '--core', core(), '--json');
  assert.equal(cli.code, 0, cli.stdout + cli.stderr);
  assert.equal(JSON.parse(cli.stdout).interface, INTERFACE_VERSION);
});

test('EX01: interface missing or not a caret range', () => {
  assert.deepEqual(rules(checkExtensions({ cwd: project({ interface: null }), core: core() })), ['EX01']);
  assert.deepEqual(rules(checkExtensions({ cwd: project({ interface: '1.0.0' }), core: core() })), ['EX01']);
  assert.equal(exec(project({ interface: null }), '--core', core()).code, 1);
});

test('EX02: ^2.0.0 against core 1.0.0 is incompatible; caret keeps the major and needs minor.patch at least', () => {
  assert.deepEqual(rules(checkExtensions({ cwd: project({ interface: '^2.0.0' }), core: core() })), ['EX02']);
  assert.equal(satisfies('1.0.0', '^1.0.0'), true);
  assert.equal(satisfies('1.2.0', '^1.1.5'), true);
  assert.equal(satisfies('1.1.4', '^1.1.5'), false);
  assert.equal(satisfies('1.0.0', '^1.1.0'), false);
  assert.equal(satisfies('2.0.0', '^1.0.0'), false);
});

test('EX03: kind outside {review-lens, dod-check, template}', () => {
  const r = checkExtensions({ cwd: project({ kind: 'agent' }), core: core() });
  assert.deepEqual(rules(r), ['EX03']);
});

test('EX04: entry file missing, or escaping the extension folder', () => {
  assert.deepEqual(rules(checkExtensions({ cwd: project({}, { content: null }), core: core() })), ['EX04']);
  assert.deepEqual(rules(checkExtensions({ cwd: project({ entry: '../../../x.md' }, { content: null }), core: core() })), ['EX04']);
});

test('EX05: attachesTo marker absent from core files, or not matching the kind', () => {
  assert.deepEqual(rules(checkExtensions({ cwd: project(), core: core(['review.lenses']) })), ['EX05']);
  assert.deepEqual(rules(checkExtensions({ cwd: project({ attachesTo: 'dod.checks' }), core: core() })), ['EX05']);
});

test('EX06: sha256 mismatch or missing', () => {
  assert.deepEqual(rules(checkExtensions({ cwd: project({ sha256: sha('other') }), core: core() })), ['EX06']);
  assert.deepEqual(rules(checkExtensions({ cwd: project({ sha256: null }), core: core() })), ['EX06']);
  // Line endings do not change the pin: CRLF checkouts hash like LF.
  const crlf = '# Lens\r\n\r\nCheck one thing.\r\n';
  assert.deepEqual(rules(checkExtensions({ cwd: project({ sha256: sha(LENS) }, { content: crlf }), core: core() })), []);
});

test('EX07: name or version missing', () => {
  assert.deepEqual(rules(checkExtensions({ cwd: project({ version: null }), core: core() })), ['EX07']);
});

test('no .agentic-sdlc/extensions/ directory passes with extensions: 0', () => {
  const root = makeDir('empty');
  const r = exec(root, '--core', core());
  assert.equal(r.code, 0);
  assert.match(r.stdout, /extensions: 0/);
});

test('malformed JSON exits 2', () => {
  const r = exec(project({}, { raw: '{"name": ' }), '--core', core());
  assert.equal(r.code, 2);
  assert.match(r.stderr, /extension\.json/);
});

test('precedence: a project extension overrides a team extension of the same name', () => {
  const root = project();
  const teamLens = '# Team lens\n';
  write(root, 'team-ext/demo-lens/extension.json', JSON.stringify({
    name: 'demo-lens', version: '0.0.9', interface: '^1.0.0', kind: 'review-lens',
    entry: 'lens.md', attachesTo: 'review.lenses', sha256: sha(teamLens),
  }));
  write(root, 'team-ext/demo-lens/lens.md', teamLens);
  write(root, '.agentic-sdlc/config.json', JSON.stringify({ extensions: { team: 'team-ext' } }));
  const r = checkExtensions({ cwd: root, core: core() });
  assert.deepEqual(r.errors, []);
  assert.equal(r.count, 1);
  assert.equal(r.extensions[0].layer, 'project');
  assert.equal(r.extensions[0].version, '0.1.0');
  assert.deepEqual(r.extensions[0].overrides, ['team']);
});

test('precedence: a template extension named like a core template overrides the core one', () => {
  const body = '# Our PR body\n';
  const root = project({ name: 'pr-body', kind: 'template', attachesTo: 'templates', entry: 'pr-body.md', sha256: sha(body) },
    { entry: 'pr-body.md', content: body });
  const r = checkExtensions({ cwd: root, core: core() });
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.extensions[0].overrides, ['core']);
});

test('a team directory outside the repository is refused with exit 2', () => {
  const root = project();
  write(root, '.agentic-sdlc/config.json', JSON.stringify({ extensions: { team: '../elsewhere' } }));
  assert.equal(exec(root, '--core', core()).code, 2);
});

test('--point lists only the extensions attached to that point', () => {
  const root = project();
  const r = exec(root, '--core', core(), '--point', 'dod.checks', '--json');
  assert.equal(r.code, 0);
  assert.equal(JSON.parse(r.stdout).count, 0);
  assert.equal(JSON.parse(exec(root, '--core', core(), '--point', 'review.lenses', '--json').stdout).count, 1);
});

test('without a core skill directory the built-in point list is used', () => {
  const noCore = makeDir('vendored');
  const r = checkExtensions({ cwd: project(), core: noCore });
  assert.equal(r.core, 'builtin');
  assert.deepEqual(r.errors, []);
  assert.deepEqual(Object.values(POINTS).sort(), ['dod.checks', 'review.lenses', 'templates']);
});

test('the shipped core carries every marker and the shipped example extension passes', () => {
  const r = exec(SKILL, '--dir', 'examples/extensions', '--json');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.core, 'skill');
  assert.ok(out.count >= 1);
  assert.deepEqual(out.missingMarkers, []);
});

test('--help prints usage and exits 0', () => {
  const r = exec(makeDir('help'), '--help');
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Usage: node ext-check\.mjs/);
});
