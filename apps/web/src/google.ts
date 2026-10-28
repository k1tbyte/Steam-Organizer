import {
    DRIVE_SCOPE,
    GOOGLE_CLIENT_ID,
    type GoogleAuth,
    type GoogleToken,
    googleToken,
} from '@so/app'

interface TokenResponse {
    access_token?: string
    expires_in?: number
    error?: string
}

interface TokenClient {
    callback: (response: TokenResponse) => void
    error_callback: () => void
    requestAccessToken(options: { prompt: string; login_hint?: string }): void
}

declare global {
    interface Window {
        google?: {
            accounts: {
                oauth2: {
                    initTokenClient(config: {
                        client_id: string
                        scope: string
                        callback: () => void
                    }): TokenClient
                    revoke(token: string, done: () => void): void
                }
            }
        }
    }
}

let loading: Promise<NonNullable<Window['google']>> | null = null
let current: GoogleToken | null = null

function gis() {
    loading ??= new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.onload = () =>
            window.google ? resolve(window.google) : reject(new Error('GIS'))
        script.onerror = () => {
            loading = null
            reject(new Error('GIS did not load'))
        }
        document.head.append(script)
    })
    return loading
}

/** Google Identity Services: a token only from a click (no silent renewal on the web), kept in memory. */
export const webGoogle: GoogleAuth = {
    async token(interactive, hint) {
        if (!interactive)
            return current && current.expiresAt > Date.now() ? current : null
        // Waiting here for GIS could outlast the click's activation and block the window: `prepare` loads it ahead.
        const google = await gis().catch(() => null)
        if (!google) return null
        const client = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: DRIVE_SCOPE,
            callback: () => {},
        })
        current = await new Promise<GoogleToken | null>((resolve) => {
            client.callback = ({ access_token, expires_in }) =>
                resolve(
                    access_token
                        ? googleToken(access_token, expires_in ?? 3600)
                        : null,
                )
            client.error_callback = () => resolve(null)
            client.requestAccessToken({
                prompt: '',
                ...(hint && { login_hint: hint }),
            })
        })
        return current
    },
    prepare() {
        void gis().catch(() => {})
    },
    async revoke(token) {
        current = null
        const google = await gis().catch(() => null)
        await new Promise<void>((done) =>
            google ? google.accounts.oauth2.revoke(token, done) : done(),
        )
    },
}
