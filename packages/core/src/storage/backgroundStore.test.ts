import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'

import { backgroundStore } from './backgroundStore'

it('keeps one picture, the latest written, until cleared', async () => {
    expect(await backgroundStore.read()).toBeUndefined()
    await backgroundStore.write(new Blob(['first'], { type: 'image/jpeg' }))
    await backgroundStore.write(new Blob(['second'], { type: 'image/jpeg' }))
    const read = await backgroundStore.read()
    expect(read?.type).toBe('image/jpeg')
    expect(await read?.text()).toBe('second')
    await backgroundStore.clear()
    expect(await backgroundStore.read()).toBeUndefined()
})
