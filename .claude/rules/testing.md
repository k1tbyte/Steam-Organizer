---
paths:
  - '**/*.test.ts'
---

# Unit tests

- Tests sit next to the module they cover (`useQueryOverlay.ts` + `useQueryOverlay.test.ts`) and run in plain node (`vitest.config.ts`): no DOM, no Vue SFC plugin.
- Test behavior through the public function or composable, not private helpers. Mock a module by its file path.
- Never import the `@so/ui` barrel into code under test: it loads `.vue` files. Use subpaths (`@so/ui/useTimer`).
- `tests/docs/refs.test.ts` fails when a rule names a path that no longer exists or its `paths` match nothing: rename the reference with the file.
- A new contract rule goes in `tests/ui/rules.ts`; `baseline.json` counts only go down.
