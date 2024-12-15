import {FC, useEffect, useRef, useState} from "react";
import {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {SteamGameInfo} from "@/types/steamPlayerSummary.ts";
import {Loader} from "@/components/primitives/Loader.tsx";
import db, {EDbStore} from "@/services/indexedDb.ts";
import {ScrollerInitializer, VirtualScroller} from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {ObservableObject} from "@/lib/observer/observableObject.ts";
import {StackLayout} from "@/components/primitives/VirtualScroller/StackLayout.ts";
import {GameCard} from "@/pages/Profile/GamesTab/elements/GameCard.tsx";


const GamesTab: FC<IAccountProps & { scroller: ScrollerInitializer }> = ({acc, scroller}) => {
    const [games, setGames] = useState<SteamGameInfo[]>(null)

    useEffect(() => {
        if (!acc.id) {
            return;
        }

        db.get<SteamGameInfo[]>(acc.id, EDbStore.Games).then((o) => {
            if (!o) {
                return;
            }
            setGames(o)
        })
    }, [acc]);

    if (!games) {
        return <Loader/>
    }

    return (
        <VirtualScroller collection={new ObservableObject(games)} scroller={scroller}
                         onRenderElement={(game) => <GameCard key={game.appId} game={game}/>}
                         layout={StackLayout}/>

/*        games.map((game) => {
            return <div key={game.appId}>
                <p>{game.name}</p>
            </div>
        })*/
    )
}

export default GamesTab;