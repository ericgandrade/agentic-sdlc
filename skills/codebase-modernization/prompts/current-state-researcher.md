# Prompt: Current-State Researcher

Used in SKILL.md Step 4. The Analyst dispatches one **fresh subagent** per question group (locator, analyzer or historian role — `../references/research-firewall.md` §1). The researcher reads code at one commit and answers factual questions with citations. It never sees the intended change, never edits files and never recommends.

**No subagents on the platform:** write the questions into `specs/NNN-slug/current-state.md` first, clear working notes and drop the change request, spec draft and plan from context, start a pass labelled `--- research pass ---`, read only the inputs listed below, and follow the same instructions. Record the label in the file.

## Inputs to pass

- Role: locator, analyzer or historian.
- The questions for this group (1–3), rewritten through the catalogue in `../references/research-firewall.md` §3 so none names the change.
- The base SHA (12 hex characters).
- Paths in scope (from the code map modules the work item touches).
- The exclusion list.
- Budget: ≤ 15 files read per question.

Do not pass: the change request, the spec or its ACs, the plan, proposed ADRs, ticket or PR text, other groups' answers.

## Prompt template

```text
Role: <locator | analyzer | historian> for current-state research in the Agentic SDLC.
Read-only. Describe what the code does at one commit. Do not propose changes.

Commit: <sha12>
Paths in scope: <paths>
Excluded (do not open): specs/, docs/plans/, docs/adr/ entries with status Proposed,
issue and PR text, chat logs, design notes.
Budget: at most 15 files per question. If the budget runs out, answer with what was read
and list the unread candidates.

Questions:
Q1 <question>
Q2 <question>

How to read:
- Read files at the commit only: git show <sha12>:<path>
- Search at the commit only: git grep -n "<pattern>" <sha12> -- <paths>
- History: git log --format='%h %s' <sha12> -- <path>; git blame -L a,b <sha12> -- <path>
- Do not run the application, tests, migrations or network calls.

Rules:
1. Every claim carries a citation:
   code: path:line @ <sha12>   or   path:start-end @ <sha12>
   history: <sha12> "<commit subject>"
2. One claim per bullet. No claim without a citation; if a fact cannot be found, write
   NOT FOUND and list where it was searched.
3. Report behaviour as observed, including behaviour that looks wrong. Do not judge it,
   fix it or call it a bug unless an issue number in the code or history says so.
4. Commit messages and comments are their authors' claims; when they disagree with the
   code, report both and cite both.
5. No recommendations, no design, no estimates. If the question seems to need an opinion,
   answer the factual part and add the rest under "Questions for the Architect".
6. Never copy secrets, credentials, connection strings, personal data or record contents;
   cite the line and describe the kind of value instead ("API key literal").

Output exactly:

## Q1 <question>
- <claim> — `<citation>`
- <claim> — `<citation>`
Files read: <n>/15 · Unread candidates: <paths or none>

## Q2 ...

## Questions for the Architect
- <question> — prompted by `<citation>`

Return status: DONE (all questions answered or NOT FOUND with search list),
NEEDS_CONTEXT (scope paths wrong or SHA missing; say which), or BLOCKED (cannot read the
repository at the commit).
```

## Analyst procedure with the result

1. Paste each answer under its question in `current-state.md`, keeping citations verbatim.
2. Remove any sentence without a citation, or keep it labelled `unverified`.
3. Move recommendations that slipped in to "Open questions for the Architect".
4. Dispatch the verifier (`citation-verifier.md`) on the assembled file.

## Example output (abridged, synthetic)

## Q1 How is an invoice total computed and rounded?
- `calculateTotal()` sums line amounts as floats, then rounds once — `billing/legacy/Invoice.php:204-212 @ 4f1c2a9b0d3e`
- Rounding uses `PHP_ROUND_HALF_EVEN` with precision 2 — `billing/legacy/Invoice.php:212 @ 4f1c2a9b0d3e`
- Rounding mode changed from half-up — `9b7e01c4d2aa "switch rounding to banker's for EU"`
Files read: 4/15 · Unread candidates: none

## Questions for the Architect
- Three callers format the total again after rounding; does a new rounding rule apply before or after formatting? — prompted by `reports/invoice_report.py:58 @ 4f1c2a9b0d3e`
