# settings

Desktop: a 960x660 window over the app (`?settings=<section>`, `useQueryOverlay`), nav on the left, the section on the right. Phone: the Settings tab shows the index, a section opens as its own screen (`/settings/:section`, no tab bar). Crossing the `lg` breakpoint carries the open section over (`useSettingsLayoutSync`).

- `registry.ts` lists the sections in nav order; `useSettingsSections` adds their copy. A section is `sections/<name>/<Name>Section.vue`, registered in `sections/index.ts`. Security, Sync & backup, Fields, Vault and Steam show `SectionPending` until their feature fills the folder; Bots is listed as Soon.
- Appearance is complete and real: `sections/appearance/` drives the nine knobs of `core/appearance` (`.claude/rules/appearance.md`). The background picture stays in `localStorage` for now and moves to IndexedDB later; only `core/appearance/background.ts` changes.
- The shell and features that link into a section call `useSettingsEntry()` (`open(section?)`); the facade exports `SettingsHost`, `useSettingsEntry`, `settingsRoutes` and `SectionKey`.

## Mocks

Mockup: `Settings.dc.html` (Settings · Desktop, Settings · Mobile, Settings · Mobile · Security).

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `settings.about` (Update available, Up to date) | nav footer: version and "Update to" link | build version, update check | `useAboutApp` |
| `settings.summary` (Main vault) | phone index: row values, vault card with sync line | each section's own setting, vault name, sync status | `useSettingsSummary` |

Unwired intents: "Update to ..." in the nav footer, Lock vault on the phone vault card, every section body but Appearance.
