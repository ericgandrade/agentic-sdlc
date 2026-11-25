# Human-in-the-Loop Reproduction Template

Load in Step 1 only when constructions 1–9 of `references/red-loop-construction.md` cannot reach the bug: hardware, a third-party login, a visual check, a device, or a production-only flow the human can observe safely. The script keeps the loop structured: the agent writes the steps, the human follows prompts, and the answers come back as `KEY=VALUE` lines the agent can parse and compare between runs.

## Rules

1. **Observations only.** Capture what the human sees ("Did the banner say 'row limit'? y/n"), never what the human types to sign in. Signing in, entering a one-time code or approving a payment is a `step`, not a `capture`: captured text is echoed into the transcript.
2. **One run = one verdict.** The last capture answers the red question (`REPRODUCED=y|n`). The agent records it in the loop record exactly like a test result.
3. **Same script every run.** Edit the script only between runs, and record the edit as the probe of the hypothesis under test (one variable).
4. **No production writes.** A step that changes production state needs the on-call engineer (`../agentic-sdlc/references/release-ops.md` §Incidents); the script runs against staging or a local build by default.
5. **Redact before showing.** Captured values that may contain identifiers (order numbers, emails) are shortened or replaced with `<REDACTED>` before they enter the task report.
6. **Keep it short.** ≤ 8 steps. A longer flow is split: find the first step where the outcome diverges, then script only up to there.

## Template (POSIX shell)

Copy to `scratch/debug-<bug>/hitl.sh`, edit the block between the markers, run with `bash scratch/debug-<bug>/hitl.sh`.

```bash
#!/usr/bin/env bash
# Human-in-the-loop reproduction for <BUG-n>: <one-line symptom>.
# The human follows the prompts; the agent reads the KEY=VALUE block at the end.
set -euo pipefail

ask_step() {            # show an instruction and wait for Enter
  printf '\n[step] %s\n' "$1"
  read -r -p '        press Enter when done ' _
}

ask_value() {           # show a question and store the one-line answer in the named variable
  local name="$1" prompt="$2" reply
  printf '\n[observe] %s\n' "$prompt"
  read -r -p '        answer: ' reply
  printf -v "$name" '%s' "$reply"
}

# ---- edit from here ------------------------------------------------------
ask_step  "Open the staging app (build 2026.11.24-rc2) in a private window and sign in yourself."
ask_step  "Go to Reports > Orders, set the filter to 'all regions', 'last 365 days'."
ask_value ROWS      "What row count does the footer show?"
ask_step  "Click Export CSV."
ask_value BANNER    "What exact text does the banner show? (type 'none' if no banner)"
ask_value REPRODUCED "Did the export start although the count is above 50,000? (y/n)"
# ---- edit to here --------------------------------------------------------

printf '\n--- result ---\n'
printf 'ROWS=%s\n' "$ROWS"
printf 'BANNER=%s\n' "$BANNER"
printf 'REPRODUCED=%s\n' "$REPRODUCED"
```

## Without a POSIX shell

On Windows without Git Bash or WSL, write the same steps as a numbered checklist in the task report and ask the human to reply with the `KEY=VALUE` block verbatim. The rules above still apply; the loop record states `Kind: HITL checklist (manual)`.

## Recording a HITL run

```text
RED LOOP · BUG-418 · Kind: HITL (construction 10)
Command:      bash scratch/debug-bug-418/hitl.sh
Last run:     REPRODUCED=y · ROWS=50,214 · BANNER=none · 2026-11-24 14:05
Determinism:  3/3 runs reproduced
```

A HITL loop is slow (minutes per run), so it is used to locate the failing layer, not to test every hypothesis. As soon as the layer is known, build an automated loop at that layer (construction 1, 2 or 5) and switch to it.
