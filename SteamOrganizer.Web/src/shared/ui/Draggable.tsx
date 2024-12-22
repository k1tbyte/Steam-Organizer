import React, {FC, ReactElement, useEffect, useRef} from "react";
import {applyStyles, findParentByAttribute, getEventCords} from "@/shared/lib/utils.ts";

export interface IDraggableContext {
    isEnabled: boolean,
    isDragging: boolean,
    setIsDragging: React.Dispatch<React.SetStateAction<boolean>>,
    infoRef: React.RefObject<IDraggableInfo>
}

export interface IDraggableInfo {
    hoverOn?: HTMLElement;
    original?: HTMLElement;
    thumbnail?: HTMLElement;
    hoverOnIndex?: number;
    draggingIndex?: number;
    isScrolling?: boolean;
    scrollingAllowed?: boolean;
    isScrollToTop?: boolean
    offsetX?: number;
    offsetY?: number;
}

interface IDraggableProps {
    context: IDraggableContext;
    gripRef: React.RefObject<Element>;
    children: ReactElement;
    hoverStyleId: string;
    index: number;
    onDrop?: (from: number, to: number) => boolean | void;
    onOver?: (from: number, to: number) => boolean | void;
}

export const Draggable: FC<IDraggableProps> = (
    {
        context,
        children,
        hoverStyleId,
        gripRef,
        index,
        onDrop,
        onOver
    }) => {
    const ref = useRef<HTMLDivElement>(null);
    const props = context.infoRef.current;
    index = index + 1;

    const onDragStart = (e) => {
        context.setIsDragging(true);
        e.preventDefault();
        const scrollArea = findParentByAttribute(gripRef.current as HTMLElement, "drag-scroller");

        // Calculating threshold values for starting scrolling
        const { top, bottom, height } = scrollArea.getBoundingClientRect();
        const offset = height * 0.05;
        const topBreakpoint = top + offset;
        const bottomBreakpoint = bottom - offset;

        const scrollSmooth = () => {
            if (!props.scrollingAllowed) {
                props.isScrolling = false;
                return;
            }
            scrollArea.scrollBy({ top: props.isScrollToTop ? -8 : 8, behavior: "auto" });

            // Continue scrolling on each frame
            if (props.isScrolling) {
                requestAnimationFrame(scrollSmooth);
            }
        };

        const dragMove = (e) => {
            const element = document.elementFromPoint(e.x, e.y);
            if (!element) return;

            const numberIndex = Number(element.getAttribute("drag-index"));
            props.thumbnail.style.transform = `translate(${e.screenX - props.offsetX}px, ${e.screenY - props.offsetY}px)`

            // Checking for scrolling permission
            props.scrollingAllowed = e.clientY > bottomBreakpoint || e.clientY < topBreakpoint;

            if (!props.isScrolling && props.scrollingAllowed) {
                props.isScrollToTop = e.clientY < topBreakpoint;
                props.isScrolling = true;
                requestAnimationFrame(scrollSmooth);
            }

            if (props.hoverOn && numberIndex !== props.hoverOnIndex) {
                props.hoverOn.id = "";
                props.hoverOnIndex = undefined;
                props.hoverOn = undefined;
            }

            if (!numberIndex || numberIndex === props.hoverOnIndex || numberIndex === index || !onOver?.(props.draggingIndex - 1, numberIndex - 1)) {
                return;
            }

            props.hoverOn = element.children[0] as HTMLElement;
            props.hoverOnIndex = numberIndex;
            props.hoverOn.id = hoverStyleId;
        };

        const onDragEnd = () => {
            if (props.hoverOn) {
                props.hoverOn.id = "";
                if(onDrop?.(props.draggingIndex - 1, props.hoverOnIndex - 1)) {
                    props.original.style.opacity = "1"
                    props.hoverOn.style.opacity = "0"
                    props.original = props.hoverOn
                }
            }

            let delay = 0;
            if (props.original.parentElement) {
                const { left, top } = props.original.getBoundingClientRect();
                applyStyles(props.thumbnail, {
                    transition: "transform 0.3s",
                    transform: `translate(${left}px, ${top}px)`
                });
                delay = 300;
            }

            setTimeout(() => {
                props.original.style.opacity = "";
                document.body.children[0].removeAttribute("style");
                document.body.removeAttribute("style");
                document.getElementById("root").removeChild(props.thumbnail);
                Object.keys(props).forEach(key => delete props[key]);
                context.setIsDragging(false);
            }, delay);

            document.removeEventListener("pointermove", dragMove);
            document.removeEventListener("pointerup", onDragEnd);
        };

        const original = ref.current;
        const [screenX, screenY] = getEventCords(e);
        const { left: startX, top: startY } = original.getBoundingClientRect();

        props.offsetX = screenX - startX;
        props.offsetY = screenY - startY;

        // Clone the draggable element
        const cloned = original.cloneNode(true) as HTMLElement;
        applyStyles(cloned, {
            position: "absolute",
            zIndex: "1000",
            pointerEvents: "none",
            width: `${original.clientWidth}px`,
            height: `${original.clientHeight}px`,
            transform: `translate(${startX}px, ${startY}px)`
        });
        cloned.className = "animate-pulse shadow-2xl";
        document.getElementById("root").appendChild(cloned);

        // Disabling events for body
        applyStyles(document.body.children[0] as HTMLElement, { pointerEvents: "none" });
        applyStyles(document.body, { cursor: "grabbing", overflow: "clip" });

        props.thumbnail = cloned;
        props.original = original;
        props.draggingIndex = index;

        document.addEventListener("pointerup", onDragEnd);
        document.addEventListener("pointermove", dragMove);
    };

    useEffect(() => {
        if (ref.current) {
            applyStyles(ref.current.children[0] as HTMLElement, {
                pointerEvents: context.isDragging ? "none" : ""
            });

            if (props.draggingIndex === index) {
                props.original = ref.current;
            }
        }

        const prepareTouch = (e) => {
            e.preventDefault();
            const preventPreparation = () => {
                clearTimeout(timer);
                document.removeEventListener("pointermove", preventPreparation);
            };

            document.addEventListener("pointermove", preventPreparation);

            const timer = setTimeout(() => {
                onDragStart(e);
                document.removeEventListener("pointermove", preventPreparation);
            }, 200);
        };

        gripRef.current?.addEventListener("touchstart", prepareTouch);
        gripRef.current?.addEventListener("mousedown", onDragStart);

        return () => {
            gripRef.current?.removeEventListener("touchstart", prepareTouch);
            gripRef.current?.removeEventListener("mousedown", onDragStart);
        };
    }, [context.isEnabled, context.isDragging]);

    if (!context.isEnabled) {
        return children;
    }

    return (
        <div ref={ref} drag-index={index} style={{ pointerEvents: "all", opacity: props.draggingIndex === index ? "0" : "" }}>
            {children}
        </div>
    );
};
