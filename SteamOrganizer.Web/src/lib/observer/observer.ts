import {EventEmitter} from "./eventEmitter.ts";

export abstract class Observer<T> {
    // Original value
    public value: T | undefined;

    protected subscribers: EventEmitter<T | undefined> = new EventEmitter<T>()

    public onChanged(callback: (newData: T) => void) {
        this.subscribers.subscribe(callback)
    }

    public unsubscribe(callback: (data: T) => void) {
        this.subscribers.unsubscribe(callback)
    }
}