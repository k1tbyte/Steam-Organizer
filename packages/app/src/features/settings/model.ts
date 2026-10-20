export type SectionKey =
    | 'appearance'
    | 'security'
    | 'sync'
    | 'fields'
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
