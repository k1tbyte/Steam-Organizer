import {config} from "@/store/config.ts";
import {SteamPlayerSummary} from "@/types/steamPlayerSummary.ts";

const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/steam/webApi/`

export const getPlayerInfo = async (id: number) => {
    const response = await fetch(`${apiUrl}getSummaries?key=${config.steamApiKey}&ids=${id}`);
    return await response.json() as SteamPlayerSummary
}