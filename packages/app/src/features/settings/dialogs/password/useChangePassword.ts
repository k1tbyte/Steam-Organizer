import { type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useVaultSession } from '#features/vault'

import { usePasswordFields } from './usePasswordFields'

export function useChangePassword(open: Ref<boolean>) {
    const { t } = useI18n()
    const session = useVaultSession()
    const fields = usePasswordFields()
    const done = ref(false)
    const saving = ref(false)

    // The flow restarts when it opens, so the success state survives the exit animation.
    watch(open, (isOpen) => {
        if (!isOpen) return
        fields.clear()
        done.value = false
    })

    async function submit() {
        if (!fields.complete.value || saving.value) return
        saving.value = true
        try {
            if (
                await session.changePassword(
                    fields.current.value,
                    fields.next.value,
                )
            )
                done.value = true
            else fields.refuse(t('Wrong master password'))
        } catch (error) {
            reportError(error, 'settings-password')
            fields.currentError.value = t("Couldn't save the new password")
        } finally {
            saving.value = false
        }
    }

    return { fields, done, saving, submit }
}
