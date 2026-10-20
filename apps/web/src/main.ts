import '@so/app/styles.css'

import { mountApp } from '@so/app'
import { createWebHistory } from 'vue-router'

mountApp('#app', {
    platform: { kind: 'web', fetch: null },
    history: createWebHistory(),
})
