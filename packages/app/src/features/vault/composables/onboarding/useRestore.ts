import {
    type Backup,
    DriveError,
    listBackups,
    listCopies,
    readBackup,
    readCopy,
    UnsupportedVaultError,
    type VaultCopy,
} from '@so/core'
import { type AsyncStatus, useToast } from '@so/ui'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    formatAgo,
    formatDate,
    formatSize,
    formatTime,
    reportError,
} from '#core'
import { type DriveProblem, useDrive, useDriveProblem } from '#features/drive'

import { useVaultSession } from '../../stores/useVaultSession'

/** What Restore offers: a vault's synced copy (adopting it links the vault) or one of its backups (kept on this device). */
type Source = ({ from: 'copy' } & VaultCopy) | ({ from: 'backup' } & Backup)

const dateOf = (source: Source) =>
    source.from === 'copy' ? source.modifiedAt : source.createdAt

/** Synced copies first, the latest one the first pick; then backups, newest first. */
function sources(copies: VaultCopy[], backups: Backup[]): Source[] {
    const byDate = (a: Source, b: Source) => dateOf(b) - dateOf(a)
    return [
        ...copies
            .map((copy) => ({ from: 'copy' as const, ...copy }))
            .sort(byDate),
        ...backups.map((backup) => ({ from: 'backup' as const, ...backup })),
    ]
}

/** Onboarding's restore: sign in to Google, pick a vault's synced copy or a backup of any vault on that Drive, open it with
 *  its password. */
export function useRestore() {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    drive.prepare()
    const { problemOf } = useDriveProblem()
    const toast = useToast()

    const backups = shallowRef<Source[]>()
    const failure = shallowRef<DriveProblem | null>(null)
    const pickedId = ref<string | null>(null)
    const listOpen = ref(false)
    const password = ref('')
    const problem = ref<string | null>(null)
    // Never resets: the field shakes on every wrong password.
    const failedAttempts = ref(0)
    const restoring = ref(false)
    // The restore in flight: another account or leaving the page gives it up before it stores anything.
    let running: AbortController | null = null
    function giveUp() {
        running?.abort()
        running = null
        restoring.value = false
    }
    onScopeDispose(giveUp)
    // A list asked for another Google account, or before a newer one, never lands.
    let request = 0

    async function load() {
        if (drive.state.value === 'disconnected') return
        const attempt = ++request
        try {
            const found = await drive.run((api) =>
                Promise.all([listCopies(api), listBackups(api)]),
            )
            if (attempt !== request) return
            backups.value = sources(...found)
            failure.value = null
        } catch (error) {
            if (attempt === request) failure.value = problemOf(error)
        }
    }

    watch(
        [() => drive.account.value?.email, drive.state],
        ([email], [previous]) => {
            if (email !== previous) {
                giveUp()
                request++
                backups.value = undefined
                failure.value = null
                pickedId.value = null
                listOpen.value = false
            }
            if (!backups.value) void load()
        },
        { immediate: true },
    )

    const signedIn = computed(() => drive.state.value !== 'disconnected')
    const expired = computed(() => drive.state.value === 'expired')
    const picked = computed(
        () =>
            backups.value?.find(({ id }) => id === pickedId.value) ??
            backups.value?.[0],
    )
    const status = computed<AsyncStatus>(() => {
        if (failure.value) return 'error'
        if (!backups.value) return 'loading'
        return backups.value.length ? 'ready' : 'empty'
    })

    const accountsOf = (count: number) =>
        t('{count} account | {count} accounts', count)

    const describe = (source: Source) =>
        source.from === 'copy'
            ? {
                  id: source.id,
                  icon: 'icon-[lucide--cloud]',
                  date: source.vaultName || t('Restored vault'),
                  meta: [
                      t('Synced copy'),
                      accountsOf(source.accounts),
                      t('updated {ago}', {
                          ago:
                              formatAgo(source.modifiedAt, Date.now()) ??
                              t('just now'),
                      }),
                  ].join(' · '),
              }
            : {
                  id: source.id,
                  icon: 'icon-[lucide--archive]',
                  date: `${formatDate(source.createdAt)} · ${formatTime(source.createdAt)}`,
                  meta: [
                      source.vaultName,
                      accountsOf(source.accounts),
                      formatSize(source.sizeBytes),
                  ]
                      .filter(Boolean)
                      .join(' · '),
              }

    watch(password, () => {
        problem.value = null
    })

    async function restore() {
        const backup = picked.value
        if (!backup || restoring.value) return
        // Adopting would overwrite it unasked; its Backups page restores with a warning.
        if (session.vaults.some(({ id }) => id === backup.vaultId)) {
            problem.value = t(
                'This vault is already on this device. Unlock it to restore a backup from its Backups page.',
            )
            return
        }
        const mine = new AbortController()
        running = mine
        restoring.value = true
        problem.value = null
        try {
            const copy = backup.from === 'copy'
            const email = drive.account.value?.email
            const file = await drive.run((api) =>
                copy ? readCopy(api, backup.id) : readBackup(api, backup.id),
            )
            mine.signal.throwIfAborted()
            // A synced copy links the vault to it; a backup stays on this device.
            const result = await session.adopt(
                backup.vaultName || t('Restored vault'),
                file,
                password.value,
                mine.signal,
                copy && email
                    ? {
                          account: email,
                          copyId: backup.id,
                          version: backup.version,
                      }
                    : undefined,
            )
            if (mine.signal.aborted) return
            // Opened: the vault guard leaves onboarding on its own.
            if (result === 'wrong') {
                problem.value = copy
                    ? t('Wrong master password')
                    : t('Wrong password for this backup')
                failedAttempts.value++
            } else if (result === 'unreadable')
                problem.value = t("This backup can't be opened")
        } catch (error) {
            if (mine.signal.aborted) return
            if (error instanceof DriveError)
                problem.value = problemOf(error).title
            else {
                if (!(error instanceof UnsupportedVaultError))
                    reportError(error, 'vault')
                problem.value = t("This backup can't be opened")
            }
        } finally {
            if (running === mine) {
                running = null
                restoring.value = false
            }
        }
    }

    return {
        account: drive.account,
        signedIn,
        expired,
        connecting: drive.connecting,
        status,
        failure,
        latest: computed(() => picked.value && describe(picked.value)),
        heading: computed(() => {
            if (picked.value?.from === 'copy') return t('Synced copy')
            return picked.value === backups.value?.[0]
                ? t('Latest backup')
                : t('Backup')
        }),
        /** A synced copy opens with the vault's master password now, a backup with the one of its time. */
        pickedCopy: computed(() => picked.value?.from === 'copy'),
        others: computed(() =>
            (backups.value ?? []).map((backup) => ({
                ...describe(backup),
                picked: backup === picked.value,
            })),
        ),
        listOpen,
        restoreLabel: computed(() =>
            t(
                'Restore {count} account | Restore {count} accounts',
                picked.value?.accounts ?? 0,
            ),
        ),
        password,
        problem,
        failedAttempts,
        restoring,
        restore,
        retry: load,
        // A closed Google window is a quiet false; a failure says why.
        signIn: () =>
            drive.connect().catch((error) =>
                toast.add({
                    color: 'danger',
                    title: t("Couldn't connect Google Drive"),
                    description: problemOf(error).description,
                }),
            ),
        // Google offers its account picker at the next sign-in.
        switchAccount: () =>
            drive.disconnect().catch((error) => reportError(error, 'drive')),
        pick: (id: string) => {
            pickedId.value = id
            listOpen.value = false
        },
    }
}
