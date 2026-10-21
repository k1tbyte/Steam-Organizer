---
paths:
  - 'packages/app/src/core/appearance/**'
  - 'packages/app/src/features/settings/sections/appearance/**'
---

# Appearance

Nine device-local knobs restyle the whole app live: the kit reads them from `<html>` (`ui-kit.md`), `core/appearance` writes them.

| Knob | Values (default first) | On `<html>` | Storage key |
|---|---|---|---|
| mode | `dark`, `light`, `system` | `data-mode` always set; `system` resolves through `matchMedia` and follows the OS live | `so:mode` |
| accent | one of `ACCENT_PRESETS` | `--accent` | `so:accent` |
| tint | `on`, `off` | `data-tint="off"` | `so:tint` |
| surface | `flat`, `subtle`, `glass` | `data-surface` | `so:surface` |
| background | `plain`, `clean`, `noisy`, `grid`, `image` | `data-bg`; image also `--stage-image`, `--stage-dim` | `so:bg` |
| radius | 16, range 0 to 24 | `--radius-base` in px | `so:radius` |
| density | `comfortable`, `compact`, `spacious` | `data-density` | `so:density` |
| motion | `auto`, `off`, `simple`, `gamify` | `data-motion` always set; `auto` resolves to `simple` on a touch device or under the OS reduced-motion setting, else `gamify`, and follows both live | `so:motion` |
| language | `en`, `ru` | `lang` always set; the i18n locale follows the pref (a watch in `index.ts`), so screens only set the pref; names in `LANGUAGE_NAMES` | `so:lang` |

- `APPEARANCE_PREFS` in `appearance.ts` is the single source: key, target, allowed values or range, default. A new knob is one entry plus its CSS in the kit; `applyPref` and `useAppearancePref` need no change.
- A default value removes its attribute or property, so CSS falls back to the base tokens and storage holds only deviations. A stored value outside the table reads as the default (`parsePref`).
- `restoreAppearance(root)` runs in every entry before the first render (`mountApp`, `mountPopup`, `mountAutofill`), so the first paint is already themed. `root` is `<html>`, or the content script's shadow host. `useAppearancePref(name)` returns shared state and `set(value)`, which stores and applies at once; a mode change reveals from the press point through `revealThemeChange`.
- A pref that defers to the device (`system`, `auto`) has `resolve` and `follows` in its spec: `applyPref` writes the resolved value and `restoreAppearance` re-applies it when a followed media query changes.
- The motion level is read through the kit (`motion-off:`, `motion-simple:`, `motion-on:`, `motionLevel()`). Only this folder names the attribute or the OS setting (contract rule `motion-level-source`).
- The image background keeps its source at 1280px wide as a JPEG data URL in `so:bg-src` and its name in `so:bg-name`. It is blurred once on a 640px canvas, and the blob URL goes to `--stage-image`; blur and dim live in `so:bg-blur`, `so:bg-dim`. The sample image is `sample-bg.svg`. The picture is never synced or saved in the vault; a later pass moves it from `localStorage` to IndexedDB, which only changes `background.ts`.
- Appearance state never reaches a store or the vault: components read `useAppearancePref`, and nothing else touches `<html>` styling.
- `applyPref(root, name, value)` takes the root as an argument so node tests drive it with a plain object (`appearance.test.ts`).
