---
paths:
  - 'packages/app/src/**'
---

# App structure

`packages/app` is the one Vue app; shells (`apps/web`, `apps/extension`) only call `mountApp` (the extension also `mountPopup` and `mountAutofill`) with their `Platform` and, for the app, router history. The app never imports a shell, and branches on `usePlatform()` (`kind`, `fetch === null` on web), never on build flags.

## Feature slices

A feature lives in `src/features/<name>/`, named after its domain (`accounts`, `vault`), not a screen. Create a file or folder only when the feature needs it.

| Path | Holds |
|---|---|
| `index.ts` | the public facade: other code imports `#features/<name>`, which resolves only to it |
| `model.ts` | types the feature exposes; later re-exported from `@so/core` |
| `routes.ts` | its `RouteRecordRaw[]` (lazy components) and route builders; `router.ts` composes them |
| `mocks.ts` | design-first samples (`core/mock/README.md`), read only by its view-models |
| `components/` | render props and view-model state, emit intent; no stores, no mocks |
| `composables/` | view-models: UI state, orchestration, named intents |
| `services/` | framework-free logic worth a unit test; no Vue/Pinia, no one-line pass-throughs |
| `stores/` | Pinia setup stores for state that outlives a view; refs private, expose computed + actions |
| `README.md` | the `## Mocks` table while the feature has mocks |

A folder holds at most 12 modules, tests excluded (`crowded-folder`). Past that, group by screen or sub-area (`components/list/`, `components/card/`), never by kind of file.

## Imports

- Subpath imports from `package.json#imports`: `#core`, `#features/<name>`, `#components/<File>.vue`. Inside a feature or `core/`, relative paths.
- `core/` (`core/index.ts`) is shared infra and never imports features or components. Code moves there when a second feature needs it. A `services/` file imports a Vue-free core module by path.
- App-root `components/` holds app-wide components with no feature owner (`MockPanel`, `PageTopbar`, `NotFound`).
- Dependencies point one way, no cycles (`pnpm arch`).

## Reuse before building

| Need | Use |
|---|---|
| modal, drawer, a section or id inside one | `useQueryOverlay` (Routes below) |
| loading, empty, error states | `FpAsyncView` fed by one `status` |
| sample data for a block without a source | `defineMock` + `useMock` (`core/mock/README.md`) |
| client state that survives a reload | `readStored` / `writeStored` with a key constant in `core/storage.ts`; `localStorage` fails lint. A store writes in its actions, never from a `watch`: Vue ties a watcher to the component whose setup first used the store and keeps that page alive |
| failure | `reportError(error, scope, context?)`, the only `console.error` (`noConsole` fails lint) |
| debounce, interval | `useTimer` from `@so/ui/useTimer` |
| a screen's title, count, status, search and actions in the shell topbar | `PageTopbar` with its `status`, `center`, `actions`, `back` slots; the route sets `meta.nav`. The parts stay mounted while their page is hidden, so a global listener in one checks `usePageActive()` |
| the page's scroll element (a virtual list, scroll to top) | `useScrollRoot()` from `#core`: each page has its own; a section root (`meta.resident`) keeps its offset while hidden, any other page starts at the top |
| the page's scroll offset (a header that changes once scrolled, the dock) | `useScrollTop()` from `#core`: the layer reads `scrollTop` once per scroll, before the page's own handlers re-render it; never a scroll listener of your own |
| whether the page is current (a resident page stays mounted behind another) | `usePageActive()` from `#core`: a ticker pauses on it; `useQueryOverlay`, `PageTopbar` and the kit overlays already follow it |
| a strip pinned above the page's scroll (filters) | the route's `header` named view (`components: { default, header }`): `ShellLayer` renders it outside the scroller, so it moves with its page and nothing scrolls under it |
| desktop or phone layout in script | `useDesktopLayout()` from `@so/ui`; prefer `lg:` CSS when markup alone differs |

## Routes and overlays

- A feature's routes live in its `routes.ts`; the unlocked app nests under the shell route, onboarding and unlock render bare.
- A query key has one owner (a route composable or the view-model behind an overlay), its only reader and writer. Components never touch `route.query` (`route-query-owner`).
- An overlay the user can land on (settings, restore backup, add account) is a `useQueryOverlay(key, { values, owns })`: the page under it keeps its state, opening pushes and closing pops, so Back closes it. An overlay bound to an action in flight (a confirm, a hold-to-reset) stays local state.
- The overlay's `value` is held while it animates out; derive from it with plain `computed`. Reset an overlay's flow when it opens, never on close. A submit that closes it runs through `useCloseOnSuccess(open)`.
