<script setup lang="ts">
import {
    type Component,
    computed,
    nextTick,
    onScopeDispose,
    ref,
    useTemplateRef,
    watch,
} from 'vue'
import { useCenterActive } from '../../../composables/useCenterActive'
import FpEyebrow from '../Eyebrow.vue'
import FpIcon from '../media/Icon.vue'

export interface NavMenuItem {
    value: string
    label: string
    icon?: string
    disabled?: boolean
    /** Small outlined tag at the end of the row ("Soon"). */
    badge?: string
    to?: unknown
    /** Heading over the run of items sharing it; one track keeps one pill across groups. */
    group?: string
}

const props = withDefaults(
    defineProps<{
        items: NavMenuItem[]
        modelValue?: string
        as?: string | Component
        replace?: boolean
        orientation?: 'vertical' | 'horizontal' | 'adaptive'
        ariaLabel?: string
    }>(),
    { as: 'button', orientation: 'vertical' },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const isButton = computed(() => props.as === 'button')
const rows = computed(() =>
    props.items.map((item, index) => ({
        item,
        heading: item.group === props.items[index - 1]?.group ? undefined : item.group,
    })),
)
const activeIndex = computed(() =>
    props.items.findIndex((item) => item.value === props.modelValue),
)

function select(item: NavMenuItem, event: MouseEvent) {
    if (item.disabled) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
    }
    emit('update:modelValue', item.value)
}

const nav = useTemplateRef('nav')
useCenterActive(
    () => nav.value,
    () => props.modelValue,
    '[aria-current="page"]',
    () => props.items,
)

const track = useTemplateRef('track')
const pill = ref<{ x: number; y: number; w: number; h: number } | null>(null)
const ready = ref(false)

function measure() {
    const el = track.value
    if (!el) return
    const index = activeIndex.value
    const target =
        index < 0
            ? null
            : el.querySelectorAll<HTMLElement>('[data-nav-item]')[index]
    pill.value = target
        ? {
              x: target.offsetLeft,
              y: target.offsetTop,
              w: target.offsetWidth,
              h: target.offsetHeight,
          }
        : null
}

const pillStyle = computed(() => {
    const box = pill.value
    if (!box) return { opacity: '0' }
    return {
        opacity: '1',
        width: `${box.w}px`,
        height: `${box.h}px`,
        transform: `translate(${box.x}px, ${box.y}px)`,
    }
})

const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
onScopeDispose(() => resizeObserver?.disconnect())

watch(
    [() => props.modelValue, () => props.items],
    async () => {
        await nextTick()
        measure()
    },
    { immediate: true },
)

// Defer readiness until the initial pill position is measured.
watch(track, (el) => {
    resizeObserver?.disconnect()
    if (!el) return
    resizeObserver?.observe(el)
    requestAnimationFrame(() => {
        measure()
        ready.value = true
    })
})

const SCROLL_DIR: Record<string, string> = {
    vertical: 'overflow-y-auto',
    horizontal: 'overflow-x-auto',
    adaptive: 'overflow-x-auto sm:overflow-x-hidden sm:overflow-y-auto',
}
const TRACK_DIR: Record<string, string> = {
    vertical: 'flex-col gap-0.5',
    horizontal: 'gap-1',
    adaptive: 'gap-1 sm:flex-col sm:gap-0.5',
}
</script>

<template>
    <nav ref="nav" :aria-label="ariaLabel" :class="[SCROLL_DIR[orientation]]">
        <div ref="track" class="relative flex" :class="TRACK_DIR[orientation]">
            <span
                class="nav-pill pointer-events-none absolute top-0 left-0 rounded"
                :class="
                    ready &&
                    'transition-[transform,width,height,opacity] duration-base ease-out'
                "
                :style="pillStyle"
                aria-hidden="true" />
            <template v-for="{ item, heading } in rows" :key="item.value">
                <FpEyebrow v-if="heading" class="px-2.5 pt-3 pb-0.5 first-of-type:pt-3.5">{{ heading }}</FpEyebrow>
                <!-- biome-ignore lint/a11y/noStaticElementInteractions: enabled items resolve to interactive controls -->
                <component
                    :is="!isButton && item.disabled ? 'span' : as"
                    :type="isButton ? 'button' : undefined"
                    :to="item.disabled ? undefined : item.to"
                    :replace="!item.disabled && replace ? true : undefined"
                    :disabled="(isButton && item.disabled) || undefined"
                    :tabindex="!isButton && item.disabled ? -1 : undefined"
                    :aria-current="item.value === modelValue ? 'page' : undefined"
                    :aria-disabled="item.disabled || undefined"
                    draggable="false"
                    data-nav-item
                    class="relative z-10 flex h-9 shrink-0 items-center gap-2.5 rounded px-2.5 font-medium text-13.5 outline-none focus-visible:bg-hover focus-visible:text-fg-1"
                    :class="
                        item.value === modelValue
                            ? 'nav-item-active'
                            : [
                                  // Only here: the item the pill flies to drops its hover at once.
                                  'text-fg-2 transition-[color,background-color]',
                                  item.disabled
                                      ? 'cursor-not-allowed text-fg-faint'
                                      : 'hover:bg-hover hover:text-fg-1',
                              ]
                    "
                    @click.capture="select(item, $event)">
                    <FpIcon
                        v-if="item.icon"
                        :name="item.icon"
                        class="shrink-0 text-16"
                        :class="item.value === modelValue && 'text-accent-ink'" />
                    <span class="min-w-0 flex-1 truncate text-left">{{ item.label }}</span>
                    <span
                        v-if="item.badge"
                        class="rounded-full px-1.75 py-px font-medium text-10.5 text-fg-3 ring-1 ring-stroke-2 ring-inset">
                        {{ item.badge }}
                    </span>
                </component>
            </template>
        </div>
    </nav>
</template>

<style scoped>
.nav-pill {
    background: var(--hover-bg-hi);
}
.nav-item-active {
    color: var(--text-1);
    font-weight: 600;
}
</style>
