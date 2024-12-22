import {useState, useEffect, type Dispatch, type SetStateAction} from 'react';
import {debounce} from "@/shared/lib/utils.ts";

export class RxStore<T> {
    public readonly store: T = {} as T;
    private listeners = new Map<string,  Dispatch<SetStateAction<never>>[]>();
    public readonly serialize: (() => void) | null = null;

    constructor(defaultValue?: T, serializeName?: string) {
        if(serializeName) {
            const serialized = localStorage.getItem(serializeName);
            if(serialized) {
                defaultValue = JSON.parse(serialized);
            }

            this.serialize = debounce(() => localStorage.setItem(serializeName, JSON.stringify(this.store)), 2000)
        }

        this.store = defaultValue ?? {} as T;
    }

    public emit<V>(key: string, value: SetStateAction<V>, serialize = true) {
        const prev = this.store[key];
        if(prev === value) {
            return;
        }

        // @ts-ignore
        value = typeof value === "function" ? value(prev) : value;
        // @ts-ignore
        this.listeners.get(key)?.forEach((listener) => listener(value));
        this.store[key] = value

        if(this.serialize && serialize) {
            this.serialize()
        }
    }

    public getEmitter<V>(key: string): Dispatch<SetStateAction<V>> {
        return (value) => this.emit(key, value);
    }

    public set<V>(key: string, listener: Dispatch<SetStateAction<V>>) {
        const selector = (this.listeners.get(key) || [])
        selector.push(listener as Dispatch<SetStateAction<never>>);
        this.listeners.set(key, selector);
    }

    public remove<V>(key: string, listener: Dispatch<SetStateAction<V>>) {
        const selector = (this.listeners.get(key) || [])
        selector.splice(selector.indexOf(listener as Dispatch<SetStateAction<never>>), 1);
        this.listeners.set(key, selector);
    }
}

export const useStoreState = <S,T> (store: RxStore<S>, key: string):
    [state: T, value:  (value: SetStateAction<T>, serialize?: boolean) => void] => {
    const [state, setState] = useState<T>(store.store[key]);

    useEffect(() => {
        store.set(key, setState)
        return () => store.remove(key, setState)
    }, [key]);

    return [state, (value, serialize = true) => {
        store.emit(key, value, serialize);
    }];
}