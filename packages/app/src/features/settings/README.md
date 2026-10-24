# settings

Desktop: a 960x660 window over the app (`?settings=<section>`, `useQueryOverlay`), nav on the left, the section on the right. Phone: the Settings tab shows the index, a section opens as its own screen (`/settings/:section`, no tab bar). Crossing the `lg` breakpoint carries the open section over (`useSettingsLayoutSync`).

- `registry.ts` lists the sections in nav order; `useSettingsSections` adds their copy. A section is `sections/<name>/<Name>Section.vue` plus its `use<Name>Section.ts` view-model, registered in `sections/index.ts`; Bots is listed as Soon and shows `SectionPending`.
- Appearance is complete and real: `sections/appearance/` drives the nine knobs of `core/appearance` (`.claude/rules/appearance.md`). The background picture stays in `localStorage` for now and moves to IndexedDB later; only `core/appearance/background.ts` changes.
- Security, Sync & backup, Fields, Vault and Steam are built on mocks. What the user edits (lock timeout, switches, sync interval, field secrecy, API key, site grants) lives in `stores/settingsStore.ts`, so the sections and the phone index read the same values; each part moves to its owner when wired. Data other features own is read through `composables/sources/` (one composable per source, the only readers of `mocks.ts`).
- Security is the one section with separate phone markup (`SecurityMobile`, the mockup's grouped cards); the others reflow through `FpFormRow` (`inline` keeps a switch beside its label on phones).
- Two dialogs bound to an action in flight, so local state and not URL overlays: `dialogs/password/` (Change master password, opened from Security) and `dialogs/reset/` (Reset vault in three steps and a 1.6 s hold, opened from Vault). Each restarts its flow when it opens.
- `services/` holds the framework-free rules with tests: `passwordChange` (strength comes from `core/passwordStrength.ts`, shared with onboarding), `vaultReset`, `fieldSecrecy`.
- The shell and features that link into a section call `useSettingsEntry()` (`open(section?)`); the facade exports `SettingsHost`, `useSettingsEntry`, `settingsRoutes` and `SectionKey`. `SettingsHost` loads the window, sections included, as its own chunk on the first desktop open.

## Mocks

Mockup: `Settings.dc.html` (Settings · Desktop, Settings · Mobile, Settings · Mobile · Security, Reset vault · Dialog, Change master password · Dialog).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `settings.about` (Update available, Up to date) | nav footer: version and "Update to" link | build version, update check | `useAboutApp` |
| `settings.vault` (Main vault, Long name, Empty vault) | Vault info card, reset consequences, phone index vault name | vault records: name, accounts, Guard authenticators, created date | `sources/useVaultInfo` |
| `settings.google` (Alex Kim, Long identity) | Sync identity card, "Synced N min ago" line on the sync card and the phone index | backups feature's Drive sign-in and sync | `sources/useDriveSync` |
| `settings.backups` (Seven backups, One backup, None) | Backup history line, "also delete N backups" in reset | backups feature's backup list | `sources/useBackupsInfo` |
| `settings.steam` (Firefox key set, Chromium all allowed, No key) | API key, "Works" mark, site Allowed / Allow, Firefox note | vault's stored key and a Steam key check; browser site permissions and the browser kind (`Platform` has none yet) | `sources/useSteamAccess` |

Local state until the owners exist, all in `stores/settingsStore.ts`: lock timeout, master password after restart, PIN and biometrics flags, Google connected flag, Auto sync, interval, Auto backup, Sync now (1.2 s), field secrecy defaults, API key edits, allowed sites. They start at the mockup's values and are not persisted.

Unwired intents: "Update to ..." in the nav footer, Lock vault on the phone vault card, PIN Change (setup flow), Rename, Export, Import, and the done step of Reset vault ("Import a file", "Create new vault" only close the dialog). The reset's final hold finishes locally without touching a vault. Change master password rewraps the open vault through `useVaultSession().changePassword`; with no real vault open it takes the demo `demo`.
