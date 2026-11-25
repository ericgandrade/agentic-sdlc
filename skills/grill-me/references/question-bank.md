# Question Bank by Category

Load this file at Step 1 of `SKILL.md` to sweep the subject for open branches, and whenever a round runs short of frontier questions. It is a catalogue, not a script: pick the questions that are open for this subject, rewrite them in the subject's own words, and add a recommended answer to each. Never send a category's list as-is.

Each category gives: what it protects, **look up first** (facts the environment answers — never ask these), questions with a recommendation pattern, and the **material signal** (when an open answer blocks the spec under mechanism 2.4: it changes an acceptance outcome, the scope or the handling of data).

The categories map to `../../agentic-sdlc/templates/spec.md`, so the closing summary lands in the right spec sections.

| # | Category | Spec section it feeds |
|---|---|---|
| 1 | Problem | Problem |
| 2 | Users and permissions | Users, Stories |
| 3 | Scope and non-goals | Stories, Non-goals |
| 4 | Data | Security notes (Data classes), Constraints |
| 5 | Failure modes | Acceptance criteria (unhappy paths) |
| 6 | Security | Security notes |
| 7 | Operations | Release & observability (Owner, Alert) |
| 8 | Cost | Constraints, Non-goals |
| 9 | Rollback and reversibility | Rollback, Release & observability (Rollout) |
| 10 | Metrics | Indicator, Release & observability (Signal) |
| 11 | Dependencies and alternatives | Constraints; ADR candidates |
| 12 | Vocabulary | `GLOSSARY.md` |
| 13 | Experience | Experience (`ux.md`) |

---

## 1. Problem

Protects against building the wrong thing well.
**Look up first:** the issue, the intake record, the PM brief, the discovery brief, support ticket counts, related specs.
- What fails or is missing today, for whom, and what evidence shows it? → *Recommend the strongest evidence found; ask only for what is missing.*
- What happens if nothing is built this quarter? → *Recommend the cost of delay stated in the brief.*
- Is this the problem or a symptom of another one? → *Recommend the root named by the five-whys chain when one exists.*
**Material signal:** two readings of the problem lead to different acceptance outcomes.

## 2. Users and permissions

**Look up first:** roles and permission names in the code, existing personas in `ux.md` files.
- Which roles use this, and which role must not? → *Recommend the narrowest role set that serves the stories.*
- What does a user without permission see? → *Recommend the existing denied pattern (e.g. 403 with a message), cited.*
- Are there automated actors (API clients, jobs) with different needs?
**Material signal:** who may perform an action is undecided.

## 3. Scope and non-goals

**Look up first:** Non-goals of related specs, `docs/out-of-scope/`.
- What would a reader reasonably expect here that is excluded? → *Recommend listing it as a non-goal with a reason.*
- What is the smallest release that moves the indicator? → *Recommend the minimal slice.*
- Which limits apply (rows, file size, rate, tenants)? → *Recommend a number with a unit.*
**Material signal:** an in/out decision or a limit changes an acceptance outcome.

## 4. Data

**Look up first:** schema, data classes in related Security notes, retention settings, the code map.
- Which data is read, written, exported or logged, and what is its class (public, internal, personal, financial)? → *Recommend minimising: only the fields the stories need.*
- Where does it live, how long is it kept, and who deletes it?
- Does existing data need migration or backfill? → *Recommend additive changes first (a two-way door).*
**Material signal:** any open answer about personal, health, financial or client data.

## 5. Failure modes

**Look up first:** error handling in the touched modules, incident history, timeouts and retry settings.
- What breaks first under load, bad input, a partial outage, or concurrent edits? → *Recommend the observable behaviour for each.*
- What does the user see when a dependency is down? → *Recommend a named state with copy.*
- What happens to work in flight when the change is rolled back?
**Material signal:** the failure behaviour changes what the user sees or what data survives.

## 6. Security

**Look up first:** auth middleware, input validation helpers, the security notes and threat models of nearby specs, `CONSTRAINTS.md`.
- Which inputs are untrusted, and how is each validated or escaped? → *Recommend the existing validator, cited.*
- Which secrets are touched, and where do they live (never their values)?
- What is logged, and could a log line contain personal data or a token? → *Recommend redaction at the logger.*
- Does this add a risk trigger (auth, personal or health data, money, public API, schema or migration, irreversible, regulated)? → *If yes, say the path may need re-scoring.*
**Material signal:** an authorization rule, a data exposure or an injection surface is undecided.

## 7. Operations

**Look up first:** runbooks in `docs/runbooks/`, alert definitions, on-call rotations named in docs.
- Who receives the alert, on which channel, and at what threshold? → *Recommend a numeric threshold and window.*
- Does this add a job, endpoint, queue or config that someone must operate? → *If yes, a runbook is required.*
- Who owns it when it breaks at 03:00?
**Material signal:** rarely material; an alert channel or owner is usually `deferred: <owner>`.

## 8. Cost

**Look up first:** current infrastructure, licences, quotas, rate-limit plans.
- What does it cost to run per month at expected volume, and at 10×? → *Recommend a ceiling.*
- Does it add licences, vendor fees or on-call load?
- What would make the plan be abandoned on cost alone?
**Material signal:** a cost ceiling changes scope (a limit, a tier, a feature cut).

## 9. Rollback and reversibility

**Look up first:** feature-flag system, deployment method, migration tooling.
- What is the rollback command, and how is success verified? → *Recommend a flag default off where possible.*
- Which parts are one-way doors (migrations, public API, deleted data, vendor lock-in)? → *Recommend an ADR candidate for each.*
- What happens to data written while the change was live?
**Material signal:** no rollback exists for a one-way change.

## 10. Metrics

**Look up first:** analytics events, dashboards, the indicator in the PM brief.
- Which indicator must move, from what baseline to what target, measured how? → *Recommend the PM brief's indicator.*
- Which signal shows the feature works in production, tied to which outcome?
- When is the first reading due? → *Within 7 days of release (`../../agentic-sdlc/references/lifecycle.md` Operate row).*
**Material signal:** success cannot be observed at all.

## 11. Dependencies and alternatives

**Look up first:** dependency manifests, Accepted ADRs, existing integrations.
- What does this rely on that is not yet defined or owned? → *Recommend naming the owner.*
- Why this approach and not the main alternative? → *Recommend the reason in one line; a one-way choice becomes an ADR candidate.*
- Does it add a dependency? → *Needs the rule 10 Design sign-off note (`../../agentic-sdlc/references/rules.md`): licence, last release ≤ 12 months, 0 known critical/high advisories, lockfile committed, exact version pinned, typosquat check.*
**Material signal:** an unowned dependency blocks an acceptance outcome.

## 12. Vocabulary

**Look up first:** `GLOSSARY.md`, type and table names in the code.
- Does each important word mean exactly one thing here? → *Recommend one term and list the others as aliases to avoid.*
- Does the code use the same word for the same concept?
**Material signal:** one word carries two meanings that lead to different outcomes.

## 13. Experience

**Look up first:** existing screens or CLI output, `ux.md` of related specs, design tokens.
- Which surfaces change, and what does each show when empty, loading, partial, failed, or denied? → *Recommend the existing pattern per state.*
- What is the keyboard path and the focus order? → *Recommend WCAG 2.2 AA defaults.*
**Material signal:** a state's outcome is undecided on a critical journey (route to the UX Designer).

---

## Coverage line for the closing summary

`Categories: problem ✓ · users ✓ · scope ✓ · data ✓ · failure ✓ · security ✓ · operations deferred · cost n/a — internal batch job · rollback ✓ · metrics ✓ · dependencies ✓ · vocabulary ✓ · experience n/a — no user-facing surface`

Every category ends as `✓` (decided), `deferred` (open with an owner), `open — material`, or `n/a — <reason>`.
