/** The app's OAuth client (a Web application one; each shell signs in with it). Public by design. */
export const GOOGLE_CLIENT_ID =
    '417852025768-t58kqrrcptqh97cr1dfkm6sg4396i3na.apps.googleusercontent.com'

/** The app's hidden Drive folder only: the user's own files stay out of reach. */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

// Retired early, so a request never carries a token that expires on the way.
const EARLY_S = 300

/** An OAuth access token and when to stop using it (epoch ms). */
export interface GoogleToken {
    token: string
    expiresAt: number
}

/** A token Google gave for `expiresIn` seconds. */
export const googleToken = (token: string, expiresIn: number): GoogleToken => ({
    token,
    expiresAt: Date.now() + (expiresIn - EARLY_S) * 1000,
})
