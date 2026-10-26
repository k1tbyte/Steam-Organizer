import { useToast } from '@so/ui'
import {
    computed,
    type MaybeRefOrGetter,
    type Ref,
    ref,
    shallowRef,
    toValue,
    watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import { reportError } from '#core'

import { findService, serviceName } from '../services/vaultServices'
import { useVaultServices } from './useVaultServices'

/** A service field: the picked service, a search over the registry minus `taken` ones, and a name no service holds adds one. */
export function useServicePicker(
    picked: Ref<string | null>,
    taken: MaybeRefOrGetter<readonly string[]>,
) {
    const { t } = useI18n()
    const toast = useToast()
    const registry = useVaultServices()
    const open = shallowRef(false)
    const query = ref('')
    const name = computed(() => serviceName(query.value))
    const holder = computed(() => findService(registry.own.value, name.value))
    const free = (id: string) => !toValue(taken).includes(id)
    // A create that resolves after another pick, or a reopen, no longer picks.
    let picks = 0

    watch(open, (shown) => {
        picks++
        if (shown) query.value = ''
    })
    const found = computed(() => {
        const needle = name.value.toLowerCase()
        return registry.services.value.filter(
            (service) =>
                free(service.id) && service.name.toLowerCase().includes(needle),
        )
    })
    /** The name typed, while no service holds it. */
    const fresh = computed(() =>
        name.value !== '' && !holder.value ? name.value : null,
    )

    function pick(id: string | null | undefined) {
        if (!id || !free(id)) return
        picked.value = id
        open.value = false
    }
    async function create() {
        const ticket = ++picks
        try {
            const id = await registry.create(name.value)
            if (ticket === picks) pick(id)
        } catch (error) {
            reportError(error, 'services')
            toast.add({ color: 'danger', title: t("Couldn't add the service") })
        }
    }

    return {
        open,
        query,
        current: computed(() =>
            picked.value ? registry.of(picked.value) : null,
        ),
        found,
        fresh,
        pick,
        create,
        /** Enter: adds the typed name, else picks the service holding it or the first found. */
        submit() {
            if (fresh.value) void create()
            else pick(holder.value?.id ?? found.value[0]?.id)
        },
    }
}
