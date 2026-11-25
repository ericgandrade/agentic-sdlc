# strkit — agent instructions

<!-- AGENTIC-SDLC:BEGIN -->
## Agentic SDLC
- Artifacts: `specs/NNN-slug/` · Issues (no tracker): `docs/issues/NNNN-slug.md` · Code map: `docs/codemap.md` · ADRs: `docs/adr/`
- Conventions: branch `feat/NNN-slug` (Quick: `fix/NNNN-slug`); commit trailer `Refs: Tn AC-n` (Quick: `Refs: AC-n`)
- Off limits: `.agentic-sdlc/bin/` — vendored gates, re-vendor only (project-context vendor mode)
- Roles: Product Owner dogfood-owner · Tech Lead dogfood-owner · Reviewer dogfood-owner · Release Owner dogfood-owner (all SIMULATED)
- Platform: copilot-cli · subagents: yes · shell: yes · node: 22.15.1 · enforcement: prompt-only · ci: none
- Enforcement: prompt-only · permissions: prompt-only
- Tools: `.agentic-sdlc/bin/` agentic-sdlc 2.1.0 (verify: `cd .agentic-sdlc/bin && shasum -a 256 -c SHA256SUMS`) · adoption ledger: `.agentic-sdlc/adoption.md`
- Baseline: 2026-11-24 at d0c78b1a9189 · tests 3/3 · coverage 100.0% · red: none

## Definition of Done
```sdlc-dod
lint: npm run lint --silent
typecheck: n/a — plain JavaScript (ES modules, no type checker)
test: npm test --silent
coverage: npm run coverage --silent
coverage_min: 100.0
```

## Pitfalls (observed agent mistakes)
- none yet
<!-- Verified: 2026-11-24 at d0c78b1a9189 -->
<!-- AGENTIC-SDLC:END -->
