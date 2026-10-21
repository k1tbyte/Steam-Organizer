# vault

First-run onboarding and the unlock screen. Both render outside the shell (bare routes).

- `useVaultSession` (store) holds the session state: `new`, `locked` or `unlocked`. `lock()` flips to `locked`, `open()` to `unlocked`; the `vault.session` mock picks the state until a real vault exists.
- `installVaultGuard(router)` (called by `router.ts`) sends a route to its home by state (`new` -> `/welcome`, `locked` -> `/unlock`, `unlocked` -> `/`) from `meta.vaultAccess`, and moves the open page when the state changes. The shell route allows only `unlocked`.
- Onboarding is one flow with the step in the URL: `/welcome` -> `/welcome/vault` -> `/welcome/password` -> `/welcome/steam`; `/welcome/restore` branches from Welcome. The draft (name, location) lives in `useOnboardingDraft`, provided by `OnboardingLayout`. Opening the app is the last step (Steam access) or a successful restore.
- Unlock: Windows Hello, PIN (desktop keyboard, phone `PinKeypad`) and master password. Three wrong PINs disable the PIN (`services/pinAttempts.ts`). Demo credentials: PIN `123456`, password `demo`, Hello waits 1.3s.
- `services/passwordStrength.ts` scores the master password for the kit `FpSegmentedMeter`.

## Mocks

Mockup: `Onboarding.dc.html` (Welcome, Vault, Master password, Restore from Drive, Steam access, Unlock, Unlock · Mobile).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `vault.session` (Unlocked, Locked, New vault) | the guard, Welcome / Unlock routing, rail Lock | the encrypted vault on this device | `useVaultSession` |
| `vault.list` (Three vaults, One vault, Password only) | vault picker, unlock methods | vaults registered on this device | `useUnlock` |
| `vault.drive` (Alex Kim) | Google account row in the Vault step and Restore | Google sign-in | `useVaultStep`, `useRestore` |
| `vault.backups` (Latest and six more, Only one, None) | Restore card, empty state | Drive backup list | `useRestore` |
| `vault.folders` (Supported, Not in this browser) | Folder option and the Firefox note | `showDirectoryPicker` probe is live; the mock overrides it | `useVaultStep` |

Unwired intents: Import encrypted file, Get the extension, Switch Google account, Other backups, Sign in with Google, Choose folder, Grant Steam access, Add vault, Remove from this device, Reset vault, and the real create / restore / unlock (credentials are compared to the demo values). The session is not persisted across reloads, and a deep link to a later onboarding step is not blocked.
