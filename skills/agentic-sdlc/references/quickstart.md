# Quickstart — One Bug Fix on the Quick Path

Read this once before the first run: one bug from issue to approved pull request on the Quick path, with every record the method expects. First-path reading is this file, the README install section and the router `SKILL.md` (≤ 3,700 words, about 20 minutes, enforced by `scripts/budget-check.mjs`); everything else loads at its trigger.

**Prerequisites:** the skills are installed (README §Install), the project is a git repository, and the agent can run shell commands. Node ≥ 18 enables the script gates; without it the same checks run by hand (`references/platforms.md` §4) and the PR carries the banner `enforcement: prompt-only`.

## Step 1 — Set up the project (once)

Ask: "Set up the Agentic SDLC here."

`project-context` reads the manifests and CI files, runs the test suite once and writes the AGENTS.md block with the Definition of Done:

```sdlc-dod
lint: npm run lint
typecheck: npm run typecheck
test: npm test
coverage: npm run coverage -- --json-summary
coverage_min: 71.3
```

On an existing codebase adopt mode runs first, and no code change starts until it completes: inventory, baseline, artifact map, instruction audit, `docs/codemap.md`, ADR candidates and `.agentic-sdlc/adoption.md`. Done when the block exists between `<!-- AGENTIC-SDLC:BEGIN -->` and `<!-- AGENTIC-SDLC:END -->` and every `sdlc-dod` command exits 0 on the current branch. A command that fails at setup is recorded in the block's `Baseline:` line; it is never deleted to get green.

## Step 2 — Discover: score the path

Issue #142: "The date column on the orders page shows UTC instead of the user's time zone."

Ask: "Fix issue #142 with the Agentic SDLC." The Analyst scores it (`references/paths.md` §2):

- Files: 2 (date formatter, its test) → 1 · Components: 1 (web) → 1 · Iterations: 1 → 1 · **S = 3 → Quick**
- Risk triggers: none · **R = 0 → Quick**

It writes the score line as the first line of the issue: `Path: Quick · S=3 · R=0`. Any risk trigger (auth, personal/health data, money, public API, schema/migration, irreversible, regulated) would have moved the item to Standard or Full regardless of size.

## Step 3 — Discover: acceptance test in the issue

On the Quick path the issue is the spec. The Analyst adds one acceptance criterion in Given/When/Then form:

> **AC-1** Given a user whose profile time zone is `America/Sao_Paulo`, when the orders page shows an order created at `2026-03-01T02:30:00Z`, then the date column reads `2026-02-28 23:30`.

No code is written until this line exists in the issue.

## Step 4 — Build: red

The Developer creates the branch `fix/142-utc-dates`, writes a regression test named with the issue and AC ID, runs it (`--test-name-pattern="#142 AC-1(?![0-9])"`) and pastes the failing output into the PR draft:

```
✗ #142 AC-1 formats order dates in the profile time zone
  expected "2026-02-28 23:30", received "2026-03-01 02:30"
```

Before the first edit, `node <skill>/scripts/preflight.mjs` checks a clean tree and a green Definition of Done. A new test that passes on its first run proves nothing: delete it and write one that fails for the reported reason. Three failed attempts to reach red or green → the debug loop (`references/loops.md`); the Architect takes over only when its anti-thrash rule fires.

## Step 5 — Build: green and Definition of Done

The Developer changes the formatter to use the profile time zone, re-runs the test (green) and then every `sdlc-dod` command. It commits with the trailer `Refs: AC-1` (Quick items have no plan tasks). Touching a fourth file or meeting a risk trigger stops the work: re-score, route up to Standard and log the change (`references/paths.md` §4).

## Step 6 — Open the PR with evidence

The PR body follows `templates/pr-body.md`. Its Verification table binds every claim to the exact tree that was tested:

| ID | Test | Command | Exit | Fingerprint | Time (ISO-8601) | By |
|---|---|---|---|---|---|---|
| DoD:lint | — | `npm run lint` | 0 | `9b41c07e2d15` | 2026-11-22T14:06Z | Developer |
| DoD:typecheck | — | `npm run typecheck` | 0 | `9b41c07e2d15` | 2026-11-22T14:06Z | Developer |
| DoD:test | — | `npm test` | 0 | `9b41c07e2d15` | 2026-11-22T14:07Z | Developer |
| DoD:coverage | — | `npm run coverage -- --json-summary` | 0 (71.9 ≥ 71.3) | `9b41c07e2d15` | 2026-11-22T14:08Z | Developer |
| AC-1 | `#142 AC-1 formats order dates in the profile time zone` | `npm test -- --test-name-pattern="#142 AC-1(?![0-9])"` | 0 | `9b41c07e2d15` | 2026-11-22T14:05Z | Developer |

The fingerprint is printed by `node <skill>/scripts/lib/git.mjs fingerprint` (without Node: the 12-hex HEAD SHA of a clean tree). Any edit after the run changes it, and stale evidence is re-run, never reused.

## Step 7 — Test: independent review

The Reviewer runs in a fresh context with the issue, the diff and the evidence, never the Developer's reasoning. Quick-path lenses: **L1** (does the change meet AC-1?) and **L2** (correctness and code quality). Findings are verified, then triaged Critical, Important or Minor. The verdict defaults to NO-GO until AC-1 has fresh evidence and no Critical finding is open.

## Step 8 — Test sign-off

The agent presents the PR, the evidence and the residual risks ("other date columns use the same formatter and were not changed"), asks the reviewer for a decision and **ends its turn**. Only an explicit "approved" in a later turn counts; the agent records the exact words, the date and the head commit SHA in the PR body's `## Test sign-off` section. Without a PR host the body is committed as `docs/reviews/142.md` and the sign-off binds to the fingerprint instead: review records are excluded from it, so committing one keeps the sign-off valid; a code or test change voids it. The human merges.

## Step 9 — Release and retro

- When the merge deploys to production, the Release Owner gives the Release sign-off; the release notes list AC-1 and the rollback command (`git revert <merge sha>` and redeploy).
- Quick items share a batched retro: every 10 merged Quick items or 14 days, whichever comes first (counted from the merge log since the last `docs/retros/` file), with at least one owned action that changes a file (`references/retrospective.md`).

## When something goes wrong

| Situation | What happens |
|---|---|
| The fix needs a fourth file or touches auth | Stop at the next green run, re-score, route up, log a Revision entry |
| Same failure twice in a row, or 3 failed fixes | Stop fixing; open a design question for the Architect |
| No subagents on the platform | Separate labelled pass; `self-review` label in the PR |
| Node absent | Manual gate equivalents; PR banner `enforcement: prompt-only` |
| Router reports state `UNKNOWN` | Run `project-context` audit; see `references/faq.md`† |

## Next

- A feature with a spec, a plan and four sign-offs: `examples/worked-example/` (CSV export, Standard path).
- Path rules and escalation: `references/paths.md`. Platform differences: `references/platforms.md`.

† Added in a later release; manual fallback in `references/artifacts.md` §Later-release files.

## Sources

The red-first bug-fix sequence and evidence-before-claims rule adapt Superpowers (MIT) and Addy Osmani's agent-skills (MIT); the quick-flow shape adapts BMad Method (MIT). All text is original.
