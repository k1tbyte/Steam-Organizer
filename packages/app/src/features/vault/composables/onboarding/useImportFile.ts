import { parseVaultFile, type VaultFile } from '@so/core'
import { openFilePicker } from '@so/ui'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatSize, reportError } from '#core'

import { MAX_VAULT_NAME_LENGTH } from '../../model'
import { useVaultSession } from '../../stores/useVaultSession'

interface Picked {
    name: string
    size: string
    file: VaultFile
}

/** Onboarding's import: an export opened with the password it was made with, stored on this device under its file name. */
export function useImportFile() {
    const { t } = useI18n()
    const session = useVaultSession()
    const picked = shallowRef<Picked>()
    const fileProblem = ref<string | null>(null)
    const password = ref('')
    const problem = ref<string | null>(null)
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)
    const importing = ref(false)
    // The import in flight: another file or leaving the page gives it up before it stores anything.
    let running: AbortController | null = null
    function giveUp() {
        running?.abort()
        running = null
        importing.value = false
    }
    onScopeDispose(giveUp)
    // A file read before a newer pick never lands.
    let reading = 0

    watch(password, () => {
        problem.value = null
    })

    async function read(source: File) {
        giveUp()
        const mine = ++reading
        picked.value = undefined
        fileProblem.value = null
        problem.value = null
        let file: VaultFile
        try {
            file = parseVaultFile(await source.text())
        } catch {
            if (mine === reading)
                fileProblem.value = t(
                    "This file can't be opened. Pick an export made in Steam Organizer.",
                )
            return
        }
        if (mine !== reading) return
        // Adopting would overwrite it unasked; Settings imports into it with a warning.
        if (session.vaults.some(({ id }) => id === file.id)) {
            fileProblem.value = t(
                'This vault is already on this device. Unlock it and import the file in Settings, Vault.',
            )
            return
        }
        picked.value = {
            name: source.name,
            size: formatSize(source.size),
            file,
        }
    }

    async function submit() {
        const chosen = picked.value
        if (!chosen || importing.value || password.value === '') return
        const mine = new AbortController()
        running = mine
        importing.value = true
        problem.value = null
        const name =
            chosen.name
                .replace(/\.(sovault|json)$/i, '')
                .trim()
                .slice(0, MAX_VAULT_NAME_LENGTH) || t('Imported vault')
        try {
            const result = await session.adopt(
                name,
                chosen.file,
                password.value,
                mine.signal,
            )
            // Opened: the vault guard leaves onboarding on its own.
            if (mine.signal.aborted) return
            if (result === 'wrong') {
                problem.value = t('Wrong password for this file')
                failedAttempts.value++
            } else if (result === 'unreadable')
                problem.value = t("This file can't be opened")
        } catch (error) {
            // Only a given-up import throws.
            if (!mine.signal.aborted) reportError(error, 'vault')
        } finally {
            if (running === mine) {
                running = null
                importing.value = false
            }
        }
    }

    return {
        picked,
        fileProblem,
        password,
        problem,
        failedAttempts,
        importing,
        canImport: computed(() => picked.value !== undefined),
        pick: () =>
            openFilePicker({
                accept: '.sovault,.json',
                onPick: ([file]) => {
                    if (file) void read(file)
                },
            }),
        submit,
    }
}
