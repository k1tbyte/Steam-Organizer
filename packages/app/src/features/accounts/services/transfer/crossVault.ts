import {
    type AccountData,
    type AccountSecret,
    type LiveRecord,
    openData,
    openSecret,
    readAccount,
    readService,
    readTag,
    type SealedRecord,
    type VaultKey,
} from '@so/core'

import type { IncomingAccount } from './incoming'

interface Opened {
    record: LiveRecord
    data: unknown
}

async function opened(key: VaultKey, records: readonly SealedRecord[]) {
    const live = records.filter(
        (record): record is LiveRecord => !('deleted' in record),
    )
    return Promise.all(
        live.map(
            async (record): Promise<Opened> => ({
                record,
                data: await openData(key, record),
            }),
        ),
    )
}

/** How many accounts a file holds, and how many of them are under a password of their own; only data parts open. */
export async function accountCount(
    key: VaultKey,
    records: readonly SealedRecord[],
): Promise<{ accounts: number; locked: number }> {
    const accounts = (await opened(key, records)).flatMap(
        ({ data }) => readAccount(data) ?? [],
    )
    return {
        accounts: accounts.length,
        locked: accounts.filter((data) => data.lock).length,
    }
}

function incoming(
    data: AccountData,
    secret: AccountSecret,
    tags: ReadonlyMap<string, { label: string; hue: number }>,
    services: ReadonlyMap<string, string>,
): IncomingAccount {
    const { alias, steam } = data
    const { authenticator } = secret
    const note = data.note ?? secret.note
    const phone = data.phone ?? secret.phone
    const email = data.email ?? secret.email
    return {
        login: data.login ?? secret.login ?? '',
        password: secret.password,
        steamId: data.steamId,
        ...(steam && { steam }),
        ...(alias && { alias }),
        ...(authenticator && { authenticator }),
        ...(note && { note }),
        ...(phone && { phone }),
        ...(email && { email }),
        pinned: data.pinned,
        addedAt: data.addedAt,
        tags: data.tags.flatMap((id) => tags.get(id) ?? []),
        // A built-in id means the same everywhere; the file's own services go by name.
        services: secret.services.map(({ service, fields }) => {
            const name = services.get(service)
            return {
                service: name === undefined ? { id: service } : { name },
                fields,
            }
        }),
    }
}

/** Another vault's records, opened with its key, as accounts this vault adds anew. An account under its own password
 *  only counts: its slot needs that vault's key and the password, so it can't be sealed here without it. */
export async function crossVaultAccounts(
    key: VaultKey,
    records: readonly SealedRecord[],
): Promise<{ accounts: IncomingAccount[]; locked: number }> {
    const all = await opened(key, records)
    const tags = new Map<string, { label: string; hue: number }>()
    const services = new Map<string, string>()
    for (const { record, data } of all) {
        const tag = readTag(data)
        const service = readService(data)
        if (tag) tags.set(record.id, { label: tag.label, hue: tag.hue })
        if (service) services.set(record.id, service.name)
    }
    const accounts: IncomingAccount[] = []
    let locked = 0
    for (const { record, data } of all) {
        const account = readAccount(data)
        if (!account) continue
        if (account.lock) {
            locked++
            continue
        }
        const secret = (await openSecret<AccountSecret>(key, record)) ?? {
            password: '',
            services: [],
        }
        accounts.push(incoming(account, secret, tags, services))
    }
    return { accounts, locked }
}
