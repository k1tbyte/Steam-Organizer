const TOP_ZONE_PX = 12
const SWITCH_PX = 24

/** Hide-on-scroll state for the phone dock: it hides after 24px of net downward travel and shows
 *  after 24px back up or near the top. Reads offsets only; the caller owns the listener. */
export function createDockScroll() {
    let lastY = 0
    let travel = 0
    let hidden = false

    return {
        /** Feeds the scroll offset and returns whether the dock is hidden. */
        scroll(y: number): boolean {
            const dy = y - lastY
            lastY = y
            if (y < TOP_ZONE_PX) {
                travel = 0
                hidden = false
            } else if (dy !== 0) {
                if (Math.sign(dy) !== Math.sign(travel)) travel = 0
                travel += dy
                if (travel > SWITCH_PX) hidden = true
                else if (travel < -SWITCH_PX) hidden = false
            }
            return hidden
        },
        /** Shown again at a known offset: a navigation, or a restored position that is not a scroll. */
        reset(y = 0) {
            lastY = y
            travel = 0
            hidden = false
        },
    }
}
