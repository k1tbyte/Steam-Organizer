import {
    type AccountData,
    type AccountSecret,
    openSecret,
    placeFields,
    readAccount,
    readSettings,
    SETTINGS_ID,
    sealRecord,
} from '@so/core'

import { useVaultSession } from '#features/vault'

/** `data` replaces the record's data when given; null refuses: the latest record no longer fits what the user edited. */
type SecretChange = (
    secret: AccountSecret,
    data: AccountData,
) => { secret: AccountSecret; data?: AccountData } | null

/** Rewrites one account's secret, and its data when the change says, on the latest record in the write queue.
 *  Movable fields land where the vault's placement puts them. Resolves to false when the change refused;
 *  a sample (no record has its id) takes nothing. */
export function useEditSecret() {
    const session = useVaultSession()
    return async (id: string, change: SecretChange) => {
        let refused = false
        await session.transact(async (contents, key) => {
            const record = contents.records.find((found) => found.id === id)
            const data = readAccount(contents.data.get(id))
            if (!record || 'deleted' in record || !data) return []
            const secret = (await openSecret<AccountSecret>(key, record)) ?? {
                password: '',
                services: [],
            }
            const next = change(secret, data)
            if (!next) {
                refused = true
                return []
            }
            const updatedAt = Date.now()
            const placed = placeFields(
                { ...(next.data ?? data), editedAt: updatedAt },
                next.secret,
                readSettings(contents.data.get(SETTINGS_ID)).fieldDefaults,
            )
            return [
                await sealRecord(key, {
                    id,
                    updatedAt,
                    data: placed.data,
                    secret: placed.secret,
                }),
            ]
        })
        return !refused
    }
}
