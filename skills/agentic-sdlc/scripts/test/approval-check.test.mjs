import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentHash } from '../lib/md.mjs';
import { planHash } from '../plan-graph.mjs';
import { fingerprint } from '../lib/git.mjs';
import { makeDir, makeRepo, write, commit, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'approval-check.mjs');
const EXAMPLE = join(HERE, '..', '..', 'examples', 'worked-example', 'specs', '001-csv-export');
const TODAY = '2026-11-27';
const SHA = 'a'.repeat(40);

function specText(path, row) {
  return `# Spec: export\n\n| Field | Value |\n|---|---|\n| ID | 001-x |\n| Revision | 1 |\n| Path | ${path} |\n\n` +
    '## Problem\n\nAnalysts copy rows by hand.\n\n## Approvals\n\n' +
    '| Sign-off | Rev | Hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |\n' +
    '|---|---|---|---|---|---|---|---|---|---|\n' + (row ? row + '\n' : '');
}

function planText(row) {
  return '# Plan: export\n\n**Path:** Standard\n\n## Tasks\n\n| ID | Title | AC | Blocked by | Files | Size |\n|---|---|---|---|---|---|\n' +
    '| T1 | Serializer | AC-1 | — | `src/a.js` | 2h |\n\n## Approvals\n\n' +
    '| Sign-off | Plan rev | Plan hash | Spec rev | Spec hash | Date | Role | Person | Exact words | Evidence reviewed | Residual risks | Decision |\n' +
    '|---|---|---|---|---|---|---|---|---|---|---|---|\n' + (row ? row + '\n' : '');
}

function reviewText(row, waiver) {
  return '# Review record\n\n## Waivers\n\n' +
    '| ID | Kind (accept-risk \\| defer \\| emergency) | Gate waived | Severity | Reason | Requester | Owner (≠ requester) | Granted | Expires (≤ kind maximum) | Follow-up (#n, KEY-n or URL) |\n' +
    '|---|---|---|---|---|---|---|---|---|---|\n' + (waiver || '| none | — | — | — | — | — | — | — | — | — |') + '\n\n## Test sign-off\n\n' +
    '| Gate | Decision (exact words) | Approver (role, person) | Date (ISO-8601) | Head SHA (PR host) or fingerprint (no PR host) |\n' +
    '|---|---|---|---|---|\n' + (row || '| Test | pending | — | — | — |') + '\n';
}

// A complete Standard folder: every field valid. Overrides: { spec, plan, review, path, words, role, person }.
function folder(o = {}) {
  const dir = makeDir('approval');
  const path = o.path || 'Standard';
  const specRow = (h) => `| Specify | 1 | ${h} | 2026-11-23 14:40 | ${o.role ?? 'Product Owner'} | ${o.person ?? 'L. Rocha'} | "${o.words ?? 'Yes, approved.'}" | spec-lint exit 0 | none | approved |`;
  const spec0 = specText(path, null);
  const sHash = contentHash(spec0);
  const spec = o.spec ?? (path === 'Quick' ? spec0 : specText(path, specRow(o.specHash ?? sHash)));
  write(dir, 'spec.md', spec);
  if (path !== 'Quick' && o.plan !== false) {
    const plan0 = planText(null);
    const pHash = planHash(plan0);
    write(dir, 'plan.md', o.planMd ?? planText(`| Design | 1 | ${pHash} | 1 | ${sHash} | 2026-11-23 15:10 | Tech Lead | D. Okafor | "Approved. Go." | plan-graph exit 0 | none | approved |`));
  }
  if (o.review !== undefined) write(dir, 'review.md', o.review);
  return dir;
}

function exec(args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args, '--today', TODAY, '--json'], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout, err: r.stderr, json: r.stdout ? JSON.parse(r.stdout) : null };
}
const rules = (r) => r.json.folders.flatMap((f) => f.findings.map((x) => x.rule));
const testRow = (person = 'Human reviewer, J. Park', words = '"approved, merge it"') => `| Test | ${words} | ${person} | 2026-11-25T10:00:00Z | \`${SHA}\` |`;

test('a complete Standard folder passes', () => {
  const r = exec([folder()]);
  assert.equal(r.code, 0, r.out + r.err);
  const stages = Object.fromEntries(r.json.folders[0].signOffs.map((s) => [s.stage, s.status]));
  assert.deepEqual(stages, { Specify: 'valid', Design: 'valid', Test: 'not-reached', Release: 'not-reached' });
});

test('hash mismatch: a stale Specify row fails SO06', () => {
  const r = exec([folder({ specHash: '000000000000' })]);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('SO06'), r.out);
});

test('missing role fails SO02; a role other than the owner fails SO02', () => {
  assert.ok(rules(exec([folder({ role: '' })])).includes('SO02'));
  const other = exec([folder({ role: 'Developer' })]);
  assert.equal(other.code, 1);
  assert.ok(rules(other).includes('SO02'));
});

test('silence and non-approval words are refused (SO04)', () => {
  for (const words of ['', 'sounds good', 'whatever you think', 'yes, whatever you think', 'not approved', 'pending']) {
    const r = exec([folder({ words })]);
    assert.equal(r.code, 1, `"${words}" must not count as approval`);
    assert.ok(rules(r).includes('SO04'), words);
  }
});

test('Test approver = PR author is refused (SO08), by full-name match or @login', () => {
  const byName = exec([folder({ review: reviewText(testRow()) }), '--head', SHA, '--author', 'jpark']);
  assert.equal(byName.code, 1);
  assert.ok(rules(byName).includes('SO08'));
  const byLogin = exec([folder({ review: reviewText(testRow('Human reviewer, J. Park (@jp-dev)')) }), '--head', SHA, '--author', 'jp-dev']);
  assert.ok(rules(byLogin).includes('SO08'));
  assert.equal(exec([folder({ review: reviewText(testRow()) }), '--head', SHA, '--author', 'someone-else']).code, 0);
});

test('a Specify or Design approver may open the PR: SO08 covers only the Test and Release sign-offs', () => {
  const r = exec([folder(), '--author', 'lrocha']);
  assert.equal(r.code, 0, r.out);
  assert.equal(exec([folder(), '--author', 'dokafor']).code, 0);
});

test('Test approver = PR author is accepted with a valid waiver; an expired or self-owned one is not', () => {
  const waiver = (owner, expires) => `| W1 | accept-risk | Approver = PR author (1-person team) | Important | One maintainer | Developer (agent) | ${owner} | 2026-11-20 | ${expires} | #12 |`;
  const withWaiver = (w) => folder({ review: reviewText(testRow(), w) });
  assert.equal(exec([withWaiver(waiver('self · 1-person team', '2026-12-10')), '--head', SHA, '--author', 'jpark']).code, 0);
  const expired = exec([withWaiver(waiver('Tech Lead · D. Okafor', '2026-11-25')), '--head', SHA, '--author', 'jpark']);
  assert.equal(expired.code, 1);
  assert.ok(rules(expired).includes('SO08') && rules(expired).includes('SO09'), expired.out);
  const tooLong = exec([withWaiver(waiver('Tech Lead · D. Okafor', '2027-01-30')), '--head', SHA, '--author', 'jpark']);
  assert.ok(rules(tooLong).includes('SO08'));
});

test('Test sign-off in a review record: valid row passes; head SHA mismatch fails; Release reached without Test fails', () => {
  const dir = folder({ review: reviewText(testRow()) });
  const r = exec([dir, '--head', SHA]);
  assert.equal(r.code, 0, r.out);
  assert.equal(r.json.folders[0].signOffs.find((s) => s.stage === 'Test').status, 'valid');
  assert.ok(rules(exec([dir, '--head', 'b'.repeat(40)])).includes('SO06'));
  assert.ok(rules(exec([folder({ review: reviewText(testRow('J. Park')) })])).includes('SO02'), 'role and person share the Approver cell');
  const pending = folder({ review: reviewText(null) });
  assert.equal(exec([pending]).code, 0, 'pending before Release is not reached yet');
  write(pending, 'release-notes.md', '# Release notes\n');
  const rel = exec([pending]);
  assert.equal(rel.code, 1);
  assert.ok(rules(rel).filter((x) => x === 'SO01').length >= 1);
});

test('no PR host: a Test row bound to the current fingerprint is valid; a later code change stales it', () => {
  const dir = makeRepo('approval-fp');
  write(dir, 'src/a.js', 'export const a = 1;\n');
  write(dir, 'specs/001-x/spec.md', specText('Quick', null));
  commit(dir, 'init');
  const fp = fingerprint({ cwd: dir }).short;
  write(dir, 'specs/001-x/review.md', reviewText(`| Test | "approved" | Human reviewer, J. Park | 2026-11-25T10:00:00Z | \`${fp}\` |`));
  const ok = exec([join(dir, 'specs/001-x')]);
  assert.equal(ok.code, 0, ok.out);
  assert.equal(ok.json.folders[0].signOffs.find((s) => s.stage === 'Test').hashValid, true);
  write(dir, 'src/a.js', 'export const a = 2;\n');
  const stale = exec([join(dir, 'specs/001-x')]);
  assert.equal(stale.code, 1);
  assert.ok(rules(stale).includes('SO06'), stale.out);
});

test('Quick path needs only the Test sign-off', () => {
  const none = exec([folder({ path: 'Quick', review: reviewText(testRow()) })]);
  assert.equal(none.code, 0, none.out);
  const stages = Object.fromEntries(none.json.folders[0].signOffs.map((s) => [s.stage, s.status]));
  assert.equal(stages.Specify, 'not-required');
  assert.equal(stages.Design, 'not-required');
  assert.equal(stages.Test, 'valid');
  const dir = makeDir('quick');
  write(dir, 'docs/reviews/12.md', reviewText(testRow()));
  assert.equal(exec(['--pr', join(dir, 'docs/reviews/12.md')]).code, 0);
  write(dir, 'docs/reviews/13.md', reviewText(testRow('Human reviewer, J. Park', '"sounds good"')));
  assert.equal(exec(['--pr', join(dir, 'docs/reviews/13.md')]).code, 1);
});

test('Full path: the review record needs two distinct Test approvers', () => {
  const two = reviewText(`${testRow()}\n${testRow('Human reviewer, M. Silva')}`);
  const one = reviewText(testRow());
  const mk = (review) => folder({ path: 'Full', review });
  assert.equal(exec([mk(two)]).code, 0);
  const r = exec([mk(one)]);
  assert.equal(r.code, 1);
  assert.ok(rules(r).includes('SO01'));
});

test('the worked example passes, with its PR body as --pr and an unrelated author', () => {
  const r = exec([EXAMPLE, '--pr', join(EXAMPLE, 'pr-body.md'), '--author', 'octocat']);
  assert.equal(r.code, 0, r.out + r.err);
  const stages = Object.fromEntries(r.json.folders[0].signOffs.map((s) => [s.stage, s.status]));
  assert.deepEqual(stages, { Specify: 'valid', Design: 'valid', Test: 'host', Release: 'valid' });
});

test('an unfilled PR body template leaves Test to the host and passes', () => {
  const r = exec([EXAMPLE, '--pr', join(HERE, '..', '..', 'templates', 'pr-body.md')]);
  assert.equal(r.code, 0, r.out + r.err);
  assert.equal(r.json.folders[0].signOffs.find((s) => s.stage === 'Test').status, 'host');
});

test('input errors exit 2: missing folder, missing spec.md, missing --pr file, approvals table without columns', () => {
  assert.equal(exec([join(makeDir('nope'), 'absent')]).code, 2);
  assert.equal(exec([makeDir('empty')]).code, 2);
  assert.equal(exec([folder(), '--pr', join(makeDir('x'), 'none.md')]).code, 2);
  assert.equal(exec([folder({ planMd: '# Plan\n\n## Approvals\n\n| Sign-off | Who |\n|---|---|\n| Design | me |\n' })]).code, 2);
  const help = spawnSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage/);
});
