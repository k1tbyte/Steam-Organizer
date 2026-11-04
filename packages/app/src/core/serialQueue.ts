/** A failed task rejects its own caller and never blocks the next. */
export function serialQueue() {
    let tail: Promise<unknown> = Promise.resolve()
    return <T>(task: () => Promise<T>): Promise<T> => {
        const run = tail.then(task)
        tail = run.catch(() => {})
        return run
    }
}

/** Runs `work` once no other page of this origin runs one under `name` (a Web Lock); directly where there are none. */
export function acrossPages<T>(name: string, work: () => Promise<T>) {
    const locks = globalThis.navigator?.locks
    return locks ? locks.request(name, work) : work()
}
