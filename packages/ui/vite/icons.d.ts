import type { Plugin } from 'vite'

/** Serves FpIcon's glyphs: every `icon-[set--name]` literal in the kit and in `sources` (dirs relative to Vite's root). */
export function fpIcons(options?: { sources?: string[] }): Plugin
