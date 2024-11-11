import {BaseVirtualLayout} from "@/components/primitives/VirtualScroller/BaseVirtualLayout.ts";

export class StackLayout extends BaseVirtualLayout {

    public isInitialized: boolean = true;

    public render() {
        this.rowHeight = 200;
        this.startRow = Math.floor(this.scroller.scrollTop / this.rowHeight)
        const visibleRows =Math.ceil(this.scroller.clientHeight / this.rowHeight);
        const endIndex = Math.min(this.startRow + visibleRows, this.collection.length);
        const limitCount = endIndex - this.startRow;

        this.chunkSetter(Array.from({ length: limitCount },
            (_,i) => i + this.startRow));
    }

    public refresh() {
        this.render()
    }

}