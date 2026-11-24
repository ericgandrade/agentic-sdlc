# Prompt: Citation Verifier

Used in SKILL.md Step 4 item 5, after the researchers' answers are assembled in `specs/NNN-slug/current-state.md`. Dispatch to a **fresh subagent** that did not research the questions. It re-opens cited lines at the recorded commit and gives a verdict per claim. It never edits the file; the Analyst applies the verdicts.

**No subagents on the platform:** clear working notes, start a pass labelled `--- verification pass ---`, read only the inputs listed below, and follow the same instructions. Record the label in the file next to the verdicts.

## Inputs to pass

- The claims with citations, numbered (C1, C2, …), each marked `load-bearing` or `other`. Load-bearing = an AC, constraint, disposition or design decision rests on it.
- The base SHA.
- The sample: all load-bearing claims plus ≥ 20% of the others, chosen at random (state the method, e.g. every 5th claim from a random start).

Do not pass: the change request, the spec, the plan, the researchers' notes.

## Prompt template

```text
Role: citation verifier for current-state research in the Agentic SDLC. Read-only.

Commit: <sha12>
Claims to verify (load-bearing first):
C1 [load-bearing] <claim> — <citation>
C2 [other] <claim> — <citation>

Procedure for each claim:
1. Open exactly the cited lines at the commit (git show <sha12>:<path>, read the line range;
   for history citations, git show --stat <sha12> and read the subject).
2. Decide whether those lines, read on their own, support the claim as worded.
3. Verdict:
   verified   — the lines support the claim as worded
   disputed   — the lines support a different or narrower reading (state it)
   overturned — the lines do not support the claim (wrong line, wrong file, moved, misread)
   unverified — cannot be checked at this commit (file absent, runtime fact without query)
4. For disputed and overturned, give the correct citation if found within 30 lines of the
   cited range or in the same file; otherwise say "not located".
5. Do not add new claims. Do not judge whether the behaviour is good.

Output exactly:

| Claim | Kind | Verdict | Evidence (what the lines say, ≤ 20 words) | Corrected citation |
|---|---|---|---|---|

Summary: verified <n> · disputed <n> · overturned <n> · unverified <n>
Return status: DONE, or DONE_WITH_CONCERNS when any load-bearing claim is disputed,
overturned or unverified.
```

## Analyst procedure with the result

| Verdict | Action in `current-state.md` |
|---|---|
| verified | Add `✓` after the citation |
| disputed | Keep both readings with both citations; resolve by a targeted re-read or list under open questions; no AC rests on it until resolved |
| overturned | Delete the claim; re-ask the question if it was load-bearing |
| unverified | Keep with the label `unverified`; no AC, constraint or disposition rests on it |

Any overturned claim among the sampled `other` claims → verify every remaining claim from the same researcher. Record the summary line and the pass label under the file's `## Verification` heading.

## Example output (abridged, synthetic)

| Claim | Kind | Verdict | Evidence | Corrected citation |
|---|---|---|---|---|
| C1 | load-bearing | verified | `round($total, 2, PHP_ROUND_HALF_EVEN)` | — |
| C4 | other | overturned | Line 88 is a comment; discount loop starts at 94 | `billing/legacy/Discount.php:94-101 @ 4f1c2a9b0d3e` |

Summary: verified 9 · disputed 0 · overturned 1 · unverified 0
