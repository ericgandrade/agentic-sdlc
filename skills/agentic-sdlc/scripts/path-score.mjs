#!/usr/bin/env node
// path-score — the path rubric of references/paths.md §2 as code (mechanisms 14.1, 14.3).
// Dependency-free, Node >= 18. Exit codes: 0 pass, 1 route-down or escalation needed, 2 input missing or unparsable.

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { git, topLevel } from './lib/git.mjs';
import { extractFencedBlocks } from './lib/md.mjs';
import { PATHS, PATH_RANK, TRIGGER_ALIASES, lintFile, riskRoute, sizeRoute } from './spec-lint.mjs';

const HELP = `Usage: node path-score.mjs [inputs] [--path <P> | --from-spec <spec.md>] [--diff <base>] [--json]

Scores a work item with the rubric of references/paths.md §2 and prints the score line
(Path: Standard · S=5 · R=1 (money)) plus the size and risk routes.

Inputs:
  --files <n|a,b,c>    Files the change creates, modifies or deletes: a count, or a comma list
                       (lockfiles, specs/, docs/, .agentic-sdlc/ and root *.md are not counted)
  --components <n>     Separately built or deployed units touched (>= 1)
  --iterations <n>     Merged PRs until complete in production (>= 1)
  --risk <t,t|none>    Risk triggers: auth, personal/health data, money, public API,
                       schema/migration, irreversible, regulated (aliases: pii, payments, schema, ...)
  Path = the highest of the size route, the risk route and, for a known file count, the file-bound
  route (<= 3 files Quick, <= 15 Standard, else Full; references/paths.md §4), so a scored path
  never fails its own Build check.
  A missing input scores "Path: Standard · default: inputs missing (<input>)", never below a known route.

Checks (exit 1 when failed):
  --path <P>           Current path (Quick | Standard | Full), e.g. from the issue's score line.
                       Fails when the scored route is higher (never route down) or the file count
                       exceeds the path's bound (Quick > 3, Standard > 15).
  --from-spec <file>   Read Path, Size and Risk from the spec header; same checks as --path.
  --diff <base>        Count files from the actual change: git diff against merge-base(<base>, HEAD)
                       plus uncommitted and untracked files; components = distinct "deploy" units of
                       the touched modules in docs/codemap.md (when present). Needs --path or --from-spec.

Exit codes: 0 pass · 1 route-down or escalation needed (stop, re-score, references/paths.md §4)
            2 input missing or unparsable.`;

// Rubric order of the risk triggers; the score line lists them in this order.
export const TRIGGERS = ['auth', 'personal/health data', 'money', 'public API', 'schema/migration', 'irreversible', 'regulated'];
// File bound per path (references/paths.md §4).
export const FILE_BOUND = { Quick: 3, Standard: 15, Full: Infinity };

const LOCKFILES = new Set([
  'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'Cargo.lock', 'Gemfile.lock',
  'poetry.lock', 'Pipfile.lock', 'composer.lock', 'go.sum', 'uv.lock', 'packages.lock.json',
]);
const RECORD_DIRS = ['specs/', 'docs/', '.agentic-sdlc/'];

const band = (n, two, three) => (n == null ? null : n >= three ? 3 : n >= two ? 2 : 1);
export const filesPoints = (n) => (n == null ? null : n > 15 ? 3 : n > 3 ? 2 : 1);
export const componentsPoints = (n) => band(n, 2, 3);
export const iterationsPoints = (n) => band(n, 2, 3);
const higher = (...routes) => routes.filter(Boolean).sort((a, b) => PATH_RANK[b] - PATH_RANK[a])[0];
const maxKnown = (...xs) => (xs.some((x) => x != null) ? Math.max(...xs.filter((x) => x != null)) : null);

// Canonical trigger list from "a, b" | "none"; unknown names are an input error.
export function parseRisk(text) {
  if (typeof text !== 'string') throw new InputError('--risk needs a value: trigger names or "none"');
  const t = text.trim();
  if (/^(none|—|-)$/i.test(t)) return [];
  const out = new Set();
  for (const raw of t.split(/[,;]/).map((x) => x.trim().toLowerCase()).filter(Boolean)) {
    const canon = TRIGGER_ALIASES[raw];
    if (!canon) throw new InputError(`unknown risk trigger "${raw}" (known: ${TRIGGERS.join(', ')})`);
    out.add(canon);
  }
  return TRIGGERS.filter((x) => out.has(x));
}

// Scores counts (and/or points already scored, e.g. from a spec header). `current` adds the checks.
export function score({ files = null, components = null, iterations = null, triggers = null, points = {} } = {}, { current } = {}) {
  const fp = maxKnown(points.files, filesPoints(files));
  const cp = maxKnown(points.components, componentsPoints(components));
  const ip = maxKnown(points.iterations, iterationsPoints(iterations));
  const partsKnown = fp != null && cp != null && ip != null;
  const S = partsKnown ? fp + cp + ip : points.S ?? null;
  const tr = triggers == null ? null : TRIGGERS.filter((t) => triggers.includes(t));
  const missing = [];
  if (S == null) {
    if (fp == null) missing.push('files');
    if (cp == null) missing.push('components');
    if (ip == null) missing.push('iterations');
  }
  if (tr == null) missing.push('risk');
  const sRoute = S == null ? null : sizeRoute(S);
  const rRoute = tr == null ? null : riskRoute(tr);
  // A known file count also routes: the lowest path whose file bound (§4) holds it, so the printed
  // route never fails its own Build check (Quick caps at 3 files even when S <= 4).
  const bRoute = files == null ? null : PATHS.find((p) => files <= FILE_BOUND[p]);
  const path = higher(sRoute, rRoute, bRoute, missing.length ? 'Standard' : null);
  const line = missing.length
    ? `Path: ${path} · default: inputs missing (${missing.join(', ')})`
    : `Path: ${path} · S=${S} · R=${tr.length}${tr.length ? ` (${tr.join(', ')})` : ''}`;
  const problems = [];
  if (current) {
    if (PATH_RANK[current] < PATH_RANK[path]) {
      problems.push(`path ${current} is lower than the scored route ${path}; never route down: re-score and route up (references/paths.md §4)`);
    }
    if (files != null && files > FILE_BOUND[current]) problems.push(`files ${files} > ${FILE_BOUND[current]} (${current} bound)`);
  }
  return {
    line, path, sizeRoute: sRoute, riskRoute: rRoute, boundRoute: bRoute ?? null, S, R: tr ? tr.length : null, triggers: tr, missing,
    points: { files: fp, components: cp, iterations: ip }, current: current ?? null, problems, ok: problems.length === 0,
  };
}

// --- file definition and code map ----------------------------------------------------------------

function globRegex(glob) {
  const g = glob.replace(/^\.\//, '');
  if (!/[*?]/.test(g)) return new RegExp(`^${esc(g.replace(/\/$/, ''))}(?:/|$)`);
  const body = g.split(/(\*\*\/?|\*|\?)/).map((p) => (p === '**' || p === '**/' ? '.*' : p === '*' ? '[^/]*' : p === '?' ? '[^/]' : esc(p))).join('');
  return new RegExp(`^${body}$`);
}
function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Splits paths into counted and excluded by the §2 file definition plus code-map exclusions.
export function countFiles(paths, { excluded = [] } = {}) {
  const ex = excluded.map(globRegex);
  const counted = [];
  const out = [];
  for (const p of paths.map((x) => x.trim()).filter(Boolean)) {
    const base = p.split('/').pop();
    const skip = LOCKFILES.has(base) || RECORD_DIRS.some((d) => p.startsWith(d)) || (!p.includes('/') && /\.md$/i.test(p)) || ex.some((r) => r.test(p));
    (skip ? out : counted).push(p);
  }
  return { counted, excluded: out };
}

// Minimal reader for the ```sdlc-codemap block of templates/codemap.md (flow lists, one key per line).
export function parseCodemap(md) {
  const block = extractFencedBlocks(md, { info: 'sdlc-codemap' })[0];
  if (!block) return null;
  const modules = [];
  const excluded = [];
  let section = null;
  const list = (v) => v.replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean);
  for (const raw of block.content.split('\n')) {
    const top = raw.match(/^(\w+):/);
    if (top) { section = top[1]; continue; }
    const m = raw.match(/^\s*(-\s*)?(\w+):\s*(.*)$/);
    if (!m) continue;
    const [, dash, key, value] = m;
    if (section === 'modules') {
      if (dash) modules.push({ name: '', paths: [], tests: [], deploy: '' });
      const mod = modules[modules.length - 1];
      if (!mod) continue;
      if (key === 'paths' || key === 'tests') mod[key] = list(value);
      else if (key === 'name' || key === 'deploy') mod[key] = value.trim();
    } else if (section === 'excluded' && key === 'path') excluded.push(value.trim());
  }
  return { modules, excluded };
}

// Distinct deploy units of the modules whose paths (or tests) match the files.
export function componentsOf(files, map) {
  const mods = map.modules.map((m) => ({ ...m, re: [...m.paths, ...m.tests].map(globRegex) }));
  const units = new Set();
  const unmapped = [];
  for (const f of files) {
    const mod = mods.find((m) => m.re.some((r) => r.test(f)));
    if (mod) units.add(mod.deploy || mod.name);
    else unmapped.push(f);
  }
  return { units: [...units].sort(), unmapped };
}

function diffFiles(base, cwd) {
  const mb = git(['merge-base', base, 'HEAD'], { cwd }).trim();
  const tracked = git(['-c', 'core.quotepath=off', 'diff', '--name-only', mb], { cwd }).split('\n');
  const untracked = git(['-c', 'core.quotepath=off', 'ls-files', '--others', '--exclude-standard'], { cwd }).split('\n');
  return [...new Set([...tracked, ...untracked].map((x) => x.trim()).filter(Boolean))].sort();
}

// --- spec header ---------------------------------------------------------------------------------------

function fromSpec(file) {
  const r = lintFile(file);
  if (r.findings.some((f) => f.rule === 'H02')) throw new InputError(`${file}: header Path must be Quick, Standard or Full`);
  const sizeRow = readFileSync(file, 'utf8').match(/^\|\s*Size\s*\|([^\n]*)$/im);
  const parts = sizeRow && sizeRow[1].match(/files\s+(\d)\s*\+\s*components\s+(\d)\s*\+\s*iterations\s+(\d)/i);
  const unknown = r.findings.filter((f) => f.rule === 'H04' && /unknown risk trigger/.test(f.message));
  if (unknown.length) throw new InputError(`${file}: ${unknown[0].message}`);
  const points = parts ? { files: +parts[1], components: +parts[2], iterations: +parts[3] } : {};
  if (r.size != null) points.S = r.size;
  return { current: r.path, points, triggers: r.risk == null ? null : r.triggers };
}

// --- CLI -------------------------------------------------------------------------------------------------

function count(flags, name, min) {
  const v = flags[name];
  if (v == null) return null;
  if (typeof v !== 'string' || !/^\d+$/.test(v) || Number(v) < min) throw new InputError(`--${name} must be an integer >= ${min}`);
  return Number(v);
}

export async function main(argv = process.argv.slice(2), out = process.stdout, cwd = process.cwd()) {
  const { flags } = parseArgs(argv, { booleans: ['json', 'help'] });
  if (flags.help) { out.write(HELP + '\n'); return EXIT.PASS; }
  if (flags.path != null && !PATHS.includes(flags.path)) throw new InputError(`--path must be one of ${PATHS.join(', ')}`);
  if (flags.diff != null && !flags.path && !flags['from-spec']) throw new InputError('--diff needs --path or --from-spec (the current path to check against)');
  if (flags.diff === true || flags['from-spec'] === true) throw new InputError('--diff and --from-spec need a value');

  let files = null;
  let fileList = null;
  if (flags.files != null) {
    if (typeof flags.files !== 'string') throw new InputError('--files needs a count or a comma list');
    if (/^\d+$/.test(flags.files)) files = Number(flags.files);
    else fileList = flags.files.split(',');
  }
  let components = count(flags, 'components', 1);
  const iterations = count(flags, 'iterations', 1);
  let triggers = flags.risk != null ? parseRisk(flags.risk) : null;
  let current = flags.path || null;
  let points = {};

  if (flags['from-spec']) {
    const file = resolve(cwd, flags['from-spec']);
    if (!existsSync(file)) throw new InputError(`spec not found: ${flags['from-spec']}`);
    const s = fromSpec(file);
    current = flags.path || s.current;
    points = s.points;
    if (s.triggers) triggers = [...new Set([...(triggers || []), ...s.triggers])];
  }

  const warnings = [];
  let diff = null;
  let map = null;
  if (flags.diff) {
    const root = topLevel(cwd);
    const mapFile = join(root, 'docs', 'codemap.md');
    map = existsSync(mapFile) ? parseCodemap(readFileSync(mapFile, 'utf8')) : null;
    fileList = [...(fileList || []), ...diffFiles(flags.diff, cwd)];
    diff = { base: flags.diff, codemap: map ? 'docs/codemap.md' : null };
  }
  let counted = null;
  if (fileList) {
    const c = countFiles(fileList, { excluded: map?.excluded || [] });
    counted = c.counted;
    files = maxKnown(files, c.counted.length);
    if (diff) diff.excluded = c.excluded;
  }
  if (diff && map && counted) {
    const c = componentsOf(counted, map);
    components = maxKnown(components, c.units.length || null);
    diff.units = c.units;
    if (c.unmapped.length) warnings.push(`not in docs/codemap.md (components may be undercounted; update the map): ${c.unmapped.join(', ')}`);
  }

  const r = score({ files, components, iterations, triggers, points }, { current });
  const result = { ...r, files, components, iterations, diff, warnings };
  const lines = [r.line];
  const pts = r.points;
  lines.push(`size route ${r.sizeRoute ?? '—'} (files ${files ?? '?'} → ${pts.files ?? '?'} · components ${components ?? '?'} → ${pts.components ?? '?'} · iterations ${iterations ?? '?'} → ${pts.iterations ?? '?'})` +
    ` · risk route ${r.riskRoute ?? '—'} (R=${r.R ?? '?'}) · file-bound route ${r.boundRoute ?? '—'}`);
  if (diff) lines.push(`diff ${diff.base}: ${counted.length} file(s) counted, ${diff.excluded.length} excluded${diff.units ? ` · units: ${diff.units.join(', ') || 'none'}` : ' · no docs/codemap.md'}`);
  for (const w of warnings) lines.push(`WARN ${w}`);
  for (const p of r.problems) lines.push(`ESCALATE ${p}`);
  if (current) lines.push(r.ok ? `PASS current path ${current} holds` : `FAIL current path ${current}: stop at the next green run, re-score and route up (references/paths.md §4)`);
  return report({ code: r.ok ? EXIT.PASS : EXIT.FAIL, json: flags.json, result, lines }, out);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run(() => main());
