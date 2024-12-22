import {FC, useEffect} from "react";
import {IAccountProps} from "@/pages/Profile/Profile.tsx";
import {EVisibilityState, SteamGameInfo} from "@/types/steamPlayerSummary.ts";
import {Loader} from "@/shared/ui/Loader.tsx";
import db, {EDbStore} from "@/shared/services/indexedDb.ts";
import {ScrollerInitializer, VirtualScroller} from "@/shared/ui/VirtualScroller/VirtualScroller.tsx";
import {StackLayout} from "@/shared/ui/VirtualScroller/StackLayout.ts";
import {GameCard} from "@/pages/Profile/GamesTab/elements/GameCard.tsx";
import {useProxyFilter} from "@/shared/hooks/useProxyFilter.ts";
import {useLoader} from "@/shared/hooks/useLoader.ts";
import {getPlayerGames} from "@/shared/api/steamApi.ts";
import {EmptyCollectionIndicator, SearchCollectionIndicator} from "@/components/CollectionIndicator.tsx";
import styles from "./GamesTab.module.css"


const GamesTab: FC<IAccountProps & { scroller: ScrollerInitializer }> = ({acc, scroller}) => {
    const [applyFilter,proxy, games] = useProxyFilter<SteamGameInfo>()
    const loading = useLoader(games)

    useEffect(() => {
        db.get<SteamGameInfo[]>(acc.id, EDbStore.Games).then(async (o) => {
            if (!o) {
                const result = await getPlayerGames(acc.id)
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
        <>
            <div className={styles.tableHeader} virtual-header="">
                <p className="text-center">Price</p>
                <p>Name</p>
                <p className="text-center">ID</p>
                <p className="text-center">Playtime</p>

            </div>
        <VirtualScroller collection={proxy} scroller={scroller}
                         className="min-h-72"
                         emptyIndicator={<EmptyCollectionIndicator/>}
                         searchEmptyIndicator={<SearchCollectionIndicator/>}
                         onRenderElement={(game) => <GameCard key={game.appId} game={game}/>}
                         layout={StackLayout}/>
        </>
    )
}

export default GamesTab;