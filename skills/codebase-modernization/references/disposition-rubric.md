# Disposition rubric

Load at Steps 2–3. Scores are evidence, dispositions are proposals: the Architect writes each non-retain disposition as an ADR with status `Proposed`; the Tech Lead accepts it at the Design sign-off of the first work item that implements it. Retiring a capability that users or partners can see is decided by the Product Owner at Specify sign-off.

## 1. Scoring

### Value V (0–9)

| Input | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Criticality | Nobody notices an outage for a week | Internal inconvenience | Revenue, compliance or customer-visible degradation | Revenue stops or a legal duty is breached |
| Change demand (feature commits, 12 months, dependency bumps excluded) | 0 | 1–10 | 11–50 | > 50 |
| Reach (distinct active consumers in 30 days: services, jobs, partner keys, UI entry points) | 0 | 1 | 2–5 | > 5 |

Criticality above 1 needs a cited source (spec, SLA, incident record, contract clause) or a `stated by Product Owner` note.

### Risk K (0–12)

| Input | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Support status (runtime, framework, datastore — worst of them) | Supported > 12 months | Ends in 6–12 months | Ends in < 6 months | End-of-life or `unknown` |
| Advisories (open, reachable from the component) | None | Low or medium only | ≥ 1 high | ≥ 1 critical |
| Test safety (line coverage of the module) | ≥ 70% | 40–69% | 1–39% | 0% or no runnable suite |
| Knowledge | Owner and ≥ 2 active people | Owner and 1 active person | Owner, nobody active | No owner |

`unknown` always scores the worst value. Re-score when the evidence changes; never adjust a score to fit a preferred disposition.

### Flags (not scored)

`personal data` · `health data` · `money` · `public API` · `irreversible data` · `regulated`. Flags do not change V or K; they feed the path score (`../../agentic-sdlc/references/paths.md` §2) of every work item touching the component.

## 2. Quadrants

| Quadrant | Rule | Default stance |
|---|---|---|
| Act now | V ≥ 5 and K ≥ 6 | Plan modernization; first slice = research + CHAR tests |
| Keep healthy | V ≥ 5 and K ≤ 5 | Retain; upgrade within support windows |
| Contain or retire | V ≤ 4 and K ≥ 6 | Retire if zero use; otherwise rehost or isolate behind an adapter |
| Leave | V ≤ 4 and K ≤ 5 | Retain; retire opportunistically |

Order inside a quadrant by V × K, highest first; ties by churn. A `critical` advisory reachable from the internet moves a component to the top of the roadmap regardless of quadrant (it becomes a security work item under `security-hardening`, not a modernization slice).

## 3. Dispositions

| Disposition | Choose when (all must hold) | Reject when | Reversibility | Usual pattern |
|---|---|---|---|---|
| **retire** | Zero use for the spec's window (default 30 days) shown by logs or metrics; a replacement exists or the Product Owner drops the capability | Any consumer in the window; data retention duty unresolved | One-way once data is deleted | Deprecation notice → disable by flag → zero-use window → remove code → contract data |
| **retain** | Keep healthy or Leave; no support end within 12 months | Support ends < 6 months; critical advisory | Two-way | Review date ≤ 12 months |
| **rehost** | Hosting or OS end-of-life, code and runtime still supported | The runtime itself is end-of-life | Two-way (old host kept until bake ends) | Parallel environment, traffic switch |
| **upgrade** | A supported version exists on the same platform; ≤ 2 major versions apart, or a documented path | Upgrade path closed or needs a rewrite of > 30% of the module | Two-way per step | One major version per slice, CHAR tests first, codemod for mechanical changes |
| **re-platform** | Runtime/framework/datastore dead end; behaviour stays the same | Behaviour must change at the same time (split it) | Two-way until contract | Expand–contract for data, branch by abstraction for code |
| **refactor** | Act now with change demand ≥ 2; structure is the cost driver, platform is fine | Test safety 3 and no seam (pin first) | Two-way | Seams → extract → move, each behaviour-neutral |
| **migrate** | Capability moves to another system (built or bought); old one cannot be fixed economically | No dual-run possible and no rollback route | Two-way until the old system is removed | Strangler with dual-run comparison |

Mechanical changes across > 500 call sites go through a codemod or scripted rewrite, reviewed by sample, not by hand edits.

**Retire checklist** (all before the removal PR): zero-use query and result pasted with window; consumers from the dependency map each confirmed gone; deprecation notice sent with date (advisory: "stop using by"; compulsory: "removed on"); data retention decision recorded; Product Owner decision when user-visible; backup of the data and restore command verified.

**Replace, don't layer.** A migrate or re-platform disposition names the date or condition when the old path is removed. A new layer on top of an unremoved old one doubles the inventory — record the removal as the final roadmap slice.

**Chesterton's fence.** Before retiring or refactoring a behaviour that looks pointless, answer "why is X this way?" in current-state research (history citation `<sha> "subject"`). No answer → keep the behaviour pinned and list it under open questions.

## 4. Record per component

```markdown
| ID | V (crit+demand+reach) | K (support+adv+tests+know) | Quadrant | Disposition | Evidence | Rejected alternative (why) | Door | Iterations | First slice |
|---|---|---|---|---|---|---|---|---|---|
| C1 billing | 8 (3+2+3) | 9 (3+2+3+1) | Act now | re-platform | PHP 7.2 EOL 2020-11-30 (php.net, accessed 2026-11-24); 2 high advisories (composer audit 2026-11-24); coverage 0%; owner team-billing, 1 active | upgrade in place (Laravel 5.8 → 11 needs > 30% rewrite) | two-way until contract | 6–8 PRs | Research + CHAR for calculateTotal |
```

Iterations are estimated in merged PRs, not days. Recommendation strength is stated: **strong** (evidence makes alternatives clearly worse), **moderate** (one alternative within 1 point on V × K), **weak** (scores missing or `unknown` drive the result — collect evidence first).

## 5. Worked example (synthetic)

| Component | V | K | Quadrant | Disposition | Reason |
|---|---|---|---|---|---|
| billing (PHP 7.2, 0% coverage, 3 consumers, 1 active person) | 3+2+3 = 8 | 3+2+3+1 = 9 | Act now | re-platform | Runtime EOL; upgrade path needs rewrite |
| reports (Python 3.6, 12%, 2 consumers, no owner) | 2+1+2 = 5 | 3+1+2+3 = 9 | Act now | upgrade | 3.6 → 3.12 feasible in 2 slices |
| auth (Java 11 LTS ending in 6–12 months, 70%, owner + 2 people) | 3+1+3 = 7 | 1+0+0+0 = 1 | Keep healthy | retain | Review 2027-11 |
| fax export (cron, 0 calls in 30 d, no owner) | 0+0+0 = 0 | 3+0+3+3 = 9 | Contain or retire | retire | Zero use verified; PO confirms capability dropped |

The order of the roadmap is billing (V × K = 72), reports (45), then the fax retirement; auth gets a review date.
