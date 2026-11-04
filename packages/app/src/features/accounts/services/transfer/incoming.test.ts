import { createVault, openData, RECORD, readService, readTag } from '@so/core'
import { expect, it } from 'vitest'

import {
    findService,
    newServiceRecord,
    numberedServiceName,
    serviceName,
} from '../../../linked-services/services/vaultServices'
import { resolveIncoming } from './incoming'

const { key } = await createVault('correct horse')

it("names tags and services with the vault's own, adding each missing one once, one entry per service", async () => {
    const data = new Map<string, unknown>([
        ['tag-1', { kind: RECORD.TAG, label: 'Trade', hue: 95 }],
    ])
    const account = (login: string) => ({
        login,
        password: 'pw',
        steamId: null,
        tags: [
            { label: 'trade', hue: 25 },
            { label: 'New', hue: 150 },
        ],
        services: [
            {
                service: { name: 'Xbox' },
                fields: [{ kind: 'login' as const, value: `${login}-1` }],
            },
            {
                service: { name: 'xbox' },
                fields: [{ kind: 'login' as const, value: `${login}-2` }],
            },
            {
                service: { id: 'discord' },
                fields: [{ kind: 'login' as const, value: 'd' }],
            },
        ],
    })
    const { accounts, records } = await resolveIncoming(
        key,
        data,
        [account('a'), account('b')],
        {
            find: (name) => findService([], name)?.id,
            clean: serviceName,
            numbered: numberedServiceName,
            record: (name) => newServiceRecord(key, name, 1),
        },
        1,
    )
    const opened = await Promise.all(
        records.map(
            async (record) => [record.id, await openData(key, record)] as const,
        ),
    )
    const tags = opened.flatMap(([id, value]) => (readTag(value) ? [id] : []))
    const own = new Map(
        opened.flatMap(([id, value]) => {
            const service = readService(value)
            return service ? [[id, service.name] as const] : []
        }),
    )
    // One new tag and one new service for both accounts.
    expect(tags).toHaveLength(1)
    expect([...own.values()]).toEqual(['xbox 2'])
    for (const resolved of accounts) {
        expect(resolved.tags).toEqual(['tag-1', tags[0]])
        expect(
            resolved.services?.map(
                ({ service }) => own.get(service) ?? service,
            ),
        ).toEqual(['xbox', 'xbox 2', 'discord'])
    }
})
