import '@so/app/styles.css'

import { mountApp } from '@so/app'
import { createWebHashHistory } from 'vue-router'

mountApp('#app', {
    platform: { kind: 'extension', fetch: globalThis.fetch.bind(globalThis) },
    history: createWebHashHistory(),
})
