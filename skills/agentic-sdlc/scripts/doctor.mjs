#!/usr/bin/env node
// doctor — setup check for a project that adopted the Agentic SDLC. Seven checks in order, each ok / warn / fail
// with the command that fixes it; writes .agentic-sdlc/doctor.json (excluded from the evidence fingerprint).

import { createHash } from 'node:crypto';
import { accessSync, constants, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { delimiter, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { isRepo, topLevel } from './lib/git.mjs';
import { checkExtensions } from './ext-check.mjs';
import { programOf } from './preflight.mjs';
import { readDod } from './run-ledger.mjs';

export const MIN_NODE = 18;
export const CODEMAP_MAX_DAYS = 90;

const HELP = `Usage: node doctor.mjs [--json] [--no-write] [--help]

Checks, in order (each ok / warn / fail, with the command that fixes it):
  1 node          Node >= ${MIN_NODE}
  2 vendored      .agentic-sdlc/bin/ files match SHA256SUMS (not vendored: warn)
  3 dod-block     the sdlc-dod block in AGENTS.md or CLAUDE.md parses
  4 dod-commands  each sdlc-dod command resolves on the PATH (n/a keys skipped)
  5 codemap       docs/codemap.md "verified:" date <= ${CODEMAP_MAX_DAYS} days old (brownfield only; stale: warn)
  6 enforcement   the "Enforcement:" line matches the CI files and host permission config present
  7 extensions    every extension passes ext-check
Writes .agentic-sdlc/doctor.json unless --no-write. Reports enforcement: enforced | prompt-only
(prompt-only when Node or a host permission config is absent), ci: present | absent, and enforced |
prompt-only per detected host; antigravity, cursor and adal have no host controls: always prompt-only.
Exit codes: 0 no check failed · 1 a check failed.`;

const row = (id, status, detail, fix = '') => ({ id, status, detail, fix });
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);

function nodeCheck(version) {
  const major = Number(String(version).split('.')[0]);
  return major >= MIN_NODE
    ? row('node', 'ok', `node ${version}`)
    : row('node', 'fail', `node ${version} < ${MIN_NODE}`, `install Node >= ${MIN_NODE}; without it the method runs prompt-only (references/platforms.md §4)`);
}

function vendoredCheck(root) {
  const bin = join(root, '.agentic-sdlc', 'bin');
  const fix = 're-vendor with project-context (skills/project-context/references/vendoring.md); never patch .agentic-sdlc/bin/';
  const sums = read(join(bin, 'SHA256SUMS'));
  if (sums === null) {
    return existsSync(bin)
      ? row('vendored', 'fail', '.agentic-sdlc/bin/ has no SHA256SUMS', fix)
      : row('vendored', 'warn', 'not vendored: scripts run from the installed skill', 'vendor with project-context Step 7 so CI and every agent run the same pinned scripts');
  }
  const bad = [];
  let n = 0;
  for (const line of sums.split('\n')) {
    const m = line.trim().match(/^([0-9a-f]{64})\s+\*?(.+)$/i);
    if (!m) continue;
    n++;
    const p = join(bin, m[2]);
    if (!existsSync(p)) bad.push(`${m[2]} missing`);
    else if (createHash('sha256').update(readFileSync(p)).digest('hex') !== m[1].toLowerCase()) bad.push(`${m[2]} changed`);
  }
  if (!n) return row('vendored', 'fail', 'SHA256SUMS lists no file', fix);
  return bad.length ? row('vendored', 'fail', bad.join('; '), fix) : row('vendored', 'ok', `${n} files match SHA256SUMS`);
}

// Resolves a program on PATH (or relative to the repository when it contains a slash).
export function resolvesOnPath(prog, { root, env = process.env } = {}) {
  if (!prog) return false;
  const canRun = (p) => {
    try { accessSync(p, process.platform === 'win32' ? constants.F_OK : constants.X_OK); return true; } catch { return false; }
  };
  if (prog.includes('/') || prog.includes('\\')) return existsSync(isAbsolute(prog) ? prog : resolve(root, prog));
  const exts = process.platform === 'win32' ? (env.PATHEXT || '.EXE;.CMD;.BAT').split(';') : [''];
  for (const dir of String(env.PATH || '').split(delimiter).filter(Boolean)) {
    for (const ext of exts) if (canRun(join(dir, prog + ext))) return true;
  }
  return false;
}

function dodChecks(root, env) {
  let dod;
  try {
    dod = readDod(root);
  } catch (e) {
    if (!(e instanceof InputError)) throw e;
    const fix = 'run project-context setup to write the sdlc-dod block (skills/agentic-sdlc/references/artifacts.md §AGENTS.md block)';
    return [row('dod-block', 'fail', e.message, fix), row('dod-commands', 'fail', 'no sdlc-dod block to check', fix)];
  }
  const keys = Object.keys(dod.entries);
  const missing = [];
  for (const [key, cmd] of Object.entries(dod.entries)) {
    if (key === 'coverage_min' || /^n\/a\b/i.test(cmd)) continue;
    const prog = programOf(cmd);
    if (!resolvesOnPath(prog, { root, env })) missing.push(`${key}: ${prog}`);
  }
  return [
    row('dod-block', 'ok', `${dod.file}: ${keys.length} keys (${keys.join(', ')})`),
    missing.length
      ? row('dod-commands', 'fail', `not on PATH: ${missing.join(', ')}`, 'install the tool, or fix the sdlc-dod command; a key the project lacks is written "<key>: n/a — <reason>"')
      : row('dod-commands', 'ok', 'every command resolves'),
  ];
}

function codemapCheck(root, today) {
  const map = read(join(root, 'docs', 'codemap.md'));
  const adopted = existsSync(join(root, '.agentic-sdlc', 'adoption.md'));
  const fix = 'project-context refresh: update docs/codemap.md and its "verified:" line';
  if (map === null) {
    return adopted
      ? row('codemap', 'warn', 'adopted repository without docs/codemap.md', fix)
      : row('codemap', 'ok', 'greenfield: no adoption ledger and no code map');
  }
  const m = map.match(/^verified:\s*(\d{4}-\d{2}-\d{2})/m);
  if (!m) return row('codemap', 'warn', 'docs/codemap.md has no "verified: YYYY-MM-DD" line', fix);
  const days = Math.floor((today.getTime() - Date.parse(`${m[1]}T00:00:00Z`)) / 86400000);
  return days > CODEMAP_MAX_DAYS
    ? row('codemap', 'warn', `verified ${m[1]}, ${days} days ago (> ${CODEMAP_MAX_DAYS})`, fix)
    : row('codemap', 'ok', `verified ${m[1]}, ${days} days ago`);
}

const CI_FILES = (root) => {
  const out = [];
  const wf = join(root, '.github', 'workflows');
  if (existsSync(wf)) for (const f of readdirSync(wf)) if (/\.ya?ml$/.test(f) && /agentic-sdlc/.test(read(join(wf, f)))) out.push(`.github/workflows/${f}`);
  if (/agentic-sdlc/.test(read(join(root, '.gitlab-ci.yml')) ?? '')) out.push('.gitlab-ci.yml');
  return out;
};

// Host permission configs with concrete controls (references/platforms.md §2 Agents, tools and permissions;
// templates in templates/host-config/). The other three hosts have none: always prompt-only.
export const HOST_CONTROLS = Object.freeze([
  { host: 'claude-code', file: '.claude/settings.json', re: /"permissions"/, alias: /claude/ },
  { host: 'copilot-cli', file: '.github/agents/', alias: /copilot/ },
  { host: 'codex', file: '.codex/config.toml', re: /sandbox_mode/, alias: /codex/ },
  { host: 'opencode', file: 'opencode.json', re: /"permission"/, alias: /opencode/ },
  { host: 'gemini', file: '.gemini/settings.json', re: /"exclude"/, alias: /^gemini/ },
]);
export const PROMPT_ONLY_HOSTS = Object.freeze([
  { host: 'antigravity', dir: '.agent', alias: /antigravity/ },
  { host: 'cursor', dir: '.cursor', alias: /cursor/ },
  { host: 'adal', dir: '.adal', alias: /adal/ },
]);

function hasControl(root, h) {
  if (h.host === 'copilot-cli') {
    const agents = join(root, '.github', 'agents');
    return existsSync(agents) && readdirSync(agents).some((f) => f.endsWith('.agent.md'));
  }
  return h.re.test(read(join(root, h.file)) ?? '');
}

// Per detected host: { host, permissions: enforced | prompt-only, evidence }. A host is detected by its
// control file, its directory, or the block's "Platform:" line.
function hostReport(root, text) {
  const platform = ((text.match(/Platform:\s*([a-z0-9 -]+?)\s*(?:·|$)/im) || [])[1] || '').toLowerCase();
  const named = (h) => Boolean(platform) && h.alias.test(platform);
  const hosts = [];
  for (const h of HOST_CONTROLS) {
    if (hasControl(root, h)) {
      const guard = h.host === 'claude-code' && /guard\.mjs pre-tool/.test(read(join(root, h.file)) ?? '') ? ' + guard hook' : '';
      hosts.push({ host: h.host, permissions: 'enforced', file: h.file, evidence: h.file + guard });
    } else if (named(h)) {
      hosts.push({ host: h.host, permissions: 'prompt-only', file: null, evidence: `no ${h.file}; template templates/host-config/${h.host}/` });
    }
  }
  for (const h of PROMPT_ONLY_HOSTS) {
    if (named(h) || existsSync(join(root, h.dir))) hosts.push({ host: h.host, permissions: 'prompt-only', file: null, evidence: 'no host controls' });
  }
  const current = hosts.find((h) => named([...HOST_CONTROLS, ...PROMPT_ONLY_HOSTS].find((x) => x.host === h.host)));
  return { hosts, current };
}

function enforcementCheck(root) {
  const ci = CI_FILES(root);
  let text = '';
  for (const f of ['AGENTS.md', 'CLAUDE.md']) text += read(join(root, f)) ?? '';
  const { hosts, current } = hostReport(root, text);
  const host = hosts.filter((h) => h.file).map((h) => h.file);
  const m = text.match(/Enforcement:\s*([a-z-]+)(?:\s*[·|,]?\s*permissions:\s*([a-z-]+))?/i);
  const facts = { ci: ci.length ? 'present' : 'absent', host, hosts: hosts.map(({ file, ...h }) => h) };
  const fix = 'correct the Enforcement: line, or install the CI jobs (skills/agentic-sdlc/templates/ci/) and a host permission config (templates/host-config/, references/platforms.md §2)';
  const per = hosts.map((h) => `${h.host} ${h.permissions} (${h.evidence})`).join(', ') || 'none detected';
  const seen = `CI: ${ci.join(', ') || 'none'}; host config: ${host.join(', ') || 'none'}; hosts: ${per}; always prompt-only: ${PROMPT_ONLY_HOSTS.map((h) => h.host).join(', ')} (no host controls)`;
  if (!m) return { ...facts, row: row('enforcement', 'warn', `no "Enforcement:" line in the AGENTS.md block (${seen})`, fix) };
  const wrong = [];
  const claimsEnforced = (m[2] || '').toLowerCase() === 'enforced';
  if (m[1].toLowerCase() === 'branch-protection' && !ci.length) wrong.push('claims branch-protection but no agentic-sdlc CI workflow is present');
  if (claimsEnforced && !host.length) wrong.push('claims permissions: enforced but no host permission config is present');
  else if (claimsEnforced && current?.permissions === 'prompt-only') wrong.push(`claims permissions: enforced but the Platform host ${current.host} is prompt-only`);
  return { ...facts, row: wrong.length ? row('enforcement', 'fail', `${wrong.join('; ')} (${seen})`, fix) : row('enforcement', 'ok', seen) };
}

function extensionsCheck(root) {
  const fix = 'node ext-check.mjs --json; fix the listed rule, re-pin the sha256 after review, or remove the extension';
  try {
    const r = checkExtensions({ cwd: root });
    if (r.errors.length) return row('extensions', 'fail', r.errors.map((e) => `${e.rule} ${e.extension}`).join(', '), fix);
    return row('extensions', 'ok', `extensions: ${r.count}`);
  } catch (e) {
    if (!(e instanceof InputError)) throw e;
    return row('extensions', 'fail', e.message, fix);
  }
}

// Returns { checks, ok, enforcement, ci, host } without writing anything.
export function runDoctor({ cwd = process.cwd(), env = process.env, today = new Date(), nodeVersion = process.versions.node } = {}) {
  const root = isRepo(cwd) ? topLevel(cwd) : resolve(cwd);
  const node = nodeCheck(nodeVersion);
  const enf = enforcementCheck(root);
  const checks = [node, vendoredCheck(root), ...dodChecks(root, env), codemapCheck(root, today), enf.row, extensionsCheck(root)];
  const nodeOk = node.status === 'ok';
  return {
    root, checks, ok: !checks.some((c) => c.status === 'fail'),
    enforcement: nodeOk && enf.host.length ? 'enforced' : 'prompt-only', ci: enf.ci, host: enf.host, hosts: enf.hosts,
  };
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags } = parseArgs(argv, { booleans: ['json', 'help', 'no-write'] });
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const { root, ...r } = runDoctor();
  const record = { ...r, at: new Date().toISOString() };
  if (!flags['no-write']) {
    mkdirSync(join(root, '.agentic-sdlc'), { recursive: true });
    writeFileSync(join(root, '.agentic-sdlc', 'doctor.json'), JSON.stringify(record, null, 2) + '\n');
  }
  const lines = [];
  for (const c of r.checks) {
    lines.push(`${c.status.toUpperCase().padEnd(5)} ${c.id.padEnd(13)} ${c.detail}`);
    if (c.status !== 'ok' && c.fix) lines.push(`      fix: ${c.fix}`);
  }
  lines.push(`enforcement: ${r.enforcement} · ci: ${r.ci}`);
  for (const h of r.hosts) lines.push(`host: ${h.host} ${h.permissions} (${h.evidence})`);
  lines.push(r.ok ? 'Result: PASS' : `Result: FAIL (${r.checks.filter((c) => c.status === 'fail').length} failed)`);
  return report({ ok: r.ok, json: Boolean(flags.json), result: record, lines }, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
