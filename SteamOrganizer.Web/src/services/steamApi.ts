import {config} from "@/store/config.ts";
import { type SteamPlayerGames, type SteamPlayerSummary} from "@/types/steamPlayerSummary.ts";
import {toast,  ToastVariant} from "@/components/primitives/Toast.tsx";
import db, {EDbStore} from "@/services/indexedDb.ts";
import {flagStore} from "@/store/local.tsx";

export const steamBase = "https://steamcommunity.com/"
const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/steam/webApi/`


let steamTimeDifference: number | null = null;

const handleResponse = async <T>(input: string | URL | globalThis.Request,
                                 init?: RequestInit,
                                 onSuccess: (o: T) => void = null,
                                 asJson: boolean = true): Promise<T | Response> => {
    if(flagStore.store.offlineMode) {
        toast.open({ body: "You are in offline mode, please connect to the internet", variant: ToastVariant.Warning, id: "offline" })
        return;
    }

    if(!config.steamApiKey) {
        toast.open({ body: "You need to set your Steam API key in the settings", variant: ToastVariant.Warning })
        return;
    }

    let response: Response
    try {
        response = await fetch(input, init);
    }
    catch (err) {
        if(err.name === "AbortError") {
            throw err;
        }

        toast.open({ body: "Can't connect to the server, try again later", variant: ToastVariant.Error })
        return;
    }

    if(response.ok) {
        if(!asJson) {
            return response;
        }
        const result = await response.json() as T
        onSuccess?.(result)
        return result
    }

    let message: string;

    switch (response.status) {
        case 403:
        case 401:
            message = "Your Steam API key is invalid, check it in your settings"
            break;
        case 500:
        case 503:
            message = "The request could not be completed because a server error occurred"
            break;
        case 429:
            message = "You have sent too many requests recently, please try again later"
            break;
        default:
            message = "An unknown error has occurred, please contact the developers"
            break;
    }

    toast.open({ body: message, variant: ToastVariant.Error })
}

const saveGames = (games:  SteamPlayerGames, id: number) => {
    if(games?.games) {
        return db.save(games.games, id, EDbStore.Games)
    }
}

export const getPlayerInfo = async (id: number) => {
    return await handleResponse<SteamPlayerSummary | undefined>(`${apiUrl}getSummaries?key=${config.steamApiKey}&ids=${id}&includeGames=true`,null, (o) => {
        saveGames(o.gamesSummaries, id)
    }) as SteamPlayerSummary | undefined
}

export const getPlayerGames = async (id: number) => {
    return await handleResponse<SteamPlayerGames | undefined>(`${apiUrl}getGames?key=${config.steamApiKey}&steamId=${id}&withDetails=true`, null, (o) => {
        saveGames(o, id)
    }) as SteamPlayerGames | undefined
}

export const getPlayerInfoStream = async (id: number[], cancellation: AbortSignal, callback: (data: SteamPlayerSummary) => void) => {
    const response = await handleResponse(`${apiUrl}getSummariesStream?key=${config.steamApiKey}`, {
        method: "POST",
        headers: {
            'Accept': 'application/json, text/plain',
            'Content-Type': 'application/json;charset=UTF-8'
        },
        signal: cancellation,
        body: JSON.stringify({
            ids: id,
            includeGames: true
        }),
    }, null, false) as Response;

    await response?.body.pipeThrough(new TextDecoderStream()).pipeTo(new WritableStream({
        write(chunk) {
            const obj = JSON.parse(chunk) as SteamPlayerSummary;
            if(obj.gamesSummaries?.games) {
                db.save(obj.gamesSummaries.games, obj.steamId, EDbStore.Games)
            }
            callback(obj);
        }
    }))

    return response;
}

export const resolveVanityUrl = async (vanityUrl: string): Promise<number | undefined | null> => {
    return await handleResponse<number | undefined>(`${apiUrl}getAccountId?key=${config.steamApiKey}&vanityUrl=${vanityUrl}`) as number
}

export const getSteamTime = async () => {
    const now = Math.floor(Date.now() / 1000);

    if (steamTimeDifference != null) {
        return now + steamTimeDifference;
    }

    const server_time = Number((await handleResponse(`${apiUrl}getSteamServerTime?key=${config.steamApiKey}`) as { server_time: string}).server_time);
    steamTimeDifference =  server_time - now;
    return server_time;
}