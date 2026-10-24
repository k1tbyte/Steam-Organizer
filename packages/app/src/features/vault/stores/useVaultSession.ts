import {
    createVault,
    changePassword as rewrapPassword,
    type StoredVault,
    unlockVault,
    type VaultKey,
    vaultStore,
    WrongPasswordError,
} from '@so/core'
import { defineStore } from 'pinia'
import { computed, ref, shallowRef, watch } from 'vue'

import { reportError, useMock } from '#core'

import { DEMO_PASSWORD, DEMO_PIN, sessionMock } from '../mocks'
import type { Credential, SessionState, UnlockResult } from '../model'

// Stands in for the Windows Hello prompt.
const HELLO_DELAY_MS = 1300

async function demoVerify(credential: Credential) {
    if (credential.method === 'bio') {
        await new Promise((resolve) => setTimeout(resolve, HELLO_DELAY_MS))
        return true
    }
    return credential.method === 'pin'
        ? credential.pin === DEMO_PIN
        : credential.password === DEMO_PASSWORD
}

async function opens(
    vault: StoredVault,
    password: string,
): Promise<VaultKey | Exclude<UnlockResult, 'opened'>> {
    try {
        return await unlockVault(vault.file, password)
    } catch (error) {
        if (error instanceof WrongPasswordError) return 'wrong'
        reportError(error, 'vault-session', { vault: vault.id })
        return 'unreadable'
    }
}

/** Whether a vault is open: the router guard reads `state`, the lock button and unlock flow write it.
 *  Vaults on this device come from `@so/core`; a mock vault (mock mode, Drive restore) takes the demo credentials. */
export const useVaultSession = defineStore('vault-session', () => {
    // Null until `load()`: the autofill entry never calls it, so a Steam page's storage stays untouched.
    const vaults = shallowRef<StoredVault[] | null>(null)
    let loading: Promise<void> | null = null
    // Unwrapped by unlock, kept through the opening animation until `open()`.
    const opened = shallowRef<{ vault: StoredVault; key: VaultKey } | null>(
        null,
    )
    const unlocked = ref(false)

    const real = computed<SessionState | undefined>(() => {
        if (unlocked.value) return 'unlocked'
        if (!vaults.value) return undefined
        return vaults.value.length ? 'locked' : 'new'
    })
    const mocked = useMock(() => real.value, sessionMock)
    // Lets lock and open flip a mocked state; any change underneath clears it.
    const override = ref<SessionState | null>(null)
    watch(mocked, () => {
        override.value = null
    })
    const state = computed<SessionState>(
        () => override.value ?? mocked.value ?? 'new',
    )

    function load() {
        loading ??= vaultStore
            .list()
            .catch((error) => {
                reportError(error, 'vault-session')
                return []
            })
            .then((list) => {
                vaults.value = list
            })
        return loading
    }

    function lock() {
        opened.value = null
        unlocked.value = false
        override.value = 'locked'
    }

    /** A vault was created, restored or unlocked. */
    function open() {
        unlocked.value = true
        override.value = 'unlocked'
    }

    /** Unwraps the picked vault's key, or the first one's. */
    async function unlock(
        credential: Credential,
        vaultId?: string,
    ): Promise<UnlockResult> {
        const vault = vaultId
            ? vaults.value?.find((item) => item.id === vaultId)
            : vaults.value?.[0]
        if (!vault) return (await demoVerify(credential)) ? 'opened' : 'wrong'
        // PIN and Hello slots come later; such a vault lists the password only.
        if (credential.method !== 'pw') return 'wrong'
        const key = await opens(vault, credential.password)
        if (typeof key === 'string') return key
        opened.value = { vault, key }
        return 'opened'
    }

    /** Checks the open vault's master password without touching the session. */
    async function verify(credential: Credential): Promise<boolean> {
        const vault = opened.value?.vault
        if (!vault || credential.method !== 'pw') return demoVerify(credential)
        return typeof (await opens(vault, credential.password)) !== 'string'
    }

    function remember(vault: StoredVault) {
        vaults.value = [
            ...(vaults.value ?? []).filter((item) => item.id !== vault.id),
            vault,
        ]
    }

    /** Creates a vault on this device and opens it. */
    async function create(name: string, password: string) {
        const { file, key } = await createVault(password)
        const vault: StoredVault = { id: file.id, name, home: 'device', file }
        await vaultStore.put(vault)
        // One synchronous step: the guard never sees the stored vault as locked.
        opened.value = { vault, key }
        open()
        remember(vault)
    }

    async function changePassword(
        current: string,
        next: string,
    ): Promise<boolean> {
        const active = opened.value
        if (!active) return demoVerify({ method: 'pw', password: current })
        try {
            const file = await rewrapPassword(active.vault.file, current, next)
            const vault = { ...active.vault, file }
            await vaultStore.put(vault)
            // A lock meanwhile keeps the key dropped; the list still takes the new file, or the old password would open it.
            if (opened.value === active)
                opened.value = { vault, key: active.key }
            remember(vault)
            return true
        } catch (error) {
            if (error instanceof WrongPasswordError) return false
            throw error
        }
    }

    return {
        state,
        vaults: computed(() => vaults.value ?? []),
        load,
        lock,
        open,
        unlock,
        verify,
        create,
        changePassword,
    }
})
