# Standard feature: CSV export of report rows

The worked example (`examples/worked-example/`): managers export the filtered report rows, including order totals, as CSV.

## Input

- Files: 5 (export serializer, route, web button, API client, their tests) → 2 points
- Components: 2 deploy units, `api` and `web`, read from `docs/codemap.md` → 2 points
- Iterations: 1 → 1 point
- Risk triggers: money (the export shows order totals)

```path-score
node scripts/path-score.mjs --files 5 --components 2 --iterations 1 --risk money
Path: Standard · S=5 · R=1 (money)
exit 0
```

Size route Standard (S=5), risk route Standard (R=1): Standard.

## Spec header re-check

The spec header records the same score; the tool re-computes it from the header and passes because the recorded path is not lower:

```path-score
node scripts/path-score.mjs --from-spec examples/worked-example/specs/001-csv-export/spec.md
Path: Standard · S=5 · R=1 (money)
exit 0
```

## Route-down guard

A requester asks to "just call it Quick". The same inputs checked against Quick fail: the higher route wins, and a lower route needs a waiver (`references/governance.md` §Waivers).

```path-score
node scripts/path-score.mjs --files 5 --components 2 --iterations 1 --risk money --path Quick
Path: Standard · S=5 · R=1 (money)
exit 1
```
