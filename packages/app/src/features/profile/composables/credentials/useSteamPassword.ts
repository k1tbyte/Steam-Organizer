import { MIN_PASSWORD_LENGTH } from '@so/core'
import { computed, type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    passwordStrength,
    STRENGTH_LABELS,
    STRENGTH_TONES,
    useCloseOnSuccess,
} from '#core'

import { generatePassword } from '../../services/generatePassword'
import { useSecretWrite } from './useSecretWrite'

/** The Steam password dialog: Save replaces the vault's copy, with no history. */
export function useSteamPassword(accountId: () => string, open: Ref<boolean>) {
    const { t } = useI18n()
    const { saving, write } = useSecretWrite(accountId)
    const closeOnSuccess = useCloseOnSuccess(open)
    const password = ref('')
    const shown = ref(false)

    watch(open, (isOpen) => {
        if (!isOpen) return
        password.value = ''
        shown.value = false
    })
    const level = computed(() => passwordStrength(password.value))

    return {
        password,
        shown,
        saving,
        strength: computed(() => ({
            level: level.value,
            tone: STRENGTH_TONES[level.value],
            // The vault's own minimum, not the master password's.
            label:
                level.value === 0
                    ? t('At least {count} characters', {
                          count: MIN_PASSWORD_LENGTH,
                      })
                    : t(STRENGTH_LABELS[level.value]),
        })),
        canSave: computed(
            () => password.value.length >= MIN_PASSWORD_LENGTH && !saving.value,
        ),
        generate() {
            password.value = generatePassword()
            shown.value = true
        },
        save() {
            // The write waits in the queue: what was submitted is saved, not what the field holds by then.
            const next = password.value
            if (next.length < MIN_PASSWORD_LENGTH) return
            return closeOnSuccess(() =>
                write(
                    (secret) => ({ secret: { ...secret, password: next } }),
                    t("Couldn't save the password"),
                ),
            )
        },
    }
}
