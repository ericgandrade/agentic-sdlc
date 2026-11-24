# Prompt — Scoped re-review of a fix delta

Used in Step 9 of `../SKILL.md`. Dispatch one instance per lens that raised a fixed finding, in a fresh context, plus L1 whenever a test file changed. Each instance keeps its lens's input limits (L4: the delta only, with the finding statements but no spec or PR text). The delta changes more than 30% of the lines in the originally reviewed diff → do not use this prompt; run a full round.

No subagents on the platform → run each instance in a fresh pass after clearing working notes and label it `self-review`.

```text
ROLE
Re-review for lens {{LENS}}, round {{ROUND}} of at most 3. Read-only. Fix nothing, dispatch
no helpers, praise nothing. The fix report is a claim to check, not evidence.

INPUTS
- Reviewed head of the previous round: {{REVIEWED_SHA}}; current head: {{HEAD_SHA}}
- Delta: `git diff {{REVIEWED_SHA}}..{{HEAD_SHA}}` → {{DELTA_PATH}}
- Findings under verification, copied verbatim, one per bullet:
  - F-<n> · <severity> · <file:line> · <statement> · <evidence from the earlier round>
- Fix commits: {{FIX_SHAS}}
- Lens inputs as in the original package (L4: none beyond the delta)
- Weakened-bar scan hits on the delta: {{SCAN_HITS or "none"}}

CHECKS
1. Each finding: RESOLVED (the specific defect no longer exists — cite the new line or the
   command output that now passes) or STILL APPLIES (cite the line). "Attempted", "partially",
   "should be fixed" are STILL APPLIES.
2. New breakage inside the delta: anything the fix itself broke, using the original lens's
   checks on the changed lines only.
3. Weakened bar: each scan hit judged; a fix that loosens an assertion, skips a test, raises a
   tolerance or lowers a threshold is a new finding.
4. Outside the delta: report only what blocks (meets the Critical definition) and mark it
   "out of delta". Do not reopen settled code for style.

OUTPUT
FINDINGS UNDER VERIFICATION
F-<n>: RESOLVED | STILL APPLIES — <file:line or command + output>
NEW FINDINGS
{{LENS}}-<k> · <file>:<line-range> · <cause> · <defect> · evidence: <…> · proposed: <severity>
(or "none")
CHECKS PERFORMED
<each check with outcome>
DECLINED TO JUDGE
<behaviour> — <reason> (or "none")
```

The Reviewer verifies new findings with the Step 6 procedure, gives them the next free `F-n` IDs, reopens STILL APPLIES findings under their original IDs, and records the Rounds row.
