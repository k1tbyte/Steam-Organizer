import type { StoredVault, VaultFile } from '@so/core'
import { type AsyncStatus, useDesktopLayout } from '@so/ui'
import { useTimer } from '@so/ui/useTimer'
import { computed, onScopeDispose, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { formatAgo, useMock } from '#core'

import { vaultsMock } from '../mocks'
import { type Credential, LOCATION_ICON, type UnlockMethod } from '../model'
import { useVaultSession } from '../stores/useVaultSession'
import { useHelloLabel } from './useHelloLabel'
import { useRemoveVault } from './useRemoveVault'
import { useUnlockPassword } from './useUnlockPassword'
import { useUnlockPin } from './useUnlockPin'
import { useVaultPlace } from './useVaultPlace'

// The success state shows while the vault opens.
const OPENING_MS = 700

const METHOD_ICON: Record<UnlockMethod, string> = {
    bio: 'icon-[lucide--fingerprint]',
    pin: 'icon-[lucide--grid-3x3]',
    pw: 'icon-[lucide--key-round]',
}

export function useUnlock() {
    const { t } = useI18n()
    const session = useVaultSession()
    const router = useRouter()
    const desktop = useDesktopLayout()
    const hello = useHelloLabel()
    const placeOf = useVaultPlace()
    // Read when the picker shows; the age needs no clock of its own here.
    function metaOf({ home, sync }: StoredVault) {
        if (sync?.syncedAt == null) return placeOf(home, !!sync)
        const ago = formatAgo(sync.syncedAt, Date.now()) ?? t('just now')
        return t('Google Drive · synced {ago}', { ago })
    }
    // The master password always opens a vault; a passkey or PIN slot on this device adds Hello and the PIN, the PIN even paused (its tab shows why).
    const methodsOf = (id: string): UnlockMethod[] => [
        ...(session.device.get(id)?.prf ? (['bio'] as const) : []),
        ...(session.device.get(id)?.pin ? (['pin'] as const) : []),
        'pw',
    ]
    const vaults = useMock(
        () =>
            session.vaults.map((item) => ({
                id: item.id,
                name: item.name,
                location: item.sync ? ('drive' as const) : item.home,
                meta: metaOf(item),
                methods: methodsOf(item.id),
            })),
        vaultsMock,
    )
    const timer = useTimer()

    const status = computed<AsyncStatus>(() =>
        vaults.value?.length ? 'ready' : 'empty',
    )

    const pickedVaultId = ref(session.lastVaultId ?? undefined)
    const vault = computed(
        () =>
            vaults.value?.find((item) => item.id === pickedVaultId.value) ??
            vaults.value?.[0],
    )
    const resetOpen = ref(false)
    const removal = reactive(useRemoveVault(vault))
    const vaultRows = computed(() =>
        (vaults.value ?? []).map((item) => ({
            ...item,
            icon: LOCATION_ICON[item.location],
            active: item.id === vault.value?.id,
        })),
    )
    const vaultIcon = computed(() =>
        vault.value ? LOCATION_ICON[vault.value.location] : '',
    )
    const pickerOpen = ref(false)

    // Never resets: the fields shake on every change.
    const failedAttempts = ref(0)
    const waitingForHello = ref(false)
    const opening = ref(false)
    const picked = ref<UnlockMethod>()

    function pickVault(id: string) {
        pickedVaultId.value = id
        pickerOpen.value = false
        pin.resetPin()
    }

    const hasBio = computed(() => vault.value?.methods.includes('bio') ?? false)
    const methods = computed(() =>
        (vault.value?.methods ?? []).map((value) => ({
            value,
            icon: METHOD_ICON[value],
            label: {
                bio: hello.value,
                pin: t('PIN'),
                pw: t('Password'),
            }[value],
            disabled: value === 'pin' && pin.pinLocked.value,
        })),
    )

    // Desktop tabs: the picked one while it is allowed, else the first allowed.
    const method = computed<UnlockMethod>({
        get() {
            const allowed = methods.value.filter((item) => !item.disabled)
            return allowed.find((item) => item.value === picked.value)
                ? (picked.value as UnlockMethod)
                : (allowed[0]?.value ?? 'pw')
        },
        set(value) {
            picked.value = value
            pin.pinError.value = ''
        },
    })
    // Phones have no tabs: the PIN pad while it works (Hello is a key on it), else Hello alone, else the password.
    const phoneMethod = computed<'bio' | 'pin' | 'pw'>(() => {
        if (picked.value === 'pw') return 'pw'
        if (pin.canUsePin.value) return 'pin'
        return hasBio.value ? 'bio' : 'pw'
    })

    const view = computed<UnlockMethod | 'opening'>(() => {
        if (opening.value) return 'opening'
        return desktop.value ? method.value : phoneMethod.value
    })

    // A vault removed during the animation leaves the picker on another one: that one stays locked.
    function succeed() {
        const opened = vault.value?.id
        opening.value = true
        timer.arm(OPENING_MS, () => {
            if (vault.value?.id === opened) session.open()
            else opening.value = false
        })
    }

    let disposed = false
    onScopeDispose(() => {
        disposed = true
    })

    const isStale = (forVault: string | undefined) =>
        disposed || vault.value?.id !== forVault

    // An answer for a vault picked away, or after leaving the page, is dropped with the key it unwrapped;
    // a vault another flow opened meanwhile stays.
    async function attempt(
        credential: Credential,
        copyOf?: (id: string) => Promise<VaultFile | undefined>,
    ) {
        const forVault = vault.value?.id
        let result = await session.unlock(credential, forVault)
        if (result === 'wrong' && forVault && copyOf) {
            const copy = await copyOf(forVault)
            if (copy && !disposed)
                result = await session.unlock(credential, forVault, copy)
        }
        if (!isStale(forVault)) return result
        if (result === 'opened' && session.state !== 'unlocked') session.lock()
        return null
    }

    const ctx = {
        vault,
        attempt,
        isStale,
        succeed,
        failedAttempts,
        picked,
        opening,
    }
    const pin = useUnlockPin(ctx)
    const password = useUnlockPassword(ctx)

    async function startHello() {
        if (waitingForHello.value) return
        waitingForHello.value = true
        const result = await attempt({ method: 'bio' })
        waitingForHello.value = false
        if (result === 'opened') succeed()
    }

    function switchToPassword() {
        picked.value = 'pw'
    }

    function switchToPin() {
        picked.value = 'pin'
        pin.resetPin()
    }

    function addVault() {
        void router.push('/welcome')
    }

    function removeFromDevice() {
        pickerOpen.value = false
        removal.ask()
    }

    return {
        status,
        vault,
        vaultRows,
        vaultIcon,
        pickerOpen,
        pickVault,
        methods,
        method,
        view,
        hasBio,
        failedAttempts,
        pin: reactive(pin),
        password: reactive(password),
        waitingForHello,
        startHello,
        switchToPassword,
        switchToPin,
        addVault,
        removeFromDevice,
        removal,
        resetOpen,
    }
}
