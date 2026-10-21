---
name: port-mockup
description: Port a design mockup (`artifacts/mockup/*.dc.html`, inline styles + `sc-for`/`sc-if` + a `DCLogic` class) onto live Vue components in packages/app. Use when the user hands over a mockup screen or asks to move a design onto the app. Covers block ownership, the style-to-kit mapping, mock view-models and the screenshot comparison.
---

# Port a mockup

Design first, data second: a screen is built from its mockup to the full design, every block fed by a view-model that reads mocks, and is wired block by block later. UI and logic are split hard (`View = fn(ViewModel)`), so wiring only swaps a view-model body.

A `.dc.html` file is a canvas of frames, each marked `data-screen-label` ("Profile · Desktop", "Profile · Mobile", "Lock account · Dialog"). Russian paragraphs in the `<header>` are design notes: they state behavior the frames can't show. The `<script data-dc-script>` holds sample data constants and a `DCLogic` class (state, handlers, `applyTheme`). The theme engine itself lives in `@so/ui` (`theme.css`) and `core/appearance`; port the blocks, never the chrome (sidebar, topbar, tab bar, background are `features/shell`).

## 1. Read the mockup

- Screenshot the frame and the live page at the frame's size (dev server `pnpm dev`, port 3000):
  ```bash
  node .claude/skills/port-mockup/shot.mjs mock Profile.dc.html "Profile · Desktop" artifacts/shots/profile-mock.png
  node .claude/skills/port-mockup/shot.mjs page http://localhost:3000/accounts/mock-a1 artifacts/shots/profile-page.png --width=1280 --height=860
  ```
  Mock props go in as flags (`--mode=light --surface=glass --density=compact`). Read the PNGs; compare again after building.
- Interactive states (open popover, hover, dialog step) that a frame shows statically are what the built UI must reach by interaction, not a fixed render.

## 2. Place each block

- Map every block to its domain owner (`features/*/index.ts` first). A block for a domain with no slice yet gets one via the `new-feature` skill shape, even if mock only.
- Cross-feature blocks reach a screen through its facade or a slot the page fills; dependencies stay one-way (`pnpm arch`).
- A screen's topbar parts go through `PageTopbar` (`#components/PageTopbar.vue`): `title` and `count` props, slots `status` (`SyncStatus` from `#features/shell`), `center` (the search), `actions`, `back`. The rail and tab bar entry comes from the route's `meta: { nav: 'accounts' }`; a drill-down screen sets `meta.tabBar: false`.
- A look repeated across features with no domain (hold-to-confirm, countdown ring) is a kit primitive in `packages/ui` (`FpHoldButton`, `FpCountdownRing`, `FpSegmentedMeter`, `useHold` exist); a Steam-specific one (level ring avatar, ban letters) lives in its owning feature and is exported from its facade.

## 3. Mock view-models

Read `packages/app/src/core/mock/README.md`: `defineMock` in the feature's `mocks.ts`, `useMock` in its view-model, modes `live` / `fill` / `mock` and a variant per mock in `MockPanel`.

- Every block renders a view-model composable that returns the shape real data will have (types in the feature's `model.ts`). Only view-models read `mocks.ts`, so wiring replaces one composable body.
- Give each mock the variants the design must survive: counts (0, 1, many), long copy, empty, locked, error, anonymous account. The first variant is the mockup's own data.
- Mockup state (`this.state`, `setState`) becomes UI state in the view-model or component (sort, expanded, step); handlers become emits or named intents that do nothing or update local state until wired.
- Copy goes through `t()`; sample content (nicknames, notes, tags) stays untranslated.

## 4. README per feature

Every feature that gained mocks gets a `## Mocks` section in its `README.md`: the mockup file and frames, then one row per mock.

| Mock (variants) | UI built | Source | Wire in |
|---|---|---|---|
| `accounts.list` (Twelve, Empty, One locked) | grid, pinned group, card | vault records | `useAccountsList` |

List unwired intents too (Refresh, Delete, Copy password). When a block is wired, delete its mock and its row in the same commit.

## 5. Style to kit

Mockup vars map to kit tokens one to one; this table is the whole translation (`styling.md` has the rules behind it).

| Mockup | Use |
|---|---|
| `--bg`, `--bg-2` (rail, tab bar, topbar) | `bg-canvas`, `bg-canvas-elev backdrop-surface` |
| `--surf` + `--blur` | `.surface`, or `bg-surface backdrop-surface` |
| `--surf-hi`, `--surf-hover` | `bg-surface-hi`, `bg-surface-hover` |
| `--surf-pop` + `--blur-pop` | `.surface-pop`, or `bg-surface-pop backdrop-pop` |
| `--stage`, `--page` | `.bg-stage` in `App.vue`, the `html` background: never in a screen |
| `--t1`, `--t2`, `--t3`, `--faint` | `text-fg-1`, `text-fg-2`, `text-fg-3`, `text-fg-faint` |
| `--stroke-1`, `--stroke-2` | `border-stroke-1`, `ring-1 ring-inset ring-stroke-2` for `inset 0 0 0 1px` |
| `--hover`, `--hover-hi` | `bg-hover`, `bg-hover-hi` |
| `--acc`, `--acc-hover`, `--acc-ink`, `--acc-soft`, `--acc-fg` | `bg-accent`, `bg-accent-hover`, `text-accent-ink`, `bg-accent-soft`, `text-accent-fg` |
| `--success`, `--warning`, `--danger`, `--info` (+ `-soft`, `-fg`) | `text-success`, `bg-warning-soft`, `text-danger-fg`, ... |
| `calc(var(--r) * k)` | k .3-.36 `rounded-xs`, .38-.42 `rounded-sm`, .45-.5 bare `rounded`, .55-.65 `rounded-md`, .75-.85 `rounded-lg`, 1 `rounded-xl`; pills `rounded-full`. A kit primitive owns its radius; in the app only bare `rounded` and `rounded-full` pass the contract |
| `calc(var(--u) * n)` | `p-u-n`, `px-u-n`, `gap-u-n` (halves work); a fixed px control size stays fixed |
| `font-size: Npx` | `text-N`, named by desktop px (`text-12.5`, `text-13.5`, `text-14`); a size seen only in a phone frame is the step 10% lower (28 `text-26`, 15.5 `text-14`, 13 `text-12`, 11 `text-10`) |
| weight 650 / 600 / 500, `-0.01em` | `font-title` / `font-semibold` / `font-medium`, `tracking-title` |
| `'Geist Mono'` | `font-mono` |
| 11px 600 `.14em` uppercase | `FpEyebrow` |
| hairline row, label + hint + control | `FpFormRow` (`#leading` icon, `compact` list rows, `inline` keeps a switch beside its label on phones), `FpListRow` inside `FpCard flush` |
| a pressable row or card | a plain `<button>` or `RouterLink` without own fill and padding |

- Controls come from the kit, sized by `size`: buttons xs 28, sm 32, md 34, lg 36, xl 40, 2xl 52px; fields sm 34, md 40, lg 48px. Match the frame's height with the size, never a class.
- A kit primitive's own colors beat an unlayered scoped rule only with an important utility (`text-accent!`).
- A plain `<button>` is fine as a pressable surface (a row, a card); one with its own fill and padding fails `raw-control`.
- No token or primitive fits: add it to `packages/ui` (token in `theme.css`), never a literal.

## 6. Finish

- Screenshot every frame of the screen at its size (desktop frames 1280 wide, mobile 390) and fix what differs; check light mode and the glass surface once.
- `pnpm lint && pnpm typecheck && pnpm test && pnpm arch`.
- Check every mock variant in `MockPanel` (`fill` and `mock` modes) and `live`: blocks without a source must hide cleanly.
- Report what stayed mock and which view-model each block waits on (the README tables).
