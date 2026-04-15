# PWA Stack Upgrade Plan

## Scope Locked For This Batch

- Update the PWA infrastructure to the latest stable frontend stack.
- Add the foundation libraries needed for the next shadcn Base migration step.
- Keep the current custom `dialog` and `toast` implementations for now.
- Do not touch `VirtualScroller` in this batch. It stays in place even though it is known buggy.
- Do not start converting custom UI components in this batch.

## Important Interpretation

- The repository was already on Vite 5, so moving to literal Vite 4 would be a downgrade.
- Because the goal is to use the newest stack, this batch upgrades to the latest stable Vite instead.
- The `v4` target is treated as Tailwind 4 plus shadcn CLI v4 plus the new Base registry support.

## Decisions Confirmed

- `dialog`: keep custom implementation for now.
- `toast`: keep custom implementation for now.
- `virtual scroller`: keep custom implementation for now and defer bugfixing.
- `shadcn`: use the Base registry path, not raw Base UI primitives directly.
- `theme`: dark-only foundation for now, but future work must move to semantic tokens.
- `i18n`: install the base libraries now, wire them in a separate step with English fallback first.

## What Was Updated In This Batch

### shadcn setup now in place

- `components.json` is now created with `base-nova` and Tailwind v4-compatible settings.
- Shared theme tokens and color semantics now live in `packages/ui/src/styles/theme.css`.
- The PWA stylesheet now consumes the shared theme layer instead of owning the semantic token definitions directly.
- Theme initialization now goes through the shared runtime helper in `packages/ui/src/theme.ts`.
- The first Base primitives now live in `packages/ui` so they can be reused by the PWA, the extension, and future clients.
- The first safe real usages now import from `@steam-organizer/ui`: `Badge` in the header update indicator and `Button` on the sign-in screen.

### Core runtime and build stack

- React 19
- React DOM 19
- Vite 8
- `@vitejs/plugin-react-swc` 4
- Tailwind CSS 4
- `@tailwindcss/vite`
- TypeScript 6

### Foundation libraries added for upcoming migration

- `@base-ui/react`
- `class-variance-authority`
- `lucide-react`
- `shadcn`
- `tw-animate-css`

### Foundation libraries added for upcoming localization

- `i18next`
- `react-i18next`
- `i18next-browser-languagedetector`

## Validation Status

- `pnpm --filter @steam-organizer/pwa build` passes on the upgraded stack.
- Tailwind 4 now runs in CSS-first mode with no local `tailwind.config.js` bridge.
- Vite native `resolve.tsconfigPaths` is used, so the external `vite-tsconfig-paths` plugin is no longer needed.
- `pnpm dlx shadcn@latest info` now resolves `packages/ui` correctly as the shared `base-nova` target while still using the PWA theme CSS.
- `@steam-organizer/ui` is now a workspace package and the PWA consumes it through a normal monorepo dependency.
- Shared theme CSS is now exported from `@steam-organizer/ui/styles/theme.css`.

## Build-System Notes

### Tailwind 4

- Tailwind now runs through `@tailwindcss/vite`, not PostCSS.
- The old `postcss.config.js` remains intentionally removed.
- The old `tailwind.config.js` bridge is now removed.
- Theme tokens, animations, sizes, radii, and project-specific utilities are now defined in shared CSS instead of JavaScript config.
- `src/defines/index.css` imports the shared theme layer and declares the workspace `@source` for `packages/ui`.

### CSS Modules with `@apply`

- Tailwind 4 requires CSS modules that use `@apply` to explicitly import the main stylesheet context via `@reference`.
- All current `*.module.css` files were patched to reference the shared app stylesheet through `#app.css`.
- This is a compatibility bridge only, not the final styling architecture.
- Remaining raw `theme(...)` usages were replaced with CSS variables from the shared theme layer.

### shadcn/Base setup

- `packages/ui` is now the canonical home for shared primitives.
- `packages/ui` is now also the canonical home for the shared theme contract and color scheme.
- `packages/ui/src/styles/theme.css` now also owns the former Tailwind config concerns: legacy palette aliases, custom radii, custom font utility, custom animations, and shared project utilities.
- The PWA no longer owns the primitive files directly; it consumes them from `@steam-organizer/ui`.
- The current PWA `components.json` now points its `ui` alias at the workspace package instead of a local folder.
- Further `shadcn add ...` operations should now be run from `packages/ui`.
- The initial `baseColor` is locked to `neutral` to stay close to the default shadcn token semantics.
- Current dark-mode values live in the shared theme layer and intentionally override the default semantic tokens to preserve the existing product palette.
- Legacy Tailwind color names still coexist during the bridge period, but semantic tokens are now the source of truth for new primitives.

## Known Risks After This Batch

- `vite-plugin-ts-nameof` builds successfully, but its published peer range still stops at Vite 5.
- `eslint-plugin-react-refresh` now expects ESLint 9 or 10, while the repo still keeps ESLint 8 for now.
- React Router is updated together with the React upgrade, so route smoke-testing is mandatory.
- Custom utilities like `btn`, `chip`, `flex-center`, `grad-primary`, and `backdrop-primary` still live in the legacy Tailwind config and should later move to semantic tokens and CSS-driven utilities.
- The app still has many legacy class names, but they are now provided from CSS-first shared theme/utility definitions instead of JS config.
- The project still has custom UI abstractions that are not removed in this batch.
- `gapi-script` still emits a direct `eval` warning during bundling.
- The production bundle is still large and currently lands around 796 kB before gzip splitting optimizations.

## Explicitly Deferred

- `Dialog` replacement or cleanup
- `Toast` replacement or cleanup
- `VirtualScroller` bugfixes or removal
- broad shadcn component replacement beyond the first primitives
- removal or renaming of the legacy raw color utility layer
- i18n provider wiring
- theme provider wiring
- state-management cleanup

## Next Exact Steps

1. Smoke-test the upgraded app in plain browser mode and make sure the PWA still builds and starts.
2. Replace low-risk local UI pieces with the new primitives before touching modal, popup, or complex stateful controls.
3. Continue the next migration wave directly in `packages/ui` instead of creating any new primitive files inside `apps/pwa`.
4. Keep `dialog`, `toast`, and `virtual scroller` outside the next migration wave.
5. Wire `i18next` with English fallback before touching a large number of user-facing strings.
6. Start deleting legacy Tailwind utility aliases only after their call sites are fully migrated to semantic tokens.
7. Decide which shared utilities should remain public API in `packages/ui` and which should be retired as migration shims.

## Stop Conditions

- If React Router 7 breaks current navigation assumptions, pin it back temporarily and treat router migration as a separate task.
- If Tailwind 4 compatibility mode breaks too many legacy utilities, pause component migration and move the utility layer into CSS first.
- If a future shadcn Base component requires a token decision that is still unresolved, do not generate it yet.