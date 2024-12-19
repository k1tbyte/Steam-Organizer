import {FC, useEffect} from "react";
import {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {EVisibilityState, SteamGameInfo} from "@/types/steamPlayerSummary.ts";
import {Loader} from "@/components/primitives/Loader.tsx";
import db, {EDbStore} from "@/services/indexedDb.ts";
import {ScrollerInitializer, VirtualScroller} from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {StackLayout} from "@/components/primitives/VirtualScroller/StackLayout.ts";
import {GameCard} from "@/pages/Profile/GamesTab/elements/GameCard.tsx";
import {useProxyFilter} from "@/hooks/useProxyFilter.ts";
import {useLoader} from "@/hooks/useLoader.ts";
import {getPlayerGames} from "@/services/steamApi.ts";
import {EmptyCollectionIndicator, SearchCollectionIndicator} from "@/components/elements/CollectionIndicator.tsx";


const GamesTab: FC<IAccountProps & { scroller: ScrollerInitializer }> = ({acc, scroller}) => {
    const [applyFilter, games, gamesProxy] = useProxyFilter<SteamGameInfo>()
    const loading = useLoader(games)

    useEffect(() => {
        db.get<SteamGameInfo[]>(acc.id, EDbStore.Games).then(async (o) => {
            if (!o) {
                const result = await getPlayerGames(acc.id)
                console.log(result)
                if(result) {
                    acc.assignGames(result)
                    o = result.games
                }
            }
            games.set(o || [])
        })
    }, [acc]);

    if (loading) {
        return <Loader className="flex-center h-full py-20"/>
    }

    return (
        <VirtualScroller collection={gamesProxy} scroller={scroller}
                         emptyIndicator={<EmptyCollectionIndicator/>}
                         searchEmptyIndicator={<SearchCollectionIndicator/>}
                         onRenderElement={(game) => <GameCard key={game.appId} game={game}/>}
                         layout={StackLayout}/>
    )
}

export default GamesTab;