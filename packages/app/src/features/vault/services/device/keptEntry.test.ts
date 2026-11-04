import { beforeEach, expect, it } from 'vitest'

import { installSessionArea, memorySessionArea } from '#core'

import { removeKept, sessionBound } from './keptEntry'

beforeEach(() => installSessionArea(memorySessionArea()))

it('a lock removes every session-bound value, whichever page wrote it', async () => {
    await sessionBound.write('so:autofill:tab:4', 'a')
    await sessionBound.write('so:autofill:tab:9', 'b')
    await sessionBound.write('so:autofill:tab:4', 'c')
    expect(await sessionBound.read('so:autofill:tab:4')).toBe('c')

    await removeKept()
    expect(await sessionBound.read('so:autofill:tab:4')).toBeUndefined()
    expect(await sessionBound.read('so:autofill:tab:9')).toBeUndefined()
    expect(await sessionBound.read('so:kept:bound')).toBeUndefined()
})
