# Code map — <project name>

<!--
Template for docs/codemap.md (mechanism 7.3). Written by `project-context` adopt mode; read by the
Analyst (path score: components), the Architect (design) and writing-plans (Impact, regression scope).

Rules:
- Every top-level source directory appears in exactly one module's `paths`, or in `excluded` with a reason.
- `depends_on` names other modules of this map, or `ext:<package>` for an external service or package that matters for impact.
- `tests` lists the test paths that exercise the module; `[]` marks an untested module (characterization tests come first).
- `deploy` is the separately built or deployed unit the module ships in; distinct `deploy` values are the "components" of the path score.
- Flow lists only (`[a, b]`), one key per line, so the block parses without a YAML library.

Refresh triggers:
- A PR that adds, removes or moves a top-level source directory updates this file in the same PR.
- `verified` older than 90 days, or a top-level directory not mapped → doctor† WARN (doctor† = later release; until then the Tech Lead checks the date at each Discover stage).
Failure: a plan touches a module missing from the map → update the map first (Architect, `references/paths.md` §5).
-->

```sdlc-codemap
version: 1
verified: YYYY-MM-DD at <12-hex commit SHA>
modules:
  - name: <module-name>
    paths: [<dir>/**]
    deploy: <unit>
    depends_on: [<module-name>, ext:<package>]
    tests: [<test dir or glob>]
    owner: <role or team>
excluded:
  - path: <dir>/
    reason: <generated | vendored | docs | fixtures>
```

## Notes

<!-- Conventions an agent gets wrong without being told: module boundaries, layering rules, shared code that must not import from a feature module. Max 10 lines. -->
