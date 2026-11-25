# Rollback rehearsal — <service> <tag or SHA>

<!-- Filled in Step 7 of deployment-pipeline. Paste §1–§3 into release notes §Rollback and §4 into
     §Observability; the R3/R4/R5 values go into §Release checklist (owned by shipping-and-handover).
     Every block is pasted output with exit code and ISO-8601 time; nothing is typed from memory. -->

| Field | Value |
|---|---|
| Release commit (R1) | `<sha>` — must equal the release notes R1 SHA |
| Environment | <staging name> · <URL or cluster/namespace> |
| Date | <YYYY-MM-DD> (≤ 7 days before the release date) |
| Strategy | <feature flag · canary · blue-green · rolling · expand-contract · channel> |
| Rollback target | <flag/blue-green < 1 min · redeploy/canary < 5 min · data < 15 min · other: recorded> |
| By | Release Engineer · observer: <name or role, optional> |

Preconditions: clean working tree (`git status --porcelain` empty), deploy credentials for staging visible to the shell (checked with a read-only command, account identifiers masked).

## 1. Forward (turn the change on as production will)

```text
$ git rev-parse HEAD
<sha>
$ <deploy command for staging at this SHA>
<output>
exit <code> · <ISO-8601 time>
$ <flag on / stage-1 exposure command>
<output>
exit <code> · <ISO-8601 time>
$ <smoke check showing the new behaviour>
<output>
exit <code> · <ISO-8601 time>
```

## 2. Rollback (the exact command from spec.md §Rollback)

```text
$ <rollback command>
<output>
exit <code> · <ISO-8601 time>
```

## 3. Verify (the exact verify command from spec.md §Rollback)

```text
$ <verify command>
<output>
exit <code> · <ISO-8601 time>
```

Rollback time: <verify end − rollback start> = <m:ss> vs target <target> → <within | SLOWER: Important finding, residual risk for the Release Owner>

Data handling: <none · expand-only migration left in place · backfill paused at marker <n> · other>

## 4. Flag default and test alert

| Check | Evidence | Value |
|---|---|---|
| R4 Flag defaults off in production | `<flag-service read command>` → `<output line>` · <ISO time> | <true · false · n/a — no flag> |
| R5 Test alert fired in staging | rule `<id>` · fired <ISO time> · received <ISO time> in <channel> · latency <n> min | <true if ≤ 5 min · false> |

## 5. Verdict

- [ ] Rollback exit 0 and verify exit 0 → R3 `true`
- [ ] Same SHA as R1 and ≤ 7 days old
- [ ] Rollback time within target, or the slower time listed in release notes §Residual risks
- [ ] R4 and R5 recorded

Result: <PASS · FAIL — <step>, route to <Build: code | Specify: wrong command> · CANNOT_VERIFY — no staging, accept-risk waiver <W-n> required>
