---
paths:
  - 'packages/ui/src/components/overlays/Modal/**'
---

# FpModal: scroll, stacking, motion

- The scroll container is the presence-managed overlay wrapper, not the panel, so `position: sticky` inside content works; `scrollbar-gutter: stable both-edges` stops layout jumps, and the wrapper's scroll position survives stacking.
- The panel is `.surface-pop` (`--surf-pop`, `--pop-filter`). `bare` makes the slot the whole dialog (the settings window): no header or footer, the panel clips its corners, `title` and `description` stay as screen-reader text, and the slot places its own `FpModalClose`.
- Props: `title`, `description`, `width` (default `min(92vw, 28rem)`), `closeLabel`, `bare`; `dismissible: false` blocks Escape and outside clicks and hides the close button; `modal` goes to reka; `#close` (scoped `close()`) replaces the close button, `#footer` carries actions.
- A modal opened from a modal turns the lower panel into a card: lifted, scaled, dimmed, given the top panel's width and a prescribed height (animated `width` / `height`, content reflows), peeking 16px under one shared overlay. Layers deeper than two stay open but `visibility: hidden` until the stack unwinds.
- `modal-stack.ts` is a module-level registry of depth and measured panel sizes; reka's nested dialogs handle Escape per layer and focus.
- `useModalMeasure` re-measures on every resize and subtree mutation of the content: panel `height: auto`, read `scrollHeight`, restore, which lays out the whole panel. Content whose height changes each frame measures each frame, at a cost that grows with the content. Content heights change in one step or on the compositor.
- Inside a modal `FpCollapsible` and `FpAccordion` pass `:morph="false"`: their height keyframes would feed the measure every frame, and the panel spring would chase them.
- While `[data-fp-view-swapping]` is inside the panel, a `:has()` rule in `Modal.vue` drops the panel's height transition, so the spring does not lag the swap. Any other content that owns its height during a change needs the same.
- The panel fade (`--animate-panel-*`) sits on the glass element, split from the shell's transform keyframes, because ancestor opacity kills backdrop blur.
