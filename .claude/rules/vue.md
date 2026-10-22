---
paths:
  - '**/*.vue'
---

# Vue components

A component renders state and emits intent: `View = fn(ViewModel)`. The view-model is a composable in the feature's `composables/` (or a store's computed state); `<script setup>` only calls it and hands refs to the template.

## Rules

- No data access, non-trivial transforms or business branching in `<script setup>`. Move them to a composable; framework-free logic goes to `services/`.
- Templates read like a book. A condition that needs a second look becomes a named `computed` in the view-model: `v-if="canCopyCode"`, not `v-if="account.guard && !locked && !anonymous"`.
- In the app, build from `@so/ui` (`FpButton`, `FpInput`, `FpSelect`, `FpModal`, ...). Raw `<input>`, `<select>`, `<textarea>`, `<dialog>` and a `<button>` with its own fill and padding fail `raw-control`. A plain `<button>` as a custom pressable surface (a card, a row) is fine.
- Hints are `v-bind="tip(text)"` from `@so/ui` on the trigger itself, never a native `title` (`native-tooltip`): `{ label: true }` also names an icon-only trigger; inside a menu or popover trigger it goes on the button. It mounts nothing, so a list row can carry many. A touch-only control gets an `aria-label` instead (touch shows no tooltips).
- In the app, every user-facing string goes through `t()` from `useI18n()` (`raw-text`), in source English. Kit primitives own native controls and take their copy as props with English defaults.
- Data-dependent regions render through `FpAsyncView` fed by one `status`. No hand-rolled spinners, empty states or error blocks.
- UI-only state (an expanded row, a hover, a held reveal) stays in the component; a modal or drawer follows the overlay rule in `structure.md`. State shared across routes goes to a store; a page-owned composable beats a store.
- Prop drilling hurts at three hops: pass a slot, `provide`/`inject` for a subtree context, or a store, in that order.
- A config-heavy control repeated across features gets a domain wrapper named for why it exists (`SteamIdFormatSelect`), never an `AppDiv`.

## Cost on phones

- A view that differs between phone and desktop mounts one variant: `v-if` on `useDesktopLayout()` for anything stateful or heavy (a nav, a list), `lg:` CSS when only styling differs. Never both with one hidden by CSS: the twin keeps its observers and state.
- A panel popover (notifications, card fields) passes `sheet` to `FpPopover`: a bottom sheet below `lg`, anchored above. Never branch a popover into `FpDrawer` yourself.
- Mount a scroll container only where it scrolls. Under `lg` the modal wrapper scrolls, so `FpScrollArea` inside a modal panel is desktop-only.
- Shared state beats a per-call resource: a composable that opens a listener, observer or timer every caller would also open keeps it in module state (`useDesktopLayout`), so a list row can call it. One clock for every Steam Guard countdown, not one interval per card.
- Layout reads (`offsetHeight`, `getComputedStyle`) flush style and layout. Keep them out of setup, watchers and per-frame callbacks.

## Vapor compatibility

- Composition API with `<script setup>` and templates only: no Options API, render functions, JSX/TSX.
- Never create or inspect VNodes or slot content, use `getCurrentInstance()`, or rely on undocumented internals. Components that depend on their children register through provide/inject.
- No `<Suspense>`: loading and errors are state.

## Before finishing, check both ways

Under-separated: data access or reshaping in a `.vue` file; a template expression you read twice; one file doing two unrelated jobs (split layout from content).

Over-separated: a component that renders one `<div>` or adds one class; a composable with two refs and no logic; an abstraction with one caller and no domain meaning; more files to open than before to understand the same screen. Under ~150 lines and one job is fine; split on unrelated jobs, not line count. Two similar things are not duplication yet - wait for the third.
