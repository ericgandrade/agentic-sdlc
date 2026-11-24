# CONSTRAINTS.md

<!-- Template (project-context constraints mode; rules in ../references/constraints-md.md).
     Required on the Full path before Design sign-off. CODEOWNERS: CONSTRAINTS.md @tech-leads.
     Tightening: normal PR. Loosening (lower number, removed rule, wider allow-list): ADR + Design sign-off,
     otherwise a Critical review finding. Agents never edit this file to get a check green. -->

Measured: <YYYY-MM-DD> at <sha12> · Owner: <Tech Lead handle>

## Floor

Always enforced on every change; never waived. Guard: `<command, e.g. sh scripts/floor-guard.sh>` (runs in the `lint` DoD key).

| # | Rule | Check |
|---|---|---|
| F1 | No new suppression comments (`@ts-ignore`, `eslint-disable`, `# type: ignore`, `# noqa`, `//nolint`, …) | floor guard F1 |
| F2 | No new skipped, focused or deleted tests without a reason line and a linked issue | floor guard F2 |
| F3 | No unimplemented stubs or empty error handlers in production code | floor guard F3 |
| F4 | No secrets in source | CI `secret-scan` (gitleaks) |
| F5 | This file, the `sdlc-dod` block and CI checks are not weakened to make a change pass | floor guard F5 + CODEOWNERS |

## Enforced with numbers

| Dimension | Rule | Exact command | Runs at | Reason for the number |
|---|---|---|---|---|
| Coverage (project) | Line coverage ≥ `coverage_min` | `<coverage command>` | Task end, PR (`agentic-sdlc/dod`) | Measured at adoption |
| Coverage (changed lines) | ≥ 80 % of changed lines covered | `<diff-coverage command>` | PR | <reason> |
| Dependencies | 0 advisories with CVSS ≥ 7.0 | `osv-scanner scan source --recursive .` | PR, weekly (`dependency-audit`) | External check |
| <dimension> | <rule> | `<command>` | <task end · PR · nightly> | <reason> |

## Ratchets

| Metric | Today (date · SHA) | Direction | Command |
|---|---|---|---|
| Line coverage | <n>% (<date> · <sha12>) | must not fall | `<coverage command>` |
| <metric, e.g. lint warnings> | <n> (<date> · <sha12>) | must not rise | `<command>` |

## Exceptions

| Rule | Path | Reason | Owner (≠ requester) | Expiry (≤ 30 days) |
|---|---|---|---|---|
| <F1> | `<path glob>` | <reason> | <handle> | <YYYY-MM-DD> |
