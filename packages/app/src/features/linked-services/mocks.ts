import { defineMock } from '#core'

import type { LinkedService } from './model'

const added = (
    id: string,
    name: string,
    svg: string | null = null,
): LinkedService => ({
    id,
    name,
    icon: null,
    svg,
    builtIn: false,
})

// A plain glyph, so the sample shows an uploaded icon next to one without.
const RING_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/></svg>'

/** The services the user added; built-in ones are never sampled. */
export const servicesMock = defineMock<LinkedService[]>(
    'linked-services.own',
    'Added services',
    {
        'Two added': [
            added('svc-gog', 'GOG Galaxy', RING_SVG),
            added('svc-wg', 'Wargaming'),
        ],
        None: [],
    },
)
