#!/usr/bin/env node
// guard — host-enforced authority guard. `pre-tool` decides allow / deny for one tool call read as hook
// JSON on stdin; `human-turn` records that a real human prompt arrived (hash only, never the text).
//
// Claude Code hook contract (https://code.claude.com/docs/en/hooks, checked 2026-11-27):
//   stdin: { session_id, cwd, hook_event_name, tool_name, tool_input, ... }; UserPromptSubmit adds { prompt }.
//   PreToolUse deny: exit 0 with stdout {"hookSpecificOutput":{"hookEventName":"PreToolUse",
//   "permissionDecision":"deny","permissionDecisionReason":"…"}}. Exit 0 with no output = normal permission
//   flow. "allow" would skip the permission prompt, so the guard never emits it. A crash, timeout or exit
//   other than 0/2 does not block unless the hook entry sets "onFailure": "block" (the template does).
//   UserPromptSubmit stdout on exit 0 is added to the context, so human-turn prints nothing in hook mode.

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EXIT, InputError, parseArgs, report, run } from './lib/cli.mjs';
import { currentBranch, defaultBranch, isRepo, topLevel } from './lib/git.mjs';
import { normalize, parseSections, parseTables } from './lib/md.mjs';
import { specPath } from './plan-graph.mjs';
import { acceptanceTestFiles, approvalState, ensureRunsDir, inPlan, readPlanTasks } from './run-ledger.mjs';
import { EXPLICIT_YES, NOT_APPROVAL } from './spec-lint.mjs';

export const HUMAN_TURNS = '.agentic-sdlc/runs/human-turns.jsonl';
export const APPROVAL_WINDOW_MIN = 15;
export const HOOK_HOSTS = ['claude-code'];

const HELP = `Usage: node guard.mjs pre-tool [--host claude-code] [--json]
       node guard.mjs human-turn [--host claude-code] [--json]

pre-tool reads one tool call as hook JSON on stdin ({tool_name, tool_input, session_id, cwd}) and decides:
  G01 deny  shell: git push (except the current feature branch in attended mode), git merge on the default branch, git tag <name>, gh pr merge, gh release create,
            npm/pnpm/yarn/bun publish, cargo publish, docker push, a "deploy" word (npm run deploy,
            firebase deploy …), terraform/kubectl apply, helm install/upgrade, any --force flag
  G02 deny  a file write outside specs/, docs/, .agentic-sdlc/runs/, .agentic-sdlc/evidence/ and the
            acceptance-test files while a Standard or Full item has no valid Design sign-off
            (a path in the Files of an approved plan stays writable)
  G03 deny  a write (file tool or shell writer/redirect) to .agentic-sdlc/bin/**, .agentic-sdlc/config.json,
            ${HUMAN_TURNS}, CI workflow files, CODEOWNERS, host permission files
            (.claude/settings*.json, .codex/config.toml, opencode.json, .gemini/settings.json,
            .github/agents/**) or a change to the AGENTIC-SDLC block of AGENTS.md / CLAUDE.md,
            unless an approved plan's Files list the path (S20)
  G04 deny  a write that adds an approved row to ## Approvals, ## Test sign-off or ## Approval with no
            explicit human approval turn in the last ${APPROVAL_WINDOW_MIN} minutes (human-turn records)
  G00 deny  guard error: unparsable input or an unreadable artifact (fail closed)
Reads and every other tool are allowed.
human-turn reads the UserPromptSubmit JSON ({prompt, session_id}) and appends
{at, session, promptSha256, explicitApproval} to ${HUMAN_TURNS}. It never blocks the prompt.

--host claude-code  hook mode: pre-tool always exits 0, a deny (or guard error) is a permissionDecision
                    JSON on stdout, an allow prints nothing; human-turn prints nothing and exits 0.
Without --host: exit 0 allow · 1 deny · 2 input missing or unparsable (also printed as a deny decision).`;

// ---------------------------------------------------------------------------------------------
// Paths

const PROTECTED = [
  (p) => p.startsWith('.agentic-sdlc/bin/'),
  (p) => p === '.agentic-sdlc/config.json' || p === HUMAN_TURNS,
  (p) => p.startsWith('.github/workflows/') || p === '.gitlab-ci.yml' || p === 'azure-pipelines.yml',
  (p) => ['CODEOWNERS', '.github/CODEOWNERS', 'docs/CODEOWNERS', '.gitlab/CODEOWNERS'].includes(p),
  (p) => /^\.claude\/settings(\.[\w-]+)?\.json$/.test(p) || p === '.codex/config.toml' || p === 'opencode.json' || p === '.gemini/settings.json',
  (p) => p.startsWith('.github/agents/'),
];
const isProtected = (rel) => PROTECTED.some((f) => f(rel));
const BLOCK_FILES = ['AGENTS.md', 'CLAUDE.md'];
const NON_CODE = ['specs/', 'docs/', '.agentic-sdlc/runs/', '.agentic-sdlc/evidence/'];

const posix = (p) => p.split(sep).join('/');

// Repository-relative path, or null when the target lies outside the repository.
function relPath(root, cwd, file) {
  const abs = resolve(cwd, file);
  const roots = [root];
  try { roots.push(realpathSync(root)); } catch { /* keep root */ }
  const cands = [abs];
  try { cands.push(join(realpathSync(dirname(abs)), basename(abs))); } catch { /* parent missing */ }
  for (const r of roots) {
    for (const a of cands) {
      const rel = relative(r, a);
      if (!rel.startsWith('..') && !isAbsolute(rel)) return posix(rel);
    }
  }
  return null;
}

function rootOf(cwd) {
  return isRepo(cwd) ? topLevel(cwd) : resolve(cwd);
}

const readText = (p) => (existsSync(p) ? normalize(readFileSync(p, 'utf8')) : null);

// ---------------------------------------------------------------------------------------------
// Items, plans and sign-off state

function specFolders(root) {
  const d = join(root, 'specs');
  if (!existsSync(d)) return [];
  return readdirSync(d, { withFileTypes: true })
    .filter((e) => e.isDirectory() && existsSync(join(d, e.name, 'spec.md')))
    .map((e) => `specs/${e.name}`)
    .sort();
}

// { open: [items without a valid Design sign-off on Standard/Full], files: [Files of approved plans + acceptance tests] }
function itemState(root) {
  const open = [];
  const files = [];
  for (const s of specFolders(root)) {
    const abs = join(root, s);
    files.push(...acceptanceTestFiles(abs));
    if (existsSync(join(abs, 'release-notes.md'))) continue; // released: its sign-offs are history
    const path = specPath(readText(join(abs, 'spec.md'))) || 'Standard'; // unknown path → treated as Standard
    const plan = join(abs, 'plan.md');
    let valid = false;
    if (existsSync(plan)) {
      const a = approvalState(plan);
      valid = a.plan.valid && (!a.spec || a.spec.valid);
      if (valid) for (const t of readPlanTasks(readText(plan)).tasks) files.push(...(t.files || []));
    }
    if (!valid && path !== 'Quick') open.push(`${s} (${path})`);
  }
  return { open, files };
}

function approvedPlanFiles(root) {
  try { return itemState(root).files; } catch { return []; }
}

const SIGNOFF = /^(approvals|test sign-off|approval)$/i;
const PLACEHOLDER = /<[^>]*>/;
const isApproval = (text) => EXPLICIT_YES.test(text) && !NOT_APPROVAL.test(text);

// Approved sign-off rows (normalized text) in ## Approvals, ## Test sign-off and ## Approval.
export function signoffRows(md) {
  const rows = new Set();
  if (!md) return rows;
  for (const s of parseSections(md)) {
    if (!SIGNOFF.test(s.title.trim())) continue;
    const body = s.body.replace(/<!--[\s\S]*?-->/g, '');
    for (const t of parseTables(body)) {
      const dec = t.header.findIndex((h) => /^decision\b/i.test(h.trim()));
      for (const r of t.rows) {
        const text = r.map((c) => c.trim()).join(' | ');
        if (PLACEHOLDER.test(text)) continue;
        if (isApproval(dec >= 0 ? r[dec] ?? '' : text)) rows.add(text);
      }
    }
    for (const l of body.split('\n')) {
      if (!l.includes('|') && !PLACEHOLDER.test(l) && isApproval(l)) rows.add(l.trim());
    }
  }
  return rows;
}

function recentApproval(root, session, at = Date.now()) {
  const text = readText(join(root, HUMAN_TURNS));
  if (!text) return false;
  for (const line of text.split('\n')) {
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    if (!r || r.explicitApproval !== true) continue;
    const t = Date.parse(r.at);
    if (Number.isNaN(t) || at - t > APPROVAL_WINDOW_MIN * 60000 || t - at > 60000) continue;
    if (session && r.session !== session) continue; // a hook call carries its session: only that session's turns count
    return true;
  }
  return false;
}

const blockOf = (md) => {
  const m = (md || '').match(/<!-- AGENTIC-SDLC:BEGIN -->[\s\S]*?(<!-- AGENTIC-SDLC:END -->|$)/);
  return m ? m[0] : null;
};

// ---------------------------------------------------------------------------------------------
// Tool input normalization

const SHELL_TOOLS = new Set(['bash', 'shell', 'run_shell_command', 'run_terminal_cmd', 'run_command']);
const WRITE_TOOLS = new Set(['write', 'edit', 'multiedit', 'notebookedit', 'write_file', 'replace', 'create', 'apply_patch', 'edit_file', 'write_to_file', 'replace_file_content']);

const str = (v) => (typeof v === 'string' ? v : null);

// Returns [{ file, before → after simulation }] for a write tool call.
function writeTargets(tool, input, cwd) {
  if (tool === 'apply_patch') {
    const patch = str(input.patch) ?? str(input.input) ?? str(input.command) ?? '';
    const files = [...patch.matchAll(/^\*\*\* (?:Add|Update|Delete) File: (.+)$/gm)].map((m) => m[1].trim());
    if (!files.length) throw new InputError('apply_patch without a file header');
    return files.map((file) => ({ file, after: null }));
  }
  const file = str(input.file_path) ?? str(input.notebook_path) ?? str(input.path) ?? str(input.filePath) ?? str(input.TargetFile);
  if (!file) throw new InputError(`${tool}: tool_input has no file path`);
  const abs = resolve(cwd, file);
  const before = readText(abs) ?? '';
  const apply = (text, oldS, newS, all) => {
    if (typeof oldS !== 'string' || typeof newS !== 'string') return text;
    if (oldS === '') return newS + text;
    return all ? text.split(oldS).join(newS) : text.replace(oldS, () => newS);
  };
  let after = before;
  const content = str(input.content) ?? str(input.file_text) ?? str(input.CodeContent);
  if (content !== null && (tool === 'write' || tool === 'write_file' || tool === 'create' || tool === 'write_to_file' || input.old_string === undefined && input.old_str === undefined)) {
    after = normalize(content);
  } else if (Array.isArray(input.edits)) {
    for (const e of input.edits) after = apply(after, e?.old_string, e?.new_string, e?.replace_all);
  } else {
    after = apply(after, input.old_string ?? input.old_str, input.new_string ?? input.new_str, input.replace_all);
  }
  if (tool === 'notebookedit') after = before;
  return [{ file, before, after }];
}

// ---------------------------------------------------------------------------------------------
// Shell parsing: simple commands with argv and redirect targets

function shellCommands(cmd, depth = 0) {
  if (depth > 4) throw new InputError('shell command nested too deeply');
  const out = [];
  let src = String(cmd);
  // Command substitutions run too: analyse them as commands of their own.
  src = src.replace(/\$\(([^()]*)\)|`([^`]*)`/g, (_, a, b) => { out.push(...shellCommands(a ?? b, depth + 1)); return ' __SUBST__ '; });
  let argv = [];
  let redirects = [];
  let cur = '';
  let has = false;
  let quote = null;
  let nextRedirect = false;
  const endWord = () => {
    if (!has) return;
    if (nextRedirect) { redirects.push(cur); nextRedirect = false; } else argv.push(cur);
    cur = ''; has = false;
  };
  const endCmd = () => {
    endWord();
    if (argv.length || redirects.length) out.push({ argv, redirects });
    argv = []; redirects = [];
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === '\\' && quote === '"' && i + 1 < src.length) cur += src[++i];
      else cur += c;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; has = true; continue; }
    if (c === '\\' && i + 1 < src.length) { cur += src[++i]; has = true; continue; }
    if (c === ';' || c === '|' || c === '&' || c === '\n') {
      if (c === '&' && src[i - 1] === '>') continue; // 2>&1 style
      endCmd();
      continue;
    }
    if (c === '>' || c === '<') {
      if (/^\d$/.test(cur)) { cur = ''; has = false; }
      endWord();
      if (c === '>') {
        if (src[i + 1] === '>') i++;
        if (src[i + 1] === '&') { i++; while (/\d/.test(src[i + 1] || '')) i++; continue; }
        nextRedirect = true;
      }
      continue;
    }
    if (/\s/.test(c)) { endWord(); continue; }
    cur += c; has = true;
  }
  if (quote) throw new InputError('unbalanced quote in shell command');
  endCmd();
  return out;
}

const WRAPPERS = new Set(['sudo', 'command', 'exec', 'nohup', 'time', 'env', 'nice', 'xargs']);
const WRITERS = new Set(['cp', 'mv', 'tee', 'rm', 'truncate', 'ln', 'install', 'chmod', 'chown', 'touch', 'dd', 'rsync', 'unlink']);
const READERS = new Set(['cat', 'head', 'tail', 'grep', 'wc', 'less', 'jq', 'ls', 'stat']);
const GIT_OPT_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);

function strip(argv) {
  let a = [...argv];
  for (;;) {
    while (a.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(a[0])) a = a.slice(1);
    if (a.length && WRAPPERS.has(basename(a[0]))) { a = a.slice(1); while (a.length && a[0].startsWith('-')) a = a.slice(1); continue; }
    return a;
  }
}

// Authority violation of one simple command, or null.
// An unattended run is open when a run ledger starts in mode "unattended" and has no finish event.
function unattendedRunOpen(root) {
  const runs = join(root, '.agentic-sdlc', 'runs');
  if (!existsSync(runs)) return false;
  for (const id of readdirSync(runs)) {
    const p = join(runs, id, 'ledger.jsonl');
    if (!existsSync(p)) continue;
    const events = readFileSync(p, 'utf8').split('\n').map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    if (events.some((e) => e.type === 'start' && e.mode === 'unattended') && !events.some((e) => e.type === 'finish')) return true;
  }
  return false;
}

// `git push` (references/autonomous.md §5, agents/developer.md): attended mode may push the current feature branch;
// never the default branch, tags, every branch, a mirror, a deleted ref or a forced (+) refspec, and nothing while
// an unattended run is open. Returns the refused action, or null when the push is allowed.
function pushVerdict(rest, root) {
  if (unattendedRunOpen(root)) return 'git push during an unattended run';
  if (rest.some((x) => /^(--tags|--all|--mirror|--delete|-d|--prune)$/.test(x))) return 'git push of tags, all branches, a mirror or a deletion';
  let cur = null;
  let def = null;
  try { cur = currentBranch(root); def = defaultBranch(root); } catch { /* unknown → refuse */ }
  if (!cur || !def || cur === def || cur === 'HEAD') return `git push from the default branch (${def ?? 'unknown'})`;
  const refspecs = rest.filter((x) => !x.startsWith('-')).slice(1); // first positional is the remote
  for (const spec of refspecs) {
    if (spec.startsWith('+') || spec.startsWith(':')) return 'git push with a forced (+) or deleting (:) refspec';
    const dst = (spec.includes(':') ? spec.split(':').pop() : spec).replace(/^refs\/heads\//, '');
    const src = spec.includes(':') ? spec.split(':')[0] : spec;
    if (dst === def || (dst === 'HEAD' && src === 'HEAD' && cur === def)) return `git push to the default branch (${def})`;
    if (dst === 'HEAD' && spec.includes(':')) return 'git push to a symbolic remote HEAD';
  }
  return null;
}

function authority(argv, root) {
  const prog = basename(argv[0] || '');
  const args = argv.slice(1);
  if (args.some((x) => /^--force(?:-with-lease|-if-includes)?(?:=|$)/.test(x))) return `${prog} with a --force flag`;
  if (prog === 'git') {
    let i = 0;
    while (i < args.length && args[i].startsWith('-')) i += GIT_OPT_WITH_VALUE.has(args[i]) ? 2 : 1;
    const sub = args[i];
    const rest = args.slice(i + 1);
    if (sub === 'push') return pushVerdict(rest, root);
    if (sub === 'tag' && rest.length && !rest.some((x) => /^(-l|--list|-v|--verify|-n\d*|--contains|--points-at)$/.test(x))) return 'git tag (creates or moves a tag)';
    if (sub === 'merge' && !rest.some((x) => x === '--abort' || x === '--quit')) {
      let cur = null;
      let def = null;
      try { cur = currentBranch(root); def = defaultBranch(root); } catch { /* unknown → refuse */ }
      if (!cur || cur === def) return `git merge into the default branch (${def ?? 'unknown'})`;
    }
    return null;
  }
  if (prog === 'gh' && args[0] === 'pr' && args[1] === 'merge') return 'gh pr merge';
  if (prog === 'gh' && args[0] === 'release' && ['create', 'upload', 'edit'].includes(args[1])) return `gh release ${args[1]}`;
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(prog) && args.some((x) => x === 'publish')) return `${prog} publish`;
  if (['cargo', 'gem', 'twine', 'poetry'].includes(prog) && args.some((x) => x === 'publish' || x === 'push' || x === 'upload')) return `${prog} ${args[0]}`;
  if (prog === 'docker' && args[0] === 'push') return 'docker push';
  if ((prog === 'terraform' || prog === 'tofu' || prog === 'kubectl') && args.includes('apply')) return `${prog} apply`;
  if (prog === 'helm' && (args[0] === 'install' || args[0] === 'upgrade')) return `helm ${args[0]}`;
  const dep = args.find((x) => /^deploy(?::|$)/i.test(x) || /(?:^|:)deploy$/i.test(x));
  if (dep) return `deploy (${prog} ${dep})`;
  return null;
}

function protectedShellWrite(argv, redirects, root, cwd) {
  const targets = [...redirects];
  const prog = basename(argv[0] || '');
  const inPlace = (prog === 'sed' || prog === 'perl') && argv.some((x) => /^-[a-zA-Z]*i/.test(x));
  if (WRITERS.has(prog) || inPlace) targets.push(...argv.slice(1).filter((x) => !x.startsWith('-')).map((x) => x.replace(/^of=/, '')));
  for (const t of targets) {
    const rel = relPath(root, cwd, t);
    if (rel && (isProtected(rel) || BLOCK_FILES.includes(rel))) return rel;
  }
  return null;
}

function analyzeShell(command, root, cwd, depth = 0) {
  for (const { argv: raw, redirects } of shellCommands(command)) {
    const argv = strip(raw);
    const prog = basename(argv[0] || '');
    if (['bash', 'sh', 'zsh', 'dash'].includes(prog)) {
      const c = argv.indexOf('-c');
      if (c >= 0 && argv[c + 1] !== undefined) {
        const inner = analyzeShell(argv[c + 1], root, cwd, depth + 1);
        if (inner) return inner;
      }
    }
    if (prog === 'eval') {
      const inner = analyzeShell(argv.slice(1).join(' '), root, cwd, depth + 1);
      if (inner) return inner;
    }
    // Only the host's UserPromptSubmit hook records human turns; an agent command never does.
    const forged = argv.some((x) => /guard\.mjs$/.test(x)) && argv.includes('human-turn');
    if (forged || (argv.some((x) => x.includes('human-turns.jsonl')) && !READERS.has(prog))) {
      return { rule: 'G03', reason: `${HUMAN_TURNS} is written only by the host's prompt hook; an agent command may read it, never write it` };
    }
    const p = protectedShellWrite(argv, redirects, root, cwd);
    if (p) return { rule: 'G03', reason: `shell write to protected path ${p} (references/security.md S20); a human or an approved plan task that lists it makes this change` };
    const a = authority(argv, root);
    if (a) return { rule: 'G01', reason: `${a} is outside the agent's authority (references/autonomous.md §5); the human runs it` };
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// Decision

const allow = (extra = {}) => ({ decision: 'allow', rule: null, reason: 'allowed', ...extra });
const deny = (rule, reason) => ({ decision: 'deny', rule, reason });

// Decides one tool call. `payload` is the hook JSON; throws InputError on unparsable input.
export function decide(payload, { root, now = Date.now() } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new InputError('hook input is not a JSON object');
  const name = str(payload.tool_name) ?? str(payload.toolName) ?? str(payload.tool);
  if (!name) throw new InputError('hook input has no tool_name');
  let input = payload.tool_input ?? payload.toolInput ?? payload.input ?? {};
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { input = { command: input }; }
  }
  if (!input || typeof input !== 'object') throw new InputError('tool_input is not an object');
  const cwd = str(payload.cwd) ? resolve(payload.cwd) : root ?? process.cwd();
  root = root ?? rootOf(cwd);
  const tool = name.toLowerCase();
  const session = str(payload.session_id) ?? str(payload.sessionId);

  if (SHELL_TOOLS.has(tool)) {
    const command = str(input.command) ?? str(input.cmd) ?? (Array.isArray(input.command) ? input.command.join(' ') : null);
    if (command === null) throw new InputError(`${name}: tool_input has no command`);
    const hit = analyzeShell(command, root, cwd);
    return hit ? deny(hit.rule, hit.reason) : allow();
  }
  if (!WRITE_TOOLS.has(tool)) return allow();

  let plan = null;
  const planFiles = () => (plan ??= approvedPlanFiles(root));
  for (const t of writeTargets(tool, input, cwd)) {
    const rel = relPath(root, cwd, t.file);
    if (rel === null) continue; // outside the repository: not this repository's policy
    if (isProtected(rel) && (rel === HUMAN_TURNS || !inPlan(rel, planFiles()))) {
      return deny('G03', `${rel} is a protected path (references/security.md S20); a human or an approved plan task that lists it makes this change`);
    }
    if (BLOCK_FILES.includes(rel) && t.after !== null && blockOf(t.before) !== blockOf(t.after) && !inPlan(rel, planFiles())) {
      return deny('G03', `the AGENTIC-SDLC block of ${rel} is protected (references/security.md S20); project-context proposes the change and a human applies it`);
    }
    if (rel.endsWith('.md') && t.after !== null) {
      const before = signoffRows(t.before);
      const added = [...signoffRows(t.after)].filter((r) => !before.has(r));
      if (added.length && !recentApproval(root, session, now)) {
        return deny('G04', `${rel} gains an approved sign-off row ("${added[0].slice(0, 80)}") but no explicit human approval turn was recorded in the last ${APPROVAL_WINDOW_MIN} minutes (references/governance.md §2); ask, end the turn, record the answer`);
      }
    }
    const nonCode = NON_CODE.some((p) => rel.startsWith(p)) || BLOCK_FILES.includes(rel);
    if (!nonCode) {
      const st = itemState(root); // InputError → guard error: fail closed for code writes
      if (st.open.length && !inPlan(rel, st.files)) {
        return deny('G02', `code write to ${rel} before a valid Design sign-off on ${st.open.join(', ')} (references/governance.md §7); finish Design first`);
      }
    }
  }
  return allow();
}

// ---------------------------------------------------------------------------------------------
// human-turn

export function recordHumanTurn(payload, { cwd = process.cwd() } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new InputError('prompt input is not a JSON object');
  const prompt = str(payload.prompt) ?? str(payload.user_prompt);
  if (prompt === null) throw new InputError('prompt input has no prompt field');
  const root = rootOf(str(payload.cwd) ? resolve(payload.cwd) : cwd);
  const rec = {
    at: new Date().toISOString(),
    session: str(payload.session_id) ?? str(payload.sessionId) ?? null,
    promptSha256: createHash('sha256').update(prompt, 'utf8').digest('hex'),
    explicitApproval: isApproval(prompt),
  };
  ensureRunsDir(root);
  appendFileSync(join(root, HUMAN_TURNS), JSON.stringify(rec) + '\n');
  return rec;
}

// ---------------------------------------------------------------------------------------------
// CLI

function readStdin() {
  try { return readFileSync(0, 'utf8'); } catch { return ''; }
}

function parsePayload(text) {
  if (!text.trim()) throw new InputError('no hook input on stdin');
  try { return JSON.parse(text); } catch (e) { throw new InputError(`hook input is not JSON (${e.message})`); }
}

export async function main(argv = process.argv.slice(2), out = process.stdout, err = process.stderr, stdin = readStdin) {
  const { flags, positional } = parseArgs(argv);
  if (flags.help) {
    out.write(HELP + '\n');
    return EXIT.PASS;
  }
  const cmd = positional[0];
  const host = flags.host === undefined ? null : String(flags.host);
  if (host !== null && !HOOK_HOSTS.includes(host)) throw new InputError(`--host must be one of ${HOOK_HOSTS.join(', ')} (other hosts use the exit codes)`);
  const json = Boolean(flags.json);

  if (cmd === 'pre-tool') {
    let d;
    let code;
    try {
      d = decide(parsePayload(stdin()));
      code = d.decision === 'allow' ? EXIT.PASS : EXIT.FAIL;
    } catch (e) {
      d = { decision: 'deny', rule: 'G00', reason: `guard error: ${e.message}` };
      code = EXIT.INPUT;
    }
    if (host === 'claude-code') {
      if (d.decision === 'deny') {
        const reason = d.rule === 'G00' ? d.reason : `${d.rule}: ${d.reason}`;
        out.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }) + '\n');
      }
      return EXIT.PASS;
    }
    if (json) {
      out.write(JSON.stringify({ ok: code === EXIT.PASS, exitCode: code, ...d }, null, 2) + '\n');
      return code;
    }
    return report({ code, lines: [d.decision === 'allow' ? 'allow' : `deny ${d.rule}: ${d.reason}`] }, out);
  }

  if (cmd === 'human-turn') {
    if (host !== null) {
      try { recordHumanTurn(parsePayload(stdin())); } catch (e) { err.write(`guard human-turn: ${e.message}\n`); }
      return EXIT.PASS; // never blocks the prompt
    }
    const rec = recordHumanTurn(parsePayload(stdin()));
    return report({ ok: true, json, result: { record: rec }, lines: [`recorded human turn · explicit approval: ${rec.explicitApproval ? 'yes' : 'no'}`] }, out);
  }

  throw new InputError(`unknown command ${cmd ?? '(none)'}: use pre-tool or human-turn (--help)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(() => main());
}
