import { createRouter, type RouterHistory } from 'vue-router'
import NotFound from '#components/NotFound.vue'
import { settingsRoutes } from '#features/settings'
import { shellPlaceholderRoutes, shellRoute } from '#features/shell'

export function createAppRouter(history: RouterHistory) {
    return createRouter({
        history,
        routes: [
            {
                ...shellRoute,
                children: [...shellPlaceholderRoutes, ...settingsRoutes],
            },
            { path: '/:path(.*)*', component: NotFound },
        ],
    })
}
