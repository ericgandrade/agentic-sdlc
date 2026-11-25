<!-- Template: the AGENTIC-SDLC block for AGENTS.md (project-context). Copy everything from BEGIN to END.
     Rules: ../references/agents-md-rules.md (≤ 60 lines between the markers, ≤ 160 chars per line).
     DoD format: ../references/dod-block.md (fence at column 0, exactly 5 keys, lower-case "n/a — reason").
     Delete every <placeholder>; a line with no verified value is removed or written as "n/a — <reason>". -->
<!-- AGENTIC-SDLC:BEGIN -->
## Agentic SDLC
- Build: `<verified command>` · Run: `<verified command>`
- Artifacts: `specs/NNN-slug/` · ADRs: `docs/adr/` · Code map: `docs/codemap.md` · Quality bar: `CONSTRAINTS.md` (Full path) · Vocabulary: `GLOSSARY.md`
- Conventions: branch `feat/NNN-slug`; commit trailer `Refs: Tn AC-n`; <non-obvious convention — evidence>
- Off limits: <path — reason, owner>
- Roles: Product Owner <handle> · Tech Lead <handle> · Reviewer <handle> · Release Owner <handle>
- Platform: <platform> · subagents: <yes|no> · shell: <yes|no> · node: <version|absent> · ci: <system|none>
- Enforcement: <branch-protection|prompt-only> · permissions: <enforced|prompt-only>
- Tools: `.agentic-sdlc/bin/` agentic-sdlc <version> (verify: `cd .agentic-sdlc/bin && shasum -a 256 -c SHA256SUMS`) · adoption ledger: `.agentic-sdlc/adoption.md`
- Baseline: <YYYY-MM-DD> at <sha12> · tests <pass>/<total> · coverage <n>% · red: <ids|none>

## Definition of Done
```sdlc-dod
lint: <verified command>
typecheck: <verified command>
test: <verified command>
coverage: <verified command that writes the coverage summary>
coverage_min: <baseline line coverage, rounded down, one decimal>
```

## Pitfalls (observed agent mistakes)
- <YYYY-MM-DD> — <observed mistake> → <correct behaviour>
<!-- Verified: <YYYY-MM-DD> at <sha12> -->
<!-- AGENTIC-SDLC:END -->
