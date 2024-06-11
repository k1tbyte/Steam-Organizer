import {FC, ReactElement, ReactNode, useEffect, useRef, useState} from "react";
import {useScrollbar} from "@/hooks/useScrollbar.ts";
import {BaseVirtualLayout} from "./BaseVirtualLayout.ts";
import Ref from "@/types/ref.ts";

interface IVirtualScrollerProps {
    className?: string;
    collection: ArrayLike<any>;
    renderElement: (id: number) => ReactNode;
    layout: typeof BaseVirtualLayout,
    gridRef: Ref<BaseVirtualLayout>,
    emptyIndicator?: ReactElement
}

const VirtualScroller: FC<IVirtualScrollerProps> = ({   collection, renderElement,
                                                        layout, className,
                                                        gridRef, emptyIndicator
}) => {
    const [items, setItems] = useState<number[]>(collection.length ? [0] : [])
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

        // @ts-ignore
        layoutRef.current =  new layout(collection, setItems,
            scrollRef.current!, sizerRef.current, areaRef.current)
        gridRef.payload = layoutRef.current
        observer.observe(sizerRef.current!)

        return () => {
            gridRef.payload = undefined
            observer.disconnect();
        }
    },[])

    let padding = 0, top = 0, opacity =0;

    if(layoutRef.current) {
        const layout = layoutRef.current;
        padding = layout.rowHeight * layout?.startRow;
        top = padding + layout.rowHeight;
        opacity = 1;
    }

    return (
        <div ref={hostRef} className="my-2 h-full">
            <div ref={sizerRef} className="w-full">
                <div ref={areaRef} style={{
                    top: `-${top}px`,
                    paddingTop: `${padding}px`,
                    opacity: opacity
                }}
                     className={"sticky " + className}>
                    {items.map((i) =>
                        renderElement(i)
                    )}
                </div>
                { collection.length === 0 &&  emptyIndicator}
            </div>
        </div>
    );
};

export default VirtualScroller;