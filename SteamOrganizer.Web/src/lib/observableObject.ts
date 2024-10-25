import {EventEmitter} from "@/lib/eventEmitter.ts";

export class ObservableObject<T> {
    private subscribers: EventEmitter<T | undefined> = new EventEmitter<T>()

    // Original value
    public value: T | undefined;

    public constructor(object: T) {
        this.value = object
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
    public mutate(mutation: (value: T) => T | void, overrideOrigin: boolean = false) {
        const newValue = mutation(this.value)
        if(!newValue) {
            this.subscribers.emit(this.value)
            return
        }
        if(overrideOrigin) {
            this.value = newValue;
        }

        this.subscribers.emit(newValue)
    }

    public set(newValue: T) {
        this.value = newValue;
        this.subscribers.emit(newValue)
    }
}