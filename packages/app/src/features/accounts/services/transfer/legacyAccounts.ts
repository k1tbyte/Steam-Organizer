import {
    type Authenticator,
    type SteamSnapshot,
    type V2Account,
    type V2Credential,
    vanityIn,
} from '@so/core'

import type { MaFile } from '#features/steam-guard'

import type { IncomingAccount } from './incoming'

/** `steam-guard`'s maFile reader and its login rule, which the import keeps an authenticator by. */
export interface MaFileRules {
    read: (raw: string) => MaFile | null
    fits: (file: MaFile, login: string) => boolean
}

// The old app's own icon numbers; 51 was the Steam account's email.
const STEAM_EMAIL = 51
/** Built-in services by the name the registry knows them by; the rest become the user's own. */
const ICON_SERVICES: Record<number, string> = {
    [STEAM_EMAIL]: 'Email',
    52: 'Epic Games',
    53: 'EA',
    54: 'Ubisoft',
    55: 'Rockstar Games',
    57: 'Xbox',
    58: 'Battle.net',
}
/** Icons with no built-in service: named as the old app named them, unless the user named it. */
const ICON_NAMES: Record<number, string> = { 56: 'ZeniMax', 59: 'Wargaming' }
const OTHER = 'Other'

const VISIBILITY: Record<number, SteamSnapshot['visibility']> = {
    1: 'private',
    2: 'friends',
    3: 'public',
}
const ECONOMY: Record<number, SteamSnapshot['bans']['economy']> = {
    1: 'probation',
    2: 'banned',
}

/** The old profile as a snapshot only when it has its face (nickname, avatar); games, prices and the badge tier
 *  never map (a formatted price, a tier from another count), so a refresh brings them. */
function snapshotOf(
    account: V2Account,
    now: number,
): SteamSnapshot | undefined {
    const { steamId, nickname, avatar } = account
    if (steamId === null || nickname === null || avatar === null)
        return undefined
    const vac = account.vacBans ?? 0
    const game = account.gameBans ?? 0
    return {
        refreshedAt: account.updatedAt ?? account.addedAt ?? now,
        nickname,
        avatar,
        level: account.level ?? 0,
        badge: '',
        registeredAt: account.createdAt,
        visibility: VISIBILITY[account.visibility ?? 0] ?? 'private',
        vanity: account.vanity === null ? null : vanityIn(account.vanity),
        bans: {
            vac,
            game,
            community: account.communityBan ?? false,
            economy: ECONOMY[account.economyBan ?? 0] ?? 'none',
            lastBanDays: vac + game > 0 ? account.daysSinceLastBan : null,
        },
        stats: null,
    }
}

/** Linked logins by service name; the Steam email's address becomes the account's email. */
function linkedOf(credentials: readonly V2Credential[]) {
    let email: string | undefined
    const services: IncomingAccount['services'] = []
    for (const { icon, name, fields } of credentials) {
        let kept = fields
        if (icon === STEAM_EMAIL && email === undefined) {
            email = fields.find(({ kind }) => kind === 'email')?.value
            kept = fields.filter(({ kind }) => kind !== 'email')
        }
        if (kept.length === 0) continue
        const service =
            (icon !== null && ICON_SERVICES[icon]) ||
            name ||
            (icon !== null && ICON_NAMES[icon]) ||
            OTHER
        services.push({ service: { name: service }, fields: kept })
    }
    return { email, services }
}

function authenticatorOf(
    account: V2Account,
    maFile: MaFileRules,
): Authenticator | undefined {
    if (!account.authenticator) return undefined
    const file = maFile.read(JSON.stringify(account.authenticator))
    return file && maFile.fits(file, account.login)
        ? file.authenticator
        : undefined
}

/** The old app's accounts as this vault adds them: pins, notes, phones and linked logins kept. */
export function legacyAccounts(
    accounts: readonly V2Account[],
    maFile: MaFileRules,
    now: number,
): IncomingAccount[] {
    return accounts.map((account) => {
        const { email, services } = linkedOf(account.credentials)
        const steam = snapshotOf(account, now)
        const authenticator = authenticatorOf(account, maFile)
        // An anonymous account shows its alias; the old app named it after the login unless renamed.
        const alias =
            account.steamId === null && account.nickname !== account.login
                ? account.nickname
                : null
        return {
            login: account.login,
            password: account.password,
            steamId: account.steamId,
            ...(steam && { steam }),
            ...(alias && { alias }),
            ...(authenticator && { authenticator }),
            ...(account.note && { note: account.note }),
            ...(account.phone && { phone: account.phone }),
            ...(email && { email }),
            pinned: account.pinned,
            addedAt: account.addedAt ?? now,
            tags: [],
            services,
        }
    })
}
