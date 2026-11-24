# Exploratory session — charter, heuristics, debrief

Load at workflow Step 11, **Full path only**, after the acceptance tests run at the PR head. Contract (`../../agentic-sdlc/agents/test-engineer.md`): one exploratory session, ≤ 30 minutes, written charter, findings as review rows tagged `explore`. On Standard and Quick paths the session is not run; a user request for one on those paths is recorded as an extra, still ≤ 30 minutes.

The session explores the **running application at the PR head as a black box**. It never opens the diff, the branch's source files or the PR text; it reads the spec, `ux.md`, the acceptance-test map and the app's behaviour.

## 1. Charter (written before the timer starts)

```markdown
### Exploratory charter EX-<n> · specs/<NNN-slug> · PR head <sha>

| Field | Value |
|---|---|
| Target | <surface or journey J-n to explore> |
| Information sought | <the question the session answers, e.g. "can an analyst get a file that disagrees with the screen?"> |
| Risks from the spec | <non-goals, limits, Security notes, ux.md failure exits, Critical ACs — 3 to 6 items> |
| Out of charter | <areas covered well by acceptance tests; areas for another session> |
| Resources | <environment URL, seeded roles, data set, devices, viewport, flag state> |
| Oracles | <spec AC text, ux.md copy and state table, the existing product's behaviour> |
| Time box | <≤ 30 min> · start <time> · stop <time> |
| Tester | Test Engineer (<fresh subagent \| self-review>) |
```

A charter that cannot name at least 3 spec risks is too vague; narrow the target.

## 2. Heuristics catalogue (pick 3–6 that fit the risks)

| Heuristic | Probe |
|---|---|
| Boundaries | Values just inside, at and outside every number in the spec; empty and maximum lengths |
| Interruptions | Reload, back button, closing the tab, losing network mid-action, session expiry |
| Repetition | Double click, rapid repeat, the same action in two tabs |
| Role switching | Permission removed or granted mid-session; two users on the same record |
| Data variety | Unicode, right-to-left text, very long values, leading `= + - @`, whitespace-only, time zones and locales |
| Navigation | Deep links, bookmarks of intermediate states, browser history |
| Environment | Slow network profile, 200 % zoom and 320 px reflow, reduced motion, keyboard only |
| Consistency | What the screen shows versus what the file, email or API returns for the same request |
| Error recovery | After each error state in `ux.md`, can the user complete the journey? |

## 3. During the session

- Keep a timestamped log: action → observation → oracle used. One line each.
- Stop a thread after 5 minutes without new information.
- A possible defect is noted with reproduction steps and evidence (screenshot, response, saved file) and the session continues; no debugging, no code reading.
- At the time box, stop. No extensions; a second charter needs a reason recorded in the report.

## 4. Findings → review rows

Each finding becomes a row for the Reviewer's `## Review triage` §Findings table, with `explore` in the Lens column. The Test Engineer proposes; the Reviewer verifies and assigns the final severity (verify-then-verdict).

| ID | Lens | Verification | Sev | File:line | Cause | Finding | Disposition | Evidence |
|---|---|---|---|---|---|---|---|---|
| (assigned by Reviewer) | explore | (Reviewer) | proposed: Important | n/a — black box | proposed: code | Two tabs exporting at once produce one file holding both filters' rows | (Reviewer) | `EX-1 log 14:07`, saved files `a.csv`, `b.csv` |

Proposed severity: **Critical** when a Critical AC, a Security note or data correctness is violated; **Important** when a journey cannot complete or a `ux.md` state is wrong; **Minor** for cosmetic issues. A finding that reveals behaviour the spec never addressed is proposed with cause `spec` (a new or changed AC through the change protocol), never turned into a test with an invented expectation.

## 5. Debrief (in the Test Engineer report)

```markdown
**Exploratory EX-<n>:** <minutes used> / <time box> · heuristics: <list>
**Covered:** <risks explored, one line each>
**Not covered:** <risks left, and why>
**Findings:** <n> rows tagged explore (<ids or summaries>) · **Blocked by:** <environment issues, or none>
**Suggested acceptance tests:** <scenarios worth automating, each tied to an existing AC-n; none without an AC>
```
