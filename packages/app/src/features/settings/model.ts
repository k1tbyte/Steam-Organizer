import type { FieldPlacement, MovableField } from '@so/core'

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
    autoSync: boolean
    interval: SyncInterval
    autoBackup: boolean
}

export type FieldKey =
    | MovableField
    | 'nickname'
    | 'password'
    | 'linked'
    | 'auth'

/** Fields the vault places no matter the settings: the list shows nicknames, credentials are always sealed. */
export const FIXED_FIELDS = {
    nickname: 'searchable',
    password: 'secret',
    linked: 'secret',
    auth: 'secret',
} as const satisfies Record<Exclude<FieldKey, MovableField>, FieldPlacement>

export type SiteKey = 'store' | 'community' | 'help'
