# Action rules

Load at Step 6, when drafting candidate actions, and at Step 8, when the meeting shapes them. An action exists to change a file that the next cycle reads. If no file changes, nothing changes. The contract is `../../agentic-sdlc/references/retrospective.md` §Action rule and §Recurrence.

## 1. The five fields

| Field | Rule | Correct | Wrong |
|---|---|---|---|
| ID | `RA-YYYYMMDD-n`: the retro date plus a sequence number | `RA-20261208-1` | `A1`, `action 1` |
| Action | One verb phrase that describes the change | `Add a lint rule that fails when a column helper is called outside src/export/columns.ts` | `Improve testing`, `Be more careful with columns`, two changes joined by "and" |
| Owner | One role and one person. Never an agent | `engineer, A. Mendes` | `team`, `AI`, `Developer agent`, `A. Mendes + D. Okafor` |
| Target file | A file in the repository that the commit will change | `eslint.config.js`, `AGENTS.md` (sdlc block, Pitfalls) | `the process`, `the wiki`, `our heads` |
| Due | ≤ 14 days, and before the next retro of the same track | `2026-12-18` | `next sprint`, `ASAP`, no date |

Allowed target kinds: the AGENTS.md block (a Pitfalls line or an `sdlc-dod` command), a checklist in a reference override, a skill override, a test, a CI check or a script. A wiki, a chat message or a meeting reminder is not a target file. When the lesson really belongs in a document, the target is that document's path in the repository.

## 2. Classify each lesson before writing it

| Kind | Test | Target | Example |
|---|---|---|---|
| **Mechanical** | A program could detect the mistake from the diff, the files or a command's output | A test, lint rule, CI step, script check, or a command added to an `sdlc-dod` key | Column helper called outside its module → lint rule. Migration without a down step → CI check |
| **Judgment** | Detecting the mistake needs context, intent or trade-off reasoning | A Pitfalls line in the AGENTS.md block (`- YYYY-MM-DD — <mistake> → <correct behaviour>`), or a checklist line in a reference override | "Agent chose streaming before the size limit was confirmed in the spec" → pitfall |
| **Process** | The friction was in waiting, approvals, path choice or handoffs | A reference override, a template override, `CODEOWNERS`, or a rule in the AGENTS.md block | 4-day Design sign-off wait → a named delegate in `CODEOWNERS` |

Prefer mechanical. A lesson that could be checked must not be stored as a prose line: a pitfall is read only by an agent that loads it, but a check runs every time. If the lesson is half mechanical, write the check for that half and add a pitfall only for the remaining judgment.

**Pitfall admission test.** A line goes into the AGENTS.md block only when all three are true:

1. An agent would otherwise repeat the mistake. The evidence shows it happened once, or the cause is structural.
2. The line names the mistake and the correct behaviour in one sentence, with no history.
3. No existing line already says the same thing. Search the block first. If a similar line exists and the lesson came back, this is a recurrence (§4), and the answer is a check, not a second line.

`project-context` (pitfall mode) writes the line. It takes the action ID and uses the retro date as the line date, so the line looks like `- 2026-12-08 — Export column order guessed from the UI → read it from src/export/columns.ts (RA-20261208-2)`.

## 3. Prove that a mechanical check bites

A check that has never failed has not been shown to work. Before the action is closed:

1. Reproduce the original mistake on a scratch branch, or as a fixture inside the test.
2. Run the check and confirm that it fails, naming the mistake.
3. Remove the mistake and confirm that the check passes.
4. Record both runs in the closing PR's §Verification: command, exit code and a short output excerpt.

A check that passes on the mistake is not done. Fix the check. Do not record the action as `done`.

## 4. Recurrence

### Recurrence lookup

Run this for every candidate Change item's tag:

```bash
TAG=test-gap; SINCE=$(date -v-90d +%F 2>/dev/null || date -d '90 days ago' +%F)
for f in docs/retros/*.md docs/postmortems/*.md; do
  d=$(basename "$f" | grep -oE '^[0-9]{4}-[0-9]{2}-[0-9]{2}')
  { [ -n "$d" ] && ! [ "$d" \< "$SINCE" ]; } || continue
  grep -l -w -- "$TAG" "$f"
done
```

Postmortems are named `YYYY-MM-DD-<slug>.md` (incident start date), so the same filter applies. A file without a dated name: read the incident window in its header. Postmortem cause tags sit in the root-cause and contributing-factor table. Record the result next to the candidate as `seen before: docs/retros/2026-11-13.md (RA-20261113-2)` or `seen before: none (checked: docs/retros, docs/postmortems since 2026-09-09)`.

### Rule

When the same tag appears in 2 retros or postmortems within 90 days (this retro counts as one of them), at least one action of this retro must be an automated control. The control is a test, a lint or CI check, a script check, or a command added to an existing `sdlc-dod` key. A person other than the proposer approves it, and the approver is named in the action row:

```
| ID | Action | Owner (role, person) | Target file | From | Control approved by (recurrence only) | Due (≤ 14 days) | Status |
|---|---|---|---|---|---|---|---|
| RA-20261208-1 | Add a lint rule that fails when a test file calls `vi.mock` on a module under `src/**/repositories/` | engineer, A. Mendes | `eslint.config.js` | C-1 | Tech Lead, D. Okafor (proposer: A. Mendes) | 2026-12-22 | open |
```

This is the row from the worked example (`../../agentic-sdlc/examples/worked-example/specs/001-csv-export/retro.md`). The `From` column links the action to its Change item, and the column for the control approver holds `n/a` when the tag did not recur.

If a recurring tag is answered only by an instruction-file line, the validity check fails and the retro is invalid. A pitfall line that already existed and failed to prevent the second occurrence is direct evidence that prose was not enough.

**Solo team.** No second person can approve. Apply the waiver procedure in `../../agentic-sdlc/references/governance.md` §6 (Waivers). The waiver row (kind `accept-risk`, gate `recurrence control approval`) gives the reason, the expiry date and the follow-up, and the column for the control approver says `waived W1` (the waiver's ID). The control itself is still required. Only the second-person approval is waived.

## 5. Tracking and closing

- **Closing.** A merged commit that changes the target file and carries the trailer `Refs: RA-YYYYMMDD-n` closes the action. The next retro records `done <SHA>` after the checks in `evidence-gathering.md` §Prior actions.
- **Commit message.** Use `chore(retro): add export column lint rule`, then a blank line, then `Refs: RA-20261208-1`. A single commit may close several actions, with one trailer for each.
- **Open for more than 2 cycles** (that is, 2 later retros of the same track). The Tech Lead rules `do by <date>`, `re-own to <person>` or `drop: <reason>`, and the ruling goes in the Prior actions row of the next retro. An action that is dropped stays visible with its reason.
- **Postmortem actions** (`PA-YYYYMMDD-n`) follow the same closing and escalation rules in the retro's §Prior actions, under their own IDs, with the trailer `Refs: PA-…`. A retro never re-issues a `PA-` item as a new `RA-` action. If the retro changes its owner or due date, it records a Tech Lead ruling on the `PA-` row.
- **Open retro actions** are router state 9. The next session works them as Discover items before new feature work, and small actions go through the Quick path.

## 6. Feeding other skills

| Output | Receiver | How |
|---|---|---|
| Judgment lesson | `project-context` (pitfall mode) | Pass the action ID, the retro date, the mistake and the correct behaviour. It writes the Pitfalls line, and the commit carries `Refs: RA-…` |
| Mechanical lesson | Quick path item (Discover → Build) | A test or check with its proof run. The PR body links the action |
| New `sdlc-dod` command | `project-context` (setup or update mode) | Add the command to the existing key. Never create a new key from a retro |
| `not accepted` outcome or a regression | `issue-triage` | An issue labelled `from-production` with the spec ID, AC-n, reading and source, triaged within 2 business days |
| Process change | the reference or template override named as the target | The owner edits the override, with the commit trailer |

## 7. Validity check for the actions table

- 1–3 rows, each with all five fields filled in.
- No agent appears as an owner.
- Every due date is ≤ 14 days from the retro date and before the next retro of the track.
- If a tag recurs, at least one row is an automated control, with an approver who is not the proposer (or a waiver ID).
- No row says "be more careful", "remember to", "pay attention" or "try to".

If any item fails, fix the row before the meeting ends. If 0 valid actions remain, the record is invalid and the retro still counts as not held.
