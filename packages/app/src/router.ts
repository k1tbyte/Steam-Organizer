import { createRouter, type RouterHistory } from 'vue-router'
import NotFound from '#components/NotFound.vue'
import { accountsRoutes } from '#features/accounts'
import { backupsRoutes } from '#features/backups'
import { settingsRoutes } from '#features/settings'
import { shellRoute } from '#features/shell'
import { installVaultGuard, vaultRoutes } from '#features/vault'

export function createAppRouter(history: RouterHistory) {
    const router = createRouter({
        history,
        routes: [
            ...vaultRoutes,
            {
                ...shellRoute,
                children: [
                    ...accountsRoutes,
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
