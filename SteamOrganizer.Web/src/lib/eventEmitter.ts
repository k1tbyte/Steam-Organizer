export class EventEmitter<T> {
    private listeners: Array<(data: T) => void> = new Array<(data: T) => void>();

    subscribe(listener: (data: T) => void): void {
        this.listeners.push(listener);
    }

    unsubscribe(listener: (data: T) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    emit(data: T): void {
        this.listeners.forEach(listener => listener(data));
    }
}