# Code map — strkit

```sdlc-codemap
version: 1
verified: 2026-11-24 at d0c78b1a9189
modules:
  - name: strkit-lib
    paths: [src/**]
    deploy: npm-package
    depends_on: []
    tests: [test/**]
    owner: Tech Lead
  - name: tooling
    paths: [scripts/**]
    deploy: none
    depends_on: []
    tests: []
    owner: Tech Lead
excluded:
  - path: docs/
    reason: docs
  - path: .agentic-sdlc/
    reason: vendored
  - path: coverage/
    reason: generated
```

## Notes

- `src/index.js` is the only public entry point; every exported function is re-exported there.
