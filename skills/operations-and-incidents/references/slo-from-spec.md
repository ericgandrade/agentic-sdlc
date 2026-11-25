# SLOs from the spec

Load in Workflow Step 2, when an ops record is opened for a released item, or when someone asks "what is the SLO for this feature?". Contract: `../../agentic-sdlc/references/release-ops.md` §Observability before release — Operate monitors what the spec defined, it does not define it. Everything below **derives** numbers from approved text; a new number is a proposal that goes through Discover.

## 1. Inputs (read from files, never from memory)

| Input | Where | Used for |
|---|---|---|
| Signal (with AC-n) | `spec.md` §Release & observability, row Signal | The SLI event source |
| Alert threshold + window + channel | same, row Alert | The SLO floor and the paging condition |
| Constraints with numbers | `spec.md` §Constraints (latency, volume, size limits) | Latency or size SLIs |
| Indicator (baseline, target, method, first reading) | `spec.md` §Indicator | The outcome indicator — tracked separately, never turned into an SLO |
| Rollout baseline | release notes §Rollout (7-day value before stage 1) | The comparison point for watch readings |
| Deploy log | release notes §Deploy log | Release-closed date, stage readings |

## 2. Vocabulary

| Term | Meaning in this skill |
|---|---|
| SLI | A ratio of good events to eligible events, computed from a named spec signal. Formula + query + source. |
| SLO | The minimum acceptable SLI over a stated window (default 28 days rolling). |
| Error budget | `(1 − SLO) × eligible events in the window`: the number of bad events allowed. |
| Burn rate | `observed bad ratio ÷ (1 − SLO)`. 1.0 spends exactly the budget over the window; > 1 spends it faster. |
| Outcome indicator | The spec §Indicator: a product outcome (tickets, conversion, minutes saved). Read on its cadence and judged by the Product Manager; no error budget. |

## 3. Derivation procedure

1. **One SLI per signal that observes an AC.** Write the formula as `good / eligible`, the exact query and the dashboard path from the spec. Exclude events the spec says are expected rejections (a 403 for AC-3 is correct behaviour, not a bad event).
2. **SLO floor = the alert threshold, inverted.** Alert "error rate > 2% over 15 min" → SLO "success ratio ≥ 98% over 28 days", marked `derived from alert`. Latency constraint "p95 ≤ 3 s" → SLO "p95 ≤ 3 s, measured daily, ≥ 27 of 28 days compliant", marked `derived from constraint`.
3. **No signal, no SLO reading.** A constraint without an emitted metric (for example a latency limit with no duration histogram) is recorded `not measured — no signal`, and a `from-production` issue proposes the signal. Never estimate the value from logs read by eye or from staging numbers.
4. **Tighter targets are proposals.** If 7 days of readings sit far inside the floor (0.4% errors against a 2% alert), the SRE may propose a tighter SLO in a `from-production` issue. It becomes active only after a spec revision and a new Specify sign-off (change protocol, `../../agentic-sdlc/references/rules.md`). Until then the floor applies.
5. **Error budget and burn rate** are computed at every reading from the SLI counts in the window read; the counts and the query go into `ops.md`.
6. **Budget policy is advice, not a gate.** Report one of the states below in `ops.md` and in the retro facts; the Product Owner and the Tech Lead decide what to do with it, and the Release Engineer applies it at the next go/no-go only if the project adopted it.

| Budget remaining (28-day window) | State reported | Advice attached |
|---|---|---|
| > 20% | `healthy` | Normal releases |
| 0–20% | `low` | Flag-guarded, staged changes only on this service; no risky migrations |
| < 0 (exhausted) | `exhausted` | Reliability work on this service before new feature work; one `from-production` issue per top cause |
| Burn rate ≥ 2 over the last 24 h | `burning` | Raise to the on-call engineer now, whatever the remaining budget |

## 4. Rules that keep it honest

- Every number in `ops.md` carries its source: query text or dashboard panel, the window and the read time (UTC). A number without a source is not recorded.
- Too little traffic: fewer than 100 eligible events in the window → report counts (`3 errors in 41 requests`), not a percentage, and mark `low volume`.
- Never change the alert rule, its threshold or its window from Operate. A noisy or silent alert is a `from-production` issue (see `alerting-and-runbooks.md` §Alert review).
- Outcome indicators and SLOs answer different questions: "Does the feature work?" (SLO) and "Did the feature change the outcome?" (indicator). A met SLO with a missed indicator is a product finding for the Product Manager, not an operations success.

## 5. Worked example — CSV export (`001-csv-export`)

Spec rows (from `../../agentic-sdlc/examples/worked-example/specs/001-csv-export/spec.md`):

- Signal: metric `reports_export_requests_total{status}` · AC-1, AC-4; log event `export.rejected_permission` · AC-3.
- Alert: export error rate (status 5xx / all exports) > 2% over 15 min → `#reports-oncall`.
- Constraint: p95 ≤ 3 s for 50,000 rows.
- Indicator: support tickets tagged `export-request`, baseline 14/month (October 2026), target ≤ 4/month, first reading release + 7 days.
- Release date 2026-11-30; release closed 2026-12-02 (stage 2 window ended).

Derived table written into `ops.md`:

| ID | SLI (good / eligible) | Query | SLO | Origin | Status |
|---|---|---|---|---|---|
| SLI-1 | non-5xx exports / all exports | `sum(increase(reports_export_requests_total{status!~"5.."}[28d])) / sum(increase(reports_export_requests_total[28d]))` | ≥ 98% over 28 days | derived from alert | measured |
| SLI-2 | exports with duration ≤ 3 s / all exports | none — the spec emits no duration metric | p95 ≤ 3 s | derived from constraint | `not measured — no signal` → issue proposing `reports_export_duration_seconds` |
| — | 403 responses (AC-3) | `export.rejected_permission` count | not an SLI: expected rejections | — | tracked as a count only |

Reading on 2026-12-07T13:00Z (7-day window 2026-11-30 → 2026-12-07):

```text
eligible exports      1,412
5xx                   6
SLI-1                 99.58%   (1,406 / 1,412)
budget for window     2% × 1,412 = 28.2 bad events
consumed              6 / 28.2 = 21%   → remaining 79% → healthy
burn rate             0.42% / 2% = 0.21
```

Outcome indicator, same date: 1 ticket tagged `export-request` from 2026-11-30 to 2026-12-07 against a target of ≤ 4/month → recorded as `on track (partial month)`; the Product Manager gives the verdict at the first full month.

Proposal raised (not applied): "Tighten SLI-1 to ≥ 99.5%: 7 days at 99.58%", issue labelled `from-production`, spec `001-csv-export`, AC-1. The alert and SLO stay at the spec values until a spec revision is approved.

## 6. Bad → good

| Bad | Why | Good |
|---|---|---|
| "SLO: export should be reliable" | No ratio, no window | "SLI-1 non-5xx / all exports ≥ 98% over 28 days, query …" |
| "p95 is around 2 s" (read from staging) | Staging is not production; no source | `not measured — no signal`, plus a `from-production` issue |
| "Set the alert to 1% since we are at 0.4%" (edited in the alerting tool) | Changes an approved threshold from Operate | Proposal issue → spec revision → Specify sign-off → Release |
| "99.9% availability" copied from a company standard | Not in the spec; no error class defined | Use the spec floor; propose the standard via Discover if it should apply |
