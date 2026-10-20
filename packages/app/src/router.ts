import { createRouter, type RouterHistory } from 'vue-router'

export function createAppRouter(history: RouterHistory) {
    return createRouter({
        history,
        routes: [],
    })
}
