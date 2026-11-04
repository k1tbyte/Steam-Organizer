import type { BanKind } from '@so/core'

export type NotificationTone = 'danger' | 'accent' | 'success' | 'neutral'

/** What a producer reports: kinds, numbers and account ids, never vault content (names resolve when shown). */
export type NotificationEvent =
    | {
          kind: 'refresh'
          updated: number
          fresh: number
          missing: number
          /** Not reached: stopped, or `failed` ended the run. */
          left: number
          failed: boolean
      }
    | { kind: 'ban'; account: string; bans: BanKind[] }
    | { kind: 'backup'; accounts: number; bytes: number }
    | { kind: 'update'; version: string | null }

export type NotificationKind = NotificationEvent['kind']

/** One entry of a vault's log on this device. */
export type LoggedNotification = NotificationEvent & {
    id: string
    at: number
    read: boolean
    /** Where a click goes; an update applies instead. */
    route?: string
}

/** A row as the panel shows it. */
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
