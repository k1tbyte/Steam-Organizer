import {Dispatch, SetStateAction} from "react";

export abstract class BaseVirtualLayout {
    protected readonly scroller: HTMLElement;
    protected readonly sizer: HTMLDivElement;
    protected readonly list: HTMLDivElement;
    protected readonly chunkSetter: Dispatch<SetStateAction<number[]>>;

    lastScrollTop: number = 0;
    lastScrollTime: number = 0;
    public isScrollAsync: boolean = false;

    public source: ArrayLike<any>;
    public limit: number = 0;

    startRow: number = 0;
    offsetIndex: number = 0;
    offsetBefore: number = 0;

    rowGap: number = 0;
    rowHeight: number = 0;

    colGap: number = 0;
    colWidth: number = 0;

    public constructor(source: ArrayLike<any>, chunkSetter: Dispatch<SetStateAction<number[]>>,
                       scroller: HTMLElement, sizer: HTMLDivElement, list: HTMLDivElement)
    {
        this.chunkSetter = chunkSetter;
        this.scroller = scroller;
        this.source = source;
        this.sizer = sizer;
        this.list = list;
    }

    protected abstract getSizerHeight(): number;
    public abstract render(): void;

    private getElementHeight(element?: HTMLElement) {
        if (!element) {
            return 0;
        }

        const style = window.getComputedStyle(element);
        return element.offsetHeight +
            (parseFloat(style.marginTop) || 0) +
            (parseFloat(style.marginBottom) || 0);
    }

    protected calculateSizes() {
        this.offsetBefore = 0
/*        let element: HTMLElement | null = this.scroller.querySelector(`[virtual-wrapper]`);
        while (element && element !== this.scroller) {
            let sibling = element.previousElementSibling;
            while (sibling) {
                if (sibling instanceof HTMLElement) {
                    const style = window.getComputedStyle(sibling);
                    this.offsetBefore += sibling.offsetHeight +
                        parseFloat(style.marginTop) +
                        parseFloat(style.marginBottom);
                }
                sibling = sibling.previousElementSibling;
            }
            element = element.parentElement;
        }*/

        const wrapperTop = this.scroller.querySelector(`[virtual-wrapper]`)?.getBoundingClientRect().top || 0;
        const headerSize = this.getElementHeight(this.scroller.querySelector(`[virtual-header]`) as HTMLElement);
        const scrollerTop = this.scroller.getBoundingClientRect().top;
        this.offsetBefore = wrapperTop - scrollerTop + this.scroller.scrollTop + headerSize;
        console.log(wrapperTop, scrollerTop, this.offsetBefore)

        const sample = this.list.children[0] as HTMLElement;

        const cellStyle = window.getComputedStyle(sample);
        const listStyle = window.getComputedStyle(this.list);

        const gap = listStyle.gap.indexOf(" ") > -1 ? null : listStyle.gap;

        this.rowGap =  parseFloat(gap || listStyle.rowGap) || 0;
        this.rowHeight = this.getElementHeight(sample) + this.rowGap

        this.colGap = parseFloat(gap || listStyle.columnGap) || 0;
        this.colWidth = sample.clientWidth +
            this.colGap +
            (parseFloat(cellStyle.borderLeftWidth) || 0) +
            (parseFloat(cellStyle.borderRightWidth) || 0) +
            (parseFloat(cellStyle.marginLeft) || 0) +
            (parseFloat(cellStyle.marginRight) || 0);
    }

    protected calculateSpeed() {
        const now = performance.now();
        const currentScrollTop = this.scroller.scrollTop;

        // Calculating speed: distance over time
        if (this.lastScrollTime !== 0) {
            const timeDiff = now - this.lastScrollTime;
            const scrollDiff = Math.abs(currentScrollTop - this.lastScrollTop);
            this.isScrollAsync = (scrollDiff / timeDiff) > 2.5; // px/ms
        }

        this.lastScrollTop = currentScrollTop;
        this.lastScrollTime = now;
    }

    public updateScrollPadding() {
        const padding = Math.max(this.startRow * this.rowHeight, 0);
        this.list.style.paddingTop = `${padding}px`
        this.list.style.top = `-${padding + this.rowHeight}px`
    }

    protected  renderDefault(getRenderIndex: () => number, getEndIndex: (visibleRows: number) => number) {
        if(!this.rowHeight)  {
            return;
        }

        this.calculateSpeed()
        const scrollTop = this.scroller.scrollTop - this.offsetBefore;
        const visibleRows = Math.ceil(
            (this.scroller.clientHeight) /
            this.rowHeight) + 1;
        this.startRow = Math.floor(scrollTop / this.rowHeight)

        const renderIndex = Math.max(getRenderIndex(), 0);
        const endIndex = Math.min(getEndIndex(visibleRows), this.source.length);
        let limitCount = Math.max(endIndex - renderIndex, this.source.length ? 1 : 0);

        if(isNaN(limitCount) || (this.limit === limitCount && this.offsetIndex === renderIndex)) {
            return;
        }

        this.limit = limitCount
        this.offsetIndex = renderIndex;
        this.chunkSetter(Array.from({length: limitCount}, (_, i) => i + renderIndex))

        if(this.isScrollAsync) {
            this.updateScrollPadding()
        }
    }

    public refresh(reset?: boolean) {
        if(reset) {
            this.offsetIndex = -1;
        }
        if(this.list?.children.length) {
            this.calculateSizes()
        }
        if(!this.rowHeight) {
            return;
        }

        const height = this.getSizerHeight();
        this.sizer.style.height = height > 0 ? `${height}px` : null;
        this.updateScrollPadding()
        this.render()
    }
}