# backups

The open vault's Drive backups (`@so/core` `drive/backups.ts`), the restore dialog and the state without Drive. Also owns `SyncStatus`, the Drive sync indicator (the shell re-exports it for the topbar).

- Desktop: history card beside a side block (Google identity, vault line, Auto backup / Auto sync, "More in Settings"). Phone: compact rows with icon buttons.
- Restore is `useQueryOverlay('restore')` with the backup id as its value, so a deep link `?restore=<id>` opens it. An unknown id closes it.
- The list lives in `stores/useBackupList.ts`, held with the vault and Google account it was read for, so another one never sees it; `useBackupCount()` (the facade) gives Settings its length and lists once when nothing is held.
- The history lists this vault's backups through `useDrive().run`, again on each visit (the page is resident) and when the vault or the Google account changes; an answer, a save or a pending row for another one never lands, and a failed refresh replaces the rows with its error and Retry. Backup now saves `useVaultSession().snapshot()` with a pending row on top, and gives up if the vault or account changed while the write queue drained; it is blocked while saving, without a connected Drive, in error or offline. Delete is optimistic: a failure puts the row back, a backup already gone counts as deleted. Failures read through `useDriveProblem()`.
- Restore asks no password: the session's key opens this vault's backups. It reads the backup with that key and hands its records to `useVaultSession().replaceRecords`: stamped now, tombstones for what the backup lacks, in one write.
- Without Drive (`disconnected`) the page shows the vault as this device only, with Connect Google Drive.
- The Google account and its state come from `useDrive()` (`#features/drive`): an expired sign-in shows as the error state with Sign in again, no network as offline, ahead of what the sync mock says. Disconnect revokes the token.
- "More in Settings" opens the Sync & backup section through `useSettingsLink()` from `#core` (settings imports features, so backups never imports it).

## Mocks

Mockup: `Backups.dc.html` (Backups · Desktop, Backups · Mobile, Restore backup · Dialog, Backups · Device vault).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `backups.sync` (Synced, Syncing, Error, Offline) | topbar `SyncStatus`, `BackupStatusAlert`, "Backup now" gate | Drive sync engine | `useSyncStatus` |

Unwired intents: Export file, the Auto backup and Auto sync switches (local refs).
