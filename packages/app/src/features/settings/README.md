# settings

Desktop: a 960x660 window over the app (`?settings=<section>`, `useQueryOverlay`), nav on the left, the section on the right. Phone: the Settings tab shows the index, a section opens as its own screen (`/settings/:section`, no tab bar). Crossing the `lg` breakpoint carries the open section over (`useSettingsLayoutSync`).

- `registry.ts` lists the sections in nav order; `useSettingsSections` adds their copy. A section is `sections/<name>/<Name>Section.vue` plus its `use<Name>Section.ts` view-model, registered in `sections/index.ts`; Bots is listed as Soon and shows `SectionPending`.
- Appearance is complete and real: `sections/appearance/` drives the nine knobs of `core/appearance` (`.claude/rules/appearance.md`). The background picture stays in `localStorage` for now and moves to IndexedDB later; only `core/appearance/background.ts` changes.
- Tags is real: `sections/tags/` reads and writes through `useVaultTags` from `features/accounts` (rename, recolor, New tag, delete with Undo; a used tag asks first), and shows the accounts sample's tags with no vault open. Fields is real: `sections/fields/` drafts a placement over `useFieldPlacement` from accounts and moves every account's fields on Apply (progress, done, Finish after an interrupted move; `services/fieldSecrecy` holds the fixed fields and the moves). Linked services is real the same way: `sections/services/` over `useVaultServices` from `features/linked-services` (New service, rename, SVG icon upload or removal, delete with Undo, the built-in set read-only). Both name rows in place with `components/NameField.vue`.
- Steam's Web API key is the vault's (`useSteamKey` from `features/steam`, `sections/steam/useSteamKeyField.ts`): saved once the field is empty or holds a whole key, then checked against Steam for the Works mark or the reason it fails. The phone index reads the same key. Below it the store currency (`useSteamCurrency`), every Steam currency named by `Intl.DisplayNames`.
- Vault is real: the open vault's name, home and account count (`useVaultSession`, `tally` from `features/vault`), Rename in place with `NameField`, Export (`dialogs/export/`: the stored file, or rewrapped under its own password, saved as `<name>.sovault`), Import (`sections/vault/useImportVault.ts`: only this vault's file, read with the session's key and confirmed, then `replaceRecords`; another vault's file is refused), and Reset vault opens `ResetVaultDialog` from the vault feature.
- Security, Sync & backup, Fields and Steam's site access are built on mocks. What the user edits (lock timeout, switches, sync interval, site grants) lives in `stores/settingsStore.ts`, so the sections and the phone index read the same values; each part moves to its owner when wired. Data other features own is read through `composables/sources/` (one composable per source, the only readers of `mocks.ts`). The Drive backup count on the Sync line is `useBackupCount()` from `#features/backups`.
- Security is the one section with separate phone markup (`SecurityMobile`, the mockup's grouped cards); the others reflow through `FpFormRow` (`inline` keeps a switch beside its label on phones).
- `dialogs/password/` (Change master password, opened from Security) and `dialogs/export/` are bound to an action in flight, so local state and not URL overlays; each restarts its flow when it opens. Both take the master password, the new one with its strength and its repeat from `PasswordFields` (`usePasswordFields`).
- `services/` holds the framework-free rules with tests: `passwordChange` (strength comes from `core/passwordStrength.ts`, shared with onboarding), `fieldSecrecy`.
- The shell calls `useSettingsEntry()` (`open(section?)`) and provides it as `useSettingsLink()` (`#core`), which features link into a section with: settings imports them (Tags reads accounts, Linked services reads linked-services), never the reverse; the facade exports `SettingsHost`, `useSettingsEntry`, `settingsRoutes` and `SectionKey`. `SettingsHost` loads the window, sections included, as its own chunk on the first desktop open.

## Mocks

Mockup: `Settings.dc.html` (Settings · Desktop, Settings · Mobile, Settings · Mobile · Security, Change master password · Dialog).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `settings.about` (Update available, Up to date) | nav footer: version and "Update to" link | build version, update check | `useAboutApp` |
| `settings.steam` (Firefox, Chromium all allowed, Nothing allowed) | site Allowed / Allow, Firefox note | browser site permissions and the browser kind (`Platform` has none yet) | `sources/useSteamAccess` |

Local state until the owners exist, all in `stores/settingsStore.ts`: lock timeout, master password after restart, PIN and biometrics flags, Google connected flag, Auto sync, interval, Auto backup, Sync now (1.2 s), field secrecy defaults, allowed sites. They start at the mockup's values and are not persisted.

Unwired intents: "Update to ..." in the nav footer, Lock vault on the phone vault card, PIN Change (setup flow). Change master password rewraps the open vault through `useVaultSession().changePassword`; with no real vault open it takes the demo `demo`.
