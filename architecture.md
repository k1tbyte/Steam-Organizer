# Steam Organizer — Architecture & Roadmap (v2)

## 1. Motivation: Why We're Rewriting

The original application relied on a **C# .NET backend** that acted as a CORS proxy between the browser and Steam's API. While functional, this architecture fundamentally undermines user trust — routing Steam API keys, SteamIDs, and session data through any third-party server is a dealbreaker for security-conscious users managing accounts worth thousands of dollars.

**Decision**: The backend has been **permanently removed**. All Steam API communication now happens exclusively from environments that natively bypass CORS:
- Native desktop/mobile binaries (Tauri's Rust HTTP client)
- Browser extensions (manifest-granted host permissions)

The web PWA degrades to a **read-only viewer** when neither of these environments is available.

---

## 2. Monorepo Structure

The project uses **pnpm workspaces** + **Turborepo** for task orchestration and caching.

```
/Steam-Organizer
├── apps/
│   ├── pwa/              # React + Vite (core UI, also serves as Tauri frontend)
│   ├── desktop/          # Tauri v2 shell (src-tauri/ with Rust backend)
│   └── extension/        # Browser extension (Vite + CRXJS)
├── packages/
│   ├── core/             # Pure TS: encryption, models, Steam API types, sync logic
│   └── ui/               # Shared component library (TailwindCSS + Shadcn)
├── pnpm-workspace.yaml
├── turbo.json
└── package.json          # Root scripts (dev:pwa, dev:desktop, dev:extension, etc.)
```

### Key commands (run from root):
| Command | What it does |
|---|---|
| `pnpm run dev:pwa` | Starts Vite dev server (browser PWA) |
| `pnpm run dev:desktop` | Starts Tauri dev (launches native window + Vite) |
| `pnpm run dev:extension` | Starts extension dev with HMR via CRXJS |
| `pnpm run build` | Parallel production build of all packages |
| `pnpm run build:desktop` | Builds .exe / .dmg / .AppImage |

---

## 3. Application Targets & Their Capabilities

### 3.1 PWA (Web)
- **Purpose**: Quick access read-only dashboard. User visits the site from any device, authenticates via Google, pulls encrypted backup from Drive, views account info.
- **Can do**: View accounts, credentials (after master password unlock), backups, basic field editing (passwords, notes).
- **Cannot do**: Fetch/update Steam profile data (blocked by CORS), add new accounts via Steam API.
- **Rationale**: Zero cost to maintain. Same codebase as desktop, just deployed as static files. Provides value even without extension/desktop installed.

### 3.2 Browser Extension
- **Purpose**: The **primary browser-based client**. Full functionality.
- **UI**: Opens the **full PWA interface** inside `chrome-extension://<id>/index.html` as a dedicated tab. Also has a compact Popup for quick access.
- **Can do**: Everything the PWA can, PLUS:
  - Direct Steam API requests (CORS bypassed via manifest `host_permissions`)
  - Autofill Steam login forms via Content Scripts on `steamcommunity.com` / `store.steampowered.com`
  - Connect to Desktop via local WebSocket for real-time telemetry
- **Engine support target**: Blink (Chrome/Edge), Gecko (Firefox), WebKit (Safari) — Manifest V3
- **Build tool**: Vite + CRXJS Vite Plugin (same bundler as PWA, shared React components from `packages/ui`)

### 3.3 Desktop (Tauri v2)
- **Purpose**: The **power user client**. Full functionality + advanced features.
- **UI**: Renders `apps/pwa/dist` inside a native WebView2 window. Supports custom window chrome (frameless mode with `data-tauri-drag-region`).
- **Can do**: Everything the Extension can, PLUS:
  - Native HTTP client (`@tauri-apps/plugin-http`) — zero CORS, zero browser dependency
  - Local WebSocket server for Extension/bot telemetry
  - Headless bot operations (SteamKit-like login, farming, trade confirmations)
  - System tray residence (background operation without visible window)
  - Future: Remote control capabilities
- **Platforms**: Windows, macOS, Linux (immediate), Android/iOS (Tauri v2 mobile support, future)

### 3.4 Mobile (Tauri v2 Mobile)
- **Purpose**: Same as Desktop but on phone/tablet.
- **Status**: Architecture-ready. Tauri v2 supports `tauri android init` / `tauri ios init` out of the box. Same PWA frontend, compiled to native APK/IPA.
- **Priority**: Low. Parked until desktop + extension are stable.

---

## 4. Data Architecture & Synchronization

### 4.1 Encryption Model
- All sensitive data encrypted with **AES-256** using a user-provided master password.
- Master password is **never stored or transmitted** anywhere.
- Encrypted blobs are opaque — even with access to Google Drive backups, data is unreadable without the master password.

### 4.2 Local Storage
- Each client (PWA, Extension, Desktop) maintains its own local copy of the encrypted database.
- **PWA**: IndexedDB / localStorage
- **Extension**: `chrome.storage.local`
- **Desktop/Mobile**: Filesystem via Tauri APIs

### 4.3 Cold Sync (Google Drive)
Google Drive serves as the **global Source of Truth** for persistent account state.

**Flow**:
1. Client modifies data (add account, update password) → local DB updated
2. Local DB encrypted → pushed to Google Drive with new timestamp
3. Other clients periodically check Google Drive (on app focus, manual sync, or configurable interval)
4. If `cloud.timestamp > local.timestamp` → download, decrypt, merge/overwrite
5. Conflict resolution: Last-write-wins based on timestamp (simple, sufficient for single-user app)

### 4.4 Hot Sync (Local WebSocket — Desktop ↔ Extension)
For real-time scenarios where Google Drive latency is unacceptable.

**Architecture**:
- Desktop (Tauri/Rust) spawns a local WebSocket server on a fixed port (e.g., `ws://127.0.0.1:42069`)
- Server runs in a background Rust thread (via `tokio`), independent of whether the UI window is visible
- Extension's Background Script maintains a persistent connection, with reconnection polling

**Use cases**:
| Scenario | Flow |
|---|---|
| Bot status monitoring | Desktop broadcasts bot state changes → Extension shows live badges/dashboard |
| Remote command (start/stop farm) | Extension sends RPC command via WS → Desktop executes |
| Quick credential sharing | Extension requests specific account data → Desktop responds instantly (no Drive roundtrip) |
| Multi-account login orchestration | Desktop manages parallel Steam sessions → streams progress to Extension |

---

## 5. Environment-Based Code Splitting

To ensure zero code leakage between targets (e.g., Tauri APIs should never appear in PWA web bundles):

### Vite Environment Files
- `apps/pwa/.env` — default (web PWA mode, no special flags)
- `apps/pwa/.env.tauri` — loaded when Tauri runs Vite with `--mode tauri`, sets `VITE_IS_TAURI=1`

### Usage in code
```tsx
// Compile-time constant — Vite replaces with literal 'true'/'false' at build time
// Dead code is then tree-shaken away completely
const isTauri = import.meta.env.VITE_IS_TAURI === '1';
```

### Tauri config (`tauri.conf.json`)
```json
{
  "beforeDevCommand": "pnpm --filter=@steam-organizer/pwa run dev --mode tauri",
  "beforeBuildCommand": "pnpm --filter=@steam-organizer/pwa run build --mode tauri"
}
```

This ensures that when building for web deployment, **all Tauri-specific imports and components are completely eliminated** from the bundle by Vite's tree-shaking.

---

## 6. Shared Package Architecture

### `packages/core`
Pure TypeScript, zero UI dependencies. Importable by all apps.
- `crypto/` — AES-256 encrypt/decrypt wrappers
- `models/` — Account, Game, BackupInfo interfaces/types
- `steam/` — Steam API endpoint definitions, response parsers
- `sync/` — Google Drive backup/restore logic, merge strategies
- `constants/` — Shared configuration values

### `packages/ui`
React component library built with TailwindCSS + Shadcn UI.
- Atomic components: Button, Input, Card, Badge, Modal, Toast
- Composite components: AccountCard, AccountList, SearchBar, FilterPanel
- Consumed by `apps/pwa` and `apps/extension` (both use Vite + React)

---

## 7. Implementation Roadmap

### Phase 1: Strip Legacy & Establish API Abstraction
- [x] Remove .NET backend and `.sln`
- [x] Restructure into pnpm monorepo
- [x] Initialize Tauri v2 in `apps/desktop`
- [x] Generate platform icons from SVG logo
- [ ] Audit and remove all old backend API call sites in `apps/pwa`
- [ ] Implement `SteamApiClient` abstraction with environment-aware routing
- [ ] Install and configure `@tauri-apps/plugin-http` for Desktop

### Phase 2: Extension Foundation
- [ ] Initialize `apps/extension` with Vite + CRXJS
- [ ] Configure Manifest V3 with Steam host permissions
- [ ] Implement Background Script with CORS-free fetch proxy
- [ ] Render full PWA UI inside extension tab (`chrome-extension://id/index.html`)
- [ ] Implement Steam login autofill via Content Scripts
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

### Phase 3: Package Extraction
- [ ] Extract encryption logic into `packages/core`
- [ ] Extract IndexedDB/storage wrappers into `packages/core`
- [ ] Build `packages/ui` with Shadcn components
- [ ] Refactor `apps/pwa` to consume shared packages

### Phase 4: Real-Time Telemetry Bridge
- [ ] Implement `tokio`-based WebSocket server in `src-tauri/src/`
- [ ] Implement connection manager in Extension Background Script
- [ ] Define JSON-RPC-like message protocol for commands and telemetry
- [ ] Build live dashboard view for bot monitoring

### Phase 5: Bot & Automation Engine
- [ ] Implement headless Steam login (SteamKit-like) in Rust
- [ ] Parallel session management for multiple accounts
- [ ] Farm/idle automation
- [ ] Trade confirmation handling
- [ ] Remote control via Extension → Desktop WebSocket RPC
