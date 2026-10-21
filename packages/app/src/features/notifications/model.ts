export type NotificationTone = 'danger' | 'accent' | 'success' | 'neutral'

export interface AppNotification {
    id: string
    icon: string
    tone: NotificationTone
    title: string
    body: string
    /** Relative time, as the row shows it. */
    time: string
    unread: boolean
}
