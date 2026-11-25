# Example specs

Three synthetic specs written with this skill. Each passes `spec-lint` with 0 errors and 0 warnings; example 2 also passes `--check-approval`. Copy the shape, never the content.

| Folder | Shape | Path · Size · Risk | Shows |
|---|---|---|---|
| `031-session-idle-timeout/` | Quick-size bug fix | Standard · S=3 · R=1 (auth) | A defect that scores Quick on size but is routed up by one risk trigger; regression AC that pins an unchanged limit (AC-4); small threat model to clear TM02; `Experience` as `n/a — reason` |
| `044-orders-cursor-pagination/` | Standard public-API feature, at rev 2 | Standard · S=4 · R=1 (public API) | Revise mode: `### Rev 2 delta` with Added / Changed / Removed / Must not change, a retired AC row, rev 1 approval kept as history, register rows R1–R4, API developer experience in `ux.md` |
| `052-account-data-export/` | Full regulated personal-data feature | Full · S=7 · R=2 (personal data, regulated) | Compliance obligations table, NFRs as ACs (deadline, retention, accessibility, audit), counter-metric indicator, deferred open question with owner, mandatory threat model, 8-state `ux.md` |

Check all three:

```bash
for f in skills/spec-driven-development/examples/*/spec.md; do
  node skills/agentic-sdlc/scripts/spec-lint.mjs "$f"
done
node skills/agentic-sdlc/scripts/spec-lint.mjs --check-approval \
  skills/spec-driven-development/examples/044-orders-cursor-pagination/spec.md
```

A true Quick change (S ≤ 4 and R=0) has no `spec.md`. Its issue carries the problem, 1–3 acceptance criteria in Given/When/Then form and the rollback line (`../../agentic-sdlc/references/lifecycle.md` § 3 Paths).

In a project these files live at `specs/NNN-slug/` (`../../agentic-sdlc/references/artifacts.md`); here they sit under `examples/` so the skill stays self-contained. Names, people, tickets and numbers are invented.
