---
paths:
  - '**/*.vue'
  - '**/*.css'
---

# Styling

Tokens live in `packages/ui/src/theme.css`, shared surface classes in `packages/ui/src/base.css`. The stock Tailwind palette, radius, text, tracking and shadow scales are removed. `pnpm test` fails a new literal (`tests/ui/rules.ts`).

| Need | Use | Never |
|---|---|---|
| text | `text-fg-1` .. `text-fg-3`, `text-fg-faint` | `text-gray-500`, `text-white/70` |
| fills, strokes | `bg-canvas`, `bg-canvas-elev`, `bg-surface*`, `border-stroke-1` .. `3` | `bg-black/5`, a hand-rolled bg + 1px border |
| hover, press, highlight | `bg-hover`, `bg-hover-hi` | `bg-surface-hi` for hover (its white alpha vanishes on light surfaces; fine for static faces) |
| accent, status | `bg-accent`, `bg-accent-hover`, `text-accent-ink`, `bg-accent-soft`, `text-accent-fg`, `*-success`, `*-warning`, `*-danger`, `*-info` (+ `-soft`, `-fg`) | picking text for a colored fill by eye |
| panels | `.surface`, `.surface-pop` (floating: modal, menu, popover), `.surface-float` (a `.surface-pop` with its own radius, for floats no kit primitive owns), `.surface-opaque`, `.field`, `.fp-float`, `.fp-menu`, `FpEyebrow` (the only uppercase) | a new panel recipe |
| blur | `backdrop-surface`, `backdrop-pop` (follow the Surface knob, none under flat) | `backdrop-blur-*` on a panel |
| radius | bare `rounded`; `rounded-full` only where the shape is the affordance (the kit keeps its own scale steps) | `rounded-lg`, `rounded-[10px]` outside `packages/ui` |
| type | `text-10` .. `text-28`, named by desktop px (`text-12.5`, `text-13.5`); `font-title`, `tracking-title` | `text-[13px]`, `font-size: 13px`, `text-sm` |
| density | `p-u-4`, `px-u-6`, `gap-u-3.5`: paddings and gaps the density knob scales (unit 3, 4, 5px) | `p-4` where the mockup writes `calc(var(--u) * 4)` |
| scroll container | `FpScrollArea` on desktop (an overlay bar, no gutter in the layout); phones keep native `overflow-y-auto` | a bare `overflow-y-auto` on a desktop panel, `scrollbar-width` / `::-webkit-scrollbar` styling |
| global stacking | `layer-chrome` (rail, topbar, tab bar), `layer-overlay` (modals), `layer-float` (popovers, menus, tooltips), `layer-toast` | `z-50`, `z-index: 100` (local stacking below 30 is fine) |
| safe area | `safe-p`, `safe-px`, `safe-pt`, ... on the fixed container | `env(safe-area-inset-*)` by hand |
| touch | `touch-target` on compact and icon controls, `touch-row` on rows, `touch-control-sm` / `md` / `lg` (kit controls carry it); targets at least 24px | shrinking a hit area to fit the layout |
| hover reveal | `pointer-fine:opacity-0 group-hover:opacity-100` | `opacity-0 hover:opacity-100`, which hides it from touch |
| icons | `<FpIcon name="icon-[lucide--copy]" />`, the full class written literally | concatenated icon names, `@iconify/vue`, inlined SVG |

- No token fits: stop and propose one in `theme.css`. Never fall back to a literal or an opacity guess; an opacity modifier on a token is for tints, not text levels.
- The theme has no `white` or `black` utilities. Literal palette values belong in `theme.css` only (and fixed brand marks: Steam, Google, service logos; the Steam mark is `icon-[simple-icons--steam]`).
- Icons: Lucide, plus brand marks from Simple Icons. Icons are 1em: size the control, not each icon.
- A scoped `<style>` reads the custom properties behind the utilities (`var(--surf-bg)`, `var(--text-3)`, `var(--accent)`); colors are derived with `color-mix` or relative `oklch`, never written twice.
- Line height is the font's own (`normal`), as in the mockups; set `leading-*` only on running text.

## Phones

A screen is done once it holds at 360px wide with touch emulation.

- Below `lg` `--font-base` is 10% larger, so every `text-*` step and 1em icon grows on phones. A phone-only mockup size maps to the step 10% below it: 28px title `text-26`, 15.5px row label `text-14`, 13px hint `text-12`, 11px tab label `text-10`. Never add `text-base lg:text-sm` pairs to compensate.
- A field and the button beside it take the same `size`: `touch-control-*` lines them up only then.
- A width prop caps at the viewport: `width="min(92vw, 30rem)"`, never a bare `30rem`.
- A row that can outgrow 360px wraps: a heading beside a `nowrap` button stacks below `sm`, and metadata wraps with `line-clamp-2` instead of a `truncate` that hides it.
- A horizontal strip that scrolls centers its active item: `FpTabs` and `FpNavMenu` do it, a custom strip calls `useCenterActive`.

## Motion

- Pick the token by role: `press` instant acknowledgement, `fast` exits, hover and small changes, `base` routine enters, `slow` layout and overlays, `move` a whole page travelling (route slides), `reveal` authored focal moments, `cycle` one loader loop, `stagger` list delay. Exits run shorter than their entrance.
- Easing: `ease-out` default, `ease-in` exits leaving the screen, `ease-spring` overshoot on transforms only (never opacity or progress), `ease-in-out` loops, `ease-move` a page travelling.
- Templates use `duration-*`, `delay-*`, `ease-*` utilities; scripts read `durationToken()` / `easingToken()` from `@so/ui`.
- Shared feedback: `animate-pop` (something arrives), `animate-bump` + `useBump()` (a value changed, never on mount), `animate-settle` (content lands).
- Reduced motion: `motion-safe:` / `motion-reduce:`, `prefersReducedMotion()`; never read `prefers-reduced-motion` yourself. It swaps the animation and keeps the state change visible.
- Animate opacity on the glass element itself, never an ancestor: ancestor opacity, filter or mask kills descendant backdrop blur (transforms are safe). The route shift under Subtle and Glass is the one exception: glass goes flat for its fade.
- Reka popper content (popovers, menus, selects) ignores scoped state selectors: style it in a global block with `fp-` classes. Scoped styles work for Dialog content (Modal, Drawer).
- Animate `translate`, `scale` and `opacity`. Never tween `height`, `width`, `top` or `margin` on a tall subtree; inside an `FpModal` it also re-measures the panel (`ui-modal.md`).
- In-place drill-down and tab switches are `FpViewStack`'s job; tall pages and switchers inside an `FpModal` (settings sections) pass `:morph="false"`.
- Route changes are the shell's (`ShellPages`, `services/routeMotion.ts`): Flat slides the page along the nav axis, Subtle and Glass shift it and fade, a deeper page of one section drills in. A route needs `meta.nav` to take part.
- A page that measures its place in the scroller reads layout offsets (`offsetTop`), never `getBoundingClientRect`: it may mount mid-slide.
