import { fpIcons } from '@so/ui/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// Where autofill runs; Firefox MV3 asks for these at runtime.
const STEAM_HOSTS = [
    'https://store.steampowered.com/*',
    'https://steamcommunity.com/*',
    'https://help.steampowered.com/*',
]

// Public half of a dev key: a fixed extension ID, so Google's redirect URI stays registered. A store listing brings its own.
const DEV_KEY =
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAlLiHw8/2zSc2dRwY8jZJjhMaEbhyq4+5cO+HlrEryj9808D/GYtcQEIzDt1TOqeaqbwB+9ttT/eAouW42iGssdiHySjs8fAT9875UFmn2Ge4SgBQZT6tt/aCA7y8uEQ4qUnnhDIOQ/iSowuzUgEtsUsEAJeZp+/E4Wk8xfPGGrY2+Ita/WgV0MXrPM7WhPKklpOlN5Z9ocsiKPVNKAuLK9csVfZpR1GQ4wb8esKHPEHECWWr2hvNTV4Z9Makfo/q6cJ1+Vz0TEbZhr2BTNy8m+BBALNts02hlxWgXx30/bBj0OOc1qx3q5Ps9GBgXFP17BsVf8R5ZqqSidAO2uOzgQIDAQAB'

export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    manifestVersion: 3,
    // Apart from the web shell's 3000.
    dev: { server: { port: 3010 } },
    vite: () => ({
        plugins: [
            tailwindcss(),
            fpIcons({ sources: ['../../packages/app/src'] }),
            {
                // WXT rewrites :root to :host, but a shadow host is featureless: `:host[attr]` never matches, `:host([attr])` does.
                name: 'shadow-host-selectors',
                enforce: 'post',
                generateBundle(_, bundle) {
                    for (const file of Object.values(bundle)) {
                        if (
                            file.type !== 'asset' ||
                            !/^content-scripts\/.+\.css$/.test(file.fileName)
                        )
                            continue
                        file.source = String(file.source)
                            .replace(/:root((?:\[[^\]]+\])+)/g, ':host($1)')
                            .replace(
                                /:root:not\((\[[^\]]+\])\)/g,
                                ':host(:not($1))',
                            )
                    }
                },
            },
        ],
    }),
    manifest: ({ browser }) => ({
        name: 'Steam Organizer',
        ...(browser !== 'firefox' && { key: DEV_KEY }),
        permissions: ['storage', 'unlimitedStorage', 'identity'],
        // The Web APIs are fetched by the app pages only: no content script runs there.
        host_permissions: [
            ...STEAM_HOSTS,
            'https://api.steampowered.com/*',
            'https://www.googleapis.com/*',
            'https://oauth2.googleapis.com/*',
        ],
        // WXT hoists the UI's @font-face into the host document, which fetches the files as the page.
        web_accessible_resources: [
            { resources: ['assets/*.woff2'], matches: STEAM_HOSTS },
        ],
    }),
})
