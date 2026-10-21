# shell

The unlocked app's frame. Desktop: 64px rail (Accounts, Backups, Bots soon, Lock, Settings) and a 60px topbar. Phone: header with title, status and actions, then a floating tab bar, the dock (Accounts, Backups, Bots soon, Settings). The stage behind it is `.bg-stage` in `App.vue`.

- `shellRoute` is the layout route; `router.ts` nests every screen under it as children.
- A screen feeds the topbar through `PageTopbar` (`#components/PageTopbar.vue`), which teleports its parts into the shell's outlets (`core/topbarOutlets.ts`). The route's `meta.nav` picks the highlighted entry, `meta.tabBar: false` hides the phone tab bar for a drill-down.
- `meta.hero` marks a detail page its list item morphs into on desktop (`:id` names the item): `useRouteMotion` runs the swap inside `document.startViewTransition`, sets `data-route-motion="hero-open|hero-close"` on `<html>` and the item's id through `setRouteHero` (`core/routeHero.ts`), and restores the scroll and nudges virtual lists before the second capture (frames are frozen until then, so a list that measures through a ResizeObserver cannot lay out; a card it has not rendered gets a fade instead of a morph). The CSS in `ShellPages` names the `data-vt-hero` elements `account-hero` only while that attribute is set. Phones drill; motion off and browsers without View Transitions swap at once.
- `SyncStatus` from `#features/backups` is the Drive sync indicator pages place in the `status` slot.
- The rail and the dock each glide one highlight to the active entry (`translate` from an index var). The rail's bottom Settings button keeps its own fill: it is bottom-anchored, so gliding there would need layout reads.
- The dock floats over the phone scroller (`layer-dock`, which pads `--dock-clear`). `useDock` hides it on scroll down and shows it on scroll up, near the top and on navigation, with `services/dockScroll.ts` deciding. `ShellTabBar.vue` also sets `--dock-*` and `--toast-offset-bottom` on `:root` so phone toasts clear it.
- Settings opens through `useSettingsEntry()` from `#features/settings`: a window on desktop, the `/settings` screen on phones.

The rail's Lock button calls `useVaultSession().lock` from `#features/vault`. Unwired intents: Bots (planned, disabled).
