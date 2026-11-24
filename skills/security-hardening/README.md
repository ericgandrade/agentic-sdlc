# security-hardening

Specify- and Test-stage skill of the **Agentic SDLC**, with Build guidance, used by the **Security Auditor**. It works in three passes. In Specify, it classifies every data element and writes a five-minute STRIDE threat model (`threat-model.md`); each high or critical abuse case becomes a negative acceptance criterion (`AC-n`) that a test must prove. It also fills the spec's §Security notes and maps obligations when the `regulated` trigger fires. In Build, it applies fixed rules for hardening patterns, secrets, dependencies and AI-use data. In Test, it runs the 20-item review lens L3 against the diff, using gitleaks and dependency-audit output as evidence. It reports checks performed and findings; it never declares anything "secure" or "compliant".

## When to use

- A Standard or Full spec has a risk trigger (auth, personal/health data, money, public API, schema/migration, irreversible, regulated) and needs §Security notes or a threat model.
- `spec-lint` reports TM01, TM02, TM03 or SEC01.
- A Build task adds an entry point, input, export, outbound fetch, secret, dependency or model call.
- A PR needs the L3 security lens, or a scanner found a secret or a critical/high advisory.
- Regulated obligations must be mapped to controls, or someone asks how the method relates to NIST SSDF.

## What is included

- `SKILL.md` — modes (specify, build, review, map), discovery, data classification, threat model procedure, negative-AC hand-off, Security notes, obligations mapping, `spec-lint` step, Build guidance table, L3 review procedure, statuses and failure paths
- `references/threat-model-guide.md` — when a model is required, 7-step timeboxed procedure, STRIDE question catalog, L × I rating rubric, 12 abuse-case → negative AC patterns, worked example
- `references/hardening-checklist.md` — Always / Ask first / Never defaults; patterns per area (authN/Z, input, injection, CSV formula, SSRF, files, limits, crypto, errors, defaults, logging, integrity, dependencies) with proving tests
- `references/secrets-and-supply-chain.md` — secret locations, scanning and rotation; dependency note, audit commands by ecosystem, advisory triage, install scripts, CI gate
- `references/ai-use-guardrails.md` — data class × AI tool matrix, context hygiene, prompt injection in fetched content, agent controls, LLM feature checks (OWASP LLM Top 10 2025)
- `references/ssdf-mapping.md` — NIST SP 800-218 practices → stage → evidence location (not a compliance claim)
- `prompts/security-auditor.md` — dispatch templates A (Specify) and B (Test lens L3), no-subagent fallback
- Adds to `agentic-sdlc`: `templates/threat-model.md`, `templates/ci/security.yml`
- `evals/evals.json` — 4 scenarios (specify, secret found, pressure to skip, regulated/SSDF)
- `evals/trigger-eval.json` — 16 trigger queries (9 positive, 7 negative)

## Typical invocation

- "Threat-model the CSV export spec before the Product Owner signs it."
- "spec-lint says TM03 — fix the threat model."
- "Run the security lens on PR #212."
- "gitleaks flagged a key in the branch — what now?"
- "Map the HIPAA obligations for the import spec."
- "Which SSDF practices does our process produce evidence for?"

## Influences

| Inventory ID | Source (license) | What was taken | How adapted |
|---|---|---|---|
| AO-78 | Addy Osmani agent-skills (MIT) | Five-minute threat model: assets, trust boundaries, STRIDE, abuse cases | Fixed table format with TH-n IDs and L × I rating; high/critical rows must cite an active AC-n, enforced by `spec-lint` TM03 |
| AO-79 | Addy Osmani agent-skills (MIT) | Always / Ask first / Never security boundaries | Restated as checklist defaults tied to items S1–S20 and plan task approval |
| AO-80 | Addy Osmani agent-skills (MIT) | Hardening controls catalog (injection, access control, uploads, SSRF, rate limits) | Bad/good pattern per area with the test that proves it; CSV formula injection added |
| AO-82 | Addy Osmani agent-skills (MIT) | Dependency procedure: installation boundary, install-script gate, audit triage | Bound to the method's dependency note (license list, ≤ 12 months, 30-day age, 0 critical/high) and the `dep-audit` PR row |
| AO-76 | Addy Osmani agent-skills (MIT) | Pre-commit secret grep | gitleaks first, grep fallback, `secret-scan` PR row; secret found → BLOCKED and rotation within 24 h |
| AO-83 | Addy Osmani agent-skills (MIT) | Privacy by design: classify, minimize, retain | Six data classes from the stage contract; unknown → Personal; 3-round question limit |
| AO-84 / AO-51 | Addy Osmani agent-skills (MIT) | LLM feature security (LLM Top 10) and tool output as untrusted data | AI-use guardrails: data class × tool matrix, quote-never-follow rule for fetched content, S19 |
| AO-85 | Addy Osmani agent-skills (MIT) | Security review checklist with OWASP 2025 quick reference | Walked as lens L3: one evidence line per item and a fixed summary line |
| BM-67 | BMad Method (MIT) | Security review template with OWASP and STRIDE; "the framework handles it" is not an answer | Anti-rationalization row; pass/fail/n/a with file:line evidence; `comp` findings for obligations |
| BM-37 | BMad Method (MIT) | No-subagent fallback: standalone prompt for another session | Templates A and B with inlined inputs; separate labelled pass marked `self-review` |
| SP-37 | Superpowers (MIT) | Subagent status contract | Security Auditor statuses DONE, DONE_WITH_CONCERNS, BLOCKED, NEEDS_CONTEXT, CANNOT_VERIFY |
| SP-69 | Superpowers (MIT) | Pressure scenario design | Eval scenario: pressure to skip the threat model on a Friday deadline |
| — | OWASP Top 10 2025 and LLM Top 10 2025 (CC BY-SA, paraphrased) | Risk categories | Tags on checklist items and LLM feature checks; paraphrased, never copied |
| — | NIST SP 800-218 v1.1 and SP 800-218A (public domain, US Government work) | SSDF practice groups PO, PS, PW, RV | Practice → stage → evidence location table, explicitly not a compliance claim |

---

## Metadata

| Field | Value |
|-------|-------|
| Version | 1.0.0 |
| Author | Eric Andrade |
| Created | 2026-11-24 |
| Updated | 2026-11-24 |
| Platforms | GitHub Copilot CLI, Claude Code, OpenAI Codex, OpenCode, Gemini CLI, Antigravity, Cursor IDE, AdaL CLI |
| Category | security |
| Tags | agentic-sdlc, security, threat-model, stride, owasp, secrets, supply-chain, ssdf |
| Risk | safe |
