# quick-access

The extension's toolbar popup: an account palette on the vault, and the account picker the autofill UI reuses. `mountPopup` (`@so/app/popup`) mounts `QuickAccessApp` with no router; the shell gives it a `Platform` whose `openApp` opens the full app and closes the popup.

- `index.ts` exports `QuickAccessApp`, the picker parts (`PickerList`, `PickerRow`, `LISTBOX_ID`) and the view-model pieces autofill shares: `useAccountPicker(accounts)` (search and selection over the rows it is given: the popup passes `useVaultAccounts().accounts`), `useFillFeedback`, and `PickerAccount`, the fields a row renders and searches (the picker parts and `rankAccounts` take nothing more). The Steam password comes from `useAccountCredentials` (`#features/accounts`).
- The vault session picks the screen (`usePopupFrame`): accounts, locked (master password, same verifier as the unlock screen) or setup (no vault, opens the app).
- Accounts come from `useVaultAccounts`: pinned first, search on nickname and login (`services/picker.ts`; a locked account's login is not searched). `PickerList` is a windowed `role=listbox` in `FpScrollArea`; the selection moves by keyboard only, so a row hover never scrolls the list.
- Keys, from the search field: arrows move (wrapping), Enter fills, Escape clears the search, Ctrl/Cmd+C copies the selected password while no text is selected.
- The fill banner follows the active tab. `useActiveTab` asks the tab's content script through `Platform.activeTab` (`tabs.query` + `tabs.sendMessage`, `activeTab` permission only: the address comes from the content script) for `tab:context` when the popup opens: `signin`, `guard`, or `other` when nothing answers (not a Steam login page). Fill (the banner or Enter, after the account gate for a locked account) sends `tab:fill-login { id, login, password }` on a sign-in or `tab:fill-code { code }` on a Guard prompt, both answered `{ filled: boolean }`; nothing is sent when the tab is not a Steam login. "Filled" shows on `{ filled: true }`, then the popup closes (`window.close()`, as Bitwarden's: the focus goes back to the page). The `tab:*` messages are owned here (`model.ts`, parsed in `services/tabMessages.ts`); the autofill content script answers them, which is why autofill imports quick-access and never the reverse.
- The selected row shows the Steam Guard code (hold to reveal, `GuardPeek`), copy login, copy password and open in the app (`/accounts/:id`).
- A locked account asks its own password before a fill, a copy or a code (`usePopupAccountGate` over `useUnlockForm` and `useAccountLocks`); one unlock lasts until the popup closes, which drops that account's key. The vault itself is not asked again while the lock policy keeps the session: `usePopupFrame` loads the session, which restores the kept one from the browser's session area (the app page's unlock opens the popup unlocked, a lock in the popup locks the app page), and calls `useAutoLock()` for the idle timeout. A locked popup takes the master password only (no PIN, no Hello: a platform dialog may close the popup).
- The layout holds at any size: 380x580 with a fine pointer, the whole viewport with a coarse one (Firefox Android opens popups full screen).

## Mocks

Mockup: `Extension.dc.html` (Popup, Popup · Locked).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `DEMO_ACCOUNT_PASSWORD` (`demo`) | the locked-account prompt for a sample | none: a vault account opens with its own key | `usePopupAccountGate` |

The banner's `quick-access.tab` sample (`mocks.ts`) stands in only where `Platform.activeTab` is absent (the web demo, a unit test); with a way to the tab the answer is real, "another site" included, and a sample banner's Fill shows the feedback and sends nothing. The accounts, the vault session and the master password come from the `accounts.list` (One locked, Empty) and `vault.session` (Locked, New vault) mocks. "No results" is reached by typing.

Copy login, copy password and the fill are real for vault accounts.
