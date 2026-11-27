<!--
Agentic SDLC — ops record. Rules: references/release-ops.md (§Incidents, §Intake), agents/sre.md; procedure: skill operations-and-incidents.
Location: specs/NNN-slug/ops.md, one per released Standard or Full item. Seeded by the Release Engineer's handover; kept by the SRE agent.
First indicator reading ≤ 7 days after the release date; no reading 14 days after release → trace-check exit 1 (TR12).
Operate monitors what the spec defined: thresholds and alerts here are copied from spec.md, never invented. New numbers are proposals in from-production issues.
Every reading has a UTC time, a source (query or dashboard panel) and a window. A number without a source is not recorded; write "not measured — <reason>".
A section with nothing to report says "none — <reason>"; never leave it blank. Keep every heading.
-->

# Ops record — <NNN-slug>

**Spec:** `specs/<NNN-slug>/spec.md` rev <n> · hash `<12-hex>` · **Release:** <vX.Y.Z> · **Release date:** <YYYY-MM-DD> · **Release closed:** <YYYY-MM-DD>
**Service:** <name> · **Alert channel:** `<#channel>` · **Owner:** <role, person (spec §Release & observability)> · **Kept by:** SRE agent
**First indicator reading due:** <release date + 7 days> · **Retro due:** <YYYY-MM-DD> · **Runbook:** <docs/runbooks/<service>.md | release notes §Runbook>

## Production links

<!-- From the handover: one row per shipped AC. An AC without a signal → "no signal — indicator only" or "untraced". -->

| AC | Signal | Alert (rule ID) | Dashboard or query | Owner |
|---|---|---|---|---|
| <AC-n> | <metric or log event> | <rule ID: condition> | <path> | <role, person> |

## Service levels (derived from the spec)

<!-- SLO floor = the spec alert threshold inverted, or a numeric spec constraint. Origin: derived from alert | derived from constraint. A tighter target is a proposal (issue), not a row here. -->

| ID | SLI (good / eligible) | Query | SLO (window) | Origin | Status |
|---|---|---|---|---|---|
| SLI-1 | <formula> | `<query>` | <≥ n% over 28 days> | <origin> | <measured \| not measured — <reason>> |

## Indicator readings

<!-- Spec §Indicator. The Product Manager gives the verdict: met | missed by <n> | on track (partial period) | n/a. -->

| Read at (UTC) | Indicator | Reading (window) | Baseline | Target | Source | PM verdict |
|---|---|---|---|---|---|---|
| <YYYY-MM-DDTHH:MMZ> | <name> | <value (from → to)> | <baseline> | <target> | <query or tool> | <verdict> |

## Watch readings

<!-- Watch period = release closed → first indicator reading. One row per reading of each SLI; compare with the release-notes baseline and the SLO. -->

| Read at (UTC) | SLI | Value (window) | Eligible events | Budget remaining | Burn rate | vs baseline | Result |
|---|---|---|---|---|---|---|---|
| <YYYY-MM-DDTHH:MMZ> | <SLI-n> | <value (window)> | <n> | <n%> | <n> | <+/- n pp> | <healthy \| low \| exhausted \| burning \| low volume> |

## Watch period result

| Item | Value |
|---|---|
| First indicator reading | <date recorded> (due <date>) · <on time \| late by n days> |
| SLOs over the watch period | <SLI-n: met \| missed \| not measured> |
| Alerts reviewed (A1–A8) | <rule ID: pass \| failed checks> |
| Result | <closed clean \| closed with issues #n \| open — <reason>> |

## Alerts

<!-- Every fire of a spec alert. Classification: SEV1–SEV3 (incident) or SEV4 (not an incident, with the reason). ≥ 3 fires in 7 days without an incident → from-production issue. -->

| Fired at (UTC) | Rule ID | Value | Classification | Runbook first check result | Incident or issue |
|---|---|---|---|---|---|
| <YYYY-MM-DDTHH:MMZ> | <rule> | <value> | <SEVn \| SEV4: reason> | <reading> | <postmortem path \| #n \| none> |

## Incidents

| Start (UTC) | Restored (UTC) | SEV | AC (or `untraced-requirement`) | Summary | Postmortem (due) | Actions → issues |
|---|---|---|---|---|---|---|
| <time> | <time> | <SEVn> | <AC-n> | <one line> | <docs/postmortems/… (YYYY-MM-DD) \| issue only (SEV3)> | <#n, #n> |

## Delivery facts for this release

<!-- Inputs to the retro and to the DORA computation. -->

| Fact | Value | Source |
|---|---|---|
| Lead time, first commit → stage 1 | <h> | `git log`; release notes §Deploy log |
| Rollback during rollout | <yes \| no> | §Deploy log |
| Revert or hotfix ≤ 7 days after stage 1 | <n> | `git log -E -i --grep='^Revert\|hotfix'` |
| SEV1/SEV2 incidents ≤ 7 days after stage 1 | <n> | §Incidents |
| Change failed (any of the three above) | <yes \| no \| window open until YYYY-MM-DD> | this table |
| Time to restore (per SEV1/SEV2) | <h:mm \| n/a> | postmortem timeline |

## From-production issues

| Issue | Trigger (postmortem action \| alert trend \| indicator miss \| SLO gap) | Spec / AC | Opened (UTC) | Triaged in Discover (≤ 2 business days) |
|---|---|---|---|---|
| <#n> | <trigger> | <NNN-slug / AC-n> | <time> | <date \| pending> |
