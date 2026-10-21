import type { RouteRecordRaw } from 'vue-router'

/** Layout of the unlocked app; `router.ts` nests the screens under it. */
export const shellRoute: RouteRecordRaw = {
    path: '/',
    component: () => import('./components/AppShell.vue'),
}
