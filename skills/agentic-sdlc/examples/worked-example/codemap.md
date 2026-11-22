# Code map — reports-app

Worked-example code map (template: `templates/codemap.md`). The CSV-export item touches `api-reports`, `api-export`, `api-auth`, `web-reports` and `web-api-client`: five modules in two deploy units (`api`, `web`), which gives the path score's components = 2.

```sdlc-codemap
version: 1
verified: 2026-11-22 at 3f9c2a7d1e04
modules:
  - name: api-reports
    paths: [server/src/routes/reports/**]
    deploy: api
    depends_on: [api-auth, api-export, api-db]
    tests: [server/test/routes/reports/**]
    owner: reports-team
  - name: api-export
    paths: [server/src/export/**]
    deploy: api
    depends_on: []
    tests: [server/test/export/**]
    owner: reports-team
  - name: api-auth
    paths: [server/src/auth/**]
    deploy: api
    depends_on: [api-db, ext:jsonwebtoken]
    tests: [server/test/auth/**]
    owner: platform-team
  - name: api-db
    paths: [server/src/db/**, server/migrations/**]
    deploy: api
    depends_on: [ext:postgres]
    tests: [server/test/db/**]
    owner: platform-team
  - name: web-reports
    paths: [web/src/reports/**]
    deploy: web
    depends_on: [web-api-client]
    tests: [web/src/reports/__tests__/**]
    owner: reports-team
  - name: web-api-client
    paths: [web/src/api/**]
    deploy: web
    depends_on: [api-reports]
    tests: [web/src/api/__tests__/**]
    owner: reports-team
excluded:
  - path: docs/
    reason: docs
  - path: specs/
    reason: docs
  - path: web/dist/
    reason: generated
```

## Notes

- Route handlers in `server/src/routes/` call `api-auth` middleware before any query; a new route without it is a Critical review finding.
- `api-export` is pure (no I/O); serializers take rows and return strings, so unit tests need no database.
- `web/src/api/` is the only place that calls `fetch`; components import the client, never `fetch` directly.
