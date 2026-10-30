import {
    parseVaultFile,
    readRecords,
    type SealedRecord,
    UnsupportedVaultError,
    type VaultFile,
} from '@so/core'
import { openFilePicker, useToast } from '@so/ui'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import { tally, useVaultSession } from '#features/vault'

interface Picked {
    vaultId: string
    fileName: string
    records: readonly SealedRecord[]
}

/** Import into the open vault: only a file of this vault (an export or a backup), opened with the session's key like a backup restore. */
export function useImportVault() {
    const { t } = useI18n()
    const session = useVaultSession()
    const toast = useToast()
    const picked = shallowRef<Picked>()
    const open = ref(false)
    const pending = ref(false)
    const error = ref<string | null>(null)

    const refuse = (title: string, description?: string) =>
        toast.add({ color: 'danger', title, description })
    const unreadable = () =>
        refuse(
            t("This file can't be opened"),
            t(
                "It isn't a Steam Organizer export, was made by a newer version of the app, or is damaged.",
            ),
        )

    async function read(source: File) {
        const vaultId = session.vault?.id
        if (!vaultId) return
        let file: VaultFile
        try {
            file = parseVaultFile(await source.text())
        } catch {
            return unreadable()
        }
        if (file.id !== vaultId)
            return refuse(
                t("This file is another vault's"),
                t(
                    'Add it as a vault of its own: lock, open the vault list on the unlock screen, Add vault, Import encrypted file.',
                ),
            )
        let records: SealedRecord[] | undefined
        try {
            records = await session.withKey((key) => readRecords(key, file))
        } catch (failure) {
            if (!(failure instanceof UnsupportedVaultError))
                reportError(failure, 'settings-import')
            return unreadable()
        }
        if (!records || session.vault?.id !== vaultId) return
        picked.value = { vaultId, fileName: source.name, records }
        error.value = null
        open.value = true
    }

    async function confirm() {
        const target = picked.value
        if (!target || pending.value) return
        // Read under one vault's key, written only into that vault.
        if (session.vault?.id !== target.vaultId) {
            open.value = false
            return
        }
        pending.value = true
        error.value = null
        try {
            await session.replaceRecords(target.records)
            open.value = false
            toast.add({
                color: 'success',
                title: t('Vault imported'),
                description: t(
                    '{count} account | {count} accounts',
                    tally(session.contents).accounts,
                ),
            })
        } catch (failure) {
            reportError(failure, 'settings-import')
            error.value = t(
                "Couldn't save on this device; the vault stays as it was.",
            )
        } finally {
            pending.value = false
        }
    }

    return {
        open,
        pending,
        error,
        title: computed(() =>
            t('Replace this vault with {file}?', {
                file: picked.value?.fileName ?? '',
            }),
        ),
        pick: () =>
            openFilePicker({
                accept: '.sovault,.json',
                onPick: ([file]) => {
                    if (file) void read(file)
                },
            }),
        confirm,
    }
}
