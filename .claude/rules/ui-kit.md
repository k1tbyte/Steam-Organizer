---
paths:
  - 'packages/ui/**'
---

# @so/ui

Vapor-compatible primitives. `vue.md` and `styling.md` apply; this adds what only the kit owns.

## Color and tokens

- `--accent` is the single color input. Derive shades with relative `oklch(...)` and `color-mix()` at computed-value time: no JS color math, no hardcoded ramps.
- `-fg` tokens derive black or white from their fill's lightness. Status colors are fixed per mode and never derive from the accent; keep light-mode `--danger` dark enough for error text.
- Utilities map tokens through `@theme inline` so they emit `var(--*)` and a subtree accent override stays live.
- Runtime knobs sit on `<html>` (the shadow host in the extension's injected UI, where `apps/extension/wxt.config.ts` turns `:root[x]` into `:host([x])`: a shadow host never matches `:host[x]`), written by `core/appearance` (`appearance.md`): `--accent`, `data-mode` (`dark`, `light`), `data-tint="off"`, `data-surface` (`subtle`, `glass`; none is flat), `data-bg` (`clean`, `noisy`, `grid`, `image`; none is plain), `--radius-base`, `data-density` (`compact`, `spacious`), `data-motion` (`gamify`, `simple`, `off`). `.bg-stage` paints `--stage`, which reads `--stage-image` and `--stage-dim` for the image background.
- Surfaces come from tokens that change per knob (`--surf-bg*`, `--surf-pop`, `--bg-elev`, `--surf-filter`, `--pop-filter`, `--surf-veil`): a component picks the token by role and never branches on the knob.
- `panel-base` gives a root outside the app shell (the popup, the injected UI) the app's font, size scale, color and 10% phone growth; the host page's rem and body styles never reach it.
- Shared tokens live in `theme.css`; easing and duration tokens, the motion-level variants and shared keyframes live in `motion.css` (imported by `theme.css`); component-specific keyframes stay with the component. `base.css` holds element defaults and the surface classes; Preflight owns resets.
- A package that ships classes declares its own `@source` and consumers import its stylesheet: Tailwind skips `node_modules`, workspace symlinks included.

## Components

- Never inspect slot VNodes. A component that depends on its children (`FpAvatarGroup`) registers them through provide/inject.
- Data-dependent surfaces render through `FpAsyncView` (one `status`; dependent UI mounts only when ready). `FpViewStack` is navigation only and owns drill-down and tab slides: the page travels `--fp-view-travel`, its own size on Gamify and `--shift-travel` on Simple; its hooks pin the leaving page's height with one read and, with `morph`, the box height, and add no per-frame reads. While the box tweens, the entering page keeps its natural size (`flex-shrink: 0`) and the box clips it: a squeezed page shows its own scrollbar. `data-fp-view-swapping` is read by `FpModal`; keep its name in step with `Modal.vue`.
- Floats (tooltip, popover, menu, select) draw an arrow only under flat, while `<html>` has no `data-surface`: a tail outside a glass float cannot blur (the float is its backdrop root). Reka's `*Arrow` wraps a 0x0 `.fp-arrow` in every mode, so `sideOffset` (`FLOAT_GAP`, 10px) is the whole gap and no knob moves the float. The float never clips (its scroller does): the arrow straddles its edge. Context menus have none: the pointer is the anchor.
- Toasts are a list of three at the corner (`FpToaster`, `useToast()`): one icon per color, one inline action, a ghost dismiss named by the `dismissLabel` prop. A danger toast stays until dismissed; only a `countdown` toast draws the bar, on its own clock. The shell sets `--toast-offset-bottom` so phone toasts clear the dock.
- `FpPopover sheet` mounts one primitive family per mode: `FpDrawer` (`bare`, the caller's trigger in `#trigger`) below `lg`, the popover above. It picks the mode on mount, then changes it only while closed: crossing `lg` never remounts an open panel.
- `FpModal`, `FpDrawer`, `FpPopover` and `FpDropdownMenu` close when a `provideOverlayGate(shown)` ancestor hides: they portal out of the subtree, so hiding it alone would leave them on screen. Any gate hiding also closes the tooltip.
- A float (`FpDropdownMenu`, `FpPopover`, `FpDrawer`, `FpModal`, the field error tip) mounts its portal on first open (`useOpenedOnce`) and keeps it for the exit animation: a closed one is its trigger only. `FpSelect` keeps reka's closed options, which typeahead on a closed trigger reads.
- Tooltips are one bubble per app root. `tip()` only returns its trigger's attributes (`data-tip`, `data-tip-placement`, reka's `data-grace-area-trigger`, `aria-label` with `label`), no component; `FpTooltipHost` (in `App.vue`, `QuickAccessApp.vue`) shows it through one reka `TooltipRoot` fed by delegated pointer and focus events, so delay, grouping, grace area, Escape and scroll dismissal stay reka's. Touch shows none. Its reka-coupled parts (the root context, `tooltip.open`, the grace mark) sit in `TooltipHostTrigger.vue`: recheck them on a reka upgrade.
- `FpDrawer` never lifts above its rest position: the swipe transform is clamped at 0, so only the dismiss direction moves it. Its 2px `::after` masks the bottom hairline at the screen edge.
- A horizontal strip that can scroll (`FpTabs`, `FpNavMenu`) centers its active item with `useCenterActive`: one layout read per selection or resize, instant on mount and with motion off. A strip with an overshooting indicator (`FpTabs`) scrolls only while `overflows`: as a scroll container, the spring's overshoot would grow the scroll area and flash a scrollbar on each switch.
- Hold gestures are one composable: `useHold` (hold-to-reveal without a duration, hold-to-confirm with one). `FpHoldButton` fills as the progress and drains on release; `FpCountdownRing` (pie or ring, `tick` glides between updates), `FpSegmentedMeter` and `FpPinInput masked` cover the other Steam Guard and vault looks the mockups share. `FpSlider size="xs"` is the plain range look (hairline track, round grip).
- Kit primitives own their native controls and take copy as props with English defaults; the kit has no i18n.
- `FpIcon` reads its glyphs from `components/display/media/icons.ts`, empty on disk: `fpIcons()` (`@so/ui/vite`, in each shell's Vite config with the app's `src`) serves it with every `icon-[set--name]` literal in the kit and the given sources, from `@iconify-json/<set>`. An unknown name warns at build. Its plugin file is JS: typing it would pull node globals into the shells' programs.
- Glass never nests: `base.css` drops the backdrop filter of a `.surface` / `.surface-pop` inside another, so an inner card is tint only (it cannot see the stage through the outer filter). Opt back in with an explicit `backdrop-blur-*` utility only for a surface that really overlaps media.
- `morph` (`FpViewStack`, `FpCollapsible`, `FpAccordion`) tweens height and defaults on; off for tall content and inside `FpModal` (`styling.md`, `ui-modal.md`). On Simple `FpCollapsible` and `FpAccordion` snap the height anyway: the tween lays the subtree out every frame.
- The app root never creates a stacking context or a `backdrop-filter`: either breaks glass sampling over `.bg-stage`.
- `data-theme-swap` disables transitions for the frame a mode or accent token changes; `theme-reveal.ts` owns the theme change: a circular reveal on Gamify, a crossfade on Simple.
- Every exported component is used by the app or listed in `index.ts` for a planned screen; delete what neither needs (copy it back from framepod when a screen does).
