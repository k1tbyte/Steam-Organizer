import { type DriveApi, DriveError, driveApi, type GoogleToken } from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
    DRIVE_ACCOUNT_STORAGE_KEY,
    readStored,
    usePlatform,
    writeStored,
} from '#core'

import type { DriveState, GoogleAccount } from '../model'

function storedAccount(): GoogleAccount | null {
    try {
        const saved = JSON.parse(
            readStored(DRIVE_ACCOUNT_STORAGE_KEY) || 'null',
        ) as GoogleAccount | null
        return saved?.email ? saved : null
    } catch {
        return null
    }
}

// Read late, so a test's stub applies.
const fetch: typeof globalThis.fetch = (...args) => globalThis.fetch(...args)

const ownerOf = (token: GoogleToken) =>
    driveApi(fetch, async () => token.token).about()

/** The Google account this device backs up to. The token stays in memory; a shell may keep its own copy. */
export const useDriveConnection = defineStore('drive', () => {
    const { google } = usePlatform()
    const account = ref(storedAccount())
    const expired = ref(false)
    const connecting = ref(false)
    const online = ref(globalThis.navigator?.onLine !== false)
    if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
            online.value = true
        })
        window.addEventListener('offline', () => {
            online.value = false
        })
    }
    let held: GoogleToken | null = null
    let renewal: ReturnType<typeof setTimeout> | undefined
    // Bumped by a sign-in or sign-out: work begun before it no longer speaks for the connection.
    let generation = 0

    function remember(found: GoogleAccount | null) {
        account.value = found
        writeStored(
            DRIVE_ACCOUNT_STORAGE_KEY,
            found ? JSON.stringify(found) : '',
        )
    }

    function hold(fresh: GoogleToken) {
        held = fresh
        expired.value = false
        clearTimeout(renewal)
        // Renewed, or shown expired, the moment it runs out rather than at the next request.
        renewal = setTimeout(
            () => void token().catch(() => {}),
            fresh.expiresAt - Date.now(),
        )
    }

    // Keeps `held`: no request uses it again, but disconnect still revokes it.
    function lapse() {
        expired.value = true
        clearTimeout(renewal)
    }

    async function token() {
        if (held && !expired.value && held.expiresAt > Date.now())
            return held.token
        const attempt = generation
        const email = account.value?.email
        const fresh = email ? await google?.token(false, email) : null
        // Silently Google signs in whoever its session holds now: only the saved account's token is kept.
        const owner = fresh && (await ownerOf(fresh).catch(() => null))
        if (attempt !== generation) throw new DriveError('unauthorized')
        if (!fresh || owner?.email !== email) {
            lapse()
            throw new DriveError('unauthorized')
        }
        hold(fresh)
        return fresh.token
    }

    // The web renews only from a click, so a stored account shows expired there until one.
    if (account.value) void token().catch(() => {})

    return {
        account: computed(() => account.value),
        state: computed<DriveState>(() => {
            if (!account.value) return 'disconnected'
            if (!online.value) return 'offline'
            return expired.value ? 'expired' : 'connected'
        }),
        /** While Google's window is open: a second click waits for it. */
        connecting: computed(() => connecting.value),
        /** Call where a sign-in button shows: Google's window then opens at once on the click. */
        prepare: () => google?.prepare?.(),
        /** Signs in from a click (Google may open its window); false when the user closed it. */
        async connect() {
            if (connecting.value) return false
            connecting.value = true
            const attempt = generation
            let fresh: GoogleToken | null | undefined
            try {
                fresh = await google?.token(true, account.value?.email)
                if (!fresh) return false
                const owner = await ownerOf(fresh)
                if (attempt !== generation) return false
                generation++
                hold(fresh)
                remember(owner)
                return true
            } finally {
                connecting.value = false
                // A sign-in that lands after disconnect is let go at Google too.
                if (fresh && held !== fresh && attempt !== generation)
                    void google?.revoke(fresh.token)
            }
        },
        async disconnect() {
            generation++
            const revoked = held?.token
            held = null
            expired.value = false
            clearTimeout(renewal)
            remember(null)
            if (revoked) await google?.revoke(revoked)
        },
        /** Runs `work` against Drive; a refused token marks the connection expired. */
        async run<T>(work: (drive: DriveApi) => Promise<T>): Promise<T> {
            const attempt = generation
            try {
                return await work(driveApi(fetch, token))
            } catch (error) {
                if (
                    error instanceof DriveError &&
                    error.kind === 'unauthorized' &&
                    attempt === generation
                )
                    lapse()
                throw error
            }
        },
    }
})
