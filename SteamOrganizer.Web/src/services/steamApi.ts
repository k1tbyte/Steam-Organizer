import {config} from "@/store/config.ts";

const apiUrl = `${import.meta.env.VITE_API_URL}/api/v1/steam/webApi/`

export const getPlayerInfo = async (id: number) => {
    console.log(
        (await fetch(`${apiUrl}getSummaries?key=${config.steamApiKey}&ids=${id}`)).json())
}