import { DriveError, type DriveErrorKind } from '@so/core'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'

export interface DriveProblem {
    kind: DriveErrorKind
    title: string
    description: string
}

/** What a failed Drive request tells the user; anything but a `DriveError` is a bug, reported and shown as a server failure. */
export function useDriveProblem() {
    const { t } = useI18n()

    function copy(kind: DriveErrorKind): [string, string] {
        switch (kind) {
            case 'unauthorized':
                return [
                    t('Google sign-in expired'),
                    t('Sign in again to reach Google Drive.'),
                ]
            case 'offline':
                return [
                    t("Can't reach Google Drive"),
                    t('Check the connection and try again.'),
                ]
            case 'rate-limit':
                return [
                    t('Google Drive asks to slow down'),
                    t('Try again in a minute.'),
                ]
            case 'quota':
                return [
                    t('Google Drive is full'),
                    t('Free up space in your Google account.'),
                ]
            case 'not-found':
                return [
                    t('Not on Google Drive anymore'),
                    t('It was deleted, maybe from another device.'),
                ]
            case 'server':
                return [
                    t("Google Drive isn't responding"),
                    t('Try again in a moment.'),
                ]
        }
    }

    return {
        problemOf(error: unknown): DriveProblem {
            if (!(error instanceof DriveError)) reportError(error, 'drive')
            const kind = error instanceof DriveError ? error.kind : 'server'
            const [title, description] = copy(kind)
            return { kind, title, description }
        },
    }
}
