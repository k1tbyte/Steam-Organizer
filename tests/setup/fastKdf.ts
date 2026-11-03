import { vi } from 'vitest'

// 600k PBKDF2 rounds only measure the CPU: tests make vaults and PINs with 1k. Opening reads the count from the file.
vi.mock(import('../../packages/core/src/crypto/kdf'), async (actual) => {
    const kdf = await actual()
    return { ...kdf, newKdf: () => ({ ...kdf.newKdf(), iterations: 1_000 }) }
})
