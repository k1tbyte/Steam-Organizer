import {Observer} from "./observer";
import {ObservableObject} from "@/shared/lib/observer/observableObject";

export class ObservableProxy<T> extends Observer<T> {
    private middleware: Array<(data: T) => T> = [];

    public readonly observer: ObservableObject<T>;

    constructor(observer: ObservableObject<T>) {
        super();
        this.observer = observer
        this.value = observer.value
        observer.onChanged((newData) => {
            this.value = newData;
            this.proxyCallback(newData)
        })
    }

    public proxyCallback = (data: T) => {
        for(const middleware of this.middleware) {
            data = middleware(data)
        }

        this.value = data
        this.subscribers.emit(data)
    }

    public addMiddleware(middleware: (data: T) => T) {
        this.middleware.push(middleware);
    }

    public removeMiddleware(middleware: (data: T) => T) {
        const index = this.middleware.indexOf(middleware);
        if (index > -1) {
            this.middleware.splice(index, 1);
        }
    }

    public dispose() {
        this.observer.unsubscribe(this.proxyCallback)
    }
}