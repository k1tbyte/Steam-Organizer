# autofill

The UI the extension injects into Steam login pages: a button in the login field that opens the account picker, and a prompt above the Steam Guard boxes. `mountAutofill` (`@so/app/autofill`) mounts `AutofillApp` in a content script's shadow root, which carries the appearance attributes (`host`).

- `services/classify.ts` decides what a page asks for from extracted field attributes: a login (the first visible password field and the text field before it) or a Guard code (a run of four or more single-character boxes, or one field hinted as a one-time code). Guard wins over a visible login form. Pure, node-tested.
- `services/placement.ts` puts the floats: below the login field or above the Guard boxes, flipping when the side is too short, kept inside the viewport. Pure, node-tested.
- `useHostPage` is the only DOM glue: it scans the page (debounced MutationObserver), and fills fields by setting the value and dispatching `input` and `change`, which React inputs accept from the isolated world.
- The picker is `quick-access`'s `PickerList` in a compact skin; Enter or a click fills the login and password, then the Guard prompt follows with the code of the account just filled.
- The shadow root is closed, so the page cannot click the controls or read them; outside-click detection goes through the host (`getRootNode().host`). Controls here take an `aria-label` and no `tip()`: the injected UI mounts no `FpTooltipHost`, whose bubble would portal to the page body, outside the shadow root and its styles.
- A website never takes a password: a locked vault, no vault or a locked account shows a notice with a button that opens the extension (`Platform.openApp`), where the password is typed.

## Mocks

Mockup: `Extension.dc.html` (Autofill · Account picker, Autofill · Steam Guard).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `accounts.list`, `vault.session` (shared) | the picker, the notices, the Guard account | the vault | `useVaultAccounts`, `useVaultSession` |
| `DEMO_STEAM_PASSWORD` (`accounts`) | the password a fill types | the decrypted account | `useAccountPassword` |

A content script reads the host page's `localStorage`, so a mock variant is picked by writing `so:mocks` on the Steam page; dev builds only.

Unwired: the account the Guard prompt belongs to (the last fill is kept in memory; a fresh page falls back to the first account with an authenticator, to be kept in session storage), the live vault in the content script (it reads its own state until the vault talks to the background).
