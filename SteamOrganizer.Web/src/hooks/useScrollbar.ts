import {DependencyList, useEffect, useRef} from "react";
import {EventListeners, OverlayScrollbars, PartialOptions} from "overlayscrollbars";

const options: PartialOptions = {
    overflow: {
        x: "hidden"
    },
    scrollbars: {
        autoHide: "move",
        theme: "os-theme-light",
        clickScroll: true,
        autoHideDelay: 200
    }
}

export const getOverlayScrollbar = (host: HTMLDivElement, events?: EventListeners | undefined) => {
    return OverlayScrollbars(host, options, events)
}

export const useScrollbar = (events?: EventListeners | undefined, deps: DependencyList = []) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLElement>()
    useEffect(() => {
        if(!hostRef.current)
            return

        const scrollbars = getOverlayScrollbar(hostRef.current, events)
        scrollRef.current = scrollbars.elements().viewport
        return () => scrollbars.destroy()
    }, deps)

    return { hostRef, scrollRef }
}