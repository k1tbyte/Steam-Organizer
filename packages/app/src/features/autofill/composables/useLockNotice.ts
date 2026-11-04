import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePlatform } from '#core'
import type { PickerAccount } from '#features/quick-access'

import { type AutofillVault, useAutofillVault } from './useAutofillVault'

/** What stops a fill, and where to fix it. A website never takes a password: the master password and an account's
 *  own password are typed in the extension, where the page cannot read them. `action` is absent where the user
 *  fixes it in the toolbar popup, which a page cannot open. */
export interface LockNotice {
    title: string
    hint: string
    action?: string
    path?: string
}

export function useLockNotice(
    account: Ref<PickerAccount | undefined>,
    vault: AutofillVault = useAutofillVault(),
) {
    const { t } = useI18n()
    const platform = usePlatform()

    const notice = computed<LockNotice | undefined>(() => {
        const state = vault.state.value
        if (state === 'locked')
            return {
                title: t('Vault locked'),
                hint: t(
                    'Unlock Steam Organizer to fill. Your master password is never typed on a website.',
                ),
                action: t('Open Steam Organizer'),
                path: '/unlock',
            }
        if (state === 'new')
            return {
                title: t('No vault yet'),
                hint: t('Create one in Steam Organizer to fill from it.'),
                action: t('Open Steam Organizer'),
                path: '/',
            }
        if (account.value?.locked)
            return {
                title: t('{name} is locked', { name: account.value.nickname }),
                hint: t(
                    "Fill it from Steam Organizer in the toolbar: it asks this account's password there, never on a website.",
                ),
            }
        return undefined
    })

    return {
        notice,
        openApp() {
            const path = notice.value?.path
            if (path) platform.openApp?.(path)
        },
    }
}
