import { useToast } from '@so/ui'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { tally, useVaultSession } from '#features/vault'

import { useImportVault } from './useImportVault'

export function useVaultSection() {
    const { t } = useI18n()
    const session = useVaultSession()
    const toast = useToast()
    const resetOpen = ref(false)
    const exportOpen = ref(false)
    const renaming = ref(false)
    const draft = ref('')

    const details = computed(() => {
        const vault = session.vault
        if (!vault) return ''
        const home = vault.home === 'device' ? t('This device') : t('Folder')
        return [
            vault.sync ? t('Google Drive') : home,
            t(
                '{count} account | {count} accounts',
                tally(session.contents).accounts,
            ),
        ].join(' · ')
    })

    function startRename() {
        draft.value = session.vault?.name ?? ''
        renaming.value = true
    }

    /** Enter or leaving the field; an empty name keeps the old one. */
    function saveRename() {
        if (!renaming.value) return
        renaming.value = false
        const name = draft.value.trim()
        if (!name || name === session.vault?.name) return
        session.rename(name).catch((error) => {
            reportError(error, 'settings')
            toast.add({
                color: 'danger',
                title: t("Couldn't rename the vault"),
            })
        })
    }

    return {
        vault: computed(() => session.vault),
        details,
        resetOpen,
        renaming,
        draft,
        startRename,
        saveRename,
        cancelRename: () => {
            renaming.value = false
        },
        exportOpen,
        importing: reactive(useImportVault()),
    }
}
