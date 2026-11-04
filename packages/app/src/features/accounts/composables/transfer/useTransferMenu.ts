import type { MenuEntries } from '@so/ui'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { useImportVault } from './useImportVault'

/** The toolbar's Import / export menu: the same dialogs as Settings → Vault. */
export function useTransferMenu() {
    const { t } = useI18n()
    const exportOpen = ref(false)
    const importing = reactive(useImportVault())

    const menu = computed<MenuEntries>(() => [
        {
            label: t('Export vault…'),
            icon: 'icon-[lucide--download]',
            opens: true,
            onSelect: () => {
                exportOpen.value = true
            },
        },
        // Not `opens`: the file picker needs the click's user activation.
        {
            label: t('Import file…'),
            icon: 'icon-[lucide--upload]',
            onSelect: importing.pick,
        },
    ])

    return { menu, exportOpen, importing }
}
