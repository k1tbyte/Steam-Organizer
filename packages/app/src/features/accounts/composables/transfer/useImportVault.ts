import { UnsupportedVaultError } from '@so/core'
import { openFilePicker, useToast } from '@so/ui'
import {
    computed,
    ref,
    shallowRef,
    type UnwrapNestedRefs,
    type WritableComputedRef,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'

import {
    type ImportResult,
    type StagedImport,
    useVaultImport,
} from './useVaultImport'

type Step = 'replace' | 'password' | 'preview'

/** What the open dialog shows; kept while it animates out. The decrypted part stays in `staged`, dropped on close. */
interface Shown {
    step: Step
    fileName: string
    /** What the file is: this vault's part, accounts to add, or whose password it asks (another vault's, the old app's). */
    kind: 'replace' | 'merge' | 'add' | 'vault' | 'v2'
    accounts: number
    locked: number
}

/** The one Import entry (the Accounts toolbar, Settings → Vault): reads the file, then replaces after a warning, merges
 *  or adds after a preview, asking a password first where the file has its own. */
export function useImportVault() {
    const { t } = useI18n()
    const imports = useVaultImport()
    const toast = useToast()
    const shown = shallowRef<Shown>()
    const open = ref(false)
    const pending = ref(false)
    const error = ref<string | null>(null)
    const password = ref('')
    const passwordError = ref('')
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)
    let staged: StagedImport | undefined
    // Bumped by every pick and close: a read or a password check that ends later never lands.
    let attempt = 0

    watch(password, () => {
        passwordError.value = ''
    })

    const refuse = (title: string, description?: string) =>
        toast.add({ color: 'danger', title, description })
    const unreadable = () =>
        refuse(
            t("This file can't be opened"),
            t(
                "It isn't a Steam Organizer export, was made by a newer version of the app, or is damaged.",
            ),
        )

    function close() {
        attempt++
        open.value = false
        staged = undefined
        password.value = ''
    }

    function show(next: StagedImport, fileName: string) {
        staged = next
        error.value = null
        if (next.step === 'other-vault')
            return refuse(
                t("This file is another vault's"),
                t(
                    'Add it as a vault of its own: lock, open the vault list on the unlock screen, Add vault, Import encrypted file.',
                ),
            )
        if (next.step === 'unreadable') return unreadable()
        const asks = next.step === 'password'
        shown.value = {
            step: asks || next.step === 'replace' ? next.step : 'preview',
            fileName,
            kind: asks ? next.source : next.step,
            accounts: 'accounts' in next ? next.accounts : 0,
            locked: 'locked' in next ? next.locked : 0,
        }
        passwordError.value = ''
        open.value = true
    }

    async function read(source: File) {
        close()
        const mine = attempt
        let next: StagedImport
        try {
            next = await imports.read(
                new Uint8Array(await source.arrayBuffer()),
            )
        } catch (failure) {
            if (!(failure instanceof UnsupportedVaultError))
                reportError(failure, 'accounts-import')
            if (mine === attempt) unreadable()
            return
        }
        if (mine === attempt) show(next, source.name)
    }

    async function submitPassword() {
        const current = staged
        if (current?.step !== 'password' || pending.value) return
        const mine = attempt
        pending.value = true
        try {
            const next = await current.open(password.value)
            if (mine !== attempt) return
            if (next === 'wrong') {
                passwordError.value = t('Wrong password')
                failedAttempts.value++
                return
            }
            password.value = ''
            show(next, shown.value?.fileName ?? '')
        } catch (failure) {
            if (mine !== attempt) return
            if (!(failure instanceof UnsupportedVaultError))
                reportError(failure, 'accounts-import')
            close()
            unreadable()
        } finally {
            pending.value = false
        }
    }

    function added(result: ImportResult) {
        const title = [
            t(
                'Imported {count} account | Imported {count} accounts',
                result.imported,
            ),
            ...(result.skipped
                ? [t('{count} skipped (already in the vault)', result.skipped)]
                : []),
        ].join(' · ')
        toast.add({
            color: 'success',
            title,
            description: result.locked ? lockedNote(result.locked) : undefined,
        })
    }

    const lockedNote = (count: number) =>
        t(
            '{count} locked account skipped: unlock it in its vault first | {count} locked accounts skipped: unlock them in their vault first',
            count,
        )

    async function confirm() {
        const current = staged
        if (!current || !('confirm' in current) || pending.value) return
        pending.value = true
        error.value = null
        try {
            const result = await current.confirm()
            // Read under one vault's key, written only into that vault.
            if (result === null) return close()
            close()
            if (typeof result === 'number')
                toast.add({
                    color: 'success',
                    title: t('Vault imported'),
                    description: t(
                        '{count} account | {count} accounts',
                        result,
                    ),
                })
            else added(result)
        } catch (failure) {
            reportError(failure, 'accounts-import')
            error.value = t(
                "Couldn't save on this device; the vault stays as it was.",
            )
        } finally {
            pending.value = false
        }
    }

    const dialog = (step: Step): WritableComputedRef<boolean> =>
        computed({
            get: () => open.value && shown.value?.step === step,
            set: (value) => {
                if (!value && !pending.value) close()
            },
        })

    const fileName = computed(() => shown.value?.fileName ?? '')
    const accounts = computed(() => shown.value?.accounts ?? 0)

    return {
        replaceOpen: dialog('replace'),
        passwordOpen: dialog('password'),
        previewOpen: dialog('preview'),
        pending,
        error,
        password,
        passwordError,
        failedAttempts,
        replaceTitle: computed(() =>
            t('Replace this vault with {file}?', { file: fileName.value }),
        ),
        passwordTitle: computed(() =>
            t('Open {file}', { file: fileName.value }),
        ),
        passwordHint: computed(() =>
            shown.value?.kind === 'v2'
                ? t(
                      'A file from the old Steam Organizer: type the password it was exported with.',
                  )
                : t(
                      "It belongs to another vault: type the password it was exported with, or that vault's master password.",
                  ),
        ),
        previewTitle: computed(() =>
            t(
                'Import {count} account from {file}? | Import {count} accounts from {file}?',
                { count: accounts.value, file: fileName.value },
                accounts.value,
            ),
        ),
        previewHint: computed(() =>
            shown.value?.kind === 'merge'
                ? t(
                      'The file holds accounts of this vault: one it lacks comes back, a newer copy replaces the older, and nothing here is removed.',
                  )
                : t(
                      'They join this vault as new accounts. One it already holds, by Steam ID or login, is skipped.',
                  ),
        ),
        lockedNote: computed(() => {
            const locked = shown.value?.locked ?? 0
            return locked ? lockedNote(locked) : null
        }),
        canOpen: computed(() => password.value !== '' && !pending.value),
        pick: () =>
            openFilePicker({
                accept: '.sovault,.json,.sodb,.bin',
                onPick: ([file]) => {
                    if (file) void read(file)
                },
            }),
        submitPassword,
        confirm,
    }
}

export type VaultImport = UnwrapNestedRefs<ReturnType<typeof useImportVault>>
