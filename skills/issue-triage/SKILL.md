---
name: issue-triage
description: This skill should be used when a new request, bug report, tracker issue, production signal or retro action needs intake before any spec or code — searching open and closed issues and out-of-scope records for duplicates and prior rejections by domain concept, getting the Product Owner's intake decision, classifying the item as bug, task, story or epic, scoring the Quick, Standard or Full path, checking readiness, and writing the intake record, a needs-info reply or an out-of-scope record (the Discover stage of the Agentic SDLC). Not for exploring solution options (use brainstorming), writing the spec (use spec-driven-development), or running a live incident (use operations-and-incidents).
license: MIT
---

# Issue Triage

## Purpose

Agentic SDLC · Discover stage. Used by the **Analyst** (`../agentic-sdlc/agents/analyst.md`), who returns the path score line and the intake record; the **Product Manager** (`../agentic-sdlc/agents/product-manager.md`) adds the PM brief (problem, outcome, indicator, priority) when triggered; the **Product Owner** — a human — takes the intake decision. Inputs come from people (tracker issues, ad-hoc requests) and from the method itself: `from-production` issues opened by the SRE in Operate and retro actions.

Triage turns one incoming item into a decision-ready record before anyone writes a spec or code. It answers, in order: Was this requested, rejected or built before? What kind of change is it? How much process does it get? Is there enough information to start? It stops building features that already exist, re-arguing rejected ideas, specifying unreproduced bugs, and scoring a five-goal epic as one change.

The stage contract stays in the agentic-sdlc module and is never contradicted here: `../agentic-sdlc/references/lifecycle.md` §1 (Discover entry, work, exit), §2 (intake decision), §7 (Operate → Discover); `../agentic-sdlc/references/paths.md` §1–§2 (selection rule and the scoring rubric); `../agentic-sdlc/references/governance.md` (RACI and approval procedure); `../agentic-sdlc/references/artifacts.md` (issue with acceptance test, PM brief); `../agentic-sdlc/references/retrospective.md` (actions and recurrence). This skill adds the procedures, rubrics, templates and examples those modules leave out.

## When to Use

- A new issue lands in the tracker, or someone asks for a feature or fix in chat ("can we add…", "X is broken").
- The SRE opens a `from-production` issue (postmortem action, alert trend, indicator miss) — triage within 2 business days.
- A retro action `RA-YYYYMMDD-n` is open and the router (Step 0, state 9) sends it to Discover.
- A backlog of untriaged or `needs-info` items needs a pass, oldest first.
- Someone asks "was this requested before?", "is this a bug or a feature?", "which path is this?".

Not for:
- An idea with no shape yet ("something to help managers") → `brainstorming` first, then triage the result.
- Writing `spec.md` once the item is ready → `spec-driven-development`.
- Diagnosing the root cause of a confirmed bug → `systematic-debugging`.
- Running a live incident → `operations-and-incidents`; holding the retro → `retrospective`.
- First use of the method in a repository with no AGENTS.md block → `project-context` setup first.
- Asking which stage comes next for work already in flight → `agentic-sdlc` router.

## Workflow

One item per pass. Every step writes into the intake record (`references/templates.md` §1); nothing lives only in chat.

### Step 0 — Discover the project's intake setup

Read before touching the item:

1. **Tracker.** Detect it: `gh repo view --json nameWithOwner` (GitHub; also confirms the issue target is not a fork), `glab repo view` (GitLab), a Jira or Azure Boards key in AGENTS.md or the PR template. None → the local fallback `docs/issues/NNNN-<slug>.md` (`references/templates.md` §8).
2. **Labels.** List existing labels (`gh label list --limit 200`). Map the seven triage states (`references/readiness.md` §1) and the four classes onto existing labels before creating any; write the mapping once in the AGENTS.md block notes. Keep the method's fixed labels as they are: `from-production`, `untraced-requirement`, `baseline-red`.
3. **Knowledge files.** Note which exist: `GLOSSARY.md`, `docs/codemap.md`, `specs/`, `docs/out-of-scope/`, `docs/adr/`, `CHANGELOG.md`, `docs/postmortems/`, `docs/retros/`. Missing files are not errors; do not ask for them to be created.
4. **AGENTS.md block.** No `<!-- AGENTIC-SDLC:BEGIN -->` block → triage still runs, and the record's `Next` names `project-context` setup (adopt mode on an existing codebase) before Specify or Build. Size inputs then come from the code, not the code map.

### Step 1 — Take in the item

| Source | Intake action |
|---|---|
| Tracker issue | Read the body and every comment. Resume from earlier `Triage notes`; never re-ask an answered question. |
| Ad-hoc request (chat, email, meeting note) | Create the issue (or local file) with the requester's words, then triage it. Work that exists only in chat cannot be traced. |
| `from-production` issue | Require the spec ID, `AC-n` (or `untraced-requirement`), the signal reading and its source. Missing → ask the SRE, not the end user. |
| Retro action | Copy the ID, owner, target file and due date from `docs/retros/YYYY-MM-DD.md`. |

Then:
- **Redact first.** Secrets, personal or health data pasted into the item are removed or masked before quoting anything (rule 7 of `../agentic-sdlc/references/rules.md`). Note `redacted: <what>` in the record.
- **One item, one goal.** A message carrying several unrelated asks becomes several issues, each triaged on its own; an item with several goals that belong together is an epic candidate (Step 4).
- Set the state to `needs-triage`.

### Step 2 — Search for duplicates, prior rejections and existing behaviour

Procedure and commands: `references/duplicate-search.md`. Minimums:

1. **Terms.** ≥ 3 terms for one domain concept written as noun + verb ("order · export"): the user's words, the `GLOSSARY.md` term, the UI label and the code identifier. Concept beats keyword: "night theme" must find `docs/out-of-scope/dark-mode.md`.
2. **Sources.** ≥ 4: tracker issues **open and closed** (including closed as not planned), every file in `docs/out-of-scope/`, `specs/*/spec.md` (Problem, Stories, Non-goals), and the code (`git grep`). Add ADRs, the changelog, postmortems and retros when present; always postmortems and retros for production inputs.
3. **Rate every hit:** exact · prior rejection · already implemented · overlap · related · none. When torn, take the rating that needs a decision.
4. **Record** the `Search:` line — terms, sources, hit counts — even when nothing is found. A source that could not be searched is written `not searched — <reason>`, and the report becomes `DONE_WITH_CONCERNS`.
5. **Recurrence** (production and retro inputs): the same cause tag in ≥ 2 postmortems or retros within 90 days → `Recurrence: <tag> ×n` in the record and a note to the Scrum Master; the next retro owes an automated control.

Already implemented → draft the already-implemented reply (`references/templates.md` §6) and propose closing it; never write an out-of-scope record for it.

### Step 3 — Intake decision (only when Step 2 found a match)

The intake decision is the Product Owner's (`../agentic-sdlc/references/lifecycle.md` §2). It is **required** when Step 2 rated a hit exact, prior rejection or overlap; otherwise the `Intake` field is `n/a — no duplicate or prior rejection found (search: <terms>)` and no human is asked.

1. Post the request (`references/templates.md` §2): the item, the match, the recorded reason and revisit trigger for a rejection, whether the trigger is met now (with evidence), what differs, and four numbered options.
2. Set the state to `awaiting-intake-decision`. **End the turn.** Do not classify further, score, draft `AC-1` or dispatch anyone while the decision is open.
3. In a later turn, accept only an explicit choice from the Product Owner role: an option number or a plain statement ("duplicate, close it"). Silence, a deferral back to the agent ("agent decides", "probably fine"), or an answer from another role is not a decision.
4. Record the row (`references/templates.md` §3): date (UTC), role, person, match, exact words, decision. Then:

| Decision | `Intake` value | Then |
|---|---|---|
| duplicate | `duplicate of #m` | Copy new facts to #m; post the duplicate reply (comment first, then close); stop |
| prior rejection overturned | `prior rejection #m — <why this differs>` | Update or delete the out-of-scope record as instructed; continue at Step 4 |
| rejected | `rejected — docs/out-of-scope/<slug>.md` | Append the item to Prior requests (create the record when missing, §8 below); close; stop |
| distinct | `n/a — distinct from #m: <reason> (Product Owner, <date>)` | Link #m under Related; continue at Step 4 |

These values are the ones `spec-lint` rule H07 accepts in the spec header for items that continue (`n/a — …`, `duplicate of #n`, `prior rejection #n — …`).

### Step 4 — Classify: bug, task, story, epic

Apply the first matching question (`references/classification.md` §1):

1. ≥ 2 independently shippable user-facing goals, or ≥ 3 merged PRs to finish → **epic**.
2. A written or shipped expectation is violated (spec `AC-n`, docs, release notes, previous behaviour, crash) → **bug**.
3. Any user, operator or API consumer notices new or changed behaviour → **story**.
4. Otherwise → **task**; add the marker `spike` when the output is a finding or a decision (timebox ≤ 2 days).

Record the deciding evidence in one line. Class-specific duties:
- **Bug:** verify the claim before it can be ready. Record steps, observed vs expected and version, then a status: `reproduced` (a human or CI ran it), `plausible: <code path>` (read-only trace), `not reproduced`, or `insufficient detail` (→ needs-info). Triage reads code; it does not write tests or fixes.
- **Epic:** split before scoring (`references/classification.md` §4). Capabilities with their own users or data use the capability map of `spec-driven-development` Step 1; slices of one capability start with the thinnest end-to-end slice. Open one child item per module or slice; the epic gets `Path: n/a — epic, split into #a, #b, #c` and holds no acceptance criteria.
- **Reported as a bug, but nothing promised the behaviour** → story, with one line to the reporter explaining why.

### Step 5 — Score the path

Use `../agentic-sdlc/references/paths.md` §2 exactly; estimate the diff the change will produce, not the wording of the request.

**Size S (3–9)** = files + components + iterations:

| Input | 1 point | 2 points | 3 points |
|---|---|---|---|
| Files (source, test, config, migration; lockfiles and generated files excluded) | ≤ 3 | 4–15 | > 15 |
| Components (separately built or deployed units) | 1 | 2 | ≥ 3 |
| Iterations (merged PRs until complete in production) | 1 | 2 | ≥ 3 |

Size route: **S ≤ 4 → Quick · S 5–6 → Standard · S ≥ 7 → Full.**

**Risk R (0–7)** = count of triggers present: `auth`, `personal/health data` (Full-forcing), `money`, `public API`, `schema/migration`, `irreversible` (Full-forcing), `regulated`. Risk route: **R = 0 → Quick · R = 1 → Standard · R ≥ 2 or any Full-forcing trigger → Full.**

**Path = the higher of the two routes.** Write the score line as the first line of the issue body: `Path: Standard · S=5 · R=1 (money)`. Any unknown input → `Path: Standard · default: inputs missing (<input>)`, re-scored when the input becomes known; route up only. Show the line to the requester in one sentence and continue — the path needs no separate approval. A human who disputes the score gets the higher route; a lower route needs a waiver (`../agentic-sdlc/references/governance.md` §6: owner ≠ requester, reason, expiry ≤ 30 days, follow-up issue) recorded under the score line.

Write each input with its reason in the `Size` and `Risk` rows so the Specify stage can copy them into the spec header.

### Step 6 — Product Manager brief and indicator

Dispatch the Product Manager when its trigger fires (`../agentic-sdlc/references/agents.md` §Triggers): a new feature or changed outcome on Standard; always on Full; an indicator miss from production. Give it the item, the intake record and the tracker history for the domain only. It returns the PM brief: problem with evidence, users, outcome, indicator (baseline + target + method), priority with a one-line reason, ≤ 5 non-goals. Paste the brief into the issue, or `specs/NNN-slug/pm-brief.md` when there is no tracker.

No subagents on the platform → run the Product Manager as a separate pass starting `--- Product Manager pass ---`, with only `../agentic-sdlc/agents/product-manager.md` and those inputs loaded, after clearing working notes.

Not triggered (Quick, pure bug fix, refactor) → the Analyst names the indicator, or writes `n/a — internal task` for a task no user notices. The priority field reads `n/a — Product Manager not triggered; Product Owner orders the backlog`. Triage never sets priority itself.

### Step 7 — Readiness check

Check the criteria in `references/readiness.md`: G1–G8 on every path (source, problem with evidence, search line, intake, class, score, indicator, sensitive data), plus Q1–Q3 on Quick (`AC-1`, bug evidence, ≤ 3 files named), S1–S5 on Standard (users, PM brief, Product Owner named, open questions with owners, specialist triggers), F1–F4 on Full (split, risk evidence, regulations named by a human, owners).

- **Look up before asking.** Anything the repository, tracker, logs or code can answer is found by the agent. Only decisions and facts the reporter alone knows are asked.
- **Fails on missing information** → post the needs-info reply (`references/templates.md` §4): what is established, ≤ 5 specific questions each naming who answers, what happens next. State `needs-info`. 14 days without a reply → one reminder; 28 days → propose closing to the Product Owner as `needs-info: no reply`.
- **`from-production` items** never wait past the 2-business-day bound: score with the inputs available, list open questions in the record, and mark it ready for Specify with those questions assigned.
- **Quick and passing** → write `AC-1` in Given/When/Then with concrete values in the issue. No code is written until `AC-1` is in the issue and the requester has agreed to it.

### Step 8 — Write the intake record and hand off

Post the intake record (`references/templates.md` §1) and set the state. Hand-off by path:

| Result | Next |
|---|---|
| Quick, ready | Build (Developer) with `AC-1` from the issue; no `spec.md`, no Design sign-off |
| Standard or Full, ready | Specify with `spec-driven-development`; the spec header copies Path, Size, Risk, Issue and Intake from the record unchanged |
| Epic | Each child item enters Step 1 on its own |
| needs-info / awaiting-intake-decision | Stop; resume from the Triage notes when the reply arrives |
| duplicate / rejected / already implemented | Closed; nothing further |

Return the report in the shared contract (`../agentic-sdlc/references/agents.md` §Report contract): `**Agent:** Analyst · **Task:** Discover triage #n · **Status:** …`, Did, Evidence (each search with its hit count), Concerns, Next. Use `DONE` for a ready item, `DONE_WITH_CONCERNS` when a source was not searched or an intake decision is pending, `NEEDS_CONTEXT` when the item is unreadable or needs-info was posted, `BLOCKED` when a required owner cannot be reached. A report without the `Search:` line is incomplete.

### Step 9 — Maintain out-of-scope records

When the Product Owner rejects a story or epic, write or update `docs/out-of-scope/<concept-slug>.md` (`references/templates.md` §7): one file per concept, a durable reason (scope, strategy, constraint — never "not now", which is a deferral and keeps the item open at low priority), the decision row with exact words, a **revisit trigger** that is observable (a request count in a window, a dependency shipping, a date) and the Prior requests list. Bugs and already-implemented behaviour never get a record. When a later request meets the revisit trigger, say so in the intake decision request.

### Batch mode

For a queue, order: (1) `from-production`, oldest first; (2) retro actions by due date; (3) `needs-info` items whose reporter replied; (4) `needs-triage`, oldest first. Run one fresh-context pass per item with `prompts/triage-pass.md` (no subagents → one labelled inline pass per item, notes cleared between items). Stop after 10 items unless told otherwise and return one table: item · class · path line · state · next. Decisions for the Product Owner are collected into one message at the end of the batch, numbered per item, and the turn ends.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "The title is clear; skip the search." | Titles are the reporter's words. Rejected and existing features hide under other names; the search takes minutes, a rebuilt feature takes weeks. |
| "No duplicates — I checked open issues." | Closed and not-planned issues are where prior rejections live. Open-only is not a search. |
| "It's obviously a duplicate; close it." | Closing is the Product Owner's intake decision. Propose, end the turn, record the exact words. |
| "The PO said 'sounds fine' earlier, so the rejection is overturned." | Only an explicit choice in a later turn counts. A comment about something else is not a decision. |
| "It's a one-line fix, so it's Quick." | Risk overrides size. A one-line change to a token check is R = 1 → Standard. |
| "The requester says it's urgent, so mark it Quick." | Urgency changes priority, never the path. Score it. |
| "It's labelled bug by the reporter." | Without a written or shipped expectation it is a story and needs the product decision. |
| "Score the epic as Full and move on." | An epic is split first; each child gets its own score and spec. One spec for five goals rots. |
| "Ask the reporter which files are affected." | Facts in the repository are the agent's job. Ask humans for decisions and for what only they know. |
| "Write an out-of-scope record for the feature we already have." | That poisons future searches: the next request matches a rejection instead of the existing feature. |
| "The production issue lacks detail; park it in needs-info." | `from-production` items are triaged within 2 business days; score with what exists and default missing inputs to Standard. |

## Critical Rules

- **NEVER** close an item as duplicate or rejected, or overturn a prior rejection, without a recorded Product Owner intake decision given in a later turn.
- **NEVER** write a spec, `AC-1` or code while an intake decision is open.
- **NEVER** route a path down after scoring, or choose a path by class, urgency or requester status; a lower route needs a waiver.
- **NEVER** invent evidence, a baseline or a regulatory obligation; an unknown number is `n/a — <how to measure>`, an obligation nobody named is an open question.
- **NEVER** quote secrets, personal or health data from an item into records, comments or prompts.
- **NEVER** write an out-of-scope record for a bug or for behaviour that already exists.
- **ALWAYS** search open and closed issues, `docs/out-of-scope/`, `specs/` and the code by domain concept with ≥ 3 terms, and record the `Search:` line.
- **ALWAYS** write the score line as the first line of the issue, with each size input and trigger justified.
- **ALWAYS** split an epic into child items before any scoring.
- **ALWAYS** start tracker posts with the AI-drafted line and post a comment before closing.
- **ALWAYS** triage `from-production` items within 2 business days and link the spec ID and `AC-n`.

## Example Usage

**1. Ad-hoc request matching a prior rejection.** "Can we get a night theme? Several customers asked." The search terms "night theme", "dark mode", "theme", `ThemeProvider` find `docs/out-of-scope/dark-mode.md` (reason: one brand theme for accessibility certification; revisit trigger: ≥ 10 requests in 90 days) and issue #41 closed as not planned. The tracker shows 12 requests in the last 60 days. The Analyst posts the intake decision request with "revisit trigger met: 12 ≥ 10" and ends the turn. Next day the Product Owner replies "2 — trigger met, proceed." The record gets `prior rejection #41 — revisit trigger met (12 requests in 60 days)`; classification story; the theme touches 9 component files (2 points) in the web client and the shared UI package (2 components, 2 points) in one PR (1 point) → S = 5, R = 0 → `Path: Standard · S=5 · R=0`. The Product Manager writes the brief; next: Specify.

**2. Vague bug report.** Issue #230: "Export is broken!!" Search finds #198 (related: export timeout, closed). Classification: bug (export is documented). Verification: insufficient detail. The needs-info reply lists what is established (exports run on the reports page; #198 fixed a timeout in v2.3) and asks three questions: which report, how many rows, the version under Settings → About. State `needs-info`; no path yet.

**3. Production indicator miss.** The SRE opens #301 `from-production`: spec 012-csv-export, indicator "weekly exports by managers" at 40 against a target of 120. Search finds nothing open; recurrence check finds no repeated cause tag. Class: story (outcome change). The Product Manager is dispatched (indicator miss) and proposes an in-app hint. Score: 3 files, 1 component, 1 iteration, no triggers → `Path: Quick · S=3 · R=0`. The Analyst writes `AC-1` with concrete values; next: Build — all within the 2-business-day bound.

**4. Epic disguised as a request.** "Build a customer portal: sign-up, invoices and support chat." Classification: epic (three goals, each ships alone). The capability map lists `identity`, `billing`, `support-chat` with build order identity → billing → support-chat. Three child issues are opened; identity scores `Path: Full · S=6 · R=2 (auth, personal/health data)` because sign-up stores emails. The epic carries `Path: n/a — epic, split into #311, #312, #313`.

**5. Pressure to skip.** "It's a two-line fix to the session check, just call it Quick and start coding — skip the duplicate search." The Analyst runs the search anyway (three minutes, four sources, no hits), scores `Path: Standard · S=3 · R=1 (auth)` and explains in one sentence that risk overrides size and that a lower path needs a waiver from someone other than the requester. Next: Specify.

## References

| File | Load when |
|---|---|
| `references/duplicate-search.md` | Step 2 on every item; whenever someone asks "was this requested before?" |
| `references/classification.md` | Step 4; two classes seem to fit; an epic needs splitting; incident or retro inputs |
| `references/readiness.md` | Step 7; deciding needs-info; mapping intake fields to the spec header |
| `references/templates.md` | Writing the intake record, intake decision request or record, needs-info, duplicate or already-implemented reply, out-of-scope record, or a local issue file |
| `prompts/triage-pass.md` | Dispatching a fresh-context Analyst triage pass, a batch, or a search-only lookup |
| `../agentic-sdlc/references/paths.md` | Any doubt about the score, a disputed path, a waiver to route down |
| `../agentic-sdlc/references/lifecycle.md` | Discover entry/exit, the intake decision rule, Operate → Discover |
| `../agentic-sdlc/references/governance.md` | RACI, the explicit-yes rule, waivers |
| `../agentic-sdlc/references/retrospective.md` | Retro action fields and the recurrence rule |
| `../agentic-sdlc/references/release-ops.md` | `from-production` intake fields |
