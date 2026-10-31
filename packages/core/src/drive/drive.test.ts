import { expect, it } from 'vitest'

import { DriveError, driveApi } from './drive'

const token = async () => 'tok'

it('lists every page of the app folder by app properties', async () => {
    const asked: URL[] = []
    const fetch = (async (url: string, init: RequestInit) => {
        expect(new Headers(init.headers).get('Authorization')).toBe(
            'Bearer tok',
        )
        const at = new URL(url)
        asked.push(at)
        const second = at.searchParams.get('pageToken') === 'p2'
        return Response.json({
            files: [
                {
                    id: second ? 'b' : 'a',
                    name: 'backup',
                    size: '42',
                    createdTime: '2026-10-28T10:00:00.000Z',
                    appProperties: { kind: 'backup' },
                },
            ],
            ...(!second && { nextPageToken: 'p2' }),
        })
    }) as typeof globalThis.fetch
    const files = await driveApi(fetch, token).list({
        kind: 'backup',
        "it's": "it's",
    })
    expect(files.map((file) => [file.id, file.size])).toEqual([
        ['a', 42],
        ['b', 42],
    ])
    expect(files[0]?.createdTime).toBe(Date.parse('2026-10-28T10:00:00Z'))
    expect(asked[0]?.searchParams.get('spaces')).toBe('appDataFolder')
    expect(asked[0]?.searchParams.get('q')).toBe(
        "appProperties has { key='kind' and value='backup' } and appProperties has { key='it\\'s' and value='it\\'s' }",
    )
})

it('uploads the metadata and the body as one multipart request', async () => {
    let sent: { url: string; type: string; body: string } | undefined
    const fetch = (async (url: string, init: RequestInit) => {
        sent = {
            url,
            type: new Headers(init.headers).get('Content-Type') ?? '',
            body: String(init.body),
        }
        return Response.json({
            id: 'new',
            name: 'backup',
            createdTime: '2026-10-28T10:00:00Z',
        })
    }) as typeof globalThis.fetch
    const file = await driveApi(fetch, token).create(
        'backup',
        { kind: 'backup' },
        '{"sealed":true}',
    )
    expect(file).toMatchObject({ id: 'new', size: 0, appProperties: {} })
    expect(sent?.url).toContain('uploadType=multipart')
    const boundary = sent?.type.match(
        /^multipart\/related; boundary=(.+)$/,
    )?.[1]
    expect(boundary).toBeTruthy()
    const parts = sent?.body.split(`--${boundary}`) ?? []
    expect(parts).toHaveLength(4)
    expect(JSON.parse(parts[1]?.split('\r\n\r\n')[1] ?? '')).toEqual({
        name: 'backup',
        parents: ['appDataFolder'],
        appProperties: { kind: 'backup' },
    })
    expect(parts[2]).toContain('\r\n\r\n{"sealed":true}\r\n')
})

it('replaces a file in place: its body and app properties, never its folder', async () => {
    let sent:
        | { url: string; method: string; type: string; body: string }
        | undefined
    const fetch = (async (url: string, init: RequestInit) => {
        sent = {
            url,
            method: String(init.method),
            type: new Headers(init.headers).get('Content-Type') ?? '',
            body: String(init.body),
        }
        return Response.json({
            id: 'v1',
            name: 'vault.json',
            size: '9',
            createdTime: '2026-10-28T10:00:00Z',
            modifiedTime: '2026-10-30T10:00:00Z',
            version: '7',
            appProperties: { type: 'vault' },
        })
    }) as typeof globalThis.fetch
    const file = await driveApi(fetch, token).update(
        'v1',
        { type: 'vault' },
        '{"sealed":2}',
    )
    expect(file).toMatchObject({
        version: '7',
        modifiedTime: Date.parse('2026-10-30T10:00:00Z'),
        size: 9,
    })
    expect(sent?.method).toBe('PATCH')
    const url = new URL(sent?.url ?? '')
    expect(url.pathname).toBe('/upload/drive/v3/files/v1')
    expect(url.searchParams.get('uploadType')).toBe('multipart')
    expect(url.searchParams.get('fields')).toContain('version')
    const boundary = sent?.type.match(/boundary=(.+)$/)?.[1] ?? ''
    const parts = sent?.body.split(`--${boundary}`) ?? []
    expect(JSON.parse(parts[1]?.split('\r\n\r\n')[1] ?? '')).toEqual({
        appProperties: { type: 'vault' },
    })
    expect(parts[2]).toContain('\r\n\r\n{"sealed":2}\r\n')
})

it('tells an expired token, a rate limit, a full Drive and no network apart', async () => {
    const answer = (status: number, reason = '') =>
        driveApi(
            (async () =>
                Response.json(
                    { error: { errors: [{ reason }] } },
                    { status },
                )) as typeof globalThis.fetch,
            token,
        )
            .remove('x')
            .catch((error: DriveError) => error.kind)
    expect(await answer(401)).toBe('unauthorized')
    expect(await answer(403, 'userRateLimitExceeded')).toBe('rate-limit')
    expect(await answer(403, 'storageQuotaExceeded')).toBe('quota')
    expect(await answer(404)).toBe('not-found')
    expect(await answer(500)).toBe('server')
    const offline = (() =>
        Promise.reject(new TypeError('down'))) as typeof globalThis.fetch
    await expect(driveApi(offline, token).about()).rejects.toEqual(
        new DriveError('offline'),
    )
})
