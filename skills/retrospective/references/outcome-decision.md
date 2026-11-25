# Outcome decision: indicator vs baseline, with fail-safes

Load at Step 3 when an indicator reading exists or is due. The indicator was defined in Specify (`spec.md` §Indicator: baseline, target, method, first reading); Operate reads it, never redefines it. The SRE records readings in `specs/NNN-slug/ops.md` §Indicator readings (`../../agentic-sdlc/templates/ops-record.md`, column `PM verdict`); the Product Manager gives the verdict; the Product Owner decides. The agent drafts.

## 1. Read and compare

| Check | Rule | Failure → |
|---|---|---|
| Same source | The reading comes from the source in the spec's Method column (tag, query, dashboard) | `n/a — reading from <other source>; spec method is <method>` |
| Same unit and scope | Same unit, same population (all users vs the rolled-out cohort stated) | Not comparable; record both, verdict `n/a` |
| Window | Reading window ≥ the method's window (monthly count → 30 days) | Label `partial: n of m days`; verdict carries `(partial)` |
| Exposure | Reading taken after 100% exposure, or the cohort stated | State the exposure in the cell |
| Baseline present | The spec has a baseline value, not `to measure before release` | No baseline → verdict against target only; Change item `spec-gap` |
| Dated | Reading date and time, reader (SRE or person), source | Undated → not a reading |

Never estimate a reading, extrapolate a partial window into a full one, or take a number from chat. A partial reading can be shown as a rate for information (`1 in 7 days ≈ 4.3 per 30 days`), labelled as a projection, and never used for `accepted`.

## 2. Verdict (Product Manager, or the facts drafter when the Product Manager is not dispatched)

| Verdict | When |
|---|---|
| `met` | Reading meets or beats the target over a full window |
| `met (partial)` | Reading meets the target over a partial window |
| `missed by <n>` | Reading misses the target; `<n>` in the indicator's unit |
| `n/a — <reason>` | No reading, source unavailable, not comparable |

A partial window that meets the target is written `met (partial)` (the Product Manager's vocabulary: `met` · `missed by <n>` · `n/a`, as in the worked example `../../agentic-sdlc/examples/worked-example/specs/001-csv-export/retro.md`): the reading is promising, but it is not yet a basis for `accepted`.

Add the delta against the baseline in the same cell: `14 → 1 per month (−13)`. A reading worse than the baseline is `missed by <n>` and also a `regressed` note; it raises a Change item with tag `ops-signal` even when no incident occurred.

## 3. Machine verdict on completion (drafted by the agent)

Before the Product Owner decides, check that the item is finished:

| Check | Source | Any failure → machine verdict |
|---|---|---|
| Every AC-n has passing evidence on the release commit's fingerprint | PR §Verification, release notes R2 | `not accepted` |
| Every task in `plan.md` has a commit with its Tn | `git log --grep='T[0-9]'`, `run-ledger status` | `not accepted` |
| 0 open Critical findings | PR §Review triage, postmortems since release | `not accepted` |
| Every deferred Important has an owner and a follow-up issue | PR §Review triage dispositions | `accepted with follow-ups` at best |
| Indicator verdict | §2 above | `met` → `accepted`; `met (partial)` or `n/a` → `hold`; `missed by <n>` → `not accepted` |

The machine verdict is the most restrictive result of the rows. Quick items without an indicator: the indicator row is `n/a — Quick item, no indicator`, and the machine verdict rests on the other rows.

## 4. Decision (Product Owner)

| Decision | Meaning | Follow-through |
|---|---|---|
| `accepted` | Outcome met over a full window; item finished | Item closed; no further readings required by the method |
| `accepted with follow-ups` | Met; named items deferred | Each follow-up has an issue number in the cell |
| `hold` | Not enough evidence yet | Next reading date (≤ 30 days); entry in §Carried; first agenda item of the next retro of the track |
| `not accepted` | Missed, unfinished, or no decision | `from-production` issue with spec ID, AC-n, reading, source; Discover triages within 2 business days |

## 5. Fail-safes (in order)

1. **A human decision overrides the machine verdict.** The override is recorded with the person, role, exact words and reason: `outcome: accepted with follow-ups #412 (Product Owner, L. Rocha: "Accept; the remaining gap is seasonal, re-read in January") — overrides machine verdict hold`.
2. **No human decision → `not accepted`.** Silence, "looks good", or a decision about something else is not a decision. Never record `accepted` by default.
3. **Unfinished work → machine verdict `not accepted`.** A missing commit, an AC without evidence or an open Critical cannot be accepted by the machine; only a human override with reason can change it, and an open Critical stays a release-blocking finding regardless.
4. **Missing data → never `accepted`.** With no reading or a partial window the strongest decision is `hold`. The agent does not render `accepted` or `not accepted` from absent data; it reports `n/a` and why.
5. **Bounded hold.** A second consecutive `hold` for the same item → the Product Owner decides `accepted with follow-ups` or `not accepted` at that retro.
6. **No reading 14 days after release** → the SRE's failure behaviour applies (WARN, FAIL at the retro): the indicator row is `n/a — no reading by <date>`, and a Change item with tag `ops-signal` restores the measurement.

## 6. Recording

The decision lives in the Facts indicator row of the retro record; the template has no separate row:

```
| Indicator: first reading vs target | 1 ticket tagged export-request, 2026-11-30 → 2026-12-07 (partial: 7 of 30 days) vs target ≤ 4/month, baseline 14/month → met (partial) · machine verdict hold · outcome: hold — next reading 2026-12-30 (Product Owner, L. Rocha) | help-desk tag count, read 2026-12-07 by SRE |
```

`hold` is repeated in §Carried as `Outcome decision for specs/001-csv-export — next reading 2026-12-30`.

The retro never orders a rollback, a feature removal or a flag change. A decision that implies one opens a Discover item; the Release Engineer and the on-call engineer act through the normal stages.

## Examples

| Case | Reading | Verdict | Machine | Decision |
|---|---|---|---|---|
| Full window, target beaten | 3 tickets in 30 days vs ≤ 4 | `met`, 14 → 3 (−11) | `accepted` | Product Owner: `accepted` |
| Partial window | 1 in 7 days | `met (partial)` | `hold` | `hold — next reading 2026-12-30` |
| Dashboard down | none | `n/a — dashboard down since 2026-12-10` | `hold` | `hold`; Change item `ops-signal` |
| Target missed | 9 in 30 days vs ≤ 4 | `missed by 5`, 14 → 9 (−5) | `not accepted` | Product Owner may override with reason; issue `from-production` either way |
| Worse than baseline | 17 in 30 days, baseline 14 | `missed by 13 (regressed +3)` | `not accepted` | `not accepted`; Change item `ops-signal` |
| Open Critical after release | any | any | `not accepted` | stays `not accepted` until the Critical is fixed |
| Only SEV4 alert fires since release | 3 tickets in 30 days | `met` | `accepted` | SEV4 is not an incident; the fires are an alert-noise signal, not a completion failure |
