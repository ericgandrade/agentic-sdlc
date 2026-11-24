// Target: passes alone, fails after the polluter (or after both combo files).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
if (globalThis.sharedCache?.user === 'stale') throw new Error('TARGET polluted: cache user is stale');
if (globalThis.__stateDir && existsSync(join(globalThis.__stateDir, 'leftover.lock'))) throw new Error('TARGET polluted: lock file exists');
if (globalThis.comboA && globalThis.comboB) throw new Error('TARGET polluted: combo');
