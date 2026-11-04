import {
    changePassword,
    serializeVaultFile,
    type VaultFile,
    WrongPasswordError,
    withPictures,
    writeRecords,
} from '@so/core'
import { saveFile, useToast } from '@so/ui'
import { computed, type Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError, usePasswordFields } from '#core'
import { useVaultSession } from '#features/vault'

import { partialRecords } from '../../services/transfer/partialRecords'

/** The vault to a `.sovault` file: as stored (opens with the master password) or rewrapped under its own. With `picked`
 *  accounts, a partial file of just those and the tags and services they use, which an import adds and never replaces. */
export function useExportVault(
    open: Ref<boolean>,
    picked: () => readonly string[] | undefined,
) {
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

    /** The stored file with the preset pictures this device holds, or a partial one sealed with the same key; the count of
     *  accounts it holds. */
    async function exported(
        ids: readonly string[] | undefined,
    ): Promise<{ file: VaultFile; accounts?: number } | undefined> {
        const latest = await session.snapshot()
        if (!latest) return undefined
        const { file, contents } = latest
        return session.withKey(async (key) => {
            if (session.vault?.id !== file.id) return undefined
            if (!ids) {
                const whole = await withPictures(
                    key,
                    contents.records,
                    contents.data,
                )
                return {
                    file: whole.carried
                        ? await writeRecords(key, file, whole.records)
                        : file,
                }
            }
            const { records, accounts } = await partialRecords(
                key,
                contents,
                ids,
            )
            if (accounts === 0) return undefined
            const partial = { ...file, partial: true as const }
            return { file: await writeRecords(key, partial, records), accounts }
        })
    }

    const fileName = (name: string, accounts?: number) =>
        accounts === undefined
            ? `${name}.sovault`
            : `${t('{vault} ({count} account) | {vault} ({count} accounts)', { vault: name, count: accounts }, accounts)}.sovault`

    async function submit() {
        const name = session.vault?.name
        if (!name || !canSubmit.value || saving.value) return
        const mine = attempt
        const ids = picked()
        const passwords = ownPassword.value && {
            master: fields.current.value,
            file: fields.next.value,
        }
        saving.value = true
        try {
            const made = await exported(ids)
            if (mine !== attempt) return
            // The vault closed, or the picks left it, meanwhile.
            if (!made) {
                open.value = false
                return
            }
            const file = passwords
                ? await changePassword(
                      made.file,
                      passwords.master,
                      passwords.file,
                  )
                : made.file
            if (mine !== attempt) return
            const saved = fileName(name, made.accounts)
            saveFile(
                saved,
                serializeVaultFile(file),
                'application/octet-stream',
            )
            open.value = false
            toast.add({
                color: 'success',
                title: ids ? t('Accounts exported') : t('Vault exported'),
                description: saved,
            })
        } catch (error) {
            if (mine !== attempt) return
            if (error instanceof WrongPasswordError)
                return fields.refuse(t('Wrong master password'))
            reportError(error, 'accounts-export')
            toast.add({
                color: 'danger',
                title: ids
                    ? t("Couldn't export the accounts")
                    : t("Couldn't export the vault"),
            })
        } finally {
            if (mine === attempt) saving.value = false
        }
    }

    return {
        fields,
        ownPassword,
        canSubmit,
        saving,
        submit,
        title: computed(() => {
            const count = picked()?.length
            return count === undefined
                ? t('Export vault')
                : t('Export {count} account | Export {count} accounts', count)
        }),
        description: computed(() =>
            picked()
                ? t(
                      'The picked accounts and their tags, sealed in one file. Importing it adds them to a vault and replaces nothing.',
                  )
                : t(
                      'Every account, sealed in one file. Import it on another device, or here to bring this vault back to it.',
                  ),
        ),
    }
}
