/** A toast's close timer: a pause keeps the time left, a resume runs it down from there. `onTick` gets the whole seconds left as they change. */
export function pausableTimer(
    ms: number,
    onEnd: () => void,
    onTick?: (secondsLeft: number) => void,
) {
    let left = ms
    let since: number | null = null
    let end: ReturnType<typeof setTimeout> | undefined
    let tick: ReturnType<typeof setTimeout> | undefined

    const remaining = () =>
        since === null ? left : Math.max(0, left - (Date.now() - since))

    function ticks() {
        const now = remaining()
        // At zero the toast is leaving: "0 s" would show through its exit.
        if (!onTick || now === 0) return
        onTick(Math.ceil(now / 1000))
        // Wakes when the next whole second starts.
        tick = setTimeout(ticks, now % 1000 || 1000)
    }

    return {
        resume() {
            if (since !== null) return
            since = Date.now()
            end = setTimeout(onEnd, left)
            ticks()
        },
        pause() {
            if (since === null) return
            left = remaining()
            since = null
            clearTimeout(end)
            clearTimeout(tick)
        },
    }
}
