# Risk beats size

Two small diffs whose size route is Quick and whose risk routes them higher (`references/paths.md` §2, rows 4 and 6 of the scored examples).

## Sessions expire after 5 minutes instead of 30

- Files: 2 (session config, its test) · Components: 1 · Iterations: 1 → S=3, size route Quick
- Risk triggers: auth (the change touches session lifetime) → R=1, risk route Standard

```path-score
node scripts/path-score.mjs --files 2 --components 1 --iterations 1 --risk auth
Path: Standard · S=3 · R=1 (auth)
exit 0
```

## Drop the legacy `orders_old` table

- Files: 3 (migration, repository code, test) · Components: 1 · Iterations: 1 → S=3, size route Quick
- Risk triggers: schema/migration and irreversible (no restore path) → R=2, and irreversible is Full-forcing

```path-score
node scripts/path-score.mjs --files 3 --components 1 --iterations 1 --risk "schema, irreversible"
Path: Full · S=3 · R=2 (schema/migration, irreversible)
exit 0
```
