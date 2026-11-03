import { expect, it } from 'vitest'

import { helloKindOf } from './useHelloLabel'

it('names the authenticator after the OS', () => {
    expect(helloKindOf('Win32', 'Mozilla/5.0 (Windows NT 10.0)')).toBe(
        'windows',
    )
    expect(helloKindOf('MacIntel', 'Mozilla/5.0 (Macintosh)')).toBe('touchid')
    expect(helloKindOf('iPhone', 'Mozilla/5.0 (iPhone)')).toBe('touchid')
    expect(helloKindOf('Linux armv8l', 'Mozilla/5.0 (Linux; Android 15)')).toBe(
        'fingerprint',
    )
    expect(helloKindOf('Linux x86_64', 'Mozilla/5.0 (X11; Linux x86_64)')).toBe(
        'passkey',
    )
})
