# notifications

The bell in the Accounts topbar: an unread badge and a panel (a popover on desktop, a bottom sheet on phones) listing what happened while the app was away.

- `NotificationsBell` is the only export; the Accounts page places it in `PageTopbar` actions.
- "Mark all read" clears the badge and the row dots for the current list; a new list starts unread again.

## Mocks

Mockup: `Accounts.dc.html` (Desktop, notifications popover; the Mobile bell is a button only).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `notifications.list` (Two unread, All read, Empty, Many unread) | bell badge, panel rows with tone tile and unread dot | refresh results, VAC ban finds, backup saves, update checks | `useNotifications` |

Unwired intents: a row click (should open its source: the banned account, Backups, the update prompt), read state that survives a reload.
