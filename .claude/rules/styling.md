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
| blur | `backdrop-surface`, `backdrop-pop` (follow the Surface knob, none under flat); a card repeated in a long list (`AccountCard`) drops it for `--surf-veil` | `backdrop-blur-*` on a panel |
| radius | bare `rounded`; `rounded-full` only where the shape is the affordance (the kit keeps its own scale steps) | `rounded-lg`, `rounded-[10px]` outside `packages/ui` |
| type | `text-10` .. `text-28`, named by desktop px (`text-12.5`, `text-13.5`); `font-title`, `tracking-title` | `text-[13px]`, `font-size: 13px`, `text-sm` |
| density | `p-u-4`, `px-u-6`, `gap-u-3.5`: paddings and gaps the density knob scales (unit 3, 4, 5px) | `p-4` where the mockup writes `calc(var(--u) * 4)` |
| scroll container | `FpScrollArea` on desktop (an overlay bar, no gutter in the layout); phones keep native `overflow-y-auto` | a bare `overflow-y-auto` on a desktop panel, `scrollbar-width` / `::-webkit-scrollbar` styling |
| global stacking | `layer-chrome` (rail, topbar), `layer-dock` (phone tab bar), `layer-overlay` (modals), `layer-float` (popovers, menus, tooltips), `layer-toast` | `z-50`, `z-index: 100` (local stacking below 30 is fine) |
| safe area | `safe-p`, `safe-px`, `safe-pt`, ... on the fixed container | `env(safe-area-inset-*)` by hand |
| touch | `touch-target` on compact and icon controls, `touch-row` on rows, `touch-control-sm` / `md` / `lg` (kit controls carry it); targets at least 24px | shrinking a hit area to fit the layout |
| hover reveal | `pointer-fine:opacity-0 group-hover:opacity-100` | `opacity-0 hover:opacity-100`, which hides it from touch |
| icons | `<FpIcon name="icon-[lucide--copy]" />`, the full name written literally (a build scan collects it) | concatenated icon names, `@iconify/vue`, a hand-written `<svg>`, an icon name as a class |

- No token fits: stop and propose one in `theme.css`. Never fall back to a literal or an opacity guess; an opacity modifier on a token is for tints, not text levels.
- The theme has no `white` or `black` utilities. Literal palette values belong in `theme.css` only (and fixed brand marks: Steam, Google, service logos; the Steam mark is `icon-[simple-icons--steam]`).
- Icons: Lucide, plus brand marks from Simple Icons. Icons are 1em: size the control, not each icon. `FpIcon` draws an inline `<svg>` (a CSS mask icon cost a paint effect and an image per glyph: 45% of a fast list scroll's paint).
- A scoped `<style>` reads the custom properties behind the utilities (`var(--surf-bg)`, `var(--text-3)`, `var(--accent)`); colors are derived with `color-mix` or relative `oklch`, never written twice.
- In a list item, center an absolute bit with `inset-x-0 mx-auto w-fit`, not `left-1/2 -translate-x-1/2`: that translate made each card's level badge a compositor layer, and the ring and pin over it followed (78 layers, 4ms of layerizing a frame on a fast scroll).
- Never `inert` or `pointer-events: none` on items of a long list: Chrome lifts each hit-test-transparent part into its own layer (97 layers in edit mode). Cover the item with an element that takes the presses instead.
- Line height is the font's own (`normal`), as in the mockups; set `leading-*` only on running text.

## Phones

A screen is done once it holds at 360px wide with touch emulation.

- Below `lg` `--font-base` is 10% larger, so every `text-*` step and 1em icon grows on phones. A phone-only mockup size maps to the step 10% below it: 28px title `text-26`, 15.5px row label `text-14`, 13px hint `text-12`, 11px tab label `text-10`. Never add `text-base lg:text-sm` pairs to compensate.
- A field and the button beside it take the same `size`: `touch-control-*` lines them up only then.
- A width prop caps at the viewport: `width="min(92vw, 30rem)"`, never a bare `30rem`.
- A row that can outgrow 360px wraps: a heading beside a `nowrap` button stacks below `sm`, and metadata wraps with `line-clamp-2` instead of a `truncate` that hides it.
- A horizontal strip that scrolls centers its active item: `FpTabs` and `FpNavMenu` do it, a custom strip calls `useCenterActive`.

## Motion

- Pick the token by role: `press` instant acknowledgement, `fast` exits, hover and small changes, `base` routine enters, `slow` layout, overlays and a whole page travelling (route slides, the nav highlight, the dock), `reveal` authored focal moments, `cycle` one loader loop, `stagger` list delay. Exits run shorter than their entrance.
- Easing: `ease-out` default, `ease-in` exits leaving the screen, `ease-spring` overshoot on transforms only (never opacity or progress), `ease-in-out` loops, `ease-move` a page travelling.
- Templates use `duration-*`, `delay-*`, `ease-*` utilities; scripts read `durationToken()` / `easingToken()` from `@so/ui`.
- Shared feedback: `animate-pop` (something arrives), `animate-bump` + `useBump()` (a value changed, never on mount), `animate-settle` (content lands), `animate-shake` via `FpShake` (a wrong password or PIN).
- Motion level (`gamify`, `simple`, `off`): `motion-off:`, `motion-simple:`, `motion-on:` (not off), `motionLevel()` (`useMotionLevel()` when a computed must follow a live `auto` change); never read `prefers-reduced-motion` or `data-motion` yourself. `simple` turns `--ease-spring` into `--ease-out`, so springs lose their overshoot without a branch, and a move that carries a page on Gamify travels only `--shift-travel`; `off` lands every change at once and keeps it visible. Off clamps every CSS animation but zeroes only the `--dur-*` tokens for transitions, so a transition takes a token duration (`duration-*`, `var(--dur-*)`); a literal one keeps playing under Off, which only functional progress may do (the hold fill). Never put `transition-*` on `*`: transition data on every element doubles each style recalc.
- Animate opacity on the glass element itself, never an ancestor: ancestor opacity, filter or mask kills descendant backdrop blur (transforms are safe). The Simple route shift is the one exception: glass goes flat for its fade.
- Reka popper content (popovers, menus, selects) ignores scoped state selectors: style it in a global block with `fp-` classes. Scoped styles work for Dialog content (Modal, Drawer).
- Animate `translate`, `scale` and `opacity`. Never tween `height`, `width`, `top` or `margin` on a tall subtree; inside an `FpModal` it also re-measures the panel (`ui-modal.md`).
- In-place drill-down and tab switches are `FpViewStack`'s job (the settings sections slide along the nav with `axis="y"`); tall pages and switchers inside an `FpModal` pass `:morph="false"`.
- Route changes are the shell's (`ShellPages`, `services/routeMotion.ts`), CSS keyframes on two page layers that already exist, and follow the motion level, never the surface: Gamify slides the page along the nav axis and drills a deeper page of one section in, Simple shifts and fades both. On Gamify a detail page with `meta.hero` (the profile) morphs from its list item on desktop instead, a View Transition between two `data-vt-hero` elements; the name exists only while it runs, because a named element is a backdrop root that would cut its glass off. A route needs `meta.nav` to take part.
- A page that measures its place in the scroller reads layout offsets (`offsetTop`), never `getBoundingClientRect`: it may mount mid-slide.
- The rail and the phone dock each move one highlight with `translate`, `duration-slow ease-move`, from an index var (no layout reads); the dock hides with `translate` on scroll down (`useDock`).
