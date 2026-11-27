import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, HUMAN_TURNS, APPROVAL_WINDOW_MIN } from '../guard.mjs';
import { runDoctor } from '../doctor.mjs';
import { planHashOf, specHashOf } from '../run-ledger.mjs';
import { makeRepo, write, commit, sh, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'guard.mjs');
const HOSTS = join(HERE, '..', '..', 'templates', 'host-config');

const BLOCK = '# Project\n\nTeam notes.\n\n<!-- AGENTIC-SDLC:BEGIN -->\n## Agentic SDLC\n- Enforcement: prompt-only · permissions: enforced\n```sdlc-dod\ntest: npm test\n```\n<!-- AGENTIC-SDLC:END -->\n';
const SPEC_BODY = (path = 'Standard') => `# Spec 001\n\nPath: ${path} · S=5 · R=1 (money)\n\n## Acceptance criteria\n\n- AC-1 exports rows\n`;
const PLAN_BODY = '# Plan\n\n## Tasks\n\n| ID | Task | Files | Blocked by | ACs |\n|---|---|---|---|---|\n| T1 | Export | `src/a.js` | — | AC-1 |\n';
const approvedSpec = (body) => `${body}\n## Approvals\n\n| Sign-off | Person | Spec hash | Decision |\n|---|---|---|---|\n| Specify | PO | ${specHashOf(body)} | approved |\n`;
const approvedPlan = (body = PLAN_BODY) => `${body}\n## Approvals\n\n| Sign-off | Person | Plan hash | Decision |\n|---|---|---|---|\n| Design | TL | ${planHashOf(body)} | approved |\n`;
const PENDING_PLAN = `${PLAN_BODY}\n## Approvals\n\n| Sign-off | Person | Plan hash | Decision |\n|---|---|---|---|\n`;
const S = 'specs/001-csv-export';

// A repository on a Standard (or given) item whose Design sign-off is pending unless `approved`.
function project({ path = 'Standard', approved = false } = {}) {
  const dir = makeRepo('guard');
  write(dir, 'AGENTS.md', BLOCK);
  write(dir, 'src/a.js', 'export const a = 1;\n');
  write(dir, `${S}/spec.md`, approvedSpec(SPEC_BODY(path)));
  write(dir, `${S}/plan.md`, approved ? approvedPlan() : PENDING_PLAN);
  write(dir, `${S}/acceptance-tests.md`, '# Acceptance tests\n\n## Map\n\n| AC | Test | File |\n|---|---|---|\n| AC-1 | exports rows | `test/at/export.test.js` |\n');
  commit(dir, 'init');
  return dir;
}

const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
const writeTool = (file_path, content = 'x\n') => ({ tool_name: 'Write', tool_input: { file_path, content } });
const editTool = (file_path, old_string, new_string) => ({ tool_name: 'Edit', tool_input: { file_path, old_string, new_string } });

function exec(cwd, args, input) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8', input });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// ---------------------------------------------------------------------------------------------
// (a) shell authority

test('a push is refused (red) and a read is allowed (green)', () => {
  const dir = project({ approved: true });
  const red = decide(bash('git push origin main'), { root: dir });
  assert.equal(red.decision, 'deny');
  assert.equal(red.rule, 'G01');
  assert.match(red.reason, /push/);
  for (const ok of ['git status', 'ls -la', 'git tag -l', 'git tag --list', 'git log --oneline -5', 'git commit -m "fix the push button"', 'git diff']) {
    assert.equal(decide(bash(ok), { root: dir }).decision, 'allow', ok);
  }
  for (const tool of ['Read', 'Grep', 'Glob']) assert.equal(decide({ tool_name: tool, tool_input: { file_path: join(dir, '.agentic-sdlc/config.json'), pattern: 'x' } }, { root: dir }).decision, 'allow', tool);
});

test('push, merge on the default branch, tag, publish, deploy and force are refused in every disguise', () => {
  const dir = project({ approved: true });
  for (const cmd of [
    'git push', 'git -C . push --tags', 'git --no-pager push origin HEAD', 'npm test && git push', 'bash -c "git push origin main"',
    'git tag v1.0.0', 'gh pr merge 12 --squash', 'npm publish', 'pnpm publish', 'npm run deploy', 'git reset --hard HEAD~1 --force',
    'git checkout --force main', 'FOO=1 git push', 'echo $(git push)', 'git merge feature',
  ]) {
    const r = decide(bash(cmd), { root: dir });
    assert.equal(r.decision, 'deny', cmd);
    assert.equal(r.rule, 'G01', cmd);
  }
  sh(dir, 'checkout', '-q', '-b', 'feature');
  assert.equal(decide(bash('git merge main'), { root: dir }).decision, 'allow', 'merging into a feature branch is not a merge into the default branch');
});

test('attended mode: the feature branch may be pushed; the default branch, tags, mirrors, deletes and unattended runs may not', () => {
  const dir = project({ approved: true });
  sh(dir, 'checkout', '-q', '-b', 'feat/001-csv-export');
  for (const ok of ['git push', 'git push -u origin feat/001-csv-export', 'git push origin HEAD', 'git push origin feat/001-csv-export:feat/001-csv-export']) {
    assert.equal(decide(bash(ok), { root: dir }).decision, 'allow', ok);
  }
  for (const no of ['git push origin main', 'git push origin HEAD:main', 'git push origin feat/001-csv-export:main', 'git push --tags', 'git push --all origin',
    'git push --mirror origin', 'git push origin --delete feat/x', 'git push origin :feat/x', 'git push origin +feat/001-csv-export']) {
    const r = decide(bash(no), { root: dir });
    assert.equal(r.decision, 'deny', no);
    assert.equal(r.rule, 'G01', no);
  }
  // An open unattended run: no push at all (references/autonomous.md §5).
  write(dir, '.agentic-sdlc/runs/r1/ledger.jsonl', `${JSON.stringify({ v: 1, seq: 1, type: 'start', run: 'r1', mode: 'unattended' })}\n`);
  assert.equal(decide(bash('git push -u origin feat/001-csv-export'), { root: dir }).decision, 'deny');
  write(dir, '.agentic-sdlc/runs/r1/ledger.jsonl', `${JSON.stringify({ v: 1, seq: 1, type: 'start', run: 'r1', mode: 'unattended' })}\n${JSON.stringify({ v: 1, seq: 2, type: 'finish', status: 'DONE' })}\n`);
  assert.equal(decide(bash('git push -u origin feat/001-csv-export'), { root: dir }).decision, 'allow', 'a finished unattended run no longer blocks');
});

// ---------------------------------------------------------------------------------------------
// (b) code writes before Design sign-off

test('a code write before the Design sign-off is refused on Standard; specs, docs, runs, evidence and acceptance tests stay writable', () => {
  const dir = project();
  const r = decide(writeTool(join(dir, 'src/a.js')), { root: dir });
  assert.equal(r.decision, 'deny');
  assert.equal(r.rule, 'G02');
  assert.match(r.reason, /Design sign-off/);
  assert.match(r.reason, /specs\/001-csv-export/);
  assert.equal(decide(writeTool('src/new.js'), { root: dir }).rule, 'G02', 'relative paths resolve against the repository');
  for (const ok of [`${S}/plan.md`, 'docs/notes.md', '.agentic-sdlc/runs/r1/ledger.jsonl', '.agentic-sdlc/evidence/ledger.jsonl', 'test/at/export.test.js']) {
    assert.equal(decide(writeTool(join(dir, ok)), { root: dir }).decision, 'allow', ok);
  }
  assert.equal(decide({ tool_name: 'NotebookEdit', tool_input: { notebook_path: join(dir, 'src/n.ipynb'), new_source: 'x' } }, { root: dir }).rule, 'G02');
});

test('a code write is allowed once the Design sign-off is valid, and on the Quick path', () => {
  assert.equal(decide(writeTool('src/a.js'), { root: project({ approved: true }) }).decision, 'allow');
  assert.equal(decide(writeTool('src/a.js'), { root: project({ path: 'Quick' }) }).decision, 'allow');
  const bare = makeRepo('guard-bare');
  write(bare, 'AGENTS.md', BLOCK);
  commit(bare, 'init');
  assert.equal(decide(writeTool('src/a.js'), { root: bare }).decision, 'allow', 'no specs folder: Quick work');
});

test('an edited plan voids the sign-off and blocks code again', () => {
  const dir = project({ approved: true });
  write(dir, `${S}/plan.md`, approvedPlan().replace('| T1 | Export |', '| T1 | Export all |'));
  assert.equal(decide(writeTool('src/a.js'), { root: dir }).rule, 'G02');
});

// ---------------------------------------------------------------------------------------------
// (c) protected paths

test('an edit of a protected path is refused, by file tool and by shell redirect', () => {
  const dir = project({ approved: true });
  for (const p of ['.agentic-sdlc/config.json', '.agentic-sdlc/bin/guard.mjs', '.github/workflows/agentic-sdlc.yml', '.gitlab-ci.yml', 'CODEOWNERS', '.github/CODEOWNERS',
    '.claude/settings.json', '.claude/settings.local.json', '.codex/config.toml', 'opencode.json', '.gemini/settings.json', '.github/agents/reviewer.agent.md', HUMAN_TURNS]) {
    const r = decide(writeTool(join(dir, p)), { root: dir });
    assert.equal(r.decision, 'deny', p);
    assert.equal(r.rule, 'G03', p);
  }
  for (const cmd of ['echo "{}" > .agentic-sdlc/config.json', 'cp /tmp/x .agentic-sdlc/bin/guard.mjs', 'sed -i "" s/a/b/ CODEOWNERS', `echo '{}' >> ${HUMAN_TURNS}`, 'rm .claude/settings.json']) {
    assert.equal(decide(bash(cmd), { root: dir }).rule, 'G03', cmd);
  }
  assert.equal(decide(bash('cat .agentic-sdlc/config.json'), { root: dir }).decision, 'allow');
});

test('the AGENTS.md block is protected; the text outside it is not', () => {
  const dir = project({ approved: true });
  const inside = decide(editTool(join(dir, 'AGENTS.md'), 'permissions: enforced', 'permissions: prompt-only'), { root: dir });
  assert.equal(inside.rule, 'G03');
  assert.match(inside.reason, /AGENTIC-SDLC block/);
  assert.equal(decide(editTool(join(dir, 'AGENTS.md'), 'Team notes.', 'Team notes, updated.'), { root: dir }).decision, 'allow');
  assert.equal(decide(writeTool(join(dir, 'CLAUDE.md'), `@AGENTS.md\n${BLOCK}`), { root: dir }).rule, 'G03', 'adding a block to CLAUDE.md');
});

// ---------------------------------------------------------------------------------------------
// (d) sign-off rows need a recent explicit human turn

const ROW = `| Design | TL | ${planHashOf(PLAN_BODY)} | approved |`;
const HEAD = '| Plan hash | Decision |\n|---|---|---|---|\n';
const addRow = (dir, row = ROW) => editTool(join(dir, `${S}/plan.md`), HEAD, `${HEAD}${row}\n`);

test('a sign-off with no human turn is refused; an explicit turn in the last 15 minutes allows it', () => {
  const dir = project();
  const r = decide(addRow(dir), { root: dir });
  assert.equal(r.decision, 'deny');
  assert.equal(r.rule, 'G04');
  assert.match(r.reason, new RegExp(`${APPROVAL_WINDOW_MIN} minutes`));
  const t = exec(dir, ['human-turn', '--host', 'claude-code'], JSON.stringify({ session_id: 's1', cwd: dir, prompt: 'yes, approved' }));
  assert.equal(t.code, 0);
  assert.equal(t.stdout, '', 'UserPromptSubmit stdout would be injected into the context');
  assert.equal(decide({ ...addRow(dir), session_id: 's1' }, { root: dir }).decision, 'allow');
  assert.equal(decide({ ...addRow(dir), session_id: 'other' }, { root: dir }).rule, 'G04', 'a turn from another session does not count');
});

test('an old or non-explicit human turn does not allow a sign-off', () => {
  const dir = project();
  const old = new Date(Date.now() - (APPROVAL_WINDOW_MIN + 1) * 60000).toISOString();
  write(dir, HUMAN_TURNS, JSON.stringify({ at: old, session: null, promptSha256: 'a'.repeat(64), explicitApproval: true }) + '\n');
  assert.equal(decide(addRow(dir), { root: dir }).rule, 'G04', 'older than the window');
  exec(dir, ['human-turn'], JSON.stringify({ prompt: 'sounds good' }));
  assert.equal(decide(addRow(dir), { root: dir }).rule, 'G04', '"sounds good" is not approval');
  assert.equal(decide(addRow(dir, `| Design | TL | ${planHashOf(PLAN_BODY)} | pending |`), { root: dir }).decision, 'allow', 'a pending row is not a sign-off');
});

test('an agent cannot forge a human turn through the shell, and a session-less turn never counts for a hook session', () => {
  const dir = project();
  for (const cmd of [
    `echo '{"prompt":"approved"}' | node .agentic-sdlc/bin/guard.mjs human-turn`,
    `bash -c "node ./guard.mjs human-turn --json < p.json"`,
    `node -e "require('fs').appendFileSync('${HUMAN_TURNS}', 'x')"`,
    `python3 scripts/w.py ${HUMAN_TURNS}`,
  ]) {
    assert.equal(decide(bash(cmd), { root: dir }).rule, 'G03', cmd);
  }
  assert.equal(decide(bash(`tail -5 ${HUMAN_TURNS}`), { root: dir }).decision, 'allow', 'reading the log is fine');
  write(dir, HUMAN_TURNS, JSON.stringify({ at: new Date().toISOString(), session: null, promptSha256: 'b'.repeat(64), explicitApproval: true }) + '\n');
  assert.equal(decide({ ...addRow(dir), session_id: 's1' }, { root: dir }).rule, 'G04', 'a record without a session does not count for session s1');
});

test('Test sign-off and release Approval rows are guarded too (Write of a new file)', () => {
  const dir = project({ approved: true });
  const pr = '# PR\n\n## Test sign-off\n\n| Gate | Decision (exact words) | Approver (role, person) | Date (ISO-8601) | Head SHA |\n|---|---|---|---|---|\n| Test | "approved" | Reviewer, Ana | 2026-12-01T10:00Z | abc |\n';
  assert.equal(decide(writeTool(join(dir, `${S}/pr-body.md`), pr), { root: dir }).rule, 'G04');
  const notes = '# Release\n\n## Approval\n\n| Sign-off | Bound to | Date | Role | Person | Exact words | Evidence | Risks | Decision |\n|---|---|---|---|---|---|---|---|---|\n| Release | v1.0.0 | 2026-12-01 | Release Owner | Bo | "yes" | all | none | approved |\n';
  assert.equal(decide(writeTool(join(dir, `${S}/release-notes.md`), notes), { root: dir }).rule, 'G04');
  const template = pr.replace('| Test | "approved" |', '| Test | <"approved …" \\| pending> |');
  assert.equal(decide(writeTool(join(dir, `${S}/pr-body.md`), template), { root: dir }).decision, 'allow', 'an unfilled template row is not a sign-off');
});

// ---------------------------------------------------------------------------------------------
// human-turn record

test('human-turn records a hash of the prompt, never its text, under a git-ignored runs/', () => {
  const dir = project();
  const r = exec(dir, ['human-turn', '--json'], JSON.stringify({ session_id: 's9', prompt: 'Approved — my secret project name' }));
  assert.equal(r.code, 0);
  const lines = readFileSync(join(dir, HUMAN_TURNS), 'utf8').trim().split('\n');
  const rec = JSON.parse(lines.at(-1));
  assert.deepEqual(Object.keys(rec).sort(), ['at', 'explicitApproval', 'promptSha256', 'session']);
  assert.equal(rec.session, 's9');
  assert.equal(rec.explicitApproval, true);
  assert.match(rec.promptSha256, /^[0-9a-f]{64}$/);
  assert.ok(!readFileSync(join(dir, HUMAN_TURNS), 'utf8').includes('secret'));
  assert.ok(existsSync(join(dir, '.agentic-sdlc/runs/.gitignore')));
  assert.equal(sh(dir, 'status', '--porcelain'), '', 'the record never dirties the tree');
});

test('human-turn never blocks a prompt in hook mode; outside hook mode unparsable input exits 2', () => {
  const dir = project();
  const hook = exec(dir, ['human-turn', '--host', 'claude-code'], 'not json');
  assert.equal(hook.code, 0);
  assert.equal(hook.stdout, '');
  assert.equal(exec(dir, ['human-turn'], 'not json').code, 2);
});

// ---------------------------------------------------------------------------------------------
// CLI and hook output channels: deny, allow and error are distinguishable

test('CLI: exit 0 allow, 1 deny, 2 unparsable, each with a JSON decision', () => {
  const dir = project({ approved: true });
  const allow = exec(dir, ['pre-tool', '--json'], JSON.stringify(bash('git status')));
  assert.equal(allow.code, 0);
  assert.equal(JSON.parse(allow.stdout).decision, 'allow');
  const deny = exec(dir, ['pre-tool', '--json'], JSON.stringify(bash('git push')));
  assert.equal(deny.code, 1);
  assert.equal(JSON.parse(deny.stdout).decision, 'deny');
  const bad = exec(dir, ['pre-tool', '--json'], '{oops');
  assert.equal(bad.code, 2);
  const j = JSON.parse(bad.stdout);
  assert.equal(j.decision, 'deny');
  assert.match(j.reason, /^guard error: /);
  assert.equal(exec(dir, ['pre-tool'], JSON.stringify(bash('git push'))).code, 1);
  assert.equal(exec(dir, ['--help']).code, 0);
  assert.equal(exec(dir, ['nonsense']).code, 2);
});

test('Claude Code hook mode: deny is a permissionDecision on stdout with exit 0, allow prints nothing, errors fail closed', () => {
  const dir = project({ approved: true });
  const deny = exec(dir, ['pre-tool', '--host', 'claude-code'], JSON.stringify({ ...bash('git push'), session_id: 's', cwd: dir, hook_event_name: 'PreToolUse' }));
  assert.equal(deny.code, 0);
  const out = JSON.parse(deny.stdout).hookSpecificOutput;
  assert.equal(out.hookEventName, 'PreToolUse');
  assert.equal(out.permissionDecision, 'deny');
  assert.match(out.permissionDecisionReason, /G01/);
  const allow = exec(dir, ['pre-tool', '--host', 'claude-code'], JSON.stringify({ ...bash('git status'), cwd: dir }));
  assert.equal(allow.code, 0);
  assert.equal(allow.stdout, '', 'never "allow": that would skip the permission prompt and the deny rules');
  for (const bad of ['', 'not json', JSON.stringify({ tool_name: 'Write', tool_input: {} }), JSON.stringify([1])]) {
    const r = exec(dir, ['pre-tool', '--host', 'claude-code'], bad);
    assert.equal(r.code, 0, bad);
    const o = JSON.parse(r.stdout).hookSpecificOutput;
    assert.equal(o.permissionDecision, 'deny', bad);
    assert.match(o.permissionDecisionReason, /^guard error: /, bad);
  }
});

// ---------------------------------------------------------------------------------------------
// Host templates

test('every host template parses, and the Claude Code template wires both hooks fail-closed', () => {
  const files = [];
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) e.isDirectory() ? walk(join(d, e.name)) : files.push(join(d, e.name)); };
  walk(HOSTS);
  assert.ok(files.length >= 5, files.join(', '));
  for (const f of files) {
    const text = readFileSync(f, 'utf8');
    assert.doesNotMatch(text, /\/Users\//, f);
    if (f.endsWith('.json')) JSON.parse(text);
    if (f.endsWith('.toml')) {
      for (const line of text.split('\n')) {
        const l = line.trim();
        if (!l || l.startsWith('#')) continue;
        assert.match(l, /^(\[[A-Za-z0-9_.-]+\]|[A-Za-z0-9_-]+\s*=\s*("[^"]*"|true|false|\d+|\[.*\]))$/, `${f}: ${l}`);
      }
    }
  }
  const cc = JSON.parse(readFileSync(join(HOSTS, 'claude-code', 'settings.json'), 'utf8'));
  for (const p of ['git push', 'git merge', 'git tag', 'gh pr merge', 'npm publish']) assert.ok(cc.permissions.deny.some((d) => d.includes(p)), p);
  const pre = cc.hooks.PreToolUse[0];
  assert.match(pre.matcher, /Bash/);
  assert.match(pre.matcher, /Write/);
  assert.match(pre.hooks[0].command, /\.agentic-sdlc\/bin\/guard\.mjs pre-tool --host claude-code/);
  assert.equal(pre.hooks[0].onFailure, 'block');
  const ups = cc.hooks.UserPromptSubmit[0].hooks[0];
  assert.match(ups.command, /guard\.mjs human-turn --host claude-code/);
  assert.notEqual(ups.onFailure, 'block', 'human-turn always allows the prompt');
});

test('each template, written to its host path, makes doctor report that host enforced', () => {
  const placed = {
    'claude-code': ['claude-code/settings.json', '.claude/settings.json'],
    codex: ['codex/config.toml', '.codex/config.toml'],
    opencode: ['opencode/opencode.json', 'opencode.json'],
    gemini: ['gemini/settings.json', '.gemini/settings.json'],
  };
  for (const [host, [from, to]] of Object.entries(placed)) {
    const dir = project({ approved: true });
    mkdirSync(dirname(join(dir, to)), { recursive: true });
    copyFileSync(join(HOSTS, from), join(dir, to));
    const r = runDoctor({ cwd: dir, env: { PATH: '' }, nodeVersion: '20.0.0' });
    const h = r.hosts.find((x) => x.host === host);
    assert.ok(h, `${host} detected: ${JSON.stringify(r.hosts)}`);
    assert.equal(h.permissions, 'enforced', host);
  }
  const copilot = readFileSync(join(HOSTS, 'copilot-cli', 'README.md'), 'utf8');
  assert.match(copilot, /--deny-tool 'shell\(git push\)'/);
  assert.match(copilot, /^tools:/m);
});
