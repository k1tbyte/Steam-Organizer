import {FC, ReactNode, useEffect, useRef, useState} from "react";

interface IGridProps {
    rowHeight: number;
    columns: number;
    limit: number;
    renderIndex: number;
    timer: number;
    startRow: number;
    scrollPercent: number;
}

interface IVirtualScrollerProps {
    count: number;
    renderElement: (id: number) => ReactNode;
}

const VirtualScroller: FC<IVirtualScrollerProps> = ({ count, renderElement }) => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const areaRef = useRef<HTMLDivElement>(null);
    const dummyRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<IGridProps>({} as IGridProps);
    const grid = gridRef.current
    const padding = grid.rowHeight * grid.startRow

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
        //Считаем количество сколько помещается рядов на экране
        const visibleRows =Math.ceil(scrollerRef.current!.clientHeight / grid.rowHeight);
        // Считаем стартовый индекс ряда
        grid.startRow = Math.floor(scrollerRef.current!.scrollTop / grid.rowHeight)
        const renderIndex = Math.max(grid.startRow * grid.columns, 0);

        const endIndex = Math.min(
            ((grid.startRow + 1) * grid.columns) + (grid.columns * visibleRows),
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
                dummyRef.current!.style.height = `${count / grid.columns * grid.rowHeight}px`;
                scrollerRef.current!.scrollTop = Math.ceil(grid.scrollPercent / 100 * dummyRef.current!.clientHeight)
                render()
                grid.timer = 0;
            },30)
        }).observe(scrollerRef.current!)
    },[])

    return (
        <div ref={scrollerRef}
             className="relative h-full overflow-auto my-2" onScroll={() => {
            if(grid.timer) {
                return
            }
            grid.scrollPercent = Math.ceil(scrollerRef.current!.scrollTop / dummyRef.current!.clientHeight * 100)
            render()
        }}>

            <div ref={dummyRef} className="w-full">
                <div ref={areaRef} style={{
                    top: `-${padding + grid.rowHeight}px`,
                    paddingTop: `${padding}px`
                }}
                     className="grid sticky grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2">
                    {visibleItems.map((i) =>
                        renderElement(i)
                    )}
                </div>
            </div>
        </div>
    );
};

export default VirtualScroller;