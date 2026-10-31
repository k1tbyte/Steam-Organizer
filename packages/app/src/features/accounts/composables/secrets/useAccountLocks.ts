import {
    type AccountCredential,
    type AccountData,
    type AccountLock,
    type AccountSecret,
    changeAccountPassword,
    createAccountKey,
    joinAccount,
    type LockScope,
    openAccountKey,
    openSecret,
    publicData,
    readAccount,
    readSettings,
    SETTINGS_ID,
    sealRecord,
    splitAccount,
    steamCache,
    steamTag,
    updateData,
    type VaultKey,
    WrongPasswordError,
} from '@so/core'

import { useVaultSession } from '#features/vault'

type Contents = NonNullable<ReturnType<typeof useVaultSession>['contents']>

const NO_SECRET: AccountSecret = { password: '', services: [] }

function liveAccount(contents: Contents, id: string) {
    const record = contents.records.find((found) => found.id === id)
    const data = readAccount(contents.data.get(id))
    if (!record || 'deleted' in record || !data) return null
    return { record, data }
}

const WRONG = Symbol('wrong password')

// A wrong password resolves to WRONG; any other failure is the caller's to report.
async function checked<T>(attempt: Promise<T>): Promise<T | typeof WRONG> {
    try {
        return await attempt
    } catch (error) {
        if (error instanceof WrongPasswordError) return WRONG
        throw error
    }
}

/** An account's own password: set, open, change and remove it. An opened account stays open until `relock` or the vault locks. */
export function useAccountLocks() {
    const session = useVaultSession()
    const lockOf = (id: string) =>
        readAccount(session.contents?.data.get(id))?.lock

    /** The account key, by its password or the master password where recovery is on. */
    function openKey(id: string, credential: AccountCredential) {
        const lock = lockOf(id)
        if (!lock) return Promise.resolve(undefined)
        return checked(
            session.withKey((key, slots) =>
                openAccountKey(key, slots, id, lock.slots, credential),
            ),
        )
    }

    /** Opens the account until relocked; false when the credential is wrong. */
    async function unlock(id: string, credential: AccountCredential) {
        const hold = session.keyHolder(id)
        const opened = await openKey(id, credential)
        if (opened === WRONG) return false
        if (opened) hold(opened)
        return true
    }

    /** Reseals the account with its whole secret: `next` gives the data's new lock (none removes it). */
    function reseal(
        id: string,
        accountKey: CryptoKey | undefined,
        next: (
            data: AccountData,
            key: VaultKey,
        ) => Promise<{ data: AccountData; key?: CryptoKey } | null>,
    ) {
        return session.transact(async (contents, key) => {
            const live = liveAccount(contents, id)
            if (!live) return []
            const opened = await openSecret<AccountSecret>(
                key,
                live.record,
                accountKey,
            )
            const whole = joinAccount(live.data, opened ?? NO_SECRET)
            const changed = await next(whole.data, key)
            if (!changed) return []
            const placement = readSettings(
                contents.data.get(SETTINGS_ID),
            ).fieldDefaults
            // A lock is the user's edit: a sync keeps it over a refresh made elsewhere.
            const now = Date.now()
            const parts = splitAccount(
                { ...changed.data, editedAt: now },
                whole.secret,
                placement,
            )
            return [
                await sealRecord(
                    key,
                    { id, updatedAt: now, ...parts },
                    changed.key,
                ),
            ]
        })
    }

    return {
        unlock,
        relock: (id: string) => session.dropKey(id),

        /** Locks an account that has no password yet; it stays open until left. */
        async setLock(
            id: string,
            password: string,
            scope: LockScope,
            recovery: boolean,
        ) {
            const hold = session.keyHolder(id)
            let made: CryptoKey | undefined
            await reseal(id, undefined, async (data, key) => {
                if (data.lock) return null
                const created = await createAccountKey(
                    key,
                    id,
                    password,
                    recovery,
                )
                made = created.key
                const hidesSteamId = scope === 'everything' && data.steamId
                const lock: AccountLock = {
                    scope,
                    slots: created.slots,
                    ...(hidesSteamId && {
                        steamTag: await steamTag(key, hidesSteamId),
                    }),
                }
                return { data: { ...data, lock }, key: created.key }
            })
            if (made) hold(made)
            // Its games and friends were cached under the vault key, which no longer opens the account.
            if (scope === 'everything') await steamCache.forgetCollection(id)
        },

        /** Takes the password off once the credential opens the account; false when it is wrong. */
        async removeLock(id: string, credential: AccountCredential) {
            const accountKey = await openKey(id, credential)
            if (accountKey === WRONG) return false
            // Dropped first: once the record lands under the vault key, a held key would open it wrong.
            session.dropKey(id)
            await reseal(id, accountKey, async ({ lock: _, ...data }) => ({
                data,
            }))
            // An unlock begun meanwhile opened the old lock: its key must not stay.
            session.dropKey(id)
            return true
        },

        /** Rewraps the account key under `next`; only the data part changes. False when the credential is wrong. */
        async changePassword(
            id: string,
            credential: AccountCredential,
            next: string,
        ) {
            let rewrapped = false
            const changed = await checked(
                session.transact(async (contents, key) => {
                    const live = liveAccount(contents, id)
                    if (!live?.data.lock) return []
                    const { lock } = live.data
                    const slots = await session.withKey((_, vaultSlots) =>
                        changeAccountPassword(
                            key,
                            vaultSlots,
                            id,
                            lock.slots,
                            credential,
                            next,
                        ),
                    )
                    if (!slots) return []
                    rewrapped = true
                    const now = Date.now()
                    const data = publicData({
                        ...live.data,
                        lock: { ...lock, slots },
                        editedAt: now,
                    })
                    return [await updateData(key, live.record, data, now)]
                }),
            )
            if (changed === WRONG) return false
            // The vault locked, or the lock went, before the change ran.
            if (!rewrapped)
                throw new Error('The account password was not changed')
            return true
        },
    }
}
