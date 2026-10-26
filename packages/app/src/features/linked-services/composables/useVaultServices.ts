import {
    type LiveRecord,
    RECORD,
    readService,
    type ServiceData,
    sealRecord,
    updateData,
} from '@so/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useMock } from '#core'
import { useVaultSession, type VaultContents } from '#features/vault'

import { servicesMock } from '../mocks'
import { BUILT_IN_SERVICES, type LinkedService } from '../model'
import {
    findService,
    ownServices,
    serviceName,
} from '../services/vaultServices'

function liveService(contents: VaultContents, id: string) {
    const record = contents.records.find((found) => found.id === id)
    const service = readService(contents.data.get(id))
    return record && !('deleted' in record) && service
        ? { record, service }
        : null
}

/** Built-in services and the ones the user added: the one source of a service's name and icon, the one writer of SERVICE records. */
export function useVaultServices() {
    const { t } = useI18n()
    const session = useVaultSession()
    const real = computed(() =>
        session.contents ? ownServices(session.contents.data) : undefined,
    )
    const own = useMock(() => real.value, servicesMock)
    // Mock mode shows a sample over an open vault: writes skip it.
    const onVault = computed(
        () => real.value !== undefined && own.value === real.value,
    )
    const builtIn = computed<LinkedService[]>(() =>
        BUILT_IN_SERVICES.map((service) => ({
            ...service,
            name: t(service.name),
            svg: null,
            builtIn: true,
        })),
    )
    const services = computed(() => [...builtIn.value, ...(own.value ?? [])])

    /** Resolves to the new service's id, or to the one already holding the name. */
    async function create(text: string): Promise<string | null> {
        const name = serviceName(text)
        if (!onVault.value || name === '') return null
        let id: string | null = null
        await session.transact(async (contents, key) => {
            id = findService(ownServices(contents.data), name)?.id ?? null
            if (id) return []
            id = crypto.randomUUID()
            const data: ServiceData = { kind: RECORD.SERVICE, name }
            return [await sealRecord(key, { id, updatedAt: Date.now(), data })]
        })
        return id
    }

    /** `icon: null` drops the uploaded icon. False when another service holds the name. */
    async function update(
        id: string,
        patch: { name?: string; icon?: string | null },
    ): Promise<boolean> {
        if (!onVault.value) return true
        const name = patch.name === undefined ? '' : serviceName(patch.name)
        let saved = true
        await session.transact(async (contents, key) => {
            const live = liveService(contents, id)
            if (!live) return []
            const holder = name && findService(ownServices(contents.data), name)
            saved = !holder || holder.id === id
            if (!saved) return []
            const next: ServiceData = { ...live.service, ...(name && { name }) }
            if (patch.icon === null) delete next.icon
            else if (patch.icon !== undefined) next.icon = patch.icon
            return [await updateData(key, live.record, next, Date.now())]
        })
        return saved
    }

    /** Tombstones the service alone: accounts keep their credentials for it, shown under Other; Undo names them again. */
    async function remove(id: string): Promise<() => Promise<void>> {
        if (!onVault.value) return async () => {}
        let taken: LiveRecord | undefined
        let name = ''
        await session.transact(async (contents) => {
            const live = liveService(contents, id)
            if (!live) return []
            taken = live.record
            name = live.service.name
            return [{ id, updatedAt: Date.now(), deleted: true as const }]
        })
        // The same sealed record, newer than its tombstone; a service that took its name meanwhile keeps it.
        return () =>
            session.transact(async (contents) => {
                if (!taken || findService(ownServices(contents.data), name))
                    return []
                return [{ ...taken, updatedAt: Date.now() }]
            })
    }

    return {
        builtIn,
        own: computed(() => own.value ?? []),
        services,
        /** An unknown or deleted id reads as Other. */
        of: (id: string): LinkedService =>
            services.value.find((service) => service.id === id) ?? {
                id,
                name: t('Other'),
                icon: 'icon-[lucide--globe]',
                svg: null,
                builtIn: true,
            },
        create,
        update,
        remove,
    }
}
