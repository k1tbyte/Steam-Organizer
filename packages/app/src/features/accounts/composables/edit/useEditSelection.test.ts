import { beforeEach, describe, expect, it } from 'vitest'

import type { Account } from '../../model'
import { useEditSelection } from './useEditSelection'

const accounts = (...ids: string[]) => ids.map((id) => ({ id }) as Account)
const shown = accounts('p0', 'p1', 'r0', 'r1', 'r2')
const selection = useEditSelection()
const picked = () => [...selection.ids.value]

describe('useEditSelection', () => {
    beforeEach(() => {
        selection.show(shown)
        selection.clear()
    })

    it('toggles cards from both groups', () => {
        selection.toggle('p1', shown, false)
        selection.toggle('r2', shown, false)
        selection.toggle('p1', shown, false)
        expect(picked()).toEqual(['r2'])
    })

    it('picks a range across the groups from the last card clicked', () => {
        selection.toggle('r1', shown, false)
        selection.toggle('p1', shown, true)
        expect(picked().sort()).toEqual(['p1', 'r0', 'r1'])
    })

    it('selects every shown card and drops the ones a filter hides', () => {
        selection.selectAll()
        expect(selection.count.value).toBe(5)
        selection.show(accounts('p0', 'r1'))
        expect(picked()).toEqual(['p0', 'r1'])
    })
})
