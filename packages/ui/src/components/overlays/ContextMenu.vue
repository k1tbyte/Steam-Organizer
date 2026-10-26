<script lang="ts">
// Presses a More button stands in for: the menu hangs from the button, not from a point.
const fromButton = new WeakMap<Event, HTMLElement>()

/** Opens the `FpContextMenu` around `el` for it, below `el` like a dropdown: a More button's stand-in for a right-click. */
export function openContextMenuFrom(el: HTMLElement) {
    const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    fromButton.set(event, el)
    el.dispatchEvent(event)
}
</script>

<script setup lang="ts">
import { ContextMenuContent, ContextMenuPortal, ContextMenuRoot, Slot } from 'reka-ui'
import { computed, shallowRef, watch } from 'vue'
import { useOpenedOnce } from '../../composables/useOpenedOnce'
import { useOverlayGate } from '../../composables/useOverlayGate'
import { FLOAT_GAP } from '../../placement'
import FpScrollArea from '../display/layout/ScrollArea.vue'
import MenuItems from './MenuItems.vue'
import { type MenuEntries, menuGroups, menuSelection } from './menu'

const props = defineProps<{
    items: MenuEntries
    /** Whether a press opens the menu; the caller notes what was pressed here. A refused press keeps the native menu. */
    accept: (event: MouseEvent) => boolean
}>()
const emit = defineEmits<{ closeAutoFocus: [event: Event] }>()

const open = defineModel<boolean>('open', { default: false })
useOverlayGate(open)
const opened = useOpenedOnce(open)
const groups = computed(() => menuGroups(props.items))
const selection = menuSelection()
function closeAutoFocus(event: Event) {
    selection.closed(event)
    emit('closeAutoFocus', event)
}

// The pressed point as a zero-size box, or the button a More press came from.
const anchor = shallowRef<HTMLElement | { getBoundingClientRect: () => DOMRect }>()
// Reka pins a context menu to the right of its point; from a button it opens below, flipping above like a dropdown.
const placement = computed(() =>
    anchor.value instanceof HTMLElement ? { side: 'bottom', align: 'end', 'side-offset': FLOAT_GAP } : {},
)

function onContextmenu(event: MouseEvent) {
    const pointer = (event as Partial<PointerEvent>).pointerType
    // A control inside took the press (a hold), and touch and pen keep the platform's long-press.
    if (event.defaultPrevented || pointer === 'touch' || pointer === 'pen' || !props.accept(event)) return
    event.preventDefault()
    const button = fromButton.get(event)
    if (open.value && button && button === anchor.value) {
        open.value = false
        return
    }
    const { clientX: x, clientY: y } = event
    anchor.value = button ?? { getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }
    open.value = true
}

// A press on the button the menu hangs from is the button's own: its click toggles or retargets the menu. Touch
// reports the outside press on click, after that button already took the menu.
function keepForButton(event: CustomEvent<{ originalEvent: Event }>) {
    const pressed = event.detail.originalEvent.target
    if (anchor.value instanceof HTMLElement && pressed instanceof Node && anchor.value.contains(pressed))
        event.preventDefault()
}

// Each More button in a recycled list is not bound to the menu, so the menu marks the one it hangs from.
watch([open, anchor], ([shown, el], [, previous]) => {
    if (previous instanceof HTMLElement && previous !== el) previous.setAttribute('aria-expanded', 'false')
    if (el instanceof HTMLElement) el.setAttribute('aria-expanded', String(shown))
})
</script>

<!-- One menu for a whole region (a list), not one per item. Reka's trigger is left out: it would lay `pointer-events:
     auto`, `touch-callout: none` and a long-press timer on the whole region. Non-modal: a press outside closes it and
     lands, and a right-click elsewhere retargets. -->
<template>
    <ContextMenuRoot v-model:open="open" :modal="false">
        <Slot @contextmenu="onContextmenu"><slot /></Slot>
        <ContextMenuPortal v-if="opened">
            <ContextMenuContent
                :reference="anchor"
                v-bind="placement"
                :collision-padding="8"
                class="fp-float fp-menu surface-pop layer-float min-w-44 rounded-md"
                @interact-outside="keepForButton"
                @close-auto-focus="closeAutoFocus">
                <FpScrollArea class="min-h-0"><MenuItems :groups :select="selection.select" /></FpScrollArea>
            </ContextMenuContent>
        </ContextMenuPortal>
    </ContextMenuRoot>
</template>
