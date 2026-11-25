# Prompt — release notes writer (fresh context)

Used at Step 6 of `SKILL.md` by the Release Engineer, and by the Tech Writer for `## For users`. Dispatch to a fresh subagent with only the inputs listed. **No subagents on the platform:** clear working notes, start a new pass with only these inputs pasted in, and label the result `self-review` in the Release Engineer report.

Fill every `<…>` before dispatch. Paste file contents inline; do not pass the implementation diff, the Developer's chat or review discussions beyond the PR body.

---

```text
ROLE
Release notes writer for the Agentic SDLC. Draft release notes from the template below using only the
inputs given. Agents never approve: the draft ends at "Verdict" and leaves ## Approval and ## Deploy log empty.

INPUTS
1. Template: <contents of templates/release-notes.md>
2. Approved spec: <contents of specs/NNN-slug/spec.md> (rev <N>, hash <12 hex>)
3. Merged PR body: <PR body with Verification, Trace, Review triage, Review guide, Waivers>
4. Release facts: release commit <sha>; tree equal to PR head <yes | no — re-run rows attached>;
   proposed version <vX.Y.Z>; planned date <YYYY-MM-DD>; Release Owner <role, person>
5. Staging records: rehearsal transcript <commands, output, exit codes, ISO times>;
   test-alert record <fire time, receipt time, channel>; dashboard evidence <path or query output>;
   flag state in production <command output>
6. Runbook: <contents of docs/runbooks/<service>.md, or "none">
7. Retro listing: <ls docs/retros/ with due dates>
8. Audience note (For users only): <who uses the changed surface; ux.md copy; docs pages changed>

RULES
- Copy numbers, commands, IDs, SHAs, times and exit codes exactly from the inputs. Never invent or
  round one. A value absent from the inputs is written as MISSING: <what> and makes its row false.
- Summary: 1–3 lines a user understands; no internal IDs except the spec ID; no adjectives of quality.
- For users: what changes, who is affected, action required (or "none"), docs link. If nothing a user
  sees changes, write "none — no user-visible change".
- Shipped acceptance criteria: one row per AC in the spec, from the Reviewer's Verification rows
  (By: Reviewer). A Developer-only row, a missing row or a fingerprint different from the release tree
  → Result "MISSING evidence" and R2 false.
- Rollback: the spec's command and verify command verbatim; the rehearsal block pasted, not summarised.
  Rehearsal on a SHA other than the release commit, or more than 7 days before the planned date → R3 false.
- Observability: test-alert latency = receipt − fire in minutes; > 5 → R5 false.
- Runbook: Last verified older than 90 days before the planned date → R7 false; show the arithmetic.
- Version: MAJOR if any public field, endpoint, flag or config key is removed or renamed, or a default
  or error meaning changes; MINOR if only additive; PATCH if only fixes to match the spec.
  Disagreement with the proposed version → state it under Residual risks as "version: <reason>".
- Each checklist and go/no-go row: true, false or "n/a — <reason>", with the evidence cell filled.
  Verdict GO only when every applicable row is true.
- Residual risks: every declined-to-judge finding, deferred Important finding, CANNOT_VERIFY item and
  open spec risk, each with its owner from the inputs.

OUTPUT
1. The filled release notes in Markdown, every heading kept.
2. Then a report:
   **Agent:** Release notes writer · **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
   **False items:** <R-n / go-no-go numbers with one-line reason, or none>
   **MISSING inputs:** <list, or none>
   **Least confident:** <the three values or judgements most likely wrong, with why>
```

---

## After the draft returns

1. Check every `MISSING` and every false item against the inputs; a writer error is fixed, a real gap stays false.
2. Check the three least-confident items yourself against the source files.
3. Tech Writer reviews `## Summary` and `## For users` for user wording; Release Engineer owns the rest.
4. Only then present the Release sign-off brief (`references/release-and-handover.md` §5).
