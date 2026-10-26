import { openFilePicker, useToast } from '@so/ui'
import { computed, ref, type UnwrapNestedRefs, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCloseOnSuccess } from '#core'
import type { Account } from '#features/accounts'
import { useMaFile } from '#features/steam-guard'

import { useSecretWrite } from '../credentials/useSecretWrite'

/** The account's Steam Guard: a maFile import (a file that fails shows in place of the Import row) and the removal dialog. */
export function useAuthenticator(account: () => Account) {
    const { t } = useI18n()
    const toast = useToast()
    const { saving, write } = useSecretWrite(() => account().id)
    const maFile = useMaFile(() => account().login)
    const removeOpen = ref(false)
    const closeOnSuccess = useCloseOnSuccess(removeOpen)
    // The revocation code is shown once more before it goes: Remove waits for the box.
    const saved = ref(false)
    watch(removeOpen, (isOpen) => {
        if (isOpen) saved.value = false
    })

    async function importFile(file: File | undefined) {
        await maFile.attach(file)
        const picked = maFile.picked.value
        if (picked?.problem !== null) return
        const { authenticator } = picked.file
        maFile.clear()
        const done = await write(
            (secret) => ({
                secret: { ...secret, authenticator },
                data: { guard: true },
            }),
            t("Couldn't add the authenticator"),
        )
        if (done)
            toast.add({
                color: 'success',
                icon: 'icon-[lucide--shield-check]',
                title: t('Authenticator added'),
                description: t('Codes now show on the card and in the popup.'),
            })
    }

    return {
        failed: computed(() =>
            maFile.picked.value?.problem ? maFile.picked.value : null,
        ),
        pick: () =>
            openFilePicker({
                accept: '.mafile,.json',
                onPick: ([file]) => void importFile(file),
            }),
        removeOpen,
        saved,
        saving,
        canRemove: computed(() => saved.value && !saving.value),
        remove: () =>
            closeOnSuccess(() =>
                write(
                    ({ authenticator: _, ...secret }) => ({
                        secret,
                        data: { guard: false },
                    }),
                    t("Couldn't remove the authenticator"),
                ),
            ),
    }
}
export type AuthenticatorState = UnwrapNestedRefs<
    ReturnType<typeof useAuthenticator>
>
