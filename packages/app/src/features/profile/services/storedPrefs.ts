import { STEAM_ID_DISPLAY_FORMATS, type SteamIdDisplayFormat } from '@so/core'
import { oneOf, parseRecord } from '../../../core/storage'
import { PROFILE_SECTIONS, type ProfileSection } from '../model'

export const DEFAULT_ID_FORMAT: SteamIdDisplayFormat = 'account-id'

export type CollapsedSections = Record<ProfileSection, boolean>

export const NO_COLLAPSED_SECTIONS: CollapsedSections = {
    credentials: false,
    note: false,
    community: false,
    bans: false,
}

/** Stored text back to the Steam ID format; an unknown one reads as the default. */
export function parseIdFormat(raw: string | null): SteamIdDisplayFormat {
    return oneOf(STEAM_ID_DISPLAY_FORMATS, raw, DEFAULT_ID_FORMAT)
}

/** Stored text back to the collapsed sections; a missing or malformed entry reads as open. */
export function parseCollapsedSections(raw: string | null): CollapsedSections {
    const stored = parseRecord(raw)
    return Object.fromEntries(
        PROFILE_SECTIONS.map((section) => [section, stored[section] === true]),
    ) as CollapsedSections
}
