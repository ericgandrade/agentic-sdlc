#!/usr/bin/env python3
"""Generate the README figures in docs/assets/ (pure SVG, no dependencies).

Data comes from docs/research/scoring/results.md and the trial report. Re-run after
those change:  python3 docs/assets/make-charts.py
"""
from pathlib import Path
from xml.sax.saxutils import escape

OUT = Path(__file__).resolve().parent
FONT = "-apple-system,Segoe UI,Helvetica,Arial,sans-serif"
BG, CARD, INK, MUTED, RULE = "#edf0f7", "#ffffff", "#141a2a", "#5b6476", "#d5dbe8"
BLUE, BLUE_SOFT = "#1d3fbf", "#dfe5ff"
AMBER, AMBER_SOFT, AMBER_INK = "#c98a1e", "#fff4dd", "#9a5b00"
OTHER = "#b9c2d6"


def t(x, y, s, size=14, fill=INK, weight=400, anchor="start"):
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" font-weight="{weight}" text-anchor="{anchor}">{escape(str(s))}</text>'


def rect(x, y, w, h, fill=CARD, rx=10, stroke="none", sw=1):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


def svg(name, w, h, label, body):
    head = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'font-family="{FONT}" role="img" aria-label="{escape(label)}">'
            f'<defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
            f'<path d="M0 0L10 5L0 10z" fill="{BLUE}"/></marker></defs>'
            + rect(0, 0, w, h, BG, 16))
    (OUT / name).write_text(head + "".join(body) + "</svg>\n", encoding="utf8")
    print("wrote", name)


def arrow(x1, y1, x2, y2, color=BLUE):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2" marker-end="url(#a)"/>'


# 0. Hero ----------------------------------------------------------------------------------
def hero():
    w, h = 1200, 400
    b = [t(w / 2, 78, "The definitive approach to AI-native software engineering.", 32, INK, 700, "middle"),
         t(w / 2, 122, "Agent-driven.  Human-governed.  Evidence-verified.", 22, BLUE, 700, "middle")]
    stats = [("13", "Specialized agents"), ("23", "Integrated skills"), ("7", "Lifecycle stages")]
    cw, gap = 300, 40
    x0 = (w - (3 * cw + 2 * gap)) / 2
    for i, (n, label) in enumerate(stats):
        x = x0 + i * (cw + gap)
        b.append(rect(x, 162, cw, 150, CARD, 14))
        b.append(t(x + cw / 2, 252, n, 72, BLUE, 800, "middle"))
        b.append(t(x + cw / 2, 290, label, 18, MUTED, 600, "middle"))
    b.append(t(w / 2, 360, "From idea to production. Beyond code generation.", 20, INK, 600, "middle"))
    svg("hero.svg", w, h, "The definitive approach to AI-native software engineering. Agent-driven, human-governed, evidence-verified. 13 specialized agents, 23 integrated skills, 7 lifecycle stages. From idea to production, beyond code generation.", b)

# 1. Journey -------------------------------------------------------------------------------
def journey():
    steps = [
        ("1", "Research", None, ["9 methods studied", "400+ mechanisms"], "plain"),
        ("2", "Freeze the rules", None, ["16 criteria, 5 profiles", "hashed before scoring"], "plain"),
        ("3", "Round 1", "53.2", ["6th of 10", "failed the test"], "amber"),
        ("4", "Close the gaps", None, ["stage skills and", "tested scripts"], "plain"),
        ("5", "Round 2", "88.5", ["1st of 10", "under all 5 profiles"], "blue"),
        ("6", "Real trial", None, ["1 Critical, 14 Important", "all fixed, re-tested"], "plain"),
    ]
    w, h, cw, gap, x0, y0, ch = 1200, 330, 170, 16, 50, 92, 196
    b = [t(40, 52, "How we built it", 28, INK, 700), t(1160, 52, "Nov 18–25, 2026", 16, BLUE, 700, "end")]
    for i, (n, title, big, lines, kind) in enumerate(steps):
        x = x0 + i * (cw + gap)
        fill, stroke = {"plain": (CARD, "none"), "amber": (AMBER_SOFT, AMBER), "blue": (BLUE_SOFT, BLUE)}[kind]
        b.append(rect(x, y0, cw, ch, fill, 10, stroke, 2 if stroke != "none" else 1))
        b.append(f'<circle cx="{x + 26}" cy="{y0 + 28}" r="13" fill="{BLUE}"/>' + t(x + 26, y0 + 33, n, 13, "#fff", 700, "middle"))
        b.append(t(x + 48, y0 + 33, title, 16, INK, 700))
        if big:
            b.append(t(x + cw / 2, y0 + 106, big, 46, AMBER_INK if kind == "amber" else BLUE, 800, "middle"))
            ly = y0 + 140
        else:
            ly = y0 + 92
        for k, line in enumerate(lines):
            b.append(t(x + cw / 2, ly + k * 22, line, 14, MUTED, 400, "middle"))
        if i < len(steps) - 1:
            b.append(arrow(x + cw + 2, y0 + ch / 2, x + cw + gap - 2, y0 + ch / 2))
    b.append(t(40, 316, "The failed first round showed exactly what was missing; the second measured whether it was built.", 14, MUTED))
    svg("journey.svg", w, h, "How the Agentic SDLC was built: research, a frozen scoring method, a failed first round at 53.2, gap closure, a second round at 88.5 in first place, and an end-to-end trial", b)


# 2. Ranking -------------------------------------------------------------------------------
SCORES = [("Agentic SDLC", 88.5), ("AWS AI-DLC", 68.6), ("Agile V", 67.0), ("BMad Method", 66.8),
          ("Addy Osmani agent-skills", 57.6), ("Superpowers", 56.0), ("AWS Kiro", 44.4),
          ("Matt Pocock skills", 43.8), ("GitHub Spec Kit", 43.2), ("OpenSpec", 38.8)]


def ranking():
    w, rowh, top, lx, bx, bw = 1200, 40, 112, 50, 300, 760
    h = top + rowh * len(SCORES) + 70
    b = [t(40, 52, "Ten methods, one scorecard", 28, INK, 700),
         t(40, 80, "Weighted score, 0–100, baseline profile. Same 16 criteria for every method.", 15, MUTED),
         rect(30, 96, w - 60, rowh * len(SCORES) + 30, CARD, 12)]
    for v in (25, 50, 75, 100):
        x = bx + bw * v / 100
        b.append(f'<line x1="{x}" y1="{top - 4}" x2="{x}" y2="{top + rowh * len(SCORES) - 6}" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(x, top + rowh * len(SCORES) + 12, v, 12, MUTED, 400, "middle"))
    for i, (name, s) in enumerate(SCORES):
        y = top + i * rowh
        ours = i == 0
        b.append(t(bx - 14, y + 21, name, 15, INK, 700 if ours else 400, "end"))
        b.append(rect(bx, y + 6, bw * s / 100, 22, BLUE if ours else OTHER, 4))
        b.append(t(bx + bw * s / 100 + 10, y + 23, f"{s:.1f}", 15, INK, 700 if ours else 400))
    b.append(t(40, h - 22, "First under all five weighting profiles · 19.9 points ahead of second place · uncertainty band on 88.5: ±4.1 · internal evaluation by AI scorers", 13, MUTED))
    svg("scores.svg", w, h, "Bar chart of baseline scores: Agentic SDLC 88.5, AWS AI-DLC 68.6, Agile V 67.0, BMad Method 66.8, Addy Osmani agent-skills 57.6, Superpowers 56.0, AWS Kiro 44.4, Matt Pocock skills 43.8, GitHub Spec Kit 43.2, OpenSpec 38.8", b)


# 3. Criteria ------------------------------------------------------------------------------
CRITERIA = [  # id, name, ours, best other, leader(s)
    ("C1", "Ease of adoption", 4, 5, "BMad"),
    ("C2", "Spec quality", 5, 4, "BMad, AI-DLC, OpenSpec"),
    ("C3", "Code quality practices", 5, 5, "Addy Osmani"),
    ("C4", "Verification and evidence", 5, 5, "Agile V, AI-DLC"),
    ("C5", "Code review rigor", 5, 4, "BMad, Superpowers, Agile V, AI-DLC"),
    ("C6", "Loop control", 5, 4, "BMad, Superpowers, Agile V, AI-DLC"),
    ("C7", "Task and code graphs", 5, 3, "BMad, Agile V, AI-DLC, Kiro"),
    ("C8", "Autonomous-run safety", 4, 4, "AI-DLC"),
    ("C9", "Traceability", 3.5, 3, "BMad, Agile V, AI-DLC"),
    ("C10", "Human governance", 3, 4, "Agile V"),
    ("C11", "Security by default", 4, 3, "Addy Osmani, Agile V"),
    ("C12", "Release and operations", 4, 3, "Addy Osmani, AI-DLC"),
    ("C13", "Context management", 5, 5, "Addy Osmani, Superpowers, AI-DLC"),
    ("C14", "Right-sizing and brownfield", 4, 4, "Agile V"),
    ("C15", "Portability", 4, 5, "Agile V, Spec Kit"),
    ("C16", "Learning loop", 4, 3, "BMad, AI-DLC"),
]


def criteria():
    w, rowh, top, lx, sx, sw = 1200, 34, 132, 50, 330, 360
    h = top + rowh * len(CRITERIA) + 70
    b = [t(40, 52, "Where the lead comes from", 28, INK, 700),
         t(40, 80, "Level 0–5 on each of the 16 criteria (C1–C16): the Agentic SDLC against the best of the nine other methods.", 15, MUTED),
         f'<circle cx="52" cy="104" r="8" fill="{BLUE}"/>', t(68, 109, "Agentic SDLC", 14, INK, 700),
         f'<circle cx="200" cy="104" r="9" fill="none" stroke="{AMBER}" stroke-width="3"/>', t(218, 109, "Best other method (named on the right)", 14, INK),
         rect(30, top - 14, w - 60, rowh * len(CRITERIA) + 44, CARD, 12)]
    for v in range(6):
        x = sx + sw * v / 5
        b.append(f'<line x1="{x}" y1="{top - 6}" x2="{x}" y2="{top + rowh * len(CRITERIA) - 4}" stroke="{RULE}" stroke-width="1"/>')
        b.append(t(x, top + rowh * len(CRITERIA) + 22, v, 12, MUTED, 400, "middle"))
    for i, (cid, name, ours, best, who) in enumerate(CRITERIA):
        y = top + i * rowh + 12
        d = ours - best
        b.append(t(lx, y + 5, cid, 13, MUTED, 700))
        b.append(t(lx + 44, y + 5, name, 14, INK))
        xo, xb = sx + sw * ours / 5, sx + sw * best / 5
        if abs(d) > 0:
            b.append(f'<line x1="{min(xo, xb)}" y1="{y}" x2="{max(xo, xb)}" y2="{y}" stroke="{RULE}" stroke-width="4"/>')
        b.append(f'<circle cx="{xb}" cy="{y}" r="10" fill="{CARD}" stroke="{AMBER}" stroke-width="3"/>')
        b.append(f'<circle cx="{xo}" cy="{y}" r="7" fill="{BLUE}" stroke="{CARD}" stroke-width="2"/>')
        tag, col = (f"leads +{d:g}", BLUE) if d > 0 else (("tie", MUTED) if d == 0 else (f"behind {d:g}", AMBER_INK))
        b.append(t(sx + sw + 28, y + 5, tag, 14, col, 700))
        b.append(t(sx + sw + 128, y + 5, who, 13, MUTED))
    b.append(t(40, h - 18, "Leads on 8, ties on 5, behind on 3 (adoption: BMad; governance: Agile V; portability: Agile V and Spec Kit). C9 and C10 are discounted until their scripts ship.", 13, MUTED))
    svg("criteria.svg", w, h, "Dot plot of the 16 criteria: the Agentic SDLC leads on 8, ties on 5 and is behind on ease of adoption, human governance and portability", b)


# 4. Guardrails ----------------------------------------------------------------------------
def guardrails():
    w, h = 1200, 560
    b = [t(40, 52, "Why you can trust the output", 28, INK, 700),
         rect(30, 76, 560, 456, CARD, 12), rect(610, 76, 560, 456, CARD, 12),
         t(56, 112, "Evidence, not claims", 20, INK, 700),
         t(636, 112, "Bounded autonomy", 20, INK, 700)]
    chain = [("Acceptance criterion AC-1, approved", "numbered and testable, written before code"),
             ("Test named AC-1, red first", "the failing output is recorded"),
             ("Command and exit code", "re-run fresh, never copied"),
             ("Fingerprint of the tested tree", "any later edit makes it stale"),
             ("Independent reviewer", "fresh context, default verdict NO-GO"),
             ("Human sign-off", "an explicit answer, bound to the version")]
    for i, (a, c) in enumerate(chain):
        y = 132 + i * 64
        b.append(rect(56, y, 508, 50, BLUE_SOFT if i == len(chain) - 1 else "#f5f7fb", 8))
        b.append(t(76, y + 22, a, 15, INK, 700))
        b.append(t(76, y + 41, c, 13, MUTED))
        if i < len(chain) - 1:
            b.append(arrow(310, y + 50, 310, y + 63))
    loops = [("Red-green", "3 tries", "structured debugging"),
             ("Debugging", "3 hypotheses", "Architect"),
             ("Build-test", "5 rounds", "Tech Lead"),
             ("Review-fix", "3 rounds", "Tech Lead"),
             ("Same failure repeated", "2 in a row", "Architect")]
    b.append(t(636, 146, "Loop", 13, MUTED, 700) + t(820, 146, "Limit", 13, MUTED, 700) + t(976, 146, "Then", 13, MUTED, 700))
    for i, (loop, lim, then) in enumerate(loops):
        y = 158 + i * 46
        b.append(rect(636, y, 508, 38, "#f5f7fb", 8))
        b.append(t(652, y + 24, loop, 15, INK, 700))
        b.append(t(820, y + 24, lim, 15, BLUE, 700))
        b.append(arrow(940, y + 19, 964, y + 19))
        b.append(t(976, y + 24, then, 15, INK))
    b.append(rect(636, 400, 508, 52, AMBER_SOFT, 8, AMBER, 1.5))
    b.append(t(652, 422, "Budgets per unattended run", 14, AMBER_INK, 700))
    b.append(t(652, 442, "15 tasks · 4 active hours · 300 turns, then it stops", 14, INK))
    b.append(rect(636, 462, 508, 52, AMBER_SOFT, 8, AMBER, 1.5))
    b.append(t(652, 484, "Authority limits", 14, AMBER_INK, 700))
    b.append(t(652, 504, "never pushes, merges, deploys or tags without a human", 14, INK))
    svg("guardrails.svg", w, h, "Two panels: an evidence chain from acceptance criterion to human sign-off, and the loop limits, budgets and authority limits that bound the agents", b)


if __name__ == "__main__":
    hero()
    journey()
    ranking()
    criteria()
    guardrails()
