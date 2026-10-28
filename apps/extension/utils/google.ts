import {
    DRIVE_SCOPE,
    GOOGLE_CLIENT_ID,
    type GoogleAuth,
    type GoogleToken,
    googleToken,
} from '@so/app'
import { browser } from 'wxt/browser'

// Session storage: the app page and the popup share one token, gone with the browser.
const TOKEN_KEY = 'google-token'

/** `identity.launchWebAuthFlow` against Google's implicit flow: silent with `prompt=none` while the Google session lasts. */
export const extensionGoogle: GoogleAuth = {
    async token(interactive, hint) {
        const saved = (await browser.storage.session.get(TOKEN_KEY))[
            TOKEN_KEY
        ] as GoogleToken | undefined
        // A click asks Google again: the saved token may be the revoked one it means to replace.
        if (!interactive && saved && saved.expiresAt > Date.now()) return saved
        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        url.search = String(
            new URLSearchParams({
                client_id: GOOGLE_CLIENT_ID,
                response_type: 'token',
                redirect_uri: browser.identity.getRedirectURL(),
                scope: DRIVE_SCOPE,
                ...(!interactive && { prompt: 'none' }),
                ...(hint && { login_hint: hint }),
            }),
        )
        try {
            const back = await browser.identity.launchWebAuthFlow({
                url: String(url),
                interactive,
            })
            const answer = new URLSearchParams(
                new URL(back ?? '').hash.slice(1),
            )
            const token = answer.get('access_token')
            if (!token) return null
            const fresh = googleToken(
                token,
                Number(answer.get('expires_in') ?? 3600),
            )
            await browser.storage.session.set({ [TOKEN_KEY]: fresh })
            return fresh
        } catch {
            // Closed by the user, or no Google session to renew from silently.
            return null
        }
    },
    async revoke(token) {
        await browser.storage.session.remove(TOKEN_KEY)
        await fetch(
            `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`,
            { method: 'POST' },
        ).catch(() => {})
    },
}
