import type { AccountSecret } from '@so/core'
import { shallowRef } from 'vue'

import { useMock, usePlatform } from '#core'
import { type Account, useAccountCredentials } from '#features/accounts'
import { useGuardCodes } from '#features/steam-guard'
import { useVaultSession } from '#features/vault'

import { tabMock } from '../mocks'
import type { TabContext, TabRequest } from '../model'
import { readFilled, readTabContext } from '../services/tabMessages'

const ANOTHER_SITE: TabContext = { kind: 'other', address: '' }

/** What the active tab asks of the popup, and the fill into it, through `Platform.activeTab`: the tab's content script
 *  says what the page shows (no receiver: another site), and takes a login and password or a Guard code to put in. */
export function useActiveTab() {
    const { activeTab } = usePlatform()
    const { loginOf, passwordOf } = useAccountCredentials()
    const codeAt = useGuardCodes()
    const session = useVaultSession()

    // The vault gives a stand-in code to an account with no authenticator: one of the vault never gets a fill without it.
    // An `everything` lock hides the list's flag, so the secret says; a sample has no secret to say.
    const hasAuthenticator = async (id: string) =>
        !session.contents?.data.has(id) ||
        (await session.secretOf<AccountSecret>(id))?.authenticator !== undefined

    // With a way to the tab the answer is real, even "another site"; the sample stands in only without one.
    const real = shallowRef<TabContext | undefined>(
        activeTab ? ANOTHER_SITE : undefined,
    )
    const tab = useMock(() => real.value, tabMock)
    void activeTab?.request({ type: 'tab:context' }).then(
        (answer) => {
            real.value = readTabContext(answer)
        },
        () => {},
    )

    return {
        tab,
        /** Puts the account's login and password (a sign-in) or Guard code (a prompt) into the tab. `sample`: the
         *  banner is a sample, so there is nothing to send; `missed`: the tab is not a Steam login, or its page had
         *  no fields for it. Nothing is sent to a tab that is not a Steam login. */
        async fill(account: Account): Promise<'filled' | 'sample' | 'missed'> {
            if (tab.value !== real.value) return 'sample'
            const kind = real.value?.kind
            if (!activeTab || (kind !== 'signin' && kind !== 'guard'))
                return 'missed'
            if (kind === 'guard' && !(await hasAuthenticator(account.id)))
                return 'missed'
            const request: TabRequest =
                kind === 'signin'
                    ? {
                          type: 'tab:fill-login',
                          id: account.id,
                          login: await loginOf(account),
                          password: await passwordOf(account),
                      }
                    : { type: 'tab:fill-code', code: await codeAt(account.id) }
            return readFilled(await activeTab.request(request))
                ? 'filled'
                : 'missed'
        },
    }
}
