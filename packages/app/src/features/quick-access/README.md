# quick-access

The extension's toolbar popup: an account palette on the vault, and the account picker the autofill UI reuses. `mountPopup` (`@so/app/popup`) mounts `QuickAccessApp` with no router; the shell gives it a `Platform` whose `openApp` opens the full app and closes the popup.

- `index.ts` exports `QuickAccessApp`, the picker parts (`PickerList`, `PickerRow`, `LISTBOX_ID`) and the view-model pieces autofill shares: `useAccountPicker`, `useFillFeedback`. The Steam password comes from `useAccountPassword` (`#features/accounts`).
- The vault session picks the screen (`usePopupFrame`): accounts, locked (master password, same verifier as the unlock screen) or setup (no vault, opens the app).
- Accounts come from `useVaultAccounts`: pinned first, search on nickname and login (`services/picker.ts`; a locked account's login is not searched). `PickerList` is a windowed `role=listbox` in `FpScrollArea`; the selection moves by keyboard only, so a row hover never scrolls the list.
- Keys, from the search field: arrows move (wrapping), Enter fills, Escape clears the search, Ctrl/Cmd+C copies the selected password while no text is selected.
- The selected row shows the Steam Guard code (hold to reveal, `GuardPeek`), copy login, copy password and open in the app (`/accounts/:id`).
- A locked account asks its own password before a fill, a copy or a code (`useAccountGate` over `useAccountLocks`); one unlock lasts until the popup closes, which drops the session and its keys.
- The layout holds at any size: 380x580 with a fine pointer, the whole viewport with a coarse one (Firefox Android opens popups full screen).

## Mocks

Mockup: `Extension.dc.html` (Popup, Popup · Locked).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `quick-access.tab` (Steam sign-in, Steam Guard prompt, Another site) | the fill banner and whether Enter fills | the active tab, from the content script | `useQuickAccess` |
| `DEMO_ACCOUNT_PASSWORD` (`demo`) | the locked-account prompt for a sample | none: a vault account opens with its own key | `useAccountGate` |

The accounts, the vault session and the master password come from the `accounts.list` (One locked, Empty) and `vault.session` (Locked, New vault) mocks. "No results" is reached by typing.

Unwired intents: the fill (the banner and Enter show "Filled" for 1.5s, nothing reaches the tab), the clipboard writes of the password (the demo value), a real tab address.
