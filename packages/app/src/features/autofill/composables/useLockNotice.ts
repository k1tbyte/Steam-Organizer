import { computed, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { usePlatform } from '#core'
import type { Account } from '#features/accounts'
import { useVaultSession } from '#features/vault'

/**
 * What stops a fill, and where to fix it. A website never takes a password: the master password and an
 * account's own password are typed in the extension, where the page cannot read them.
 */
export function useLockNotice(account: Ref<Account | undefined>) {
    const { t } = useI18n()
    const session = useVaultSession()
    const platform = usePlatform()

    const notice = computed(() => {
        if (session.state === 'locked')
            return {
                title: t('Vault locked'),
                hint: t(
                    'Unlock Steam Organizer to fill. Your master password is never typed on a website.',
                ),
                action: t('Open Steam Organizer'),
                path: '/unlock',
            }
        if (session.state === 'new')
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
                    'Unlock it in Steam Organizer, then fill. Its password is never typed on a website.',
                ),
                action: t('Open account'),
                path: `/accounts/${account.value.id}`,
            }
        return undefined
    })

    return {
        notice,
        openApp() {
            if (notice.value) platform.openApp?.(notice.value.path)
        },
    }
}
