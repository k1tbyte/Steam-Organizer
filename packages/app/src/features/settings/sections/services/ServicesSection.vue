<script setup lang="ts">
import { FpButton, FpCard, FpDropdownMenu, FpEyebrow, FpIcon, tip } from '@so/ui'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { MAX_SERVICE_NAME, ServiceIcon } from '#features/linked-services'

import NameField from '../../components/NameField.vue'
import { useServicesSection } from './useServicesSection'

const { t } = useI18n()
const view = reactive(useServicesSection())
</script>

<template>
    <div class="flex flex-col gap-5">
        <div>
            <div class="flex items-center gap-3 pt-1.5 pb-3">
                <span class="flex-1 text-13 text-fg-3">{{ view.summary }}</span>
                <FpButton size="sm" variant="soft" @click="view.start('new')">
                    <FpIcon name="icon-[lucide--plus]" />
                    {{ t('New service') }}
                </FpButton>
            </div>
            <FpCard flush class="divide-y divide-stroke-1">
                <div v-if="view.adding" class="flex min-h-12 items-center gap-3 bg-hover px-4 py-2">
                    <span class="grid size-7 shrink-0 place-items-center text-16 text-fg-3">
                        <FpIcon name="icon-[lucide--globe]" />
                    </span>
                    <NameField
                        v-model="view.draft"
                        :maxlength="MAX_SERVICE_NAME"
                        :label="t('Service name')"
                        :message="view.error"
                        @save="view.save"
                        @cancel="view.cancel"
                        @leave="view.leave" />
                </div>
                <div
                    v-for="row in view.rows"
                    :key="row.service.id"
                    class="flex min-h-12 items-center gap-3 px-4 py-2"
                    :class="row.editing && 'bg-hover'">
                    <FpDropdownMenu :items="row.iconMenu" placement="bottom-start">
                        <FpButton v-bind="tip(t('Icon'), { label: true })" square size="xs" variant="ghost" class="shrink-0 text-16">
                            <ServiceIcon :service="row.service" />
                        </FpButton>
                    </FpDropdownMenu>
                    <NameField
                        v-if="row.editing"
                        v-model="view.draft"
                        :maxlength="MAX_SERVICE_NAME"
                        :label="t('Service name')"
                        :message="view.error"
                        @save="view.save"
                        @cancel="view.cancel"
                        @leave="view.leave" />
                    <button
                        v-else
                        type="button"
                        class="min-w-0 flex-1 cursor-pointer truncate text-left text-13.5 text-fg-1"
                        @click="view.start(row.service.id)">
                        {{ row.service.name }}
                    </button>
                    <FpButton
                        v-bind="tip(t('Rename'), { label: true })"
                        square
                        size="xs"
                        variant="ghost"
                        class="shrink-0 text-fg-3!"
                        @click="view.start(row.service.id)">
                        <FpIcon name="icon-[lucide--pencil]" />
                    </FpButton>
                    <FpButton
                        v-bind="tip(t('Delete'), { label: true })"
                        square
                        size="xs"
                        variant="ghost"
                        class="shrink-0 text-fg-3!"
                        @click="view.remove(row.service)">
                        <FpIcon name="icon-[lucide--trash-2]" />
                    </FpButton>
                </div>
                <p v-if="view.empty" class="px-4 py-6 text-center text-13 text-fg-3">
                    {{ t('Nothing added yet. Add a service the built-in list lacks; an SVG gives it an icon.') }}
                </p>
            </FpCard>
        </div>
        <div class="flex flex-col gap-2.5">
            <FpEyebrow class="ml-0!">{{ t('Built in') }}</FpEyebrow>
            <div class="flex flex-wrap gap-1.5">
                <span
                    v-for="service in view.builtIn"
                    :key="service.id"
                    class="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface-hi px-2.5 text-12.5 text-fg-2">
                    <ServiceIcon :service="service" />
                    {{ service.name }}
                </span>
            </div>
        </div>
    </div>
</template>
