/** An uploaded icon rides in every copy of the vault: kept small. */
export const MAX_ICON_BYTES = 16 * 1024

/** The SVG markup a file holds, or null when it is too big or no SVG. */
export function readSvg(text: string): string | null {
    const markup = text
        .trim()
        .replace(/^<\?xml[^>]*\?>\s*/, '')
        .replace(/^<!--[\s\S]*?-->\s*/, '')
        .replace(/^<!DOCTYPE[^>]*>\s*/i, '')
    const ok =
        new Blob([markup]).size <= MAX_ICON_BYTES &&
        /^<svg[\s>]/i.test(markup) &&
        /<\/svg>$/i.test(markup)
    return ok ? markup : null
}

/** A CSS mask image: drawn as an image, so nothing in the SVG runs, and painted with the text color. */
export function svgMask(svg: string): string {
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
