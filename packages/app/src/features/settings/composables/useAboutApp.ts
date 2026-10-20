import { useMock } from '#core'

import { aboutMock } from '../mocks'

/** Version and pending update; wired to the build version and the update check later. */
export function useAboutApp() {
    return useMock(() => undefined, aboutMock)
}
