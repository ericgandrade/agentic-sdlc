#!/usr/bin/env node
// ext-check — validates Agentic SDLC extensions against the versioned extension interface
// (references/extension-interface.md) and lists the ones an agent may load, by extension point.
// Extensions are repository files only: nothing is fetched, and each entry file is pinned by SHA-256.

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { normalize } from './lib/md.mjs';

export const INTERFACE_VERSION = '1.0.0';

// kind → extension point. The point's marker `<!-- ext:<point> -->` sits in the core file it extends.
export const POINTS = Object.freeze({
  'review-lens': 'review.lenses',
  'dod-check': 'dod.checks',
  template: 'templates',
});

const HELP = `Usage: node ext-check.mjs [--dir <dir>] [--team <dir>] [--core <skill-dir>] [--point <id>] [--json] [--help]

Validates every extension (<dir>/<name>/extension.json) against extension interface ${INTERFACE_VERSION}.
  --dir    project extensions (default .agentic-sdlc/extensions)
  --team   team extensions (default: "extensions.team" in .agentic-sdlc/config.json); project wins on a name clash
  --core   the agentic-sdlc skill directory whose markers are checked (default: the directory above this
           script when it holds SKILL.md; otherwise the built-in point list)
  --point  list only the extensions attached to review.lenses, dod.checks or templates
Both directories must be inside the current repository. Rules: EX01 interface missing or not ^x.y.z ·
EX02 interface incompatible · EX03 unknown kind · EX04 entry missing · EX05 extension point not in core
or not matching the kind · EX06 sha256 missing or mismatched · EX07 name or version missing.
Exit codes: 0 every extension valid (or none) · 1 a rule failed · 2 malformed JSON or a directory outside the repository.`;

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const CARET = /^\^(\d+)\.(\d+)\.(\d+)$/;

// Caret match: same major; minor and patch at least the requested ones.
export function satisfies(version, range) {
  const v = String(version).match(SEMVER);
  const r = String(range).match(CARET);
  if (!v || !r) return false;
  const [vM, vm, vp] = v.slice(1).map(Number);
  const [rM, rm, rp] = r.slice(1).map(Number);
  if (vM !== rM) return false;
  return vm > rm || (vm === rm && vp >= rp);
}

const hashText = (text) => createHash('sha256').update(normalize(text), 'utf8').digest('hex');

function inside(base, target) {
  const rel = relative(base, target);
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...filesUnder(p));
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

// Points whose marker appears in the core skill's references/ or templates/ files.
function corePoints(coreDir) {
  const found = new Set();
  const templates = new Set();
  for (const f of [...filesUnder(join(coreDir, 'references')), ...filesUnder(join(coreDir, 'templates'))]) {
    for (const m of readFileSync(f, 'utf8').matchAll(/<!--\s*ext:([a-z.]+)\s*-->/g)) found.add(m[1]);
  }
  const tdir = join(coreDir, 'templates');
  if (existsSync(tdir)) for (const name of readdirSync(tdir)) templates.add(name);
  return { found, templates };
}

function readManifest(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new InputError(`${path}: malformed extension.json (${e.message})`);
  }
}

// Validates one extension folder; returns { ext, errors }.
function validate(folder, layer, cwd, core) {
  const manifestPath = join(folder, 'extension.json');
  const m = readManifest(manifestPath);
  const label = m.name || relative(cwd, folder);
  const errors = [];
  const fail = (rule, message) => errors.push({ rule, extension: label, message });

  if (!m.name || !m.version || !SEMVER.test(String(m.version))) fail('EX07', 'name and a x.y.z version are required');
  if (!m.interface || !CARET.test(String(m.interface))) fail('EX01', 'interface must be a caret range such as ^1.0.0');
  else if (!satisfies(INTERFACE_VERSION, m.interface)) fail('EX02', `interface ${m.interface} does not accept core ${INTERFACE_VERSION}`);
  const point = POINTS[m.kind];
  if (!point) fail('EX03', `kind "${m.kind}" is not one of ${Object.keys(POINTS).join(', ')}`);

  if (m.attachesTo !== point && point) fail('EX05', `kind ${m.kind} attaches to ${point}, not ${m.attachesTo}`);
  else if (point && core.points && !core.points.found.has(point)) fail('EX05', `marker <!-- ext:${point} --> not found in core files`);

  const entryPath = m.entry ? resolve(folder, String(m.entry)) : null;
  let entryOk = false;
  if (!entryPath || !inside(folder, entryPath) || !existsSync(entryPath)) fail('EX04', `entry file missing: ${m.entry ?? '(none)'}`);
  else entryOk = true;
  if (!m.sha256) fail('EX06', 'sha256 of the entry file is required');
  else if (entryOk && hashText(readFileSync(entryPath, 'utf8')) !== String(m.sha256).toLowerCase()) {
    fail('EX06', 'sha256 does not match the entry file; review the change and re-pin');
  }

  const ext = {
    name: m.name, version: m.version, kind: m.kind, attachesTo: m.attachesTo, layer,
    entry: entryPath ? relative(cwd, entryPath).split(sep).join('/') : null, overrides: [],
  };
  if (m.kind === 'template' && entryOk && core.points?.templates.has(String(m.entry).split('/').pop())) ext.overrides.push('core');
  return { ext, errors };
}

function extensionFolders(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).sort()
    .map((n) => join(dir, n))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, 'extension.json')));
}

function layerDir(cwd, value, label) {
  const dir = resolve(cwd, value);
  if (!inside(cwd, dir)) throw new InputError(`${label} extensions directory is outside the repository: ${value}`);
  return dir;
}

function teamSetting(cwd) {
  const cfg = join(cwd, '.agentic-sdlc', 'config.json');
  if (!existsSync(cfg)) return undefined;
  try {
    return JSON.parse(readFileSync(cfg, 'utf8'))?.extensions?.team;
  } catch (e) {
    throw new InputError(`.agentic-sdlc/config.json: ${e.message}`);
  }
}

const DEFAULT_CORE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Returns { interface, core, extensions, errors, count, missingMarkers }; throws InputError (exit 2).
export function checkExtensions({ cwd = process.cwd(), dir = '.agentic-sdlc/extensions', team, core = DEFAULT_CORE, point } = {}) {
  const root = resolve(cwd);
  const coreDir = resolve(core);
  const hasCore = existsSync(join(coreDir, 'SKILL.md'));
  const coreInfo = { points: hasCore ? corePoints(coreDir) : null };
  const missingMarkers = hasCore ? Object.values(POINTS).filter((p) => !coreInfo.points.found.has(p)) : [];

  const layers = [];
  const teamValue = team ?? teamSetting(root);
  if (teamValue) layers.push(['team', layerDir(root, teamValue, 'team')]);
  layers.push(['project', layerDir(root, dir, 'project')]);

  const byName = new Map();
  const errors = [];
  for (const [layer, d] of layers) {
    for (const folder of extensionFolders(d)) {
      const { ext, errors: errs } = validate(folder, layer, root, coreInfo);
      errors.push(...errs);
      const prev = byName.get(ext.name);
      if (prev) ext.overrides.unshift(prev.layer);
      byName.set(ext.name, ext);
    }
  }
  const all = [...byName.values()];
  const extensions = point ? all.filter((e) => e.attachesTo === point) : all;
  return {
    interface: INTERFACE_VERSION, core: hasCore ? 'skill' : 'builtin',
    extensions, errors, count: extensions.length, missingMarkers,
  };
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags } = parseArgs(argv);
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const str = (k) => (typeof flags[k] === 'string' ? flags[k] : undefined);
  const r = checkExtensions({ dir: str('dir'), team: str('team'), core: str('core'), point: str('point') });
  const ok = r.errors.length === 0 && r.missingMarkers.length === 0;
  const lines = [`ext-check: interface ${r.interface} · core ${r.core} · extensions: ${r.count}`];
  for (const e of r.extensions) {
    const over = e.overrides.length ? ` (overrides ${e.overrides.join(', ')})` : '';
    lines.push(`  ${e.attachesTo} · ${e.name}@${e.version} · ${e.layer} · ${e.entry}${over}`);
  }
  for (const m of r.missingMarkers) lines.push(`FAIL core marker missing: <!-- ext:${m} -->`);
  for (const e of r.errors) lines.push(`FAIL ${e.rule} ${e.extension}: ${e.message}`);
  lines.push(ok ? 'Result: PASS' : `Result: FAIL (${r.errors.length + r.missingMarkers.length}); do not load a refused extension`);
  return report({ ok, json: Boolean(flags.json), result: r, lines }, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
