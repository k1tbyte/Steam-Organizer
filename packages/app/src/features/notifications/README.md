# notifications

The bell in the Accounts topbar: an unread badge and a panel (a popover on desktop, a bottom sheet on phones) listing what happened to the open vault: refresh results, new bans, Drive backups, a waiting update.

- The facade exports `NotificationsBell`, `useNotificationLog` and the `NotificationEvent` / `NameOf` types. Producers import it and push; notifications imports none of them (accounts already imports it for the bell).
- `stores/notificationLog.ts` is the log: per vault, on this device, the latest 50, each read or unread, under `NOTIFICATIONS_STORAGE_KEY` (one record of vault id to entries). `push(vaultId, event, { route, once })` takes the vault the work was done for, which may have closed since; `once` skips an event the log already holds. `markRead`, `markAllRead` act on the open vault's log. Each write reads storage again first, so another tab's entries stay; with storage denied the log lives in memory.
- No vault content in plaintext: an entry stores its kind, numbers, account ids, a route path and the time (`services/notificationLog.ts` keeps an event's own fields and nothing more, and drops an entry it cannot read). Account names resolve when the panel renders, through the bell's `nameOf` prop (the Accounts page passes `useAccountsList().nameOf`); an account removed since reads "a removed account" and its row opens nothing.
- Producers: `useSteamRefresh` (accounts) logs a new ban per account after any refresh, bulk or single (`services/refresh/banDiff.ts` compares the stored and the fresh Steam bans: a count that grew or a flag that turned on; no earlier snapshot, nothing new), the bulk refresh store logs a run that reached an account ("42 updated · 3 already fresh · 1 failed"), the backups engine and Backup now log each Drive backup saved (accounts and size; never a sync write), and the shell's `useUpdatePrompt` logs a waiting build once per vault.
- A row click marks it read and closes the panel, then goes to its route (the profile, Backups) or, for an update, applies it (`useAppUpdate` from `#core`). "Mark all read" persists. Times are relative ("now", "5 min", "2 h", "Yesterday", "3 d"; `services/notificationAge.ts` over `backupDay`), moving on `useMinuteClock` from `#core`.

## Mocks

Mockup: `Accounts.dc.html` (Desktop, notifications popover; the Mobile bell is a button only).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `notifications.list` (Two unread, All read, Empty, Many unread) | bell badge, panel rows with tone tile and unread dot | live: the open vault's log; the sample shows in mock mode or with no vault open (its read state stays in memory, its rows open nothing) | `useNotifications` |

Unwired intents: none.
