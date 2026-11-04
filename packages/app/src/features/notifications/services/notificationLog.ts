import { BAN_KINDS } from '@so/core'

import { parseRecord } from '../../../core/storage'
import type { LoggedNotification, NotificationEvent } from '../model'

/** Entries a vault's log keeps, newest first. */
export const LOG_CAP = 50

/** Each vault's log, by vault id. */
export type NotificationLogs = Record<string, LoggedNotification[]>

const count = (value: unknown) =>
    typeof value === 'number' && Number.isInteger(value) && value >= 0
        ? value
        : null

/** The event's own fields and nothing more: whatever else a producer hands over never reaches storage. */
export function eventOf(
    value: Readonly<Record<string, unknown>>,
): NotificationEvent | null {
    switch (value.kind) {
        case 'refresh': {
            const updated = count(value.updated)
            const fresh = count(value.fresh)
            const missing = count(value.missing)
            const left = count(value.left)
            if (
                updated === null ||
                fresh === null ||
                missing === null ||
                left === null
            )
                return null
            const failed = value.failed === true
            return { kind: 'refresh', updated, fresh, missing, left, failed }
        }
        case 'ban': {
            const { account, bans } = value
            if (typeof account !== 'string' || !Array.isArray(bans)) return null
            const found = BAN_KINDS.filter((kind) => bans.includes(kind))
            return found.length > 0
                ? { kind: 'ban', account, bans: found }
                : null
        }
        case 'backup': {
            const accounts = count(value.accounts)
            const bytes = count(value.bytes)
            if (accounts === null || bytes === null) return null
            return { kind: 'backup', accounts, bytes }
        }
        case 'update': {
            const { version } = value
            return {
                kind: 'update',
                version: typeof version === 'string' ? version : null,
            }
        }
        default:
            return null
    }
}

function entryOf(value: unknown): LoggedNotification | null {
    if (typeof value !== 'object' || value === null) return null
    const stored = value as Record<string, unknown>
    const event = eventOf(stored)
    const { id, at, route } = stored
    if (!event || typeof id !== 'string' || typeof at !== 'number') return null
    return {
        ...event,
        id,
        at,
        read: stored.read === true,
        ...(typeof route === 'string' && { route }),
    }
}

/** Every vault's log as stored; an entry this version cannot read is dropped. */
export function readLogs(raw: string | null): NotificationLogs {
    const logs: NotificationLogs = {}
    for (const [vault, entries] of Object.entries(parseRecord(raw)))
        if (Array.isArray(entries))
            logs[vault] = entries
                .flatMap((entry) => entryOf(entry) ?? [])
                .slice(0, LOG_CAP)
    return logs
}

/** The log with `event` on top; the oldest past the cap drop off. An event it cannot store leaves it as it was. */
export function withEvent(
    log: readonly LoggedNotification[],
    event: NotificationEvent,
    entry: { id: string; at: number; route?: string },
): LoggedNotification[] {
    const own = eventOf(event)
    if (!own) return [...log]
    return [
        {
            ...own,
            id: entry.id,
            at: entry.at,
            read: false,
            ...(entry.route !== undefined && { route: entry.route }),
        },
        ...log,
    ].slice(0, LOG_CAP)
}

/** Whether the log already holds this event, read or not. */
export function holds(
    log: readonly LoggedNotification[],
    event: NotificationEvent,
): boolean {
    const own = JSON.stringify(eventOf(event))
    return log.some((entry) => JSON.stringify(eventOf(entry)) === own)
}
