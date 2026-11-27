#!/usr/bin/env node
// status — the "what now?" command. Applies the router Step 0 table to the repository's artifacts and
// prints the state, the evidence for it (file:line) and the next steps from references/next-steps.json.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { fingerprint, headSha, isRepo, log, refsFromMessage, topLevel } from './lib/git.mjs';
import { findSection, normalize, parseTables, readMarkdownFile } from './lib/md.mjs';
import { approvalState, readPlanTasks, specApproval } from './run-ledger.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
// Data files sit in the skill's references/; a vendored copy in .agentic-sdlc/bin/ keeps them next to itself.
const dataFile = (name) => [join(HERE, '..', 'references', name), join(HERE, name)].find(existsSync);

const HELP = `Usage: node status.mjs [--json] [--next] [--topic <name>] [--help]

Detects the Agentic SDLC state of the current repository (router Step 0 table, first match from the top):
reads the AGENTS.md block, specs/*/spec.md, approvals, plan.md, commits (Refs: Tn), the PR body or review
record (## Verification), release notes and retro records. Prints the state, its evidence (file:line) and
at most 3 next steps.
  --next   print only the next-step lines (stage skills end with it)
  --topic  print a help topic: blocked, resume, path, approvals, extensions
Exit codes: 0 state detected · 2 an artifact is unparsable (state UNKNOWN) or the topic is unknown.`;

// Router row order: the earliest open stage wins across spec folders.
const RANK = { NO_BLOCK: 1, NO_SPEC: 2, SPEC_UNAPPROVED: 3, PLAN_MISSING: 4, PLAN_UNAPPROVED: 5, TASKS_OPEN: 6, PR_WITHOUT_EVIDENCE: 7, RELEASED_WITHOUT_RETRO: 8, RETRO_ACTIONS_OPEN: 9, NOTHING_OPEN: 10 };

export function loadNextSteps() {
  const p = dataFile('next-steps.json');
  if (!p) throw new InputError('references/next-steps.json missing');
  return JSON.parse(readFileSync(p, 'utf8')).states;
}

function nextFor(state) {
  const s = loadNextSteps().find((x) => x.state === state);
  return { primary: s.primary, secondary: s.secondary };
}

const lineOf = (md, re) => {
  const i = normalize(md).split('\n').findIndex((l) => re.test(l));
  return i < 0 ? 1 : i + 1;
};

function hasBlock(root) {
  for (const f of ['AGENTS.md', 'CLAUDE.md']) {
    const p = join(root, f);
    if (existsSync(p) && readFileSync(p, 'utf8').includes('<!-- AGENTIC-SDLC:BEGIN -->')) return f;
  }
  return null;
}

function specDirs(root) {
  const d = join(root, 'specs');
  if (!existsSync(d)) return [];
  return readdirSync(d, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(d, e.name, 'spec.md')))
    .map((e) => `specs/${e.name}`)
    .sort();
}

// Retro records: docs/retros/*.md and specs/*/retro.md, oldest first (date in the H1 or file name).
function retroFiles(root) {
  const out = [];
  const rd = join(root, 'docs', 'retros');
  if (existsSync(rd)) for (const f of readdirSync(rd)) if (f.endsWith('.md')) out.push(`docs/retros/${f}`);
  for (const s of specDirs(root)) if (existsSync(join(root, s, 'retro.md'))) out.push(`${s}/retro.md`);
  const dateOf = (rel) => {
    const md = readFileSync(join(root, rel), 'utf8');
    return (md.match(/^#\s+Retro\s+[—-]\s+(\d{4}-\d{2}-\d{2})/m) || rel.match(/(\d{4}-\d{2}-\d{2})/) || [, ''])[1];
  };
  return out.map((rel) => ({ rel, date: dateOf(rel), md: readFileSync(join(root, rel), 'utf8') }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Latest status of every retro action ID (## Actions and ## Prior actions tables; a later retro wins).
function retroActions(retros) {
  const byId = new Map();
  for (const r of retros) {
    for (const t of parseTables(r.md)) {
      const id = t.header.findIndex((h) => /^id$/i.test(h));
      const st = t.header.findIndex((h) => /^status$/i.test(h));
      if (id < 0 || st < 0) continue;
      for (const row of t.rows) {
        if (!/^RA-/.test(row[id] ?? '')) continue;
        byId.set(row[id], { status: row[st] ?? '', at: `${r.rel}:${lineOf(r.md, new RegExp(row[id].replace(/[-]/g, '\\-')))}` });
      }
    }
  }
  return [...byId].filter(([, v]) => !/^(done\b|dropped:)/i.test(v.status.trim())).map(([id, v]) => ({ id, ...v }));
}

// Verification rows of the PR body or review record: { file, rows, fresh }.
function verification(root, spec, current) {
  let best = null;
  for (const name of ['review.md', 'pr-body.md']) {
    const rel = `${spec}/${name}`;
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    const md = readFileSync(p, 'utf8');
    const sec = findSection(md, 'Verification');
    const table = sec ? parseTables(sec.body)[0] : null;
    const col = table ? table.header.findIndex((h) => /^fingerprint$/i.test(h)) : -1;
    const rows = table ? table.rows.length : 0;
    const fresh = rows > 0 && col >= 0 && current != null && table.rows.every((r) => (r[col] ?? '').startsWith(current));
    const v = { file: rel, line: lineOf(md, /^#{1,6}\s+Verification/), rows, fresh };
    if (!best || (v.fresh && !best.fresh)) best = v;
  }
  return best;
}

// One spec folder's state: { state, evidence, ... }.
function specState(root, spec, { committed, current }) {
  const ev = [];
  const specPath = join(root, spec, 'spec.md');
  const specMd = readMarkdownFile(specPath);
  const planPath = join(root, spec, 'plan.md');
  if (!existsSync(planPath)) {
    const a = specApproval(specPath);
    if (!a.valid) {
      ev.push({ at: `${spec}/spec.md:${lineOf(specMd, /^#{1,6}\s+Approvals/)}`, note: a.section ? `no approval binds spec hash ${a.hash}` : 'no ## Approvals section' });
      return { state: 'SPEC_UNAPPROVED', evidence: ev };
    }
    ev.push({ at: `${spec}/spec.md:${lineOf(specMd, /^#{1,6}\s+Approvals/)}`, note: `Specify sign-off binds ${a.hash}; no plan.md` });
    return { state: 'PLAN_MISSING', evidence: ev };
  }
  const planMd = readMarkdownFile(planPath);
  const tasks = readPlanTasks(planMd).tasks; // throws InputError on an unparsable plan → UNKNOWN
  const a = approvalState(planPath);
  if (a.spec && !a.spec.valid) {
    ev.push({ at: `${spec}/spec.md:${lineOf(specMd, /^#{1,6}\s+Approvals/)}`, note: `no approval binds spec hash ${a.spec.hash}` });
    return { state: 'SPEC_UNAPPROVED', evidence: ev };
  }
  if (!a.plan.valid) {
    ev.push({ at: `${spec}/plan.md:${lineOf(planMd, /^#{1,6}\s+Approvals/)}`, note: a.plan.detail || `no approval binds plan hash ${a.plan.hash}` });
    return { state: 'PLAN_UNAPPROVED', evidence: ev };
  }
  const open = tasks.filter((t) => !committed.has(t.id));
  if (open.length) {
    const ready = open.find((t) => t.blockedBy.every((b) => committed.has(b))) || open[0];
    ev.push({ at: `${spec}/plan.md:${lineOf(planMd, new RegExp(`\\|\\s*${ready.id}\\s*\\|`))}`, note: `${open.length} of ${tasks.length} tasks without a commit; next unblocked ${ready.id}` });
    return { state: 'TASKS_OPEN', evidence: ev, nextTask: ready.id };
  }
  const notes = join(root, spec, 'release-notes.md');
  if (!existsSync(notes)) {
    const v = verification(root, spec, current);
    if (!v) ev.push({ at: `${spec}/plan.md`, note: 'every task committed; no pr-body.md or review.md with ## Verification' });
    else ev.push({ at: `${v.file}:${v.line}`, note: v.fresh ? `${v.rows} Verification rows on the current fingerprint ${current}` : `${v.rows} Verification rows, missing or stale (current ${current ?? 'unknown'})` });
    return { state: 'PR_WITHOUT_EVIDENCE', evidence: ev, evidenceFresh: Boolean(v?.fresh) };
  }
  return { state: 'RELEASED', evidence: [{ at: `${spec}/release-notes.md:1`, note: 'release notes present' }] };
}

// Returns { state, item, evidence: [{at, note}], next: {primary, secondary}, ... }; InputError → caller maps to UNKNOWN.
export function detectState({ cwd = process.cwd() } = {}) {
  const root = isRepo(cwd) ? topLevel(cwd) : resolve(cwd);
  const done = (state, extra) => ({ state, ...extra, next: nextFor(state) });

  const blockFile = hasBlock(root);
  if (!blockFile) return done('NO_BLOCK', { item: null, evidence: [{ at: 'AGENTS.md', note: 'no <!-- AGENTIC-SDLC:BEGIN --> in AGENTS.md or CLAUDE.md' }] });

  const specs = specDirs(root);
  const retros = retroFiles(root);
  const openActions = retroActions(retros);
  if (!specs.length && !openActions.length) {
    return done('NO_SPEC', { item: null, evidence: [{ at: `${blockFile}:1`, note: 'AGENTS.md block present; no specs/*/spec.md' }] });
  }

  const git = isRepo(root);
  const committed = new Set(git && headSha(root) ? log({ cwd: root }).flatMap((c) => refsFromMessage(`${c.subject}\n\n${c.body}`).tasks) : []);
  const current = git ? fingerprint({ cwd: root }).short : null;

  const candidates = [];
  for (const spec of specs) {
    const s = specState(root, spec, { committed, current });
    if (s.state === 'RELEASED') {
      const slug = spec.split('/')[1];
      const retro = retros.find((r) => r.rel === `${spec}/retro.md` || r.md.includes(slug));
      if (!retro) candidates.push({ ...s, state: 'RELEASED_WITHOUT_RETRO', item: spec, evidence: [...s.evidence, { at: 'docs/retros', note: `no retro record covers ${slug}; due within 5 business days of the release` }] });
      continue;
    }
    candidates.push({ ...s, item: spec });
  }
  if (openActions.length) {
    const oldest = openActions[0];
    candidates.push({ state: 'RETRO_ACTIONS_OPEN', item: oldest.id, evidence: openActions.map((a) => ({ at: a.at, note: `${a.id} status "${a.status}"` })) });
  }
  if (!candidates.length) {
    return done('NOTHING_OPEN', { item: null, evidence: [{ at: 'specs', note: `${specs.length} spec folders released with a retro; no open retro action` }] });
  }
  candidates.sort((x, y) => RANK[x.state] - RANK[y.state]);
  const { state, ...rest } = candidates[0];
  return done(state, rest);
}

function helpTopic(name) {
  const p = dataFile('help-topics.md');
  const md = p ? readFileSync(p, 'utf8') : '';
  const sec = findSection(md, String(name), { level: 2 });
  if (!sec) throw new InputError(`unknown help topic: ${name} (blocked, resume, path, approvals, extensions)`);
  return `## ${sec.title}\n${sec.body.trim()}`;
}

function nextLines(r) {
  const head = `Agentic SDLC · ${r.state}${r.item ? ` · ${r.item}` : ''}`;
  return [
    head,
    `Next: ${r.next.primary.skill} — ${r.next.primary.reason}`,
    ...r.next.secondary.map((s) => `  or ${s.skill} when ${s.condition} — ${s.reason}`),
  ];
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags } = parseArgs(argv, { booleans: ['json', 'help', 'next'] });
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  if (flags.topic !== undefined) {
    out.write(helpTopic(flags.topic) + '\n');
    return EXIT.PASS;
  }
  let r;
  let code = EXIT.PASS;
  try {
    r = detectState();
  } catch (e) {
    if (!(e instanceof InputError)) throw e;
    r = { state: 'UNKNOWN', item: null, evidence: [{ at: '-', note: e.message }], next: nextFor('UNKNOWN') };
    code = EXIT.INPUT;
  }
  const lines = flags.next
    ? nextLines(r)
    : [...nextLines(r).slice(0, 1), ...r.evidence.map((e) => `  evidence ${e.at} — ${e.note}`), ...nextLines(r).slice(1)];
  return report({ ok: code === EXIT.PASS, code, json: Boolean(flags.json), result: r, lines }, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
