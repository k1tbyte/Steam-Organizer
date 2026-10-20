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
- Runtime knobs sit on `<html>`: `--accent`, `data-mode` (`dark`, `light`), `data-surface` (`glass`, `solid`, `subtle`), `data-accent="flat"`, `data-bg` (`noisy`, `clean`).
- Shared tokens live in `theme.css`; easing and duration tokens, the reduced-motion variants and shared keyframes live in `motion.css` (imported by `theme.css`); component-specific keyframes stay with the component. `base.css` holds element defaults and the surface classes; Preflight owns resets.
- A package that ships classes declares its own `@source` and consumers import its stylesheet: Tailwind skips `node_modules`, workspace symlinks included.

## Components

- Never inspect slot VNodes. A component that depends on its children (`FpAvatarGroup`) registers them through provide/inject.
- Data-dependent surfaces render through `FpAsyncView` (one `status`; dependent UI mounts only when ready). `FpViewStack` is navigation only and owns drill-down and tab slides; its hooks pin the leaving page's height with one read and, with `morph`, the box height, and add no per-frame reads. While the box tweens, the entering page keeps its natural size (`flex-shrink: 0`) and the box clips it: a squeezed page shows its own scrollbar. `data-fp-view-swapping` is read by `FpModal`; keep its name in step with `Modal.vue`.
- Floats have no arrow: a tail outside a glass float cannot blur (the float is its backdrop root) and the hairline would cross its base.
- `FpPopover sheet` mounts one primitive family per mode: `FpDrawer` (`bare`, the caller's trigger in `#trigger`) below `lg`, the popover above. It picks the mode on mount, then changes it only while closed: crossing `lg` never remounts an open panel.
- `FpDrawer` never lifts above its rest position: the swipe transform is clamped at 0, so only the dismiss direction moves it. Its 2px `::after` masks the bottom hairline at the screen edge.
- A horizontal strip that can scroll (`FpTabs`, `FpNavMenu`) centers its active item with `useCenterActive`: one layout read per selection or resize, instant on mount and under reduced motion. A strip with an overshooting indicator (`FpTabs`) scrolls only while `overflows`: as a scroll container, the spring's overshoot would grow the scroll area and flash a scrollbar on each switch.
- Kit primitives own their native controls and take copy as props with English defaults; the kit has no i18n.
- Glass never nests: `base.css` drops the backdrop filter of a `.surface` / `.glass` inside another, so an inner card is tint only (it cannot see the stage through the outer filter). Opt back in with an explicit `backdrop-blur-*` utility only for a surface that really overlaps media.
- `morph` (`FpViewStack`, `FpCollapsible`, `FpAccordion`) tweens height and defaults on; off for tall content and inside `FpModal` (`styling.md`, `ui-modal.md`).
- The app root never creates a stacking context or a `backdrop-filter`: either breaks glass sampling over `.bg-stage`.
- `data-theme-swap` disables transitions for the frame a mode or accent token changes; `theme-reveal.ts` owns the circular reveal.
- Every exported component is used by the app or listed in `index.ts` for a planned screen; delete what neither needs (copy it back from framepod when a screen does).
