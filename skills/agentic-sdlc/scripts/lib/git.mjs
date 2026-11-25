// Git helpers for agentic-sdlc scripts (Node >= 18, no dependencies).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { InputError } from './cli.mjs';

export function git(args, { cwd = process.cwd(), input } = {}) {
  try {
    return execFileSync('git', args, {
      cwd,
      input,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (e) {
    const msg = (e.stderr || e.message || '').toString().trim();
    throw new InputError(`git ${args.join(' ')} failed: ${msg}`);
  }
}

export function isRepo(cwd = process.cwd()) {
  try {
    return git(['rev-parse', '--is-inside-work-tree'], { cwd }).trim() === 'true';
  } catch {
    return false;
  }
}

export function topLevel(cwd = process.cwd()) {
  return git(['rev-parse', '--show-toplevel'], { cwd }).trim();
}

export function headSha(cwd = process.cwd()) {
  try {
    return git(['rev-parse', 'HEAD'], { cwd }).trim();
  } catch {
    return null;
  }
}

export function currentBranch(cwd = process.cwd()) {
  return git(['rev-parse', '--abbrev-ref', 'HEAD'], { cwd }).trim();
}

// Default branch: origin/HEAD when set, else "main" or "master" when present, else the current branch.
export function defaultBranch(cwd = process.cwd()) {
  try {
    return git(['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'], { cwd }).trim().replace(/^origin\//, '');
  } catch {
    for (const b of ['main', 'master']) {
      try {
        git(['rev-parse', '--verify', '--quiet', `refs/heads/${b}`], { cwd });
        return b;
      } catch { /* try next */ }
    }
    return currentBranch(cwd);
  }
}

// Review records (specs/<slug>/review.md, docs/reviews/) hold the fingerprint they cite, so they never feed it.
const REVIEW_RECORD = /^specs\/[^/]+\/review\.md$/;
function excluded(path, exclude) {
  return REVIEW_RECORD.test(path) || exclude.some((p) => path === p || path.startsWith(p.endsWith('/') ? p : p + '/'));
}

// Working-tree fingerprint: SHA-256 over the index (`git ls-files -s`) plus content hashes of
// every modified or untracked file, skipping paths under `exclude` and review records. Equal fingerprints mean
// the tested tree is byte-identical. Paths are repository-relative; any cwd inside the repository
// gives the same result. Returns { fingerprint, short (12 hex), clean, head }.
export function fingerprint({ cwd: start = process.cwd(), exclude = ['.agentic-sdlc/evidence/', 'docs/reviews/'] } = {}) {
  if (!isRepo(start)) throw new InputError(`not a git repository: ${start}`);
  const cwd = topLevel(start);
  const h = createHash('sha256');
  const index = git(['ls-files', '-s', '-z'], { cwd }).split('\0').filter(Boolean);
  for (const entry of index) {
    const path = entry.slice(entry.indexOf('\t') + 1);
    if (!excluded(path, exclude)) h.update('I ' + entry + '\n');
  }
  const status = git(['status', '--porcelain', '-z', '--untracked-files=all'], { cwd }).split('\0');
  const dirty = [];
  for (let i = 0; i < status.length; i++) {
    const rec = status[i];
    if (!rec) continue;
    const code = rec.slice(0, 2);
    const path = rec.slice(3);
    if (code[0] === 'R' || code[0] === 'C') i++; // next record is the source path
    if (!excluded(path, exclude)) dirty.push({ code, path });
  }
  dirty.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  for (const { code, path } of dirty) {
    let blob = 'deleted';
    if (!code.includes('D')) blob = git(['hash-object', '--', path], { cwd }).trim();
    h.update(`W ${code} ${path} ${blob}\n`);
  }
  const full = h.digest('hex');
  return { fingerprint: full, short: full.slice(0, 12), clean: dirty.length === 0, head: headSha(cwd) };
}

// Commits in a range (e.g. "main..HEAD"), oldest first: [{ sha, subject, body }].
export function log({ cwd = process.cwd(), range = 'HEAD' } = {}) {
  const SEP = '\x1e';
  const out = git(['log', '--reverse', `--format=%H%x1f%s%x1f%b${SEP}`, range], { cwd });
  return out
    .split(SEP)
    .map((r) => r.replace(/^\n/, ''))
    .filter((r) => r.trim())
    .map((r) => {
      const [sha, subject, body = ''] = r.split('\x1f');
      return { sha, subject, body: body.replace(/\n+$/, '') };
    });
}

// Trailers ("Key: value" lines in the last paragraph of a message): { key: [values] }.
export function parseTrailers(message) {
  const paras = String(message).replace(/\r\n?/g, '\n').trim().split(/\n\s*\n/);
  const last = paras[paras.length - 1] || '';
  const out = {};
  const lines = last.split('\n');
  if (!lines.every((l) => /^[A-Za-z][\w-]*:\s/.test(l))) return out;
  for (const l of lines) {
    const idx = l.indexOf(':');
    const key = l.slice(0, idx);
    (out[key] ||= []).push(l.slice(idx + 1).trim());
  }
  return out;
}

const TASK = /^T\d+$/;
const AC = /^AC-\d+$/;

// Task and AC IDs from a commit message: "Refs: T3 AC-2" trailer lines and "[T3, AC-2]" in the subject.
export function refsFromMessage(message) {
  const tokens = [];
  for (const m of String(message).matchAll(/^Refs:\s*(.+)$/gim)) tokens.push(...m[1].split(/[\s,]+/));
  const subject = String(message).split('\n')[0];
  for (const m of subject.matchAll(/\[([^\]]+)\]/g)) tokens.push(...m[1].split(/[\s,]+/));
  const uniq = (xs) => [...new Set(xs)];
  return {
    tasks: uniq(tokens.filter((t) => TASK.test(t))),
    acs: uniq(tokens.filter((t) => AC.test(t))),
  };
}

// Files changed between two refs (three-dot diff from the merge base).
export function changedFiles(base, head = 'HEAD', { cwd = process.cwd() } = {}) {
  return git(['diff', '--name-only', '-z', `${base}...${head}`], { cwd }).split('\0').filter(Boolean);
}

// CLI: `node scripts/lib/git.mjs fingerprint` prints "<12 hex> clean|dirty head=<sha>".
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] !== 'fingerprint') {
    process.stderr.write('usage: node scripts/lib/git.mjs fingerprint\n');
    process.exit(2);
  }
  try {
    const f = fingerprint();
    process.stdout.write(`${f.short} ${f.clean ? 'clean' : 'dirty'} head=${f.head}\n`);
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exit(2);
  }
}
