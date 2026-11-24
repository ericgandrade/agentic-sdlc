// Fake test runner for find-polluter tests. Imports each fixture file in order in ONE process,
// so globals set by an earlier file are visible to later ones (in-process pollution).
// --state <dir> exposes a directory for persistent pollution; --reset deletes its marker file.
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--state') globalThis.__stateDir = args[++i];
  else if (args[i] === '--reset') globalThis.__reset = true;
  else files.push(args[i]);
}
if (globalThis.__reset) {
  const marker = join(globalThis.__stateDir, 'leftover.lock');
  if (existsSync(marker)) rmSync(marker);
  process.exit(0);
}
let failed = 0;
for (const f of files) {
  try {
    await import(pathToFileURL(resolve(f)).href);
    console.log(`PASS ${f}`);
  } catch (e) {
    failed++;
    console.log(`FAIL ${f}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
