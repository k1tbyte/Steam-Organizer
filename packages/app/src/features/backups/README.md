# backups

Drive backup history, the restore dialog and the device-only vault state. Also owns `SyncStatus`, the Drive sync indicator (the shell re-exports it for the topbar).

- Desktop: history card beside a side block (Google identity, vault line, Auto backup / Auto sync, "More in Settings"). Phone: compact rows with icon buttons.
- Restore is `useQueryOverlay('restore')` with the backup id as its value, so a deep link `?restore=<id>` opens it. An unknown id closes it.
- "Backup now" is blocked while saving, in error or offline.
- "More in Settings" opens the Sync & backup section through `useSettingsEntry().open('sync')`.

## Mocks

Mockup: `Backups.dc.html` (Backups · Desktop, Backups · Mobile, Restore backup · Dialog, Backups · Device vault).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `backups.sync` (Synced, Syncing, Error, Offline) | topbar `SyncStatus`, `BackupStatusAlert`, "Backup now" gate | Drive sync engine | `useSyncStatus` |
| `backups.history` (Seven backups, One backup, None on Drive, Long custom names) | history rows, backup now, delete confirm, restore summary | Drive backup list | `useBackupHistory` |
| `backups.vault` (Main vault on Drive, Farm, this device only) | side block vault line, device-only state | the active vault | `useBackupsVault` |
| `backups.drive` (Alex Kim, Long address) | side block identity, phone address line | Google sign-in | `useDriveAccount` |

Unwired intents: Sign in again, Disconnect, Move to Google Drive, Export file, the Auto backup and Auto sync switches (local refs), backup, delete and restore (act on mock data only; the restore password is the demo `demo`).
