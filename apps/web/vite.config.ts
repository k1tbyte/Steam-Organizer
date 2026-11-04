import { fpIcons } from '@so/ui/vite'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

import { version } from '../../package.json'

// Served beside the app and never precached: a page with a new worker waiting reads it for that build's version.
const versionFile: Plugin = {
    name: 'version-file',
    generateBundle() {
        this.emitFile({
            type: 'asset',
            fileName: 'version.json',
            source: JSON.stringify({ version }),
        })
    },
}

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
        fpIcons({ sources: ['../../packages/app/src'] }),
        versionFile,
        VitePWA({
            registerType: 'prompt',
            manifest: {
                name: 'Steam Organizer',
                short_name: 'Steam Organizer',
                theme_color: '#14151c',
                background_color: '#14151c',
                display: 'standalone',
                icons: [
                    { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml' },
                ],
            },
        }),
    ],
    server: { port: 3000 },
})
