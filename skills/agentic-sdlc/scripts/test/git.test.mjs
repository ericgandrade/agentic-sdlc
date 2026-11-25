import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  isRepo, headSha, currentBranch, defaultBranch, fingerprint, log, parseTrailers, refsFromMessage, changedFiles,
} from '../lib/git.mjs';
import { InputError } from '../lib/cli.mjs';
import { makeDir, makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

after(cleanup);

test('isRepo / headSha / branches', () => {
  const plain = makeDir('plain');
  const ceiling = process.env.GIT_CEILING_DIRECTORIES;
  process.env.GIT_CEILING_DIRECTORIES = dirname(plain);
  const repo = makeRepo();
  assert.equal(isRepo(repo), true);
  assert.equal(headSha(repo), null);
  write(repo, 'a.txt', 'a\n');
  commit(repo, 'init');
  assert.match(headSha(repo), /^[0-9a-f]{40}$/);
  assert.equal(currentBranch(repo), 'main');
  assert.equal(defaultBranch(repo), 'main');
  assert.equal(isRepo(plain), false);
  assert.throws(() => fingerprint({ cwd: plain }), InputError);
  if (ceiling === undefined) delete process.env.GIT_CEILING_DIRECTORIES;
  else process.env.GIT_CEILING_DIRECTORIES = ceiling;
});

test('fingerprint changes with content and ignores the evidence folder', () => {
  const repo = makeRepo();
  write(repo, 'src/a.js', 'one\n');
  commit(repo, 'init');
  const f0 = fingerprint({ cwd: repo });
  assert.equal(f0.clean, true);
  assert.deepEqual(fingerprint({ cwd: join(repo, 'src') }), f0, 'subdirectory cwd gives the same fingerprint');
  assert.equal(f0.short.length, 12);
  assert.equal(f0.short, f0.fingerprint.slice(0, 12));

  write(repo, '.agentic-sdlc/evidence/run.json', '{}');
  assert.equal(fingerprint({ cwd: repo }).fingerprint, f0.fingerprint, 'evidence files are excluded');
  write(repo, 'specs/001-x/review.md', 'fingerprint ' + f0.short);
  write(repo, 'docs/reviews/142.md', 'fingerprint ' + f0.short);
  commit(repo, 'review records');
  assert.equal(fingerprint({ cwd: repo }).fingerprint, f0.fingerprint, 'committed review records are excluded');
  for (const rec of ['approvals.md', 'run-ledger.jsonl', 'handoff.md', 'impediments.md', 'release-notes.md']) {
    write(repo, `specs/001-x/${rec}`, 'record ' + f0.short);
    commit(repo, `record ${rec}`);
    assert.equal(fingerprint({ cwd: repo }).fingerprint, f0.fingerprint, `committed specs/*/${rec} is excluded`);
  }
  for (const art of ['spec.md', 'plan.md', 'acceptance-tests.md', 'nested/review.md']) {
    write(repo, `specs/001-x/${art}`, 'x');
    assert.notEqual(fingerprint({ cwd: repo }).fingerprint, f0.fingerprint, `specs/*/${art} still counts`);
    unlinkSync(join(repo, `specs/001-x/${art}`));
  }
  const cli = execFileSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), '../lib/git.mjs'), 'fingerprint'], { cwd: repo, encoding: 'utf8' });
  assert.match(cli, new RegExp(`^${f0.short} clean head=[0-9a-f]{40}\\n$`), 'CLI prints the short fingerprint');

  write(repo, 'src/a.js', 'two\n');
  const f1 = fingerprint({ cwd: repo });
  assert.equal(f1.clean, false);
  assert.notEqual(f1.fingerprint, f0.fingerprint, 'modified file changes the fingerprint');
  assert.equal(fingerprint({ cwd: join(repo, 'src') }).fingerprint, f1.fingerprint, 'dirty tree from a subdirectory');

  write(repo, 'src/a.js', 'three\n');
  assert.notEqual(fingerprint({ cwd: repo }).fingerprint, f1.fingerprint, 'different dirty content differs');

  write(repo, 'src/a.js', 'one\n');
  write(repo, 'new.txt', 'x');
  const f2 = fingerprint({ cwd: repo });
  assert.notEqual(f2.fingerprint, f0.fingerprint, 'untracked file changes the fingerprint');
  unlinkSync(join(repo, 'new.txt'));
  assert.equal(fingerprint({ cwd: repo }).fingerprint, f0.fingerprint, 'restored tree restores the fingerprint');

  unlinkSync(join(repo, 'src/a.js'));
  assert.notEqual(fingerprint({ cwd: repo }).fingerprint, f0.fingerprint, 'deleted file changes the fingerprint');
});

test('plan.md Loop ledger rows never change the fingerprint; plan content does (N3)', () => {
  const repo = makeRepo('git-plan');
  const plan = '# Plan\n\n## Tasks\n\n| ID | Title |\n|---|---|\n| T1 | one |\n\n## Loop ledger\n\n| Date | Task |\n|---|---|\n';
  write(repo, 'specs/001-x/plan.md', plan);
  commit(repo, 'plan');
  const f0 = fingerprint({ cwd: repo }).fingerprint;
  write(repo, 'specs/001-x/plan.md', plan + '| 2026-11-25 | T1 |\n');
  assert.equal(fingerprint({ cwd: repo }).fingerprint, f0, 'uncommitted ledger row ignored');
  commit(repo, 'ledger row');
  assert.equal(fingerprint({ cwd: repo }).fingerprint, f0, 'committed ledger row ignored');
  write(repo, 'specs/001-x/plan.md', plan.replace('| T1 | one |', '| T1 | changed |') + '| 2026-11-25 | T1 |\n');
  assert.notEqual(fingerprint({ cwd: repo }).fingerprint, f0, 'a task edit still counts');
});

test('log returns commits oldest first with bodies; changedFiles uses the merge base', () => {
  const repo = makeRepo();
  write(repo, 'a.txt', 'a');
  commit(repo, 'init');
  sh(repo, 'checkout', '-q', '-b', 'feat');
  write(repo, 'b.txt', 'b');
  commit(repo, 'feat: add b [T1, AC-1]\n\nBody line.\n\nRefs: T1 AC-1');
  write(repo, 'c.txt', 'c');
  commit(repo, 'feat: add c\n\nRefs: T2 AC-2 AC-3');
  const commits = log({ cwd: repo, range: 'main..HEAD' });
  assert.equal(commits.length, 2);
  assert.equal(commits[0].subject, 'feat: add b [T1, AC-1]');
  assert.match(commits[0].body, /Refs: T1 AC-1$/);
  assert.deepEqual(changedFiles('main', 'HEAD', { cwd: repo }), ['b.txt', 'c.txt']);
});

test('parseTrailers reads the last paragraph only when every line is a trailer', () => {
  assert.deepEqual(parseTrailers('subj\n\nbody\n\nRefs: T1 AC-1\nCo-authored-by: X <x@y>'), {
    Refs: ['T1 AC-1'], 'Co-authored-by': ['X <x@y>'],
  });
  assert.deepEqual(parseTrailers('subj\n\nplain text: not only trailers\nmore'), {});
});

test('refsFromMessage parses trailer and bracket forms without duplicates', () => {
  assert.deepEqual(refsFromMessage('feat: x [T3, AC-2]\n\nRefs: T3 AC-2 AC-4'), { tasks: ['T3'], acs: ['AC-2', 'AC-4'] });
  assert.deepEqual(refsFromMessage('chore: nothing'), { tasks: [], acs: [] });
  assert.deepEqual(refsFromMessage('fix: y\n\nrefs: T10,AC-12'), { tasks: ['T10'], acs: ['AC-12'] });
});
