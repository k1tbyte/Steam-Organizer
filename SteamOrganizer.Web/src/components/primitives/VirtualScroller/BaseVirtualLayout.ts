import {Dispatch, SetStateAction} from "react";

export abstract class BaseVirtualLayout {
    protected readonly chunkSetter: Dispatch<SetStateAction<number[]>>;
    protected readonly scroller: HTMLElement;
    protected readonly collection: ArrayLike<any>;
    protected readonly sizer: HTMLDivElement;
    protected readonly layout: HTMLDivElement;

    startRow: number = 0;
    rowHeight: number = 0;
    offsetIndex: number = 0;
    limit: number = 0;
    timer: number = 0;

    public constructor(collection: ArrayLike<any>,
                          chunkSetter: Dispatch<SetStateAction<number[]>>,
                          scroller: HTMLElement,
                          sizer: HTMLDivElement,
                          layout: HTMLDivElement) {
        this.chunkSetter = chunkSetter;
        this.scroller = scroller;
        this.collection = collection;
        this.sizer = sizer;
        this.layout = layout;
    }

    public abstract render() : void;
    public abstract refresh(reset?: boolean) : void;
}