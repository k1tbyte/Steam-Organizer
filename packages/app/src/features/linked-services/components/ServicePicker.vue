<script setup lang="ts">
import { FpIcon, FpInput, FpKbd, FpPopover } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { useServicePicker } from '../composables/useServicePicker'
import ServiceIcon from './ServiceIcon.vue'

const props = defineProps<{ taken: readonly string[] }>()
const picked = defineModel<string | null>({ required: true })

const { t } = useI18n()
const search = reactive(useServicePicker(picked, () => props.taken))
</script>

<!-- A field that opens a search over the registry; a name no service holds creates one. -->
<template>
    <FpPopover v-model:open="search.open" sheet :padded="false" width="min(92vw, 20rem)" max-height="22rem" placement="bottom-start" :label="t('Service')">
        <button
            type="button"
            class="field flex h-10 w-full cursor-pointer items-center gap-2.5 rounded px-3 text-left text-14"
            :class="search.current ? 'text-fg-1' : 'text-fg-3'">
            <ServiceIcon v-if="search.current" :service="search.current" class="text-16" />
            <span class="min-w-0 flex-1 truncate">{{ search.current?.name ?? t('Pick a service') }}</span>
            <FpIcon name="icon-[lucide--chevrons-up-down]" class="text-14 text-fg-3" />
        </button>
        <template #content>
            <div class="border-b border-stroke-1 px-1.5 py-1">
                <FpInput
                    v-model="search.query"
                    bare
                    size="sm"
                    data-autofocus
                    :placeholder="t('Find or add a service')"
                    :aria-label="t('Find or add a service')"
                    @submit="search.submit">
                    <template #leading><FpIcon name="icon-[lucide--search]" class="text-14" /></template>
                </FpInput>
            </div>
            <div v-if="search.found.length > 0" class="flex flex-col gap-px p-1.5">
                <button
                    v-for="service in search.found"
                    :key="service.id"
                    type="button"
                    class="touch-row flex h-8 cursor-pointer items-center gap-2.5 rounded px-2 text-left text-13 text-fg-1 hover:bg-hover"
                    :aria-pressed="service.id === picked"
                    @click="search.pick(service.id)">
                    <ServiceIcon :service="service" class="text-15 text-fg-2" />
                    <span class="min-w-0 flex-1 truncate">{{ service.name }}</span>
                    <FpIcon v-if="service.id === picked" name="icon-[lucide--check]" class="text-14 text-accent-ink" />
                </button>
            </div>
            <div v-if="search.fresh" class="border-t border-stroke-1 p-1.5">
                <button
                    type="button"
                    class="touch-row flex h-8 w-full cursor-pointer items-center gap-2 rounded px-2 text-left text-13 text-fg-1 hover:bg-hover"
                    @click="search.create">
                    <FpIcon name="icon-[lucide--plus]" class="text-14 text-accent-ink" />
                    <span class="min-w-0 flex-1 truncate">{{ t('Add “{name}”', { name: search.fresh }) }}</span>
                    <FpKbd>↵</FpKbd>
                </button>
            </div>
        </template>
    </FpPopover>
</template>
