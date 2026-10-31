import { type InjectionKey, inject, provide, reactive } from 'vue'

import type { VaultLocation } from '../../model'

/** What the vault step collects; the layout owns it, so Back from a later step keeps it. */
export interface OnboardingDraft {
    name: string
    location: VaultLocation
    folderChosen: boolean
    /** The master password, held until the last step creates the vault. */
    password: string
}

const DRAFT: InjectionKey<OnboardingDraft> = Symbol('onboarding-draft')

export function provideOnboardingDraft(): OnboardingDraft {
    const draft = reactive<OnboardingDraft>({
        name: 'Main vault',
        location: 'drive',
        folderChosen: false,
        password: '',
    })
    provide(DRAFT, draft)
    return draft
}

export function useOnboardingDraft(): OnboardingDraft {
    const draft = inject(DRAFT)
    if (!draft) throw new Error('Onboarding draft is not provided')
    return draft
}
