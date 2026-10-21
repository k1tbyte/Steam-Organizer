# shell

The unlocked app's frame. Desktop: 64px rail (Accounts, Backups, Bots soon, Lock, Settings) and a 60px topbar. Phone: header with title, status and actions, then a tab bar (Accounts, Backups, Bots soon, Settings). The stage behind it is `.bg-stage` in `App.vue`.

- `shellRoute` is the layout route; `router.ts` nests every screen under it as children.
- A screen feeds the topbar through `PageTopbar` (`#components/PageTopbar.vue`), which teleports its parts into the shell's outlets (`core/topbarOutlets.ts`). The route's `meta.nav` picks the highlighted entry, `meta.tabBar: false` hides the phone tab bar for a drill-down.
- `SyncStatus` from `#features/backups` is the Drive sync indicator pages place in the `status` slot.
- Settings opens through `useSettingsEntry()` from `#features/settings`: a window on desktop, the `/settings` screen on phones.

The rail's Lock button calls `useVaultSession().lock` from `#features/vault`. Unwired intents: Bots (planned, disabled).
