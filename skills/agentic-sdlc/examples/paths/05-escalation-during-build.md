# Escalation during Build

A Quick item scored `Path: Quick · S=3 · R=0` (2 files, 1 component, 1 iteration). During Build the fix also needs a shared formatter, its test and a config change: 5 files.

## Input

```path-score
node scripts/path-score.mjs --files web/src/format/date.ts,web/src/format/date.test.ts,web/src/format/zone.ts,web/src/format/zone.test.ts,web/config/locale.json --components 1 --iterations 1 --risk none --path Quick
Path: Standard · S=4 · R=0
exit 1
```

S=4 alone still gives size route Quick, but 5 files exceed the Quick file bound (> 3, `references/paths.md` §4), so the scored path is Standard. The tool prints `ESCALATE files 5 > 3 (Quick bound)` and exits 1.

In a repository the Developer runs the same check against the real change; it counts committed, uncommitted and untracked files and reads components from `docs/codemap.md` (without a code map, `--components` supplies them):

```sh
node .agentic-sdlc/bin/path-score.mjs --diff main --path Quick --components 1 --iterations 1 --risk none
```

## What happens next

1. Stop at the next green test run; write no more production code.
2. Record a `halt` row with reason `path-escalation` in the loop ledger.
3. Write the new score line `Path: Standard · S=4 · R=0`.
4. Create `specs/NNN-slug/spec.md` from the issue's acceptance test and log `Rev 2 · route Quick → Standard · trigger: files 5 > 3 · S 3 → 4 · R 0 → 0`.
5. Produce the Standard artifacts, request the Specify and Design sign-offs, and resume only after they are recorded.
