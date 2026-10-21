import type { RouteRecordRaw } from 'vue-router'

export const backupsRoutes: RouteRecordRaw[] = [
    {
        path: 'backups',
        component: () => import('./components/BackupsPage.vue'),
        meta: { nav: 'backups' },
    },
]
