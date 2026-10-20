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
import FpIcon from '../media/Icon.vue'

export interface NavMenuItem {
    value: string
    label: string
    icon?: string
    disabled?: boolean
    to?: unknown
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
            <!-- biome-ignore lint/a11y/noStaticElementInteractions: enabled items resolve to interactive controls -->
            <component
                :is="!isButton && item.disabled ? 'span' : as"
                v-for="item in items"
                :key="item.value"
                :type="isButton ? 'button' : undefined"
                :to="item.disabled ? undefined : item.to"
                :replace="!item.disabled && replace ? true : undefined"
                :disabled="(isButton && item.disabled) || undefined"
                :tabindex="!isButton && item.disabled ? -1 : undefined"
                :aria-current="item.value === modelValue ? 'page' : undefined"
                :aria-disabled="item.disabled || undefined"
                data-nav-item
                class="relative z-10 flex shrink-0 items-center gap-2.5 rounded px-2.5 py-2 text-sm outline-none transition-[color,background-color] focus-visible:bg-hover focus-visible:text-fg-1"
                :class="
                    item.value === modelValue
                        ? 'nav-item-active'
                        : [
                              'text-fg-2',
                              item.disabled
                                  ? 'cursor-not-allowed opacity-50'
                                  : 'hover:bg-hover hover:text-fg-1',
                          ]
                "
                @click.capture="select(item, $event)">
                <FpIcon v-if="item.icon" :name="item.icon" class="shrink-0 text-lg" />
                <span class="truncate">{{ item.label }}</span>
            </component>
        </div>
    </nav>
</template>

<style scoped>
.nav-pill {
    background: var(--select-bg, var(--accent-soft));
}
.nav-item-active {
    color: var(--select-fg, var(--text-1));
}
</style>
