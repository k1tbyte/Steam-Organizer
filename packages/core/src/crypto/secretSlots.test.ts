import { describe, expect, it } from 'vitest'

import {
    createDeviceKey,
    createVault,
    deviceWrap,
    loginTag,
    newKdf,
    openSecretSlot,
    passwordSecretSlot,
    pinWrap,
    prfWrap,
    resealSecretSlot,
    slotOf,
    UnsupportedVaultError,
    unlockVault,
    unlockVaultWith,
    WrongPasswordError,
} from '../index'

const PASSWORD = 'correct horse'

async function created() {
    const { file, key } = await createVault(PASSWORD)
    const slot = await passwordSecretSlot(file.slots.password, PASSWORD)
    return { file, key, slot }
}

describe('secret slots', () => {
    it('moves the secret from the password slot to a device slot and opens the same vault from it', async () => {
        const { file, key, slot } = await created()
        const device = deviceWrap(await createDeviceKey())
        const sealed = await resealSecretSlot(slot, device)

        const opened = await unlockVaultWith(file, slotOf(device, sealed))
        expect(await loginTag(opened, 'Alex')).toBe(await loginTag(key, 'alex'))
        expect(opened.recovery).toBeDefined()
    })

    it('chains slots: password to PIN to passkey, each opening the same vault', async () => {
        const { key, slot } = await created()
        const kdf = newKdf()
        const pin = await pinWrap('123456', kdf)
        const pinSlot = slotOf(pin, await resealSecretSlot(slot, pin))
        const prf = await prfWrap(crypto.getRandomValues(new Uint8Array(32)))
        const prfSlot = slotOf(prf, await resealSecretSlot(pinSlot, prf))

        const tag = await loginTag(key, 'a')
        expect(await loginTag(await openSecretSlot(pinSlot), 'a')).toBe(tag)
        expect(await loginTag(await openSecretSlot(prfSlot), 'a')).toBe(tag)
    })

    it('refuses a wrong key as a wrong password, in both the open and the reseal', async () => {
        const { slot } = await created()
        const device = deviceWrap(await createDeviceKey())
        const sealed = await resealSecretSlot(slot, device)
        const other = deviceWrap(await createDeviceKey())

        await expect(
            openSecretSlot(slotOf(other, sealed)),
        ).rejects.toBeInstanceOf(WrongPasswordError)
        await expect(
            resealSecretSlot(slotOf(other, sealed), device),
        ).rejects.toBeInstanceOf(WrongPasswordError)
        // The PIN's own salt and the info bind the blob: another PIN or another slot's info never opens it.
        const kdf = newKdf()
        const pin = await pinWrap('123456', kdf)
        const pinSealed = await resealSecretSlot(slot, pin)
        await expect(
            openSecretSlot(slotOf(await pinWrap('654321', kdf), pinSealed)),
        ).rejects.toBeInstanceOf(WrongPasswordError)
        await expect(
            openSecretSlot(slotOf({ ...pin, info: 'slot:prf' }, pinSealed)),
        ).rejects.toBeInstanceOf(WrongPasswordError)
    })

    it('refuses a damaged slot as an unsupported vault', async () => {
        const { slot } = await created()
        const device = deviceWrap(await createDeviceKey())
        const damaged = slotOf(device, new Uint8Array(20).toBase64())
        await expect(openSecretSlot(damaged)).rejects.toBeInstanceOf(
            UnsupportedVaultError,
        )
        await expect(resealSecretSlot(damaged, device)).rejects.toBeInstanceOf(
            UnsupportedVaultError,
        )
        await expect(
            passwordSecretSlot({ kdf: newKdf(), key: damaged.sealed }, 'x'),
        ).rejects.toBeInstanceOf(UnsupportedVaultError)
        expect(slot.info).toBe('slot:password')
    })

    it('keeps the password path: a wrong password is refused and the right one opens', async () => {
        const { file } = await created()
        await expect(unlockVault(file, 'nope')).rejects.toBeInstanceOf(
            WrongPasswordError,
        )
        await expect(unlockVault(file, PASSWORD)).resolves.toBeDefined()
    })

    it('makes a device key that cannot be extracted', async () => {
        const key = await createDeviceKey()
        expect(key.extractable).toBe(false)
        expect(key.usages.sort()).toEqual(['unwrapKey', 'wrapKey'])
        await expect(crypto.subtle.exportKey('raw', key)).rejects.toThrow()
    })

    it('never reseals into the same bytes: every wrap gets a fresh IV', async () => {
        const { slot } = await created()
        const device = deviceWrap(await createDeviceKey())
        expect(await resealSecretSlot(slot, device)).not.toBe(
            await resealSecretSlot(slot, device),
        )
    })
})
