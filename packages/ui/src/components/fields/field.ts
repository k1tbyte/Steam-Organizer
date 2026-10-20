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

export const FIELD_SIZES: Record<FieldSize, string> = {
    sm: 'px-2 py-1.5 text-xs touch-control-sm',
    md: 'px-3 py-2 text-sm touch-control-md',
    lg: 'px-4 py-2.5 text-base touch-control-lg',
}

export const SEGMENT_CLASS =
    'rounded-xs px-0.5 tabular-nums outline-none transition-colors duration-fast ' +
    'focus:bg-accent-soft focus:text-fg-1 data-placeholder:not-focus:text-fg-faint'
