import {
    computed,
    type MaybeRefOrGetter,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import type { ProfileData, Visibility } from '../../model'
import { stampParts } from '../../services/stamps'
import {
    STEAM_LINK_KEYS,
    type SteamLinkKey,
    steamLinkUrl,
} from '../../services/steamLinks'

const VISIBILITY_ICONS: Record<Visibility, string> = {
    public: 'icon-[lucide--globe]',
    friends: 'icon-[lucide--users]',
    private: 'icon-[lucide--eye-off]',
}

const LINK_ICONS: Record<SteamLinkKey, string> = {
    profile: 'icon-[simple-icons--steam]',
    games: 'icon-[lucide--gamepad-2]',
    friends: 'icon-[lucide--users]',
    inventory: 'icon-[lucide--backpack]',
    badges: 'icon-[lucide--award]',
    groups: 'icon-[lucide--messages-square]',
    steamdb: 'icon-[lucide--calculator]',
}

/** What the identity header shows around the account: visibility, the Steam pages, the three dates. */
export function useProfileHeader(
    account: MaybeRefOrGetter<Account>,
    details: MaybeRefOrGetter<ProfileData>,
) {
    const { t, locale } = useI18n()

    const visibilityLabels = computed<Record<Visibility, string>>(() => ({
        public: t('Public'),
        friends: t('Friends only'),
        private: t('Private'),
    }))
    const linkLabels = computed<Record<SteamLinkKey, string>>(() => ({
        profile: t('Profile'),
        games: t('Games'),
        friends: t('Friends'),
        inventory: t('Inventory'),
        badges: t('Badges'),
        groups: t('Groups'),
        steamdb: t('SteamDB'),
    }))

    return {
        visibility: computed(() => {
            const visibility = toValue(details).visibility
            if (visibility === null) return null
            return {
                icon: VISIBILITY_ICONS[visibility],
                label: visibilityLabels.value[visibility],
            }
        }),
        links: computed(() => {
            const { steamId } = toValue(account)
            if (steamId === null) return []
            return STEAM_LINK_KEYS.map((key) => ({
                key,
                label: linkLabels.value[key],
                icon: LINK_ICONS[key],
                href: steamLinkUrl(key, steamId),
                title:
                    key === 'steamdb'
                        ? t('Open SteamDB calculator')
                        : t('Open on Steam: {page}', {
                              page: linkLabels.value[key],
                          }),
            }))
        }),
        /** `value` is the full stamp, `short` the date alone for the phone. */
        meta: computed(() => {
            const { added, updated } = toValue(account)
            const now = Date.now()
            const stamp = (at: number) => {
                const { date, time } = stampParts(at, now, locale.value)
                return { value: `${date}, ${time}`, short: date }
            }
            const dates = [
                { label: t('Added'), ...stamp(added) },
                { label: t('Updated'), ...stamp(updated) },
            ]
            const at = toValue(details).registered
            if (at === null) return dates
            const registered = stampParts(at, now, locale.value).date
            return [
                ...dates,
                {
                    label: t('Registered'),
                    value: registered,
                    short: registered,
                },
            ]
        }),
    }
}
export type ProfileHeaderState = UnwrapNestedRefs<
    ReturnType<typeof useProfileHeader>
>
