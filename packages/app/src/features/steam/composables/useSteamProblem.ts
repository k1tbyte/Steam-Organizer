import { SteamError, type SteamErrorKind } from '@so/core'
import { useI18n } from 'vue-i18n'

import { reportError, useSettingsLink } from '#core'

export interface SteamProblem {
    kind: SteamErrorKind
    title: string
    description: string
    icon: string
    /** A key problem is fixed in Settings; any other passes, so it offers Retry. */
    fix: 'settings' | 'retry'
}

/** What a failed Steam request tells the user; anything but a `SteamError` is a bug, reported and shown as a server failure. */
export function useSteamProblem() {
    const { t } = useI18n()
    const openSettings = useSettingsLink()

    function copy(kind: SteamErrorKind): [string, string] {
        switch (kind) {
            case 'no-key':
                return [
                    t("Steam Web API key isn't set"),
                    t('Add one in Settings to look up profiles.'),
                ]
            case 'bad-key':
                return [
                    t("Steam doesn't accept the API key"),
                    t('Check the key in Settings.'),
                ]
            case 'offline':
                return [
                    t("Can't reach Steam"),
                    t('Check the connection and try again.'),
                ]
            case 'rate-limit':
                return [
                    t('Steam asks to slow down'),
                    t('Try again in a minute.'),
                ]
            case 'server':
                return [
                    t("Steam isn't responding"),
                    t('Try again in a moment.'),
                ]
        }
    }

    return {
        problemOf(error: unknown): SteamProblem {
            if (!(error instanceof SteamError)) reportError(error, 'steam')
            const kind = error instanceof SteamError ? error.kind : 'server'
            const [title, description] = copy(kind)
            const keyProblem = kind === 'no-key' || kind === 'bad-key'
            return {
                kind,
                title,
                description,
                icon: keyProblem
                    ? 'icon-[lucide--key-round]'
                    : 'icon-[lucide--cloud-off]',
                fix: keyProblem ? 'settings' : 'retry',
            }
        },
        openSteamSettings: () => openSettings('steam'),
    }
}
