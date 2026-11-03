/** A failed task rejects its own caller and never blocks the next. */
export function serialQueue() {
    let tail: Promise<unknown> = Promise.resolve()
    return <T>(task: () => Promise<T>): Promise<T> => {
        const run = tail.then(task)
        tail = run.catch(() => {})
        return run
    }
}
