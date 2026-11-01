import 'fake-indexeddb/auto'

import { expect, it } from 'vitest'

import { type DeviceSlots, deviceStore } from '../index'

const pin = (wrong: number): DeviceSlots => ({
    pin: {
        kdf: { name: 'PBKDF2-SHA-256', iterations: 1, salt: 'AA==' },
        key: 'sealed',
        wrong,
    },
})

it('keeps one non-extractable device key, made once', async () => {
    const [a, b] = await Promise.all([deviceStore.key(), deviceStore.key()])
    expect(a.extractable).toBe(false)
    // A secret one call wraps opens with the other: both hold the stored key.
    const aes = { name: 'AES-GCM', iv: new Uint8Array(12) }
    const secret = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt'],
    )
    const wrapped = await crypto.subtle.wrapKey('raw', secret, a, aes)
    await expect(
        crypto.subtle.unwrapKey(
            'raw',
            wrapped,
            b,
            aes,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt'],
        ),
    ).resolves.toBeDefined()
})

it('lists, replaces and removes the slots of each vault', async () => {
    await deviceStore.put('a', pin(0))
    await deviceStore.put('b', { kept: 'sealed' })
    await deviceStore.put('a', pin(2))
    const list = await deviceStore.list()
    expect(list.map((slots) => slots.vaultId).sort()).toEqual(['a', 'b'])
    expect(await deviceStore.get('a')).toEqual(pin(2))

    await deviceStore.remove('a')
    expect(await deviceStore.get('a')).toBeUndefined()
    expect(await deviceStore.get('b')).toEqual({ kept: 'sealed' })
})

it('changes one vault in a single transaction and deletes a record left empty', async () => {
    await deviceStore.put('c', pin(0))
    await Promise.all(
        [1, 2].map(() =>
            deviceStore.update('c', (slots) =>
                slots.pin
                    ? { pin: { ...slots.pin, wrong: slots.pin.wrong + 1 } }
                    : slots,
            ),
        ),
    )
    expect((await deviceStore.get('c'))?.pin?.wrong).toBe(2)

    await deviceStore.update('c', () => ({}))
    expect(await deviceStore.get('c')).toBeUndefined()
    expect(
        (await deviceStore.list()).some((slots) => slots.vaultId === 'c'),
    ).toBe(false)
})
