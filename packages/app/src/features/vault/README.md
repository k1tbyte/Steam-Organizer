# vault

First-run onboarding and the unlock screen. Both render outside the shell (bare routes).

- `useVaultSession` (store) owns the session over `@so/core`: the vaults on this device (`load()`, from IndexedDB), the unlocked vault's key, and the state: `new` (none stored), `locked`, `unlocked`. `unlock(credential, vaultId)` unwraps a key and answers `opened`, `wrong` or `unreadable` (a damaged or newer file); `open()` turns the state after the opening animation; `create(name, password)` stores a vault and opens it in one step; `transact(change)` writes the records `change` returns, read and sealed in one queue with every other write, so none restores an older file; `contents` holds the open vault's records with their data parts opened; `changePassword` rewraps the open vault (in the queue); `verify` checks the open vault's password; `lock()` drops the key. A vault it does not store (mock mode, the Drive restore) takes the demo credentials: PIN `123456`, password `demo`, Hello waits 1.3s.
- Only the app's guard and the popup call `load()`: the autofill entry runs on a Steam page, whose IndexedDB is not ours.
- `installVaultGuard(router)` (called by `router.ts`) waits for `load()`, then sends a route to its home by state (`new` -> `/welcome`, `locked` -> `/unlock`, `unlocked` -> `/`) from `meta.vaultAccess`, and moves the open page when the state changes. The shell route allows only `unlocked`.
- Onboarding is one flow with the step in the URL: `/welcome` -> `/welcome/vault` -> `/welcome/password` -> `/welcome/steam`; `/welcome/restore` branches from Welcome. The draft (name, location, master password) lives in `useOnboardingDraft`, provided by `OnboardingLayout`. The last step (Steam access) creates the vault on this device, so leaving the flow earlier stores nothing; a successful restore opens the demo session.
- Unlock: Windows Hello, PIN (desktop keyboard, phone `PinKeypad`) and master password. Three wrong PINs disable the PIN (`services/pinAttempts.ts`). A stored vault lists the master password only until PIN and Hello slots exist.
- `core/passwordStrength.ts` scores the master password (shared with Settings) for the kit `FpSegmentedMeter`.

## Mocks

Mockup: `Onboarding.dc.html` (Welcome, Vault, Master password, Restore from Drive, Steam access, Unlock, Unlock · Mobile).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `vault.session` (Unlocked, Locked, New vault) | the guard, Welcome / Unlock routing, rail Lock | live: the vaults in IndexedDB; the mock shows the states in mock mode | `useVaultSession` |
| `vault.list` (Three vaults, One vault, Password only) | vault picker, unlock methods | live: the stored vaults; the mock keeps Drive, folder, PIN and Hello in mock mode until they exist | `useUnlock` |
| `vault.drive` (Alex Kim) | Google account row in the Vault step and Restore | Google sign-in | `useVaultStep`, `useRestore` |
| `vault.backups` (Latest and six more, Only one, None) | Restore card, empty state | Drive backup list | `useRestore` |
| `vault.folders` (Supported, Not in this browser) | Folder option and its "Not available in this browser" note | `showDirectoryPicker` probe is live; the mock overrides it | `useVaultStep` |

Unwired intents: Import encrypted file, Get the extension, Switch Google account, Other backups, Sign in with Google, Choose folder, Grant Steam access, Add vault, Remove from this device, Reset vault, the restore (demo password). The Vault step's choice is not kept: every vault is created on this device. The session does not survive a reload (the lock policy), and a deep link to a later onboarding step is not blocked (the Steam step sends one without a password back to it).
