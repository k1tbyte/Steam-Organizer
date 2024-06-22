import {EventEmitter} from "@/lib/eventEmitter.ts";

export class ObservableObject<T> {
    private subscribers: EventEmitter<T> = new EventEmitter<T>()

    // Original data
    public data: T;

    public constructor(object: T) {
        this.data = object
    }

    public onChanged(callback: (newData: T) => void) {
        this.subscribers.subscribe(callback)
    }

    public unsubscribe(callback: (data: T) => void) {
        this.subscribers.unsubscribe(callback)
    }

    /**
     * Mutation of an object with notification to subscribers.
     * By default, it does not overwrite the object. for example, we just need to notify about changes in filtering
     * and leave the original collection without filtering for restoring.
     * @param mutation A function that returns a new object or nothing (if the current value is mutated)
     * @param overrideOrigin Set to true if you want to overwrite the original object
     */
    public mutate(mutation: (data: T) => T | void, overrideOrigin: boolean = false) {
        const newData = mutation(this.data)
        if(!newData) {
            this.subscribers.emit(this.data)
            return
        }
        if(overrideOrigin) {
            this.data = newData;
        }

        this.subscribers.emit(newData)
    }

    public set(data: T) {
        this.data = data;
        this.subscribers.emit(data)
    }
}