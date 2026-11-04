import {
    RECORD,
    readService,
    type ServiceData,
    sealRecord,
    type VaultKey,
} from '@so/core'

import {
    BUILT_IN_SERVICES,
    type LinkedService,
    MAX_SERVICE_NAME,
} from '../model'

export function serviceName(text: string): string {
    return text.trim().replace(/\s+/g, ' ').slice(0, MAX_SERVICE_NAME)
}

/** The name with a number, cut so the number survives the length limit. */
export const numberedServiceName = (name: string, n: number) =>
    `${serviceName(name)
        .slice(0, MAX_SERVICE_NAME - String(n).length - 1)
        .trimEnd()} ${n}`

/** A new service's record: the one place its data takes shape (the registry, an import). */
export function newServiceRecord(key: VaultKey, name: string, now: number) {
    const data: ServiceData = { kind: RECORD.SERVICE, name }
    return sealRecord(key, { id: crypto.randomUUID(), updatedAt: now, data })
}

/** The services the user added, by name. */
export function ownServices(
    data: ReadonlyMap<string, unknown>,
): LinkedService[] {
    const services: LinkedService[] = []
    for (const [id, value] of data) {
        const service = readService(value)
        if (service)
            services.push({
                id,
                name: service.name,
                icon: null,
                svg: service.icon ?? null,
                builtIn: false,
            })
    }
    return services.sort((a, b) => a.name.localeCompare(b.name))
}

/** Names are unique ignoring case, built-in ones included: "discord" finds Discord. */
export function findService(
    own: readonly LinkedService[],
    name: string,
): { id: string } | undefined {
    const key = serviceName(name).toLowerCase()
    return [...BUILT_IN_SERVICES, ...own].find(
        (service) => service.name.toLowerCase() === key,
    )
}
