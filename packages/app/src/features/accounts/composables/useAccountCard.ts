import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCopyFeedback } from '#core'

import type { Account, CardFlags } from '../model'
import { cardHeightCss, cardRows, hasFooter } from '../services/cardLayout'

const SECRET_MASK = '••••••'
const MAX_SHOWN_TAGS = 3

/** What one card shows for its account and flags, and its copy feedback. */
export function useAccountCard(props: {
    account: Account
    flags: CardFlags
    touch: boolean
}) {
    const { t } = useI18n()
    const { copied, copy } = useCopyFeedback()

    const steam = computed(() => !props.account.anonymous)
    // An anonymous account's ID is its login, which a locked account keeps secret.
    const idHidden = computed(
        () => props.account.anonymous && props.account.locked,
    )
    const idText = computed(() => {
        if (copied.value) return t('Copied')
        if (idHidden.value) return SECRET_MASK
        return props.account.steamId ?? props.account.login
    })

    const shownTags = computed(() =>
        props.account.tags.slice(0, MAX_SHOWN_TAGS),
    )
    const hiddenTags = computed(() => props.account.tags.slice(MAX_SHOWN_TAGS))

    return {
        copied,
        idText,
        shownTags,
        hiddenTags,
        height: computed(() => cardHeightCss(props.flags, props.touch)),
        pinInset: computed(
            () => `calc(var(--density-unit) * ${props.touch ? 1.5 : 2.5})`,
        ),
        rows: computed(() => cardRows(props.touch)),
        showLevel: computed(() => props.flags.level && steam.value),
        showAge: computed(() => props.flags.age && steam.value),
        showId: computed(() => props.flags.id),
        showBans: computed(() => props.flags.bans && steam.value),
        showTags: computed(() => props.flags.tags),
        showFooter: computed(() => hasFooter(props.flags)),
        showGuard: computed(
            () =>
                props.flags.guard &&
                props.account.guard &&
                !props.account.locked,
        ),
        showLockedGuard: computed(
            () =>
                props.flags.guard &&
                props.account.guard &&
                props.account.locked,
        ),
        showNoGuard: computed(
            () => props.flags.guard && steam.value && !props.account.guard,
        ),
        note: computed(() => {
            if (!props.flags.note) return ''
            // Notes stay out of a locked account's search too (services/filters.ts).
            if (props.account.locked) return SECRET_MASK
            return props.account.note || t('No note')
        }),
        profilePath: computed(() => `/accounts/${props.account.id}`),
        copyId: () => {
            if (!idHidden.value) {
                void copy(props.account.steamId ?? props.account.login)
            }
        },
    }
}
