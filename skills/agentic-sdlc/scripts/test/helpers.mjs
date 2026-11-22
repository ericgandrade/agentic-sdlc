// Test helpers: temporary git repositories under scripts/test/.work/ (never the system temp dir).

import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORK = join(dirname(fileURLToPath(import.meta.url)), '.work');

let counter = 0;
const created = [];

// Fresh directory under .work/ owned by this process; removed by cleanup().
export function makeDir(name = 'dir') {
  const dir = join(WORK, `${name}-${process.pid}-${++counter}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  created.push(dir);
  return dir;
}

export function sh(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

export function makeRepo(name = 'repo') {
  const dir = makeDir(name);
  sh(dir, 'init', '-q', '-b', 'main');
  sh(dir, 'config', 'user.name', 'Test');
  sh(dir, 'config', 'user.email', 'test@example.com');
  sh(dir, 'config', 'commit.gpgsign', 'false');
  return dir;
}

export function write(dir, rel, content) {
  const p = join(dir, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
}

export function commit(dir, message) {
  sh(dir, 'add', '-A');
  sh(dir, 'commit', '-q', '-m', message);
}

// Removes only this process's directories, so test files running in parallel do not collide.
export function cleanup() {
  for (const dir of created.splice(0)) rmSync(dir, { recursive: true, force: true });
}
