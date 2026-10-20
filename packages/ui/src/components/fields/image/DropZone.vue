<script setup lang="ts">
import { computed, ref } from 'vue'
import { openFilePicker } from '../../../filePicker'
import FpIcon from '../../display/media/Icon.vue'
import FpIconTile from '../../display/media/IconTile.vue'

const props = withDefaults(
    defineProps<{
        accept?: string
        multiple?: boolean
        disabled?: boolean
        title?: string
        description?: string
        icon?: string
        dropLabel?: string
        /** One muted line instead of the full-size zone. */
        compact?: boolean
    }>(),
    { dropLabel: 'Drop it here' },
)

const emit = defineEmits<{
    files: [files: File[]]
    rejected: [files: File[]]
}>()

defineSlots<{ default?(props: { dragging: boolean }): unknown }>()

const tokens = computed(() =>
    (props.accept ?? '')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0),
)
const mimeTokens = computed(() => tokens.value.filter((t) => t.includes('/')))
const extTokens = computed(() => tokens.value.filter((t) => t.startsWith('.')))

function mimeMatches(type: string): boolean {
    const t = type.toLowerCase()
    return mimeTokens.value.some((m) =>
        m.endsWith('/*') ? t.startsWith(m.slice(0, -1)) : t === m,
    )
}

/** Drag hover exposes MIME only; the drop rechecks names and typeless files. */
function itemMayMatch(item: DataTransferItem): boolean {
    if (item.kind !== 'file') return false
    if (tokens.value.length === 0) return true
    if (mimeMatches(item.type)) return true
    return extTokens.value.length > 0 && (item.type === '' || mimeTokens.value.length === 0)
}

function fileMatches(file: File): boolean {
    if (tokens.value.length === 0) return true
    if (mimeMatches(file.type)) return true
    const name = file.name.toLowerCase()
    return extTokens.value.some((ext) => name.endsWith(ext))
}

// dragenter/leave also fire on children; the depth counter keeps state stable.
const depth = ref(0)
const dragValid = ref(false)
const dragging = computed(() => depth.value > 0)
const state = computed(() => {
    if (!dragging.value) return 'idle'
    return dragValid.value ? 'valid' : 'invalid'
})

function onDragEnter(event: DragEvent) {
    if (props.disabled) return
    depth.value += 1
    const items = event.dataTransfer?.items
    if (depth.value === 1)
        dragValid.value = items ? Array.from(items).some(itemMayMatch) : false
}

function onDragOver(event: DragEvent) {
    if (props.disabled) return
    event.preventDefault()
    if (event.dataTransfer)
        event.dataTransfer.dropEffect = dragValid.value ? 'copy' : 'none'
}

function onDragLeave() {
    if (depth.value > 0) depth.value -= 1
}

function emitFiles(list: File[]) {
    const accepted = list.filter(fileMatches)
    const rejected = list.filter((f) => !accepted.includes(f))
    const files = props.multiple ? accepted : accepted.slice(0, 1)
    if (files.length > 0) emit('files', files)
    if (rejected.length > 0) emit('rejected', rejected)
}

function onDrop(event: DragEvent) {
    event.preventDefault()
    depth.value = 0
    if (props.disabled) return
    emitFiles(Array.from(event.dataTransfer?.files ?? []))
}

function open() {
    if (props.disabled) return
    openFilePicker({
        accept: props.accept ?? '',
        multiple: props.multiple,
        onPick: emitFiles,
    })
}

defineExpose({ open })
</script>

<template>
    <button
        type="button"
        :aria-label="title"
        :disabled
        :data-drag="state === 'idle' ? undefined : state"
        :data-compact="compact || undefined"
        class="dz group flex w-full cursor-pointer items-center justify-center rounded border-dashed text-center transition-colors duration-base disabled:pointer-events-none disabled:opacity-50"
        :class="compact ? 'flex-row flex-wrap gap-2 border p-4 text-fg-2 text-xs' : 'flex-col gap-4 border-2 px-6 py-10'"
        @dragenter="onDragEnter"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="open()">
        <div
            class="contents"
            :class="dragging && 'pointer-events-none'">
            <slot :dragging="dragging">
                <template v-if="compact">
                    <FpIcon v-if="icon" :name="icon" />
                    <span>{{ state === 'valid' ? dropLabel : title }}</span>
                    <span v-if="description" class="text-fg-faint group-data-[drag=valid]:invisible">{{ description }}</span>
                </template>
                <FpIconTile
                    v-else-if="icon"
                    size="lg"
                    :name="state === 'valid' ? 'icon-[lucide--download]' : icon"
                    class="transition-colors duration-base group-data-[drag=valid]:bg-success-soft group-data-[drag=valid]:text-success" />
                <div v-if="!compact" class="space-y-1">
                    <h3 class="font-medium text-base text-fg-1 group-data-[drag=valid]:text-success">
                        {{ state === 'valid' ? dropLabel : title }}
                    </h3>
                    <p
                        v-if="description"
                        class="max-w-sm text-fg-3 text-sm group-data-[drag=valid]:invisible">
                        {{ description }}
                    </p>
                </div>
            </slot>
        </div>
    </button>
</template>

<style scoped>
.dz {
    border-color: var(--stroke-2);
    background-image: repeating-linear-gradient(
        135deg,
        var(--stroke-1) 0 1px,
        transparent 1px 10px
    );
}

.dz:hover {
    border-color: var(--stroke-3);
}

.dz[data-drag='valid'] {
    border-color: var(--success);
    background-image: repeating-linear-gradient(
        135deg,
        var(--success-soft) 0 1px,
        transparent 1px 10px
    );
    animation: dz-pulse var(--dur-cycle) var(--ease-in-out) infinite;
}

.dz[data-drag='invalid'] {
    border-color: var(--danger);
}

.dz[data-compact] {
    border-color: var(--stroke-3);
    background-image: none;
    animation: none;
}

.dz[data-compact]:hover,
.dz[data-compact][data-drag='valid'] {
    border-color: var(--accent);
    color: var(--accent);
}

.dz[data-compact][data-drag='invalid'] {
    border-color: var(--danger);
}

@keyframes dz-pulse {
    50% {
        box-shadow: 0 0 0 6px var(--success-soft);
    }
}
</style>
