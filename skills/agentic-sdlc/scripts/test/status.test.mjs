import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectState, loadNextSteps } from '../status.mjs';
import { planHashOf, specHashOf } from '../run-ledger.mjs';
import { fingerprint } from '../lib/git.mjs';
import { parseTables } from '../lib/md.mjs';
import { makeRepo, write, commit, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'status.mjs');
const SKILL = join(HERE, '..', '..');
const SKILLS = join(SKILL, '..');

function exec(cwd, ...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

const BLOCK = '# Project\n<!-- AGENTIC-SDLC:BEGIN -->\n## Agentic SDLC\n```sdlc-dod\ntest: npm test\n```\n<!-- AGENTIC-SDLC:END -->\n';
const SPEC_BODY = '# Spec 001\n\nPath: Standard · S=5 · R=1 (money)\n\n## Acceptance criteria\n\n- AC-1 exports rows\n';
const PLAN_BODY = '# Plan\n\n## Tasks\n\n| ID | Task | Files | Blocked by | ACs |\n|---|---|---|---|---|\n| T1 | Export | `src/a.js` | — | AC-1 |\n| T2 | Escape | `src/b.js` | T1 | AC-1 |\n';

const approvedSpec = (body = SPEC_BODY) =>
  `${body}\n## Approvals\n\n| Sign-off | Person | Spec hash | Decision |\n|---|---|---|---|\n| Specify | PO | ${specHashOf(body)} | approved |\n`;
const approvedPlan = (body = PLAN_BODY) =>
  `${body}\n## Approvals\n\n| Sign-off | Person | Plan hash | Decision |\n|---|---|---|---|\n| Design | TL | ${planHashOf(body)} | approved |\n`;

// A repository at a given stage. Each step adds the artifacts of the next row of the router table.
function repo(stage) {
  const dir = makeRepo('status');
  write(dir, 'README.md', '# app\n');
  if (stage === 'no-block') { commit(dir, 'init'); return dir; }
  write(dir, 'AGENTS.md', BLOCK);
  if (stage === 'no-spec') { commit(dir, 'init'); return dir; }
  const s = 'specs/001-csv-export';
  write(dir, `${s}/spec.md`, stage === 'spec-unapproved' ? `${SPEC_BODY}\n## Approvals\n\n_none yet_\n` : approvedSpec());
  if (stage === 'spec-unapproved') { commit(dir, 'spec'); return dir; }
  if (stage === 'plan-missing') { commit(dir, 'spec'); return dir; }
  write(dir, `${s}/plan.md`, stage === 'plan-unapproved' ? `${PLAN_BODY}\n## Approvals\n\n_pending_\n` : approvedPlan());
  commit(dir, 'docs: spec and plan');
  if (stage === 'plan-unapproved') return dir;
  write(dir, 'src/a.js', 'export const a = 1;\n');
  commit(dir, 'feat: export\n\nRefs: T1 AC-1');
  if (stage === 'tasks-open') return dir;
  write(dir, 'src/b.js', 'export const b = 1;\n');
  commit(dir, 'feat: escape\n\nRefs: T2 AC-1');
  write(dir, `${s}/pr-body.md`, '# PR\n\n## Verification\n\n| ID | test | command | exit | fingerprint | time | by |\n|---|---|---|---|---|---|---|\n| DoD | test | npm test | 0 | 000000000000 | t | Reviewer |\n');
  commit(dir, 'docs: pr body');
  if (stage === 'pr-stale') return dir;
  write(dir, `${s}/release-notes.md`, '# Release v1.0.0\n');
  commit(dir, 'docs: release notes');
  if (stage === 'released') return dir;
  write(dir, 'docs/retros/2026-12-08.md', `# Retro — 2026-12-08\n\n**Covers:** \`${s}\`\n\n## Actions\n\n| ID | Action | Owner | Target file | Status |\n|---|---|---|---|---|\n| RA-20261208-1 | Add a lint rule | engineer | \`eslint.config.js\` | ${stage === 'retro-open' ? 'open' : 'done abc1234'} |\n`);
  commit(dir, 'docs: retro');
  return dir;
}

const CASES = [
  ['no-block', 'NO_BLOCK', 'project-context'],
  ['no-spec', 'NO_SPEC', 'spec-driven-development'],
  ['spec-unapproved', 'SPEC_UNAPPROVED', 'spec-driven-development'],
  ['plan-missing', 'PLAN_MISSING', 'writing-plans'],
  ['plan-unapproved', 'PLAN_UNAPPROVED', 'writing-plans'],
  ['tasks-open', 'TASKS_OPEN', 'executing-plans'],
  ['pr-stale', 'PR_WITHOUT_EVIDENCE', 'verification-gate'],
  ['released', 'RELEASED_WITHOUT_RETRO', 'retrospective'],
  ['retro-open', 'RETRO_ACTIONS_OPEN', 'issue-triage'],
  ['done', 'NOTHING_OPEN', 'issue-triage'],
];

for (const [stage, state, skill] of CASES) {
  test(`router Step 0 row: ${stage} → ${state}, primary ${skill}`, () => {
    const dir = repo(stage);
    const r = detectState({ cwd: dir });
    assert.equal(r.state, state, JSON.stringify(r.evidence));
    assert.equal(r.next.primary.skill, skill);
    assert.ok(r.evidence.length >= 1, 'every state cites evidence');
    for (const e of r.evidence) assert.match(e.at, /^[^:]+(:\d+)?$/);
  });
}

test('tasks open: the next unblocked task and file:line evidence are reported', () => {
  const r = detectState({ cwd: repo('tasks-open') });
  assert.equal(r.item, 'specs/001-csv-export');
  assert.match(r.evidence.map((e) => e.note).join(' '), /T2/);
  assert.ok(r.evidence.some((e) => /plan\.md:\d+$/.test(e.at)));
});

test('fresh Verification rows on the current fingerprint leave the PR state with a review next step', () => {
  const dir = repo('pr-stale');
  const s = 'specs/001-csv-export';
  // review.md is a record file excluded from the fingerprint, so writing the current short hash keeps it current.
  const fp = fingerprint({ cwd: dir }).short;
  write(dir, `${s}/review.md`, `# PR\n\n## Verification\n\n| ID | test | command | exit | fingerprint | time | by |\n|---|---|---|---|---|---|---|\n| DoD | test | npm test | 0 | ${fp} | t | Reviewer |\n`);
  const r = detectState({ cwd: dir });
  assert.equal(r.state, 'PR_WITHOUT_EVIDENCE');
  assert.equal(r.evidenceFresh, true);
});

test('a repository without commits is read from the working tree, not reported UNKNOWN', () => {
  const dir = makeRepo('nocommit');
  write(dir, 'AGENTS.md', BLOCK);
  write(dir, 'specs/001-x/spec.md', approvedSpec());
  write(dir, 'specs/001-x/plan.md', approvedPlan());
  const r = detectState({ cwd: dir });
  assert.equal(r.state, 'TASKS_OPEN');
});

test('the earliest stage across spec folders wins', () => {
  const dir = repo('released');
  write(dir, 'specs/002-pdf/spec.md', `${SPEC_BODY}\n## Approvals\n\n_none_\n`);
  commit(dir, 'docs: spec 002');
  const r = detectState({ cwd: dir });
  assert.equal(r.state, 'SPEC_UNAPPROVED');
  assert.equal(r.item, 'specs/002-pdf');
});

test('an unparsable plan gives state UNKNOWN and exit 2', () => {
  const dir = repo('plan-missing');
  write(dir, 'specs/001-csv-export/plan.md', '# Plan\n\nno tasks here\n');
  commit(dir, 'bad plan');
  const r = exec(dir, '--json');
  assert.equal(r.code, 2);
  const out = JSON.parse(r.stdout);
  assert.equal(out.state, 'UNKNOWN');
  assert.equal(out.next.primary.skill, 'project-context');
});

test('CLI: --json, --next and --topic', () => {
  const dir = repo('tasks-open');
  const j = exec(dir, '--json');
  assert.equal(j.code, 0, j.stderr);
  assert.equal(JSON.parse(j.stdout).state, 'TASKS_OPEN');
  const n = exec(dir, '--next');
  assert.equal(n.code, 0);
  assert.match(n.stdout, /^Next: executing-plans/m);
  assert.ok(n.stdout.trim().split('\n').length <= 4);
  const t = exec(dir, '--topic', 'blocked');
  assert.equal(t.code, 0);
  assert.match(t.stdout, /blocked/i);
  assert.equal(exec(dir, '--topic', 'nope').code, 2);
});

test('next-steps.json: at most 3 recommendations per state, and every skill exists under skills/', () => {
  const steps = loadNextSteps();
  assert.ok(steps.length >= 11);
  for (const s of steps) {
    assert.ok(1 + s.secondary.length <= 3, `${s.state} has more than 3 recommendations`);
    for (const rec of [s.primary, ...s.secondary]) {
      assert.ok(existsSync(join(SKILLS, rec.skill, 'SKILL.md')), `${s.state}: skill ${rec.skill} missing`);
      assert.ok(rec.reason, `${s.state}: ${rec.skill} has no reason`);
    }
  }
});

test('drift: the router Step 0 table lists the same states as next-steps.json', () => {
  const router = readFileSync(join(SKILL, 'SKILL.md'), 'utf8');
  const table = parseTables(router).find((t) => t.header.includes('State (first match from the top)'));
  assert.ok(table, 'router Step 0 table not found');
  const fromRouter = table.rows.map((r) => r[1]).sort();
  const fromData = loadNextSteps().filter((s) => s.router).map((s) => s.router).sort();
  assert.deepEqual(fromData, fromRouter);
  assert.match(router, /`UNKNOWN`/);
});

test('a vendored copy in .agentic-sdlc/bin/ reads the data files next to itself', () => {
  const dir = repo('tasks-open');
  const bin = join(dir, '.agentic-sdlc', 'bin');
  mkdirSync(join(bin, 'lib'), { recursive: true });
  for (const f of readdirSync(join(SKILL, 'scripts'))) if (f.endsWith('.mjs')) copyFileSync(join(SKILL, 'scripts', f), join(bin, f));
  for (const f of readdirSync(join(SKILL, 'scripts', 'lib'))) copyFileSync(join(SKILL, 'scripts', 'lib', f), join(bin, 'lib', f));
  for (const f of ['next-steps.json', 'help-topics.md']) copyFileSync(join(SKILL, 'references', f), join(bin, f));
  const r = spawnSync(process.execPath, [join(bin, 'status.mjs'), '--next'], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /^Next: executing-plans/m);
  const t = spawnSync(process.execPath, [join(bin, 'status.mjs'), '--topic', 'resume'], { cwd: dir, encoding: 'utf8' });
  assert.equal(t.status, 0, t.stderr);
});

test('every stage skill closes its workflow with status.mjs --next', () => {
  const bundles = JSON.parse(readFileSync(join(SKILLS, '..', 'bundles.json'), 'utf8')).bundles;
  const stages = bundles['agentic-sdlc'].skills.filter((s) => s !== 'agentic-sdlc');
  assert.equal(stages.length, 19);
  for (const s of stages) {
    const md = readFileSync(join(SKILLS, s, 'SKILL.md'), 'utf8');
    const workflow = md.match(/^## Workflow\n([\s\S]*?)(?=^## )/m);
    assert.ok(workflow, `${s}: no ## Workflow section`);
    assert.match(workflow[1], /status\.mjs --next/, `${s}: workflow does not close with status.mjs --next`);
  }
});

test('help topics exist and each is at most 150 words', () => {
  const md = readFileSync(join(SKILL, 'references', 'help-topics.md'), 'utf8');
  for (const topic of ['blocked', 'resume', 'path', 'approvals', 'extensions']) {
    const m = md.match(new RegExp(`^## ${topic}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
    assert.ok(m, `topic ${topic} missing`);
    assert.ok(m[1].split(/\s+/).filter(Boolean).length <= 150, `topic ${topic} over 150 words`);
  }
});
