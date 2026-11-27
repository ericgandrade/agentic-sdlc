#!/usr/bin/env node
// trace-check — mechanism 9.3: the two-way gap analysis of references/verification.md §5 from the files and
// `git log`. Follows AC → plan task → commit (`Refs:` trailer or `[Tn, AC-n]` subject) → acceptance test →
// PR Trace row → release notes → ops reading, and lists every orphan. Dependency-free, Node >= 18.
// Exit codes: 0 no orphan, 1 orphan / unsafe filter / zero-test run / ops reading due, 2 input missing or unparsable.

import { existsSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { commitFiles, defaultBranch, headSha, isRepo, log, refsFromMessage, topLevel } from './lib/git.mjs';
import { findSection, normalize, parseTables, readMarkdownFile } from './lib/md.mjs';
import { specAcIds, specPath } from './plan-graph.mjs';
import { acceptanceTestFiles, readPlanTasks } from './run-ledger.mjs';
import { readLedger } from './evidence.mjs';

const HELP = `Usage: node trace-check.mjs specs/NNN-slug [--base <ref>] [--pr <pr-body.md | review.md>] [--today YYYY-MM-DD]
                             [--write] [--json]

Follows each spec AC through plan.md ## Tasks (AC column), the commits of <base>..HEAD (merge commits skipped;
default base: the default branch), acceptance-tests.md ## Map, the PR ## Trace table (--pr, else review.md in
the folder), release-notes.md ## Shipped acceptance criteria and ops.md readings. --write writes
specs/NNN-slug/trace.md (a record file: it never changes the evidence fingerprint).
A segment is checked once its stage is reached: tasks when plan.md exists or code commits exist; commits,
tests and PR Trace once the range holds a code commit (tests also when acceptance-tests.md exists); release
notes when release-notes.md exists; ops once the Release sign-off is approved.
Evidence ledger rows count only when their command names a File of acceptance-tests.md ## Map (Quick #n rows never).
Artifact commit (exempt from TR05, not counted by TR04): a docs:, chore: or test: subject whose files are all
under docs/issues/, docs/reviews/, specs/, .agentic-sdlc/runs/ or listed in the acceptance-tests.md File column.
Rules: TR01 AC with no task · TR02 task with no AC · TR03 task cites an unknown AC · TR04 AC with no code
commit · TR05 code commit with no task · TR06 commit cites an unknown task or AC · TR07 AC with no test ·
TR08 test mapped to an unknown AC · TR09 test name lacks its AC ID (Standard/Full: does not start with it) ·
TR10 AC missing from the PR Trace table, marked orphan there, or unknown there · TR11 AC missing from the
release notes, or unknown there · TR12 no ops reading 14 days after release, or the latest is older than 14
days while the watch period is open · TR13 test filter without a non-digit lookahead (AC-2 also selects
AC-20) · TR14 filter not anchored (^AC-n) on Standard/Full · TR15 latest passing evidence row for an AC ran
0 tests (tests 0, 0 passing, no tests found, collected 0 items).
Exit codes: 0 no orphan · 1 any finding · 2 folder, spec.md, AC IDs, --pr file or git range missing or unparsable.`;

const AC_ID = /^AC-\d+$/;
const ARTIFACT_TYPE = /^(docs|chore|test)(\([^)]*\))?!?:/i;
const ARTIFACT_PATH = /^(docs\/issues\/|docs\/reviews\/|specs\/|\.agentic-sdlc\/runs\/)/;
const LOOKAHEAD = /^\(\?!(\[0-9\]|\\d)\)/;
const ZERO_TESTS = [/\btests?\b:?\s+0(?![\d.])/i, /\b0 (passing|passed|tests?)\b/i, /\bno tests? (were )?(found|ran)\b/i, /\bno test files found\b/i, /\bcollected 0 items\b/i];
const DATE = /\d{4}-\d{2}-\d{2}/;
const OPS_DAYS = 14;

const clean = (v) => String(v ?? '').replace(/`/g, '').replace(/\*\*/g, '').trim();
const placeholder = (v) => /^</.test(clean(v));
const acRe = (ac, anchored) => new RegExp(`${anchored ? '^' : ''}${ac}(?![0-9])`);
const dayMs = (d) => Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10));
const daysBetween = (a, b) => Math.round((dayMs(b) - dayMs(a)) / 86_400_000);
const short = (sha) => sha.slice(0, 7);

// Rows of the first table in `title` (or the whole document) as { lowercase header: cell } objects.
function rows(md, title, test = () => true) {
  const text = normalize(md).replace(/<!--[\s\S]*?-->/g, '');
  const body = title ? findSection(text, title)?.body : text;
  if (body == null) return null;
  const table = parseTables(body).find((t) => test(t.header.map((h) => clean(h).toLowerCase())));
  if (!table) return null;
  const keys = table.header.map((h) => clean(h).toLowerCase());
  return table.rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, clean(r[i])])));
}

const pick = (row, re) => row[Object.keys(row).find((k) => re.test(k))] ?? '';

// Every Command cell of every table in a document.
function commandCells(md) {
  const out = [];
  for (const t of parseTables(normalize(md).replace(/<!--[\s\S]*?-->/g, ''))) {
    const col = t.header.findIndex((h) => /^command$/i.test(clean(h)));
    if (col >= 0) for (const r of t.rows) if (r[col] && !placeholder(r[col])) out.push(clean(r[col]));
  }
  return out;
}

function readOptional(file) {
  return existsSync(file) ? readMarkdownFile(file) : null;
}

export function traceCheck(dirArg, { base: baseArg = null, pr = null, today = new Date().toISOString().slice(0, 10) } = {}) {
  const dir = resolve(dirArg);
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new InputError(`spec folder not found: ${dirArg}`);
  if (!existsSync(join(dir, 'spec.md'))) throw new InputError(`${dirArg} has no spec.md`);
  if (pr && !existsSync(pr)) throw new InputError(`--pr file not found: ${pr}`);
  if (!isRepo(dir)) throw new InputError(`not a git repository: ${dir}`);
  const specMd = readMarkdownFile(join(dir, 'spec.md'));
  const acs = specAcIds(specMd);
  if (!acs.length) throw new InputError(`${dirArg}/spec.md defines no AC-n IDs`);
  const path = specPath(specMd) || 'Standard';
  const anchored = path !== 'Quick';
  const planMd = readOptional(join(dir, 'plan.md'));
  const atMd = readOptional(join(dir, 'acceptance-tests.md'));
  const prFile = pr || (existsSync(join(dir, 'review.md')) ? join(dir, 'review.md') : null);
  const prMd = prFile ? readMarkdownFile(prFile) : null;
  const notesMd = readOptional(join(dir, 'release-notes.md'));
  const opsMd = readOptional(join(dir, 'ops.md'));

  const findings = [];
  const warnings = [];
  const add = (rule, id, message) => findings.push({ rule, id, message });
  const known = new Set(acs);

  // Commits: repository paths are made relative to the project (the folder that holds specs/).
  const root = topLevel(dir);
  const prefix = relative(root, resolve(dir, '..', '..')).split(sep).join('/');
  const toProject = (f) => (!prefix ? f : f.startsWith(prefix + '/') ? f.slice(prefix.length + 1) : null);
  const testFiles = new Set(acceptanceTestFiles(dir));
  const isArtifactPath = (f) => f !== null && (ARTIFACT_PATH.test(f) || testFiles.has(f));
  const base = baseArg || defaultBranch(root);
  const range = `${base}..HEAD`;
  const commits = log({ cwd: root, range, noMerges: true }).map((c) => {
    const files = commitFiles(c.sha, { cwd: root }).map(toProject);
    const refs = refsFromMessage(`${c.subject}\n\n${c.body}`);
    const kind = ARTIFACT_TYPE.test(c.subject) && files.every(isArtifactPath) ? 'artifact' : 'code';
    return { sha: c.sha, subject: c.subject, kind, tasks: refs.tasks, acs: refs.acs };
  });
  const code = commits.filter((c) => c.kind === 'code');
  const built = code.length > 0;

  const tasks = planMd ? readPlanTasks(planMd).tasks : [];
  const taskAcs = Object.fromEntries(tasks.map((t) => [t.id, t.acs]));
  const segments = {
    tasks: planMd || built ? 'checked' : 'not-reached',
    commits: built ? 'checked' : 'not-reached',
    tests: atMd || built ? 'checked' : 'not-reached',
    pr: prMd && built ? 'checked' : 'not-reached',
    release: notesMd ? 'checked' : 'not-reached',
    ops: 'not-reached',
  };
  if (!prMd && built) warnings.push('no --pr file and no review.md: the PR Trace table is not checked');

  // Tasks.
  for (const t of tasks) {
    if (!t.acs.length) add('TR02', t.id, `${t.id} names no AC: remove it, or add the AC through the change protocol`);
    for (const a of t.acs.filter((x) => !known.has(x))) add('TR03', t.id, `${t.id} cites ${a}, which the spec does not define`);
  }
  // Commits.
  for (const c of commits) {
    for (const id of [...c.tasks.filter((x) => planMd && !(x in taskAcs)), ...c.acs.filter((x) => !known.has(x))]) {
      add('TR06', short(c.sha), `${short(c.sha)} "${c.subject}" cites ${id}, which the ${id.startsWith('T') ? 'plan' : 'spec'} does not define`);
    }
    if (c.kind === 'code' && !c.tasks.length) add('TR05', short(c.sha), `code commit ${short(c.sha)} "${c.subject}" names no task (Refs: Tn AC-n); reword it before merge`);
  }
  // Tests (acceptance-tests.md ## Map).
  const map = [];
  for (const r of (atMd && rows(atMd, 'Map', (h) => h.includes('ac'))) || []) {
    const ac = (r.ac.match(/AC-\d+/) || [])[0];
    if (!ac || placeholder(r.ac)) continue;
    const id = pick(r, /^test id$/) || ac;
    const name = pick(r, /^test name/);
    if (!known.has(ac)) { add('TR08', id, `${id} is mapped to ${ac}, which the spec does not define`); continue; }
    if (!acRe(ac, anchored).test(name)) {
      add('TR09', id, `${id} name "${name}" ${anchored ? 'does not start with' : 'does not contain'} ${ac} (followed by a non-digit): a filter for ${ac} cannot select it`);
      continue;
    }
    map.push({ ac, id, name, file: pick(r, /^file$/) });
  }
  // PR ## Trace table.
  const prRows = new Map();
  if (segments.pr === 'checked') {
    for (const r of rows(prMd, /^trace$/i, (h) => h.includes('ac') && h.includes('status')) || []) {
      const ac = clean(r.ac);
      if (!AC_ID.test(ac) || placeholder(r.status)) continue;
      if (!known.has(ac)) add('TR10', ac, `${basename(prFile)} ## Trace lists ${ac}, which the spec does not define`);
      else if (/^orphan/i.test(r.status)) add('TR10', ac, `${basename(prFile)} ## Trace marks ${ac} "${r.status}"`);
      prRows.set(ac, r.status);
    }
  }
  // Release notes ## Shipped acceptance criteria.
  const shipped = new Set();
  if (notesMd) {
    for (const r of rows(notesMd, /^shipped acceptance criteria/i, (h) => h.includes('ac')) || []) {
      const ac = clean(r.ac);
      if (!AC_ID.test(ac)) continue;
      if (!known.has(ac)) add('TR11', ac, `release-notes.md lists ${ac}, which the spec does not define`);
      shipped.add(ac);
    }
  }

  // Forward: every AC.
  const matrix = acs.map((ac) => {
    const acTasks = tasks.filter((t) => t.acs.includes(ac)).map((t) => t.id);
    const acCommits = code.filter((c) => c.acs.includes(ac) || c.tasks.some((t) => (taskAcs[t] || []).includes(ac))).map((c) => short(c.sha));
    const acTests = map.filter((m) => m.ac === ac).map((m) => m.id);
    if (segments.tasks === 'checked' && !acTasks.length) add('TR01', ac, `${ac} has no task in plan.md ## Tasks: back to Design`);
    if (segments.commits === 'checked' && !acCommits.length) add('TR04', ac, `${ac} has no code commit in ${range} (via Refs: or a task that serves it)`);
    if (segments.tests === 'checked' && !acTests.length) add('TR07', ac, `${ac} has no test in acceptance-tests.md ## Map: back to the Test Engineer`);
    if (segments.pr === 'checked' && !prRows.has(ac)) add('TR10', ac, `${ac} has no filled row in the ${basename(prFile)} ## Trace table`);
    if (notesMd && !shipped.has(ac)) add('TR11', ac, `${ac} is missing from release-notes.md ## Shipped acceptance criteria`);
    return { ac, tasks: acTasks, commits: acCommits, tests: acTests, pr: prRows.get(ac) ?? null, released: notesMd ? shipped.has(ac) : null };
  });

  // Ops reading once released.
  const ops = { released: false, releaseDate: null, latestReading: null, watchClosed: false };
  const approval = notesMd && (rows(notesMd, /^approval$/i, (h) => h.includes('sign-off')) || []).filter((r) => /^release/i.test(r['sign-off'])).pop();
  if (approval && /^approved/i.test(pick(approval, /^decision$/))) {
    ops.released = true;
    segments.ops = 'checked';
    const deploy = (rows(notesMd, /^deploy log$/i) || []).map((r) => Object.values(r).slice(1).join(' ').match(DATE)).find(Boolean);
    ops.releaseDate = (opsMd && (opsMd.match(/\*\*Release date:\*\*\s*(\d{4}-\d{2}-\d{2})/) || [])[1]) || (deploy && deploy[0])
      || (pick(approval, /^date/).match(DATE) || [])[0] || null;
    const readings = [];
    for (const title of [/^indicator readings/i, /^watch readings/i]) {
      for (const r of (opsMd && rows(opsMd, title)) || []) {
        const d = (Object.values(r)[0] || '').match(DATE);
        if (d && !placeholder(Object.values(r)[0])) readings.push(d[0]);
      }
    }
    ops.latestReading = readings.sort().pop() || null;
    ops.watchClosed = ((opsMd && rows(opsMd, /^watch period result/i)) || []).some((r) => /^result$/i.test(Object.values(r)[0]) && /^closed/i.test(Object.values(r)[1] || ''));
    if (!ops.releaseDate) warnings.push('released, but no release date in ops.md, the Deploy log or the Release approval: ops reading age not checked');
    else if (!ops.latestReading) {
      const age = daysBetween(ops.releaseDate, today);
      if (age > OPS_DAYS) add('TR12', 'ops', `no indicator or watch reading ${age} days after the ${ops.releaseDate} release (${opsMd ? 'ops.md has no dated reading' : 'no ops.md'}); due ≤ ${OPS_DAYS} days`);
    } else if (!ops.watchClosed) {
      const age = daysBetween(ops.latestReading, today);
      if (age > OPS_DAYS) add('TR12', 'ops', `latest ops reading ${ops.latestReading} is ${age} days old and the watch period is open; record a reading or close the watch`);
    }
  }

  // Test filters: every command that names an AC ID must end it with a non-digit lookahead (and anchor it).
  // The ledger is repository-wide and AC IDs are local to one item: keep only this item's rows, the ones whose
  // command names one of its acceptance-test files (no File column: any row for its ACs), never a Quick #n row.
  const ledger = readLedger(root).rows.filter((x) => {
    const cmd = String(x.cmd || '');
    if (/#\d+\s+AC-\d/.test(cmd)) return false;
    return testFiles.size ? [...testFiles].some((f) => cmd.includes(f)) : x.acs.some((a) => known.has(a));
  });
  const commands = [
    ...(atMd ? commandCells(atMd).map((cmd) => ['acceptance-tests.md', cmd]) : []),
    ...(prMd ? commandCells(prMd).map((cmd) => [basename(prFile), cmd]) : []),
    ...ledger.map((x) => ['evidence ledger', String(x.cmd || '')]),
  ];
  const seen = new Set();
  for (const [src, cmd] of commands) {
    for (const m of cmd.matchAll(/AC-(\d+)/g)) {
      const ac = m[0];
      const key = `${cmd}\0${m.index}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!LOOKAHEAD.test(cmd.slice(m.index + ac.length))) {
        add('TR13', ac, `${src}: \`${cmd}\` selects ${ac} without a non-digit lookahead, so it also selects ${ac}0…; write ${ac}(?![0-9])`);
      }
      if (anchored && cmd[m.index - 1] !== '^') {
        add('TR14', ac, `${src}: \`${cmd}\` does not anchor ${ac} (^${ac}(?![0-9])); on ${path} test names start with the AC ID`);
      }
    }
  }
  // Zero-test runs: the latest passing ledger row of an AC whose output shows that no test ran.
  for (const ac of acs) {
    const latest = ledger.filter((x) => x.acs.includes(ac)).pop();
    if (latest && latest.exit === 0 && ZERO_TESTS.some((re) => re.test(String(latest.tail || '')))) {
      add('TR15', ac, `the latest passing evidence row for ${ac} (\`${latest.cmd}\`) ran 0 tests: the filter selects nothing, which is a failure`);
    }
  }

  const orphanIds = new Set(findings.map((f) => f.id));
  for (const row of matrix) row.status = orphanIds.has(row.ac) ? 'orphan' : 'ok';
  const backTasks = tasks.map((t) => ({ id: t.id, acs: t.acs, commits: code.filter((c) => c.tasks.includes(t.id)).map((c) => short(c.sha)) }));
  return {
    dir: dirArg, path, base, range, head: headSha(root), today, segments, acs: matrix, tasks: backTasks,
    commits: commits.map((c) => ({ ...c, sha: short(c.sha) })), ops, findings, warnings, ok: findings.length === 0,
  };
}

const list = (xs) => (xs && xs.length ? xs.join(', ') : '—');

export function renderTrace(r) {
  const slug = basename(resolve(r.dir));
  const out = [
    `# Trace — ${slug}`,
    '',
    `Written by \`trace-check ${r.dir} --write\` on ${r.today} · range \`${r.base}..${(r.head || '').slice(0, 12)}\` · path ${r.path}. Regenerate it; never edit it by hand.`,
    '',
    '## Forward (AC → evidence)',
    '',
    '| AC | Tasks | Commits | Tests | PR Trace | Release notes | Status |',
    '|---|---|---|---|---|---|---|',
    ...r.acs.map((a) => `| ${a.ac} | ${list(a.tasks)} | ${list(a.commits.map((c) => `\`${c}\``))} | ${list(a.tests)} | ${a.pr ?? '—'} | ${a.released === null ? '—' : a.released ? 'listed' : 'missing'} | ${a.status} |`),
    '',
    '## Backward (task and commit → AC)',
    '',
    '| Item | Kind | Cites | Subject or commits |',
    '|---|---|---|---|',
    ...r.tasks.map((t) => `| ${t.id} | task | ${list(t.acs)} | ${list(t.commits.map((c) => `\`${c}\``))} |`),
    ...r.commits.map((c) => `| \`${c.sha}\` | ${c.kind} | ${list([...c.tasks, ...c.acs])} | ${c.subject.replace(/\|/g, '\\|')} |`),
    '',
    `Segments: ${Object.entries(r.segments).map(([k, v]) => `${k} ${v}`).join(' · ')}`,
    '',
    `**Orphans:** ${r.findings.length ? '' : 'none'}`,
    ...r.findings.map((f) => `- ${f.rule} ${f.id}: ${f.message}`),
  ];
  return out.join('\n') + '\n';
}

function format(r) {
  const out = [`trace-check ${r.dir} · ${r.path} · ${r.range} (${r.commits.length} commits: ${r.commits.filter((c) => c.kind === 'code').length} code)`];
  for (const a of r.acs) {
    out.push(`  ${a.ac.padEnd(6)} tasks ${list(a.tasks)} · commits ${list(a.commits)} · tests ${list(a.tests)} · PR ${a.pr ?? '—'} · ${a.status}`);
  }
  out.push(`  segments: ${Object.entries(r.segments).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  for (const f of r.findings) out.push(`  ERROR ${f.rule} ${f.id}: ${f.message}`);
  for (const w of r.warnings) out.push(`  WARN ${w}`);
  if (r.wrote) out.push(`  wrote ${r.wrote}`);
  out.push(r.ok ? 'Result: PASS (no orphans)' : `Result: FAIL (${r.findings.length} findings)`);
  return out;
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv, { booleans: ['json', 'help', 'write'] });
  if (flags.help) { out.write(HELP + '\n'); return EXIT.PASS; }
  for (const k of ['base', 'pr', 'today']) if (flags[k] === true) throw new InputError(`--${k} needs a value`);
  if (positional.length !== 1) throw new InputError('name one spec folder: trace-check specs/NNN-slug (see --help)');
  if (flags.today && !/^\d{4}-\d{2}-\d{2}$/.test(flags.today)) throw new InputError('--today must be YYYY-MM-DD');
  const r = traceCheck(positional[0], { base: flags.base || null, pr: flags.pr ? resolve(flags.pr) : null, today: flags.today || undefined });
  if (flags.write) {
    const file = join(resolve(positional[0]), 'trace.md');
    writeFileSync(file, renderTrace(r));
    r.wrote = file;
  }
  return report({ ok: r.ok, json: flags.json, result: r, lines: format(r) }, out);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run(() => main());
