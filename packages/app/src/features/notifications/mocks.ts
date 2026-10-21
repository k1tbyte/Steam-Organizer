import { defineMock } from '#core'

import type { AppNotification } from './model'

const FOUR: AppNotification[] = [
    {
        id: 'n1',
        icon: 'icon-[lucide--shield-alert]',
        tone: 'danger',
        title: 'New VAC ban on bunny hop',
        body: 'Found during refresh',
        time: '2 h',
        unread: true,
    },
    {
        id: 'n2',
        icon: 'icon-[lucide--refresh-cw]',
        tone: 'accent',
        title: 'Refresh finished',
        body: '42 updated · 3 already fresh · 1 failed',
        time: '3 h',
        unread: true,
    },
    {
        id: 'n3',
        icon: 'icon-[lucide--cloud-check]',
        tone: 'success',
        title: 'Backup saved to Google Drive',
        body: '12 accounts · 18 KB',
        time: 'Yesterday',
        unread: false,
    },
    {
        id: 'n4',
        icon: 'icon-[lucide--download]',
        tone: 'neutral',
        title: 'Update available',
        body: 'Reload to get 3.0.2',
        time: '2 d',
        unread: false,
    },
]

const MANY: AppNotification[] = Array.from({ length: 14 }, (_, i) => ({
    ...(FOUR[i % FOUR.length] as AppNotification),
    id: `many-${i}`,
    unread: i < 12,
}))

export const notificationsMock = defineMock<AppNotification[]>(
    'notifications.list',
    'Notifications',
    {
        'Two unread': FOUR,
        'All read': FOUR.map((n) => ({ ...n, unread: false })),
        Empty: [],
        'Many unread': MANY,
    },
)
