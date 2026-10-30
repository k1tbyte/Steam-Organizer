import {
    changePassword,
    serializeVaultFile,
    WrongPasswordError,
} from '@so/core'
import { saveFile, useToast } from '@so/ui'
import { computed, type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useVaultSession } from '#features/vault'

import { usePasswordFields } from '../password/usePasswordFields'

/** The whole vault to a `.sovault` file: as stored (opens with the master password) or rewrapped under its own. */
export function useExportVault(open: Ref<boolean>) {
    const { t } = useI18n()
    const session = useVaultSession()
    const toast = useToast()
    const fields = usePasswordFields()
    const ownPassword = ref(false)
    const saving = ref(false)
    // Bumped by every open and close: an export cancelled meanwhile never saves.
    let attempt = 0

    watch(open, (isOpen) => {
        attempt++
        saving.value = false
        if (!isOpen) return
        fields.clear()
        ownPassword.value = false
    })

    const canSubmit = computed(
        () => !ownPassword.value || fields.complete.value,
    )

    async function submit() {
        const name = session.vault?.name
        if (!name || !canSubmit.value || saving.value) return
        const mine = attempt
        const passwords = ownPassword.value && {
            master: fields.current.value,
            file: fields.next.value,
        }
        saving.value = true
        try {
            const latest = await session.snapshot()
            const file =
                latest &&
                (passwords
                    ? await changePassword(
                          latest.file,
                          passwords.master,
                          passwords.file,
                      )
                    : latest.file)
            if (!file || mine !== attempt) return
            const fileName = `${name}.sovault`
            saveFile(
                fileName,
                serializeVaultFile(file),
                'application/octet-stream',
            )
            open.value = false
            toast.add({
                color: 'success',
                title: t('Vault exported'),
                description: fileName,
            })
        } catch (error) {
            if (mine !== attempt) return
            if (error instanceof WrongPasswordError)
                return fields.refuse(t('Wrong master password'))
            reportError(error, 'settings-export')
            toast.add({
                color: 'danger',
                title: t("Couldn't export the vault"),
            })
        } finally {
            if (mine === attempt) saving.value = false
        }
    }

    return { fields, ownPassword, canSubmit, saving, submit }
}
