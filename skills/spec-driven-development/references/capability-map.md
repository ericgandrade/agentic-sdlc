# Capability map for epics

Load this file when the scope check (Step 2) finds an epic — more than one independent subsystem, more than 5 stories, more than 15 active ACs, or a Discover classification of `epic` — and before writing any spec for it.

An epic is never one spec. It is a **capability map**: a short table that splits the epic into modules, orders them by dependency, and assigns one spec per module. Each module spec is then scored, specified, signed off and built on its own path (`../../agentic-sdlc/references/lifecycle.md` § 3).

## 1. When to build a map

| Signal | Threshold |
|---|---|
| Discover classified the item as `epic` | always |
| Independent subsystems (each could ship and be rolled back alone) | ≥ 2 |
| Stories in one draft | > 5 |
| Active ACs in one draft | > 15 |
| Teams or owners | ≥ 2 owners for different parts |
| Word budget | the draft is near the path budget (1,500 Standard, 3,000 Full) |

One signal → propose the map to the Product Owner. Two or more → build it before drafting.

## 2. Map format

Write the map in the epic issue body (or in the Product Manager brief when one exists). The module artifact list (`../../agentic-sdlc/references/artifacts.md`) defines no separate file for it.

| Module | Responsibility | Consumers | Data owned | Depends on | Spec | Path |
|---|---|---|---|---|---|---|
| `export-request` | Accept and rate-limit a holder's export request; audit it | Privacy settings UI | export requests | `audit-log` | 052-account-data-export | Full |
| `export-worker` | Build the archive from data map v3 | `export-request` | archives (7-day) | `data-map` | 054-export-worker | Full |
| `archive-delivery` | Email link, owner-only download, expiry | holder | download tokens | `export-worker` | 055-archive-delivery | Full |
| `support-status` | Status-only view for support | support console | none | `export-request` | 056-support-export-status | Standard |

Column rules:

- **Module** — stable kebab-case ID; never renamed once a spec cites it.
- **Responsibility** — one sentence, one verb phrase. Two verbs joined by "and" that could ship separately → two modules.
- **Consumers** — who calls or reads it: a user role, a UI surface or another module.
- **Data owned** — the data this module is the only writer of. Every data element has exactly one owner.
- **Depends on** — modules it calls. Dependencies point one way; a cycle means a module boundary is wrong — merge the two modules or extract the shared part.
- **Spec** — `NNN-slug` once created; `pending` before.
- **Path** — scored per module with `../../agentic-sdlc/references/paths.md` § 2 Score. Modules of one epic may sit on different paths.

## 3. Slicing rules

1. **Vertical over horizontal.** A module delivers an observable outcome to a consumer. "Database layer", "API layer", "UI layer" are not modules; "request an export" is.
2. **Thinnest useful first.** The first spec in build order delivers the smallest end-to-end slice a user can see, even with limits (one data domain, one format), so the indicator can start reading.
3. **Interfaces live with the provider.** The module that offers an API, event or file format states it in its spec (Constraints or an AC); consumer specs cite it as `<spec ID>#AC-n` instead of restating it.
4. **One sign-off per spec.** Each module spec has its own `## Approvals`, hash and revision log. A change to a provider's interface AC voids the provider spec's approval; consumer specs that cite it re-run their critique (checklist item 12) in the same change.
5. **Build order = dependency order.** Providers before consumers. Two modules with no dependency between them may be specified and built in parallel.
6. **Shared rules once.** Cross-cutting constraints (region, data classes, dependency policy) go into `CONSTRAINTS.md` on Full projects or the first spec; later specs cite them.
7. **Non-goals carry the rest.** Each module spec lists the sibling modules under Non-goals ("Archive delivery — spec 055"), so no spec silently grows into the next.

## 4. Story slicing inside one module

When a single module still holds more than 5 stories, slice the stories before writing ACs:

| Slice by | Example |
|---|---|
| Workflow step | request → build → deliver → expire |
| User role | holder first, support view later |
| Data variation | profile + orders first, support tickets later |
| Business rule | one region's rule first, others later |
| Happy path first | success + critical negatives now, rare edge cases next revision |
| Interface | API first, UI after |

Each slice that moves out becomes a Non-goal line with the target spec ID, or a new Discover item.

## 5. Procedure

1. **Draft the map** from the brief: list nouns (data) and verbs (capabilities); group by data ownership.
2. **Check it:** every story maps to exactly one module; every data element has one owner; no dependency cycle; every module has a consumer.
3. **Present it to the Product Owner** with the proposed build order and the first spec to write. Ask one question: "Approve this split and order, or change it?" End the turn. The answer is recorded in the epic issue; it is a scope confirmation, not one of the four sign-offs, and it binds no hash.
4. **Write the first module spec** with the full workflow (Steps 3–7). Other modules stay `pending` until their turn.
5. **Update the map** when a module spec changes its interface or splits; the map is the epic's table of contents, not a contract.

## 6. Signals the map is wrong

| Signal | Fix |
|---|---|
| Two specs both write the same data | Move ownership to one module; the other calls it |
| A consumer spec restates the provider's rules | Replace with `<spec ID>#AC-n` citations |
| Module specs keep revising each other | The boundary cuts through one capability — merge them |
| A module has no observable outcome | It is a task inside another module's plan, not a module |
| The first spec cannot release without all others | The first slice is not thin enough — cut scope until it can ship behind a flag |
