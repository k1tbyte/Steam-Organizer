import {Observer} from "./observer";

export type ObservableCollection<T> = ObservableObject<T[]>

export class ObservableObject<T> extends Observer<T> {
    public constructor(object: T) {
        super()
        this.value = object
    }

    public mutate(mutation?: (value: T) => any) {
        mutation?.(this.value)
        this.subscribers.emit(this.value)
    }

    public set(newValue: T) {
        this.value = newValue;
        this.subscribers.emit(newValue)
    }
}