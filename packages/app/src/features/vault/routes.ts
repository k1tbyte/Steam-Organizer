import { watch } from 'vue'
import type {
    RouteLocationNormalizedGeneric,
    RouteRecordRaw,
    Router,
} from 'vue-router'

import { redirectFor } from './services/vaultAccess'
import { useVaultSession } from './stores/useVaultSession'

/** Bare pages outside the shell: the onboarding steps and the unlock screen. */
export const vaultRoutes: RouteRecordRaw[] = [
    {
        path: '/welcome',
        component: () => import('./components/onboarding/OnboardingLayout.vue'),
        meta: { vaultAccess: ['new'] },
        children: [
            {
                path: '',
                name: 'welcome',
                component: () =>
                    import('./components/onboarding/welcome/WelcomePage.vue'),
            },
            {
                path: 'vault',
                component: () =>
                    import('./components/onboarding/vault/VaultStepPage.vue'),
                meta: { onboardingStep: 1 },
            },
            {
                path: 'password',
                component: () =>
                    import('./components/onboarding/PasswordStepPage.vue'),
                meta: { onboardingStep: 2 },
            },
            {
                path: 'steam',
                component: () =>
                    import('./components/onboarding/SteamAccessPage.vue'),
                meta: { onboardingStep: 3 },
            },
            {
                path: 'restore',
                name: 'restore',
                component: () =>
                    import('./components/onboarding/RestorePage.vue'),
            },
        ],
    },
    {
        path: '/unlock',
        component: () => import('./components/unlock/UnlockPage.vue'),
        meta: { vaultAccess: ['locked'] },
    },
]

/** Keeps every page to the session states it allows, on navigation and when the state changes under it. */
export function installVaultGuard(router: Router) {
    const targetFor = (route: RouteLocationNormalizedGeneric) =>
        redirectFor(useVaultSession().state, route.meta.vaultAccess)

    // The first navigation waits for the vaults on this device.
    router.beforeEach(async (to) => {
        await useVaultSession().load()
        return targetFor(to) ?? true
    })

    // Pinia is installed by the time the first navigation settles.
    void router.isReady().then(() => {
        watch(
            () => useVaultSession().state,
            () => {
                const target = targetFor(router.currentRoute.value)
                if (target) void router.replace(target)
            },
        )
    })
}
