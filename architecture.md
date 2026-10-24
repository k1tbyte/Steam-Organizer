# Steam Organizer - Architecture & Roadmap (v3)

## 1. Principles

- **No backend.** Steam is called only from CORS-free environments: browser extension (`host_permissions`) and desktop (Tauri native HTTP).
- **Web PWA is a read-only viewer**: Drive backups, credentials after unlock, field editing. No Steam API.
- **Full rewrite** React → Vue 3. Old vault/backup format is not supported.
- One Vue app, thin shells per platform. Shells never leak into each other's bundles.
- Feature list: [features.md](features.md).

---

## 2. Stack

| Area | Choice |
|---|---|
| UI | Vue 3 + TypeScript + Vite |
| Components | UI kit ported from author's other project (Vue + **Reka UI** + Tailwind v4), design system updated per new mockups |
| State / routing / i18n | Pinia, vue-router, vue-i18n |
| Virtual list | Port own VirtualScroller (grid + stack layouts) |
| Extension | **WXT** + `@wxt-dev/module-vue` |
| Desktop / mobile shell | Tauri v2 |
| Monorepo | pnpm workspaces + Turborepo |

---

## 3. Monorepo Layout

```
apps/
  web/         PWA shell: Vite + service worker, read-only
  extension/   WXT: app page, popup, background, autofill content script
  desktop/     Tauri v2 shell (src-tauri/) - parked
  obsidian/    Obsidian plugin shell - later
packages/
  core/        pure TS: crypto, models, Steam client, Drive sync, storage
  ui/          @so/ui: Fp* kit (Reka + Tailwind v4), tokens, theme engine
  app/         @so/app: features, core infra, router, i18n
```

- Dependencies point down: `apps/*` → `app` → `core`. No cycles.
- `core` has no Vue and no platform imports.
- `app` doesn't know its shell - it receives a `Platform` (see 4).
- The legacy React app lives in `artifacts/legacy` (local only) as reference.

---

## 4. Platform Abstraction

Each shell has its own entry and passes its adapter. Only that adapter is imported → other shells' code never reaches the bundle (no `VITE_IS_TAURI` flags).

```ts
interface Platform {
  fetch: typeof fetch | null        // null = Steam API unavailable (web)
  getGoogleToken(): Promise<string> // OAuth differs per shell
  openApp?(path: string): void      // popup and content script: open the full app at a route
}
```

| Shell | `fetch` | Google OAuth |
|---|---|---|
| web | `null` | Google Identity Services token client |
| extension | global `fetch` (host_permissions) | `identity.launchWebAuthFlow` |
| desktop | `@tauri-apps/plugin-http` | system browser + loopback redirect (PKCE) |

- Storage: IndexedDB in every shell (extension pages, WebView2/WKWebView). Extension requests `unlimitedStorage`.
- Drive via plain REST + token. No `gapi` - MV3 forbids remotely hosted code.

---

## 5. Targets

| Capability | Web | Extension | Desktop |
|---|---|---|---|
| Unlock vault, view/edit credentials | ✓ | ✓ | ✓ |
| Drive sync | ✓ | ✓ | ✓ |
| Steam Guard codes (TOTP from `shared_secret`) | ✓ local clock | ✓ | ✓ |
| Steam profiles, games, bans, prices | - | ✓ | ✓ |
| Steam login autofill | - | ✓ | ✓ Windows (see Desktop autofill) |
| Game launcher autofill (Epic, Battle.net, EA, Ubisoft) | - | - | ✓ Windows |
| Bots via ASF (see 9) | - | ✓ | ✓ |

### Extension browsers
- Chrome, Edge, Firefox (desktop + Android). Safari is not supported.
- Full UI opens as an extension page (WXT unlisted page), compact popup for quick access.
- Extension pages fetch Steam directly. Content scripts can't bypass CORS - they go through background.
- Firefox MV3: `host_permissions` are optional - app requests them via `permissions.request` and shows grant state.

### Desktop (parked)
Built after web + extension. Chromeless window with custom title bar (`data-tauri-drag-region`). Extras over extension: managing a local ASF, desktop autofill.

#### Desktop autofill (plan, Windows first)
Popup next to a focused login / password / Steam Guard field in other apps, like the extension's autofill picker.
- Detect: Rust side on a dedicated MTA thread, `SetWinEventHook(EVENT_OBJECT_FOCUS)` out of process, then UI Automation only for known windows: `ControlType` Edit, `IsPassword`, `ProcessId`, `BoundingRectangle`. Steam's CEF login window (class `SDL_app`, `steamwebhelper`) exposes its fields through UIA (SAM does the same via FlaUI).
- Screen signatures (login: 2 Edit, one `IsPassword`; Steam Guard: 5 one-char Edits) are data, not code: Steam updates break them.
- Popup: headless always-on-top Tauri window (same as a custom tray window) anchored to the field rect, rendering the shared account picker component.
- Fill only on user action (click or hotkey): `ValuePattern.SetValue` or `SendInput` with `KEYEVENTF_UNICODE`; Steam Guard typed into the first cell (it advances itself).
- Before typing a secret, verify the target process: image path + Authenticode signer (Valve, launcher vendor). No keyboard hooks (`WH_KEYBOARD_LL` reads as a keylogger to AV). Elevated windows are out of reach (UIPI) - fine for Steam.
- Not via Steam's CEF remote debugging (`.cef-enable-remote-debugging`): it opens an unauthenticated local DevTools port that hands the Steam session to any local process.
- Later: macOS AX API (`kAXFocusedUIElementChangedNotification`, `AXSecureTextField`, needs Accessibility permission). Linux: AT-SPI on X11 only, Wayland blocks input injection.
- Related: switch between accounts Steam already remembers without typing (`loginusers.vdf` + `AutoLoginUser`).

### Obsidian plugin (later)
Same Vue app mounted in an Obsidian view. Folder vault via Obsidian Vault API, Steam API via `requestUrl` (no CORS). Runs on Obsidian desktop, Android, iOS.

### Mobile
Firefox Android extension covers Android. iOS only via Obsidian plugin (later), Tauri mobile is parked.

---

## 6. Data & Encryption

- Master password is never stored.
- Extension: unlocked vault key is shared by app page, popup and autofill via extension storage (see lock policy). Content scripts get credentials only via background messages.
- Steam Web API key is stored inside the vault.

### Vault locations
User picks where each vault lives; several vaults, switch on unlock screen. Every client keeps a working copy in IndexedDB, the home is the source of truth.

| Home | Container | Own sync |
|---|---|---|
| This device | standalone file, kept in IndexedDB | none |
| Folder | Markdown notes, Obsidian Bases compatible | user's own (Obsidian Sync, git, Syncthing) |

Google Drive is a layer over either home, not a home of its own:

| Drive | This device | Folder |
|---|---|---|
| Backups (sealed standalone snapshots, history) | ✓ | ✓ |
| Sync (Drive holds the shared copy) | ✓ ("Google Drive" in onboarding) | - the folder's own sync owns it; a second channel would bring deleted records back |

- **Standalone file** (`VaultFile` in `@so/core`, format v1): `format`, `version`, vault `id`, `slots.password` (its KDF params + the wrapped vault key) + `body` sealed with the vault key = JSONL of records. Nothing readable without unlock: no record count, ids or timestamps. A reader stops at a version or record it does not know rather than drop it at the next write.
- **Folder**: `vault.md` header note + one note per record. Frontmatter (app-owned) = `public` fields + sealed `data` / `secret`; note body is user-owned and never touched. Note file name = nickname only if nickname is `public`, else record id.
- Folder writes: Chrome/Edge via File System Access API (web, extension page), Obsidian plugin, desktop. Not in Firefox (no API).
- `core` owns the model; each location is only a serializer + IO adapter.

### Keys (envelope encryption)
The **vault key** is a random 256-bit secret, held after unlock as a non-extractable HKDF root: records are sealed with an AES-GCM key derived from it (`records`), locked-account keys derive from it too. Unlock slots wrap (encrypt) the secret; an unlock unwraps it straight into the root, so it never sits in script memory:

| Slot | Wrapping key from | Stored |
|---|---|---|
| Master password | PBKDF2-HMAC-SHA256, 600k iterations, random salt → HKDF root → `slot:password` key (`recovery` later) | in vault file (synced) |
| PIN | PBKDF2 over PIN | this device only |
| Biometrics | WebAuthn PRF of a passkey (Windows Hello, Touch ID, Android) | this device only |

- Changing master password only rewraps the vault key and recovery slots of locked accounts (old KEK is at hand while the old password is typed), data is not re-encrypted. Rewrapping and enrolling a PIN are the only steps that hold the raw secret, behind the master password.
- PIN is low entropy → its slot never leaves the device (offline brute force).
- PRF in 2026: Windows Hello (Win 11 Feb 2026 update, Chrome/Edge 147+, Firefox 148+), macOS (Chrome 132+, Firefox 139+), Android passkeys. Extension pages: Chrome 122+, Firefox 150+.

### Lock policy (user setting, Bitwarden-like)
- Timeout: immediately, 1 / 5 / 15 / 30 min, 1 / 4 h, on browser restart, never.
- Vault key is a non-extractable `CryptoKey`: page JS can use it, not read it. `storage.*` can't hold a `CryptoKey` → to survive popup close / restart it is wrapped by a non-extractable device key in IndexedDB, wrapped blob kept in `storage.session` (until restart) or `storage.local` ("never", warned).
- Option "master password on browser restart": PIN slot kept in `storage.session` only.

### Records
A record is `{ id, updatedAt, data, secret? }`: a random `id` (UUID, not SteamID), two sealed parts. A deleted record stays as a tombstone (`{ id, updatedAt, deleted: true }`), so a sync tells a deletion from a record another copy never had.

| Part | Sealed with | Opened | Holds |
|---|---|---|---|
| `public` | - (plaintext) | - | folder vault only: fields the user picks for Obsidian |
| `data` | vault key | at unlock: list, search, sort | the record kind and everything shown or searched |
| `secret` | vault key, or account key (locked account) | on demand, reference dropped after use | credentials, authenticator, movable fields set secret |

Record kinds (`data.kind`, a number): `SETTINGS` (one per vault), `ACCOUNT`, `TAG`, `PRESET`. Facts are stored, not what is shown: age comes from `registeredAt`, anonymous from `steamId === null`, the avatar tint from `id`.

```ts
interface AccountData {
  kind: ACCOUNT
  alias?: string                // the user's name; required when anonymous. Shown as alias, then the Steam nickname small and grey
  steamId: string | null        // SteamID64; null = anonymous, credentials only
  tags: string[]                // TAG record ids
  pinned: boolean
  order: string                 // fractional index: a move rewrites only the moved record, syncs merge reorders
  addedAt: number
  guard: boolean                // has an authenticator (kept in secret)
  loginTag: string              // HMAC-SHA-256 of the trimmed lowercase login, 16 bytes, key derived from the vault root:
                                // the duplicate check on Add without opening any secret, locked accounts included
  editedAt: number              // last user edit; a refresh only moves steam.refreshedAt
  steam: SteamSnapshot | null   // the last refresh: nickname, avatar, level, registeredAt, visibility, vanity, bans, stats
  login?: string; note?: string; phone?: string; email?: string   // movable fields set searchable
}
interface AccountSecret {
  password: string
  login?: string; note?: string; phone?: string; email?: string   // movable fields set secret
  services: { kind; name?; fields: { kind; value }[] }[]          // linked credentials, up to 7
  authenticator?: { sharedSecret; identitySecret; revocationCode; maFile }
}
TagData      { kind: TAG; label; hue }               // one record per tag: renames touch one record, syncs merge tags one by one
SettingsData { kind: SETTINGS; fieldDefaults: Record<'login' | 'note' | 'phone' | 'email', 'searchable' | 'secret'> }
SettingsSecret { steamApiKey? }
PresetData   { kind: PRESET; name; appearance knobs; image? }   // synced appearance presets
```

- Movable fields: `login`, `note`, `phone`, `email`, one vault-wide placement (`fieldDefaults`, per-account placement skipped for now). Changing it moves (never copies) the field between parts in every account, after an explicit confirm in Settings. Nickname and alias always stay in `data`; password, linked credentials and authenticator always `secret`, never `public`.
- Appearance stays device-local and themes the lock screen. Presets sync through the vault; a device applies one only when the user picks it, or follows one it was set to auto-apply.
- Search and sort see only `public` + `data`.
- Payloads evolve by a tolerant reader: a missing field reads as its default, so adding one keeps the format version; renaming or removing one bumps it, with a migration at unlock.
- Sealing: AES-256-GCM, random IV, AAD = record id + part name (blobs can't be swapped between records). WebCrypto only, no compression - sealed parts don't compress.
- Same record format in every container; standalone additionally seals the whole body.

### Locked accounts
Own password on a single account, asked even in an unlocked vault. Any length (PIN or 50 chars) - crypto is the same, entropy is the user's choice.
- Random **account key** seals that account's `secret`. Slots wrap it, same as vault slots:
  - account password: HKDF(vault key, PBKDF2(account password)) → needs both.
  - recovery (on by default, per-account switch; off = slot deleted, on again = account unlocked + master password): HKDF(master password KEK, "recovery"). KEK is dropped after vault unlock (only vault key stays in memory), so this slot needs the master password typed again - PIN / biometrics can't open it.
- Changing account password only rewraps the account key.
- Re-locks on leaving the account and on vault lock.
- Scope "everything except nickname and avatar": `data` keeps only `kind`, `alias`, the Steam nickname and avatar, `order`, `pinned`, `addedAt`, `loginTag`; the rest moves into `secret` under the account key, the same move as a movable field. The list shows it as a placeholder with the lock mark.

### Sync
1. Local change → encrypt → push to Drive with timestamp.
2. Clients check Drive on focus, manual sync or interval.
3. Merge by record: newer `updatedAt` wins per account, deletions kept as tombstones. Concurrent edits of different accounts never conflict. Inside one account, after opening both copies, the user fields come from the newer `editedAt` and `steam` from the newer `refreshedAt`: a bulk refresh on one device never overwrites a note edited on another.
4. Tombstones are purged with the sync (to do): older than N days once every copy synced past them; a copy offline longer than that can bring a deleted record back.

---

## 7. Steam Data (replaces old backend)

The old backend aggregated these calls and cached prices server-side for all users. Now `core` does it per client.

| Data | Endpoint |
|---|---|
| Summaries (≤100 ids) | `ISteamUser/GetPlayerSummaries/v2` |
| Bans (≤100 ids) | `ISteamUser/GetPlayerBans/v1` |
| Games | `IPlayerService/GetOwnedGames/v1` |
| Level | `IPlayerService/GetSteamLevel/v1` |
| Friends | `ISteamUser/GetFriendList/v1` |
| Vanity URL | `ISteamUser/ResolveVanityURL/v1` |
| Server time (TOTP) | `POST ITwoFactorService/QueryTime/v1` |
| Prices | `store.steampowered.com/api/appdetails?filters=price_overview&appids=...` |

- Store API limit ~200 req / 5 min per IP → batch appids + request queue.
- Caches live in IndexedDB beside the vault, never in its records (unlock stays fast), in two levels matched by id:
  - per account: `games` (`appId`, playtime, last played) and `friends` (`steamId`, since);
  - shared: `apps[appId]` (name, image, price per currency, `fetchedAt`) and `profiles[steamId]` (friends outside the vault). Refreshing one account updates them for all.
  - TTL per entry; the user can sync them as a separate file next to the vault, sealed with the vault key (libraries and friends are personal). `steam.stats` in the record is computed from them at refresh, so the read-only web shows it without caches.
- Batch refresh of many accounts streams results into UI as they arrive.

---

## 8. Desktop ↔ Extension Bridge (Native Messaging, parked with desktop)

No localhost WebSocket: any website can connect to `ws://127.0.0.1` (WebSocket ignores CORS) and read credentials.

- Browser spawns a registered native host, talks over stdio, only for listed extension IDs (`allowed_origins` / `allowed_extensions`).
- Host is a small proxy relaying to the running desktop app over named pipe / unix socket (KeePassXC-browser pattern).
- Desktop installer registers host manifests for Chrome, Edge, Firefox.
- Uses: credential lookup without Drive roundtrip. Bots go through ASF IPC, not the bridge.

---

## 9. Bots via ArchiSteamFarm (parked)

No own Steam client. [ASF](https://github.com/JustArchiNET/ArchiSteamFarm) (Apache-2.0) already does login, Steam Guard, card farming, idling, trades, confirmations. The app is an ASF client over its IPC (REST + Swagger, default `http://127.0.0.1:1242`).

- ASF runs anywhere: user's PC, server, Docker. Extension (host_permission for the IPC URL) and desktop talk to it directly - bots don't require desktop.
- `IPCPassword` is mandatory: without it ASF trusts any request from localhost, including browser tabs. URL + password are stored in the vault.
- Vault is the master: account ↔ bot mapping by SteamID, config pushed via `POST /Api/Bot/{name}`.
- Steam password is not written to ASF config: ASF runs `Headless`, the app answers login prompts via `input` command (TOTP generated from vault). After first login ASF keeps its session in `Bot.db`.
- ASF 2FA (auto-confirmations) is imported only as `BotName.maFile` in ASF `config/` (no IPC endpoint) - manual step, or desktop does it when it manages a local ASF.
- Missing features → ASF plugin (C#), not own SteamKit service.

---

## 10. Roadmap

### Phase 0: Design port
- [ ] `packages/ui` retuned to the mockups, appearance knobs, shell, settings container
- [ ] All screens on mock view-models: accounts, vault, backups, settings, profile, extension popup and autofill

### Phase 1: Core
- [ ] `packages/core`: models, vault crypto (format v1), storage
- [ ] Steam client: endpoints from 7, batching, caching
- [ ] Drive sync over REST, per-half account merge, tombstone purge
- [ ] Steam ID conversions in core, CS2 friend code via MD5 (port `shared/lib/md5.js` from the legacy app)
- [ ] Tests: crypto, Steam parsers, sync

### Phase 2: Vue App + Web Shell
- [ ] Wire view-models to core, drop mocks screen by screen
- [ ] Pages: accounts, profile (summary, games, friends), backups, settings
- [ ] `apps/web`: PWA shell, read-only mode

### Phase 3: Extension
- [ ] `apps/extension` on WXT: app page, popup, background
- [ ] Host permission flow (Firefox optional permissions)
- [ ] Google OAuth via `identity.launchWebAuthFlow`
- [ ] Steam login autofill content script
- [ ] Builds: Chrome, Edge, Firefox

### Phase 4: Desktop (parked)
- [ ] Tauri shell over `packages/app` + `plugin-http`
- [ ] Chromeless window with custom title bar
- [ ] Native Messaging host + bridge
- [ ] Desktop autofill on Windows: focus detection, popup window, fill (see Desktop autofill)

### Phase 5: Obsidian plugin (later)
- [ ] Folder vault serializer (notes + `.base` views)
- [ ] `apps/obsidian` shell: view, Vault API IO, `requestUrl` fetch

### Phase 6: Bots via ASF (parked)
- [ ] ASF IPC client in `core` (types from its OpenAPI)
- [ ] Account ↔ bot mapping, config push, `input` answers for login
- [ ] Bot dashboard: status, farming, confirmations
- [ ] Optional, desktop: download and run local ASF, import maFiles
