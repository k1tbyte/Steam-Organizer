import { createRouter, type RouterHistory } from 'vue-router'
import NotFound from '#components/NotFound.vue'
import { backupsRoutes } from '#features/backups'
import { settingsRoutes } from '#features/settings'
import { shellPlaceholderRoutes, shellRoute } from '#features/shell'
import { installVaultGuard, vaultRoutes } from '#features/vault'

export function createAppRouter(history: RouterHistory) {
    const router = createRouter({
        history,
        routes: [
            ...vaultRoutes,
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
    installVaultGuard(router)
    return router
}
