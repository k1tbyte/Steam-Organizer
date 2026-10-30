import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { usePlatform } from '#core'

import { useVaultSession } from '../stores/useVaultSession'
import { useOnboardingFrame } from './useOnboardingFrame'

export interface StartOption {
    key: 'create' | 'restore' | 'import'
    icon: string
    title: string
    description: string
}

export function useWelcome() {
    const { t } = useI18n()
    const router = useRouter()
    const platform = usePlatform()
    const session = useVaultSession()
    const { desktop } = useOnboardingFrame()

    // The phone frame trims the copy to fit.
    const options = computed<StartOption[]>(() => [
        {
            key: 'create',
            icon: 'icon-[lucide--sparkles]',
            title: t('Create a new vault'),
            description: desktop.value
                ? t(
                      'Set a master password. Add accounts by hand or import later.',
                  )
                : t('Set a master password.'),
        },
        {
            key: 'restore',
            icon: 'icon-[lucide--cloud-download]',
            title: desktop.value
                ? t('Restore from Google Drive')
                : t('Restore from Drive'),
            description: desktop.value
                ? t('Use the latest encrypted backup from your Drive.')
                : t('Latest encrypted backup.'),
        },
        {
            key: 'import',
            icon: 'icon-[lucide--file-lock-2]',
            title: t('Import encrypted file'),
            description: desktop.value
                ? t('Open an export made in Steam Organizer.')
                : t('An export from Steam Organizer.'),
        },
    ])

    const intro = computed(() =>
        desktop.value
            ? t(
                  'Passwords never leave the device unencrypted. Pick how to start.',
              )
            : t('Passwords never leave the device unencrypted.'),
    )
    const assurance = computed(() =>
        desktop.value
            ? t('Stored locally · AES-256-GCM · open source')
            : t('Stored locally · AES-256-GCM'),
    )

    /** Steam data is fetched only by the extension. */
    const webOnlyNotice = computed(
        () => desktop.value && platform.kind === 'web',
    )

    function choose(key: StartOption['key']) {
        if (key === 'create') void router.push('/welcome/vault')
        else if (key === 'restore') void router.push('/welcome/restore')
        // Import encrypted file: waits on the vault file format.
    }

    function getExtension() {
        // Waits on the extension store listing.
    }

    return {
        options,
        intro,
        assurance,
        webOnlyNotice,
        // Adding a vault from the unlock screen can go back to it.
        back: computed(() =>
            session.state === 'locked' ? '/unlock' : undefined,
        ),
        choose,
        getExtension,
    }
}
