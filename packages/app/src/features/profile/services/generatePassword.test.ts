import { expect, it } from 'vitest'

import { generatePassword } from './generatePassword'

it('makes three groups of four unambiguous characters, different each time', () => {
    const password = generatePassword()
    expect(password).toMatch(
        /^[a-km-zA-HJ-NP-Z2-9]{4}(-[a-km-zA-HJ-NP-Z2-9]{4}){2}$/,
    )
    expect(generatePassword()).not.toBe(password)
})
