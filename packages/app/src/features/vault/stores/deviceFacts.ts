import { shallowRef } from 'vue'

import type { DeviceFacts } from '../model'
import { readPlaced } from '../services/device/deviceSlots'

/** The session's device half: what each vault on this device opens with besides the password, as the unlock screen
 *  and Settings read it. Never a slot or a key: only that one exists and how many wrong tries it holds. */
export function deviceFacts() {
    const facts = shallowRef(new Map<string, DeviceFacts>())

    const set = (id: string, next: DeviceFacts | undefined) => {
        const copy = new Map(facts.value)
        if (next) copy.set(id, next)
        else copy.delete(id)
        facts.value = copy
    }

    return {
        facts,
        /** Reads the slots of vaults again, after an attempt or a change. */
        async refresh(ids: readonly string[]) {
            const read = await Promise.all(
                ids.map(async (id) => [id, await readPlaced(id)] as const),
            )
            const copy = new Map(facts.value)
            for (const [id, { pin, prf }] of read)
                if (pin || prf)
                    copy.set(id, {
                        ...(pin && { pin: { wrong: pin.wrong } }),
                        ...(prf && { prf: true }),
                    })
                else copy.delete(id)
            facts.value = copy
        },
        /** A demo vault (mock mode) counts its wrong PINs in memory, so the screen behaves as with a real one. */
        demoPin(id: string, ok: boolean) {
            const wrong = ok ? 0 : (facts.value.get(id)?.pin?.wrong ?? 0) + 1
            set(id, { pin: { wrong } })
        },
        forget: (id: string) => set(id, undefined),
    }
}
