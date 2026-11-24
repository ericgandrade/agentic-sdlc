# Threat model: {{title}}

<!--
Template for specs/NNN-slug/threat-model.md (mechanism 11.4). Written by the Security Auditor
(agents/security-auditor.md) in Specify, before the Specify sign-off request. Full workflow, rating
rubric and STRIDE question catalog: the security-hardening skill (references/threat-model-guide.md).

Required: Full path (spec-lint TM01 error when missing). Risk-flagged Standard spec with a trigger among
auth, personal/health data, money or public API (TM02 warning when missing; write it before sign-off).

spec-lint reads the ## Threats table only through two columns:
  Rating      one word: low | medium | high | critical
  Mitigation  every high or critical row cites ≥ 1 active AC-n of spec.md (TM03 error otherwise)
Keep exactly one table in this file; do not add a "Severity" column (spec-lint treats it as the rating).
Threat IDs are TH-n (T-n is reserved for plan tasks). HTML comments are ignored by spec-lint.
Check: node <agentic-sdlc skill>/scripts/spec-lint.mjs specs/NNN-slug/spec.md
-->

- **Spec:** `specs/{{NNN-slug}}/spec.md` rev {{N}}
- **Revision:** 1
- **Path and risk:** {{Standard · R=1 (money)}}
- **Written by:** Security Auditor · {{fresh-context | self-review}} · {{YYYY-MM-DD}}
- **Assets:** {{what an attacker wants: data class + store, money movement, admin action}}
- **Trust boundaries:** {{TB-1 browser → API; TB-2 API → database; TB-3 API → third-party or model}}
- **Data flows:** {{DF-1 who sends what across which boundary to where}}
- **Out of scope:** {{threats owned by another spec or by the platform, with the reason}}

## Threats

<!--
One row per threat that survives the STRIDE questions for a data flow. Write the Threat as an abuse
case: actor + action + asset ("A viewer without reports:export calls the export URL directly").
STRIDE: S Spoofing · T Tampering · R Repudiation · I Information disclosure · D Denial of service ·
E Elevation of privilege.
L × I: likelihood 1–3 × impact 1–3. Rating: 1–2 low · 3–4 medium · 6 high · 9 critical.
Mitigation: the control, then "· AC-n" for the negative AC that proves it. A low or medium row may
instead say "accepted — <reason>, owner <role>" and is listed under Residual risks.
-->

| ID | Data flow | Threat | STRIDE | L × I | Rating | Mitigation |
|---|---|---|---|---|---|---|
| TH-1 | {{DF-n}} | {{actor}} {{abuse}} {{asset}} | {{S \| T \| R \| I \| D \| E}} | {{L × I = n}} | {{low \| medium \| high \| critical}} | {{control}} · {{AC-n}} |

## Residual risks

<!-- Every accepted row: TH-n, why it is accepted, owner role, review date. Listed again in the Specify sign-off request. -->

- {{TH-n — reason — owner role — review by YYYY-MM-DD}} or {{none}}

## Revision log

<!-- One bullet per revision; a spec revision that changes an AC cited here requires a new revision. -->

- 1 · {{YYYY-MM-DD}} · first model for spec rev {{N}}
