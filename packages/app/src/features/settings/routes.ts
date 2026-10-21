import type { RouteRecordRaw } from 'vue-router'

import type { SectionKey } from './model'
import { OPENABLE_KEYS } from './registry'

/** Phone screens: the index and one screen per section. Desktop opens the same sections as a window. */
export const settingsRoutes: RouteRecordRaw[] = [
    {
        path: 'settings',
        component: () => import('./components/SettingsMobileIndex.vue'),
        meta: { nav: 'settings', resident: true },
    },
    {
        path: 'settings/:section',
        component: () => import('./components/SettingsMobileSection.vue'),
        props: true,
        meta: { nav: 'settings', tabBar: false },
        beforeEnter: (to) =>
            OPENABLE_KEYS.includes(to.params.section as SectionKey) ||
            '/settings',
    },
]
