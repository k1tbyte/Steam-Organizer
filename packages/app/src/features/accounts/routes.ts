import type { RouteRecordRaw } from 'vue-router'

export const accountsRoutes: RouteRecordRaw[] = [
    {
        path: '',
        component: () => import('./components/list/AccountsPage.vue'),
        meta: { nav: 'accounts' },
    },
]
