const API = 'https://www.googleapis.com/drive/v3/'
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'

export type DriveErrorKind =
    | 'unauthorized'
    | 'offline'
    | 'rate-limit'
    | 'quota'
    | 'not-found'
    | 'server'

export class DriveError extends Error {
    constructor(readonly kind: DriveErrorKind) {
        super(`Drive request failed: ${kind}`)
        this.name = 'DriveError'
    }
}

/** A file in the app's hidden Drive folder. */
export interface DriveFile {
    id: string
    name: string
    size: number
    createdTime: number
    /** Plaintext, readable before unlock: each key and value fit 124 bytes together. */
    appProperties: Record<string, string>
}

interface RawFile extends Omit<DriveFile, 'size' | 'createdTime'> {
    size?: string
    createdTime: string
}

const FILE_FIELDS = 'id,name,size,createdTime,appProperties'

const literal = (text: string) => text.replace(/['\\]/g, '\\$&')

// Drive answers 403 for both a rate limit and a full quota; the reason tells them apart.
async function failure(response: Response): Promise<DriveErrorKind> {
    if (response.status === 401) return 'unauthorized'
    if (response.status === 404) return 'not-found'
    if (response.status === 429) return 'rate-limit'
    if (response.status === 403) {
        const reason = await response
            .json()
            .then(
                (body: { error?: { errors?: { reason?: string }[] } }) =>
                    body.error?.errors?.[0]?.reason ?? '',
            )
            .catch(() => '')
        if (/quota/i.test(reason) && !/rate/i.test(reason)) return 'quota'
        if (/rate/i.test(reason)) return 'rate-limit'
    }
    return 'server'
}

const toFile = (raw: RawFile): DriveFile => ({
    ...raw,
    size: Number(raw.size ?? 0),
    createdTime: Date.parse(raw.createdTime),
    appProperties: raw.appProperties ?? {},
})

/** Drive v3 inside the app's hidden folder (`drive.appdata`), under the token `token` gives per request. */
export function driveApi(
    fetch: typeof globalThis.fetch,
    token: () => Promise<string>,
) {
    async function call(url: string, init: RequestInit = {}) {
        const headers = new Headers(init.headers)
        headers.set('Authorization', `Bearer ${await token()}`)
        const response = await fetch(url, { ...init, headers }).catch(() => {
            throw new DriveError('offline')
        })
        if (!response.ok) throw new DriveError(await failure(response))
        return response
    }

    return {
        /** Every file whose app properties hold all of `properties`. */
        async list(properties: Record<string, string>): Promise<DriveFile[]> {
            const q = Object.entries(properties)
                .map(
                    ([key, value]) =>
                        `appProperties has { key='${literal(key)}' and value='${literal(value)}' }`,
                )
                .join(' and ')
            const files: DriveFile[] = []
            let pageToken = ''
            do {
                const params = new URLSearchParams({
                    spaces: 'appDataFolder',
                    q,
                    pageSize: '1000',
                    fields: `nextPageToken,files(${FILE_FIELDS})`,
                    ...(pageToken && { pageToken }),
                })
                const page = (await (
                    await call(`${API}files?${params}`)
                ).json()) as { files: RawFile[]; nextPageToken?: string }
                files.push(...page.files.map(toFile))
                pageToken = page.nextPageToken ?? ''
            } while (pageToken)
            return files
        },
        async download(id: string): Promise<string> {
            return (await call(`${API}files/${id}?alt=media`)).text()
        },
        async create(
            name: string,
            appProperties: Record<string, string>,
            body: string,
        ): Promise<DriveFile> {
            const boundary = crypto.randomUUID()
            const metadata = JSON.stringify({
                name,
                parents: ['appDataFolder'],
                appProperties,
            })
            const multipart = [
                `--${boundary}`,
                'Content-Type: application/json; charset=UTF-8',
                '',
                metadata,
                `--${boundary}`,
                'Content-Type: application/octet-stream',
                '',
                body,
                `--${boundary}--`,
            ].join('\r\n')
            const response = await call(
                `${UPLOAD}?uploadType=multipart&fields=${FILE_FIELDS}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': `multipart/related; boundary=${boundary}`,
                    },
                    body: multipart,
                },
            )
            return toFile((await response.json()) as RawFile)
        },
        async remove(id: string): Promise<void> {
            await call(`${API}files/${id}`, { method: 'DELETE' })
        },
        /** The Google account the token belongs to. */
        async about(): Promise<{ name: string; email: string }> {
            const { user } = (await (
                await call(`${API}about?fields=user(displayName,emailAddress)`)
            ).json()) as { user: { displayName: string; emailAddress: string } }
            return { name: user.displayName, email: user.emailAddress }
        },
    }
}

export type DriveApi = ReturnType<typeof driveApi>
