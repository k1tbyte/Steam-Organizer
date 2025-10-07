import React, {
    Dispatch,
    FC,
    MutableRefObject,
    ReactElement,
    SetStateAction,
    useEffect,
    useRef,
    useState
} from "react";
import {useScrollbar} from "@/shared/hooks/useScrollbar";
import {BaseVirtualLayout} from "./BaseVirtualLayout";
import {Observer} from "@/shared/lib/observer/observer";
import clsx from "clsx";

export type ScrollerInitializer = (MutableRefObject<HTMLElement>) | ((onScroll: () => void) => HTMLElement);
type RenderFunction<T> = (object: T, index: number, mediaMatch?: boolean) => ReactElement;

interface IVirtualListProps<T> {
    collection: Observer<T[]>;
    layout: typeof BaseVirtualLayout;
    onRenderElement: RenderFunction<T>;
    scroller?: ScrollerInitializer;
    className?: string;
    scrollerClassName?: string;
    withDragMoving?: boolean;
    emptyIndicator?: ReactElement | (() => ReactElement),
    onSizeChanging?: (height: number) => boolean;
}

interface IVirtualGeneratorProps {
    data: ArrayLike<any>;
    onRenderElement: RenderFunction<any>;
    setRef: MutableRefObject<Dispatch<SetStateAction<number[]>>>;
    layoutRef: MutableRefObject<BaseVirtualLayout>;
}

const VirtualGenerator: FC<IVirtualGeneratorProps> = ({ data, onRenderElement,setRef, layoutRef  }) => {
    const [items, setItems] = useState<number[]>(data?.length ? [0] : [])

    useEffect(() => {
        setRef.current = setItems
    }, []);

    if(layoutRef.current?.isScrollAsync === false) {
        layoutRef.current.updateScrollPadding()
    }

    return (
        items.map((i) => onRenderElement(layoutRef.current ? layoutRef.current.source[i] : data![i], i))
    )
}

const ListIndicator: FC<{ setRef: MutableRefObject<Dispatch<SetStateAction<ReactElement>>>, value?: ReactElement }>
    = ({ value,  setRef }) => {
    const [indicator, setIndicator] = useState<ReactElement>(value);
    setRef.current = setIndicator;
    return indicator;
}

const getScrollElement = (scroller: ScrollerInitializer, onRender: () => void): HTMLElement => {
    if (scroller instanceof Function) {
        return scroller(onRender);
    } else {
        scroller.current.addEventListener("scroll", onRender);
        return scroller.current;
    }
};

export const VirtualScroller = <T,>({
                                        collection, layout, scroller,
                                        className, onRenderElement, withDragMoving,
                                        emptyIndicator, scrollerClassName,
                                        onSizeChanging
                                    }: IVirtualListProps<T>) => {
    const [initialized, setInitialized] = useState(collection.value?.length);
    const layoutRef = useRef<BaseVirtualLayout>(null!);
    const sizerRef = useRef<HTMLDivElement>(null!);
    const listRef = useRef<HTMLDivElement>(null!);
    const setIndicator = useRef<Dispatch<SetStateAction<ReactElement>>>(null!);
    const chunkSetter = useRef<Dispatch<SetStateAction<number[]>>>(null!);

    let info = layoutRef.current!

    const {scrollRef, hostRef} = useScrollbar({scroll: () => info.render()});

    useEffect(() => {
        const updateIndicator = () => setIndicator.current(collection.value?.length ? null :
            emptyIndicator instanceof Function ? emptyIndicator() : emptyIndicator);

        const onRender = () => layoutRef.current?.render()
        const onCollectionChanged = (data: ArrayLike<any>) => {
            info.source = data ?? info.source;

            setInitialized((prevInitialized) => {
                updateIndicator()
                if (!prevInitialized && collection.value?.length) {
                    chunkSetter.current([0]);
                    return 1;
                }
                info.refresh(true);
                return prevInitialized;
            });
        };

        let timer = 0;
        const resizeObserver = new ResizeObserver(() => {
            clearTimeout(timer)
            timer = window.setTimeout(() => {
                const reset = onSizeChanging ? onSizeChanging(sizerRef.current.clientHeight) : false;
                info.refresh(reset)
                timer = 0;
            }, 30)
        });

        let scrollElement: HTMLElement = scroller ? getScrollElement(scroller, onRender) : scrollRef.current!;

        if(withDragMoving) {
            scrollElement.setAttribute("drag-scroller","");
        }

        // @ts-ignore - We are sure that layout is not abstract
        info = layoutRef.current = new layout(collection.value, chunkSetter.current,
            scrollElement, sizerRef.current, listRef.current)

        collection.onChanged(onCollectionChanged)
        resizeObserver.observe(sizerRef.current)
        updateIndicator()

        return () => {
            if (typeof scroller !== "function") {
                scroller?.current.removeEventListener("scroll", onRender);
            }
            collection.unsubscribe(onCollectionChanged);
            resizeObserver.disconnect()
        }
    }, [])

    useEffect(() => {
        if (initialized) {
            info.refresh()
            listRef.current.style.opacity = null;
        }
    }, [initialized])

    const list =
        <div ref={sizerRef} className={clsx("h-full relative")} virtual-wrapper="">
            <div ref={listRef} style={{ opacity: 0 }}
                 className={"sticky " + (className || "")}>
                <VirtualGenerator layoutRef={layoutRef}
                                  data={info ? info.source : collection.value}
                                  onRenderElement={onRenderElement} setRef={chunkSetter}/>
            </div>
            <ListIndicator setRef={setIndicator}/>
        </div>

    return scroller ? list :
        <div ref={hostRef} className={clsx("h-full", scrollerClassName)}>{list}</div>
}