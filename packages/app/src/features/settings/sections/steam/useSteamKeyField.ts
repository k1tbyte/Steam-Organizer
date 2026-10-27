import { checkKey, isSteamKey } from '@so/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'
import {
    type SteamProblem,
    useSteamApi,
    useSteamKey,
    useSteamProblem,
} from '#features/steam'

/** The Web API key field: saved into the vault once it is empty or whole, then checked against Steam. */
export function useSteamKeyField() {
    const { t } = useI18n()
    const steamKey = useSteamKey()
    const steam = useSteamApi()
    const { problemOf } = useSteamProblem()
    // null: the field shows the stored key.
    const draft = ref<string | null>(null)
    const saveFailed = ref(false)
    const checked = shallowRef<{
        key: string
        result: 'works' | SteamProblem
    } | null>(null)
    let run = 0

    const value = computed(() => draft.value ?? steamKey.key.value ?? '')
    // A result belongs to the key it ran on: an edited key has none yet.
    const result = computed(() =>
        checked.value?.key === value.value.trim() ? checked.value.result : null,
    )

    async function verify(key: string) {
        if (!steam.reachable || key === '') return
        const current = ++run
        try {
            await checkKey(await steam.api(key))
            if (current === run) checked.value = { key, result: 'works' }
        } catch (error) {
            if (current === run)
                checked.value = { key, result: problemOf(error) }
        }
    }

    watch(
        () => steamKey.key.value,
        (key) => {
            if (draft.value === null && key) void verify(key)
        },
        { immediate: true },
    )

    return {
        value,
        works: computed(() => result.value === 'works'),
        error: computed(() => {
            const key = value.value.trim()
            if (saveFailed.value) return t("Couldn't save the key")
            // A partial key while typing is not an error yet.
            if (key.length >= 32 && !isSteamKey(key))
                return t('A key is 32 letters and digits')
            const problem = result.value
            if (problem === null || problem === 'works') return undefined
            return problem.kind === 'bad-key'
                ? t("Steam doesn't accept this key")
                : problem.title
        }),
        async set(next: string) {
            draft.value = next
            saveFailed.value = false
            const key = next.trim()
            if (key !== '' && !isSteamKey(key)) return
            try {
                await steamKey.save(key)
            } catch (error) {
                reportError(error, 'steam-key')
                saveFailed.value = true
                return
            }
            void verify(key)
        },
    }
}
