import {useEffect, useRef, useState} from "react";
import {EFilterType, EOrderDirection, IFilterConfig} from "@/components/FilterInput/types";
import {ObservableCollection, ObservableObject} from "@/shared/lib/observer/observableObject";
import {ObservableProxy} from "@/shared/lib/observer/observableProxy";
import {debounce} from "@/shared/lib/utils";

export const useFilterManager = <T>(
    initialConfig: IFilterConfig,
    source?: ObservableProxy<T[]> | ObservableCollection<T>,
    serializeName?: string,
    filterFunction?: (data: T[]) => T[],
) => {
    const [state] = useState(() => {
        const collection = (source instanceof ObservableProxy ? source.observer : source) || new ObservableObject<T[]>(undefined);
        const proxy = source instanceof ObservableProxy ? source : new ObservableProxy(collection);
        return { collection, proxy };
    });

    const [filterConfig] = useState<IFilterConfig>(() => {
        if(!serializeName) {
            return initialConfig;
        }
        const saved = localStorage.getItem(serializeName);
        return saved ? JSON.parse(saved) : initialConfig;
    });

    const saveRef = useRef(debounce(() => localStorage.setItem(serializeName, JSON.stringify(filterConfig)), 500))

    const filter = filterFunction || ((data: any[]) => {
        const keyword = filterConfig[EFilterType.Search].keyword?.toUpperCase();

        let filtered = data.filter(data => {
            if (keyword && !data[filterConfig[EFilterType.Search].by[1]].toUpperCase().includes(keyword)) {
                return;
            }

            const flags = filterConfig[EFilterType.Flags];

            if (flags) {
                for (const key in flags) {

                    // If null we should exclude data with such flag
                    // If true we should exclude data without such flag
                    // If false - flag not set
                    if ((flags[key] === null && data[key]) || (flags[key] && !data[key])) {
                        return;
                    }
                }
            }

            return true;
        });

        const order = filterConfig[EFilterType.Order];

        if(order.by) {
            const prop = order.by[0]
            const direction = order.direction ?? EOrderDirection.Ascending;

            filtered = filtered.sort((a, b) => {
                // For undefined values we should put them at the end or at the beginning
                if (a[prop] === undefined) return direction === EOrderDirection.Ascending ? -1 : 1;
                if (b[prop] === undefined) return direction === EOrderDirection.Ascending ? 1 : -1;

                if (a[prop] > b[prop]) {
                    return direction === 0 ? 1 : -1;
                }
                if (a[prop] < b[prop]) {
                    return direction === 0 ? -1 : 1;
                }
                return 0;
            })
        }
        return filtered
    })

    useEffect(() => {
        state.proxy.addMiddleware(filter);

        return () => {
            state.proxy.removeMiddleware(filter);
            state.proxy.dispose();
        };
    }, [source]);

    return {
        proxy: state.proxy,
        collection: state.collection,
        filterConfig,
        callback: () => {
            state.proxy.proxyCallback(state.collection.value);
            if(serializeName) {
                saveRef.current()
            }
        }
    };
};