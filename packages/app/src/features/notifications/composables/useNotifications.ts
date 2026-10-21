import { computed, shallowRef, watch } from 'vue'

import { useMock } from '#core'

import { notificationsMock } from '../mocks'

const BADGE_CAP = 99

/** The bell's notifications, newest first; waits on the app's event source (refresh results, backups, updates). */
export function useNotifications() {
    const source = useMock(() => undefined, notificationsMock)
    const readAll = shallowRef(false)

    const items = computed(() =>
        (source.value ?? []).map((item) => ({
            ...item,
            unread: item.unread && !readAll.value,
        })),
    )
    // A new source (another sample, later a new event) starts unread again.
    watch(source, () => {
        readAll.value = false
    })

    const unread = computed(() => items.value.filter((n) => n.unread).length)

    return {
        items,
        unread,
        badge: computed(() =>
            unread.value > BADGE_CAP ? `${BADGE_CAP}+` : String(unread.value),
        ),
        markAllRead: () => {
            readAll.value = true
        },
    }
}
