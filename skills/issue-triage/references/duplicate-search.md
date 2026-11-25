# Duplicate and prior-rejection search

Load this file at Step 2 of the workflow for every item, including incident and retro inputs. The search answers three questions before any classification or scoring: **Is this already requested? Was it rejected before? Does it already exist?** It searches by **domain concept** — the noun and verb of the outcome — never by the request's wording alone (`../../agentic-sdlc/references/lifecycle.md` §1 Discover).

## 1. Build the term set (≥ 3 terms)

1. Write the concept as `<domain noun> + <verb>` in the project's vocabulary: "order · export", "session · expire", "invoice · refund".
2. Read `GLOSSARY.md` when it exists and replace each user word with the glossary term; keep the user word as a synonym. When no glossary exists, proceed without it and do not ask for one.
3. Add synonyms from four angles:

| Angle | Example for "download my orders as a spreadsheet" |
|---|---|
| User wording | "download orders", "spreadsheet" |
| Glossary / domain term | "order export" |
| UI label or message text | "Export CSV" |
| Code identifier (from `git grep`) | `OrderExport`, `exportOrders`, `/api/orders/export` |

4. Add the inverse concept when a rejection may exist under the opposite framing ("disable auto-logout" ↔ "session timeout").
5. Concept match, not keyword match: "night theme" must find `docs/out-of-scope/dark-mode.md`.

## 2. Sources (search all that exist; minimum four)

| # | Source | What a hit means | Required |
|---|---|---|---|
| 1 | Tracker issues, **open and closed** (closed as completed and closed as not planned) | duplicate, prior rejection or already implemented | yes |
| 2 | `docs/out-of-scope/*.md` (every file read, matched by concept) | prior rejection | yes, when the folder exists |
| 3 | `specs/*/spec.md` — Problem, Stories, `## Non-goals`, header `Intake` | already specified, or rejected as a non-goal | yes, when `specs/` exists |
| 4 | Code (`git grep`) and `docs/codemap.md` | already implemented (redundancy) | yes |
| 5 | `docs/adr/*.md` "rejected alternative" or "Consequences" | a design decision rules it out | when ADRs exist |
| 6 | `CHANGELOG.md`, release notes | already shipped | when present |
| 7 | `docs/postmortems/`, `docs/retros/` | same failure seen before; recurrence | always for `from-production` and retro inputs |
| 8 | Local issue files `docs/issues/*.md` | duplicate when there is no tracker | when no tracker |

## 3. Commands

Run the terms as separate searches; one combined query hides partial matches.

**GitHub (`gh`):**

```bash
gh issue list --state all --limit 50 --search "order export in:title,body" \
  --json number,title,state,stateReason,labels,closedAt,url
gh issue list --state closed --limit 50 --search "spreadsheet reason:\"not planned\"" \
  --json number,title,url
gh search issues "OrderExport" --repo <owner>/<repo> --json number,title,state,url
```

Confirm the target repository first (`gh repo view --json nameWithOwner`): a fork's issue list is not the upstream's.

**GitLab (`glab`):** `glab issue list --all --search "order export"`.

**Jira (JQL in the web search or any Jira client):** `project = KEY AND text ~ "order export" ORDER BY updated DESC`, then the same with `statusCategory = Done`.

**Azure Boards:** `az boards query --wiql "SELECT [System.Id],[System.Title],[System.State] FROM workitems WHERE [System.Title] CONTAINS 'export'"`.

**Any other tracker:** use its search with each term and its "include closed" option; record the exact query strings.

**Repository (every project):**

```bash
git grep -n -i -E "order ?export|exportOrders|spreadsheet" -- . ':!*.lock'
grep -ril -E "export|spreadsheet|csv" docs/out-of-scope specs docs/adr docs/issues 2>/dev/null
git log --oneline -i -E --grep="export" -n 30
```

No tracker access (no CLI, no token, offline) → search sources 2–8, record `tracker: not searched — <reason>`, and report `DONE_WITH_CONCERNS`. Never claim "no duplicates" for a source that was not searched.

## 4. Rate each hit

| Rating | Definition | Action |
|---|---|---|
| **exact** | Same concept, same users, same outcome; an open or completed issue | Propose `duplicate of #n` → Product Owner intake decision |
| **prior rejection** | Same concept closed as not planned, in `docs/out-of-scope/`, or listed under a spec's `## Non-goals` | Quote the recorded reason and revisit trigger → Product Owner intake decision |
| **already implemented** | The behaviour exists in code or shipped release notes | Show the code path or release; propose closing as implemented. Never write an out-of-scope record for it |
| **overlap** | Same concept, different users or outcome; or one item is a subset of the other | Product Owner intake decision: distinct, merge into #n, or make it a child of #n |
| **related** | Same area, different concept | Link under "Related" in the intake record; no decision needed |
| **none** | No hit in any source | Intake `n/a — no duplicate or prior rejection found (search: <terms>)` |

Ambiguity rule: when torn between two ratings, take the one that needs a decision (exact over overlap, overlap over related). A wrong "related" silently re-opens a rejected idea.

## 5. Record the search (always)

The `Search` line in the intake record lists terms, sources and hit counts, so the next person can repeat it:

```
Search: terms "order export", "spreadsheet", "OrderExport", "download orders" · tracker open+closed 3 hits (#88 related, #41 prior rejection, #102 related) · docs/out-of-scope 0 · specs/ 1 (009-reports Non-goals: none) · code 0 · CHANGELOG 0
```

An intake record without the `Search` line is incomplete; the Analyst report is `BLOCKED: report incomplete`.

## 6. Recurrence check (incident and retro inputs)

For `from-production` items, read the cause tags (`spec-gap`, `design-gap`, `test-gap`, `review-miss`, `security`, `dependency`, `env`, `ops-signal`, `process`, `tooling`) in postmortems and retros of the last 90 days. The same tag in ≥ 2 records within 90 days → add `Recurrence: <tag> ×n (links)` to the intake record and tell the Scrum Master: the next retro must add an automated control (`../../agentic-sdlc/references/retrospective.md` §Recurrence). Triage never designs that control.

## 7. Good and bad searches

| Bad | Good |
|---|---|
| One search for the issue title "Excel button" | Four terms across user, glossary, UI and code angles |
| Open issues only | Open and closed, including closed as not planned |
| "No duplicates found" with no record | `Search:` line with terms, sources and counts |
| Keyword miss on `dark-mode.md` for "night theme" | Every out-of-scope file read and matched by concept |
| Closing as duplicate without asking | Exact match proposed; the Product Owner decides |

## Sources

Adapted from Matt Pocock's skills (MIT) triage evidence checks (search by domain concept, report where you looked, already-implemented vs rejected) and tracker indirection notes. Text is original.
