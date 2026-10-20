export type FieldSize = 'sm' | 'md' | 'lg'

export interface Option<T extends string | number = string | number> {
    label: string
    value: T
    description?: string
    icon?: string
    disabled?: boolean
}

export function toOption<T extends string | number>(
    item: Option<T> | T,
): Option<T> {
    return typeof item === 'object'
        ? item
        : { label: String(item), value: item }
}

// Heights are the mockup's: 34 inline controls, 40 form rows, 48 mobile fields.
export const FIELD_SIZES: Record<FieldSize, string> = {
    sm: 'h-8.5 px-3 text-13 touch-control-sm',
    md: 'h-10 px-3 text-14 touch-control-md',
    lg: 'h-12 px-3.5 text-16 touch-control-lg',
}

// Multi-line fields grow with their text instead of a fixed height.
export const TEXTAREA_SIZES: Record<FieldSize, string> = {
    sm: 'px-3 py-2 text-13',
    md: 'px-3 py-2.5 text-14',
    lg: 'px-3.5 py-3 text-16',
}

export const SEGMENT_CLASS =
    'rounded-xs px-0.5 tabular-nums outline-none transition-colors duration-fast ' +
    'focus:bg-accent-soft focus:text-fg-1 data-placeholder:not-focus:text-fg-faint'
