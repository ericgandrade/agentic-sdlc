#!/usr/bin/env node
// budget-check — enforces the reading budgets of the Agentic SDLC skill (mechanisms 1.1 and 13.3).
// Counts words as whitespace-separated tokens outside the leading YAML frontmatter, the same rule
// as scripts/validate-skill-content.sh (fenced code and table cells count: a reader reads them).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { findSection, normalize } from './lib/md.mjs';

export const BUDGETS = Object.freeze({
  router: 2200,
  quickstart: 1200,
  readmeInstall: 300,
  firstPath: 3700,
  reference: 3000,
  agent: 600,
  guide: 2500,
  promptWords: 400, // subagent briefs (prompts/*.md) on the default path; advisory, WARN only
  // Default-path tokens (proxy ceil(chars / 4)), measured after the section-anchored token diet
  // (v3.0.1 baseline 121,502). Never raise it: a change that adds default-path text removes as much
  // elsewhere or moves it behind a trigger.
  defaultPathTokens: 112478,
});

// At or above this share of a budget the row is reported as WARN (exit code unchanged).
export const WARN_RATIO = 0.95;

const README_INSTALL = /^install\b/i;

const HELP = `Usage: node budget-check.mjs [skill-dir] [--guide <path>] [--json] [--help]
       node budget-check.mjs [skill-dir] --default-path [--root <repo>] [--json]

Checks the word budgets of an agentic-sdlc skill directory (default: the directory above this script):
  First path   README install section <= ${BUDGETS.readmeInstall}, references/quickstart.md <= ${BUDGETS.quickstart},
               SKILL.md (router) <= ${BUDGETS.router}; total <= ${BUDGETS.firstPath}
  Modules      each other references/*.md <= ${BUDGETS.reference}; each agents/*.md <= ${BUDGETS.agent}
  --guide      also checks a reference guide (docs/guides/agentic-sdlc.md) <= ${BUDGETS.guide}
Words = whitespace-separated tokens outside the leading YAML frontmatter.
Rows at >= ${WARN_RATIO * 100}% of their budget print WARN.
  --default-path  sums ceil(chars / 4) over the entries in references/default-path.json (repository-relative,
               each file once; --root defaults to two levels above skill-dir) against ${BUDGETS.defaultPathTokens} tokens.
               An entry "path#Heading" counts only that section (heading line, body and subsections); list one
               entry per section; a whole-file entry wins. Each prompts/*.md entry over ${BUDGETS.promptWords} words prints WARN.
Exit codes: 0 every budget met · 1 a budget exceeded (DEFAULT_PATH) · 2 a listed file, section or list missing.`;

export function stripFrontmatter(md) {
  return normalize(md).replace(/^---\n[\s\S]*?\n---(\n|$)/, '');
}

export function countTokens(md) {
  return stripFrontmatter(md).split(/\s+/).filter(Boolean).length;
}

function readRequired(path, label) {
  if (!existsSync(path)) throw new InputError(`${label} missing: ${path}`);
  return readFileSync(path, 'utf8');
}

function row(kind, path, words, budget) {
  let status = 'PASS';
  if (words > budget) status = 'FAIL';
  else if (words >= budget * WARN_RATIO) status = 'WARN';
  return { kind, path, words, budget, status };
}

function markdownFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.md')).sort().map((f) => join(dir, f));
}

// Returns { skillDir, checks, firstPath, over } without printing; throws InputError for missing inputs.
export function checkBudgets(skillDir, { guide } = {}) {
  const dir = resolve(skillDir);
  if (!existsSync(dir)) throw new InputError(`skill directory missing: ${dir}`);
  const rel = (p) => relative(dir, p) || basename(p);
  const checks = [];

  const routerPath = join(dir, 'SKILL.md');
  const quickPath = join(dir, 'references', 'quickstart.md');
  const readmePath = join(dir, 'README.md');

  const readme = readRequired(readmePath, 'README.md');
  const section = findSection(readme, README_INSTALL);
  if (!section) throw new InputError(`README.md has no section whose title starts with "Install"`);
  const sectionText = `${readme.split('\n')[section.line] ?? ''}\n${section.body}`;

  const routerWords = countTokens(readRequired(routerPath, 'router SKILL.md'));
  const quickWords = countTokens(readRequired(quickPath, 'references/quickstart.md'));
  const installWords = countTokens(sectionText);

  checks.push(row('readme-install', `${rel(readmePath)} §${section.title}`, installWords, BUDGETS.readmeInstall));
  checks.push(row('quickstart', rel(quickPath), quickWords, BUDGETS.quickstart));
  checks.push(row('router', rel(routerPath), routerWords, BUDGETS.router));
  const firstPath = row('first-path', 'README install + quickstart + router', installWords + quickWords + routerWords, BUDGETS.firstPath);

  for (const file of markdownFiles(join(dir, 'references'))) {
    if (file === quickPath) continue;
    checks.push(row('reference', rel(file), countTokens(readFileSync(file, 'utf8')), BUDGETS.reference));
  }
  for (const file of markdownFiles(join(dir, 'agents'))) {
    checks.push(row('agent', rel(file), countTokens(readFileSync(file, 'utf8')), BUDGETS.agent));
  }
  if (guide) {
    const guidePath = resolve(guide);
    checks.push(row('guide', guidePath, countTokens(readRequired(guidePath, 'guide')), BUDGETS.guide));
  }

  const over = [...checks, firstPath].filter((c) => c.status === 'FAIL');
  return { skillDir: dir, checks, firstPath, over: over.length };
}

// Token proxy for one file: ceil(characters / 4). It tracks the trend in CI; it is not a tokenizer count.
export function proxyTokens(text) {
  return Math.ceil(String(text).length / 4);
}

// Default-path budget: { list, root, files: [{path, chars, tokens}], total, budget, status, rule }.
// Throws InputError when the list or a listed file is missing.
export function checkDefaultPath(skillDir, { root, budget = BUDGETS.defaultPathTokens } = {}) {
  const dir = resolve(skillDir);
  const listPath = join(dir, 'references', 'default-path.json');
  let list;
  try {
    list = JSON.parse(readRequired(listPath, 'references/default-path.json')).files;
  } catch (e) {
    if (e instanceof InputError) throw e;
    throw new InputError(`references/default-path.json is not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(list)) throw new InputError('references/default-path.json has no "files" array');
  const base = resolve(root ?? join(dir, '..', '..'));
  // One row per file, in first-mention order. A whole-file entry wins over section entries of that file.
  const byPath = new Map();
  for (const entry of list) {
    const raw = String(entry);
    const hash = raw.indexOf('#');
    const abs = resolve(base, hash < 0 ? raw : raw.slice(0, hash));
    const section = hash < 0 ? null : raw.slice(hash + 1).trim();
    if (!byPath.has(abs)) byPath.set(abs, { whole: false, sections: [] });
    const item = byPath.get(abs);
    if (section === null || section === '') item.whole = true;
    else if (!item.sections.includes(section)) item.sections.push(section);
  }
  const files = [];
  const prompts = [];
  for (const [abs, item] of byPath) {
    const path = relative(base, abs);
    const text = normalize(readRequired(abs, 'default-path file'));
    const counted = item.whole ? text : sectionText(text, item.sections, path);
    files.push({ path, ...(item.whole ? {} : { sections: item.sections }), chars: counted.length, tokens: proxyTokens(counted) });
    if (/(^|\/)prompts\/[^/]+\.md$/.test(path)) {
      const words = countTokens(counted);
      prompts.push({ path, words, budget: BUDGETS.promptWords, status: words > BUDGETS.promptWords ? 'WARN' : 'PASS' });
    }
  }
  const total = files.reduce((n, f) => n + f.tokens, 0);
  // The budget is a ceiling pinned at the measured total, so there is no WARN band: PASS or FAIL.
  // Prompt rows are advisory: a brief over its word budget warns and never changes the status.
  const status = total > budget ? 'FAIL' : 'PASS';
  return { list: relative(dir, listPath), root: base, files, prompts, total, budget, status, rule: status === 'FAIL' ? 'DEFAULT_PATH' : null };
}

// Text of the named sections (heading line + body, subsections included), each line counted once.
function sectionText(text, titles, path) {
  const lines = text.split('\n');
  const keep = new Array(lines.length).fill(false);
  for (const title of titles) {
    const s = findSection(text, title);
    if (!s) throw new InputError(`default-path section missing: ${path} #${title}`);
    for (let i = s.line; i < s.end; i++) keep[i] = true;
  }
  return lines.filter((_, i) => keep[i]).join('\n');
}

function pad(s, n) {
  return String(s).padEnd(n);
}

export async function main(argv = process.argv.slice(2), out = process.stdout) {
  const { flags, positional } = parseArgs(argv);
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const skillDir = positional[0] ?? resolve(dirname(fileURLToPath(import.meta.url)), '..');
  if (flags['default-path']) {
    const r = checkDefaultPath(skillDir, { root: typeof flags.root === 'string' ? flags.root : undefined });
    const lines = [
      `budget-check --default-path: ${r.files.length} files (${r.files.filter((f) => f.sections).length} by section)`,
      ...r.prompts.map((p) => `${pad(p.status, 5)} ${pad('prompt', 15)} ${pad(p.path, 64)} ${p.words} / ${p.budget} words`),
      `${pad(r.status, 5)} default-path ${r.total} / ${r.budget} tokens (ceil(chars / 4))`,
      r.status === 'FAIL'
        ? `Result: FAIL DEFAULT_PATH (${r.total - r.budget} tokens over; remove text elsewhere or move it behind a trigger)`
        : 'Result: PASS',
    ];
    const { root: _root, ...result } = r; // the absolute root stays out of the JSON output
    return report({ ok: r.status !== 'FAIL', json: Boolean(flags.json), result, lines }, out);
  }
  const result = checkBudgets(skillDir, { guide: typeof flags.guide === 'string' ? flags.guide : undefined });
  const lines = [`budget-check: ${result.skillDir}`];
  for (const c of result.checks) {
    lines.push(`${pad(c.status, 5)} ${pad(c.kind, 15)} ${pad(c.path, 48)} ${c.words} / ${c.budget}`);
  }
  const fp = result.firstPath;
  lines.push(`${pad(fp.status, 5)} ${pad(fp.kind, 15)} ${pad(fp.path, 48)} ${fp.words} / ${fp.budget}`);
  lines.push(result.over === 0 ? 'Result: PASS (every budget met)' : `Result: FAIL (${result.over} over budget)`);
  return report({ ok: result.over === 0, json: Boolean(flags.json), result, lines }, out);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
