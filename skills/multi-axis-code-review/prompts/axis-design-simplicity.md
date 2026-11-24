# Prompt — Lens L2 (part 2): design, standards and simplicity

Used in Step 4 of `../SKILL.md`, pasted **after** `axis-correctness.md` into the same L2 context. Replace every `{{…}}`; paste the project conventions in full — the lens has no other access to them.

No subagents on the platform → this block runs in the same fresh L2 pass as part 1; the lens row and its findings carry `self-review`.

```text
PART 2: design and standards, simplicity. Same lens, same rules: read-only, no fixes, no
helpers, no praise.

ADDITIONAL INPUTS
- Project conventions (AGENTS.md block, CONTRIBUTING, coding standards), pasted in full:
  {{CONVENTIONS}}
- Plan ## Dependencies and the Design sign-off notes: {{DEPENDENCY_NOTES or "none"}}

DESIGN AND STANDARDS CHECKS — list each with its outcome (numbering continues from part 1)
11. Plan fit. Files touched are in the plan's Files for their task; no file outside the plan.
12. ADRs. Each ADR the change relies on is Accepted and the code follows its Decision; a
    decision that needed an ADR (data model, public interface, framework) has one.
13. CONSTRAINTS.md (Full). Floor rules hold; numeric rules hold; the file itself is not
    loosened (loosening without an ADR and Design sign-off is Critical).
14. Conventions. Each written rule above: cite the rule for every violation. Skip what a
    linter or formatter already enforces in the DoD.
15. Boundaries. Dependency direction matches the code map; no new cycle; feature logic not
    placed in a shared module; error semantics consistent with neighbouring code.
16. Dependencies. Every new dependency has the note required by rule 10 (name, license, last
    release ≤ 12 months, 0 critical/high advisories, lockfile, exact pin).

SIMPLICITY CHECKS
17. Earned abstractions. Each new interface, factory, base class or generic helper has ≥ 2
    call sites in this change or existing code. One call site → finding: inline it.
18. Deletion test. For each new module or wrapper: deleting it would concentrate complexity
    (keep) or just move it (finding: pass-through).
19. Signals. Nesting ≥ 3 levels; function > 50 lines; nested ternary; boolean flag parameter;
    the same conditional on the same shape in ≥ 2 places; duplicated block ≥ 5 lines;
    misleading or generic names (data, tmp, result, handle2); comments restating code;
    dead or commented-out code; a conditional bolted onto an unrelated flow.
20. Smells. Duplicated code, feature envy, data clumps, primitive obsession, shotgun surgery,
    speculative generality (code for a case no AC needs — also report it as extra behaviour).
For every simplicity finding, name the remedy that removes moving parts (inline, collapse
branches, extract the repeated shape, move the logic to the data it uses, delete).
Label each finding "rule: <cited rule>" (hard violation) or "judgement" (no written rule).
Behaviour must not change: a remedy that alters outputs is a correctness question, not
simplicity.

PROPOSED SEVERITY
- Critical: CONSTRAINTS.md loosened without ADR and Design sign-off; a design choice that
  makes an AC fail.
- Important: plan or ADR violated; ADR still Proposed after Design sign-off; missing
  dependency note; abstraction with one call site; feature logic in a shared module.
- Minor: judgement-only readability items not enforced by a linter.

OUTPUT (whole L2 lens) — at most 600 words before CHECKS PERFORMED
FINDINGS
L2-<k> · <file>:<line-range> · <cause> · <one-line defect> · evidence: <quote + rule or
  input> · remedy: <move> · proposed: <severity>   (or "none")
CHECKS PERFORMED
1–20 each with outcome
DECLINED TO JUDGE
<behaviour> — <reason> (or "none")
```
