# Personal data forces Full

A support engineer asks to add the customer's email address to the error log line of failed checkouts, so tickets can be matched faster.

## Input

- Files: 1 (the logger call) · Components: 1 · Iterations: 1 → S=3, size route Quick
- Risk triggers: personal/health data (the log now stores a field that identifies a person). The trigger is Full-forcing, so R=1 still routes Full.

```path-score
node scripts/path-score.mjs --files 1 --components 1 --iterations 1 --risk "personal data"
Path: Full · S=3 · R=1 (personal/health data)
exit 0
```

Full brings the separate Specify and Design reviews, two human Test reviewers and the threat model (`references/paths.md` §3). The Analyst may record a narrower option in the intake record (log an opaque customer ID instead of the email); that option removes the trigger and is scored again as a separate request.
