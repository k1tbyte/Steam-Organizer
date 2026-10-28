import { computed } from 'vue'

import { useMock } from '#core'

import { connectionMock } from '../mocks'
import { useDriveConnection } from '../stores/useDriveConnection'

/** The Google Drive connection as screens show it: the account, its state and the intents. */
export function useDrive() {
    const store = useDriveConnection()
    const connection = useMock(
        () => ({ account: store.account, state: store.state }),
        connectionMock,
    )
    // A sample connection is only a picture: its buttons never touch the real Google grant.
    const sample = () =>
        Object.values(connectionMock.variants).some(
            (variant) => variant === connection.value,
        )
    return {
        account: computed(() => connection.value?.account ?? null),
        state: computed(() => connection.value?.state ?? 'disconnected'),
        connecting: computed(() => store.connecting),
        prepare: store.prepare,
        connect: async () => !sample() && store.connect(),
        disconnect: async () => {
            if (!sample()) await store.disconnect()
        },
        run: store.run,
    }
}
