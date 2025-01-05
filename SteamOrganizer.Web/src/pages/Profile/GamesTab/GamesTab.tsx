import React, {FC, useEffect} from "react";
import {IAccountProps} from "@/pages/Profile/Profile";
import {SteamGameInfo} from "@/types/steamPlayerSummary";
import {Loader} from "@/shared/ui/Loader";
import db, {EDbStore} from "@/shared/services/indexedDb";
import {ScrollerInitializer, VirtualScroller} from "@/shared/ui/VirtualScroller/VirtualScroller";
import {StackLayout} from "@/shared/ui/VirtualScroller/StackLayout";
import {GameCard} from "@/pages/Profile/GamesTab/components/GameCard";
import {getPlayerGames} from "@/shared/api/steamApi";
import {EmptyCollectionIndicator, SearchCollectionIndicator} from "@/components/CollectionIndicator";
import styles from "./GamesTab.module.css"
import {useFilterManager} from "@/components/FilterInput/useFilterManager";
import {EFilterType, FiltersDefinition, IFilterConfig} from "@/components/FilterInput/types";
import {FilterInput} from "@/components/FilterInput/FilterInput";
import {useObservableLoader} from "@/shared/hooks/useObservableLoader";

const gamesFilters = [
    [
        {
            type: EFilterType.Search,
            fields: [
                {
                    name: null,
                    prop: nameof.typed<SteamGameInfo>().name
                }
            ]
        },
        {
            type: EFilterType.Order,
            label: "Order by",
            fields: [
                {
                    name: "Price",
                    prop: nameof.typed<SteamGameInfo>().formattedPrice
                },
                {
                    name: "Name",
                    prop: nameof.typed<SteamGameInfo>().name
                },
                {
                    name: "Id",
                    prop: nameof.typed<SteamGameInfo>().appId
                },
                {
                    name: "Playtime",
                    prop: nameof.typed<SteamGameInfo>().playtime_forever
                }
            ]
        }
    ]
] satisfies FiltersDefinition

const defaultConfig = {
    [EFilterType.Search]: { by: [0, nameof.typed<SteamGameInfo>().name] },
    [EFilterType.Flags]: {},
    [EFilterType.Order]: {}
} as IFilterConfig

const GamesTab: FC<IAccountProps & { scroller: ScrollerInitializer }> = ({acc, scroller}) => {
    const {proxy, callback, filterConfig, collection } = useFilterManager<SteamGameInfo>(defaultConfig)
    const isLoading = useObservableLoader(collection)

    useEffect(() => {
        db.get<SteamGameInfo[]>(acc.id, EDbStore.Games).then(async (o) => {
            if (!o) {
                const result = await getPlayerGames(acc.id)
                if(result) {
                    acc.assignGames(result)
                    o = result.games
                }
            }
            collection.set(o || [])
        })
    }, [acc]);

    if (isLoading) {
        return <Loader className="flex-center h-full py-20"/>
    }

    return (
        <>
            <div className={styles.tableHeader} virtual-header="">
                <p className="text-center">Price</p>
                <FilterInput onFilterChanged={callback} config={filterConfig} filters={gamesFilters}
                             className="h-12 bg-transparent col-span-4 sm:col-auto md:pl-0"
                             maxLength={60} placeholder="Click to sort or search"/>
                <p className="text-center">ID</p>
                <p className="text-center">Playtime</p>
            </div>
            <VirtualScroller collection={proxy} scroller={scroller}
                             className="min-h-72"
                             emptyIndicator={() => collection.value.length ? <SearchCollectionIndicator/> : <EmptyCollectionIndicator/>}
                             onRenderElement={(game) => <GameCard key={game.appId} game={game}/>}
                             layout={StackLayout}/>
        </>
    )
}

export default GamesTab;