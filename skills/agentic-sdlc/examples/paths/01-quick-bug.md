# Quick bug: dates shown in UTC

Issue #142: the orders page shows dates in UTC instead of the user's profile time zone (`references/quickstart.md`).

## Input

- Files: 2 (date formatter, its test) · Components: 1 (web) · Iterations: 1
- Risk triggers: none. The formatter reads a stored time zone but shows no field that identifies a person.

```path-score
node scripts/path-score.mjs --files 2 --components 1 --iterations 1 --risk none
Path: Quick · S=3 · R=0
exit 0
```

The Analyst writes this line as the first line of the issue. During Build the Developer re-checks against the current path before each commit (here with the file list instead of `--diff`):

```path-score
node scripts/path-score.mjs --files web/src/format/date.ts,web/src/format/date.test.ts --components 1 --iterations 1 --risk none --path Quick
Path: Quick · S=3 · R=0
exit 0
```

## What Quick drops

No `spec.md`, `plan.md`, `graph.json` or `acceptance-tests.md`; no Specify or Design sign-off. The issue is the spec and holds `AC-1` in Given/When/Then form before any code (`references/paths.md` §3).

## What Quick keeps

### Evidence

- A red test named `#142 AC-1 …` runs and fails before the fix; a test that passes on its first run is deleted and rewritten.
- Every `sdlc-dod` command and the AC-1 command run on the final tree; each row (exit code, fingerprint, time) goes into the PR `## Verification` table (`references/verification.md` §4). A row whose fingerprint differs from the current tree is stale and re-run.

### Review

- A Reviewer in a fresh context with the issue, the diff and the evidence, never the Developer's reasoning: lenses L1 (does the change meet AC-1?) and L2 (correctness and code quality); L3 is added when a risk trigger is present (`references/review.md`).
- The verdict defaults to NO-GO until AC-1 has fresh evidence and no Critical finding is open.
- One human Test sign-off with the exact words, the date and the head SHA in the PR `## Test sign-off` section (without a PR host: `docs/reviews/142.md`).

### Trace

- Each commit carries the trailer `Refs: AC-1`; Quick items have no plan tasks.
- The PR Trace matrix is filled by hand: ACs from the issue, task checks recorded as `n/a — Quick`, every other check applies (`references/verification.md` §5).
- The release notes list AC-1 and the rollback command; Quick items join the batched retro (every 10 merged items or 14 days).
