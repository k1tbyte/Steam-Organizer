import { fpIcons } from '@so/ui/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

// Where autofill runs; Firefox MV3 asks for these at runtime.
const STEAM_HOSTS = [
    'https://store.steampowered.com/*',
    'https://steamcommunity.com/*',
    'https://help.steampowered.com/*',
]

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
    manifest: {
        name: 'Steam Organizer',
        permissions: ['storage', 'unlimitedStorage'],
        host_permissions: STEAM_HOSTS,
        // WXT hoists the UI's @font-face into the host document, which fetches the files as the page.
        web_accessible_resources: [
            { resources: ['assets/*.woff2'], matches: STEAM_HOSTS },
        ],
    },
})
