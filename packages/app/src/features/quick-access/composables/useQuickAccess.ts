import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useCopyFeedback, useMock, usePlatform } from '#core'
import {
    type Account,
    useAccountLogin,
    useAccountPassword,
} from '#features/accounts'

import { tabMock } from '../mocks'
import { isPaletteKeyIgnored } from '../services/picker'
import { useAccountGate } from './useAccountGate'
import { useAccountPicker } from './useAccountPicker'
import { useFillFeedback } from './useFillFeedback'

const BANNER_ICON = {
    signin: 'icon-[lucide--log-in]',
    guard: 'icon-[lucide--shield-check]',
} as const

function hasSelectedText(target: EventTarget | null) {
    if (
        target instanceof HTMLInputElement &&
        target.selectionStart !== target.selectionEnd
    )
        return true
    return !(window.getSelection()?.isCollapsed ?? true)
}

/** The popup's account list: search, selection, the fill banner for the current tab, copy and open actions. */
export function useQuickAccess() {
    const { t } = useI18n()
    const platform = usePlatform()
    const tab = useMock(() => undefined, tabMock)
    const picker = useAccountPicker()
    const gate = useAccountGate()
    const passwordOf = useAccountPassword()
    const loginOf = useAccountLogin()
    const { filled, markFilled } = useFillFeedback()
    const loginCopy = useCopyFeedback()
    const passwordCopy = useCopyFeedback()
    // One feedback state serves every row, so it remembers which row it came from.
    const copiedFrom = shallowRef('')

    const banner = computed(() => {
        const kind = tab.value?.kind
        if (!tab.value || kind === undefined || kind === 'other') return
        return {
            icon: BANNER_ICON[kind],
            title:
                kind === 'signin'
                    ? t('Steam sign-in on this tab')
                    : t('Steam Guard on this tab'),
            address: tab.value.address,
        }
    })

    // A Guard prompt needs an authenticator on the picked account.
    const canFill = computed(() => {
        const account = picker.selected.value
        if (!account || !banner.value) return false
        return tab.value?.kind === 'signin' || account.guard
    })

    const fillLabel = computed(() => {
        if (filled.value) return t('Filled')
        if (tab.value?.kind === 'guard') return t('Fill code')
        const name = picker.selected.value?.nickname
        return name ? t('Fill as {name}', { name }) : t('Fill')
    })

    // Waits on the content script of the active tab.
    function fill() {
        const account = picker.selected.value
        if (!account || !canFill.value) return
        gate.guard(account, markFilled)
    }

    function copyLogin(account: Account) {
        gate.guard(account, () => {
            copiedFrom.value = account.id
            void loginCopy.copy(loginOf(account))
        })
    }

    function copyPassword(account: Account) {
        gate.guard(account, () => {
            copiedFrom.value = account.id
            void passwordCopy.copy(passwordOf(account))
        })
    }

    // Asks the password so the row's code and login open up.
    function unlock(account: Account) {
        gate.guard(account, () => {})
    }

    function onKeydown(event: KeyboardEvent) {
        // The password prompt owns Enter and Escape while it is open.
        if (gate.asking.value || isPaletteKeyIgnored(event)) return
        const { key } = event
        if (key === 'ArrowDown' || key === 'ArrowUp') {
            event.preventDefault()
            picker.move(key === 'ArrowDown' ? 1 : -1)
        } else if (key === 'Enter') {
            event.preventDefault()
            fill()
        } else if (key === 'Escape') {
            picker.query.value = ''
        } else if (
            (event.ctrlKey || event.metaKey) &&
            event.code === 'KeyC' &&
            picker.selected.value &&
            !hasSelectedText(event.target)
        ) {
            event.preventDefault()
            copyPassword(picker.selected.value)
        }
    }

    return {
        query: picker.query,
        rows: picker.rows,
        index: picker.index,
        activeId: picker.activeId,
        revealed: picker.revealed,
        hasAccounts: picker.hasAccounts,
        countLabel: computed(() =>
            t('{count} account | {count} accounts', picker.rows.value.length),
        ),
        select: picker.select,
        banner,
        hasBanner: computed(() => banner.value !== undefined),
        canFill,
        fillLabel,
        filled,
        fill,
        copyLogin,
        copyPassword,
        isCopied: (kind: 'login' | 'password', id: string) =>
            copiedFrom.value === id &&
            (kind === 'login' ? loginCopy : passwordCopy).copied.value,
        openInApp: (account: Account) =>
            platform.openApp?.(`/accounts/${account.id}`),
        onKeydown,
        asking: gate.asking,
        password: gate.password,
        passwordError: gate.error,
        isConcealed: gate.isConcealed,
        unlock,
        submitPassword: gate.submit,
        cancelPassword: gate.cancel,
    }
}
