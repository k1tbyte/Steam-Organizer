import type { RouteRecordRaw } from 'vue-router'

export const accountsRoutes: RouteRecordRaw[] = [
    {
        path: '',
        components: {
            default: () => import('./components/list/AccountsPage.vue'),
            header: () => import('./components/list/AccountsFilterBar.vue'),
        },
        meta: { nav: 'accounts', resident: true },
    },
]
