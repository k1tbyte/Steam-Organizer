import { describe, expect, it } from 'vitest'

import type { FieldKey, FieldModes } from '../model'
import { isSecret, secretCount } from './fieldSecrecy'

const KEYS: FieldKey[] = ['nickname', 'login', 'password', 'auth']
const modes: FieldModes = {
    nickname: 'searchable',
    login: 'secret',
    note: 'searchable',
    phone: 'searchable',
    email: 'searchable',
}

describe('isSecret', () => {
    it('follows the chosen mode for descriptive fields', () => {
        expect(isSecret('nickname', modes)).toBe(false)
        expect(isSecret('login', modes)).toBe(true)
    })

    it('keeps credentials secret whatever the modes say', () => {
        expect(isSecret('password', modes)).toBe(true)
        expect(isSecret('auth', modes)).toBe(true)
    })
})

describe('secretCount', () => {
    it('counts chosen and fixed secrets together', () => {
        expect(secretCount(KEYS, modes)).toBe(3)
    })
})
