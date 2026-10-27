import {
    type AccountData,
    type AccountSecret,
    joinAccount,
    openSecret,
    readAccount,
    readSettings,
    SETTINGS_ID,
    sealRecord,
    splitAccount,
} from '@so/core'

import { useVaultSession } from '#features/vault'

/** `data` replaces the record's data when given; null refuses: the latest record no longer fits what the user edited. */
type SecretChange = (
    secret: AccountSecret,
    data: AccountData,
) => { secret: AccountSecret; data?: AccountData } | null

/** Rewrites one account's secret, and its data when the change says, on the latest record in the write queue.
 *  The change sees the account whole (a lock's hidden data joined back); the parts split again as the lock and the
 *  vault's placement say. Resolves to false when the change refused or the account is locked; a sample takes nothing. */
export function useEditSecret() {
    const session = useVaultSession()
    return async (id: string, change: SecretChange) => {
        // Taken now: a draft flushed by a vault lock lands after the key is dropped.
        const accountKey = session.keyOf(id)
        let refused = false
        await session.transact(async (contents, key) => {
            const record = contents.records.find((found) => found.id === id)
            const data = readAccount(contents.data.get(id))
            if (!record || 'deleted' in record || !data) return []
            if (data.lock && !accountKey) {
                refused = true
                return []
            }
            const opened = (await openSecret<AccountSecret>(
                key,
                record,
                accountKey,
            )) ?? {
                password: '',
                services: [],
            }
            const whole = joinAccount(data, opened)
            const next = change(whole.secret, whole.data)
            if (!next) {
                refused = true
                return []
            }
            const updatedAt = Date.now()
            const parts = splitAccount(
                { ...(next.data ?? whole.data), editedAt: updatedAt },
                next.secret,
                readSettings(contents.data.get(SETTINGS_ID)).fieldDefaults,
            )
            return [
                await sealRecord(key, { id, updatedAt, ...parts }, accountKey),
            ]
        })
        return !refused
    }
}
