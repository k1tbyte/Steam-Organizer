import {
    type LiveRecord,
    RECORD,
    type ServiceCredentials,
    sealRecord,
    type TagData,
    type VaultKey,
} from '@so/core'

import type { NewAccount } from '../accountRecords'
import { findTag, tagLabel } from '../tags'
import { tagsIn } from '../vaultAccounts'

/** A built-in service's id (or one no service holds), or a name to find among the user's services or add. */
export type ServiceRef = { id: string } | { name: string }

/** An account an import adds, before the vault names its tags and services. */
export interface IncomingAccount extends Omit<NewAccount, 'tags' | 'services'> {
    tags: { label: string; hue: number }[]
    services: { service: ServiceRef; fields: ServiceCredentials['fields'] }[]
}

/** The linked-services registry, as the import needs it: a name's service id, a name made fit to store (and numbered),
 *  and a new service's record. */
export interface ServiceNames {
    find: (name: string) => string | undefined
    clean: (name: string) => string
    numbered: (name: string, n: number) => string
    record: (name: string) => Promise<LiveRecord>
}

/** The accounts with this vault's tag and service ids; a label or name it lacks becomes a new record, once per batch. */
export async function resolveIncoming(
    key: VaultKey,
    data: ReadonlyMap<string, unknown>,
    incoming: readonly IncomingAccount[],
    services: ServiceNames,
    now: number,
): Promise<{ accounts: NewAccount[]; records: LiveRecord[] }> {
    const tags = tagsIn(data)
    const made = new Map<string, Promise<LiveRecord>>()
    const create = (lookup: string, seal: () => Promise<LiveRecord>) => {
        let record = made.get(lookup)
        if (!record) {
            record = seal()
            made.set(lookup, record)
        }
        return record.then(({ id }) => id)
    }
    const tagId = async ({ label, hue }: { label: string; hue: number }) => {
        const clean = tagLabel(label)
        return (
            findTag(tags, clean)?.id ??
            create(`tag\0${clean.toLowerCase()}`, () => {
                const data: TagData = { kind: RECORD.TAG, label: clean, hue }
                return sealRecord(key, {
                    id: crypto.randomUUID(),
                    updatedAt: now,
                    data,
                })
            })
        )
    }
    const serviceId = async (ref: ServiceRef) => {
        if ('id' in ref) return ref.id
        const name = services.clean(ref.name)
        return (
            services.find(name) ??
            create(`service\0${name.toLowerCase()}`, () =>
                services.record(name),
            )
        )
    }
    // One entry per service: a second login for a taken one goes under a numbered name of its own.
    async function linked(account: IncomingAccount) {
        const entries: ServiceCredentials[] = []
        for (const { service, fields } of account.services) {
            let id = await serviceId(service)
            // Bounded: past the last try the login merges into the service.
            for (
                let n = 2;
                n <= TRIES && 'name' in service && taken(entries, id);
                n++
            )
                id = await serviceId({
                    name: services.numbered(service.name, n),
                })
            const same = entries.find((entry) => entry.service === id)
            if (!same) entries.push({ service: id, fields: [...fields] })
            else
                same.fields.push(
                    ...fields.filter(
                        ({ kind }) => !same.fields.some((f) => f.kind === kind),
                    ),
                )
        }
        return entries
    }
    const accounts: NewAccount[] = []
    for (const account of incoming)
        accounts.push({
            ...account,
            tags: [...new Set(await Promise.all(account.tags.map(tagId)))],
            services: await linked(account),
        })
    return { accounts, records: await Promise.all(made.values()) }
}

const TRIES = 8

const taken = (entries: readonly ServiceCredentials[], id: string) =>
    entries.some((entry) => entry.service === id)
