# Glossary and ADR formats

Load in glossary mode, when Specify defines a domain term, when one word means two things in the code or the conversation, and in adopt mode when scanning for decisions that were never recorded. Contracts: `../../agentic-sdlc/references/artifacts.md` (artifact table row `GLOSSARY.md`; §ADR). ADRs are **written** by `senior-solution-architect`; this skill only finds candidates, maps existing ADR folders and points to them from the block.

## 1. GLOSSARY.md

**Location.** Project root. Required once Specify defines ≥ 1 domain term; validated by Reviewer lens L1 (a spec, plan or code identifier that uses a term against its glossary meaning is a finding). Writers: Analyst and Product Manager during Specify, `grill-me` during interviews, this skill in glossary mode. Template: `../templates/GLOSSARY.md`.

**Entry format.** One `###` heading per term, then four lines:

```markdown
### Settlement
- Definition: The transfer that moves a captured payment from the processor to the merchant's bank account.
- Avoid: payout (means a refund to the customer in this domain), transfer
- Example: "Settlement for batch 2026-11-03 failed because the IBAN was closed."
- Source: specs/014-settlement-retry/spec.md AC-2 · code `SettlementJob`
```

| Field | Rule |
|---|---|
| Term | The word the domain expert uses, singular, title case; the code symbol in `Source` when they differ |
| Definition | One or two sentences in the domain's language: what it **is**, not how the code stores it. No circular definitions |
| Avoid | Aliases and near-synonyms the team must not use for this meaning, each with what it means instead when it has another meaning |
| Example | One sentence a domain expert would say |
| Source | Where the meaning is fixed: spec + `AC-n`, regulation, contract clause, code symbol |

**Rules.**

1. **One meaning per term.** A word used with two meanings ("account" = login identity and ledger account) is split into two terms (`User account`, `Ledger account`); the bare word goes under `Avoid` in both, and the entry records which meaning the code uses today.
2. **Flagged ambiguities.** A conflict not yet resolved goes under `## Open questions` at the bottom: term · the two meanings · where each is used · owner. Open questions block Specify sign-off only when an `AC-n` depends on the term.
3. **Renames are decisions.** Resolving an ambiguity by renaming code symbols, tables or public API fields is expensive to reverse → an ADR via `senior-solution-architect`, linked from the entry's `Source`.
4. **Domain words only.** Framework, language and tool terms (`middleware`, `DTO`) stay out unless the project gives them a non-standard meaning.
5. **Sorted alphabetically**; ≤ 80 terms before splitting by bounded context (`GLOSSARY.md` sections per context, each term once).

**Procedure (glossary mode).**

1. Collect candidates: nouns in `spec.md` AC text and `## Problem`, class/table/route names in `docs/codemap.md` modules, words the user explains in the conversation.
2. Keep a candidate only when it is domain-specific **and** (used in ≥ 2 places, or ambiguous, or confused once already).
3. Draft entries; mark any guessed definition `(unconfirmed)` and ask the domain owner one question at a time.
4. Show the file; write after approval. Add `Vocabulary: GLOSSARY.md` to the block's `Artifacts:` line.

**Failure behaviour.** A definition copied from a web page or issue without the owner's confirmation stays `(unconfirmed)` and cannot be cited as `Source` for an AC. Personal or client data never appears in examples; use synthetic names (`../../agentic-sdlc/references/rules.md` rule 7).

## 2. ADRs

**Location and numbering.** Keep an existing folder (`docs/adr/`, `adr/`, `docs/decisions/`) and its numbering; otherwise `docs/adr/NNNN-slug.md`, `NNNN` four digits (`../../agentic-sdlc/references/artifacts.md` §Naming and numbering). Record the folder on the block's `Artifacts:` line. Template: `../templates/adr.md`.

**When an ADR is required (the method's rule for new decisions).** The decision is expensive to reverse (data model, public interface, framework, deployment topology), **or** ≥ 2 options were seriously compared.

**Format** (`artifacts.md` §ADR): `Status` (Proposed → Accepted at Design sign-off → Superseded by NNNN) · `Date` · `Related` (spec ID, `AC-n`) · `Context` · `Decision` · `Options considered` (option · pros · cons) · `Consequences` (including one-way or two-way door). An Accepted ADR's decision is never edited; a new ADR supersedes it and both link each other. An ADR still `Proposed` after Design sign-off → Reviewer lens L2 Important finding.

**Retroactive ADRs during adopt (three-condition filter).** Existing code embeds decisions nobody wrote down. Recording all of them buries the useful ones. In adopt and audit modes, list a past decision as an ADR **candidate** only when all three hold:

1. **Hard to reverse** — changing it touches many modules, data, or external consumers.
2. **Surprising without context** — a competent newcomer would likely "fix" it and break something.
3. **A real trade-off** — a reasonable alternative existed and was given up for a reason.

Fewer than three → not an ADR; when a newcomer still needs the fact, it becomes a convention line with evidence or a pitfall. Candidates go into the adoption ledger (`adoption-ledger.md`) with owner `Architect`; `senior-solution-architect` writes them with `Status: Accepted` and `Date` = the date the decision was originally made when known (`unknown — recorded <today>` otherwise), and `Related: adoption`.

**Pointer, not copy.** The block names the ADR folder; it never restates ADR content. A pitfall that exists because of an ADR cites the ADR number.
