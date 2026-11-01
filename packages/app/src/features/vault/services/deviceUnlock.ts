import {
    deviceStore,
    deviceWrap,
    resealSecretSlot,
    type Sealed,
    type SecretSlot,
    slotOf,
} from '@so/core'

import { reportError } from '../../../core/reportError'

/** The secret sealed under this device's key, to keep it past a reload. Undefined where the device key is out of
 *  reach (storage denied): the vault opens anyway, it just is not kept. */
export async function sealForDevice(
    slot: SecretSlot,
): Promise<Sealed | undefined> {
    try {
        return await resealSecretSlot(slot, deviceWrap(await deviceStore.key()))
    } catch (error) {
        reportError(error, 'vault-session')
        return undefined
    }
}

/** The device slot a kept entry holds. */
export async function deviceSlotOf(sealed: Sealed): Promise<SecretSlot> {
    return slotOf(deviceWrap(await deviceStore.key()), sealed)
}
