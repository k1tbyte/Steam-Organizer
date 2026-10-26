import {
    computed,
    type MaybeRefOrGetter,
    toValue,
    type UnwrapNestedRefs,
} from 'vue'
import { useI18n } from 'vue-i18n'

import {
    STEAM_ID_DISPLAY_FORMATS,
    type SteamIdDisplayFormat,
    type SteamIdLookups,
    steamIdValues,
    useCopyFeedback,
} from '#core'

import { useProfilePrefsStore } from '../../stores/profilePrefs'

/** The Steam ID in the format every profile shares and remembers, with a menu of all seven and copy. */
export function useSteamIdField(
    accountId: MaybeRefOrGetter<string>,
    lookups: MaybeRefOrGetter<SteamIdLookups>,
) {
    const { t } = useI18n()
    const prefs = useProfilePrefsStore()
    const { copied, copy } = useCopyFeedback()

    const labels = computed<Record<SteamIdDisplayFormat, string>>(() => ({
        'account-id': t('Account ID'),
        steamid64: t('SteamID64'),
        steam2: t('Steam2'),
        steam3: t('Steam3'),
        'friend-code': t('CS2 friend code'),
        'steam3-hex': t('Steam3 hex'),
        vanity: t('Vanity URL'),
    }))
    const values = computed(() =>
        steamIdValues(toValue(accountId), toValue(lookups)),
    )

    const options = computed(() =>
        STEAM_ID_DISPLAY_FORMATS.map((format) => ({
            format,
            label: labels.value[format],
            value: values.value[format] ?? t('Not set'),
            selected: format === prefs.idFormat,
        })),
    )
    const current = computed(
        () =>
            options.value.find((option) => option.selected) ?? options.value[0],
    )

    return {
        options,
        label: computed(() => current.value?.label ?? ''),
        value: computed(() => current.value?.value ?? ''),
        copied,
        select: prefs.setIdFormat,
        copy() {
            const value = values.value[prefs.idFormat]
            if (value !== null) void copy(value)
        },
    }
}
export type SteamIdFieldState = UnwrapNestedRefs<
    ReturnType<typeof useSteamIdField>
>
