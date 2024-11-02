import React, {FC, ReactElement, ReactNode, useEffect, useRef, useState} from "react";
import {useScrollbar} from "@/hooks/useScrollbar.ts";
import {BaseVirtualLayout} from "./BaseVirtualLayout.ts";
import {Observer} from "@/lib/observer/observer.ts";

interface IVirtualScrollerProps {
    className?: string;
    collection: Observer<any[]>;
    renderElement: (object: any, index: number) => ReactNode;
    layout: typeof BaseVirtualLayout,
    emptyIndicator?: ReactElement
    useDragMoving?: boolean
}

const VirtualScroller: FC<IVirtualScrollerProps> = (
    {
        collection,
        renderElement,
        layout,
        className,
        emptyIndicator,
        useDragMoving
}) => {
    const [items, setItems] = useState<number[]>([])
    const areaRef = useRef<HTMLDivElement>(null!);
    const sizerRef = useRef<HTMLDivElement>(null!);
    const layoutRef = useRef<BaseVirtualLayout>();

    const {hostRef, scrollRef} = useScrollbar({
        scroll: () => layoutRef.current!.render()
    });

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            clearTimeout(layoutRef.current!.timer)
            layoutRef.current!.timer = setTimeout(() => {
                layoutRef.current!.refresh(false)
                layoutRef.current!.timer = 0;
            },30)
        });

        if(useDragMoving) {
            scrollRef.current.setAttribute("drag-scroller","");
        }

        // @ts-ignore - We are sure that layout is not abstract
        layoutRef.current =  new layout(collection, setItems,
            scrollRef.current!, sizerRef.current, areaRef.current)
        observer.observe(sizerRef.current!)

        return () => {
            observer.disconnect();
            layoutRef.current?.dispose()
        }
    },[])

    useEffect(() => {
        if(!layoutRef.current.isInitialized) {
            layoutRef.current.refresh()
        }
    },[items])

    let padding = 0, top = 0, opacity = 0;

    if(layoutRef.current) {
        const layout = layoutRef.current;
        padding = layout.rowHeight * layout?.startRow;
        top = padding + layout.rowHeight;

        if(layout.isInitialized) {
            opacity = 1;
        }
    }


    return (
        <div ref={hostRef} className="my-2 h-full">
            <div ref={sizerRef} className="h-full relative">
                <div ref={areaRef} style={{
                    top: `-${top}px`,
                    paddingTop: `${padding}px`,
                    opacity: opacity
                }}
                     className={"sticky " + className}>
                    {items.map((i) => {
                            return renderElement(layoutRef.current.collection[i], i);
                        }
                    )}
                </div>
                {collection.value?.length < 1 &&  emptyIndicator}
            </div>
        </div>
    );
};

export default VirtualScroller;