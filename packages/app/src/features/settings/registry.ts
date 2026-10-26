import type { GroupKey, SectionKey } from './model'

interface SectionDef {
    key: SectionKey
    group: GroupKey
    icon: string
    /** Source English; `useSettingsSections` translates it. */
    title: string
    description: string
    soon?: true
}

/** Order is the nav order. Each section owns `sections/<name>/`. */
export const SECTION_DEFS: readonly SectionDef[] = [
    {
        key: 'appearance',
        group: 'app',
        icon: 'icon-[lucide--palette]',
        title: 'Appearance',
        description: 'Theme, accent and density. Saved on this device.',
    },
    {
        key: 'security',
        group: 'vault',
        icon: 'icon-[lucide--shield]',
        title: 'Security',
        description: 'When the vault locks and how you open it.',
    },
    {
        key: 'sync',
        group: 'vault',
        icon: 'icon-[lucide--cloud]',
        title: 'Sync & backup',
        description: 'Google Drive keeps backups and syncs your devices.',
    },
    {
        key: 'fields',
        group: 'vault',
        icon: 'icon-[lucide--rows-3]',
        title: 'Fields',
        description:
            "Secret fields are sealed separately and opened only when needed. Search can't see them.",
    },
    {
        key: 'tags',
        group: 'vault',
        icon: 'icon-[lucide--tags]',
        title: 'Tags',
        description: 'Changes apply to every account with the tag.',
    },
    {
        key: 'services',
        group: 'vault',
        icon: 'icon-[lucide--link]',
        title: 'Linked services',
        description:
            'Services an account keeps logins for. Add the ones the built-in list lacks.',
    },
    {
        key: 'vault',
        group: 'vault',
        icon: 'icon-[lucide--vault]',
        title: 'Vault',
        description: 'This vault, its export and the reset option.',
    },
    {
        key: 'steam',
        group: 'steam',
        icon: 'icon-[simple-icons--steam]',
        title: 'Steam',
        description: 'Access to Steam for profiles, bans, games and autofill.',
    },
    {
        key: 'bots',
        group: 'steam',
        icon: 'icon-[lucide--bot]',
        title: 'Bots',
        description: 'Automation for your accounts.',
        soon: true,
    },
]

export const GROUP_KEYS: readonly GroupKey[] = ['app', 'vault', 'steam']

/** What the overlay and the phone route accept; the first one is the default. */
export const OPENABLE_KEYS = SECTION_DEFS.filter((def) => !def.soon).map(
    (def) => def.key,
)
