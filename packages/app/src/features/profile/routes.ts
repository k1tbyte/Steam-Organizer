import type { RouteRecordRaw } from 'vue-router'

export const profileRoutes: RouteRecordRaw[] = [
    {
        path: 'accounts/:id',
        component: () => import('./components/ProfilePage.vue'),
        meta: { nav: 'accounts', hero: true },
    },
]
