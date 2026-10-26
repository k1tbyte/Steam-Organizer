import { useToast } from '@so/ui'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { useEditSecret } from '#features/accounts'

type Change = Parameters<ReturnType<typeof useEditSecret>>[1]

/** A credentials write for one account; a failure or a refusal is said and resolves to false. */
export function useSecretWrite(accountId: () => string) {
    const { t } = useI18n()
    const toast = useToast()
    const editSecret = useEditSecret()
    const saving = ref(false)

    async function write(change: Change, failed: string) {
        saving.value = true
        try {
            const saved = await editSecret(accountId(), change)
            if (!saved)
                toast.add({
                    color: 'warning',
                    title: t('The account changed meanwhile'),
                    description: t(
                        'Nothing was saved. Check it and try again.',
                    ),
                })
            return saved
        } catch (error) {
            reportError(error, 'credentials')
            toast.add({ color: 'danger', title: failed })
            return false
        } finally {
            saving.value = false
        }
    }
    return { saving, write }
}
