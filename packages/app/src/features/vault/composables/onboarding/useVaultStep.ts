import { useToast } from '@so/ui'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { reportError, useMock } from '#core'
import { useDrive, useDriveProblem } from '#features/drive'

import { folderAccessMock } from '../../mocks'
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
    const drive = useDrive()
    // The web loads Google's script ahead, so its window opens on the click.
    drive.prepare()
    const { problemOf } = useDriveProblem()
    const toast = useToast()
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

    const signedIn = computed(() => drive.state.value === 'connected')
    const ready = computed(() => {
        if (draft.name.trim() === '') return false
        if (draft.location === 'drive') return signedIn.value
        if (draft.location === 'folder') return draft.folderChosen
        return true
    })

    // A closed Google window is a quiet false; a failure says why.
    function signIn() {
        drive.connect().catch((error) =>
            toast.add({
                color: 'danger',
                title: t("Couldn't connect Google Drive"),
                description: problemOf(error).description,
            }),
        )
    }

    // Signed out first, so Google offers its account picker; the sign-in starts in the same click.
    function changeAccount() {
        drive.disconnect().catch((error) => reportError(error, 'drive'))
        signIn()
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
        account: drive.account,
        signedIn,
        connecting: drive.connecting,
        folderPath: OBSIDIAN_PATH,
        ready,
        signIn,
        changeAccount,
        toggleFolder,
        next,
    }
}
