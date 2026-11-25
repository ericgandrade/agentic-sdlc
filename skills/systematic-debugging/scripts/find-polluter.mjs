#!/usr/bin/env node
// find-polluter — bisect a test suite to find the test file that makes a target test fail
// only when it runs after other tests (order dependence, shared state, leftover files).
// Dependency-free Node >= 18 ES module. Part of the systematic-debugging skill (Agentic SDLC).
//
// Usage:
//   node find-polluter.mjs --cmd "<command template>" --target <test file> --files <path|glob> [--files ...]
//                          [--match <regex>] [--reset "<command>"] [--only-before] [--max-runs 20]
//                          [--timeout-ms 300000] [--cwd <dir>] [--json]
//
// Command template placeholders (exactly one):
//   {files}  one command per run; replaced by the candidate subset followed by the target, in order.
//            Use for in-process pollution (globals, module caches, singletons) with a runner that keeps
//            file order in one process, e.g. --cmd "npx vitest run --no-file-parallelism {files}".
//   {file}   one command per file; each candidate of the subset runs on its own, then the target.
//            Use for persistent pollution (files, databases, environment written to disk),
//            e.g. --cmd "npx vitest run {file}" or --cmd "pytest {file}".
//
// A run = one candidate subset followed by the target. The target "fails" when its command exits
// non-zero and, when --match is given, the combined output matches the regex (use the failure
// signature so unrelated failing candidates do not mislead the bisection). --reset runs before every
// run (not counted) to clear persistent state.
//
// Procedure: run the target alone (must pass), run every candidate + target (must fail), then halve
// the candidate set, keeping the half that still makes the target fail, until one file remains.
//
// Exit codes: 0 polluter found · 1 no single polluter (target fails alone, failure not reproduced,
// or the failure needs files from both halves) · 2 input missing or invalid · 3 max runs reached.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const EXIT = Object.freeze({ FOUND: 0, NOT_FOUND: 1, INPUT: 2, BOUND: 3 });
const DEFAULT_MAX_RUNS = 20;
const DEFAULT_TIMEOUT_MS = 300_000;
const SKIP_DIRS = new Set(['node_modules', '.git', '.hg', '.svn']);

class InputError extends Error {}

export function parseArgs(argv) {
  const flags = { files: [] };
  const booleans = new Set(['json', 'help', 'only-before']);
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) { flags.files.push(token); continue; }
    let key = token.slice(2);
    let value;
    const eq = key.indexOf('=');
    if (eq >= 0) { value = key.slice(eq + 1); key = key.slice(0, eq); }
    else if (booleans.has(key)) value = true;
    else if (i + 1 < argv.length) value = argv[++i];
    else throw new InputError(`--${key} needs a value`);
    if (key === 'files') flags.files.push(...String(value).split(',').map((s) => s.trim()).filter(Boolean));
    else flags[key] = value;
  }
  return flags;
}

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { re += '(?:.*/)?'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += /[.+^${}()|[\]\\]/.test(c) ? `\\${c}` : c;
  }
  return new RegExp(`^${re}$`);
}

const toPosix = (p) => p.split(sep).join('/');
const normalize = (p) => toPosix(p).replace(/^\.\//, '');

function walk(dir, root, out) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, root, out);
    else out.push(toPosix(relative(root, full)));
  }
  return out;
}

// Expands paths and globs relative to cwd; keeps the given order, globs sorted, duplicates removed.
export function expandFiles(patterns, cwd) {
  const seen = new Set();
  const files = [];
  let all = null;
  for (const raw of patterns) {
    const pattern = normalize(raw);
    let matches;
    if (/[*?]/.test(pattern)) {
      all ??= walk(cwd, cwd, []).sort();
      const re = globToRegExp(pattern);
      matches = all.filter((f) => re.test(f));
      if (matches.length === 0) throw new InputError(`no file matches ${raw}`);
    } else {
      const full = isAbsolute(pattern) ? pattern : join(cwd, pattern);
      if (!existsSync(full) || !statSync(full).isFile()) throw new InputError(`test file not found: ${raw}`);
      matches = [isAbsolute(pattern) ? toPosix(relative(cwd, pattern)) : pattern];
    }
    for (const m of matches) if (!seen.has(m)) { seen.add(m); files.push(m); }
  }
  return files;
}

export function quote(arg, platform = process.platform) {
  if (/^[\w./@:+=-]+$/.test(arg)) return arg;
  if (platform === 'win32') return `"${arg.replace(/"/g, '""')}"`;
  return `'${arg.replace(/'/g, `'\\''`)}'`;
}

function exec(command, cwd, timeoutMs) {
  const started = Date.now();
  const r = spawnSync(command, { cwd, shell: true, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
  return {
    code: r.status, timedOut: r.error?.code === 'ETIMEDOUT' || (r.signal != null && r.status == null),
    output: `${r.stdout || ''}${r.stderr || ''}`, ms: Date.now() - started,
  };
}

export function makeTrial({ cmd, target, cwd, match, reset, timeoutMs }) {
  const perFile = cmd.includes('{file}');
  return (subset) => {
    if (reset) exec(reset, cwd, timeoutMs);
    let res;
    let ms = 0;
    if (perFile) {
      for (const f of [...subset, target]) {
        res = exec(cmd.split('{file}').join(quote(f)), cwd, timeoutMs);
        ms += res.ms;
      }
    } else {
      res = exec(cmd.split('{files}').join([...subset, target].map((f) => quote(f)).join(' ')), cwd, timeoutMs);
      ms = res.ms;
    }
    const nonZero = res.code !== 0;
    const failed = nonZero && (!match || match.test(res.output));
    const lines = res.output.split(/\r?\n/).filter((l) => l.trim());
    const hit = match ? lines.find((l) => match.test(l)) : null;
    return { failed, exitCode: res.code, timedOut: res.timedOut, ms, evidence: (hit ?? lines.slice(-1)[0] ?? '').slice(0, 300) };
  };
}

// Pure bisection over an injected trial function, so the search logic is testable without processes.
export function bisect(candidates, trial, maxRuns) {
  const runs = [];
  let narrowed = [...candidates];
  const step = (label, subset) => {
    if (runs.length >= maxRuns) return null;
    const r = trial(subset);
    runs.push({ run: runs.length + 1, label, files: subset, ...r });
    return r;
  };
  const done = (status, extra = {}) => ({ status, runs, narrowed, ...extra });
  const bound = () => done('bound', { reason: `max runs ${maxRuns} reached with ${narrowed.length} candidate file(s) left` });

  const alone = step('target alone', []);
  if (!alone) return bound();
  if (alone.failed) return done('not-found', { reason: 'the target fails on its own: this is not pollution; debug the target directly' });
  const full = step(`${candidates.length} candidates + target`, candidates);
  if (!full) return bound();
  if (!full.failed) return done('not-found', { reason: 'the target passes after every candidate: failure not reproduced (flaky, different order, or parallel workers); raise the reproduction rate first' });

  while (narrowed.length > 1) {
    const mid = Math.ceil(narrowed.length / 2);
    const halves = [narrowed.slice(0, mid), narrowed.slice(mid)];
    let kept = null;
    for (const half of halves) {
      const r = step(`${half.length} candidates + target`, half);
      if (!r) return bound();
      if (r.failed) { kept = half; break; }
    }
    if (!kept) return done('not-found', { reason: `no single polluter: the failure needs files from both halves of the ${narrowed.length} remaining candidates` });
    narrowed = kept;
  }
  return done('found', { polluter: narrowed[0] });
}

const HELP = `find-polluter — bisect a test suite for the file that makes a target test fail only in the full run

Usage: node find-polluter.mjs --cmd "<template with {files} or {file}>" --target <file> --files <path|glob> [...]
       [--match <regex>] [--reset "<command>"] [--only-before] [--max-runs ${DEFAULT_MAX_RUNS}] [--timeout-ms ${DEFAULT_TIMEOUT_MS}]
       [--cwd <dir>] [--json]

  {files}  one command per run: candidate subset + target, in order (in-process pollution)
  {file}   one command per file, candidates then target (persistent pollution: files, DB, env on disk)
  --match  the target counts as failed only when the output matches this regex (the failure signature)
  --reset  command run before every run to clear persistent state
  --only-before  candidates = files listed before the target (mirrors the full-run order)

Exit: 0 polluter found · 1 no single polluter · 2 input missing or invalid · 3 max runs reached`;

export function main(argv = process.argv.slice(2), stdout = process.stdout) {
  let flags;
  const emit = (code, result, lines) => {
    if (flags?.json) stdout.write(JSON.stringify({ ok: code === EXIT.FOUND, exitCode: code, ...result }, null, 2) + '\n');
    else stdout.write(lines.join('\n') + '\n');
    return code;
  };
  try {
    flags = parseArgs(argv);
    if (flags.help) { stdout.write(HELP + '\n'); return EXIT.FOUND; }
    const cmd = flags.cmd;
    if (!cmd || cmd === true) throw new InputError('--cmd is required (a command template with {files} or {file})');
    const hasFiles = cmd.includes('{files}');
    const hasFile = cmd.includes('{file}');
    if (hasFiles === hasFile) throw new InputError('--cmd must contain exactly one of the placeholders {files} or {file}');
    if (!flags.target || flags.target === true) throw new InputError('--target is required (the test file that fails only in the full run)');
    if (flags.files.length === 0) throw new InputError('--files is required (paths or globs of the suite)');
    const cwd = resolve(flags.cwd && flags.cwd !== true ? flags.cwd : '.');
    if (!existsSync(cwd)) throw new InputError(`--cwd not found: ${flags.cwd}`);
    const maxRuns = flags['max-runs'] === undefined ? DEFAULT_MAX_RUNS : Number(flags['max-runs']);
    if (!Number.isInteger(maxRuns) || maxRuns < 2) throw new InputError('--max-runs must be an integer >= 2');
    const timeoutMs = flags['timeout-ms'] === undefined ? DEFAULT_TIMEOUT_MS : Number(flags['timeout-ms']);
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new InputError('--timeout-ms must be a positive integer');
    let match = null;
    if (flags.match !== undefined) {
      try { match = new RegExp(String(flags.match)); } catch (e) { throw new InputError(`--match is not a valid regex: ${e.message}`); }
    }
    const target = expandFiles([String(flags.target)], cwd)[0];
    const files = expandFiles(flags.files, cwd);
    const idx = files.indexOf(target);
    let candidates = files.filter((f) => f !== target);
    if (flags['only-before']) {
      if (idx < 0) throw new InputError('--only-before needs the target inside the --files list');
      candidates = files.slice(0, idx);
    }
    if (candidates.length === 0) throw new InputError('no candidate files besides the target');

    const trial = makeTrial({ cmd, target, cwd, match, reset: flags.reset && flags.reset !== true ? String(flags.reset) : null, timeoutMs });
    const r = bisect(candidates, trial, maxRuns);
    const code = { found: EXIT.FOUND, 'not-found': EXIT.NOT_FOUND, bound: EXIT.BOUND }[r.status];
    const lines = [`find-polluter: ${candidates.length} candidate(s) · target ${target} · mode ${hasFiles ? '{files}' : '{file}'} · max runs ${maxRuns}`];
    for (const run of r.runs) {
      lines.push(`run ${run.run} [${run.label}] ${run.failed ? 'FAIL' : 'pass'} · exit ${run.exitCode ?? 'none'}${run.timedOut ? ' (timeout)' : ''} · ${(run.ms / 1000).toFixed(2)} s`);
    }
    if (r.status === 'found') {
      lines.push(`POLLUTER: ${r.polluter} (${r.runs.length} runs)`);
      lines.push(`Confirm: ${hasFiles ? cmd.split('{files}').join(`${quote(r.polluter)} ${quote(target)}`) : `${cmd.split('{file}').join(quote(r.polluter))} && ${cmd.split('{file}').join(quote(target))}`}`);
      lines.push('Next: name the state the polluter leaves (global, module cache, file, env, DB row); give each test a fresh fixture; add the regression test.');
    } else if (r.status === 'bound') {
      lines.push(`BOUND: ${r.reason}. Remaining: ${r.narrowed.join(' ')}`);
    } else {
      lines.push(`NOT FOUND: ${r.reason}${r.narrowed.length < candidates.length ? `. Smallest failing set: ${r.narrowed.join(' ')}` : ''}`);
    }
    return emit(code, {
      status: r.status, target, mode: hasFiles ? 'files' : 'file', polluter: r.polluter ?? null, reason: r.reason ?? null,
      candidates: candidates.length, narrowed: r.narrowed, runCount: r.runs.length, maxRuns,
      runs: r.runs.map(({ run, label, files: f, failed, exitCode, timedOut, ms, evidence }) => ({ run, label, files: f, failed, exitCode, timedOut, ms, evidence })),
    }, lines);
  } catch (e) {
    if (!(e instanceof InputError)) throw e;
    return emit(EXIT.INPUT, { status: 'input-error', error: e.message }, [`find-polluter: ${e.message}`, 'Run with --help for usage.']);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exitCode = main();
}
