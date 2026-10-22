import '@so/app/styles.css'

import { mountAutofill } from '@so/app/autofill'

import { contentPlatform } from '../../utils/platform'

export default defineContentScript({
    matches: [
        'https://store.steampowered.com/login*',
        'https://steamcommunity.com/login*',
        'https://help.steampowered.com/*/wizard/Login*',
    ],
    cssInjectionMode: 'ui',
    async main(ctx) {
        const ui = await createShadowRootUi(ctx, {
            name: 'steam-organizer-autofill',
            // Closed: the page cannot reach the controls to click them or read what they hold.
            mode: 'closed',
            position: 'overlay',
            // Above anything a page stacks.
            zIndex: 2147483647,
            // The picker's search must not feed the page's key handlers.
            isolateEvents: true,
            onMount: (container, _shadow, host) =>
                mountAutofill(container, contentPlatform, host),
            onRemove: (app) => app?.unmount(),
        })
        ui.mount()
    },
})
