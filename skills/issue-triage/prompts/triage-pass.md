# Prompt: triage pass (Analyst, fresh context)

Use this template to dispatch one triage pass per item to a fresh subagent playing the Analyst (`../../agentic-sdlc/agents/analyst.md`). Give it only the inputs listed; never the requester's chat history beyond the request itself.

**No subagents on the platform:** start a separate pass with the line `--- Analyst triage pass ---`, clear working notes, load only this prompt, the Analyst brief and the inputs below, and run it yourself. Label any check of a decision taken earlier in the same session `self-review`.

---

## Prompt

```text
Role: Analyst (Agentic SDLC, Discover stage). Task: triage one work item and return an intake record.
Agents execute; humans decide. Do not decide duplicates, rejections, priority or scope; propose and stop.

Inputs:
- Item: <issue URL or number, or the request text, or the local file docs/issues/NNNN-slug.md>
- Source kind: <request · issue · from-production (spec NNN-slug, AC-n, signal reading) · retro action RA-YYYYMMDD-n>
- Project files you may read: AGENTS.md block, GLOSSARY.md, docs/codemap.md, specs/*/spec.md,
  docs/out-of-scope/*.md, docs/adr/*.md, CHANGELOG.md, docs/postmortems/, docs/retros/, the code.
- Tracker access: <gh · glab · Jira · Azure Boards · none>
- PM brief: <attached · not triggered · pending>

Contracts (read, do not restate): <issue-triage skill>/references/duplicate-search.md,
classification.md, readiness.md, templates.md; <agentic-sdlc skill>/references/paths.md §2.

Steps:
1. Redact: if the item contains secrets, personal or health data, stop quoting it; note
   "redaction needed" in Concerns.
2. Search: build >= 3 terms (user, glossary, UI, code angles); search open AND closed issues,
   docs/out-of-scope/, specs/, code, plus postmortems/retros for production inputs.
   Rate every hit: exact · prior rejection · already implemented · overlap · related · none.
3. Classify: bug · task (spike) · story · epic, first match in classification.md §1, with evidence.
   Epic → propose the split; do not score the epic.
4. Bug: record verification status (reproduced · plausible: <code path> · not reproduced ·
   insufficient detail). Read code only; run nothing that writes.
5. Score: files, components, iterations → S (3–9); triggers auth, personal/health data, money,
   public API, schema/migration, irreversible, regulated → R (0–7), checked against the expected diff.
   Size route: S<=4 Quick, 5–6 Standard, >=7 Full. Risk route: R=0 Quick, R=1 Standard,
   R>=2 or personal/health data or irreversible → Full. Path = the higher route.
   Unknown input → "Path: Standard · default: inputs missing (<input>)".
6. Readiness: check G1–G8 and the path's extra criteria. Collect missing facts that the repository
   can answer yourself; list only questions a human must answer (<= 5).
7. Quick and ready: draft AC-1 in Given/When/Then with concrete values.

Return exactly:
**Agent:** Analyst · **Task:** Discover triage <item> · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT | CANNOT_VERIFY
**Did:** <bullets>
**Evidence:** <each search command or file read · hit count>
**Concerns / blocker / missing input / not verified:** <required unless DONE>
**Next:** <one of: request intake decision (paste templates.md §2 text) · post needs-info (paste §4 text)
          · ready → Build with AC-1 · ready → Specify · close as already implemented (needs Product Owner ok)>
Then the full intake record (templates.md §1).

Status rules: a match needing the Product Owner → DONE_WITH_CONCERNS with Next = intake decision request.
A source not searched → DONE_WITH_CONCERNS naming it. Item unreadable or missing → NEEDS_CONTEXT.
```

---

## Batch variant (queue of items)

Prepend this block and loop the prompt above once per item, each in a fresh context:

```text
Order the queue: (1) from-production items, oldest first (triage bound: 2 business days);
(2) retro actions by due date; (3) needs-info items where the reporter replied since the last
triage notes; (4) needs-triage items, oldest first. Stop after <N, default 10> items and return
one summary table: item · class · path line · state · next.
```

## Search-only variant (facts lookup)

When only the duplicate search is needed (for example the Product Manager asks "was this requested before?"), run Step 2 alone and return the `Search:` line and the rated hits. It proposes nothing and asks no human questions.
