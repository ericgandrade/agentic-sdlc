// Polluter: leaves a shared cache entry in the process and a lock file on disk.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
globalThis.sharedCache = { user: 'stale' };
if (globalThis.__stateDir) writeFileSync(join(globalThis.__stateDir, 'leftover.lock'), 'held');
