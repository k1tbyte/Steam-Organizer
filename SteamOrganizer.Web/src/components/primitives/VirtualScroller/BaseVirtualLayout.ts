import {Dispatch, SetStateAction} from "react";
import {Observer} from "@/lib/observer/observer.ts";

export abstract class BaseVirtualLayout {
    protected readonly chunkSetter: Dispatch<SetStateAction<number[]>>;
    protected readonly scroller: HTMLElement;
    protected readonly observer: Observer<ArrayLike<any>>;
    protected readonly sizer: HTMLDivElement;
    protected readonly layout: HTMLDivElement;
    public isInitialized: boolean = false;
    public collection: ArrayLike<any>;

    startRow: number = 0;
    rowHeight: number = 0;
    offsetIndex: number = 0;
    limit: number = 0;
    timer: number = 0;

    public constructor(observer: Observer<ArrayLike<any>>,
                          chunkSetter: Dispatch<SetStateAction<number[]>>,
                          scroller: HTMLElement,
                          sizer: HTMLDivElement,
                          layout: HTMLDivElement) {

        this.collection = observer.value;
        this.chunkSetter = chunkSetter;
        this.scroller = scroller;
        this.observer = observer;
        this.sizer = sizer;
        this.layout = layout;
        observer.onChanged(this.onChangedCallback)
    }

    protected onChangedCallback = (data: ArrayLike<any>) => {
        this.collection = data
        this.refresh()
    }

    public abstract render() : void;
    public abstract refresh(reset?: boolean) : void;
    public dispose()
    {
        this.observer.unsubscribe(this.onChangedCallback)
    }
}