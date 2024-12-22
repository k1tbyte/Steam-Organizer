import {ObservableCollection, ObservableObject} from "@/shared/lib/observer/observableObject.ts";
import {useEffect, useRef, useState} from "react";
import {ObservableProxy} from "@/shared/lib/observer/observableProxy.ts";

/*
export const useProxyFilter = <T> (
    proxy?: ObservableProxy<T[]>,
    collection?: ObservableCollection<T>): [ applyFilter: (filter: (data: T[]) => T[]) => void, original: ObservableCollection<T>, proxy: ObservableProxy<T[]> ] =>
{
    const filterRef = useRef<(data: T[]) => T[]>();
    const [collectionObserver] = useState(proxy?.observer || collection || new ObservableObject<T[]>(undefined));
    const [proxyObserver] = useState(proxy || new ObservableProxy(collectionObserver));
    useEffect(() => {
        const callback = (e: T[]) => filterRef.current(e)
        proxyObserver.addMiddleware(callback);

        return () => {
            proxyObserver.removeMiddleware(callback);
            proxyObserver.dispose()
        }
    }, [collection, proxy]);
    return [(filter) => {
        filterRef.current = filter
        proxyObserver.proxyCallback(collectionObserver.value);
    }, collectionObserver, proxyObserver]
}*/

export type FilterFunction<T> = (data: T[]) => T[];

export const useProxyFilter = <T>(
    source?: ObservableProxy<T[]> | ObservableCollection<T>
) => {
    const [state] = useState(() => {
        const collection = (source instanceof ObservableProxy ? source.observer : source) || new ObservableObject<T[]>(undefined);
        const proxy = source instanceof ObservableProxy ? source : new ObservableProxy(collection);
        return { collection, proxy };
    });

    const filterRef = useRef<(data: T[]) => T[]>();

    useEffect(() => {
        const callback = (data: T[]) => filterRef.current?.(data);
        state.proxy.addMiddleware(callback);

        return () => {
            state.proxy.removeMiddleware(callback);
            state.proxy.dispose();
        };
    }, [state.proxy]);

    const applyFilter = (filter: FilterFunction<T>) => {
        filterRef.current = filter;
        state.proxy.proxyCallback(state.collection.value);
    };

    return [applyFilter,state.proxy, state.collection, ] as const;
};