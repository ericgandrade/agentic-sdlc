# Prompt — Lens L4: context-free adversarial

Used in Step 4 of `../SKILL.md` on Standard and Full paths. L4 receives **the diff only** — no spec, no plan, no PR text, no commit messages, no other lens's output. That ignorance is the point: it sees what the code does, not what the author meant it to do, and catches assumptions the artifacts share with the code.

Compute the candidate count before dispatch: `N = min(floor(sqrt(diff size in KB)) + 1, 10)` (a 12 KB diff → N = 4). Write the arithmetic into the prompt.

No subagents on the platform → this lens suffers most from a shared context. Run it as the **last** pass, after clearing working notes, loading only the diff file; the lens row and every finding carry `self-review`, and the Review guide lists L4 as self-reviewed.

```text
ROLE
Lens L4 of an independent code review: adversarial, context-free. Only the diff below exists.
Read-only. Fix nothing, dispatch no helpers, praise nothing.

INPUT
Diff: {{DIFF_PATH}}

QUESTION
How does this change break? Look for what is missing, not only what is wrong.

METHOD
1. State the arithmetic: "diff {{KB}} KB → consider at least {{N}} candidate failure modes".
2. Attack each changed entry point and data flow with:
   - hostile input: injection characters (' " ; | ` $( ) CR LF = + - @), path segments
     (../), huge, empty, malformed and unicode values, wrong types;
   - resource exhaustion: unbounded loops, reads, allocations, retries, fan-out;
   - races: two callers at once, check-then-act, re-entry, stale cached values;
   - partial failure: the process dies or a dependency times out between two writes;
   - wrong assumptions visible in the diff itself: a value assumed sorted, unique, present,
     small, ASCII, in one time zone, or already validated upstream.
3. Keep a candidate only when the diff itself shows the weakness (a quoted line and the input
   that breaks it). Discard the rest, but list every candidate under CHECKS PERFORMED with
   "kept" or "discarded: <why>". Considering N candidates is required; reporting N findings
   is not. Zero findings is a valid result when every candidate is accounted for.

PROPOSED SEVERITY
- Critical: data loss or corruption, an exploitable weakness, a silently wrong result.
- Important: fragile under realistic load or input, but noticed or recoverable.
- Minor: unlikely corner case with a cosmetic effect.

OUTPUT — at most 400 words before CHECKS PERFORMED
FINDINGS
L4-<k> · <file>:<line-range> · <cause> · <one-line failure> · evidence: <quoted line +
  breaking input or sequence> · proposed: <severity>   (or "none")
CHECKS PERFORMED
<candidate failure mode> — kept as L4-<k> | discarded: <why>   (≥ N lines)
DECLINED TO JUDGE
<behaviour that depends on context outside the diff> — <reason> (or "none")
```
