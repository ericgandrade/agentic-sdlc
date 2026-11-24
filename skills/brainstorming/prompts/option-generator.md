# Prompt — Option Generator (design it twice, in parallel)

Use in Step 3 of `SKILL.md` when the solution or architecture shape is still open and the options written in one pass keep converging. Each pass generates options under one deliberate constraint, without seeing the other passes, so the results differ in structure.

**Dispatch.** Start 2–4 subagents in parallel, one per constraint below, each with the same inputs and a different `CONSTRAINT` line. **If the platform has no subagents:** run the passes yourself one after another; before each pass, clear working notes and do not re-read the options produced by earlier passes. Label the passes `sequential` in the brief.

**Pick constraints that fit the problem** (2–4 of them):

| Constraint | Forces |
|---|---|
| Minimal change | The smallest diff that moves the indicator; reuse first |
| No new infrastructure | Only services, stores and queues already in production |
| Best user experience | Ignore effort; optimise the journey for the primary user |
| Easiest to reverse | Two-way doors only: flags, additive changes, no migrations |
| Lowest run cost | No new on-call load, licences or scheduled jobs |
| Different actor first | Design for the administrator, API client or support agent |

**Inputs to paste:** the HMW statement, the indicator, the Users and job stories, the applicable constraints and Accepted ADRs, and the Step 0 findings (file references). No conversation transcript.

---

```text
ROLE
Act as a solution designer generating options for the problem below.

PROBLEM (HMW)
<paste>

INDICATOR
<name · baseline · target>

USERS AND JOBS
<paste>

CONSTRAINTS AND DECISIONS IN FORCE
<paste>

WHAT EXISTS TODAY (file references)
<paste the Step 0 findings>

CONSTRAINT FOR THIS PASS
<one line from the constraint table>

PROCEDURE
1. Read the referenced files. Cite file:line whenever an option reuses or changes existing code.
2. Produce 1–2 options that obey the pass constraint strictly. Each option must differ from
   the obvious solution in structure (data flow, ownership of state, interaction model),
   not only in naming or styling.
3. Do not score, rank or recommend. Do not write code.

RETURN EXACTLY THIS SHAPE
### Option <letter> — <name> (constraint: <constraint>)
- Mechanism: <2–3 lines>
- Reuses: <file:line or "nothing">
- New parts: <components, data, dependencies>
- Door: two-way | one-way (<why>)
- Biggest unknown: <one line>
```

---

## Using the result

- Merge the returned options into the Step 3 field with their constraint labels; merge duplicates by mechanism.
- Evaluation happens only in Step 4 with `../references/refinement-criteria.md`; the generator never scores.
- An option that is one-way and survives the shortlist becomes an ADR candidate for the Design stage (`../../agentic-sdlc/references/artifacts.md` §ADR); brainstorming does not write the ADR.
