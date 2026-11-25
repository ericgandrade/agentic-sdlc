# Docs-drift check

Load at Step 2 of `SKILL.md`, and when the Tech Writer plans or executes a docs task. Owner of the fix: the Tech Writer (`../agentic-sdlc/agents/tech-writer.md`) for user docs, API and configuration reference and migration guides; the Developer for inline docs. Paths starting with `../agentic-sdlc/` are relative to this skill's folder.

Staleness is decided from version control and identifiers, never from how a page reads.

## 1. List the public surfaces the diff changes

```bash
git diff --name-only <base>...HEAD
git diff <base>...HEAD -U0
```

| Surface | Look for in the diff | Identifier to search in docs |
|---|---|---|
| HTTP or RPC endpoint | Route definitions, handlers, OpenAPI/proto files | Path (`/api/reports/export`), method, status codes |
| CLI | Flag parsers, command registrations | Flag and command names |
| Configuration | Config schema, env var reads, defaults | Key names, env var names, default values |
| Feature flag | Flag registry | Flag name |
| Schema / events | Migrations, event or message types | Table, column, event and field names |
| Error contract | New or changed error codes and messages | Code, message text |
| UI copy | Strings from `ux.md` | Button labels, messages |
| Library API | Exported symbols | Function and type names |

Removed or renamed identifiers matter most: list every identifier that appears on a `-` line and no longer appears on any `+` line.

## 2. Find the docs that mention them

```bash
git grep -n -F '<identifier>' -- docs README.md '*.md' ':!specs/**' ':!CHANGELOG.md'
```

Add the project's generated reference sources (OpenAPI files, `--help` snapshots, typed config docs) when they live outside `docs/`. Every hit for a **removed** identifier is stale by definition. A changed surface with **no** hit is a missing page when users act on it (an endpoint, a flag a user sets, a UI control).

## 3. Classify each doc-code pair by commit order

```bash
CODE=$(git log -1 --format=%H <base>..HEAD -- <code-path>)   # the tree is committed (pre-ship P4)
DOC=$(git log -1 --format=%H -- <doc-path>)
[ "$DOC" = "$CODE" ] && echo same-commit
git merge-base --is-ancestor "$DOC" "$CODE" && echo doc-older
git merge-base --is-ancestor "$CODE" "$DOC" && echo code-older
```

| Result | Verdict |
|---|---|
| `DOC` = `CODE` (changed together) | current |
| Doc commit is an ancestor of the code commit | **stale** — the code moved after the doc was written |
| Code commit is an ancestor of the doc commit | current — the doc was updated after the code |
| Neither (diverged branches, shallow clone, rewritten history) | **can't tell** — never reported as current; read the page against the diff |

A page that is "current" by order but still names a removed identifier is stale: identifier evidence wins over order.

## 4. Decide what is required

| Change | Required document | Owner |
|---|---|---|
| New user-facing capability | User docs page or section; one example per AC a user exercises; copy from `ux.md` | Tech Writer |
| New or changed endpoint, CLI flag, config key, env var, event | Reference entry: name, type, default, allowed values, error codes | Tech Writer (Developer when the reference is generated from code) |
| Contract break: removed or renamed field, changed default, new required input, changed error semantics | Migration guide: who is affected, steps, a command that verifies the migration, removal date or "advisory" | Tech Writer, **before the PR opens** |
| Deprecation | Notice: status and date, replacement, removal date or "advisory", reason, migration guide link | Tech Writer |
| New alert, job, consumer, flag | Runbook entry at Release (`SKILL.md` Step 7) | Release Engineer |
| Internal-only change | Docstrings and inline comments | Developer |

A contract break is also a SemVer MAJOR and usually a one-way door for consumers (`references/pr-evidence.md` §5).

## 5. Output and routing

```markdown
| Surface | Identifier | Doc | Verdict | Action | Owner |
|---|---|---|---|---|---|
| Endpoint | `/api/reports/export` | — | missing | Add export section to `docs/reports/export.md` | Tech Writer |
| Flag | `reports.csvExport` | `docs/ops/flags.md:41` | stale (doc ancestor of code) | Add the flag row, default off | Tech Writer |
| Error | `422 Export limit is 50,000 rows` | — | missing | Add to the reference error table | Tech Writer |
```

- Rows owned by the Tech Writer → docs task `Tn — docs` with an AC reference in `plan.md` (planned at Design), or dispatch the Tech Writer now with: the spec ACs, `ux.md` copy, the public-surface list above and this table — never the full implementation diff.
- After the fix: run the docs build and link checker; record the PR Docs row with command, exit, fingerprint.
- A page deferred → issue with owner; Tech Writer status `DONE_WITH_CONCERNS`; the PR Summary names the deferral.
- Docs that would describe behaviour no AC or test covers → finding for the Reviewer, not documentation.
- No docs build exists → Docs row `CANNOT_VERIFY` with the person who checks the rendered page and when.

## 6. Editing rules for the fix

- Preserve facts: names, numbers with units, commands, paths, links, conditions, caveats. Check each against the code at the head SHA.
- Replace vague words with the concrete fact; never replace an unsupported claim with an invented example or a stronger guarantee.
- After editing, compare old and new text: restore any lost qualifier ("only for users with `reports:export`").
- A page with a change log gets a new dated entry with the reason; earlier entries are never rewritten.
