import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt'

export default defineConfig({
    modules: ['@wxt-dev/module-vue'],
    manifestVersion: 3,
    // Apart from the web shell's 3000.
    dev: { server: { port: 3010 } },
    vite: () => ({ plugins: [tailwindcss()] }),
    manifest: {
        name: 'Steam Organizer',
        permissions: ['storage', 'unlimitedStorage'],
        // Steam host_permissions go here (optional on Firefox MV3).
        // No icons yet: browsers reject SVG, so PNGs come with the store assets.
        action: {},
    },
})
