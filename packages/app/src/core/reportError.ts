const reported = new WeakSet<object>()

function isCancel(error: unknown) {
    return (error as { name?: unknown } | null)?.name === 'AbortError'
}

/** The one place a failure is logged. Reports each error once, so report-then-rethrow is safe. */
export function reportError(
    error: unknown,
    scope: string,
    context?: Record<string, unknown>,
): void {
    if (isCancel(error)) return
    if (typeof error === 'object' && error !== null) {
        if (reported.has(error)) return
        reported.add(error)
    }
    console.error(
        `[${scope}]`,
        error,
        ...(context === undefined ? [] : [context]),
    )
}
