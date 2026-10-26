import { expect, it } from 'vitest'

import { credentialProblem } from './credentialRules'

it('checks password length, phone digits and email format, leaving empty fields alone', () => {
    expect(credentialProblem('password', 'abc12')).toBe('short')
    expect(credentialProblem('password', ' abc12')).toBeNull()
    expect(credentialProblem('phone', '+1 555 01')).toBe('phone')
    expect(credentialProblem('phone', '+1 555 010 2233')).toBeNull()
    expect(credentialProblem('email', 'name@example')).toBe('email')
    expect(credentialProblem('email', ' name@example.com ')).toBeNull()
    expect(credentialProblem('login', 'x')).toBeNull()
    expect(credentialProblem('password', '   ')).toBeNull()
})
