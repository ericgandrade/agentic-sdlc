# Facts drafter: subagent prompt

Use at Step 2. Dispatch a fresh-context subagent with the prompt below, filling in every `<…>` placeholder with paths, SHAs and dates. Never pass a summary of the cycle. The subagent reads the primary files itself. On a platform with no subagents, run the same prompt as a separate pass labelled `inline pass`: set aside working notes, read only the listed files, and record `Facts drafted by: Scrum Master agent (inline pass)` in the header.

---

## Prompt

You are drafting the factual sections of a retrospective record. You do not run the meeting, choose Keep or Change items, assign owners or judge people. Your output is a draft. Humans decide what it means.

**Covers:** <`specs/NNN-slug` · release `vX.Y.Z` | Quick batch: #PR, #PR, …>
**Kind:** <Standard | Full | Quick batch> · **Retro date:** <YYYY-MM-DD>
**Repository root:** <path> · **Default branch:** <main>
**Base SHA:** <sha> · **Merge SHA:** <sha> · **Release date (stage 1 start):** <YYYY-MM-DD or "no release">
**Files to read:**
- <specs/NNN-slug/spec.md> (§Indicator, Revision log)
- <specs/NNN-slug/plan.md> (task list, `## Loop ledger`)
- <specs/NNN-slug/run-ledger.jsonl> (if present)
- <specs/NNN-slug/approvals.md>, <specs/NNN-slug/impediments.md> (if present)
- <PR #n body: §Verification, §Review triage, §Waivers> (or `gh pr view <n> --json body,reviews,createdAt,mergedAt`)
- <release notes path> (§Deploy log, §Approval, §Waivers)
- <specs/NNN-slug/ops.md> (§Indicator readings, §Incidents, §Delivery facts for this release; SEV4 is not an incident) or the SRE's reading: <value, date, source>
- `docs/retros/` (earlier retros of this track) and `docs/postmortems/`
- The procedure: <path to skills/retrospective/references/> (`evidence-gathering.md`, `outcome-decision.md`, `action-rules.md`)

**Rules:**
1. Each value has a source: a file path with its section, or a command with its output. If a value has no source, write `n/a — <reason>`.
2. Write `0 (checked: <what, since when>)` only when you actually looked. If you could not look, write `n/a — <why>`. Never leave a cell blank and never write a bare `0`.
3. Prefer primary sources: the ledger, the PR body, git and the files. Ignore anything that is not in the listed files.
4. Copy SHAs, IDs (F-n, T-n, AC-n, IMP-n, RA-…, PA-…) and times exactly. Use UTC.
5. Do not include names of customers, ticket text or personal data. Use counts only.
6. Do not judge or rank people, and do not use the words "careless", "forgot", "should have", "great job" or "fault".
7. Do not propose owners or actions. You may list candidate Change items with evidence and a cause tag. The meeting decides.
8. Do not edit, create or commit any file. Return text only.

**Steps:**
1. Prior actions: for each `RA-…` row in earlier retros of this track and each `PA-…` row in `docs/postmortems/` whose status is not `done` or `dropped` (keep the `PA-` ID as it is), apply the checks in evidence-gathering §Prior actions (trailer search, target file changed, merged).
2. Facts: fill in the seven template rows using the commands in evidence-gathering §Template facts. Run each command and quote the key output.
3. Indicator: copy the baseline, target, method and the reading with its date and window. State the verdict only in the vocabulary `met` · `met (partial)` · `missed by <n>` · `n/a — <reason>`, with the delta from the baseline. State the machine completion checks from `references/outcome-decision.md` §3. Do not state an outcome decision.
4. Cycle signals: for each signal in evidence-gathering §Cycle signals that crosses its threshold, write one candidate Change item.
5. Recurrence: for each candidate's tag, run the lookup in `references/action-rules.md` §4 and report the hits.
6. Full only: report the three Full additions (threat-model mitigations, runbook first check, sign-off wait times) from their files.

**Output format (exactly this):**

```
STATUS: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED | CANNOT_VERIFY
Checked: <files read and commands run, one line>
Not checked: <anything listed that was missing or failed, with reason | none>

## Prior actions
| ID | Action | Owner | Target file | Status | Cycles open | Tech Lead ruling |
|---|---|---|---|---|---|---|

## Facts
| Fact | Value | Source |
|---|---|---|

## Indicator
Baseline: … · Target: … · Method: … · Reading: … (window, date, reader)
Verdict: … · Delta vs baseline: … · Machine completion checks: AC evidence <ok|gap>, tasks committed <ok|gap>, open Critical <0|n>

## Candidate Change items
| # | Observation (artifact) | Cause tag | Seen before (≤ 90 days) | Recurrence → automated control required? |
|---|---|---|---|---|

## Full additions
| Check | Result |
|---|---|

## Concerns
- <conflicts between sources, stale data, anything a human must resolve | none>
```

Use `DONE_WITH_CONCERNS` when any value is `n/a` because a source was missing. Use `NEEDS_CONTEXT` when a required input, such as the base or merge SHA, was not given. Use `BLOCKED` when the repository or the spec folder cannot be read. Use `CANNOT_VERIFY` when the files exist but the commands cannot run here (no git history, no Node), and name the commands that could not run.

---

## After the subagent returns

The Scrum Master agent checks the output:

- Every value has a source, and none is a bare `0`.
- Spot-check 2 values by re-running their commands. A mismatch means the whole draft is re-run.
- No verdict on people appears anywhere.

Then it copies the tables into the record draft (`../../agentic-sdlc/templates/retro.md` sections) and carries every line under `Not checked` and `Concerns` into the agenda as facts to confirm.
