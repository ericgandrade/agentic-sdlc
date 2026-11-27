import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUDGETS, checkBudgets, checkDefaultPath, countTokens } from '../budget-check.mjs';
import { InputError } from '../lib/cli.mjs';
import { makeDir, write, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'budget-check.mjs');
const SKILL = join(HERE, '..', '..');

const words = (n, w = 'word') => Array.from({ length: n }, () => w).join(' ');

function exec(...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// A skill directory whose every file is inside its budget unless overridden.
function skill(over = {}) {
  const dir = makeDir('budget');
  const files = {
    'SKILL.md': `---\nname: x\ndescription: ${words(50, 'desc')}\nlicense: MIT\n---\n# Router\n${words(1000)}\n`,
    'README.md': `# x\n\nIntro ${words(400)}\n\n## Install and first run\n\n${words(100)}\n\n## Paths\n\n${words(400)}\n`,
    'references/quickstart.md': `# Quickstart\n${words(800)}\n`,
    'references/lifecycle.md': `# Lifecycle\n${words(1500)}\n`,
    'agents/planner.md': `# Planner\n${words(400)}\n`,
    ...over,
  };
  for (const [rel, content] of Object.entries(files)) if (content !== null) write(dir, rel, content);
  return dir;
}

test('the shipped agentic-sdlc skill meets every budget', () => {
  const r = exec(SKILL, '--json');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const out = JSON.parse(r.stdout);
  assert.equal(out.over, 0);
  const router = out.checks.find((c) => c.kind === 'router');
  assert.ok(router.words <= BUDGETS.router, `router ${router.words} words`);
  assert.ok(out.firstPath.words <= BUDGETS.firstPath);
});

test('counts tokens outside the leading frontmatter, including fenced code and table cells', () => {
  assert.equal(countTokens('---\nname: a b c\n---\none two\n```\nthree four\n```\n| a | b |\n'), 11);
  assert.equal(countTokens('no frontmatter\n\n---\nafter rule\n'), 5);
});

test('passes and reports per-file rows plus the first-path total', () => {
  const r = checkBudgets(skill());
  assert.equal(r.over, 0);
  assert.deepEqual(r.checks.map((c) => c.kind), ['readme-install', 'quickstart', 'router', 'reference', 'agent']);
  const install = r.checks[0];
  assert.equal(install.words, 105); // "##", "Install", "and", "first", "run" + 100 words; other sections excluded
  assert.equal(r.firstPath.words, 105 + 802 + 1002);
});

test('router over 2,200 words fails with exit 1', () => {
  const dir = skill({ 'SKILL.md': `---\nname: x\n---\n${words(2201)}\n` });
  const r = exec(dir, '--json');
  assert.equal(r.code, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.checks.find((c) => c.kind === 'router').status, 'FAIL');
});

test('a router inside the budget but at >= 95% warns and still passes', () => {
  const dir = skill({ 'SKILL.md': `${words(2150)}\n` });
  const r = exec(dir);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /^WARN\s+router/m);
});

test('quickstart over 1,200 and README install over 300 each fail', () => {
  const r1 = checkBudgets(skill({ 'references/quickstart.md': words(1201) }));
  assert.equal(r1.checks.find((c) => c.kind === 'quickstart').status, 'FAIL');
  const r2 = checkBudgets(skill({ 'README.md': `## Install\n${words(300)}\n` }));
  assert.equal(r2.checks.find((c) => c.kind === 'readme-install').status, 'FAIL');
  assert.equal(r2.over, 1);
});

test('first-path total is the sum of the three files and fails above 3,700', () => {
  const dir = skill({
    'SKILL.md': words(2200),
    'references/quickstart.md': words(1200),
    'README.md': `## Install\n${words(298)}\n`,
  });
  const r = checkBudgets(dir);
  assert.equal(r.firstPath.words, 3700);
  assert.equal(r.firstPath.status, 'WARN');
  assert.equal(r.over, 0);
  const r2 = checkBudgets(skill({
    'SKILL.md': words(2200),
    'references/quickstart.md': words(1200),
    'README.md': `## Install\n${words(299)}\n`,
  }));
  assert.equal(r2.firstPath.status, 'FAIL');
  assert.equal(r2.over, 2); // README install section and the first-path total
});

test('a reference over 3,000 or an agent file over 600 fails', () => {
  const r = checkBudgets(skill({ 'references/loops.md': words(3001), 'agents/sre.md': words(601) }));
  assert.equal(r.over, 2);
  assert.equal(r.checks.find((c) => c.path === 'references/loops.md').status, 'FAIL');
  assert.equal(r.checks.find((c) => c.path === 'agents/sre.md').status, 'FAIL');
});

test('--guide applies the 2,500-word reference-guide budget', () => {
  const dir = skill({ 'guide.md': words(2501) });
  const r = exec(dir, '--guide', join(dir, 'guide.md'));
  assert.equal(r.code, 1);
  assert.match(r.stdout, /^FAIL\s+guide/m);
});

test('missing first-path inputs exit 2', () => {
  assert.throws(() => checkBudgets(skill({ 'README.md': '# x\n## Usage\ntext\n' })), InputError);
  assert.equal(exec(skill({ 'references/quickstart.md': null })).code, 2);
  assert.equal(exec(skill({ 'SKILL.md': null })).code, 2);
  assert.equal(exec(join(makeDir('empty'), 'nope')).code, 2);
});

test('--help prints usage and exits 0', () => {
  const r = exec('--help');
  assert.equal(r.code, 0);
  assert.match(r.stdout, /Usage: node budget-check\.mjs/);
});

// Default-path token budget (--default-path): ceil(chars / 4) per listed file, each file once.

// A repository root with skills/x/references/default-path.json listing `list`; `files` are written under root.
function defaultPathRepo(list, files) {
  const root = makeDir('defpath');
  write(root, 'skills/x/references/default-path.json', JSON.stringify({ files: list }));
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  return { root, skillDir: join(root, 'skills', 'x') };
}

test('default path: tokens are ceil(chars / 4) per file, summed, and a fixture under budget passes', () => {
  const { skillDir } = defaultPathRepo(['skills/x/SKILL.md', 'skills/y/a.md'], {
    'skills/x/SKILL.md': 'a'.repeat(9), // 3 tokens
    'skills/y/a.md': 'b'.repeat(8), // 2 tokens
  });
  const r = checkDefaultPath(skillDir, { budget: 5 });
  assert.equal(r.total, 5);
  assert.deepEqual(r.files.map((f) => f.tokens), [3, 2]);
  assert.equal(r.status, 'PASS');
  const cli = exec(skillDir, '--default-path', '--json');
  assert.equal(cli.code, 0, cli.stdout + cli.stderr);
  assert.equal(JSON.parse(cli.stdout).total, 5);
});

test('default path: a fixture over budget exits 1 with DEFAULT_PATH', () => {
  const { skillDir } = defaultPathRepo(['skills/x/SKILL.md'], {
    'skills/x/SKILL.md': 'a'.repeat((BUDGETS.defaultPathTokens + 1) * 4),
  });
  assert.equal(checkDefaultPath(skillDir, { budget: 10 }).status, 'FAIL');
  const r = exec(skillDir, '--default-path', '--json');
  assert.equal(r.code, 1);
  const out = JSON.parse(r.stdout);
  assert.equal(out.rule, 'DEFAULT_PATH');
  assert.equal(out.total, BUDGETS.defaultPathTokens + 1);
  assert.match(exec(skillDir, '--default-path').stdout, /DEFAULT_PATH/);
});

test('default path: a missing listed file or a missing list exits 2', () => {
  const { skillDir } = defaultPathRepo(['skills/x/SKILL.md', 'skills/x/gone.md'], { 'skills/x/SKILL.md': 'x' });
  assert.throws(() => checkDefaultPath(skillDir), InputError);
  const r = exec(skillDir, '--default-path');
  assert.equal(r.code, 2);
  assert.match(r.stderr, /gone\.md/);
  assert.equal(exec(makeDir('nolist'), '--default-path').code, 2);
});

test('default path: a duplicated entry is counted once', () => {
  const { skillDir } = defaultPathRepo(['skills/x/SKILL.md', './skills/x/SKILL.md', 'skills/x/SKILL.md'], {
    'skills/x/SKILL.md': 'a'.repeat(40),
  });
  const r = checkDefaultPath(skillDir, { budget: 10 });
  assert.equal(r.files.length, 1);
  assert.equal(r.total, 10);
});

test('default path: --root overrides the repository root', () => {
  const { root } = defaultPathRepo(['skills/x/SKILL.md'], { 'skills/x/SKILL.md': 'abcd' });
  const elsewhere = makeDir('listonly');
  write(elsewhere, 'references/default-path.json', JSON.stringify({ files: ['skills/x/SKILL.md'] }));
  assert.equal(checkDefaultPath(elsewhere, { root, budget: 1 }).total, 1);
  assert.equal(exec(elsewhere, '--default-path', '--root', root).code, 0);
});

test('the shipped default path is within its token budget', () => {
  const r = exec(SKILL, '--default-path', '--json');
  assert.equal(r.code, 0, r.stdout + r.stderr);
  const out = JSON.parse(r.stdout);
  assert.ok(out.total <= BUDGETS.defaultPathTokens, `default path ${out.total} > ${BUDGETS.defaultPathTokens}`);
  assert.ok(out.files.length >= 50);
});
