#!/usr/bin/env node
// approval-check — mechanism 10.4: verifies every sign-off record of a spec folder against the current
// artifacts (references/governance.md §1–§6) and refuses approver = PR author unless a valid waiver covers it.
// Dependency-free, Node >= 18. Exit codes: 0 pass, 1 check failed, 2 input missing or unparsable.

import { existsSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { contentHash, findSection, normalize, parseTables, readMarkdownFile } from './lib/md.mjs';
import { fingerprint, isRepo } from './lib/git.mjs';
import { planHash, specPath } from './plan-graph.mjs';
import { EXPLICIT_YES, NOT_APPROVAL, parseDate, unquote, waiverFindings } from './spec-lint.mjs';

const HELP = `Usage: node approval-check.mjs [specs/NNN-slug ...] [--pr <pr-body.md | review.md>] [--author <login or name>]
                              [--head <40-hex sha>] [--today YYYY-MM-DD] [--json]

Verifies each sign-off present and each one the path requires for a stage already reached:
  Specify  spec.md ## Approvals           rev = header Revision, Hash = current spec hash
  Design   plan.md ## Approvals           Plan rev = latest Revision log rev, Plan hash and Spec hash current
  Test     ## Test sign-off of the review record (review.md, docs/reviews/*.md; no PR host): head SHA
           (= --head when given) or 12-hex fingerprint (= current fingerprint). A PR body without a filled
           row leaves the Test sign-off to the host review (branch protection): status "host".
  Release  release-notes.md ## Approval   bound to a tag
Required: Standard/Full → Specify, Design (when plan.md exists), Test (when filled, or when release notes
exist), Release (when release notes exist); Full → two distinct Test approvers in a review record;
Quick → Test (and Release when release notes exist).
Rules: SO01 required sign-off missing · SO02 role missing or not the owner role · SO03 person missing ·
SO04 exact words missing or not an explicit approval · SO05 rev mismatch · SO06 binding hash or SHA
mismatch (stale) · SO07 time missing or invalid · SO08 Test or Release approver = PR author (--author) without a valid
waiver whose Gate waived names the author or self-approval · SO09 invalid or expired waiver ·
SO10 binding row not approved.
Exit codes: 0 pass · 1 check failed · 2 folder, spec.md or --pr file missing, or a table lacks columns.`;

export const STAGES = ['Specify', 'Design', 'Test', 'Release'];
const OWNER = { Specify: /product owner/i, Design: /tech lead/i, Test: /reviewer|engineer/i, Release: /release owner/i };
const NONE = /^(—|–|-|none|n\/a)?$/i;
const PLACEHOLDER = /^<.*>$/; // unfilled template cell
const HEX12 = /^[0-9a-f]{12}$/;
const HEX40 = /^[0-9a-f]{40}$/;

const clean = (v) => String(v ?? '').replace(/`/g, '').replace(/\*\*/g, '').trim();
const norm = (v) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Rows of the first table in a section whose header passes `test`, as objects keyed by lowercase header.
function sectionRows(md, title, test = () => true) {
  const sec = findSection(normalize(md).replace(/<!--[\s\S]*?-->/g, ''), title);
  if (!sec) return null;
  const table = parseTables(sec.body).find((t) => test(t.header.map((h) => clean(h).toLowerCase())));
  if (!table) return null;
  const keys = table.header.map((h) => clean(h).toLowerCase());
  return table.rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, clean(r[i])])));
}

function pick(row, ...patterns) {
  for (const re of patterns) {
    const k = Object.keys(row).find((x) => re.test(x));
    if (k) return row[k];
  }
  return '';
}

function need(rows, cols, label) {
  if (!rows || rows.length === 0) return;
  const lacking = cols.filter((re) => !Object.keys(rows[0]).some((k) => re.test(k)));
  if (lacking.length) throw new InputError(`${label} lacks column(s): ${lacking.map((r) => r.source).join(', ')}`);
}

export function isReviewRecord(file) {
  return basename(file) === 'review.md' || /(^|[\\/])docs[\\/]reviews[\\/]/.test(file);
}

// One record from a stage's binding row. `bind` = [{ label, recorded, current }]; current null = unverifiable.
function record(stage, source, f, bind) {
  const hashValid = bind.every((b) => b.ok !== false) ? (bind.some((b) => b.ok === null) ? null : true) : false;
  return { stage, source, status: 'valid', ...f, hash: bind.map((b) => b.recorded).join(' '), hashValid, bind };
}

function readSpecify(file, md) {
  const rows = sectionRows(md, /^approvals\b/i, (h) => h.includes('sign-off') && h.some((x) => /hash/.test(x)));
  need(rows, [/^sign-off$/, /hash/, /^role$/, /^person$/, /exact words/, /^decision$/], `${file} ## Approvals`);
  const row = (rows || []).filter((r) => /^specify/i.test(r['sign-off'])).pop();
  if (!row) return null;
  const rev = (md.match(/^\|\s*Revision\s*\|\s*(\d+)\s*\|/im) || [])[1] || null;
  const recorded = pick(row, /^spec hash$/, /^hash$/).replace(/^sha256[:\s]*/i, '');
  const current = contentHash(md);
  return record('Specify', file, {
    role: pick(row, /^role$/), person: pick(row, /^person$/), words: unquote(pick(row, /exact words/)),
    rev: pick(row, /^spec rev$/, /^rev$/), revExpected: rev, time: pick(row, /^date/), decision: pick(row, /^decision$/),
  }, [{ label: 'spec hash', recorded, current, ok: recorded === current }]);
}

function readDesign(file, md, specMd) {
  const rows = sectionRows(md, /^approvals\b/i, (h) => h.includes('sign-off'));
  need(rows, [/^sign-off$/, /^plan rev$/, /^plan hash$/, /^spec hash$/, /^role$/, /^person$/, /exact words/, /^decision$/], `${file} ## Approvals`);
  const row = (rows || []).filter((r) => !NONE.test(r['sign-off'])).pop();
  if (!row) return null;
  const revRows = sectionRows(md, /^revision log\b/i) || [];
  const revs = revRows.map((r) => Number(String(Object.values(r)[0]).replace(/\D/g, ''))).filter((n) => n > 0);
  const pHash = planHash(md);
  const sHash = contentHash(specMd);
  return record('Design', file, {
    role: row.role, person: row.person, words: unquote(row['exact words']), rev: row['plan rev'].replace(/\D/g, ''),
    revExpected: revs.length ? String(Math.max(...revs)) : null, time: pick(row, /^date/), decision: row.decision,
  }, [
    { label: 'plan hash', recorded: row['plan hash'], current: pHash, ok: row['plan hash'] === pHash },
    { label: 'spec hash', recorded: row['spec hash'], current: sHash, ok: row['spec hash'] === sHash },
  ]);
}

// Test rows (filled, not pending) of a review record or PR body.
function readTest(file, md, { head, cwd }) {
  const rows = sectionRows(md, /^test sign-off\b/i, (h) => h.includes('gate'));
  need(rows, [/^gate$/, /exact words|decision/, /approver/, /^date|time/, /sha|fingerprint/], `${file} ## Test sign-off`);
  const filled = (rows || []).filter((r) => /^test$/i.test(r.gate) && !/^pending\b/i.test(unquote(pick(r, /exact words|decision/)))
    && !PLACEHOLDER.test(pick(r, /exact words|decision/)));
  let fp;
  return filled.map((r) => {
    const approver = pick(r, /approver/);
    const m = approver.match(/^(.*?)\s*[,·]\s*(.+)$/);
    const recorded = pick(r, /sha|fingerprint/).toLowerCase();
    let current = null;
    let ok = false;
    if (HEX40.test(recorded)) { current = head || null; ok = head ? recorded === head.toLowerCase() : null; }
    else if (HEX12.test(recorded)) {
      if (fp === undefined) fp = isRepo(cwd) ? fingerprint({ cwd }).short : null;
      current = fp;
      ok = fp ? recorded === fp : null;
    }
    return record('Test', file, {
      role: m ? m[1] : '', person: m ? m[2] : approver, words: unquote(pick(r, /exact words|decision/)),
      rev: null, revExpected: null, time: pick(r, /^date|time/), decision: 'approved',
    }, [{ label: 'head SHA or fingerprint', recorded, current, ok }]);
  });
}

function readRelease(file, md) {
  const rows = sectionRows(md, /^approval$/i, (h) => h.includes('sign-off'));
  need(rows, [/^sign-off$/, /^bound to/, /^role$/, /^person$/, /exact words/, /^decision$/], `${file} ## Approval`);
  const row = (rows || []).filter((r) => /^release/i.test(r['sign-off'])).pop();
  if (!row) return null;
  const bound = pick(row, /^bound to/);
  const tag = (bound.match(/\bv?\d+\.\d+\.\d+\S*/) || [''])[0];
  return record('Release', file, {
    role: row.role, person: row.person, words: unquote(row['exact words']), rev: null, revExpected: null,
    time: pick(row, /^date/), decision: row.decision,
  }, [{ label: 'tag', recorded: tag, current: null, ok: tag ? null : false }]);
}

function waiverRows(md) {
  const rows = sectionRows(md, /^waivers$/i, (h) => h.some((x) => /^kind\b/.test(x))) || [];
  return rows.filter((r) => !NONE.test(pick(r, /^id$/)) && !PLACEHOLDER.test(pick(r, /^id$/)));
}

export function sameActor(person, author) {
  if (!author) return false;
  const a = String(author).trim().replace(/^@/, '').toLowerCase();
  return norm(person) === norm(a) || new RegExp(`@${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'i').test(person);
}

// Checks one spec folder (or, with dir null, a Quick review record given by --pr).
export function checkFolder(dir, { pr = null, author = null, head = null, today } = {}) {
  const findings = [];
  const add = (rule, stage, message) => findings.push({ rule, stage, message });
  const todayDate = parseDate(today || new Date().toISOString().slice(0, 10));
  const read = (name) => (dir && existsSync(join(dir, name)) ? readMarkdownFile(join(dir, name)) : null);
  if (dir) {
    if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new InputError(`spec folder not found: ${dir}`);
    if (!existsSync(join(dir, 'spec.md'))) throw new InputError(`${dir} has no spec.md`);
  }
  if (pr && !existsSync(pr)) throw new InputError(`--pr file not found: ${pr}`);
  const specMd = read('spec.md');
  const planMd = read('plan.md');
  const releaseMd = read('release-notes.md');
  const path = specMd ? specPath(specMd) || 'Standard' : 'Quick';
  const prMd = pr ? readMarkdownFile(pr) : null;
  const reviewFile = pr && isReviewRecord(pr) ? pr : dir && existsSync(join(dir, 'review.md')) ? join(dir, 'review.md') : null;
  const reviewMd = reviewFile ? (reviewFile === pr ? prMd : readMarkdownFile(reviewFile)) : null;
  const cwd = dir || dirname(resolve(pr));

  const signOffs = [];
  const standard = path !== 'Quick';
  const stub = (stage, status, source = null) => ({ stage, source, status });
  const one = (stage, required, rec, source) => {
    if (rec) signOffs.push(rec);
    else if (required) { signOffs.push(stub(stage, 'missing', source)); add('SO01', stage, `${stage} sign-off required on ${path} is missing in ${source}`); }
    else signOffs.push(stub(stage, standard || stage === 'Test' || stage === 'Release' ? 'not-reached' : 'not-required', source));
  };

  if (!standard) { signOffs.push(stub('Specify', 'not-required')); signOffs.push(stub('Design', 'not-required')); }
  else {
    const sp = join(dir, 'spec.md');
    one('Specify', true, readSpecify(sp, specMd), sp);
    if (planMd) one('Design', true, readDesign(join(dir, 'plan.md'), planMd, specMd), join(dir, 'plan.md'));
    else signOffs.push(stub('Design', 'not-reached'));
  }

  // Test: the review record binds (no PR host); a PR body's filled row is checked too; otherwise the host review.
  const tests = reviewMd ? readTest(reviewFile, reviewMd, { head, cwd }) : [];
  if (!tests.length && prMd && pr !== reviewFile) tests.push(...readTest(pr, prMd, { head, cwd }));
  if (tests.length) {
    signOffs.push(...tests);
    const distinct = new Set(tests.map((t) => norm(t.person)));
    if (path === 'Full' && reviewMd && distinct.size < 2) add('SO01', 'Test', `Full path needs 2 distinct Test approvers in ${reviewFile}; found ${distinct.size}`);
  } else if (reviewMd) one('Test', !!releaseMd, null, reviewFile);
  else if (prMd) signOffs.push(stub('Test', 'host', pr));
  else one('Test', false, null, null);

  const rp = dir ? join(dir, 'release-notes.md') : null;
  if (releaseMd) one('Release', true, readRelease(rp, releaseMd), rp);
  else signOffs.push(stub('Release', 'not-reached'));

  // Waivers from every record read: invalid or expired ones fail (SO09); valid ones may cover approver = author.
  const waivers = [];
  for (const [src, md] of [[dir && join(dir, 'spec.md'), specMd], [reviewFile, reviewMd], [pr, prMd], [rp, releaseMd]]) {
    if (!md || waivers.some((w) => w.src === src)) continue;
    for (const w of waiverRows(md)) {
      const errs = waiverFindings(w, todayDate);
      for (const e of errs) add('SO09', null, `${src}: ${e.rule} ${e.message}`);
      waivers.push({ src, id: pick(w, /^id$/), gate: pick(w, /^gate/), valid: errs.length === 0 });
    }
  }
  const authorWaiver = waivers.find((w) => w.valid && /author|self-approv/i.test(w.gate)) || null;

  for (const s of signOffs.filter((x) => x.status === 'valid')) {
    const bad = (rule, message) => { s.status = 'invalid'; add(rule, s.stage, `${s.source}: ${message}`); };
    if (NONE.test(s.role || '')) bad('SO02', `${s.stage} row has no role`);
    else if (!OWNER[s.stage].test(s.role)) bad('SO02', `${s.stage} role "${s.role}" is not the owner role (references/governance.md §1)`);
    if (NONE.test(s.person || '')) bad('SO03', `${s.stage} row has no person`);
    if (!s.words || !EXPLICIT_YES.test(s.words) || NOT_APPROVAL.test(s.words)) bad('SO04', `exact words "${s.words}" are not an explicit approval`);
    if (s.revExpected != null && s.rev !== s.revExpected) bad('SO05', `${s.stage} approval is for rev ${s.rev || '(none)'}, current rev is ${s.revExpected}`);
    for (const b of s.bind) {
      if (b.ok === false) bad('SO06', `${b.label} ${b.recorded || '(none)'} ≠ current ${b.current ?? '(not a 12-hex hash, 40-hex SHA or tag)'}: the approval is stale`);
    }
    if (!parseDate(s.time)) bad('SO07', `time "${s.time}" is not YYYY-MM-DD[ HH:MM] or ISO-8601`);
    if (!/^approved( with conditions)?$/i.test(s.decision || '')) bad('SO10', `binding ${s.stage} row decision is "${s.decision || 'empty'}"`);
    // Separation of duties covers the code: the PR author never approves its Test or Release sign-off.
    // Specify and Design are approved before the PR exists, so a Tech Lead may approve the plan and open the PR.
    if ((s.stage === 'Test' || s.stage === 'Release') && sameActor(s.person, author)) {
      if (authorWaiver) s.waiver = authorWaiver.id;
      else bad('SO08', `${s.stage} approver "${s.person}" is the PR author "${author}" and no valid waiver covers it (references/governance.md §6)`);
    }
  }
  return { dir, pr, path, signOffs, waivers, findings, ok: findings.length === 0 };
}

export function checkAll(dirs, opts = {}) {
  const folders = dirs.length ? dirs.map((d) => checkFolder(d, opts)) : [checkFolder(null, opts)];
  return { folders, ok: folders.every((f) => f.ok) };
}

function format(f) {
  const out = [`approval-check ${f.dir || f.pr} · ${f.path}`];
  for (const s of f.signOffs) {
    const detail = s.status === 'valid' || s.status === 'invalid' ? ` · ${s.role} · ${s.person} · ${s.hash || '—'}${s.waiver ? ` · waiver ${s.waiver}` : ''}` : '';
    out.push(`  ${s.stage.padEnd(8)} ${s.status}${detail}`);
  }
  for (const x of f.findings) out.push(`  ERROR ${x.rule}${x.stage ? ` ${x.stage}` : ''}: ${x.message}`);
  out.push(f.ok ? 'PASS' : `FAIL (${f.findings.length} errors)`);
  return out;
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv);
  if (flags.help) { out.write(HELP + '\n'); return EXIT.PASS; }
  for (const k of ['pr', 'author', 'head', 'today']) {
    if (flags[k] === true) throw new InputError(`--${k} needs a value`);
  }
  if (!positional.length && !flags.pr) throw new InputError('name a spec folder or --pr <file> (see --help)');
  if (flags.today && !parseDate(flags.today)) throw new InputError('--today must be YYYY-MM-DD');
  if (flags.head && !HEX40.test(String(flags.head).toLowerCase())) throw new InputError('--head must be a 40-hex commit SHA');
  const result = checkAll(positional, { pr: flags.pr || null, author: flags.author || null, head: flags.head || null, today: flags.today });
  return report({ ok: result.ok, json: flags.json, result, lines: result.folders.flatMap(format) }, out);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run(() => main());
