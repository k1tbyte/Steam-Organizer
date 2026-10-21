import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useVaultInfo } from '../../composables/sources/useVaultInfo'

export function useVaultSection() {
    const { t } = useI18n()
    const vault = useVaultInfo()
    const resetOpen = ref(false)

    const details = computed(() => {
        const info = vault.value
        if (!info) return ''
        const accounts = t('{count} account | {count} accounts', info.accounts)
        return t('Google Drive · {accounts} · created {date}', {
            accounts,
            date: info.created,
        })
    })

    // Rename, Export and Import open their own flows once the vault feature owns them.
    function rename() {}
    function exportVault() {}
    function importVault() {}

    return { vault, details, resetOpen, rename, exportVault, importVault }
}
