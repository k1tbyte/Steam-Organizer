import {FC, useEffect, useState} from "react";
import {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {SteamGameInfo} from "@/types/steamPlayerSummary.ts";
import {Loader} from "@/components/primitives/Loader.tsx";
import db, {EDbStore} from "@/services/indexedDb.ts";


const GamesTab: FC<IAccountProps> = ({ acc }) => {
    const [games, setGames] = useState<SteamGameInfo[]>(null)

    useEffect(() => {
        if(!acc.id)  {
            return;
        }

        db.get<SteamGameInfo[]>(acc.id, EDbStore.Games).then((o) => {
            if(!o) {
                return;
            }
            setGames(o)
        })
    }, [acc]);

    if(!games) {
        return <Loader/>
    }

    // https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/{appid}/capsule_231x87.jpg - preview
    return (
        <div>
            {
                games.map((game) => {
                    return (
                        <div key={game.appId}>
                            <p>{game.name}</p>
                        </div>
                    )
                })
            }
        </div>
    )
}

export default GamesTab;