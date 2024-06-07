import {useEffect, useRef} from "react";
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

export const useScrollbar = (events?: EventListeners | undefined) => {
    const hostRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLElement>()

    useEffect(() => {
        if(!hostRef.current)
            return

        const scrollbars = OverlayScrollbars(hostRef.current!,options,events)
        scrollRef.current = scrollbars.elements().viewport
        return () => scrollbars.destroy()
    },[])

    return { hostRef, scrollRef }
}