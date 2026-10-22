import { describe, expect, it } from 'vitest'

import { keyItems, menuGroups } from './menu'

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

describe('menuGroups', () => {
    it('takes a flat list as one group', () => {
        expect(menuGroups([{ label: 'A' }, { label: 'B' }])).toHaveLength(1)
    })

    it('keeps group fields and wraps bare arrays', () => {
        const groups = menuGroups([
            [{ label: 'A' }],
            { choice: 'list', value: 'b', items: [{ key: 'b', label: 'B' }] },
        ])
        expect(groups.map((group) => group.choice)).toEqual([undefined, 'list'])
        expect(groups[1]?.items[0]?.key).toBe('b')
    })
})
