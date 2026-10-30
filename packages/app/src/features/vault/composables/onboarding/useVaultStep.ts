import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useMock } from '#core'

import { driveAccountMock, folderAccessMock } from '../../mocks'
import { LOCATION_ICON, type VaultLocation } from '../../model'
import { useOnboardingDraft } from './useOnboardingDraft'

export interface StorageOption {
    value: VaultLocation
    icon: string
    title: string
    description: string
    recommended: boolean
    /** Why the option cannot be picked here. */
    unavailable?: string
}

const OBSIDIAN_PATH = '~/Obsidian/Steam'

export function useVaultStep() {
    const { t } = useI18n()
    const router = useRouter()
    const draft = useOnboardingDraft()
    const account = useMock(() => undefined, driveAccountMock)
    const canWriteFolders = useMock(
        () => 'showDirectoryPicker' in window,
        folderAccessMock,
    )

    const options = computed<StorageOption[]>(() => [
        {
            value: 'device',
            icon: LOCATION_ICON.device,
            title: t('This device'),
            description: t('Stays in this browser. No sync or backups.'),
            recommended: false,
        },
        {
            value: 'drive',
            icon: LOCATION_ICON.drive,
            title: t('Google Drive'),
            description: t('Syncs your devices and keeps backup history.'),
            recommended: true,
        },
        {
            value: 'folder',
            icon: LOCATION_ICON.folder,
            title: t('Folder'),
            description: t(
                'One Markdown note per account. Works with Obsidian.',
            ),
            recommended: false,
            unavailable:
                canWriteFolders.value === false
                    ? t('Not available in this browser')
                    : undefined,
        },
    ])

    const ready = computed(() => {
        if (draft.name.trim() === '') return false
        if (draft.location === 'drive') return draft.signedInToGoogle
        if (draft.location === 'folder') return draft.folderChosen
        return true
    })

    function toggleGoogle() {
        draft.signedInToGoogle = !draft.signedInToGoogle
    }

    function toggleFolder() {
        draft.folderChosen = !draft.folderChosen
    }

    function next() {
        if (ready.value) void router.push('/welcome/password')
    }

    return {
        draft,
        options,
        account,
        folderPath: OBSIDIAN_PATH,
        ready,
        toggleGoogle,
        toggleFolder,
        next,
    }
}
