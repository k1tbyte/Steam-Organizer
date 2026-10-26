/** A linked service as screens show it: a built-in one, or one the user added. */
export interface LinkedService {
    /** The built-in id, or the SERVICE record's. */
    id: string
    name: string
    /** A built-in's iconify class. */
    icon: string | null
    /** An added service's own SVG, drawn as a one-color mask. */
    svg: string | null
    builtIn: boolean
}

export const MAX_SERVICE_NAME = 24
/** How many linked services one account holds. */
export const MAX_ACCOUNT_SERVICES = 7

/** Ids are stored in account secrets: never rename one. */
export const BUILT_IN_SERVICES = [
    { id: 'email', name: 'Email', icon: 'icon-[lucide--mail]' },
    { id: 'discord', name: 'Discord', icon: 'icon-[simple-icons--discord]' },
    { id: 'faceit', name: 'FACEIT', icon: 'icon-[simple-icons--faceit]' },
    { id: 'epic', name: 'Epic Games', icon: 'icon-[simple-icons--epicgames]' },
    {
        id: 'battlenet',
        name: 'Battle.net',
        icon: 'icon-[simple-icons--battledotnet]',
    },
    { id: 'ubisoft', name: 'Ubisoft', icon: 'icon-[simple-icons--ubisoft]' },
    { id: 'ea', name: 'EA', icon: 'icon-[simple-icons--ea]' },
    {
        id: 'rockstar',
        name: 'Rockstar Games',
        icon: 'icon-[simple-icons--rockstargames]',
    },
    { id: 'riot', name: 'Riot Games', icon: 'icon-[simple-icons--riotgames]' },
    { id: 'twitch', name: 'Twitch', icon: 'icon-[simple-icons--twitch]' },
    { id: 'xbox', name: 'Xbox', icon: 'icon-[simple-icons--xbox]' },
    {
        id: 'playstation',
        name: 'PlayStation',
        icon: 'icon-[simple-icons--playstation]',
    },
] as const
