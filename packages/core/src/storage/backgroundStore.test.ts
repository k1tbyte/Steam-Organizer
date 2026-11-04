import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'

import { backgroundStore } from './backgroundStore'

it('keeps each picture by its id, the latest written, until removed', async () => {
    expect(await backgroundStore.read('a')).toBeUndefined()
    await backgroundStore.write(
        'a',
        new Blob(['first'], { type: 'image/jpeg' }),
    )
    await backgroundStore.write(
        'a',
        new Blob(['second'], { type: 'image/jpeg' }),
    )
    await backgroundStore.write(
        'b',
        new Blob(['other'], { type: 'image/jpeg' }),
    )
    const read = await backgroundStore.read('a')
    expect(read?.type).toBe('image/jpeg')
    expect(await read?.text()).toBe('second')
    expect(await backgroundStore.has('a')).toBe(true)
    await backgroundStore.remove('a')
    expect(await backgroundStore.read('a')).toBeUndefined()
    expect(await backgroundStore.has('a')).toBe(false)
    expect(await (await backgroundStore.read('b'))?.text()).toBe('other')
})
