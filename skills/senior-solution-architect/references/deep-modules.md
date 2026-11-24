# Deep Modules — Vocabulary, Tests and Smells

Load at Workflow Step 3 (shape modules and interfaces), when comparing designs in Step 2, and in Assess mode when judging whether an existing module earns its keep. Other skills may point here for the shared vocabulary (`writing-plans`, `test-driven-development`, `multi-axis-code-review`, `codebase-modernization`).

The idea of deep modules and information hiding comes from John Ousterhout, *A Philosophy of Software Design*; the precise vocabulary and the deletion test below follow Matt Pocock's `codebase-design` skill (MIT). Wording here is original.

## 1. Vocabulary (use these words, not synonyms)

Design conversations drift when one person says "component", another "service" and a third "layer" for the same thing. Use exactly these terms in architecture notes, ADRs and interface notes.

| Term | Meaning | Avoid |
|---|---|---|
| **Module** | Anything with an interface and an implementation, at any scale: a function, a class, a package, a deployed service | unit, component, service (as a generic word) |
| **Interface** | Everything a caller must know to use the module correctly: types **plus** invariants, ordering constraints, error modes, required configuration, performance envelope | API, signature (too narrow) |
| **Implementation** | The body behind the interface; what callers must not need to know | — |
| **Depth** | Behaviour a caller gets per unit of interface learned. Deep = a lot of behaviour behind a small interface. Shallow = the interface is nearly as complex as what it hides | "thin", "clean" |
| **Seam** | The place where behaviour can be changed without editing the code there; where an interface lives. Placing a seam is a decision in its own right | boundary (overloaded by DDD) |
| **Adapter** | A concrete thing that satisfies an interface at a seam (HTTP client, in-memory fake). A role, not a kind of module | wrapper |
| **Leverage** | What callers gain from depth: less to learn, fewer ways to misuse | "easier to use" |
| **Locality** | What maintainers gain from depth: change, bugs and verification concentrate in one place | "easier to maintain" |

Relationships: a module has exactly one interface; depth is measured against that interface; the interface lives at a seam; adapters sit at seams; depth produces leverage for callers and locality for maintainers.

**Rejected framings.** Depth is not the ratio of implementation lines to interface lines (that rewards padding). The interface is not the `interface` keyword of a language. "Cleaner code" and "easier to maintain" are not benefits; name the leverage or locality gained.

C4 diagrams keep their own notation words (container, component) because readers of C4 expect them; the prose around a diagram still uses the vocabulary above.

## 2. Information hiding

A module is deep when it hides a **design decision likely to change**: a file format, a retry policy, a storage engine, an escaping rule, a pagination scheme. List what each candidate module hides before drawing its interface.

| Question | Deep answer | Shallow answer |
|---|---|---|
| What decision does this module hide? | "How CSV cells are escaped and quoted" | "Nothing; it forwards the call" |
| If that decision changes, how many modules change? | 1 | Several callers too |
| Does the interface expose the hidden decision? | No: callers pass rows, get lines | Yes: callers pass an `escapeMode` flag |
| Can a caller misuse it? | Only by passing wrong data | By calling methods in the wrong order, forgetting a flush, mixing configs |

**Information leakage** is the opposite: the same decision is visible in two modules, so both change together. Typical signs: two modules parse the same format; a caller must know an internal limit to call correctly; a "config" object mirrors private fields.

## 3. Interface cost versus functionality

Every element of an interface is a cost paid by every caller: each parameter, each method, each error mode, each ordering rule, each configuration key. Judge a design by the functionality it delivers against that cost.

Reduce the cost with these moves, in this order:

1. **Fewer entry points.** Can 4 methods become 1 that covers the common case?
2. **Defaults for the common case.** The most frequent caller passes nothing optional.
3. **Define errors out of existence.** Make the operation valid for inputs that would otherwise raise (deleting a missing key succeeds; an empty filter returns the header row only).
4. **Pull complexity down.** When the module or its callers must handle a case, the module handles it once.
5. **Hide more.** Move a decision from the interface into the implementation.

Stop when the next removal would push a real decision onto every caller.

## 4. The deletion test

Imagine deleting the module and inlining its code into its callers.

- Complexity **vanishes** (callers get simpler or stay the same) → the module was a pass-through; remove it or merge it.
- Complexity **reappears in N callers** (duplicated logic, repeated error handling) → the module earns its keep.
- In review, ask: "Would deleting it concentrate complexity, or only move it?" "It concentrates" is the signal to deepen, not to delete.

## 5. Smells catalog

| Smell | Detection | Fix |
|---|---|---|
| **Pass-through method** | A method whose body only calls another method with the same or near-same parameters | Delete the layer, or give it a real decision to hide |
| **Pass-through variable** | A value threaded through 3+ signatures only to reach one deep callee | Context object owned by the module that needs it, or move the decision |
| **Shallow wrapper** | A class around a library that renames its methods 1:1 | Call the library directly, or wrap it with an interface shaped by the callers' needs |
| **Classitis** | Many tiny classes; understanding one concept means opening 5+ files | Merge into one deeper module |
| **Temporal coupling** | Callers must call `init()` before `run()` and `close()` after | One operation, or a scoped helper that does all three |
| **Speculative seam** | A port or interface with one adapter and one caller | Remove until a second real adapter or caller exists |
| **Testing past the interface** | Tests reach private state or mock internal collaborators | Test through the interface; if impossible, the module has the wrong shape |
| **Config explosion** | A flag for each caller's variant | Optimize for the common caller; separate module for the rare one |

## 6. Seam discipline

1. **The interface is the test surface.** Callers and tests cross the same seam. Wanting to test past it means the module is the wrong shape.
2. **One adapter is a hypothetical seam; two adapters make it real.** Production plus an in-memory test adapter counts as two. Without two justified adapters, do not add a port.
3. **Internal seams stay internal.** A deep module may be built from small parts with their own tests; those parts are not exposed through the external interface.
4. **Simplicity rule (Architect contract).** No abstraction without at least 2 current call sites (`../../agentic-sdlc/agents/architect.md` Procedure step 2). An abstraction here means an indirection: a port, a base class, a generic helper, a plug-in point.

## 7. Dependency categories

Classify each dependency of a candidate module; the category decides the seam and the test double.

| Category | Example | Seam | Test with |
|---|---|---|---|
| In-process | Pure computation, in-memory maps | None needed | The real code |
| Local-substitutable | PostgreSQL (local container or embedded engine), filesystem | Internal | A local stand-in in the test suite |
| Remote but owned | Another team's service over HTTP or a queue | Port at the seam | In-memory adapter in tests, HTTP adapter in production |
| True external | Payment provider, SMS gateway, model API | Injected port | Mock adapter; contract tests against the provider sandbox |

Mock only at process boundaries. The worked example follows this: the permission test uses the seeded test database, never a mock of `UserRepository`, and the web client mocks only `fetch` (`../../agentic-sdlc/examples/worked-example/specs/001-csv-export/plan.md` T2, T5).

## 8. Worked mini-examples

**Deep (keep).** `toCsvLines(rows: Iterable<OrderRow>): Generator<string>` in the worked example hides header order, ISO date formatting, 2-decimal totals, formula-prefix escaping and RFC 4180 quoting behind one function with one parameter. Deletion test: inlining it would spread five rules across the route and any future export. Depth confirmed.

**Shallow (remove).** A proposed `ExportService.export(filters)` whose body is `return toCsvLines(repo.query(filters))`. It hides no decision, adds a class and a constructor dependency, and the route would call it from one place. Deletion test: complexity vanishes. Recommendation: the route calls `buildOrdersQuery` and `toCsvLines` directly.

**Wrong seam.** A `CsvWriter` interface "so it can be swapped for Excel later" with one adapter. Speculative seam: one adapter, no second caller, no spec requirement for Excel. Record nothing; add it when an AC asks for a second format.

**Port that earns its place.** A billing module calls an owned pricing service over HTTP. A `PriceQuote` port with an HTTP adapter (production) and an in-memory adapter (tests) has two real adapters; the pricing logic stays in one deep module even though it is deployed across a network.
