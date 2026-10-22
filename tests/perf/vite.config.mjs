// Production build with mocks forced on (production calls startMocks(false), so lists would be empty), without the PWA plugin,
// into artifacts/perf/dist so a normal build never overwrites it.
import { fileURLToPath } from 'node:url'

import web from '../../apps/web/vite.config.ts'

const forceMocks = {
    name: 'perf-force-mocks',
    enforce: 'pre',
    transform(code, id) {
        if (!id.replace(/\\/g, '/').endsWith('packages/app/src/entry.ts'))
            return
        if (!code.includes('startMocks(import.meta.env.DEV)'))
            throw new Error('startMocks call moved')
        return {
            code: code.replace(
                'startMocks(import.meta.env.DEV)',
                'startMocks(true)',
            ),
            map: null,
        }
    },
}

export default {
    ...web,
    root: fileURLToPath(new URL('../../apps/web', import.meta.url)),
    plugins: [
        forceMocks,
        ...web.plugins
            .flat()
            .filter((p) => p && !String(p.name).startsWith('vite-plugin-pwa')),
    ],
    build: {
        outDir: fileURLToPath(
            new URL('../../artifacts/perf/dist', import.meta.url),
        ),
        emptyOutDir: true,
        sourcemap: true,
    },
}
