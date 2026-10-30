import {
    type Backup,
    DriveError,
    listBackups,
    readBackup,
    UnsupportedVaultError,
} from '@so/core'
import { type AsyncStatus, useToast } from '@so/ui'
import { computed, onScopeDispose, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { formatDate, formatSize, formatTime, reportError } from '#core'
import { type DriveProblem, useDrive, useDriveProblem } from '#features/drive'

import { useVaultSession } from '../stores/useVaultSession'

/** Onboarding's restore: sign in to Google, pick a backup of any vault on that Drive, open it with the password it was made with. */
export function useRestore() {
    const { t } = useI18n()
    const session = useVaultSession()
    const drive = useDrive()
    drive.prepare()
    const { problemOf } = useDriveProblem()
    const toast = useToast()

    const backups = shallowRef<Backup[]>()
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
            const found = await drive.run((api) => listBackups(api))
            if (attempt !== request) return
            backups.value = found
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

    const describe = (backup: Backup) => ({
        id: backup.id,
        date: `${formatDate(backup.createdAt)} · ${formatTime(backup.createdAt)}`,
        meta: [
            backup.vaultName,
            t('{count} account | {count} accounts', backup.accounts),
            formatSize(backup.sizeBytes),
        ]
            .filter(Boolean)
            .join(' · '),
    })

    watch(password, () => {
        problem.value = null
    })

    async function restore() {
        const backup = picked.value
        if (!backup || restoring.value) return
        const mine = new AbortController()
        running = mine
        restoring.value = true
        problem.value = null
        try {
            const file = await drive.run((api) => readBackup(api, backup.id))
            mine.signal.throwIfAborted()
            const result = await session.adopt(
                backup.vaultName || t('Restored vault'),
                file,
                password.value,
                mine.signal,
            )
            if (mine.signal.aborted) return
            // Opened: the vault guard leaves onboarding on its own.
            if (result === 'wrong') {
                problem.value = t('Wrong password for this backup')
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
        heading: computed(() =>
            picked.value === backups.value?.[0]
                ? t('Latest backup')
                : t('Backup'),
        ),
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
