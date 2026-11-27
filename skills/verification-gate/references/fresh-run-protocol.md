# Fresh-Run Protocol

Load at Step 4. Portable forms for the loop *fingerprint → run → capture → fingerprint → record*, defined by `../../agentic-sdlc/references/verification.md` §4. When `scripts/evidence.mjs` exists in the installed agentic-sdlc version (v3.2.0 and later), `evidence record` and `evidence check` replace this file; without it this is the procedure.

## 1. Fingerprint

The fingerprint is the first 12 hex characters of a SHA-256 over the git index plus the content of every modified or untracked file, excluding `.agentic-sdlc/evidence/**` and `.agentic-sdlc/audit/**`. The function is `fingerprint()` in the agentic-sdlc helper library. Use the file-URL form below; it works with relative and absolute paths on macOS, Linux and Windows:

```bash
node --input-type=module -e "const {pathToFileURL}=await import('node:url'); const m=await import(pathToFileURL(process.argv[1]).href); console.log(m.fingerprint().short)" "skills/agentic-sdlc/scripts/lib/git.mjs"
```

Point the last argument at wherever the agentic-sdlc skill is installed (for example `~/.claude/skills/agentic-sdlc/scripts/lib/git.mjs` or `../agentic-sdlc/scripts/lib/git.mjs` from this skill). Run it from anywhere inside the repository; the result is the same.

**Node absent.** Commit first. Confirm `git status --porcelain` prints nothing. Record `head:<12 hex>` from `git rev-parse --short=12 HEAD`. A `head:` row becomes stale the moment the tree is dirty again.

## 2. Run and capture

Write each command's full output to a scratch log under `.agentic-sdlc/evidence/` (excluded from the fingerprint, never committed), then read the exit code from the shell.

POSIX shell (bash, zsh, sh):

```bash
GITLIB="skills/agentic-sdlc/scripts/lib/git.mjs"   # adjust to the installed location
fp() { node --input-type=module -e "const {pathToFileURL}=await import('node:url'); const m=await import(pathToFileURL(process.argv[1]).href); console.log(m.fingerprint().short)" "$GITLIB"; }
mkdir -p .agentic-sdlc/evidence/run
F1=$(fp)
npm test > .agentic-sdlc/evidence/run/dod-test.log 2>&1; echo "exit=$?"
tail -n 40 .agentic-sdlc/evidence/run/dod-test.log
F2=$(fp)
[ "$F1" = "$F2" ] && echo "fingerprint stable: $F1" || echo "TREE CHANGED during run: discard rows"
```

PowerShell:

```powershell
New-Item -ItemType Directory -Force .agentic-sdlc/evidence/run | Out-Null
npm test *> .agentic-sdlc/evidence/run/dod-test.log; "exit=$LASTEXITCODE"
Get-Content .agentic-sdlc/evidence/run/dod-test.log -Tail 40
```

Rules:

- One log per row ID (`dod-lint.log`, `dod-test.log`, `ac-4.log`).
- Never pipe the command straight into `tail` without capturing its own exit status; a pipeline returns the exit code of `tail`.
- Run DoD commands exactly as written in `sdlc-dod`. Adding flags (`--bail`, a path filter) makes it a different command; record it as an extra row, not as the DoD row.
- Run AC commands exactly as written in `acceptance-tests.md`. When the command is wrong (filter matches nothing), fix the command in the row and note it as a finding for the Test Engineer; never fix the test.
- A command needing a service (database, queue) starts it with the project's own script (`docker compose up -d db`, `make services`). A service that cannot start → `CANNOT_VERIFY` for the affected rows with the start error as the reason, or `BLOCKED` when the DoD itself cannot run.

## 3. Compare fingerprints

| F1 vs F2 | Meaning | Action |
|---|---|---|
| equal | the tree tested is the tree recorded | write the rows with F1 |
| different | something wrote to the tree during the run: formatter, code generator, snapshot update, lockfile rewrite | discard every row from this run; find the writer (`git status --porcelain`); commit or revert its output; repeat |
| F2 errors | the helper failed (not a repository, Node too old) | `NEEDS_CONTEXT` with the error; use the `head:` fallback on a clean committed tree |

A snapshot test that rewrites its own snapshot during the run is a broken verification: the run cannot fail. Record it as a finding (`broken-verification`) and re-run with the update flag off (`--ci`, `-u` removed).

## 4. Flaky results

| Observation | Handling |
|---|---|
| fails, then passes on re-run with no change | the row is **failed**; record both outputs; route to `systematic-debugging`; never keep only the green run |
| passes 20 of 20 after a named fix | record the 20-run command as the row for the flaky-test claim |
| a retry option was added to the test config in the diff | weakening a check; the run does not count |

## 5. Row record

```markdown
| AC-4 | AT-4a, AT-4b `AC-4 more than 50,000 matching rows returns 422 and no partial file` | `npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"` | 0 | `b7e2a91c04d5` | 2026-11-25T09:43:02-03:00 | Reviewer |
```

Excerpt block entry:

```text
$ npx vitest run server/test/routes/reports/export.test.ts -t "AC-4"   # ID: AC-4 · fingerprint b7e2a91c04d5
 ✓ … > AC-4 more than 50,000 matching rows returns 422 and no partial file 812ms
 ✓ … > AC-4 exactly 50,000 matching rows exports 50,000 data rows 1904ms
 Test Files  1 passed (1)
      Tests  2 passed | 6 skipped (8)
```

The 6 skipped tests are other ACs excluded by the `-t` filter; they are covered by their own rows. A skip inside the AC-4 tests would fail the row.

## 6. Clean-up

After the rows and excerpts are copied into the PR body (or `specs/NNN-slug/review.md`), delete `.agentic-sdlc/evidence/run/`. Keep `.agentic-sdlc/evidence/ledger.jsonl` when `evidence.mjs` wrote it.
