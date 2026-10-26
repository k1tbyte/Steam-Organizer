# Steam Organizer - Features (v3)

What the product does, per surface. No visual design. Architecture: [architecture.md](architecture.md).

Tags: `[new]` - not in legacy app, `[no web]` - needs Steam API (extension/desktop only), `[later]` - parked.

---

## 1. Surfaces

| Surface | What it is |
|---|---|
| Extension app page | Main client. Full UI in a browser tab (Chrome, Edge, Firefox) |
| Extension popup | Quick access from the toolbar, small fixed size |
| Autofill overlay | UI injected into Steam login pages |
| Web PWA | Same UI as app page, Steam data read-only, installable |
| Mobile | Firefox Android (app page and popup open full screen) + web PWA on phones → every screen works on narrow widths |
| Desktop `[later]` | Same UI in a chromeless window with custom title bar: drag region, minimize, maximize/restore, close; autofill popup over other apps (see 10) |
| Obsidian plugin `[later]` | Same UI inside an Obsidian view; accounts also visible as notes and `.base` views |

---

## 2. Onboarding and Vault

- First run: create vault - name, location (this device / Google Drive / folder) `[new]`, master password with warning that it can't be recovered.
- Several vaults: picker on unlock screen, add / remove vault `[new]`.
- Or restore from Google Drive: sign in, see latest backup (date, account count), enter its password.
- Or import from an encrypted file.
- Unlock screen: master password, PIN `[new]` or biometrics `[new]`; wrong password / PIN feedback.
- Lock manually; auto-lock by user policy `[new]`.
- Reset vault when password is forgotten (destructive, multi-step confirm).
- Change master password `[new]`.
- Steam API key prompt when Steam data is needed, with link to Steam key page.
- Extension: grant access to Steam sites (Firefox asks separately), shows grant state `[new]`.
- Web: read-only notice + "get the extension" call to action `[new]`.

---

## 3. Accounts List

- Card grid, virtualized (thousands of accounts).
- States: loading, empty ("add account"), no results.
- Card: avatar, nickname (an alias, with the Steam nickname small and grey beside it), level, account age, copyable account ID, ban indicators or "no bans", Steam Guard code copy (if authenticator), open profile, delete.
- Delete: the card's trash removes at once, the menus and the batch ask first; a toast offers Undo for 8 s `[new]`.
- Card hints: added / updated / registration dates, note preview, ban details.
- Anonymous accounts (no Steam ID): credentials and Steam Guard only.
- Search in a chosen field: nickname, login, note + any field the user moved out of secrets (phone, email) `[new]`.
- Locked accounts show a lock mark; their secrets are not searchable `[new]`.
- Ban filters: VAC, game, community, economy - each require / exclude / ignore.
- Tags: colored labels on a card, picked or created from the card, its menu or the profile; a batch in edit mode sets each tag on all, none or as it was. Tag filter: any or all of the picked tags `[new]`.
- Sort: none, created, added, last update, level; ascending / descending.
- Search, filter and sort state is remembered.
- Pin / unpin (unpin returns to previous position).
- Edit mode: drag and drop within pinned / unpinned group; search, ban and tag filters apply, the sort waits; pick several (click, Shift+click, select all, a rectangle on desktop), drag them as one stack, act on them in batch (pin, unpin, tags, refresh, export, delete).
- Bulk refresh of accounts older than 1h: progress, stop, summary (done / already fresh / failed) `[no web]`.
- Toolbar: add account, import, export, refresh.

---

## 4. Add Account

- Name (alias): required without a Steam profile `[new]`.
- Login, password, optional Steam identifier in any format: account ID, SteamID64, Steam2, Steam3, CS2 friend code, hex, profile URL, vanity name.
- Validation, duplicate check (ID, login).
- With identifier: Add waits for the Steam lookup, which resolves every format to the SteamID64 and saves it with the profile data; an ID Steam does not find blocks Add. An account has a Steam ID with its data, or neither (anonymous) `[no web]`.
- Web adds anonymous accounts only: no Steam lookup there, the identifier field points to the extension or desktop `[new]`.
- Optional: import Steam Guard authenticator (maFile) `[new]`: checked against Login, fills an empty Login (and Steam ID outside web).

---

## 5. Account Profile

### Header
- Avatar, nickname, level, added date, last update, profile visibility (public / friends only / private), bans summary.
- Refresh account `[no web]`.
- Steam ID in a selectable format (account ID, SteamID64, Steam2, Steam3, CS2 friend code, Steam3 hex, vanity), copy. Selected format is remembered.
- Links: Steam profile, SteamDB calculator, profile pages (games, friends, inventory, badges, groups).

### Summary tab
- Community: years of service, registration date; games total, played count and %, total playtime, collection badge, paid games, library value.
- Credentials (see 6).
- Note, up to 200 chars.
- Bans: VAC, game, community, trade - counts, time since last ban, trade probation / ban.
- Collapsible sections, state remembered.

### Games tab
- Virtualized list: image, name, price, app ID, playtime.
- Search by name; sort by price, name, ID, playtime; ascending / descending.
- Cached first, then fetched `[no web]`. States: loading, empty library, no results.

### Friends tab `[new]`
- Friend list: avatar, nickname, friend since, open profile; friend count.

### Steam Guard `[new]`
- Import a maFile from the profile header; a file without `shared_secret` (an encrypted SDA one) or for another login is refused and says why.
- Current code with 30s countdown, copy.
- Authenticator details: revocation code (reveal), remove authenticator (shows the revocation code, asks to confirm it is saved).

### Locked account `[new]`
- Set / change / remove own password on an account (any length).
- Recovery via master password: on by default, switch per account. "Forgot password" with recovery off: says recovery is disabled for this account, secrets can't be restored.
- Choose what is hidden behind it: credentials only, or everything except nickname and avatar.
- Unlock to view secrets; re-locks on leaving the account and on vault lock.

### Anonymous account
- Credentials, note and Steam Guard only.

---

## 6. Credentials

- Steam: login (copy), password (reveal, copy, edit), phone (copy, edit).
- Linked services (up to 7, each once per account) from a registry: a built-in gaming set (Email, Discord, FACEIT, Epic Games, Battle.net, Ubisoft, EA, Rockstar Games, Riot Games, Twitch, Xbox, PlayStation) and the user's own with an optional SVG icon `[new]`. A deleted service's credentials stay, shown as Other.
- Group fields, any combination: login, email, password, secret word, phone. Edit, copy, delete group (confirm).
- Validation: password ≥ 6 chars, phone ≥ 8 digits, email format.

---

## 7. Backups and Sync (Google Drive)

- Connect / disconnect Google account; shows name, email, avatar.
- Backup history: name, date. Restore: shows date, account count, size; asks backup password if it differs. Delete (confirm).
- Backup now `[new]`.
- Auto backup after changes (setting).
- Auto sync: check Drive on focus, interval and "sync now" `[new]`; newer cloud copy replaces local.
- Status: saved, syncing, error, offline.

---

## 8. Export / Import

- Export the whole vault to an encrypted file (own password).
- Import an encrypted file: replaces vault, warning first.

---

## 9. Extension Popup

- Unlock (shared with app page for the browser session).
- Search accounts, pinned first.
- Per account: copy login, copy password, Steam Guard code with countdown, open in app.
- Fill current Steam login page.
- Locked account: asks its password before copy / fill.
- Open full app, lock.

---

## 10. Autofill on Steam Login Pages

- Detects login form on Steam store / community / help pages and the Steam Guard code prompt.
- Account picker next to the form, with search.
- Fills login + password, then Steam Guard code if authenticator exists.
- Locked vault or locked account: prompt to unlock.

### Desktop autofill `[later]`
- Windows first. Focus on a login, password or Steam Guard field in the Steam client opens a small popup next to the field: account picker with search, same as the extension's.
- Fills on click or hotkey: login + password, then Steam Guard code if authenticator exists.
- Same for game launchers with linked credentials: Epic, Battle.net, EA, Ubisoft.
- Fills only verified apps (signed by the expected vendor).
- Switch to an account Steam already remembers without typing.

---

## 11. Bots via ASF `[later]`

- Connect ASF: URL + IPC password, connection status.
- Link accounts to bots, push config.
- Bot list: status (offline / online / farming), current games, cards remaining.
- Start / stop / pause farming, idle chosen games.
- Confirmations: list, accept / deny.
- Login prompts answered from vault (password, TOTP).
- Desktop: run local ASF, import maFiles.

---

## 12. App Shell

- Navigation: Accounts, Backups, Bots `[later]`, Settings. Sidebar: hidden / compact / full; drawer on narrow screens.
- Header: offline indicator, refresh progress (remaining count, "99+"), save / sync status, settings.
- Toasts: info, warning, error, success; optional click action.
- Confirm for destructive actions; "copied" feedback.
- Modals: Esc closes, focus stays inside.
- Offline: local data works, Drive and Steam disabled with a notice.
- Steam errors: offline, no API key, invalid key, rate limit, server error.
- PWA: install, "update available" prompt `[new]`.
- 404 page.
- Desktop `[later]`: custom title bar.

---

## 13. Settings

- Steam API key (link to get one).
- Google account: connect / disconnect.
- Auto sync, auto backup.
- Change master password `[new]`.
- Security `[new]`: lock timeout (immediately … on browser restart, never), "master password on browser restart", unlock with PIN (set / change / remove), unlock with biometrics (enable / disable).
- Extension: Steam site access status / grant `[new]`.
- ASF connection `[later]`.
- Tags `[new]`: rename, recolor, create, delete (an unused tag at once, a used one asks first; Undo either way).
- Linked services `[new]`: add, rename, upload or remove an SVG icon (one color, follows the theme), delete with Undo; the built-in set listed read-only.
- Fields `[new]`: login, note, phone and email searchable or secret in every account; Apply moves them with progress (an interrupted move finishes later); nickname stays searchable, credentials secret; folder vault - which fields are visible in Obsidian notes.
- Danger zone: reset vault.
