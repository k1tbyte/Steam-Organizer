# drive

The Google account this device backs up to, and the way to Drive under it. Backups, the onboarding restore and Settings read it; the files themselves are theirs. Requests live in `@so/core` (`drive/`: `driveApi`, `DriveError`, `GOOGLE_CLIENT_ID`, `DRIVE_SCOPE`, `googleToken`).

- `useDrive()`: `account` (name, email, kept per device under `DRIVE_ACCOUNT_STORAGE_KEY`; the token never is), `state` (`disconnected`, `connected`, `expired`, `offline`), `prepare()` (called by a view with a sign-in button: the web loads Google's script ahead, so the window opens on the click), `connect()` (from a click: Google may open its window), `disconnect()` (revokes the token), `run(work)` (Drive under a token renewed silently where the shell can, at expiry too; a refused one, or a silent one for another Google account, turns `expired`). Mock samples never reach the real connection.
- Each shell signs in its own way through `Platform.google`: the web with Google Identity Services (a token only from a click, so after a reload or an hour it shows `expired` until Sign in again), the extension with `identity.launchWebAuthFlow` (silent while the Google session lasts, the token shared by the app page and popup in `storage.session`). The autofill content script has none.
- Scope `drive.appdata`: only the app's hidden folder, never the user's files.

## Mocks

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `drive.connection` (Alex Kim, Long address, Sign-in expired, Offline, Not connected) | Settings identity card and status, Backups side block, the expired alert | live: the stored account and token state; the mock shows the states in mock mode | `useDrive` |
