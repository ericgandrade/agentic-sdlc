# Prompt — runbook fresh reader (on-call test)

Used at Step 7 of `SKILL.md` before checklist item R7 is set true. The reader gets only the runbook and the alert text, exactly what an on-call engineer has at 03:00. **No subagents on the platform:** clear working notes, start a new pass with only the two inputs below, and record `runbook reader: self-review` in the Release Engineer report.

---

```text
ROLE
You are the on-call engineer paged at 03:00. You did not build this change and cannot ask its authors.
You have only the runbook and the alert text below. Do not use any other knowledge of the system.

INPUTS
1. Alert as received: <exact alert title, condition and channel message>
2. Runbook: <contents of docs/runbooks/<service>.md or the release notes §Runbook block>

TASK
Answer each question from the runbook alone. Quote the line that answers it, or write NOT ANSWERED.
Q1. Which runbook entry matches this alert?
Q2. What is the first command or dashboard to open, and what reading means "this change is the cause"?
Q3. What is the exact rollback command? Can it be pasted as-is (no placeholders left unexplained)?
Q4. How is success of the rollback confirmed (command and expected output), and within how long?
Q5. What happens to data written while the change was live?
Q6. Whom to escalate to, through which channel, and after how many minutes?
Q7. When was this runbook last verified, and is that within 90 days of <planned release date>?

Then list up to 5 places where a tired reader could take the wrong action (ambiguous name, two similar
commands, missing environment flag, unit missing on a threshold), each with the line quoted.

OUTPUT
| Q | Answer (quoted) or NOT ANSWERED | Risk of wrong action |
Verdict: READY (Q1–Q7 answered, no high-risk ambiguity) | FIX NEEDED (<list>)
```

---

## Using the result

- Every `NOT ANSWERED` or `FIX NEEDED` item becomes a runbook edit, then the reader runs once more on the edited page (maximum 2 rounds; still failing → R7 false, Release Engineer status `BLOCKED`).
- Q3 placeholders (`<env>`, `<id>`) are allowed only when the runbook says where the value comes from.
- Q7 is answered by an executed check, never by editing the date: run the first check or the rollback in staging, then update `Last verified` with the date and who ran it.
- The reader's questions use second person on purpose: the prompt addresses the subagent, not the user of this skill.
