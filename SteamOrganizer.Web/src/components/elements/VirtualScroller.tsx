import {FC, ReactNode, useEffect, useRef, useState} from "react";

interface IGridProps {
    rowHeight: number;
    columns: number;
    limit: number;
    renderIndex: number;
    visibleIndex: number;
    timer: number;
    startRow: number;
    preventScrolling: boolean;
}

interface IVirtualScrollerProps {
    count: number;
    renderElement: (id: number) => ReactNode;
}

let scrollPercent = 0;
const VirtualScroller: FC<IVirtualScrollerProps> = ({ count, renderElement }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const areaRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<IGridProps>({} as IGridProps);
    const grid = gridRef.current

    const [startIndex, setStartIndex] = useState(0);
    const [limit,setLimit] = useState(1);
    const visibleItems = Array.from({ length: limit }, (_,i) => i + startIndex);

    const calculateSizes = () => {
        const gridStyles = window.getComputedStyle(areaRef.current!);

        const columnGap = parseFloat(gridStyles.getPropertyValue('grid-column-gap'));
        const rowGap = parseFloat(gridStyles.getPropertyValue('grid-row-gap'));
        const columnWidth = parseFloat(
            gridStyles.getPropertyValue('grid-template-columns').match(/[\d.]+/)![0]
        ) + columnGap;
        grid.rowHeight = parseFloat(
            gridStyles.getPropertyValue('grid-template-rows').match(/[\d.]+/)![0]
        ) + rowGap;

        grid.columns =  Math.ceil(areaRef.current!.clientWidth / columnWidth);
    }

    const render = () => {
        const overscan = 0;

        //Считаем количество сколько помещается рядов на экране
        const visibleRows =Math.ceil(scrollerRef.current!.clientHeight / grid.rowHeight) + 1;
        // Считаем стартовый индекс ряда
        grid.startRow = Math.floor(scrollerRef.current!.scrollTop / grid.rowHeight)
        grid.visibleIndex = grid.startRow * grid.columns;
        const renderIndex = Math.max(grid.visibleIndex - (overscan * grid.columns), 0);

        const endIndex = Math.min(
            ((grid.startRow + overscan + 1) * grid.columns) + (grid.columns * visibleRows),
            count
        );
        const limitCount = endIndex - renderIndex;

        if(limitCount === grid.limit && renderIndex === grid.renderIndex) {
            return;
        }

        setLimit(grid.limit = limitCount)
        setStartIndex(grid.renderIndex = renderIndex);
    }

    useEffect(() => {
        new ResizeObserver(() => {
            if(!areaRef?.current) {
                return;
            }

            clearTimeout(grid.timer)
            grid.timer = setTimeout(() => {
                calculateSizes()
                areaRef.current!.style.height = `${count / grid.columns * grid.rowHeight}px`;

                scrollerRef.current!.scrollTop = Math.ceil(scrollPercent / 100 * areaRef.current!.clientHeight)
                render()
                grid.preventScrolling = true;
            },10)
        }).observe(scrollerRef.current!)
    },[])


    return (
        <div className="overflow-auto mt-2"  onScroll={() => {
            if(grid.preventScrolling) {
                grid.preventScrolling = false;
                return
            }
            scrollPercent = Math.ceil(scrollerRef.current!.scrollTop / areaRef.current!.clientHeight*100)
            render()
        }} ref={scrollerRef}>
            <div ref={areaRef} style={{paddingTop: `${grid.startRow * grid.rowHeight}px`}}
                 className="grid  content-start grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2">
                {visibleItems.map((i) =>
                    renderElement(i)
                )}
            </div>
        </div>
    );
};

export default VirtualScroller;