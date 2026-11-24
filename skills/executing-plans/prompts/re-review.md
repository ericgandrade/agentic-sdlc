# Prompt — Re-review (fixed findings plus regressions)

The controller dispatches this brief to a **fresh** reviewer context after the Developer reports dispositions for a failed per-task review round. The scope is narrow on purpose: the fix delta and the findings it claims to fix. A delta that changes more than 30% of the lines in the originally reviewed task diff gets a full `task-reviewer.md` round instead (`../../agentic-sdlc/references/review.md` §6).

Measure first: `git diff --shortstat <FIX_BASE>..<HEAD>` against `git diff --shortstat <BASE>..<FIX_BASE>`. Over 30% → use `task-reviewer.md` with the range `<BASE>..<HEAD>`.

Inline mode: start a line `--- Re-review pass (self-review) ---`, load only the inputs below, label the round `self-review`.

---

```markdown
# Re-review — Task <Tn> — round <r>

You check whether specific findings are fixed and whether the fix broke anything. You change nothing. You do not start other agents. You do not re-open the whole task review.

## Inputs
- Fix delta: `git diff <FIX_BASE>..<HEAD>` in <working directory> (FIX_BASE = the SHA reviewed in round <r-1>)
- Findings with the Developer's dispositions:
| ID | Severity | file:line | Statement | Disposition (fixed <sha> / rejected <evidence> / deferred <issue>) |
|----|----------|-----------|-----------|----------|
<rows>
- AC text and AC tests to re-run: <AC-n verbatim> · <commands>
- Files allowed: <Files list>
- Method: <agentic-sdlc dir>/references/review.md §3 and §6

## Do
1. For each finding marked `fixed`: read the code at the cited place and in the fix commit; re-run the command from the finding's Evidence column when there is one. Verdict: `resolved` | `still applies` (reopens the same ID, same severity unless the evidence shows otherwise).
2. For each finding marked `rejected`: check the evidence offered. Verdict: `rejection holds` | `rejection fails` (the finding stays open; a Critical goes to the human for a ruling).
3. For each `deferred`: Minor → accept; Important → check that an issue and the owner's acceptance in their exact words are cited; Critical → `deferral refused`.
4. Regressions inside the fix delta only: a new failure, a weakened check, a file outside Files, behaviour that contradicts an AC. Confirm each (verify, then rate) and give it a new ID `F-<Tn>-<next k>`.
5. Re-run the task's AC tests. Record command · exit code.
6. Anything noticed outside the fix delta → list under Observations; it is non-blocking in this round and the controller decides whether it becomes a finding.

## Output (no prose outside this block)
**Agent:** Re-reviewer · **Task:** <Tn> · **Round:** <r> · **Range:** <FIX_BASE>..<HEAD> · **Status:** DONE | NEEDS_CONTEXT | CANNOT_VERIFY
**Verdict:** PASS (0 confirmed Critical open) | CHANGES_REQUIRED | FULL_REVIEW_NEEDED (delta > 30%)
**Checks run:** <command · exit code> per line
| ID | Was | Now | Evidence |
|----|-----|-----|----------|
| F-<Tn>-1 | Critical · fixed <sha> | resolved | <test name · exit 0> |
**New findings (regressions in the delta):** <table as in task-reviewer.md, or none>
**Observations outside the delta (non-blocking):** <list or none>
**Next:** <proceed | fix F-… | escalate (round 3 failed)>
```

---

## Controller handling

1. Record the round on the task's review-fix loop: `run-ledger round --run <id> --task <Tn> --loop review-fix --result <pass|fail> --tried "<F-IDs fixed with SHAs>"` plus `--signature` and `--cause` on fail.
2. The same set of open Critical findings as the previous round → the normalized signature repeats → B2 anti-thrash fires at once; do not attempt round 3.
3. A failed round 3 fires B4 → Tech Lead with a ruling requested on every open finding (`../references/fix-loop-and-escalation.md` §5–§7). Round 4 never runs without a ruling.
4. PASS → copy new `run-ledger render` rows into `plan.md` `## Loop ledger`; continue with the next task or batch.
