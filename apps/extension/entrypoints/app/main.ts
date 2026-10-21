import '@so/app/styles.css'

import { mountApp } from '@so/app'
import { createWebHashHistory } from 'vue-router'

import { extensionPlatform } from '../../utils/platform'

mountApp('#app', {
    platform: extensionPlatform,
    history: createWebHashHistory(),
})
