import { computed, type Ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCopyFeedback, useRouteHero } from '#core'

import type { Account, CardFlags } from '../model'
import { steamNameOf } from '../services/accountName'
import {
    cardHeightCss,
    cardRows,
    cornerInsetCss,
    hasFooter,
} from '../services/cardLayout'
import { useAccountLogin } from './useAccountLogin'

const SECRET_MASK = '••••••'
const MAX_SHOWN_TAGS = 3

/** What one card shows for its account and flags, and its copy feedback. */
export function useAccountCard(
    props: {
        account: Account
        flags: CardFlags
        touch: boolean
    },
    root: Readonly<Ref<HTMLElement | null | undefined>>,
) {
    const { t } = useI18n()
    const { copied, copy, reset } = useCopyFeedback()
    const loginOf = useAccountLogin()
    // A recycled list card shows another account: its copy mark and focus belonged to the last one.
    watch(
        () => props.account.id,
        () => {
            reset()
            const focused = document.activeElement
            if (focused instanceof HTMLElement && root.value?.contains(focused))
                focused.blur()
        },
    )
    const hero = useRouteHero()

    const steam = computed(() => !props.account.anonymous)
    // An anonymous account's ID is its login, which a locked account or the vault's placement keeps secret.
    const idHidden = computed(
        () =>
            props.account.anonymous &&
            (props.account.locked || props.account.login === ''),
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
        /** The card a hero transition morphs into the profile, and back. */
        isHero: computed(() => hero.value === props.account.id),
        idText,
        steamName: computed(() => steamNameOf(props.account)),
        shownTags,
        hiddenTags,
        height: computed(() => cardHeightCss(props.flags, props.touch)),
        pinInset: computed(() => cornerInsetCss(props.touch)),
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
            if (props.account.locked || props.account.noteSecret)
                return SECRET_MASK
            return props.account.note || t('No note')
        }),
        profilePath: computed(() => `/accounts/${props.account.id}`),
        // A login the placement keeps secret still copies: it opens on the press.
        copyId: () => {
            const { account } = props
            if (account.anonymous && account.locked) return
            void copy(account.steamId ?? loginOf(account))
        },
    }
}
