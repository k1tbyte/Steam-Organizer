<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from 'vue'
import {
    AVATAR_SIZES,
    type AvatarSize,
    useAvatarGroupItem,
} from './avatar-group'

const props = withDefaults(
    defineProps<{
        src?: string
        alt?: string
        text?: string
        size?: AvatarSize
        round?: boolean
    }>(),
    { size: 'md', round: false },
)

const avatar = useTemplateRef<HTMLElement>('avatar')
const { groupSize, groupRound, hidden } = useAvatarGroupItem(avatar)
const size = computed(() => groupSize?.value ?? props.size)
const round = computed(() => groupRound?.value ?? props.round)

const error = ref(false)
const loaded = ref(false)
const image = useTemplateRef<HTMLImageElement>('image')
watch(
    () => props.src,
    () => {
        error.value = false
        loaded.value = false
    },
)
// A server-rendered image can finish loading before hydration attaches @load.
onMounted(() => {
    if (image.value?.complete && image.value.naturalWidth > 0) loaded.value = true
})

const initials = computed(
    () =>
        props.text ??
        (props.alt ?? '')
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .slice(0, 2),
)
</script>

<template>
    <!-- Overlapping avatars need an opaque surface. -->
    <span
        ref="avatar"
        v-show="!hidden"
        class="fp-avatar surface-opaque-hi inline-flex shrink-0 items-center justify-center overflow-hidden font-medium text-fg-2 select-none"
        :class="[AVATAR_SIZES[size], round ? 'rounded-full' : 'rounded']">
        <img
            v-if="!hidden && src && !error"
            ref="image"
            :src="src"
            :alt="alt"
            class="size-full object-cover transition-opacity duration-base"
            :class="!loaded && 'opacity-0'"
            @load="loaded = true"
            @error="error = true" />
        <slot v-else-if="!hidden">{{ initials }}</slot>
    </span>
</template>
