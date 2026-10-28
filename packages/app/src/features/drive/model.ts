/** The Google account Drive backups run under. */
export interface GoogleAccount {
    name: string
    email: string
}

/** `expired`: no token without the user (the web after an hour, a revoked grant), until Sign in again. */
export type DriveState = 'disconnected' | 'connected' | 'expired' | 'offline'

export interface DriveConnection {
    account: GoogleAccount | null
    state: DriveState
}
