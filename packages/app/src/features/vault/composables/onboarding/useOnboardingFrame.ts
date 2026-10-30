import { useDesktopLayout } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const STEPS = 3

/** What every onboarding page shares: layout, control sizes, the step counter and Back. */
export function useOnboardingFrame() {
    const { t } = useI18n()
    const route = useRoute()
    const router = useRouter()
    const desktop = useDesktopLayout()

    const step = computed(() => route.meta.onboardingStep)
    const onWelcome = computed(() => route.name === 'welcome')
    // Welcome shows the language menu instead.
    const headerLabel = computed(() => {
        if (step.value)
            return t('Step {step} of {total}', {
                step: step.value,
                total: STEPS,
            })
        if (route.name === 'restore') return t('Restore')
        return route.name === 'import' ? t('Import') : undefined
    })
    const stepCounter = computed(() =>
        step.value ? `${step.value} / ${STEPS}` : undefined,
    )

    /** Back as the browser does it, or straight to `fallback` when the page was opened by link. */
    function goBack(fallback: string) {
        if (window.history.state?.back) router.back()
        else void router.replace(fallback)
    }

    return {
        desktop,
        fieldSize: computed(() => (desktop.value ? 'md' : 'lg') as 'md' | 'lg'),
        buttonSize: computed(
            () => (desktop.value ? 'xl' : '2xl') as 'xl' | '2xl',
        ),
        onWelcome,
        headerLabel,
        stepCounter,
        goBack,
    }
}
