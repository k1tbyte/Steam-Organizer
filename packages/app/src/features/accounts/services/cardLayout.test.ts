import { describe, expect, it } from 'vitest'

import { cardHeightCss, cardHeightPx } from './cardLayout'
import { DEFAULT_CARD_FLAGS } from './storedState'

const noTags = { ...DEFAULT_CARD_FLAGS, tags: false }

describe('cardHeightPx', () => {
    it('matches the mockup at comfortable density', () => {
        expect(cardHeightPx(noTags, false, 4)).toBe(141)
        expect(cardHeightPx(DEFAULT_CARD_FLAGS, false, 4)).toBe(179)
        expect(cardHeightPx(noTags, true, 4)).toBe(149)
    })

    it('drops the footer when no footer field is on', () => {
        const bare = { ...noTags, guard: false, note: false, actions: false }
        expect(cardHeightPx(bare, false, 4)).toBe(56 + 7 * 4)
    })

    it('scales with density only through the units', () => {
        expect(cardHeightPx(noTags, false, 5)).toBe(
            cardHeightPx(noTags, false, 4) + 13,
        )
    })
})

describe('cardHeightCss', () => {
    it('writes the same height against the density unit', () => {
        expect(cardHeightCss(noTags, false)).toBe(
            'calc(89px + var(--density-unit) * 13)',
        )
    })
})
