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
| fills, strokes | `bg-canvas`, `bg-surface*`, `border-stroke-1` .. `3` | `bg-black/5`, a hand-rolled bg + 1px border |
| hover, press, highlight | `bg-hover`, `bg-hover-hi` | `bg-surface-hi` for hover (its white alpha vanishes on light surfaces; fine for static faces) |
| accent, status | `bg-accent`, `text-accent-fg`, `*-success`, `*-warning`, `*-danger`, `*-info` (+ `-soft`, `-fg`) | picking text for a colored fill by eye |
| panels | `.surface`, `.glass`, `.surface-opaque`, `.field`, `.fp-float`, `.fp-menu`, `FpEyebrow` (the only uppercase) | a new panel recipe |
| radius | bare `rounded`; `rounded-full` only where the shape is the affordance (the kit keeps its own scale steps) | `rounded-lg`, `rounded-[10px]` outside `packages/ui` |
| type | `text-3xs` .. `text-4xl` | `text-[13px]`, `font-size: 13px` |
| global stacking | `layer-chrome` (rail, topbar, tab bar), `layer-overlay` (modals), `layer-float` (popovers, menus, tooltips), `layer-toast` | `z-50`, `z-index: 100` (local stacking below 30 is fine) |
| safe area | `safe-p`, `safe-px`, `safe-pt`, ... on the fixed container | `env(safe-area-inset-*)` by hand |
| touch | `touch-target` on compact and icon controls, `touch-row` on rows, `touch-control-sm` / `md` / `lg` (kit controls carry it); targets at least 24px | shrinking a hit area to fit the layout |
| hover reveal | `pointer-fine:opacity-0 group-hover:opacity-100` | `opacity-0 hover:opacity-100`, which hides it from touch |
| icons | `<FpIcon name="icon-[lucide--copy]" />`, the full class written literally | concatenated icon names, `@iconify/vue`, inlined SVG |

- No token fits: stop and propose one in `theme.css`. Never fall back to a literal or an opacity guess; an opacity modifier on a token is for tints, not text levels.
- The theme has no `white` or `black` utilities. Literal palette values belong in `theme.css` only (and fixed brand marks: Steam, Google, service logos).
- Icons: Lucide only. Icons are 1em: size the control, not each icon.

## Phones

A screen is done once it holds at 360px wide with touch emulation.

- Below `lg` `--font-base` is larger, so every `text-*` step and 1em icon grows on phones. Size for desktop; never add `text-base lg:text-sm` pairs to compensate.
- A field and the button beside it take the same `size`: `touch-control-*` lines them up only then.
- A width prop caps at the viewport: `width="min(92vw, 30rem)"`, never a bare `30rem`.
- A row that can outgrow 360px wraps: a heading beside a `nowrap` button stacks below `sm`, and metadata wraps with `line-clamp-2` instead of a `truncate` that hides it.
- A horizontal strip that scrolls centers its active item: `FpTabs` and `FpNavMenu` do it, a custom strip calls `useCenterActive`.

## Motion

- Pick the token by role: `press` instant acknowledgement, `fast` exits, hover and small changes, `base` routine enters, `slow` layout and overlays, `reveal` authored focal moments, `cycle` one loader loop, `stagger` list delay. Exits run shorter than their entrance.
- Easing: `ease-out` default, `ease-in` exits leaving the screen, `ease-spring` overshoot on transforms only (never opacity or progress), `ease-in-out` loops.
- Templates use `duration-*`, `delay-*`, `ease-*` utilities; scripts read `durationToken()` / `easingToken()` from `@so/ui`.
- Shared feedback: `animate-pop` (something arrives), `animate-bump` + `useBump()` (a value changed, never on mount), `animate-settle` (content lands).
- Reduced motion: `motion-safe:` / `motion-reduce:`, `prefersReducedMotion()`; never read `prefers-reduced-motion` yourself. It swaps the animation and keeps the state change visible.
- Animate opacity on the glass element itself, never an ancestor: ancestor opacity, filter or mask kills descendant backdrop blur (transforms are safe).
- Reka popper content (popovers, menus, selects) ignores scoped state selectors: style it in a global block with `fp-` classes. Scoped styles work for Dialog content (Modal, Drawer).
- Animate `translate`, `scale` and `opacity`. Never tween `height`, `width`, `top` or `margin` on a tall subtree; inside an `FpModal` it also re-measures the panel (`ui-modal.md`).
- In-place drill-down and tab switches are `FpViewStack`'s job; tall pages and switchers inside an `FpModal` (settings sections) pass `:morph="false"`.
- Route changes fade, never slide: a moving page re-blurs all its glass every frame.
