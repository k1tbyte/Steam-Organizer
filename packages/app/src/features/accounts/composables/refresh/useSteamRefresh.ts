import {
    type AccountData,
    type AccountSecret,
    fetchProfiles,
    joinAccount,
    openSecret,
    readAccount,
    readSettings,
    SETTINGS_ID,
    type SteamSnapshot,
    sealRecord,
    splitAccount,
    updateData,
} from '@so/core'

import { useSteamApi } from '#features/steam'
import { useVaultSession } from '#features/vault'

type Profile = { steamId: string; steam: SteamSnapshot }
type Fresh = Map<string, Profile>

/** A Steam ID changed meanwhile, or a refresh started later already landed. */
const stale = (data: AccountData, next: Profile) =>
    data.steamId !== next.steamId ||
    (data.steam?.refreshedAt ?? 0) > next.steam.refreshedAt

/** Refreshes accounts from Steam. Only `steam` changes: `editedAt` stays, so a sync tells the user's edits from a refresh.
 *  An everything lock hides the Steam ID, so such an account refreshes only while open. */
export function useSteamRefresh() {
    const session = useVaultSession()
    const steam = useSteamApi()

    async function steamIdsOf(ids: readonly string[]) {
        const found = new Map<string, string>()
        for (const id of ids) {
            const data = readAccount(session.contents?.data.get(id))
            if (!data) continue
            const hidden =
                data.lock?.scope === 'everything' && session.keyOf(id)
                    ? (await session.secretOf<AccountSecret>(id))?.hidden
                    : undefined
            const steamId = hidden?.steamId ?? data.steamId
            if (steamId) found.set(id, steamId)
        }
        return found
    }

    function write(fresh: Fresh) {
        // Taken now, as `transact` takes the vault key: a relock while queued still lets the write land.
        const keys = new Map(
            [...fresh.keys()].map((id) => [id, session.keyOf(id)]),
        )
        return session.transact(async (contents, key) => {
            const updatedAt = Date.now()
            const placement = readSettings(
                contents.data.get(SETTINGS_ID),
            ).fieldDefaults
            const written = await Promise.all(
                contents.records.map(async (record) => {
                    const next = fresh.get(record.id)
                    const data = readAccount(contents.data.get(record.id))
                    if (!next || !data || 'deleted' in record) return []
                    if (data.lock?.scope !== 'everything')
                        return stale(data, next)
                            ? []
                            : [
                                  await updateData(
                                      key,
                                      record,
                                      { ...data, steam: next.steam },
                                      updatedAt,
                                  ),
                              ]
                    const accountKey = keys.get(record.id)
                    const secret =
                        accountKey &&
                        (await openSecret<AccountSecret>(
                            key,
                            record,
                            accountKey,
                        ))
                    if (!secret) return []
                    const whole = joinAccount(data, secret)
                    if (stale(whole.data, next)) return []
                    const parts = splitAccount(
                        { ...whole.data, steam: next.steam },
                        whole.secret,
                        placement,
                    )
                    return [
                        await sealRecord(
                            key,
                            { id: record.id, updatedAt, ...parts },
                            accountKey,
                        ),
                    ]
                }),
            )
            return written.flat()
        })
    }

    return {
        reachable: steam.reachable,
        /** Resolves to the accounts Steam has no profile for now; rejects with a `SteamError`. */
        async refresh(ids: readonly string[]): Promise<string[]> {
            const steamIds = await steamIdsOf(ids)
            if (steamIds.size === 0) return []
            const profiles = await fetchProfiles(await steam.api(), [
                ...new Set(steamIds.values()),
            ])
            const fresh: Fresh = new Map()
            const missing: string[] = []
            for (const [id, steamId] of steamIds) {
                const profile = profiles.get(steamId)
                if (profile) fresh.set(id, { steamId, steam: profile })
                else missing.push(id)
            }
            await write(fresh)
            return missing
        },
    }
}
