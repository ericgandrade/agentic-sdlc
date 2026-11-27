# Templates

Each artifact's structure lives in exactly one file here; `references/artifacts.md` says where each artifact goes, which stage creates it and which check validates it.

## Extension point `templates`

<!-- ext:templates -->

A `template` extension (`references/extension-interface.md`) adds a template to this set or replaces one. An entry file named like a file here (for example `pr-body.md`) replaces the core template for that project; any other name adds a new template. Precedence: project > team > core. Run `ext-check --point templates --json` to list the active ones; an extension that fails `ext-check` is never used.
