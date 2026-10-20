# Steam Organizer

Steam account manager: encrypted vault, Steam profiles, Steam Guard codes, Drive backups. One Vue 3 app (`packages/app`) in thin shells: `apps/web` (PWA, Steam data read-only) and `apps/extension` (WXT, Chrome/Edge/Firefox). pnpm 12, Node 24+, TypeScript 6 (vue-tsc has no TS 7 support yet). Product scope: `features.md`; architecture and roadmap: `architecture.md`.

| Path | Holds |
|---|---|
| `packages/ui` | `@so/ui`: the Fp* kit (Vue + Reka UI + Tailwind v4), tokens and theme engine |
| `packages/app` | `@so/app`: features, core infra, router, i18n; `mountApp(el, { platform, history })` |
| `apps/web` | PWA shell |
| `artifacts/` | local only: `mockup/` (design source of truth), `legacy/` (old React app, reference), `shots/`, `orch/` |

## Commands

- `pnpm dev` - web app on `localhost:3000`
- `pnpm lint` / `pnpm format` - Biome
- `pnpm typecheck` - vue-tsc in every package
- `pnpm test` - Vitest, including the UI contract (`tests/ui/rules.ts`; `baseline.json` counts only go down)
- `pnpm arch` - dependency boundaries (`tests/arch/dependency-cruiser.cjs`)

## Rules

`.claude/rules/` holds the working rules; each loads when you touch a file matching its `paths`. Other agents read the ones that match the files in their task.

| Rule | Covers |
|---|---|
| `structure.md` | feature slices, imports, what to reuse from core, routes and overlays (`packages/app/src/**`) |
| `vue.md` | view-models, templates, kit primitives, cost on phones, Vapor constraints (`*.vue`) |
| `styling.md` | tokens, surfaces, icons, phones, motion (`*.vue`, `*.css`) |
| `ui-kit.md`, `ui-modal.md` | `packages/ui` internals: color derivation, components, modal stack |
| `testing.md` | unit test placement and mocking |

## Design-first workflow

Screens are ported from `artifacts/mockup/*.dc.html` with the `port-mockup` skill: full design, every block fed by a view-model over mocks (`packages/app/src/core/mock/README.md`), wired later by swapping view-model bodies. A new feature slice starts with the `new-feature` skill.

No docs folder: durable guidance lives in rules and feature READMEs. Rules describe the code as it is. A change that adds, renames or retires a mechanism, convention or path updates every rule, skill and feature README that names it, in the same commit: grep `.claude/` and `features/*/README.md` for the old name before finishing.

## Comments

Explain only a non-obvious reason, invariant or quirk, in 1-2 lines. Never narrate names, types or the code below. Use `-`, not a long dash.
