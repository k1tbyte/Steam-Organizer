import { configDefaults, defineConfig } from 'vitest/config'

// `related` walks mocked facades into SFCs; one a test really loads still fails.
const noSfc = {
    name: 'no-sfc',
    load: (id: string) =>
        id.endsWith('.vue') ? "throw new Error('No SFCs in unit tests')" : null,
}

// Inline projects don't inherit root `pool` or `plugins`.
const project = (name: string, include: string) => ({
    plugins: [noSfc],
    test: { name, include: [include], pool: 'threads' as const },
})

export default defineConfig({
    test: {
        forceRerunTriggers: [
            ...configDefaults.forceRerunTriggers,
            '**/pnpm-lock.yaml',
        ],
        projects: [
            project('app', 'packages/app/src/**/*.test.ts'),
            project('ui', 'packages/ui/src/**/*.test.ts'),
            project('ui-contract', 'tests/ui/*.test.ts'),
            project('docs', 'tests/docs/*.test.ts'),
        ],
    },
})
