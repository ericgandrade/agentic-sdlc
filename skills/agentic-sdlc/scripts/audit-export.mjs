#!/usr/bin/env node
// audit-export — mechanism 10.6: writes an audit bundle (JSON + CSV) for one spec folder: one record per
// sign-off and per artifact, with SHA-256 hashes, the approval-check result and SSDF practice tags.
// Dependency-free, Node >= 18. Exit codes: 0 written and approvals pass, 1 written but approval-check
// failed (bundle marked failed), 2 input missing or unparsable.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { checkFolder } from './approval-check.mjs';

export const DEFAULT_OUT = '.agentic-sdlc/audit';

const HELP = `Usage: node audit-export.mjs specs/NNN-slug [--out <dir>] [--pr <file>] [--author <login>] [--head <sha>]
                            [--today YYYY-MM-DD] [--json]

Writes <out>/audit-<NNN-slug>.json and <out>/audit-<NNN-slug>.csv (default out: ${DEFAULT_OUT}/):
one record per sign-off (stage, status, role, person, words, rev, hash, hash-valid, time, source) and per
file in the folder (path, sha256), each with SSDF practice tags (NIST SP 800-218, skill security-hardening,
references/ssdf-mapping.md; evidence relevant to a practice, never a compliance claim), plus the
approval-check result for the same folder (--pr, --author, --head and --today are passed to it).
Exit codes: 0 written, approvals pass · 1 written, approval-check failed (status "failed") · 2 input missing.`;

// Static map from the SSDF mapping table: where the method's records are evidence for a practice.
export const SSDF_STAGE = Object.freeze({
  Specify: ['PO.1', 'PW.1'], Design: ['PW.2'], Test: ['PW.7', 'PW.8'], Release: ['PS.2', 'PS.3'],
});
const SSDF_FILE = Object.freeze({
  'spec.md': ['PO.1', 'PW.1'], 'threat-model.md': ['PW.1'], 'plan.md': ['PW.2'], 'graph.json': ['PW.2'],
  'approvals.md': ['PO.2'], 'acceptance-tests.md': ['PW.8'], 'review.md': ['PW.7', 'PW.8'],
  'pr-body.md': ['PW.7', 'PW.8'], 'release-notes.md': ['PS.2', 'PS.3'], 'run-ledger.jsonl': ['PS.3'],
});

export const CSV_COLUMNS = ['record', 'stage', 'status', 'role', 'person', 'words', 'rev', 'hash', 'hash_valid', 'time', 'path', 'sha256', 'ssdf'];

const rel = (p) => relative(process.cwd(), resolve(p)).split(sep).join('/');
const sha256 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildBundle(dir, opts = {}) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) throw new InputError(`spec folder not found: ${dir}`);
  const check = checkFolder(dir, opts);
  const signOffs = check.signOffs.map((s) => ({
    stage: s.stage, status: s.status, role: s.role ?? null, person: s.person ?? null, words: s.words ?? null,
    rev: s.rev ?? null, hash: s.hash || null, hashValid: s.hashValid ?? null, time: s.time ?? null,
    decision: s.decision ?? null, source: s.source ? rel(s.source) : null, ...(s.waiver ? { waiver: s.waiver } : {}),
    ssdf: SSDF_STAGE[s.stage],
  }));
  const artifacts = readdirSync(dir).sort()
    .map((f) => join(dir, f))
    .filter((f) => statSync(f).isFile())
    .map((f) => ({ path: rel(f), sha256: sha256(f), ssdf: SSDF_FILE[basename(f)] || [] }));
  if (opts.pr && !artifacts.some((a) => a.path === rel(opts.pr))) {
    artifacts.push({ path: rel(opts.pr), sha256: sha256(opts.pr), ssdf: ['PW.7', 'PW.8'] });
  }
  return {
    v: 1, spec: basename(resolve(dir)), path: check.path, status: check.ok ? 'passed' : 'failed',
    approvalCheck: { ok: check.ok, findings: check.findings, waivers: check.waivers },
    signOffs, artifacts,
  };
}

export function toCsv(bundle) {
  const rows = [CSV_COLUMNS.join(',')];
  for (const s of bundle.signOffs) {
    rows.push(['sign-off', s.stage, s.status, s.role, s.person, s.words, s.rev, s.hash, s.hashValid, s.time, s.source, '', s.ssdf.join(' ')].map(csvCell).join(','));
  }
  for (const a of bundle.artifacts) {
    rows.push(['artifact', '', '', '', '', '', '', '', '', '', a.path, a.sha256, a.ssdf.join(' ')].map(csvCell).join(','));
  }
  return rows.join('\n') + '\n';
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv);
  if (flags.help) { out.write(HELP + '\n'); return EXIT.PASS; }
  if (positional.length !== 1) throw new InputError('name exactly one spec folder (see --help)');
  for (const k of ['out', 'pr', 'author', 'head', 'today']) {
    if (flags[k] === true) throw new InputError(`--${k} needs a value`);
  }
  const dir = positional[0];
  const bundle = buildBundle(dir, { pr: flags.pr || null, author: flags.author || null, head: flags.head || null, today: flags.today });
  const outDir = flags.out || DEFAULT_OUT;
  mkdirSync(outDir, { recursive: true });
  const jsonFile = join(outDir, `audit-${bundle.spec}.json`);
  const csvFile = join(outDir, `audit-${bundle.spec}.csv`);
  writeFileSync(jsonFile, JSON.stringify({ ...bundle, generatedAt: new Date().toISOString() }, null, 2) + '\n');
  writeFileSync(csvFile, toCsv(bundle));
  const lines = [
    `audit-export ${rel(dir)} · ${bundle.signOffs.filter((s) => s.status === 'valid').length} valid sign-off(s) · ${bundle.artifacts.length} artifact(s)`,
    `  wrote ${rel(jsonFile)}`, `  wrote ${rel(csvFile)}`,
    ...bundle.approvalCheck.findings.map((f) => `  ERROR ${f.rule}${f.stage ? ` ${f.stage}` : ''}: ${f.message}`),
    bundle.status === 'passed' ? 'PASS' : 'FAIL (approval-check failed; bundle marked failed)',
  ];
  return report({ ok: bundle.status === 'passed', json: flags.json, result: { json: rel(jsonFile), csv: rel(csvFile), status: bundle.status, findings: bundle.approvalCheck.findings }, lines }, out);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run(() => main());
