import {config} from "@/store/config.ts";
import {SteamPlayerSummary} from "@/types/steamPlayerSummary.ts";
import {toast, ToastVariant} from "@/components/primitives/Toast.tsx";
import db, {EDbStore} from "@/services/indexedDb.ts";

const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/steam/webApi/`

const handleResponse = async <T>(action: Promise<Response>,
                                 onSuccess: (o: T) => void = null,
                                 asJson: boolean = true): Promise<T | Response> => {
    let response: Response
    try {
        response = await action;
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
        onSuccess(result)
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

export const getPlayerInfo = async (id: number) => {
    const request =  fetch(`${apiUrl}getSummaries?key=${config.steamApiKey}&ids=${id}&includeGames=true`);
    return await handleResponse<SteamPlayerSummary | undefined>(request, (o) => {
        db.save(o.gamesSummaries.games, id, EDbStore.Games)
    }) as SteamPlayerSummary | undefined
}

export const getPlayerInfoStream = async (id: number[], cancellation: AbortSignal, callback: (data: SteamPlayerSummary) => void) => {
    const response = await handleResponse(fetch(`${apiUrl}getSummariesStream?key=${config.steamApiKey}`, {
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
    }), null, false) as Response;

    await response?.body.pipeThrough(new TextDecoderStream()).pipeTo(new WritableStream({
        write(chunk) {
            const obj = JSON.parse(chunk) as SteamPlayerSummary;
            db.save(obj.gamesSummaries.games, obj.steamId, EDbStore.Games)
            callback(obj);
        }
    }))
}

export const resolveVanityUrl = async (vanityUrl: string): Promise<number | undefined | null> => {
    const request = fetch(`${apiUrl}getAccountId?key=${config.steamApiKey}&vanityUrl=${vanityUrl}`);
    return await handleResponse<number | undefined>(request) as number
}