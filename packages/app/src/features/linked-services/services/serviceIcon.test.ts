import { describe, expect, it } from 'vitest'

import { MAX_ICON_BYTES, readSvg, svgMask } from './serviceIcon'

const SVG = '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>'

describe('readSvg', () => {
    it('takes an SVG past its prolog', () => {
        expect(readSvg(`<?xml version="1.0"?>\n<!-- logo -->\n${SVG}\n`)).toBe(
            SVG,
        )
    })

    it('refuses other files and oversized ones', () => {
        expect(readSvg('{"shared_secret": "x"}')).toBeNull()
        expect(readSvg('<svgx></svgx>')).toBeNull()
        const big = `<svg>${'x'.repeat(MAX_ICON_BYTES)}</svg>`
        expect(readSvg(big)).toBeNull()
    })
})

it('svgMask escapes the markup into a data URL', () => {
    expect(svgMask('<svg a="1"/>')).toBe(
        'url("data:image/svg+xml,%3Csvg%20a%3D%221%22%2F%3E")',
    )
})
