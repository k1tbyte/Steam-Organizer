import {
    type AccountData,
    type AccountSecret,
    openSecret,
    readAccount,
    sealRecord,
} from '@so/core'

import { useVaultSession } from '#features/vault'

/** Null refuses: the latest record no longer fits what the user edited. */
type SecretChange = (
    secret: AccountSecret,
    data: AccountData,
) => { secret: AccountSecret; data?: Partial<AccountData> } | null

/** Rewrites one account's secret, and its data when the change says, on the latest record in the write queue.
 *  Resolves to false when the change refused; a sample (no record has its id) takes nothing. */
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
            return [
                await sealRecord(key, {
                    id,
                    updatedAt,
                    data: { ...data, ...next.data, editedAt: updatedAt },
                    secret: next.secret,
                }),
            ]
        })
        return !refused
    }
}
