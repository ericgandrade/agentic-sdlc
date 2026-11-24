# SSDF Mapping — NIST SP 800-218 practices → stage → evidence

Load when a customer, auditor or the Release Owner asks how the Agentic SDLC relates to the NIST Secure Software Development Framework, when the `regulated` trigger names SSDF or a supplier attestation, or when preparing an evidence index for a release.

> **Not a compliance claim.** This table shows where the method produces evidence that is *relevant* to each SSDF practice. It is not an attestation, a conformity statement or a completed self-attestation form. Following the method does not make software "SSDF-compliant"; whether a practice is met is decided by the organization's named compliance owner after examining the evidence. The Security Auditor reports evidence found and gaps; it never states that a practice is satisfied.

**Source.** NIST Special Publication 800-218, *Secure Software Development Framework (SSDF) Version 1.1: Recommendations for Mitigating the Risk of Software Vulnerabilities*, M. Souppaya, K. Scarfone, D. Dodson, February 2022, `https://csrc.nist.gov/pubs/sp/800/218/final`. Profile for AI: NIST SP 800-218A, *Secure Software Development Practices for Generative AI and Dual-Use Foundation Models: An SSDF Community Profile*, July 2024, `https://csrc.nist.gov/pubs/sp/800/218/a/final`. Practice titles below are paraphrased; read the publication for the normative wording, tasks and examples. SSDF Version 1.2 (SP 800-218 Rev. 1) was published as an initial public draft on 2025-12-17; re-check this mapping when the final version appears.

**Coverage column.** `method` = the method produces the evidence on its default path · `partial` = the method covers part; the rest is named under Gaps · `organization` = outside a per-change workflow; the method only records where the evidence lives.

## PO — Prepare the Organization

| Practice (paraphrased) | Stage | Method mechanism | Evidence location | Coverage |
|---|---|---|---|---|
| PO.1 Define the security requirements that apply to development and to the software | Discover, Specify | Data classification; §Security notes; obligations table on `regulated`; spec Constraints (Always / Ask first / Never) | `specs/NNN-slug/spec.md` §Security notes and §Constraints; AGENTS.md `sdlc-dod` block | partial — organization-wide policy documents are the organization's |
| PO.2 Assign roles and responsibilities and prepare people for them | All | Named sign-off owners; Security Auditor role; agents never approve | `../../agentic-sdlc/references/governance.md` §1 (RACI); `## Approvals` rows | partial — training records are the organization's |
| PO.3 Put supporting toolchains in place | Build, Test | `sdlc-dod` commands; `spec-lint`, `plan-graph`, `preflight`; CI security gate | AGENTS.md; `.github/workflows/security.yml` from `../../agentic-sdlc/templates/ci/security.yml`; CI run history | method |
| PO.4 Define criteria for security checks and track results | Specify, Test, Release | 20-item L3 checklist with severity floors; TM01–TM03; `dep-audit` 0 critical/high; go/no-go | PR Review triage (`L3 security: 20 items · …` line); release notes `## Residual risks` | method |
| PO.5 Keep development environments secure | Build | Agent tool lists; unattended-run authority limits; secrets never in context | `../../agentic-sdlc/references/autonomous.md`; run ledger halts | partial — workstation, runner and identity hardening are the organization's |

## PS — Protect the Software

| Practice (paraphrased) | Stage | Method mechanism | Evidence location | Coverage |
|---|---|---|---|---|
| PS.1 Protect every form of code from unauthorized access and tampering | Build, Test | Branch protection and CODEOWNERS enforcing the Test sign-off; S20 guard on CI and permission files; secret scan | Repository settings; CODEOWNERS; PR review record; `secret-scan` row | partial — access reviews are the organization's |
| PS.2 Provide a way to verify the integrity of releases | Release | Tagged release with notes; pinned and checksum-verified tools in CI | Git tag; release notes; checksums where the project publishes them | partial — signing and provenance attestations are project choices |
| PS.3 Archive each release with its provenance data | Release, Operate | Spec, plan, PR evidence and release notes kept in git per change | `specs/NNN-slug/`; PR record; release notes | partial — SBOM generation and retention period are project choices |

## PW — Produce Well-Secured Software

| Practice (paraphrased) | Stage | Method mechanism | Evidence location | Coverage |
|---|---|---|---|---|
| PW.1 Design to meet security requirements and reduce risk (risk modelling) | Specify | Five-minute threat model; abuse cases as negative AC; TM03 | `specs/NNN-slug/threat-model.md`; `spec.md` AC rows; `spec-lint` output | method |
| PW.2 Review the design against requirements and risk information | Specify, Design | Security Auditor pass before the Specify sign-off; Design sign-off with the threat model as evidence reviewed | `## Approvals` rows (Evidence reviewed column); `plan.md` approvals | method |
| PW.4 Reuse existing well-secured software instead of duplicating it | Design, Build | Rule 10 dependency note: reason, license, last release, advisories, typosquat check, pin | `plan.md` `## Dependencies`; PR row `dep-audit` | method |
| PW.5 Write code following secure coding practices | Build | Hardening patterns; Constraints defaults; test-first for negative AC | Commits `[Tn, AC-n]`; L3 rows S8–S15 | method |
| PW.6 Configure build and interpreter settings to improve executable security | Build, Release | Frozen installs, pinned CI actions (S17) | CI configuration; lockfile | partial — compiler hardening flags are stack-specific |
| PW.7 Review or analyze human-readable code for vulnerabilities | Test | Independent L3 review in a fresh context; secret scan; optional SAST in `sdlc-dod` | PR Review triage L3 rows and summary line | method |
| PW.8 Test executable code for vulnerabilities | Test | Acceptance tests for every negative AC; dependency audit | `acceptance-tests.md`; PR Verification AC rows; `dep-audit` row | partial — DAST, fuzzing and penetration tests are project choices |
| PW.9 Ship secure settings by default | Build, Release | S15 checks; new flags default off; rollout stages | Config diff; L3 S15 row; spec §Release & observability | method |

PW.3 was withdrawn in version 1.1 (its content moved into PW.4).

## RV — Respond to Vulnerabilities

| Practice (paraphrased) | Stage | Method mechanism | Evidence location | Coverage |
|---|---|---|---|---|
| RV.1 Identify and confirm vulnerabilities on an ongoing basis | Operate, Discover | Weekly `dependency-audit`; intake from production into Discover; issues labelled `security` | CI schedule runs; issue tracker | partial — a public disclosure policy and intake address are the organization's |
| RV.2 Assess, prioritize and remediate vulnerabilities | Discover → Release | Severity scale; triage by reachability; waivers with expiry ≤ 30 days; secret rotation within 24 h | Waiver rows; PR findings; `security` issues with rotation records | method |
| RV.3 Analyze root causes to prevent recurrence | Operate | Postmortem for SEV1/SEV2 (a leaked secret on a remote is SEV2); retrospective; root-cause routing of review findings (spec, design, plan, code) | Postmortem; retro record; AGENTS.md or check added | method |

## SP 800-218A (generative AI profile)

The profile adds tasks for organizations that build or fine-tune models: protecting training data and model weights, tracking dataset provenance, and testing models for AI-specific weaknesses. The method covers the *use* of models by agents and by product features (`ai-use-guardrails.md` §1–§5, checklist S19). Model training and fine-tuning pipelines are outside the method; when a change touches one, mark the related rows `organization` and name the owner.

## Building an evidence index for a release

1. List the specs in the release; for each, collect the paths in the Evidence location column that exist.
2. Mark each practice row `evidence present`, `gap` or `not applicable — reason`. Never mark a practice "met".
3. Put the index under the release notes' links and list every gap as a residual risk with an owner role. The compliance owner records any conformity decision with the Release sign-off when a contract requires one.
