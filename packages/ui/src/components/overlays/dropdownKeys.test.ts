import { describe, expect, it } from 'vitest'

import { keyItems } from './dropdownKeys'

const keys = (items: Parameters<typeof keyItems>[0]) =>
    keyItems(items).map((item) => item.key)

describe('keyItems', () => {
    it('tells rows that share a label apart by their description', () => {
        expect(
            new Set(
                keys([
                    { label: 'Translate from English', description: 'Main' },
                    { label: 'Translate from English', description: 'SDH' },
                ]),
            ).size,
        ).toBe(2)
    })

    it('keeps an explicit key', () => {
        expect(keys([{ key: 't1', label: 'Same' }])).toEqual(['t1'])
    })

    it('numbers items that are alike in everything else', () => {
        const [first, second, third] = keys([
            { label: 'Generate from audio', description: 'Dub' },
            { label: 'Generate from audio', description: 'Dub' },
            { label: 'Generate from audio', description: 'Dub' },
        ])
        expect(new Set([first, second, third]).size).toBe(3)
    })

    it('leaves the item itself alone', () => {
        const onSelect = () => {}
        expect(keyItems([{ label: 'A', onSelect }])[0]?.onSelect).toBe(onSelect)
    })
})
