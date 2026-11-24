# Triage templates

Load this file when writing any triage output: the intake record (Step 7), an intake decision request and record (Step 3), a needs-info reply (Step 6), a duplicate or already-implemented reply, an out-of-scope record, or a local issue file when the project has no tracker. Replace every `<…>`. Every text posted to a tracker starts with the line `> Drafted by an AI agent during triage; decisions are recorded by the named human.`

## 1. Intake record

Posted as an issue comment (or appended to the local issue file). The score line is the first line of the issue body on every path; on Standard/Full it is copied into the `spec.md` header at Specify.

```markdown
## Intake record
Path: Standard · S=5 · R=1 (money)

| Field | Value |
|---|---|
| Source | <issue #n · request from <role> on <date> · from-production: spec <NNN-slug>, AC-n, <signal reading + source> · retro action RA-YYYYMMDD-n> |
| Problem | <user/operator> <what fails or is missing> — evidence: <count, metric, quote or n/a — how to measure> |
| Class | <bug · task (spike) · story · epic> — <deciding evidence> |
| Search | terms "<t1>", "<t2>", "<t3>" · tracker open+closed <n> hits (<#n rating>) · docs/out-of-scope <n> · specs/ <n> · code <n> · <other sources> |
| Intake | <n/a — no duplicate or prior rejection found (search: terms above)> or <decision copied from the Intake decision record> |
| Size | files <n> → <pt> · components <n> → <pt> · iterations <n> → <pt> · S=<n> → <route> |
| Risk | <triggers with one-line reason each> · R=<n> → <route> (or R=0 · none) |
| Indicator | <baseline> → <target> · method <how> (or baseline to measure before release · or n/a — internal task) |
| Priority | <PM brief call + reason> or <n/a — Product Manager not triggered; Product Owner orders the backlog> |
| Bug verification | <reproduced · plausible: <code path> · not reproduced · insufficient detail · n/a> |
| Recurrence | <tag ×n (links) or none> |
| Specialists | PM <yes/no> · UX Designer <yes/no> · Security Auditor <yes/no> · Architect <yes/no> |
| Readiness | <ready · needs-info (<n> questions) · awaiting-intake-decision> — failing criteria <IDs or none> |
| Related | <#n — one line each, or none> |
| Next | <Build (Quick, AC-1 below) · Specify with spec-driven-development · stop> |
```

On Quick, add below the table:

```markdown
**AC-1** Given <state with concrete values>, when <action>, then <observable result with concrete values>.
```

## 2. Intake decision request (end the turn after posting)

```markdown
**Intake decision needed — Product Owner**
Item: <#n title> · Match: <#m title> (<exact · prior rejection · overlap>)
Recorded reason (prior rejection): "<quote from docs/out-of-scope/<slug>.md or the closing comment>" · Revisit trigger: <trigger> · Met now? <yes/no + evidence>
What differs in this request: <one or two lines, or "nothing found">
Options:
1. duplicate of #m — close this item, copy new facts to #m
2. prior rejection #m — <why this differs> — proceed to scoring
3. rejected — keep docs/out-of-scope/<slug>.md, append this request to Prior requests, close
4. distinct from #m — proceed (overlap only)
Reply with the option number and, for 2 or 4, the reason in your own words.
```

## 3. Intake decision record

Appended to the intake record after the Product Owner's reply in a later turn. Append-only.

```markdown
### Intake decision
| Date (UTC) | Role | Person | Match | Exact words | Decision |
|---|---|---|---|---|---|
| 2026-11-24 15:02 | Product Owner | <name> | #41 prior rejection | "2 — enterprise customers now ask weekly; proceed." | prior rejection #41 — 14 enterprise requests since the rejection; revisit trigger met |
```

Decision values and the matching `Intake` field (the spec header copies it; `spec-lint` H07):

| Decision | `Intake` value | Item continues? |
|---|---|---|
| duplicate | `duplicate of #m` | No — closed |
| prior rejection overturned | `prior rejection #m — <why this differs>` | Yes |
| rejected | `rejected — docs/out-of-scope/<slug>.md` | No — closed |
| distinct | `n/a — distinct from #m: <reason> (Product Owner, <date>)` | Yes |
| no match | `n/a — no duplicate or prior rejection found (search: <terms>)` | Yes, no decision needed |

Counts as a decision: an option number or an explicit statement ("it's a duplicate, close it"). Never counts: silence, "whatever you think", a reply in the same turn as the request, a reply from someone other than the Product Owner role.

## 4. Needs-info reply

```markdown
> Drafted by an AI agent during triage; decisions are recorded by the named human.

## Triage notes
**Established so far**
- <fact with source>
- Classified as <class> because <evidence>. Provisional path: <score line or "not scored yet: <missing input>">.

**Still needed** (one line each is enough)
1. @<reporter or role>: <specific question with the form of the answer, e.g. "Which version is shown under Settings → About?">
2. @<role>: <question>

**What happens next:** after the answers, triage resumes from these notes; answered questions are not asked again.
```

Bad question: "Please provide more details." Good question: "Does the export fail for every report, or only for reports with more than 10,000 rows?"

## 5. Duplicate reply (after the Product Owner confirmed)

```markdown
> Drafted by an AI agent during triage; decisions are recorded by the named human.

Closing as a duplicate of #<m> (<title>), confirmed by the Product Owner on <date>.
New information from this report was added to #<m>: <one line, or "none">.
Follow #<m> for progress.
```

Order on GitHub: post the comment, then close (`gh issue comment <n> --body-file …` then `gh issue close <n> --reason "not planned"`); a comment passed while closing an already-closed issue can be lost.

## 6. Already-implemented reply

```markdown
> Drafted by an AI agent during triage; decisions are recorded by the named human.

This behaviour already exists: <how to use it> (<code path or release vX.Y.Z>).
If it does not work as described, reply with the steps and what happened, and this item reopens as a bug.
```

## 7. Out-of-scope record — `docs/out-of-scope/<concept-slug>.md`

One file per **concept** (kebab-case, e.g. `dark-mode.md`), never per issue. Written only for rejected stories and epics; never for bugs and never for already-implemented behaviour (that would poison later duplicate searches).

```markdown
# <Concept name>

This project does not provide <concept, one sentence>.

## Reason
<Durable reason: product scope, strategy, technical constraint or cost the team will not carry. "Not now" or "too busy" is a deferral, not a rejection: keep that item open with a low priority instead.>

## Decided
| Date (UTC) | Role | Person | Exact words |
|---|---|---|---|
| <date> | Product Owner | <name> | "<quote>" |

## Revisit trigger
<An observable condition that reopens the question: "≥ 10 separate customer requests within 90 days", "the theming module ships (spec 021)", "after 2027-06-30". Never "someday".>

## Prior requests
- #<n> — <date> — <one line>
```

When a later request arrives: append it under Prior requests; when the revisit trigger is met, say so in the intake decision request.

## 8. Local issue file (no tracker) — `docs/issues/NNNN-<slug>.md`

Numbered from `0001`. Holds the issue body for the method, including Quick items (which have no `specs/` folder).

```markdown
Path: Quick · S=3 · R=0
# <title>
Status: <needs-triage · needs-info · awaiting-intake-decision · ready · duplicate · out-of-scope · implemented>
Reported by: <role> · <date>

<request text, redacted of secrets and personal data>

<Intake record (§1)>

## Comments
<appended, newest last>
```

## Sources

Adapted from Matt Pocock's skills (MIT) needs-info template, out-of-scope knowledge base, AI-generated disclaimer and comment-then-close tracker notes. Text is original.
