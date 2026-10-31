import { shallowRef } from 'vue'

/** The session's keys of records sealed apart from the vault key (locked accounts), opened this session. */
export function recordKeyring() {
    // Reactive, so a lock shows at once.
    const keys = shallowRef(new Map<string, CryptoKey>())
    // Bumped by every clear and every drop, so a key that opens late never undoes either.
    let epoch = 0
    const drops = new Map<string, number>()

    return {
        get: (id: string) => keys.value.get(id),
        /** Take it before the key starts opening: it refuses a key once the record was dropped or the keyring cleared. */
        holder(id: string) {
            const at = epoch
            const drop = drops.get(id) ?? 0
            return (key: CryptoKey) => {
                if (at !== epoch || drop !== (drops.get(id) ?? 0)) return
                keys.value = new Map(keys.value).set(id, key)
            }
        },
        drop(id: string) {
            drops.set(id, (drops.get(id) ?? 0) + 1)
            if (!keys.value.has(id)) return
            const next = new Map(keys.value)
            next.delete(id)
            keys.value = next
        },
        clear() {
            keys.value = new Map()
            epoch++
        },
    }
}
