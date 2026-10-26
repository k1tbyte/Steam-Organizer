export type SectionKey =
    | 'appearance'
    | 'security'
    | 'sync'
    | 'fields'
    | 'tags'
    | 'services'
    | 'vault'
    | 'steam'
    | 'bots'

export type GroupKey = 'app' | 'vault' | 'steam'

export interface SettingsSection {
    key: SectionKey
    group: GroupKey
    icon: string
    title: string
    description: string
    /** Planned but not built: listed, never opened. */
    soon: boolean
}

export interface SettingsGroup {
    key: GroupKey
    title: string
    sections: SettingsSection[]
}

export type LockAfter =
    | 'now'
    | '1m'
    | '5m'
    | '15m'
    | '30m'
    | '1h'
    | '4h'
    | 'restart'
    | 'never'

export interface SecuritySettings {
    lockAfter: LockAfter
    masterAfterRestart: boolean
    pin: boolean
    biometrics: boolean
}

export type SyncInterval = '5' | '15' | '30'

export interface SyncSettings {
    connected: boolean
    autoSync: boolean
    interval: SyncInterval
    autoBackup: boolean
}

export type FieldKey =
    | 'nickname'
    | 'login'
    | 'note'
    | 'phone'
    | 'email'
    | 'password'
    | 'linked'
    | 'auth'

export type FieldMode = 'searchable' | 'secret'

/** Credentials are always sealed, so they have no mode to pick. */
export const FIXED_SECRET_KEYS = ['password', 'linked', 'auth'] as const

/** Default for new accounts, for the fields the user can choose. */
export type FieldModes = Record<
    Exclude<FieldKey, (typeof FIXED_SECRET_KEYS)[number]>,
    FieldMode
>

export type SiteKey = 'store' | 'community' | 'help'
