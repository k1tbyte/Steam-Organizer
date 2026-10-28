import '@so/app/styles.css'

import { mountApp } from '@so/app'
import { createWebHistory } from 'vue-router'

import { webGoogle } from './google'

mountApp('#app', {
    platform: { kind: 'web', fetch: null, google: webGoogle },
    history: createWebHistory(),
})
