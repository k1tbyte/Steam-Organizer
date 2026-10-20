import {
    type ComputedRef,
    computed,
    type InjectionKey,
    inject,
    onUnmounted,
    onUpdated,
    provide,
    type Ref,
    type ShallowRef,
    shallowRef,
} from 'vue'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export const AVATAR_SIZES: Record<AvatarSize, string> = {
    xs: 'size-5 text-2xs',
    sm: 'size-6 text-xs',
    md: 'size-8 text-xs',
    lg: 'size-10 text-sm',
    xl: 'size-12 text-base',
    '2xl': 'size-20 text-2xl',
}

export const GROUP_OVERLAP: Record<AvatarSize, string> = {
    xs: '-space-x-1',
    sm: '-space-x-1.5',
    md: '-space-x-2',
    lg: '-space-x-2.5',
    xl: '-space-x-3',
    '2xl': '-space-x-5',
}

interface AvatarGroupEntry {
    element: Readonly<Ref<HTMLElement | null>>
}

interface AvatarGroupContext {
    size: Ref<AvatarSize | undefined>
    round: Ref<boolean | undefined>
    max: Ref<number | undefined>
    entries: ShallowRef<AvatarGroupEntry[]>
}

const avatarGroupKey: InjectionKey<AvatarGroupContext> =
    Symbol('fp-avatar-group')

export function provideAvatarGroup(
    size: Ref<AvatarSize | undefined>,
    round: Ref<boolean | undefined>,
    max: Ref<number | undefined>,
) {
    const entries = shallowRef<AvatarGroupEntry[]>([])
    provide(avatarGroupKey, { size, round, max, entries })
    // Keyed children can move without rerunning their setup registration.
    onUpdated(() => {
        const ordered = [...entries.value].sort(compareDomOrder)
        if (ordered.some((entry, index) => entry !== entries.value[index])) {
            entries.value = ordered
        }
    })
    const hiddenCount = computed(() =>
        max.value === undefined
            ? 0
            : Math.max(0, entries.value.length - visibleLimit(max.value)),
    )
    return { hiddenCount }
}

export function useAvatarGroupItem(
    element: Readonly<Ref<HTMLElement | null>>,
): {
    groupSize: Ref<AvatarSize | undefined> | undefined
    groupRound: Ref<boolean | undefined> | undefined
    hidden: ComputedRef<boolean>
} {
    const group = inject(avatarGroupKey, null)
    if (!group) {
        return {
            groupSize: undefined,
            groupRound: undefined,
            hidden: computed(() => false),
        }
    }

    const entry = { element }
    group.entries.value = [...group.entries.value, entry]
    onUnmounted(() => {
        group.entries.value = group.entries.value.filter(
            (item) => item !== entry,
        )
    })

    const hidden = computed(() => {
        const max = group.max.value
        if (max === undefined) return false
        return group.entries.value.indexOf(entry) >= visibleLimit(max)
    })
    return { groupSize: group.size, groupRound: group.round, hidden }
}

function visibleLimit(max: number) {
    return Number.isFinite(max)
        ? Math.max(0, Math.floor(max))
        : Number.POSITIVE_INFINITY
}

function compareDomOrder(a: AvatarGroupEntry, b: AvatarGroupEntry) {
    const left = a.element.value
    const right = b.element.value
    if (!left || !right) return 0
    const position = left.compareDocumentPosition(right)
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
    return 0
}
