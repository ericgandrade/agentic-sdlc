# Worked example — CSV export (Standard path)

One feature taken through all 7 stages of the Agentic SDLC. Every artifact in this folder is an output of the method, and the scripts in `scripts/` use the folder as their test fixture: a script change that breaks a check on this example fails `node --test`.

## Scenario

"Add CSV export of the currently filtered rows to the reports page of an Express + React app. The file contains order ID, order date and order total. No customer names or other personal data."

## Path score

| Input | Value | Points |
|---|---|---|
| Files touched | 5 (export route, CSV serializer, permission check, export button, API client) | 2 |
| Components | 2 (API, web) | 2 |
| Iterations | 1 | 1 |
| **Size S** | | **5 → Standard** |
| Risk triggers | money (order totals) | R = 1 → Standard |

Score line: `Path: Standard · S=5 · R=1 (money)`. Adding customer names adds the personal-data trigger and moves the work to Full; the example excludes them on purpose.

## Status

Batch 0 created this skeleton. Batch 1 fills `specs/001-csv-export/` with the artifacts listed in its README. Until then the folder holds no artifacts, and the library tests in `scripts/test/` use inline fixtures.
