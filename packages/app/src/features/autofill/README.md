# autofill

The UI the extension injects into Steam login pages: a button in the login field that opens the account picker, and a prompt above the Steam Guard boxes. `mountAutofill` (`@so/app/autofill`) mounts `AutofillApp` in a content script's shadow root, which carries the appearance attributes (`host`). The content script holds no key and no record: the vault host answers it (below).

- `services/classify.ts` decides what a page asks for from extracted field attributes: a login (the first visible password field and the text field before it) or a Guard code (a run of four or more single-character boxes, or one field hinted as a one-time code). Guard wins over a visible login form. Pure, node-tested.
- `services/placement.ts` puts the floats: below the login field or above the Guard boxes, flipping when the side is too short, kept inside the viewport. Pure, node-tested.
- `useHostPage` is the only DOM glue: it scans the page (debounced MutationObserver), and fills fields by setting the value and dispatching `input` and `change`, which React inputs accept from the isolated world.
- The picker is `quick-access`'s `PickerList` in a compact skin over the host's rows (`useAccountPicker(vault.accounts)`); Enter or a click fills the login and password, then the Guard prompt follows with the code of the account just filled.
- The shadow root is closed, so the page cannot click the controls or read them; outside-click detection goes through the host (`getRootNode().host`). Controls here take an `aria-label` and no `tip()`: the injected UI mounts no `FpTooltipHost`, whose bubble would portal to the page body, outside the shadow root and its styles.
- A website never takes a password: a locked vault or no vault shows a notice with a button that opens the extension (`Platform.openApp`), where the password is typed. An account with its own password is never filled from the page: its notice says to fill it from Steam Organizer in the toolbar, where the popup's account gate asks the password and fills the tab (login and Guard code).

## The vault host

`@so/app/vault-host` (`mountVaultHost(platform, serve)`) mounts a render-nothing root (`VaultHost.vue`) on a detached element through `createEntry`, so composables keep their `inject` and `i18n`. Its setup calls `session.load()`, `useAutoLock({ hidden: true })` and `useAutofillHost(serve, autoLock)`: one more page of the session, restoring the kept session, locking when another page locks and holding the idle deadline with no app tab or popup open. The shell hands in its transport as `serve(handler)` (not through `Platform`): Chrome and Edge run it in an offscreen document, Firefox in the background page (see `architecture.md` 6).

- `useAutofillHost` answers from `useVaultSession`, `useVaultAccounts` (projected to `PickerAccount`), `useAccountCredentials` and `useGuardCodes`. Before every answer it calls `autoLock.check()` (policy and shared `lastActive` read again, a passed deadline or Immediately locks) and `session.refreshOpen()` (the open vault's stored file read again: an edit, deletion, password change or new account lock made by another page opens the records again with the held key and drops the held record keys). It refuses `account-locked` for any account with its own password: those open per page (`recordKeys`), so an unlock in the popup or the app never reaches the host, and a restored vault or a last-fill record is never an unlock. It keeps no decrypted secret beyond the session's own; a fill (a login or a code) is stamped as activity (`useAutoLock().touch()`).
- The last fill per tab lives in the session area (`so:autofill:tab:<id>`, an account id, not secret), so a suspended host still knows it. It is a `sessionBound` value from `#features/vault`: the lock removes it in whichever page locks, so a host asleep through a lock and an unlock never names the old account. The background removes a tab's entry when the tab closes.
- Every fill (the picker, the Guard prompt, the popup) makes the written fields bounce, the Guard boxes in a wave (`useHostPage`): Web Animations on the page's own inputs, nothing injected into its CSS, timed by the motion tokens read from the shadow host, so Off shows none.
- A pick, and each opening or closing of the picker, drops the answer still pending for an earlier pick: a slow answer never overwrites a later choice.
- `useAutofillVault` is the content script's only way to the vault, over `Platform.vaultHost`: `state`, `accounts`, `guardFor`, `login(id)` and `code(id)`, refreshed when the picker opens, when a Guard prompt shows and after a refusal. A stale answer (the picker closed, the target changed, a newer refresh) is dropped. A password or a code is the answer to one fill and never sits in a ref, a store or a log; `useAutofill`, `useLoginPicker`, `useLockNotice` and `GuardPrompt` read it, never the stores. Out of reach reads as a locked vault.
- `useTabRequests` answers the popup (`Platform.onTabRequest`): `tab:context`, `tab:fill-login` and `tab:fill-code` fill through `useHostPage`; a login fill the popup made is reported to the host (`autofill:filled`).

### Messages

Content script to host (`model.ts`, parsed in `services/messages.ts`; the tab is the sender's `sender.tab.id`, never a field):

| Message | Answer |
|---|---|
| `autofill:state` | `{ state: 'new' \| 'locked' \| 'unlocked', accounts: PickerAccount[], guardFor?: id }`; `guardFor` is the account last filled on this tab, else the first with an authenticator |
| `autofill:login { id }` | `{ login, password }` or `{ refused: 'locked' \| 'account-locked' \| 'gone' }`; records the tab's last fill and stamps activity |
| `autofill:code { id }` | `{ code }` or `{ refused }` (`gone` also for an account with no authenticator) |
| `autofill:filled { id }` | `{}`; records a fill the popup made on this tab |

The popup's `tab:*` messages are owned by `quick-access` (`model.ts`). `PickerAccount` carries what the picker renders and searches and nothing else (no notes, phone, email, Steam snapshot); a locked account's `login` is empty.

### Trust

- The background (Chrome) or the host (Firefox) answers an `autofill:*` message only from this extension's content script on a Steam login page: `sender.id === runtime.id`, `sender.tab`, top frame, URL under the content script's `matches` (`apps/extension/utils/steamPages.ts` is the one list for both; `senders.ts` is the pure check).
- The content script takes `tab:*` only from this extension's pages (`sender.id === runtime.id`, no `sender.tab`); the offscreen host takes only messages the background forwards. A web page cannot reach `runtime.onMessage` (no `externally_connectable`). Chrome ignores a promise returned from `onMessage`: answers go through `sendResponse` with `return true`.

## Mocks

Mockup: `Extension.dc.html` (Autofill · Account picker, Autofill · Steam Guard).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `accounts.list`, `vault.session` (shared) | the picker, the notices, the Guard account | the vault host's answers | `useAutofillHost` (`useVaultAccounts`, `useVaultSession`) |

Mock mode runs through the host: the vault host's `localStorage` (the extension origin, where the app and the popup write the `so:mocks` flag) picks the variants, so the samples, the demo password and the demo Guard code come from the host's answers. The content script reads no flag of its own; dev builds only.
