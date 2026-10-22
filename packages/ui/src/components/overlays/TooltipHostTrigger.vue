<script setup lang="ts">
import { injectTooltipProviderContext, injectTooltipRootContext, TooltipTrigger } from 'reka-ui'
import { onBeforeUnmount, onMounted, watch } from 'vue'
import { onAnyGateHide } from '../../composables/useOverlayGate'

const target = defineModel<HTMLElement>('target')
const text = defineModel<string>('text', { required: true })

// Reka's own trigger logic, fed by delegated events: delay, grouping, grace area, Escape and scroll stay reka's.
const root = injectTooltipRootContext()
const provider = injectTooltipProviderContext()
let entered: HTMLElement | null = null
let pointerDown = false

const tipOf = (node: EventTarget | null) =>
    node instanceof Element ? node.closest<HTMLElement>('[data-tip]') : null

function aim(el: HTMLElement) {
    target.value = el
    text.value = el.dataset.tip ?? ''
    root.onTriggerChange(el)
}

function onPointerMove(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    const el = tipOf(event.target)
    if (el === entered) return
    // A pointerout never comes for a target removed under the pointer.
    if (entered) {
        const gone = !entered.isConnected
        entered = null
        if (gone) root.onClose()
    }
    if (!el || provider.isPointerInTransitRef.value) return
    entered = el
    aim(el)
    root.onTriggerEnter()
}

function onPointerOut(event: PointerEvent) {
    if (!entered || entered.contains(event.relatedTarget as Node | null)) return
    entered = null
    root.onTriggerLeave()
}

// Also drops a pending delayed open, as reka's trigger does; a press inside the bubble (selecting its text) keeps it.
function onPointerDown(event: PointerEvent) {
    if (event.target instanceof Element && event.target.closest('.fp-tip')) return
    root.onClose()
    pointerDown = true
}

// Late enough for the focus the press causes to see it.
const onPointerUp = () => setTimeout(() => (pointerDown = false), 1)

function onClick(event: MouseEvent) {
    if (tipOf(event.target) === target.value) root.onClose()
}

// Focus opens at once, as reka's trigger does, unless a press (or a tap) moved it.
function onFocusIn(event: FocusEvent) {
    const el = event.target
    if (pointerDown || !(el instanceof HTMLElement) || !el.dataset.tip) return
    aim(el)
    root.onOpen()
}

function onFocusOut(event: FocusEvent) {
    if (event.target === target.value) root.onClose()
}

const close = () => root.onClose()
onAnyGateHide(() => {
    entered = null
    close()
})
// Reka's "another tooltip opened" signal: with one root it only closes the content still fading out
// as the same tooltip reopens on the next target.
const swallow = (event: Event) => event.stopImmediatePropagation()
const listeners = [
    ['pointerout', onPointerOut],
    ['pointerdown', onPointerDown],
    ['pointerup', onPointerUp],
    ['pointercancel', onPointerUp],
    ['click', onClick],
    ['focusin', onFocusIn],
    ['focusout', onFocusOut],
] as const
// Moves on window, after reka's grace area (document) has judged the same move.
onMounted(() => {
    for (const [type, fn] of listeners) document.addEventListener(type, fn as EventListener, true)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('popstate', close)
    window.addEventListener('tooltip.open', swallow, true)
})
onBeforeUnmount(() => {
    for (const [type, fn] of listeners) document.removeEventListener(type, fn as EventListener, true)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('popstate', close)
    window.removeEventListener('tooltip.open', swallow, true)
})

// The text can change while it shows (Pin / Unpin, a running count).
watch(target, (el, _, onCleanup) => {
    if (!el) return
    const observer = new MutationObserver(() => {
        text.value = el.dataset.tip ?? ''
        if (!text.value) root.onClose()
    })
    observer.observe(el, { attributeFilter: ['data-tip'] })
    onCleanup(() => observer.disconnect())
})

// A hint describes its trigger while open; a label already named it.
watch([root.open, target], ([open, el], _, onCleanup) => {
    if (!open || !el || el.hasAttribute('aria-describedby') || el.getAttribute('aria-label') === text.value) return
    el.setAttribute('aria-describedby', root.contentId)
    onCleanup(() => el.removeAttribute('aria-describedby'))
})
</script>

<!-- Reka needs a trigger node of its own; positioning follows the real one. -->
<template>
    <TooltipTrigger as="span" hidden :reference="target" />
</template>
