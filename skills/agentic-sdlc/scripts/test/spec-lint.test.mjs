import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintSpec, sizeRoute, riskRoute } from '../spec-lint.mjs';
import { makeDir, write, cleanup } from './helpers.mjs';

after(cleanup);

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(HERE, '..', 'spec-lint.mjs');
const SKILL = join(HERE, '..', '..');
const EXAMPLE_DIR = join(SKILL, 'examples', 'worked-example', 'specs', '001-csv-export');
const EXAMPLE = join(EXAMPLE_DIR, 'spec.md');
const FIXTURES = join(HERE, 'fixtures', 'spec-lint');
const TODAY = '2026-11-24';

const SPEC = readFileSync(EXAMPLE, 'utf8');
const REGISTER = readFileSync(join(EXAMPLE_DIR, 'approvals.md'), 'utf8');

function exec(...args) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// Lints a variant of the worked example in memory; siblings default to the example's register.
function lint(md, { checkApproval = false, siblings = { 'approvals.md': REGISTER }, today = TODAY } = {}) {
  return lintSpec(md, { checkApproval, today, readSibling: (name) => siblings[name] ?? null });
}

const rules = (r, level = 'error') => r.findings.filter((f) => f.level === level).map((f) => f.rule);

function edit(md, from, to) {
  assert.ok(md.includes(from), `fixture text not found: ${from}`);
  return md.replace(from, to);
}

const WAIVER_ROW = (cells) => SPEC.replace(
  /(### Waivers\n\n\|[^\n]+\n\|[^\n]+\n)/,
  `$1| W1 | ${cells} |\n`,
);

test('the worked example passes lint and its approval check', () => {
  const r = lint(SPEC, { checkApproval: true });
  assert.deepEqual(rules(r), []);
  assert.deepEqual(rules(r, 'warn'), ['TM02']);
  assert.equal(r.path, 'Standard');
  assert.equal(r.approval.decision, 'approved');

  const cli = exec(EXAMPLE, '--check-approval', '--today', TODAY);
  assert.equal(cli.code, 0, cli.stdout + cli.stderr);
  assert.match(cli.stdout, /PASS \(0 errors, 1 warnings\)/);
});

test('--hash prints the hash recorded in the Approvals row', () => {
  const cli = exec('--hash', EXAMPLE);
  assert.equal(cli.code, 0);
  const hash = cli.stdout.trim().split(/\s+/)[0];
  assert.match(hash, /^[0-9a-f]{12}$/);
  assert.ok(SPEC.includes(`| ${hash} |`), 'Approvals row records the current hash');
});

test('the template itself fails on unfilled placeholders', () => {
  const cli = exec(join(SKILL, 'templates', 'spec.md'));
  assert.equal(cli.code, 1);
  assert.match(cli.stdout, /P01/);
});

test('the defects fixture reports one finding per seeded defect', () => {
  const cli = exec(join(FIXTURES, 'defects.md'), '--json');
  assert.equal(cli.code, 1);
  const found = JSON.parse(cli.stdout).results[0].findings.map((f) => f.rule).sort();
  assert.deepEqual(found, ['AC02', 'H05', 'NG01', 'OBS03', 'OQ01', 'REV03', 'V01']);
});

test('single defects in an otherwise valid spec', async (t) => {
  const cases = [
    ['AC numbering gap', (s) => edit(s, '| AC-4 |', '| AC-5 |'), 'AC02'],
    ['criterion without Given/When/Then or a number', (s) => edit(s, /\| AC-4 \|[^|]+\|/.exec(s)[0], '| AC-4 | The export handles big filters well. |'), 'AC03'],
    ['unknown AC priority', (s) => edit(s, '| normal |', '| high |'), 'AC04'],
    ['vague term without a number', (s) => edit(s, 'Hand copying also drops rows', 'The export must be fast. Hand copying also drops rows'), 'V01'],
    ['non-goals without bullets', (s) => edit(s, /## Non-goals\n\n(- [^\n]+\n)+/.exec(s)[0], '## Non-goals\n\nNothing else is in scope.\n'), 'NG01'],
    ['open question not deferred', (s) => edit(s, '## Open questions\n\nNone.', '## Open questions\n\n- Do auditors need the export?'), 'OQ01'],
    ['alert without a numeric threshold', (s) => edit(s, '> 2% over 15 min', 'is high'), 'OBS03'],
    ['signal without an AC', (s) => edit(s, ' · AC-1, AC-4; log event `export.rejected_permission` · AC-3', ''), 'OBS02'],
    ['rollout without flag or stages', (s) => edit(s, 'flag `reports.csvExport`, default off; stages 10% → 100% of finance analysts', 'all users at once'), 'OBS04'],
    ['rollback command not in backticks', (s) => edit(s, '| Rollback command | `flagctl set reports.csvExport off --env prod` |', '| Rollback command | switch the flag off |'), 'OBS05'],
    ['indicator without a numeric target', (s) => edit(s, '≤ 4 tickets/month', 'fewer tickets'), 'IND01'],
    ['security notes row empty', (s) => edit(s, '| Secrets | none — the feature reads no secret and adds no configuration value |', '| Secrets |  |'), 'SEC01'],
    ['routed down below the score', (s) => edit(s, 'R=1 · money', 'R=2 · money, auth'), 'H05'],
    ['risk count mismatch', (s) => edit(s, 'R=1 · money', 'R=2 · money'), 'H04'],
    ['size parts do not sum', (s) => edit(s, 'S=5 ·', 'S=4 ·'), 'H03'],
    ['critique missing on the current revision', (s) => edit(s, 'fresh-context · 12/12 · 3 fixed', 'reviewed'), 'REV03'],
    ['header revision ahead of the log', (s) => edit(s, '| Revision | 1 |', '| Revision | 2 |'), 'REV02'],
    ['intake decision missing', (s) => edit(s, /\| Intake \|[^\n]+\n/.exec(s)[0], ''), 'H07'],
    ['placeholder left in', (s) => edit(s, '| Issue | #412 |', '| Issue | {{tracker link}} |'), 'P01'],
    ['required section missing', (s) => edit(s, /## Indicator\n[\s\S]*?(?=## Open questions)/.exec(s)[0], ''), 'S01'],
    ['budget overflow', (s) => edit(s, '## Users', `${'word '.repeat(1000)}\n\n## Users`), 'BUD01'],
    ['Full path without threat model', (s) => edit(s, '| Path | Standard |', '| Path | Full |'), 'TM01'],
  ];
  for (const [name, mutate, rule] of cases) {
    await t.test(name, () => {
      const r = lint(mutate(SPEC));
      assert.ok(rules(r).includes(rule), `${rule} expected, got ${JSON.stringify(r.findings)}`);
    });
  }
});

test('a vague term followed by a number and unit in the same sentence is accepted', () => {
  const r = lint(edit(SPEC, 'Hand copying also drops rows', 'The export must be fast: p95 ≤ 3 s. Hand copying also drops rows'));
  assert.ok(!rules(r).includes('V01'));
});

test('a deferred open question with an owner is accepted', () => {
  const r = lint(edit(SPEC, '## Open questions\n\nNone.', '## Open questions\n\n- Do auditors need the export? deferred: Product Owner'));
  assert.ok(!rules(r).includes('OQ01'));
});

test('a threat model with a high threat must cite an active AC in its mitigation', () => {
  const full = edit(SPEC, '| Path | Standard |', '| Path | Full |');
  const tm = (mitigation) => `# Threat model\n\n| ID | Threat | Rating | Mitigation |\n|---|---|---|---|\n| T1 | Formula injection | high | ${mitigation} |\n`;
  assert.ok(rules(lint(full, { siblings: { 'threat-model.md': tm('escape cells') } })).includes('TM03'));
  assert.ok(!rules(lint(full, { siblings: { 'threat-model.md': tm('escape cells (AC-2)') } })).includes('TM03'));
});

test('editing the spec after approval voids the approval', () => {
  const r = lint(edit(SPEC, '50,000 rows; narrow the filter', '50,000 rows; refine the filter'), { checkApproval: true });
  assert.ok(rules(r).includes('AP04'));
  assert.deepEqual(rules(lint(SPEC, { checkApproval: true })), [], 'recording a waiver or approval does not change the hash');
});

test('approval check fails without an explicit yes, a register, or a later-turn answer', () => {
  assert.ok(rules(lint(edit(SPEC, '"Yes — approved: spec rev 1 and plan rev 1 as presented." | spec-lint', '"Sounds good" | spec-lint'), { checkApproval: true })).includes('AP05'));
  assert.ok(rules(lint(SPEC, { checkApproval: true, siblings: {} })).includes('AP07'));
  const sameTurn = REGISTER.replace('| 2026-11-23 10:05 | Product Owner | 2026-11-23 14:40 |', '| 2026-11-23 14:40 | Product Owner | 2026-11-23 14:40 |');
  assert.ok(rules(lint(SPEC, { checkApproval: true, siblings: { 'approvals.md': sameTurn } })).includes('AP08'));
  const wrongRole = REGISTER.replace('| 2026-11-23 10:05 | Product Owner |', '| 2026-11-23 10:05 | Tech Lead |');
  assert.ok(rules(lint(SPEC, { checkApproval: true, siblings: { 'approvals.md': wrongRole } })).includes('AP08'));
  const noRow = SPEC.replace(/\| Specify \+ Design \(combined\) \| 1 \|[^\n]+\n/, '');
  assert.ok(rules(lint(noRow, { checkApproval: true })).includes('AP01'));
  const rejected = edit(SPEC, '| approved |\n', '| rejected |\n');
  assert.ok(rules(lint(rejected, { checkApproval: true })).includes('AP02'));
});

test('waivers: recording one keeps the hash; bounds, owner and expiry are checked', () => {
  const valid = WAIVER_ROW('accept-risk | DoD coverage 77.9 < 78.4 | Important | Generated client excluded next sprint | Developer (agent) | Tech Lead · J. Park | 2026-11-24 | 2026-12-08 | #418');
  assert.equal(lint(valid).hash, lint(SPEC).hash);
  assert.deepEqual(rules(lint(valid, { checkApproval: true })), []);

  const selfOwned = WAIVER_ROW('defer | lint | Minor | follow-up next sprint | Tech Lead | Tech Lead | 2026-11-24 | 2026-12-01 | #419');
  assert.ok(rules(lint(selfOwned)).includes('WV02'));
  const solo = WAIVER_ROW('defer | lint | Minor | follow-up next sprint | Tech Lead | self · 1-person team | 2026-11-24 | 2026-12-01 | #419');
  assert.ok(!rules(lint(solo)).includes('WV02'));

  const critical = WAIVER_ROW('accept-risk | review finding F1 | Critical | ship today | Developer | Tech Lead | 2026-11-24 | 2026-11-30 | #420');
  assert.ok(rules(lint(critical)).includes('WV03'));
  const tooLong = WAIVER_ROW('emergency | Specify sign-off | Critical | incident INC-7 | SRE | Release Owner | 2026-11-24 | 2026-12-10 | INC-7');
  assert.ok(rules(lint(tooLong)).includes('WV04'));
  const noFollowUp = WAIVER_ROW('defer | lint | Minor | later | Developer | Tech Lead | 2026-11-24 | 2026-12-01 | later');
  assert.ok(rules(lint(noFollowUp)).includes('WV01'));

  const expired = WAIVER_ROW('accept-risk | DoD coverage | Important | known gap | Developer | Tech Lead | 2026-11-01 | 2026-11-15 | #421');
  assert.ok(rules(lint(expired, { checkApproval: true })).includes('WV05'));
  assert.ok(rules(lint(expired), 'warn').includes('WV05'));
  assert.ok(!rules(lint(expired)).includes('WV05'));
});

test('routing helpers take the stricter of size and risk', () => {
  assert.deepEqual([sizeRoute(3), sizeRoute(4), sizeRoute(5), sizeRoute(6), sizeRoute(7)], ['Quick', 'Quick', 'Standard', 'Standard', 'Full']);
  assert.equal(riskRoute([]), 'Quick');
  assert.equal(riskRoute(['money']), 'Standard');
  assert.equal(riskRoute(['personal/health data']), 'Full');
  assert.equal(riskRoute(['money', 'auth']), 'Full');
});

test('CLI: missing file and missing header exit 2; --json and --help', () => {
  const dir = makeDir('spec-lint');
  write(dir, 'spec.md', SPEC);
  write(dir, 'approvals.md', REGISTER);

  assert.equal(exec(join(dir, 'nope.md')).code, 2);
  assert.equal(exec(join(FIXTURES, 'no-header.md')).code, 2);
  assert.equal(exec(join(dir, 'spec.md'), join(FIXTURES, 'no-header.md')).code, 2, 'input error outranks findings');

  const json = exec(join(dir, 'spec.md'), '--json', '--check-approval', '--today', TODAY);
  assert.equal(json.code, 0, json.stdout + json.stderr);
  const parsed = JSON.parse(json.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.results[0].approval.rev, 1);

  write(dir, 'spec.md', edit(SPEC, 'Grafana › Reports › CSV export', 'Grafana › Reports › Export'));
  assert.equal(exec(join(dir, 'spec.md'), '--check-approval', '--today', TODAY).code, 1, 'edit after approval fails the gate');

  const help = exec('--help');
  assert.equal(help.code, 0);
  assert.match(help.stdout, /--check-approval/);
});
