import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        vue(),
        tailwindcss(),
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
