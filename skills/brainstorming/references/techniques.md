# Ideation Techniques Catalog

Load this file in Step 1 (framing) and Step 3 (diverge) of `SKILL.md` to pick techniques deliberately. Use 2–4 techniques per session, chosen from the selection table; never run the whole catalog. Run each technique until it stops producing new options, then switch. Label every option with the technique that produced it, so the convergence step can see where the field is thin.

## Selection table

| Situation | Start with | Add when the field is thin |
|---|---|---|
| The request is a solution in disguise ("add a dropdown") | Five whys → HMW | JTBD |
| The outcome itself is unclear (Product Manager framing) | Opportunity-solution tree | JTBD, five whys |
| Improving an existing feature or product | SCAMPER | Build vs reuse scan, simplification ladder |
| Greenfield capability, few precedents in the codebase | Analogies | Constraint removal, crazy eights |
| Options all look alike | Reverse brainstorm | Audience shift, constraint removal |
| A favoured direction feels risky or one-way | Pre-mortem | Reverse brainstorm |
| Architecture shape still open (Analyst) | Design it twice (`../prompts/option-generator.md`) | Build vs reuse scan |
| Interaction shape still open (UX Designer) | Crazy eights | Analogies, audience shift |
| Names, taglines, positioning (standalone mode) | Crazy eights | Analogies, audience shift, SCAMPER |
| Framing questions still missing | Starbursting | Five whys |

Framing techniques (HMW, JTBD, five whys, starbursting, opportunity-solution tree) run in Step 1. Generation techniques run in Step 3. The pre-mortem runs on the shortlist in Step 4, never on raw ideas.

---

## 1. How Might We (HMW)

**When:** Always, at the end of framing. The HMW statement is the target every option must serve.
**How:** Write `How might we <outcome> for <user> <without | while> <tension or constraint>?` Check the size: too broad ("improve onboarding") gives no direction; too narrow ("add a tooltip to step 2") embeds the solution; a good statement contains a tension.
**Output:** One sentence confirmed by the human.
**Watch out:** A verb that names a mechanism ("by adding", "using a modal") is a solution; strip it.
**Example:** "How might we get a new team admin to invite one teammate in the first session without adding a mandatory step?"

## 2. Jobs to Be Done (JTBD) job story

**When:** The user group is known but the motivation is not; or two user groups want the same feature for different reasons.
**How:** Write `When <situation>, I want to <motivation>, so I can <expected outcome>.` Write one job story per distinct situation; list the current workaround for each (the real competitor is the workaround).
**Output:** 1–3 job stories plus workarounds; they feed the brief's Users and Stories.
**Watch out:** A job story naming a screen or button is a feature request, not a job.
**Example:** "When I close the month, I want to compare my region against the company average, so I can explain the gap before the review meeting." Workaround: two exports pasted into a spreadsheet.

## 3. Five whys

**When:** The request arrives as a solution, or the stated problem is a symptom.
**How:** Ask "why does that matter?" up to five times, stopping as soon as the answer names a user outcome or a cost. Prefer looking up evidence (tickets, logs, analytics) over asking. Each "why" counts toward the question-round budget only when it is put to the human.
**Output:** The underlying need in one line, and the evidence behind it.
**Watch out:** Stopping at the first plausible answer; drifting into blame ("because the team is slow") instead of mechanism.

## 4. Starbursting (5W1H questions)

**When:** Framing is thin and the gaps are not yet named.
**How:** Generate questions, not answers, under Who, What, When, Where, Why, How. Answer from the repository and tracker first; only the remaining questions that change what gets built go to the human (one round, each with a guess).
**Output:** A short list of open framing questions, most already answered from evidence.
**Watch out:** Sending the whole list to the human. That breaks the round budget and the one-decision-per-question rule.

## 5. Opportunity-solution tree

**When:** The Product Manager owns the outcome, several user problems could move it, and it is unclear which to attack.
**How:** Root = the outcome and its indicator. Level 2 = opportunities (user needs or pains, each with evidence). Level 3 = 2–3 candidate solutions per opportunity. Pick one opportunity first; brainstorm solutions only under it.
**Output:**
```
Outcome: invited-teammate rate in first session 18% → 30%
├── Opportunity: admins do not know inviting is possible (support quotes: 14 in Q3)
│   ├── Invite prompt after first project
│   └── Pre-filled invite link in the welcome email
└── Opportunity: admins fear spamming colleagues
    └── Preview of the invite message before sending
```
**Watch out:** Opportunities without evidence; solutions placed directly under the outcome.

## 6. SCAMPER

**When:** An existing product, flow or component is being improved.
**How:** Run the seven prompts against the current flow: Substitute (a component, a step, a data source), Combine (two steps or two features), Adapt (a pattern from elsewhere in the product), Modify (magnify or shrink a property), Put to another use, Eliminate (remove a step entirely), Reverse or rearrange (change the order or who acts first).
**Output:** One or more options per prompt that produced something; skip prompts that do not.
**Watch out:** Mechanical use; seven weak options are worse than three strong ones.

## 7. Crazy eights

**When:** Interaction design, layouts, names, taglines; any time quantity breaks fixation.
**How:** Produce eight rough variants quickly, each structurally different (layout, information hierarchy, primary action, tone). In text, each variant is one or two lines; for UI, an ASCII sketch of at most five lines.
**Output:** Eight labelled variants; keep the two or three that surprise.
**Watch out:** Eight colour or wording tweaks of one idea. Reject a variant that differs from another only in surface detail.

## 8. Reverse brainstorm

**When:** Options converge on the same idea, or the team is stuck.
**How:** Ask the inverted question: "How could we make this problem worse?" or "How would we guarantee nobody invites a teammate?" List the answers, then invert each into a candidate option.
**Output:** A list of anti-ideas and the option each one becomes.
**Example:** "Hide the invite button three menus deep" → "surface the invite action on the empty project screen".

## 9. Inversion (remove the step)

**When:** A flow has many steps or a feature carries configuration nobody uses.
**How:** For each step or setting, ask what happens if it disappears entirely, or if the opposite default applies.
**Output:** Options that delete work instead of adding it.
**Watch out:** Deleting a step that carries a compliance or security control; check `CONSTRAINTS.md` and the spec's Security notes of related work.

## 10. Constraint removal (and constraint addition)

**When:** Options are timid, or every option is shaped by one assumed limit.
**How:** Name the binding constraints (time, budget, current architecture, team skills, platform). Remove one at a time: "If the current schema could change freely, what would we build?" Then work back to what is reachable. The reverse also works: add a harsh constraint ("must ship in one day", "no new UI") to force simplicity.
**Output:** At least one option per constraint removed or added, each marked with the constraint it relaxed.
**Watch out:** Presenting a constraint-free option as feasible; it is a direction, and the convergence step scores feasibility honestly.

## 11. Analogies

**When:** Greenfield work, names and positioning, or a problem with few precedents in the codebase.
**How:** Name the abstract shape of the problem ("sharing access with someone who has not signed up yet"), list 3–5 other domains or products that solve the same shape, and transfer the mechanism, not the surface.
**Output:** Options annotated with the source domain and the mechanism borrowed.
**Watch out:** Copying a competitor's feature list; the analogy must explain why the mechanism works.

## 12. Simplification ladder (10x simpler, 10x bigger)

**When:** Always worth one pass; mandatory when the first options are large.
**How:** Ask "what is the smallest change that delivers most of the outcome?" and "what would this look like if it had to serve 10 times the users or the scope?" The first gives the minimal option every shortlist should contain; the second exposes scaling assumptions.
**Output:** One minimal option and, when useful, one ambitious option.

## 13. Audience shift

**When:** One user group dominates the thinking; accessibility, admins, support staff or API consumers are forgotten.
**How:** Re-run the HMW for a different actor: a first-time user, a power user, an administrator, a screen-reader user, a support agent, an API client.
**Output:** Options a different audience would need; feeds the UX Designer's journeys.

## 14. Build vs reuse scan

**When:** Inside a repository, always (Step 0 already gathered the material).
**How:** Search the codebase, the dependency list, the platform and existing specs for something that solves part of the problem. Cite files (`src/reports/export.ts:42`). Reuse options include extending an existing component, configuring a platform feature, or adopting a library (a new dependency needs the Design sign-off note in `../../agentic-sdlc/references/rules.md` rule 10).
**Output:** At least one reuse option with file references, or the line "no reuse candidate found (searched: terms)".

## 15. Design it twice

**When:** The Analyst or Architect must compare structurally different technical shapes (polling vs push, state machine vs status field).
**How:** Generate options under deliberately different constraints in separate passes so they do not converge: minimal change, no new infrastructure, best user experience, easiest to reverse. Use `../prompts/option-generator.md`.
**Output:** 2–4 options that differ in structure, each with its constraint label.
**Watch out:** Picking the winner before the comparison; scoring belongs to Step 4.

---

## Session recipes

| Recipe | Sequence | Typical length |
|---|---|---|
| Short brief (small change) | HMW → simplification ladder → build vs reuse | 1 framing round, 2–3 options |
| Feature (Standard path) | Five whys or JTBD → HMW → SCAMPER or analogies → reverse brainstorm → pre-mortem on the shortlist | 5–8 options |
| Outcome framing (Product Manager) | Opportunity-solution tree → JTBD → HMW for the chosen opportunity | 2–3 opportunities, 2–3 solutions each |
| Interaction (UX Designer) | JTBD → crazy eights → audience shift | 8 variants → 3 |
| Naming and positioning (standalone) | Analogies → crazy eights → audience shift → SCAMPER on the best names | 10–20 options |

## Pre-mortem (convergence technique)

Run on each shortlisted option in Step 4, not during generation.

1. State: "It is six months after release and this option failed. The indicator did not move, or something broke."
2. List 3–5 concrete failure stories per option (who, what happened, what it cost).
3. For each story, name the assumption that turned out false and whether it is already in the assumption list.
4. A failure story that would be Critical (data loss, security exposure, irreversible damage) and has no mitigation drops the option or adds a kill criterion.

Output feeds the assumption audit (`../prompts/assumption-audit.md`) and the brief's Alternatives considered.
