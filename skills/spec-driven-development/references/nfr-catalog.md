# Non-functional requirements catalog

Load this file when a story implies a quality attribute (speed, load, uptime, privacy, accessibility, audit, compliance), when a draft contains a vague quality word, or when critique item 2 ("every quality claim has a number") fails.

Every NFR is written as **metric + comparator + number + unit + condition + measurement method**, then placed in the spec section where it is enforced. A quality word with no number fails the vague-term check of `../../agentic-sdlc/scripts/spec-lint.mjs` (V01) unless the same sentence carries a number and a unit.

## Where each NFR lives

| Kind of NFR | Section | Why there |
|---|---|---|
| A user-observable threshold the Test Engineer must prove | `## Acceptance criteria` (AC row) | Gets an `AC-n`, a task and a test |
| A rule for the builder, not a user outcome (stack, region, dependency policy, test data) | `## Constraints` (Always / Ask first / Never, or a plain line) | Bounds the plan |
| Data classes, auth, inputs, secrets, regulatory obligations | `## Security notes` (+ obligations table when `regulated`) | Read by the Security Auditor and the threat model |
| A production threshold that pages someone | `## Release & observability` (Alert row) | Wired at Release, owned in Operate |
| A business outcome after release | `## Indicator` | Read at release + N days |
| Visual, keyboard, screen-reader, copy | `ux.md` § Accessibility and § State table | Checked by the UX Designer at Test |

Rule of thumb: when the threshold must hold **at Test**, it is an AC; when it must hold **in production over time**, it is an alert; often it is both, with the alert set looser than the AC (for example AC p95 ≤ 400 ms, alert p95 > 800 ms over 10 min).

## Catalog

### Performance

| Metric | Measurable phrasing | Measurement |
|---|---|---|
| Latency | p95 ≤ 400 ms for `GET /v1/orders?limit=100` over 1,000 requests on the staging data set of 250,000 orders | Load test in CI or staging |
| Throughput | ≥ 200 requests/s sustained for 10 min with error rate ≤ 0.1% | Load test |
| Job duration | Export of 50,000 records completes within 24 h; p95 job ≤ 20 min | Job metric histogram |
| Page load | Largest Contentful Paint ≤ 2.5 s at p75 on a 4G profile | Lab run + RUM |

Bad: "fast", "performant", "responsive". Always name the percentile, the load and the data set.

### Capacity and limits

| Metric | Measurable phrasing |
|---|---|
| Input size | Uploads up to 10 MB and 50,000 rows; larger files rejected with message X |
| Volume | 1,000 jobs/day; queue depth alert at 500 waiting jobs |
| Rate limit | 60 requests/min per API key; excess returns HTTP 429 with `Retry-After` |

State the behavior one past the limit as its own AC (`ac-rubric.md` pair 4).

### Reliability

| Metric | Measurable phrasing |
|---|---|
| Availability | Monthly availability ≥ 99.9% for the endpoint, measured by the synthetic check every 60 s |
| Error rate | 5xx responses ≤ 0.5% of requests over any 15 min window |
| Retry / idempotency | The same event ID processed twice within 24 h produces exactly 1 effect |
| Recovery | After a worker crash, queued jobs resume within 5 min with no duplicate output |
| Data durability | Recovery point ≤ 15 min; recovery time ≤ 4 h (only when the change touches backup scope) |

Bad: "reliable", "robust", "handles failures gracefully".

### Security

| Metric | Measurable phrasing |
|---|---|
| Authorization | A caller without `X:write` receives HTTP 403 and no state changes (negative AC per new entry point) |
| Input validation | Field Y accepts 1–200 UTF-8 characters; other input returns HTTP 400 `invalid_y` |
| Token strength | Download tokens are 32 random bytes, single-use, expire after 7 days |
| Secrets | No secret in code, logs or fixtures; new secret stored in `<secret store path>` |
| Abuse | ≥ 5 failed attempts in 10 min locks the action for 15 min |

Security rules come from `../../agentic-sdlc/references/security.md` (data classes, secrets, review checklist). Each high or critical threat in `threat-model.md` needs a mitigating AC (TM03).

### Privacy

| Metric | Measurable phrasing |
|---|---|
| Minimization | The file contains only the columns listed in AC-1; no name, email or phone number |
| Retention | Archives are deleted 7 days after creation; a later request returns HTTP 410 |
| Logging | Logs carry opaque user IDs only; no email, token or payload body |
| Residency | Processing and storage stay in region `eu-west-1` |
| Subject rights | A request is answered within 30 days, measured from the request audit event |

Any personal or sensitive personal data → the `personal/health data` trigger, which forces the Full path (`../../agentic-sdlc/references/paths.md` § 2 Score).

### Accessibility

| Metric | Measurable phrasing |
|---|---|
| Conformance | New and changed screens meet WCAG 2.2 AA |
| Keyboard | Every action in journey J-1 is reachable with keyboard only, focus visible, logical order |
| Screen reader | Status changes are announced through `aria-live`; every control has an accessible name |
| Contrast | Text ≥ 4.5:1; large text and UI components ≥ 3:1 |
| Motion | Animations respect the reduced-motion setting |

The four baseline rows A-1..A-4 live in `ux.md` (`../../agentic-sdlc/templates/ux.md`); promote a row to an AC when the story's success depends on it (for example a public-sector contract).

### Observability

| Metric | Measurable phrasing |
|---|---|
| Signal | Metric `export_jobs_total{status}` emitted per job · cites AC-2 |
| Alert | Failed jobs / all jobs > 5% over 60 min → `#accounts-oncall` |
| Dashboard | Grafana › Accounts › Data export |
| Audit | One audit event per lifecycle step, with actor and UTC timestamp, without payload |

The Release & observability table is required on Standard/Full by `spec-lint` (OBS01–OBS05): the Signal row cites an `AC-n`, the Alert row has a comparator, a number and a window, the Rollout row names a flag with "off" or ≥ 2 percentage stages, and the Rollback command sits in backticks. Contract: `../../agentic-sdlc/references/release-ops.md`.

### Compliance

| Metric | Measurable phrasing |
|---|---|
| Obligation row | `| Right of access | GDPR Art. 15(1) | Self-service archive | AC-2, AC-3 | Archive diff test |` |
| Retention | Records kept 7 years, then deleted within 30 days; deletion job evidence per month |
| Access review | Admin role grants reviewed every 90 days; review logged |

When the `regulated` trigger applies, add the obligations table under the first Security notes table: `| Obligation | Clause | Control | AC-n or task | Evidence |` (`../../agentic-sdlc/references/security.md` § Compliance). An obligation without a control becomes a new AC or an open question deferred to the Product Owner. Never write "the change is compliant"; the named compliance owner decides.

### Compatibility

| Metric | Measurable phrasing |
|---|---|
| API | Responses stay valid against OpenAPI schema v1.8; no existing field removed or retyped |
| Deprecation | Old parameter served unchanged for 90 days with `Deprecation` and `Sunset` headers |
| Clients | Supported browsers: last 2 versions of Chrome, Firefox, Safari, Edge |
| Data | Migration is reversible with `<command>`, or the `irreversible` trigger is scored |

## Vague word → measurable rewrite

| Vague | Ask | Example rewrite |
|---|---|---|
| fast, quick | Which percentile, at what load, on which data? | p95 ≤ 300 ms at 50 requests/s |
| scalable | Up to what volume, with what degradation? | 1,000 jobs/day with p95 job ≤ 20 min |
| reliable, robust | Which failure, what outcome, how often? | ≤ 0.5% 5xx over 15 min; retries produce 1 effect |
| secure | Which actor must be stopped from what? | Caller without `orders:read` gets HTTP 403 |
| user-friendly, intuitive | Which task, by whom, in how many steps or how long? | First export in ≤ 3 clicks from the report page |
| large, many, few | How many, exactly? | Up to 50,000 rows |
| gracefully | What does the user see and what state remains? | Order stays `pending`; message X shown |

The full vague-term list and the unit list are in `spec-lint.mjs`; when unsure, run the linter and read rule V01's output.
