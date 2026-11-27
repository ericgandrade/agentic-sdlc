# Agentic SDLC — Adoption guide

Load when a team adopts the method, when the project already has Spec Kit, Kiro, OpenSpec, AI-DLC or BMad artifacts, or when someone asks how the method fits Scrum or Kanban. This guide adds no new rules: the bounds, sign-offs and artifacts stay as defined in `lifecycle.md`, `governance.md` and `artifacts.md`.

## 1. Before week 1

| Item | Owner | Done when |
|---|---|---|
| Name the four approvers: Product Owner, Tech Lead, at least one human reviewer, Release Owner | Team lead | Names recorded next to the AGENTS.md block; one person may hold several roles, and every record names the role exercised (`governance.md` §1, K12) |
| Install the skills | Any engineer | `npx agentic-sdlc-method` or the platform's plugin flow; router answers "what is next?" |
| Run `project-context` setup | Any engineer | AGENTS.md block with the `sdlc-dod` commands; `docs/codemap.md` on brownfield repos |
| Run the Definition of Done once | Any engineer | Every `sdlc-dod` command runs; failures recorded on the block's `Baseline:` line (`paths.md` §5) |
| Install the day-1 CI gates (`project-context` setup or adopt) | Any engineer with write access | `agentic-sdlc/dod`, `agentic-sdlc/spec` and `agentic-sdlc/approvals` jobs, `security.yml` (secret scan, dependency audit) and `CODEOWNERS` run on every PR; `doctor` shows `ci: present`. No admin rights needed; teams without Node locally get the same gates because CI runs them |
| Map existing artifacts (§3) | Tech Lead | `Artifacts:` line in the AGENTS.md block |

## 2. Three-week rollout

Each week adds one layer. Do not start the next layer until the exit check passes.

| Week | Scope | Exit check |
|---|---|---|
| 1 — Quick | Bug fixes and small changes only, on the Quick path: Analyst scores, failing acceptance test first, Developer fixes, Reviewer checks, PR with a Verification section. The day-1 CI checks run on every PR; GO requires them green | ≥ 3 merged Quick PRs whose Verification sections show fresh command output and green CI checks; one batched retro held |
| 2 — Standard | One feature on the Standard path: `spec.md` with Specify sign-off, `plan.md` with Design sign-off, task-by-task Build, Test sign-off, Release sign-off | One item reaches Operate with every approval recorded and the `agentic-sdlc/spec` and `agentic-sdlc/approvals` checks green |
| 3 — Branch protection | Make the day-1 checks required and turn on branch protection and "Require review from Code Owners" (`deployment-pipeline` skill; needs admin rights); prove each gate blocks a bad change. The Full path and unattended runs open after this week | Each gate shows one blocked change on record; approvals can no longer be bypassed by a merge |

The Full path, unattended mode, extensions and metrics stay off until week 3 is done or someone asks for them (mechanism 1.4). A day-1 gate that blocks wrongly is waived with the waiver procedure (`governance.md` §6: owner ≠ requester, expiry ≤ 30 days), never deleted.

## 3. Existing artifact folders

The router discovers conventions first (`artifacts.md` §Step 0). With exactly one convention found, keep the files where they are and map them. Never create a parallel `specs/` tree next to an existing one.

| Existing tool | Files found | Map to | Add to the existing file |
|---|---|---|---|
| Spec Kit | `specs/NNN-feature/spec.md`, `plan.md`, `tasks.md` | Same paths; `tasks.md` rows become the `## Tasks` table of `plan.md`, or `plan.md` links to `tasks.md` | `## Approvals` in `spec.md` and `plan.md`; numbered `AC-n`; the rollback and observability sections that `spec-lint` requires |
| Kiro | `.kiro/specs/<feature>/requirements.md`, `design.md`, `tasks.md` | `requirements.md` = spec, `design.md` + `tasks.md` = plan | EARS wording kept as the requirement text (decision Q8); each `AC-n` row restates it as Given/When/Then for `spec-lint` AC03 (skill `spec-driven-development`, format mapping); `## Approvals` in `requirements.md` and `tasks.md` |
| OpenSpec | `openspec/changes/<id>/proposal.md`, `tasks.md`, `specs/` deltas | `proposal.md` + delta specs = spec revision, `tasks.md` = plan tasks | `## Approvals`; the "must not change" statement of revise mode (`spec-driven-development`) |
| AWS AI-DLC | `aidlc-docs/` inception and construction records, units of work | Each unit of work = one `specs/NNN-slug/` item; inception requirements = spec; construction plan = plan | `AC-n` IDs, `## Approvals`, the PR Verification section |
| BMad | PRD, architecture document, epics and story files | PRD sections → spec per capability; architecture → ADRs + `plan.md` design notes; one story = one plan task or one Quick item | `## Approvals` with hashes; acceptance tests designed by the Test Engineer from the spec, not from the story |
| ADR folders | `docs/adr/`, `adr/`, `docs/decisions/` | Keep the folder and numbering | `AC-n` links in new ADRs (`senior-solution-architect`) |

Two or more conventions → ask which one is authoritative and record the answer; the other stays read-only.

## 4. Coming from another method

| Coming from | What stays the same | What is new here | First step |
|---|---|---|---|
| Spec Kit | Spec → plan → tasks → implement, one folder per feature | Human sign-offs bound to file hashes; bounded loops with escalation; separate-context acceptance tests; Release and Operate stages | Add `## Approvals` to the current feature's spec and run `spec-lint` |
| Kiro | Requirements → design → tasks; EARS criteria | Path sizing (Quick skips the spec file); review axes; evidence bound to the working tree | Number the requirements `AC-n`; run one bug on the Quick path |
| OpenSpec | Change proposals with deltas against the current spec | Approval voiding when a signed file changes; Test and Release sign-offs; retro actions that change a file | Map one open change and request the Specify sign-off on it |
| AWS AI-DLC | Inception → construction → operations; human approval at each phase; specialist agents | Functional agent briefs with "never sees" rules; Quick path for small work; the scored path rubric | Score the next item with `paths.md` before starting inception |
| BMad | Analyst, PM, UX, architect, developer and QA functions; PRD and architecture documents | Functional names instead of personas; 4 hash-bound sign-offs; acceptance tests designed before Build; Scrum Master played by the router | Turn the current story into a Quick or Standard item and let the Analyst score it |
| Superpowers | Brainstorm → plan → execute with TDD and review between tasks | Specify and Release stages; human sign-offs; Operate and retro | Keep the habits; add the spec and the Release sign-off for the next feature |
| No method | — | Everything | Week 1 of §2 |

## 5. Scrum and Kanban

The method runs inside a sprint or on a board; it replaces neither.

| Scrum or Kanban element | Agentic SDLC element |
|---|---|
| Product backlog item | Issue with the intake decision (Discover) |
| Definition of Ready | Specify sign-off on Standard and Full; the acceptance test in the issue on Quick |
| Sprint planning | Choose items whose spec is signed; Design sign-off before Build starts |
| Daily stand-up | Scrum Master progress line and impediment log (`agents/scrum-master.md`) |
| Definition of Done | The `sdlc-dod` block, plus a PR Verification section bound to the current fingerprint |
| Sprint review / demo | Test sign-off evidence and the release notes `## For users` |
| Retrospective | `references/retrospective.md`: each action changes a file the next cycle reads |
| Kanban columns | The seven stages; an item moves only when the next stage's entry condition holds (`lifecycle.md` §1) |
| WIP limit | One active item per Developer |

Story points remain optional. The path score (`paths.md`) measures risk and size for routing; it is not an estimate.

## 6. Signs that adoption is stalling

| Signal | Likely cause | Action |
|---|---|---|
| Approvals arrive days late | Approver not named, or overloaded | Scrum Master reminder after 2 business days, then the Product Owner (`agents/scrum-master.md`) |
| Most work routed Full | Risk signals scored too broadly | Review the last 10 scores in the retro; correct `paths.md` usage, not the rubric |
| Verification sections pasted from old runs | Evidence not re-run after the last commit | `verification-gate`: re-run against the current fingerprint |
| Retro actions never close | Actions that change no file | Rewrite each one as a change to a named file with an owner and a due date |
