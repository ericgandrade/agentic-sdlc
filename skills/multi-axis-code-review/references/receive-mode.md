# Receive Mode — Developer Side

Load when the Developer receives merged, confirmed findings (`../SKILL.md` mode **receive**). Contract: `../../agentic-sdlc/references/review.md` §5 and `../../agentic-sdlc/agents/developer.md` §Receive mode. This file adds the procedure, reply formats and dispute handling; dispositions and their limits are the contract's.

A finding is a claim to check, not an order. The author's job is to make every finding end in a disposition backed by evidence, in either direction.

## 1. Procedure

1. **Read the whole list first.** Several findings may share a cause; fixing them one at a time in arrival order can make two edits that conflict. Group findings by file and cause before touching code.
2. **Restate each finding** in one line, in technical terms: what input, what line, what wrong result. A finding that cannot be restated is unclear → step 6.
3. **Verify.** Read the cited code past the hunk and re-run the cited command at the current head. Agreement before this check is forbidden, and so is a reply of agreement written before it.
4. **Evaluate** against this codebase: does the claimed input reach the line; does the suggested change break an AC, a caller, an ADR or a platform the project supports; is the suggested feature used anywhere (search for callers before building "proper" handling for an unused path)?
5. **Decide one disposition** (§3), then implement in order: Critical first, then Important, then Minor; within a severity, the simplest fix first. One finding per commit; run the finding's check and the affected tests after each.
6. **Unclear finding → one question** to the Reviewer, naming the finding and what is ambiguous. Do not implement the clear findings of a related group while one item in that group is unclear; items can depend on each other. Never guess an interpretation.
7. **Report** (§5) when every finding has a disposition.

## 2. Replies

The reply is the change and its evidence. Allowed forms:

- `F-2 fixed 0a7c639 — rows stream in 1,000-row pages; heap peak 61 MB at 50,000 rows (was 412 MB).`
- `F-4 checked: the 403 path had no test. Added AT-3b, red at 1b8d74a~1, green at 1b8d74a.`
- `F-7 rejected: AC-1 fixes column order as "date, customer, amount" (spec.md line 41); the suggested order contradicts it.`
- `F-5 question: does "unbounded" refer to the request body or the result set?`

Forbidden, because they report a feeling instead of a check:

| Phrase pattern | Use instead |
|---|---|
| "You're absolutely right", "Great catch", "Good point" | State the verified fact or just fix it |
| "Thanks for the review", any gratitude | Nothing; the commit shows the finding was heard |
| "Let me fix that now" before step 3 | Verify, then report the fix with its SHA |
| "Done" with no SHA or output | `fixed <sha>` plus the check output |
| Agreeing with a finding that was then not reproduced | `rejected: <command> output shows <result>` |

A correction after pushing back wrongly is factual too: `F-3 checked again: the guard at auth.ts:12 runs after the lookup, so the claim holds. Fixed 7c1e2aa.` No apology, no long explanation.

## 3. Dispositions

| Disposition | Requires | Allowed for |
|---|---|---|
| `fixed <sha>` | Fix commit with trailer `Refs: Tn F-k` plus the AC-n it serves; a fresh Verification row on the new fingerprint; for a behaviour finding, a regression test red before the fix and green after | Any severity |
| `rejected: <evidence>` | Command output, spec text or code reference showing the finding does not apply | Any severity; a rejected Critical goes to the human reviewer for a ruling before merge |
| `deferred #<issue>` | A follow-up issue; for Important, the owner's acceptance in their exact words (`(owner: "accept until 2026-12-08")`) | Minor; Important with owner acceptance; **never Critical** |

Rules:
- A fix must not weaken any test, threshold or check (`weakened-bar-guard.md`); the re-review scans the delta for exactly that.
- A fix stays inside the task's Files. A fix that needs another file, interface or task order is not a local fix: report the finding as `plan` or `design` with evidence and stop work on it (`triage-and-routing.md` §4).
- `held: F-n` findings are not worked on until the upstream ruling; they are re-verified afterwards.
- A suggestion to add more than the AC asks (configurability, extra formats, metrics nobody reads) is rejected with a search showing no caller or AC needs it.

## 4. Push back

Push back when the finding breaks working behaviour, rests on context the lens lacked, contradicts an AC or ADR, adds unused scope, or does not reproduce. Evidence ranks, strongest first:

1. A command and its output at the current head.
2. The approved spec text (AC, non-goal) or `CONSTRAINTS.md` entry.
3. An accepted ADR.
4. A written project convention (AGENTS.md, a linter rule, a style guide).
5. Code references: callers, guards, tests.

Opinion and preference are not evidence. When evidence on both sides is of equal rank, the finding stays open and goes to the human reviewer as a Review guide question rather than looping. Never argue about tone or effort.

**Rejected Critical — ruling request** (one message to the human reviewer; merge waits):

```text
Ruling requested — PR #57, finding F-1 (Critical, sec S10, export.ts:40-42)
Reviewer claim: CR/LF in q injects a response header.
Author evidence: <command + output, or spec/ADR text>
Head SHA: 1b8d74a
Options: uphold (author fixes) · overrule (record ruling in F-1 Evidence)
```

The ruling, with the person's name, is copied into the Findings Evidence cell. Until then F-1 counts as open Critical and the verdict cannot be GO.

## 5. Report

Status, per `../../agentic-sdlc/agents/developer.md`:

- `DONE` — every finding has a disposition, DoD green on the new head, Verification rows fresh.
- `DONE_WITH_CONCERNS` — same, with a listed concern (for example a rejected Critical awaiting a ruling).
- `BLOCKED: triage incomplete` — any finding without a disposition.
- `NEEDS_CONTEXT` — an unclear finding with a question pending.

Report body: one line per finding (`F-k · disposition · evidence`), the commit list, DoD result with fingerprint, and the reviewed SHA the Reviewer should diff from. The Reviewer then runs the scoped re-review (`../SKILL.md` Step 9); the author never marks a finding `resolved`.
