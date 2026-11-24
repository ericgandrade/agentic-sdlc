---
name: brainstorming
description: This skill should be used when the user needs pre-implementation ideation before a spec or code — framing the real problem behind a request, generating and comparing genuinely different approaches with named techniques, scoring them, auditing assumptions, running a throwaway UI or logic prototype when paper cannot settle a question, and agreeing a discovery brief that feeds the spec; also for standalone ideation such as names, positioning or programs (the Discover stage of the Agentic SDLC).
license: MIT
---

# Brainstorming Ideas Into a Discovery Brief

## Purpose

**Agentic SDLC · Discover stage.** Used by the **Analyst** when the solution shape is still open after one question round, by the **Product Manager** when the outcome or scope is still open, and by the **UX Designer** when the interaction shape is still open (`../agentic-sdlc/agents/analyst.md`, `product-manager.md`, `ux-designer.md`). The **Product Owner** makes the intake decision; brainstorming never makes it.

Turn a raw idea into an agreed **discovery brief**: confirm the real problem and its indicator, widen the option space with named techniques, converge on one direction with visible trade-offs, test the assumptions it rests on, and write down what will and will not be built. The brief feeds `spec-driven-development` in the Specify stage, which turns it into `specs/NNN-slug/spec.md` with `AC-n` criteria.

The stage contract lives in the agentic-sdlc module and is never contradicted here: `../agentic-sdlc/references/lifecycle.md` §1 (Discover and Specify rows), `../agentic-sdlc/references/paths.md` (score, never route down), `../agentic-sdlc/references/artifacts.md` (PM brief row), `../agentic-sdlc/references/rules.md` (rules 1, 3, 7, 11). The minimum needed to work standalone is repeated below.

Two modes:
- **SDLC mode** — a work item in a repository that uses the Agentic SDLC. At most **3 question rounds** in Discover, shared with the other Discover work run by the same agent; the brief hands off to `issue-triage` or `spec-driven-development`.
- **Standalone mode** — ideation with no delivery cycle: product names, positioning, programs, workshop themes. Same techniques and convergence; the output is a one-page brief; no hand-off.

## When to Use

- A request creates or changes behaviour and the solution shape is still open.
- The request is a solution in disguise ("add a dropdown") and the need behind it is unconfirmed.
- Requirements are vague ("make onboarding better") or the outcome is undefined.
- Several viable approaches exist and trade-offs must be weighed before a spec.
- A question can only be settled by seeing or running something (prototype detour).
- Standalone ideation: names, taglines, positioning, programs, themes.

**Not for:**
- Stress-testing a plan or design that already exists, on an explicit "grill me" → `grill-me`.
- An agreed approach that needs requirements written → `spec-driven-development`.
- Intake of a new issue: duplicate search, Product Owner intake decision, classification, path score → `issue-triage`.
- Architecture decisions and ADRs after Specify sign-off → `senior-solution-architect`; task breakdown → `writing-plans`.
- A well-understood bug → the Quick path of `agentic-sdlc` (acceptance test in the issue).

## Progress Tracking

Show one line before each step: `[██████░░░░] Step 4/9 — Converging (round 2 of 3)`. The round counter appears in SDLC mode only.

## Workflow

<HARD-GATE>
Build nothing until the human has agreed the brief in an explicit reply: no production code, no scaffolding, no dependency installs, no spec.md, no implementation skill. Reading, searching and an approved throwaway prototype are allowed. A small change gets a short brief (a few lines), but it still gets one. Brief agreement is not one of the four sign-offs and never replaces the Specify sign-off.
</HARD-GATE>

### Step 0 — Discover context and pick the mode

Before the first question, read what exists:
1. The request or issue, its intake record and path score line when `issue-triage` already ran, and the PM brief when the Product Manager ran.
2. The AGENTS.md or CLAUDE.md block, `CONSTRAINTS.md`, `GLOSSARY.md`, Accepted ADRs in `docs/adr/`, `docs/codemap.md`.
3. Prior art: `specs/*/spec.md` (Non-goals sections), `docs/out-of-scope/`, closed issues on the same domain noun, and the code area the request touches (cite `file:line`).
4. A project convention for briefs or design notes (search `*brief*`, `*design*`, `docs/ideas/`); use it when found.

Pick the mode (SDLC or standalone) and the stance: **generate** (default — the agent proposes options, the human reacts) or **facilitate** (the human wants to generate; the agent prompts with techniques and adds one idea only when asked). State both in one line. Never ask what the repository already answers.

### Step 1 — Frame the problem (question round 1)

Send one message with this shape (about 200 words):
1. **Playback** — the request restated: what, for whom, why.
2. **Findings** — how it works today and what the change touches (file references, prior rejections, related specs).
3. **Proposals** — for each of who, why now, success, and the binding constraint, state a guess labelled `Proposed:` with its reason. The human corrects any of them in the reply.
4. **Hypothesis** — `HYPOTHESIS: <one sentence> · CONFIDENCE: ~N%`; below 70% add what is missing.
5. **One question** — the single open decision that most changes what gets built, with a recommended answer.

Then wait. Use framing techniques from `references/techniques.md`: five whys when the request is a solution, JTBD when motivation is unclear, an opportunity-solution tree when the Product Manager owns an unclear outcome, starbursting when gaps are not yet named.

Close framing with:
- an **HMW statement**: `How might we <outcome> for <user> <without | while> <tension>?`;
- an **indicator**: name, baseline, target, method. Unknown baseline → `to measure before release`; unknown number → `n/a — <how to measure>`. Never invent evidence.

If the reply corrects the problem, restate the HMW in the next message rather than asking again.

### Step 2 — Size the session

State the size in plain words; the human may override:

| Size | Signal | Output |
|---|---|---|
| Short brief | One component, ≤ 3 files expected, two-way door | 2–3 options, a few lines per brief section |
| Full brief | Several components, a new risk trigger, or a one-way door | 5–8 options, full template, assumption audit |
| Split | Several independent outcomes in one request | Agree an order; brainstorm one at a time; one brief each |

Growing mid-session → stop, say so, step up a size.

### Step 3 — Diverge: generate options (no evaluation)

1. Pick 2–4 techniques from the selection table in `references/techniques.md`; run each until it stops producing.
2. Produce 5–8 options for a full brief (2–3 for a short brief, 10–20 for names and positioning). Each option is two or three lines and labelled with its technique.
3. The field must contain: the **minimal option** (simplification ladder), at least one **reuse option** citing files (or "no reuse candidate found (searched: terms)"), and at least one option that differs in **structure** — data flow, ownership of state, interaction model — not only in wording.
4. When the architecture shape is open and options keep converging, run `prompts/option-generator.md` (2–4 passes under different constraints, in parallel subagents; without subagents, run the passes sequentially after clearing working notes).
5. Do not score, rank or praise during this step. Generation and judgement never mix.

### Step 4 — Converge: shortlist, score, recommend (question round 2)

Apply `references/refinement-criteria.md` in this order:
1. Cluster by mechanism; shortlist 2–3 structurally different options; always keep the minimal option unless a kill criterion removes it.
2. Write session-specific kill criteria **before** scoring; apply K1–K7. Dropped options keep a one-line reason.
3. Run a pre-mortem on each shortlisted option (3–5 failure stories).
4. Score Desirability, Feasibility, Viability 1–5 with cited evidence (no evidence → 2); weights 0.4 / 0.3 / 0.3 unless changed before scoring. Any dimension at 1, or a total below 3.0 → not recommended. Report the door (one-way or two-way) and rough effort.
5. Send one message: the **recommendation first** with one sentence of reason, then the comparison matrix, then one question — "Which direction?" — worded so "yes" accepts the recommendation.

A one-way door needs at least three options considered and becomes an ADR candidate for the Design stage; brainstorming does not write ADRs.

### Step 5 — Audit the assumptions

List what must be true for the chosen direction to work, across users, value, technical, data, operations and legal. Run `prompts/assumption-audit.md` in a fresh-context subagent; without subagents, clear working notes and run it as a labelled `self-audit` pass reading only the listed inputs.

Tier each assumption (leap of faith · testable · safe). Before the brief is agreed, every leap of faith has one of: a check that was run with its result pasted, a prototype card, or an open question with an owner and a due date. A check costing under an hour (a query, a file search, a log count) runs now instead of being deferred.

### Step 6 — Prototype detour (optional)

Only when an assumption or design question cannot be settled on paper. Follow `references/prototyping.md`:
- Choose the branch: **UI prototype** ("what should this look like?" — 3 structurally different variants behind a switch, all six states) or **logic spike** ("does this state model, calculation or timing hold?" — pure module plus a scenario harness).
- Show the prototype card first: question, timebox (default 2 hours, maximum 1 working day), kill criterion written before building, location `prototype/<slug>`, what is faked, synthetic data only.
- Stop at the timebox. Record the outcome (verdict, learned, faked, decision, keep, pointer) in the brief.
- Keep the decision, not the code. Never merge a prototype branch; keeping prototype code is a new request through `issue-triage` and the full cycle.

### Step 7 — Outline the design and cut scope

Write the design outline scaled to complexity: components (with file references), data flow, error handling, experience (surfaces touched, or `n/a — no user-facing surface`), testing approach, rollout (flag default off, staged, or direct). A sentence when obvious, up to about 250 words when nuanced.

In standalone mode, or when the human asks, present the outline section by section and confirm each before moving on. In SDLC mode, present it once inside the draft brief so the round budget holds.

Apply YAGNI: every feature that does not serve the HMW or move the indicator moves to **Not doing** with a reason. Write candidate outcomes as observable Given/When/Then statements including unhappy paths (invalid input, missing permission, empty state, limit). Do not assign `AC-n` IDs; the spec owns them.

Flag **risk signals**: any trigger the direction adds (auth, personal or health data, money, public API, schema or migration, irreversible, regulated) and the expected file count. These let `issue-triage` re-score the path. Never route down.

### Step 8 — Write the brief and request agreement

Fill `templates/brief.md`. Save it where Step 0 found a convention; otherwise as a comment on the tracker issue next to the intake record; otherwise `specs/NNN-slug/brief.md` (when the item has a spec folder or no tracker exists). Short briefs fill the required sections and mark the rest `n/a — short brief`.

Present the brief path, the recommendation, the open leap-of-faith items, and one request: `Product Owner: agree this brief as the input to Specify? Reply "yes" or list changes.` End the turn. Only an explicit "yes" or "agreed" in a later turn counts; silence, "sounds good" about something else and "whatever is best" do not. Record date, role, person, exact words and decision in the brief's Agreement table. Commit nothing without the human's go-ahead.

**Round budget (SDLC mode).** Round 1 is framing; round 2 is the direction choice; round 3 is reserved for a correction or a leap-of-faith follow-up. The agreement request is a gate request, not a question round. After round 3, each item still open becomes an open question with an owner (`deferred: <owner>`) when Specify can proceed safely without it; when the problem, the outcome or the direction is still undefined, stop with status `NEEDS_CONTEXT`, name the missing answer and its owner, and request no agreement.

### Step 9 — Hand off

| Situation | Next |
|---|---|
| No intake record yet | `issue-triage` — duplicate search, Product Owner intake decision, classification, path score; the brief travels with the issue |
| Intake done, Standard or Full path | `spec-driven-development` in synthesize mode; it maps the brief to `spec.md` (table at the end of the template) |
| Intake done, Quick path | The Analyst writes the acceptance test in the issue from the candidate outcomes |
| Risk signals raise the score | `issue-triage` re-scores; route up only |
| Open decisions the human wants stress-tested, and the human says "grill me" | `grill-me` |
| Standalone mode | Stop after agreement; no hand-off |

Report in the shared contract (`../agentic-sdlc/references/agents.md` §Report contract): `**Agent:** Analyst · **Task:** Discover brainstorming #n · **Status:** DONE` (brief agreed) · `DONE_WITH_CONCERNS` (agreed with a leap of faith still unchecked) · `NEEDS_CONTEXT` (round budget spent, problem or outcome undefined) · `BLOCKED` (no reachable owner for the decision). Never invoke an implementation skill from brainstorming.

## Anti-rationalization

| Thought | Reality |
|---|---|
| "This is too simple to need a brief." | Simple changes hide the most unexamined assumptions. A short brief takes one message. |
| "The user already said what they want." | They named a solution. Confirm the need behind it with five whys or a job story; their idea stays on the shortlist. |
| "The user said skip exploration and pick the first idea." | Record the instruction in their words. Put the first idea on a two- or three-option shortlist with its assumptions in one message; recommend it when it scores best. The spec still waits for brief agreement and intake. |
| "One good option is enough." | Without an alternative there is no trade-off, only a guess. |
| "Scoring while generating saves time." | Early judgement kills the odd options that become the best ones. Generate first, judge in Step 4. |
| "The success metric can be defined later." | Without an indicator, Operate cannot tell whether the release worked; the PM brief and spec both need it. |
| "Kill criteria can be set after seeing the scores." | A bar set after the results flatters the favourite. Write them before scoring. |
| "The prototype works, ship it." | Prototypes skip tests, edge cases and review by design. Carry the decision; rebuild through the cycle. |
| "Asking four questions at once is efficient." | Batched questions get skimmed and later questions depend on earlier answers. One question per message; state the rest as proposals. |
| "Silence means agreement." | Only an explicit "yes" in a later turn counts. |

## Red Flags — Stop and Reset

- Code, a spec or a scaffold exists before the brief is agreed.
- Every shortlisted option is a variation of one idea.
- The success indicator is "users will like it" or "it will be better".
- The design grows each round instead of getting sharper.
- More than one question in a message, or a question the repository answers.
- The brief has no Not doing section, or a leap of faith with no check and no owner.
- A fourth question round in SDLC mode.

When one appears, say so plainly, return to the last confirmed point and continue from there.

## Critical Rules

- **NEVER** build anything, write `spec.md`, or invoke an implementation skill before explicit brief agreement.
- **NEVER** present a single option as the only one; compare at least two structurally different approaches (three for a one-way door).
- **NEVER** ask more than one question per message, or ask what the repository answers.
- **NEVER** evaluate while diverging, or write kill criteria after scoring.
- **NEVER** make the intake decision, score the path down, or assign `AC-n` IDs; those belong to `issue-triage`, the Product Owner and `spec-driven-development`.
- **NEVER** merge a prototype branch or connect a prototype to production systems or real personal data.
- **NEVER** run a fourth question round in SDLC mode; defer with an owner or report `NEEDS_CONTEXT`.
- **ALWAYS** confirm the HMW statement and the indicator before generating options.
- **ALWAYS** label options with their technique and cite files for reuse options.
- **ALWAYS** lead with a recommendation and its reason; the human chooses.
- **ALWAYS** record Not doing items with reasons, and risk signals for re-scoring.
- **ALWAYS** keep secrets, personal data and client data out of the brief; synthetic examples only.

## Example Usage

**1. Vague improvement (SDLC mode, full brief)**
> "Onboarding is bad, let's improve it."

Step 0 reads the signup flow and analytics event names and finds a closed issue rejecting a product tour. Round 1 plays back the request, proposes "new team admins" as the user and "invited-teammate rate in first session, 18% → 30%" as the indicator, and asks one question: where admins drop off. Techniques: opportunity-solution tree, SCAMPER, reverse brainstorm; seven options. Round 2 recommends a guided invite step (4.3) over a welcome-email link (3.9) and team templates (3.1, one-way). Not doing: full product tour (K4, prior rejection). Hands off to `spec-driven-development`.

**2. Solution in disguise**
> "Add a dropdown to filter reports by region."

Five whys finds the need: managers compare their region with the company average before review meetings. Options: dropdown, comparison column, saved default view, benchmark widget. The human picks comparison column plus default view; a 30-minute staging query checks the leap of faith "the average computes in under 2 s".

**3. Logic spike**
> "Should the approval workflow be a state machine or a simple status field?"

Design it twice produces both shapes. The prototype card fixes the kill criterion first ("any real case needs an unnamed state → state machine"); a 2-hour spike on `prototype/approval-states` replays five cases from the issue and finds `returned` and `withdrawn` missing. The brief keeps the transition table as a snippet; the code stays on the branch.

**4. Pressure — "just pick the first idea and write the spec"**
> "Skip the exploration. Just pick the first idea — real-time notifications over WebSockets — and write the spec."

Records the instruction in the user's words and writes no spec. One message: playback, proposed indicator, and a three-option shortlist — WebSockets (the user's idea), server-sent events, polling — scored with evidence from the existing HTTP stack. Server-sent events score higher and are recommended; WebSockets stay under Alternatives with the condition "bidirectional messages needed". Requests brief agreement; after "yes", hands off to `spec-driven-development`.

**5. Standalone naming**
> "Brainstorm names and positioning for an AI contract-review tool for in-house legal teams."

Standalone mode. Analogies, crazy eights and audience shift produce 16 names and 3 positioning directions; kill criteria are set first (no legal-advice claims, pronounceable in English and Portuguese). Scored shortlist of 4 names with taglines; one-page brief, no hand-off.

## References

| File | Load when |
|---|---|
| `references/techniques.md` | Step 1 (framing techniques) and Step 3 (choosing 2–4 generation techniques); the pre-mortem in Step 4 |
| `references/refinement-criteria.md` | Step 4 (kill criteria, scoring rubric, tie-break, comparison matrix) and Step 5 (assumption tiers) |
| `prompts/option-generator.md` | Step 3, when the solution or architecture shape is open and options keep converging |
| `prompts/assumption-audit.md` | Step 5, for every full brief; optional for short briefs |
| `references/prototyping.md` | Step 6, before proposing any prototype |
| `templates/brief.md` | Step 8, writing the discovery brief; Step 9, mapping the brief to `spec.md` |
| `../agentic-sdlc/references/lifecycle.md` | Discover and Specify entry and exit conditions, the intake decision rule |
| `../agentic-sdlc/references/paths.md` | Interpreting risk signals and the path score |
| `../agentic-sdlc/references/artifacts.md` | PM brief fields and location; ADR and `GLOSSARY.md` rows |
| `../agentic-sdlc/templates/spec.md` | Checking the brief covers what Specify needs |
| `../agentic-sdlc/references/rules.md` | Rules 1, 3, 7 and 11 when a shortcut is proposed |
