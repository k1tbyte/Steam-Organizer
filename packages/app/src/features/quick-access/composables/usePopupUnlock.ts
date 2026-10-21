import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useVaultSession } from '#features/vault'

/** The locked popup's master password. The app's unlock screen adds a try limit and a PIN; the real verifier will own both. */
export function usePopupUnlock() {
    const { t } = useI18n()
    const session = useVaultSession()
    const password = ref('')
    const message = ref('')
    const busy = ref(false)

    watch(password, () => {
        message.value = ''
    })

    async function submit() {
        if (password.value === '' || busy.value) return
        busy.value = true
        const ok = await session.verify({
            method: 'pw',
            password: password.value,
        })
        busy.value = false
        if (ok) session.open()
        else message.value = t('Wrong password')
    }

    return { password, message, busy, submit }
}
