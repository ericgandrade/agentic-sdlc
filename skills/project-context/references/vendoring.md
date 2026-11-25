# Vendoring the gate scripts into `.agentic-sdlc/bin/`

Load in vendor mode, as the last step of setup and adopt, when the installed `agentic-sdlc` version differs from `.agentic-sdlc/bin/VERSION`, when `shasum -a 256 -c SHA256SUMS` fails, and when CI reports `SDLC_BIN` missing. Mechanism 15.2 (upgrades never touch project overrides) and the CI rule "a PR cannot edit the checker it is judged by" (`../../agentic-sdlc/templates/ci/agentic-sdlc.yml`, step "Use the base branch checker scripts").

## 1. Why vendor

- CI runs the same bytes the agent ran locally; no network fetch at gate time.
- `SHA256SUMS` makes a local edit to a gate visible: a tampered gate fails the check.
- CI on a pull request uses the copy from the **base branch** (`git archive origin/$BASE_REF $SDLC_BIN`), so a change to `.agentic-sdlc/bin/` is judged by the old gate and takes effect only after merge and CODEOWNERS review (`.agentic-sdlc/** @tech-leads` in `../../agentic-sdlc/templates/CODEOWNERS`).

## 2. What is copied

| Source (installed skill) | Destination | Notes |
|---|---|---|
| `<skill>/scripts/*.mjs` | `.agentic-sdlc/bin/` | Today: `preflight.mjs`, `run-ledger.mjs`, `spec-lint.mjs`, `plan-graph.mjs`, `budget-check.mjs` |
| `<skill>/scripts/lib/*.mjs` | `.agentic-sdlc/bin/lib/` | `cli.mjs`, `git.mjs`, `md.mjs` — imported by relative path, so the layout is kept |
| `<skill>/scripts/test/` | never copied | Test fixtures are not gates |

`<skill>` is the `agentic-sdlc` directory to copy from, in this order: `$AGENTIC_SDLC_SKILL` when set; `$SUPERSKILLS_REPO/skills/agentic-sdlc` for a checkout of `claude-superskills` (a `--plugin-dir` session); the Claude Code plugin cache `~/.claude/plugins/cache/*/skills/agentic-sdlc`; then the install targets in `../../agentic-sdlc/references/platforms.md` §2 (`~/.*/skills/agentic-sdlc`, `~/.gemini/antigravity/skills/agentic-sdlc`). The procedure below lists every candidate; with several, take the one whose README Metadata `Version` is highest, set `AGENTIC_SDLC_SKILL` to it and name it in `VERSION`.

`preflight.mjs` imports `run-ledger.mjs`; never vendor one without the other. Scripts marked † in the router Module Index that are absent from the installed skill are listed on the `missing:` line; the router applies their Markdown fallback (`../../agentic-sdlc/references/artifacts.md` §Later-release files).

## 3. Procedure (POSIX shell, from the repository root)

```bash
# Candidates in lookup order; set AGENTIC_SDLC_SKILL to choose one explicitly.
ls -d "${AGENTIC_SDLC_SKILL:-/nonexistent}" "${SUPERSKILLS_REPO:-/nonexistent}"/skills/agentic-sdlc \
  ~/.claude/plugins/cache/*/skills/agentic-sdlc ~/.*/skills/agentic-sdlc ~/.gemini/antigravity/skills/agentic-sdlc 2>/dev/null
SKILL="${AGENTIC_SDLC_SKILL:?set AGENTIC_SDLC_SKILL to one directory listed above}"
SKILL=$(cd "$SKILL" && pwd)                     # absolute: the steps below cd into .agentic-sdlc/bin
test -f "$SKILL/scripts/preflight.mjs" || { echo "not an agentic-sdlc skill: $SKILL"; exit 1; }
mkdir -p .agentic-sdlc/bin/lib
rm -f .agentic-sdlc/bin/*.mjs .agentic-sdlc/bin/lib/*.mjs
cp "$SKILL"/scripts/*.mjs .agentic-sdlc/bin/
cp "$SKILL"/scripts/lib/*.mjs .agentic-sdlc/bin/lib/
cd .agentic-sdlc/bin
{
  echo "agentic-sdlc $(grep -E '^\| Version \|' "$SKILL/README.md" | head -n 1 | awk -F'|' '{gsub(/ /,"",$3); print $3}')"
  echo "release: v<claude-superskills version>|unknown"
  echo "source: $SKILL"
  echo "vendored: $(date +%Y-%m-%d)"
  # scripts marked † in the router Module Index that this install does not ship
  m=$(grep -oE '[a-z-]+\.mjs`?†' "$SKILL/SKILL.md" | tr -d '`†' | LC_ALL=C sort -u | while read -r f; do [ -f "$SKILL/scripts/$f" ] || printf '%s\n' "$f"; done | paste -sd, - | sed 's/,/, /g')
  [ -n "$m" ] && echo "missing: $m"
} > VERSION
find . -name '*.mjs' -type f | sed 's|^\./||' | LC_ALL=C sort | xargs shasum -a 256 > SHA256SUMS
shasum -a 256 -c SHA256SUMS
for f in *.mjs; do node "$f" --help > /dev/null || echo "FAIL --help $f"; done
```

- `release:` is the `claude-superskills` npm or plugin version the skill came from (`npx claude-superskills --version`, or `version` in the plugin's `.claude-plugin/plugin.json`); `unknown` when neither can be read.
- `sha256sum` replaces `shasum -a 256` on Linux images without Perl; the file format is identical.
- Windows without a POSIX shell: copy with Explorer or `Copy-Item`, then write each line as `<lowercase hex>  <path>` using `(Get-FileHash -Algorithm SHA256 <path>).Hash.ToLower()`; verify on any POSIX host or in CI.
- Node absent or < 18: vendor anyway (the files are inert), set `node: absent` on the Platform line and `Enforcement: prompt-only`; the project runs the Markdown-only path (`../../agentic-sdlc/references/platforms.md` §4) until Node is present.

**`VERSION` format** (four lines, a fifth when needed):

```text
agentic-sdlc 2.1.0
release: v2.0.8
source: /home/dev/.claude/skills/agentic-sdlc
vendored: 2026-11-24
missing: status.mjs, dod-gate.mjs, doctor.mjs
```

The `source:` path is informational and may name a home directory; it carries no secret. Teams that prefer not to commit local paths write `source: claude-superskills@v2.0.8`.

## 4. Verification

| Check | Command | Pass |
|---|---|---|
| Integrity | `cd .agentic-sdlc/bin && shasum -a 256 -c SHA256SUMS` | Every line `OK`, exit 0 |
| Completeness | `ls .agentic-sdlc/bin/*.mjs .agentic-sdlc/bin/lib/*.mjs \| wc -l` vs lines in `SHA256SUMS` | Equal (an unlisted extra file is a finding) |
| Runnable | `node .agentic-sdlc/bin/<script>.mjs --help` for each script | Exit 0 (needs Node ≥ 18) |
| Block | `Tools:` line names the same version as `VERSION` line 1 | Equal |

Run integrity at setup, at every audit, and before trusting a gate result in an unfamiliar clone. A failing line → status `BLOCKED`, never "fix" the vendored file and never regenerate `SHA256SUMS` over an unexplained change.

## 5. Update procedure (re-vendor)

Trigger: a new `agentic-sdlc` install, a `VERSION` mismatch, or a checksum failure.

1. Create a branch `chore/agentic-sdlc-<version>`; this is a context PR (`../../agentic-sdlc/references/security.md` S20).
2. For a checksum failure, first show `git log -p -- .agentic-sdlc/bin/<file>` and `git diff` to find who changed the file and why; a deliberate local fix is upstreamed as an issue on the skills repository, never kept as a local patch.
3. Run §3. Only `bin/` is replaced. `.agentic-sdlc/config.json` (project overrides read by `run-ledger`), `runs/`, `evidence/`, the AGENTS.md block, `CONSTRAINTS.md` and `docs/` are never touched by a re-vendor.
4. Review `git diff --stat .agentic-sdlc/bin/` and the new `VERSION`; read the skill's changelog for gate behaviour changes (new required sections, new checks).
5. Run `node .agentic-sdlc/bin/preflight.mjs` on the branch and `spec-lint` on one existing spec to catch newly enforced rules before merge.
6. Update the block's `Tools:` line and add one row to the adoption ledger `## Events` table.
7. Merge after CODEOWNERS review; CI starts using the new gates on the next PR.

**Failure behaviour.** A newer gate rejects existing specs → do not pin the old version silently: record the failing specs in the adoption ledger, fix them in follow-up PRs, or keep the old version with a dated `Events` row naming the owner and the review date.

## 6. Without vendoring

When a team refuses vendored files, CI points `SDLC_BIN` at a checkout of `<skills>/agentic-sdlc/scripts` at a pinned tag (`ericgandrade/claude-superskills@v<version>`), never at a moving branch. The block's `Tools:` line then reads `Tools: agentic-sdlc <version> from claude-superskills@v<version> (not vendored)`.
