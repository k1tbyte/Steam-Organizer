import {FC, ReactNode, useEffect, useRef, useState} from "react";
import {useScrollbar} from "@/hooks/useScrollbar.ts";

interface IGridProps {
    rowHeight: number;
    columns: number;
    limit: number;
    renderIndex: number;
    timer: number;
    startRow: number;
    scrollPercent: number;
    isLoaded: boolean;
}

interface IVirtualScrollerProps {
    count: number;
    renderElement: (id: number) => ReactNode;
}

const VirtualScroller: FC<IVirtualScrollerProps> = ({ count, renderElement }) => {
    const areaRef = useRef<HTMLDivElement>(null!);
    const sizerRef = useRef<HTMLDivElement>(null!);
    const gridRef = useRef<IGridProps>({} as IGridProps);
    const {hostRef, scrollRef} = useScrollbar({
        scroll: () => {
            grid.scrollPercent = Math.ceil(scrollRef.current!.scrollTop / sizerRef.current.clientHeight * 100)
            render()
        }
    });

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
        const visibleRows =Math.ceil(scrollRef.current!.clientHeight / grid.rowHeight);
        // Считаем стартовый индекс ряда
        grid.startRow = Math.floor(scrollRef.current!.scrollTop / grid.rowHeight)
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
            clearTimeout(grid.timer)
            grid.timer = setTimeout(() => {
                calculateSizes()
                sizerRef.current!.style.height = `${count / grid.columns * grid.rowHeight}px`;
                scrollRef.current!.scrollTop = Math.ceil(grid.scrollPercent / 100 * sizerRef.current!.clientHeight)
                render()
                grid.timer = 0;
            },30)
        }).observe(sizerRef.current!)
        grid.isLoaded = true
    },[])

    return (
        <div ref={hostRef} className="my-2">
            <div ref={sizerRef} className="w-full">
                <div ref={areaRef} style={{
                    top: `-${padding + grid.rowHeight}px`,
                    paddingTop: `${padding}px`,
                    opacity: grid.isLoaded ? 1 : 0
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