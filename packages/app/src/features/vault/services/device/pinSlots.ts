import {
    newKdf,
    passwordBits,
    pinWrap,
    pinWrapFromBits,
    resealSecretSlot,
    type SecretSlot,
    sealRearm,
    slotOf,
    type VaultFile,
    type VaultKey,
} from '@so/core'
import { opens } from '../openVault'
import {
    changePlaced,
    readPlaced,
    saveSlot,
    withSlotsLock,
} from './deviceSlots'
import { isPinLocked, PIN_LENGTH } from './pinAttempts'

const isPin = (pin: string) => new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)

/** The PIN's slot when `pin` opens `file`; a wrong one counts against the three tries saved with the slot, and at three
 *  the answer is `wrong` untried. Re-reading the count, trying and saving it hold one Web Lock. */
export function tryPin(
    file: VaultFile,
    pin: string,
): Promise<SecretSlot | 'wrong' | 'unreadable'> {
    return withSlotsLock(file.id, async () => {
        const slot = (await readPlaced(file.id)).pin
        if (!slot || !isPin(pin) || isPinLocked(slot.wrong)) return 'wrong'
        const wrapped = slotOf(await pinWrap(pin, slot.kdf), slot.key)
        const key = await opens(file, wrapped)
        if (key === 'unreadable') return key
        const wrong = key === 'wrong' ? slot.wrong + 1 : 0
        if (wrong !== slot.wrong)
            await changePlaced(file.id, ({ pin: current, ...rest }) => ({
                ...rest,
                ...(current && { pin: { ...current, wrong } }),
            }))
        return key === 'wrong' ? 'wrong' : wrapped
    })
}

/** Moves the secret from the password slot under a new PIN's key, and seals the PBKDF2 bits under `records` so that
 *  Master password after restart can build the slot again. A wrong password is `WrongPasswordError`. */
export function enrollPin(
    vaultId: string,
    records: VaultKey,
    from: SecretSlot,
    pin: string,
) {
    return withSlotsLock(vaultId, async () => {
        const kdf = newKdf()
        const bits = await passwordBits(pin, kdf)
        try {
            const key = await resealSecretSlot(
                from,
                await pinWrapFromBits(bits),
            )
            const sealed = await sealRearm(records, 'pin', bits)
            await saveSlot(
                vaultId,
                'pin',
                { kdf, bits: sealed },
                { kdf, key, wrong: 0 },
            )
        } finally {
            bits.fill(0)
        }
    })
}
