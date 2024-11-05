import { BaseVirtualLayout } from "./BaseVirtualLayout.ts";

export class GridLayout extends BaseVirtualLayout {
    public columns: number = NaN;
    private timer: number = 0;
    private resizeObserver: ResizeObserver;

    public constructor(...args: ConstructorParameters<typeof BaseVirtualLayout>) {
        super(...args);

        this.resizeObserver = new ResizeObserver(() => {
            clearTimeout(this.timer)
            this.timer = setTimeout(() => {
                this.refresh(false)
                this.timer = 0;
            },30)
        });
        this.resizeObserver.observe(this.sizer)
    }

    public override dispose() {
        super.dispose()
        this.resizeObserver.disconnect()
    }

    private calculateSizes() {
        const gridStyles = window.getComputedStyle(this.layout);

        const row = gridStyles.getPropertyValue('grid-template-rows').match(/[\d.]+/)?.[0];
        const col = gridStyles.getPropertyValue('grid-template-columns').match(/[\d.]+/)?.[0];
        if(!row || !col) {
            return
        }
        const columnGap = parseFloat(gridStyles.getPropertyValue('grid-column-gap'));
        const rowGap = parseFloat(gridStyles.getPropertyValue('grid-row-gap'));
        const columnWidth = parseFloat(col) + columnGap;
        this.rowHeight = parseFloat(row) + rowGap;
        this.columns =  Math.ceil(this.layout.clientWidth / columnWidth);

        if(!this.isInitialized) {
            this.isInitialized = true;
        }
    }

    public render() {
        if(!this.isInitialized) {
            if(this.collection?.length > 0) {
                this.chunkSetter([0])
            }
            return
        }
        const visibleRows =Math.ceil(this.scroller.clientHeight / this.rowHeight);
        this.startRow = Math.floor(this.scroller.scrollTop / this.rowHeight)
        const renderIndex = Math.max(this.startRow * this.columns, 0);

        const endIndex = Math.min(
            ((this.startRow + 1) * this.columns) + (this.columns * visibleRows),
            this.collection.length
        );
        const limitCount = endIndex - renderIndex;

        if(isNaN(limitCount) || (renderIndex === this.offsetIndex && limitCount === this.limit)) {
            return;
        }
        this.limit = limitCount;
        this.offsetIndex = renderIndex
        this.chunkSetter(Array.from({ length: limitCount },
            (_,i) => i + renderIndex));
    }

    public refresh (reset: boolean = true) {

        if(reset) {
            this.offsetIndex = -1;
        }

        this.calculateSizes()
        const height = this.collection?.length / this.columns * this.rowHeight;
        this.sizer.style.height = height ? `${height}px` : null;
        this.render()
    }
}