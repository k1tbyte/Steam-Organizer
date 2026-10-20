import type { RouteRecordRaw } from 'vue-router'

/** Layout of the unlocked app; `router.ts` nests the screens under it. */
export const shellRoute: RouteRecordRaw = {
    path: '/',
    component: () => import('./components/AppShell.vue'),
}

// Screens whose feature has not landed yet; each feature replaces its entry.
export const shellPlaceholderRoutes: RouteRecordRaw[] = [
    {
        path: '',
        component: () => import('./components/ShellPlaceholder.vue'),
        props: { screen: 'accounts' },
        meta: { nav: 'accounts' },
    },
    {
        path: 'backups',
        component: () => import('./components/ShellPlaceholder.vue'),
        props: { screen: 'backups' },
        meta: { nav: 'backups' },
    },
]
