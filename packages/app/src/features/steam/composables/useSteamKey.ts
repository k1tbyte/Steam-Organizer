import { readSettingsSecret, SETTINGS_ID, withSteamKey } from '@so/core'
import { computed, shallowRef, watch } from 'vue'

import { useVaultSession } from '#features/vault'

type Session = ReturnType<typeof useVaultSession>

/** The vault's key, or '' without one. */
export async function readSteamKey(session: Session) {
    const secret = await session.secretOf(SETTINGS_ID)
    return readSettingsSecret(secret).steamApiKey ?? ''
}

/** The vault's Steam Web API key, sealed in the settings record: it syncs with the vault and never touches device storage. */
export function useSteamKey() {
    const session = useVaultSession()
    // null until the settings record is read; read again whenever it changes.
    const key = shallowRef<string | null>(null)
    const record = computed(() =>
        session.contents?.records.find((found) => found.id === SETTINGS_ID),
    )
    let run = 0
    watch(
        record,
        async () => {
            const current = ++run
            const read = await readSteamKey(session)
            if (current === run) key.value = read
        },
        { immediate: true },
    )

    return {
        key,
        /** An empty key removes it. */
        save: (next: string) =>
            session.transact(async (contents, vaultKey) => [
                await withSteamKey(
                    vaultKey,
                    contents.records.find((found) => found.id === SETTINGS_ID),
                    next,
                ),
            ]),
    }
}
