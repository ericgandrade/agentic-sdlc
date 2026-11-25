# Design It Twice — Procedure, Comparison and Choice

Load at Workflow Step 2, whenever a decision meets the ADR trigger (Step 1 classification "one-way door"), and in standalone design work before recommending any architecture. The principle that the first design is rarely the best comes from John Ousterhout; the parallel, constraint-driven procedure adapts Matt Pocock's `codebase-design` "design it twice" (MIT). Wording is original.

## 1. When it is required

| Situation | Designs required | Designer passes |
|---|---|---|
| Decision is a two-way door (cheap to reverse, internal, behind a flag) | 1, with a one-line "why not more" | Inline |
| Decision meets the ADR trigger on the Standard path (schema, public interface, new dependency, new module with ≥ 2 callers) | ≥ 2 materially different | Fresh-context if the platform allows |
| Full path, cross-service contract, data migration, deployment topology, or a user insisting on one answer before any comparison | ≥ 3, one of them the "do less" option | Fresh-context, one per design |
| Loop escalation (anti-thrash) asks whether the current design is sound | The current design + ≥ 1 alternative | Fresh-context |

The "do less" option is mandatory at 3: the smallest change that satisfies the AC (extend the existing module, a modular monolith instead of a service, a library instead of a platform).

## 2. Materially different, not cosmetically different

Two designs are materially different only when they differ in at least one of:

1. **Where the seam sits** (which module owns the interface).
2. **What is hidden** (which decision moves behind the interface).
3. **Where state lives and who owns it** (one store vs two, synchronous vs eventual consistency).
4. **Interaction style** (synchronous call vs queue vs batch vs streaming).
5. **Build vs buy vs reuse** (write it, adopt a dependency, extend existing code).
6. **Deployment shape** (same process vs separate deployable).

Not material: naming, parameter order, framework flavour with identical structure, the same design with one extra method. If the second design differs only cosmetically, discard it and assign a different constraint.

## 3. Designer constraints

Give each designer one constraint so the designs diverge. Pick from:

| ID | Constraint | Tends to produce |
|---|---|---|
| C1 | Minimize the interface: 1–3 entry points, maximum behaviour per entry point | Deep module, strong hiding |
| C2 | Optimize for the most common caller: the default case needs zero options | Good defaults, narrow API |
| C3 | Maximize flexibility for the next two likely changes named in the spec or roadmap | Extension points (check the simplicity rule) |
| C4 | Ports and adapters for every cross-seam dependency | Testable seams, more adapters |
| C5 | Do less: smallest change to existing modules that satisfies every AC | Reuse, no new module |
| C6 | Operational simplicity: fewest moving parts in production (deployables, queues, stores) | Fewer runtime components |

Default sets: two designs → C1 + C5. Three designs → C1 + C2 + C5. Add C4 when a remote-owned or external dependency sits behind the seam. Add C6 when the spec has an availability or latency target.

## 4. Procedure

1. **Frame the problem space** (5–15 lines, shown to the human before designers start): the AC served, the constraints any design must satisfy (numbers from the spec: limits, latency, volume), the dependencies with their category (`deep-modules.md` §7), the code map modules touched, and a rough illustrative sketch labelled "not a proposal".
2. **Dispatch one designer per constraint**, each in a fresh context, with `../prompts/alternative-designer.md`. Each receives the frame, the code excerpts, the vocabulary from `deep-modules.md` §1 and the project glossary terms, and only its own constraint. Designers never see each other's output.
   - **No subagents on the platform:** write designs sequentially. Before each one, finish and save the previous design, clear working notes, re-read only the frame and the next constraint. Label the set `sequential — single context`.
3. **Normalize** each returned design into the same shape: interface (types, invariants, ordering, error modes), usage example (≤ 10 lines from the most common caller), what is hidden, dependency strategy and adapters, trade-offs, effect on the AC.
4. **Compare** with the table in §5. Fill every cell; "n/a" needs a reason.
5. **Choose** with the rules in §6 and write the recommendation.
6. **Record**: the comparison table and the recommendation become the ADR `Options considered` and `Decision` sections (`adr.md`). On a two-way door, keep one line in the plan `## Goal and architecture` paragraph instead.

## 5. Comparison table

| Criterion | Design A (C1) | Design B (C5) | Design C (C2) |
|---|---|---|---|
| Interface size (entry points · parameters · error modes) | | | |
| What is hidden | | | |
| Depth verdict (deep / medium / shallow) and deletion test | | | |
| Locality: modules changed by the most likely next change | | | |
| Seam placement and adapters (count real adapters) | | | |
| AC coverage (each AC-n: met / partly / not) | | | |
| Constraints (CONSTRAINTS.md, spec limits): met / at risk | | | |
| Reversibility: one-way or two-way door; cost to back out | | | |
| Operational load (deployables, stores, queues added) | | | |
| Security boundary changes (new TB-n or DF-n) | | | |
| Files touched (count) and path bound | | | |
| Main risk and how it would show up | | | |

## 6. Choosing

- **Pick, do not present a menu.** End with one recommendation, or a named hybrid ("A's interface with B's storage"), and the two strongest reasons tied to cells in the table.
- **Tie-breakers, in order:** satisfies every AC → keeps every constraint → two-way door over one-way door → fewer files and deployables → deeper interface.
- **A design that fails an AC or a constraint is out** unless the fix is a spec revision; then route to the Analyst (change protocol), do not choose it.
- **Name what was given up.** One sentence per rejected design: "Rejected because …" tied to a table cell.
- **Product trade-off found** (for example cost vs latency where the spec states neither): status `BLOCKED`, route to the Product Owner with the two options and their consequences.

## 7. Mini-example

Spec: "Analysts download invoices for a month as one file; up to 200,000 invoices; p95 time to first byte ≤ 2 s (AC-3)."

| Criterion | A (C1) streaming endpoint | B (C5) reuse nightly report job | C (C6) background job + download link |
|---|---|---|---|
| Interface | `GET /invoices/export?month` → stream | Existing `reports.generate(month)` + email | `POST /exports` → 202 + `GET /exports/{id}` |
| Hidden | Paging, serialization | Nothing new | Queue, storage, expiry |
| AC-3 (≤ 2 s to first byte) | met | not met (next day) | met (202 immediately) |
| Reversibility | two-way (new route, flag) | two-way | one-way-ish: new store and retention rule |
| Operational load | 0 new | 0 new | +1 queue, +1 bucket, retention job |
| Main risk | long request on 200,000 rows | fails AC-3 | file retention of financial data |

Recommendation: A, because it meets AC-3 with zero new runtime components and is reversible by flag; C is the fallback if streaming exceeds the gateway's 60 s timeout in staging (owner: Tech Lead, measured before rollout). B rejected because it fails AC-3. Three options were seriously compared, so the contract trigger applies (`../../agentic-sdlc/references/artifacts.md` §ADR): write one ADR, status `Proposed`, with this table as `Options considered` and "two-way door" in Consequences. Had only A been considered because the route is new and behind a flag, the plan would record `ADRs: none — <reason>` instead, as the worked example does.
