---
name: new-feature
description: Scaffold and finish a new feature slice in packages/app (a domain area, screen or settings section no existing feature owns). Use before creating files under packages/app/src/features/. Not for changes inside an existing feature.
---

# New feature

The rules in `.claude/rules/` (structure, vue, styling) load as you touch files; this skill is the order of work.

## 1. Place it

- Search `packages/app/src/features/*/index.ts` for an owner first. Extending an existing feature beats a new one.
- Name the slice after the domain (`backups`), not the screen.
- List the facades it needs (`#features/<name>`) and check the direction stays one-way (`pnpm arch`).

## 2. Build in this order, creating only what the feature needs

1. `model.ts` - types it exposes.
2. `mocks.ts` - samples for every block without a source yet (`core/mock/README.md`), variants for empty / one / many / long copy / error.
3. `services/` - framework-free logic with a unit test next to it.
4. `composables/` - one view-model per screen or widget: UI state, `useMock` reads, named intents.
5. `components/` - render the view-model; async regions through `FpAsyncView`, every string through `t()`. A modal or drawer opens through `useQueryOverlay`, its key owned by the view-model behind it.
6. `routes.ts` - its routes with lazy components, added to `router.ts`.
7. `index.ts` - export only what other code imports: entry components, composables other features need, routes.
8. `README.md` - the `## Mocks` table.

## 3. Finish

- `pnpm lint && pnpm typecheck && pnpm test && pnpm arch`, all green, with no `tests/ui/baseline.json` count raised.
- Re-read the "check both ways" list in `vue.md`; flatten any file or abstraction with one caller and no meaning.
- Report the files created and anything you left out on purpose.
