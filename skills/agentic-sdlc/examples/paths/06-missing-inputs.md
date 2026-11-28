# Missing inputs

A `from-production` issue reports slow report loading. The cause is not yet known, so the file count cannot be estimated; the fix touches one deploy unit, ships in one PR and shows no trigger.

```path-score
node scripts/path-score.mjs --components 1 --iterations 1 --risk none
Path: Standard · default: inputs missing (files)
exit 0
```

The default is Standard, recorded with the missing input named. When Specify or Design makes the input known, the item is scored again and routes up when the new score is higher; it never routes down without a waiver.

A missing input never lowers a route that the known inputs already force. A request to export patient appointment notes, scope still unknown, is Full from the risk alone:

```path-score
node scripts/path-score.mjs --risk "health data"
Path: Full · default: inputs missing (files, components, iterations)
exit 0
```
