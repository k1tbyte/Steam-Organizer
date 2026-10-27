import { describe, expect, it } from 'vitest'

import {
    type AccountData,
    type AccountLock,
    FIELD_DEFAULTS,
    joinAccount,
    publicData,
    RECORD,
    readAccount,
    splitAccount,
} from '../index'

const lock = (scope: AccountLock['scope']): AccountLock => ({
    scope,
    slots: {
        password: {
            kdf: { name: 'PBKDF2-SHA-256', iterations: 1, salt: '' },
            key: '',
        },
    },
})
const account = (patch: Partial<AccountData> = {}) =>
    readAccount({
        kind: RECORD.ACCOUNT,
        login: 'alpha',
        note: 'trade bot',
        alias: 'Main',
        steamId: '76561198000000001',
        tags: ['t1'],
        steam: { nickname: 'Nova', avatar: 'a.jpg', level: 10 },
        ...patch,
    }) as AccountData

describe('splitAccount', () => {
    it('places movable fields by the vault placement on an unlocked account', () => {
        const { data, secret } = splitAccount(
            account(),
            { password: 'p', services: [] },
            FIELD_DEFAULTS,
        )
        expect(data.login).toBe('alpha')
        expect(secret.login).toBeUndefined()
    })

    it('seals every movable field of a locked account, the rest stays', () => {
        const { data, secret } = splitAccount(
            account({ lock: lock('credentials') }),
            { password: 'p', services: [] },
            FIELD_DEFAULTS,
        )
        expect(data).not.toHaveProperty('login')
        expect(data).not.toHaveProperty('note')
        expect(data.steamId).toBe('76561198000000001')
        expect(secret).toMatchObject({ login: 'alpha', note: 'trade bot' })
    })

    it('leaves only the kept fields and the face under an everything lock, and joins back whole', () => {
        const whole = account({ lock: lock('everything') })
        const { data, secret } = splitAccount(
            whole,
            { password: 'p', services: [] },
            FIELD_DEFAULTS,
        )
        expect(Object.keys(data).sort()).toEqual(
            [
                'addedAt',
                'alias',
                'kind',
                'lock',
                'loginTag',
                'order',
                'pinned',
            ].sort(),
        )
        expect(data.lock?.shown).toEqual({ nickname: 'Nova', avatar: 'a.jpg' })
        expect(secret.hidden).toMatchObject({
            steamId: '76561198000000001',
            tags: ['t1'],
        })
        const joined = joinAccount(readAccount(data) as AccountData, secret)
        expect(joined.data).toMatchObject({
            steamId: '76561198000000001',
            tags: ['t1'],
        })
        expect(joined.secret).not.toHaveProperty('hidden')
    })

    it('keeps the face when data-only writes see no Steam snapshot', () => {
        const stored = publicData(
            account({
                lock: {
                    ...lock('everything'),
                    shown: { nickname: 'Nova', avatar: 'a.jpg' },
                },
                steam: null,
            }),
        )
        expect(stored.lock?.shown).toEqual({
            nickname: 'Nova',
            avatar: 'a.jpg',
        })
        expect(stored).not.toHaveProperty('steamId')
    })
})
