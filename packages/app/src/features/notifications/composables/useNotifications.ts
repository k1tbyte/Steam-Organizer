import type { BanKind } from '@so/core'
import {
    computed,
    type MaybeRefOrGetter,
    shallowRef,
    toValue,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { formatSize, useAppUpdate, useMinuteClock, useMock } from '#core'

import { notificationsMock } from '../mocks'
import type {
    AppNotification,
    LoggedNotification,
    NotificationKind,
    NotificationTone,
} from '../model'
import { ageOf } from '../services/notificationAge'
import { useNotificationLog } from '../stores/notificationLog'

const BADGE_CAP = 99

const LOOKS = {
    refresh: { icon: 'icon-[lucide--refresh-cw]', tone: 'accent' },
    ban: { icon: 'icon-[lucide--shield-alert]', tone: 'danger' },
    backup: { icon: 'icon-[lucide--cloud-check]', tone: 'success' },
    update: { icon: 'icon-[lucide--download]', tone: 'neutral' },
} as const satisfies Record<
    NotificationKind,
    { icon: string; tone: NotificationTone }
>

/** An account's name in the open vault; null for one removed since. */
export type NameOf = (id: string) => string | null

/** The bell: the open vault's log as rows, names resolved through `nameOf` as they show; a sample with no vault open. */
export function useNotifications(nameOf: MaybeRefOrGetter<NameOf>) {
    const { t } = useI18n()
    const router = useRouter()
    const log = useNotificationLog()
    const update = useAppUpdate()
    const now = useMinuteClock()

    function timeOf(at: number) {
        const age = ageOf(at, now.value)
        switch (age.unit) {
            case 'now':
                return t('now')
            case 'minute':
                return t('{count} min', { count: age.count })
            case 'hour':
                return t('{count} h', { count: age.count })
            case 'yesterday':
                return t('Yesterday')
            case 'day':
                return t('{count} d', { count: age.count })
        }
    }

    function banTitle(bans: readonly BanKind[], name: string) {
        if (bans.length > 1) return t('New bans on {name}', { name })
        switch (bans[0]) {
            case 'game':
                return t('New game ban on {name}', { name })
            case 'community':
                return t('New community ban on {name}', { name })
            case 'economy':
                return t('New trade ban on {name}', { name })
            default:
                return t('New VAC ban on {name}', { name })
        }
    }

    function copyOf(entry: LoggedNotification) {
        switch (entry.kind) {
            case 'refresh': {
                const counts: [number, string][] = [
                    [
                        entry.updated,
                        t('{count} updated', { count: entry.updated }),
                    ],
                    [
                        entry.fresh,
                        t('{count} already fresh', { count: entry.fresh }),
                    ],
                    [
                        entry.missing,
                        t('{count} not found', { count: entry.missing }),
                    ],
                    [
                        entry.left,
                        entry.failed
                            ? t('{count} failed', { count: entry.left })
                            : t('{count} left', { count: entry.left }),
                    ],
                ]
                return {
                    title: entry.failed
                        ? t('Refresh failed')
                        : entry.left > 0
                          ? t('Refresh stopped')
                          : t('Refresh finished'),
                    body: counts
                        .flatMap(([count, text]) => (count > 0 ? [text] : []))
                        .join(' · '),
                }
            }
            case 'ban':
                return {
                    title: banTitle(
                        entry.bans,
                        toValue(nameOf)(entry.account) ??
                            t('a removed account'),
                    ),
                    body: t('Found during refresh'),
                }
            case 'backup':
                return {
                    title: t('Backup saved to Google Drive'),
                    body: [
                        t('{count} account | {count} accounts', entry.accounts),
                        formatSize(entry.bytes),
                    ].join(' · '),
                }
            case 'update':
                return {
                    title: t('Update available'),
                    body: entry.version
                        ? t('Reload to get {version}', {
                              version: entry.version,
                          })
                        : t('Reload to get the new version'),
                }
        }
    }

    const rows = computed(() =>
        log.entries?.map(
            (entry): AppNotification => ({
                id: entry.id,
                ...LOOKS[entry.kind],
                ...copyOf(entry),
                time: timeOf(entry.at),
                unread: !entry.read,
            }),
        ),
    )
    const source = useMock(() => rows.value, notificationsMock)
    const live = computed(
        () => rows.value !== undefined && source.value === rows.value,
    )
    // A sample's read state lives here; another sample starts unread again.
    const sampleRead = shallowRef(false)
    watch(
        () => (live.value ? null : source.value),
        () => {
            sampleRead.value = false
        },
    )

    const items = computed(() =>
        (source.value ?? []).map((item) =>
            live.value || !sampleRead.value ? item : { ...item, unread: false },
        ),
    )
    const unread = computed(() => items.value.filter((n) => n.unread).length)

    return {
        items,
        unread,
        badge: computed(() =>
            unread.value > BADGE_CAP ? `${BADGE_CAP}+` : String(unread.value),
        ),
        markAllRead() {
            if (live.value) log.markAllRead()
            else sampleRead.value = true
        },
        /** Marks it read and goes to its source: the profile, Backups, or the update applied. A sample goes nowhere. */
        open(id: string) {
            const entry = live.value
                ? log.entries?.find((found) => found.id === id)
                : undefined
            if (!entry) return
            log.markRead(id)
            if (entry.kind === 'update') return update.apply()
            // A removed account has no profile to open.
            if (entry.kind === 'ban' && toValue(nameOf)(entry.account) === null)
                return
            if (entry.route) void router.push(entry.route)
        },
    }
}
