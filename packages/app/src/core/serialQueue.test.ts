import { expect, it } from 'vitest'

import { serialQueue } from './serialQueue'

const later = (ms: number) => new Promise((done) => setTimeout(done, ms))

it('runs tasks one after another in the order they were queued', async () => {
    const serial = serialQueue()
    const log: string[] = []
    const slow = serial(async () => {
        await later(10)
        log.push('slow')
    })
    const fast = serial(async () => {
        log.push('fast')
    })
    await Promise.all([slow, fast])
    expect(log).toEqual(['slow', 'fast'])
})

it('rejects the failed task for its caller and still runs the next', async () => {
    const serial = serialQueue()
    const failed = serial(() => Promise.reject(new Error('boom')))
    const next = serial(async () => 'ran')
    await expect(failed).rejects.toThrow('boom')
    await expect(next).resolves.toBe('ran')
})

it('resolves each caller with its own result', async () => {
    const serial = serialQueue()
    const results = await Promise.all([
        serial(async () => 1),
        serial(async () => 'two'),
    ])
    expect(results).toEqual([1, 'two'])
})
