# Upgrading

Load this file when the installed skill version changes or `doctor` reports a warning or failure after an upgrade. One section per release, newest first: what breaks, the commands to migrate and what `doctor` flags until the migration is done.

**Every upgrade, in order:**

1. Update the skills (`npx agentic-sdlc-method update`, or `/plugin update agentic-sdlc` in Claude Code).
2. Re-vendor the scripts: `project-context` vendor mode (`skills/project-context/references/vendoring.md`). Never patch `.agentic-sdlc/bin/`.
3. Run `node .agentic-sdlc/bin/doctor.mjs` and fix every `fail` before the next Build.
4. Open one context PR with the re-vendored `bin/` and any CI or block change; CODEOWNERS review applies.

`.agentic-sdlc/config.json`, `adoption.md`, `runs/`, `extensions/` and the text outside the AGENTS.md markers are never changed by an upgrade.

## 3.1.0

**Behaviour changes (minor release, migration path below):**

- **CI gates at adoption.** `project-context` adopt mode now installs the `agentic-sdlc/dod`, `agentic-sdlc/spec` and `agentic-sdlc/approvals` CI jobs, `security.yml` and `CODEOWNERS` on day 1 (repository write access only). Branch protection still waits for week 3 of the rollout. The Reviewer's GO requires those checks green.
- **Extensions load through `ext-check`.** Extension interface 1.0.0 (`references/extension-interface.md`). An extension that fails `ext-check` is not loaded.
- **`status.mjs`** replaces reading the Step 0 table by hand; stage skills end with `status.mjs --next`.
- **`dod-gate.mjs`** runs the `sdlc-dod` commands on the current fingerprint; `run-ledger task --state done` and `finish` are refused while it is red or stale.
- The vendored set adds `next-steps.json` and `help-topics.md` next to the scripts.

**Migrate:**

```bash
# 1. re-vendor (adds status, doctor, ext-check, dod-gate and the two data files)
#    project-context vendor mode → .agentic-sdlc/bin/
# 2. install the day-1 gates
#    project-context adopt --upgrade   (writes the CI jobs, security.yml and CODEOWNERS that are missing)
# 3. check
node .agentic-sdlc/bin/doctor.mjs
```

**What `doctor` flags until migrated:**

| Check | Before migrating | Fix |
|---|---|---|
| `vendored` | `fail`: `SHA256SUMS` does not list the new files, or old sums | Re-vendor |
| `enforcement` | `fail` when the block says `branch-protection` and no `agentic-sdlc` CI workflow exists | `project-context adopt --upgrade`, or correct the `Enforcement:` line |
| `extensions` | `fail` on an extension that does not meet interface 1.0.0 | Fix the rule `ext-check` names, or remove the extension |

## 3.0.1

No method change. The installer no longer registers the `claude-superskills` alias. Nothing to migrate; `doctor` flags nothing new.

## 3.0.0

**Breaking changes:**

- Repository, plugin and npm package renamed: plugin `agentic-sdlc` (skills appear as `/agentic-sdlc:<skill>`), npm package `agentic-sdlc-method`.
- Ten research and content skills moved to a separate package; the `research` and `content` bundles are removed.
- `executing-plans` 4.0.0: fresh context per task, test first, run ledger, bounded loops and `preflight`.
- `writing-plans` 3.2.0: plans are task graphs validated by `plan-graph`, with a hash-bound Design sign-off.
- Review checkpoints became the four named sign-offs (Specify, Design, Test, Release), each bound to a hash.

**Migrate:** reinstall with the new names (`npx agentic-sdlc-method`, or `/plugin install agentic-sdlc@agentic-sdlc`), then run `project-context` setup or adopt mode to write the AGENTS.md block, the `sdlc-dod` block and `.agentic-sdlc/bin/`.

**What `doctor` flags on a 2.x project:** `dod-block` fail (no block), `vendored` warn (not vendored) and `enforcement` warn (no `Enforcement:` line).
