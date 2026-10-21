import { createRouter, type RouterHistory } from 'vue-router'
import NotFound from '#components/NotFound.vue'
import { backupsRoutes } from '#features/backups'
import { settingsRoutes } from '#features/settings'
import { shellPlaceholderRoutes, shellRoute } from '#features/shell'

export function createAppRouter(history: RouterHistory) {
    return createRouter({
        history,
        routes: [
            {
                ...shellRoute,
                children: [
                    ...shellPlaceholderRoutes,
                    ...backupsRoutes,
                    ...settingsRoutes,
                ],
            },
            { path: '/:path(.*)*', component: NotFound },
        ],
    })
}
