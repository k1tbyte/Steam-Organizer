import { useToast } from '@so/ui'
import { computed, type Ref, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'

import { useVaultSession } from '../stores/useVaultSession'

interface Target {
    id: string
    name: string
}

/** Remove from this device: a confirm for the picked vault; its Drive backups and exported files stay. */
export function useRemoveVault(vault: Ref<Target | undefined>) {
    const { t } = useI18n()
    const session = useVaultSession()
    const toast = useToast()
    const open = ref(false)
    const pending = ref(false)
    const error = ref<string | null>(null)
    // Held while the modal animates out, so its copy never jumps to the next vault.
    const target = shallowRef<Target>()

    function ask() {
        target.value = vault.value
        error.value = null
        open.value = true
    }

    async function confirm() {
        const asked = target.value
        if (!asked || pending.value) return
        pending.value = true
        error.value = null
        try {
            await session.remove(asked.id)
            open.value = false
            toast.add({
                color: 'success',
                title: t('{name} removed from this device', {
                    name: asked.name,
                }),
            })
        } catch (failure) {
            reportError(failure, 'vault', { vault: asked.id })
            error.value = t("Couldn't remove the vault from this device")
        } finally {
            pending.value = false
        }
    }

    return {
        open,
        pending,
        error,
        title: computed(() =>
            t('Remove {name} from this device?', {
                name: target.value?.name ?? '',
            }),
        ),
        ask,
        confirm,
    }
}
