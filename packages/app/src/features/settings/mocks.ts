import { defineMock } from '#core'

export interface AboutApp {
    version: string
    /** Newer release the footer offers, if any. */
    update: string | null
}

export interface SettingsSummary {
    /** Right-hand value of each phone index row. */
    values: Record<'security' | 'sync' | 'fields' | 'vault' | 'steam', string>
    vaultName: string
    syncLine: string
}

export const aboutMock = defineMock<AboutApp>('settings.about', 'App version', {
    'Update available': { version: '3.0.1', update: '3.0.2' },
    'Up to date': { version: '3.0.1', update: null },
})

export const summaryMock = defineMock<SettingsSummary>(
    'settings.summary',
    'Section values',
    {
        'Main vault': {
            values: {
                security: '15 minutes',
                sync: 'On',
                fields: '5 secret',
                vault: 'Main vault',
                steam: 'Key set',
            },
            vaultName: 'Main vault',
            syncLine: 'Google Drive · Synced 2 min ago',
        },
    },
)
