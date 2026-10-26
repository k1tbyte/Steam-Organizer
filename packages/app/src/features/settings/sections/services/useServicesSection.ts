import { type MenuItem, openFilePicker, useToast } from '@so/ui'
import { computed, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    findService,
    type LinkedService,
    MAX_ICON_BYTES,
    readSvg,
    serviceName,
    useVaultServices,
} from '#features/linked-services'
import { useUndoDelete } from '#features/vault'

// The row being named: a service's id, or a new one.
type Editing = string | 'new' | null

/** Settings → Linked services: the built-in ones, and the user's own with their names and icons. */
export function useServicesSection() {
    const { t } = useI18n()
    const toast = useToast()
    const vault = useVaultServices()
    const undoDelete = useUndoDelete()
    const editing = shallowRef<Editing>(null)
    const draft = ref('')
    const name = computed(() => serviceName(draft.value))
    const taken = computed(() => {
        const holder = findService(vault.own.value, name.value)
        return holder !== undefined && holder.id !== editing.value
    })

    function start(id: Exclude<Editing, null>) {
        editing.value = id
        draft.value =
            vault.own.value.find((service) => service.id === id)?.name ?? ''
    }
    function cancel() {
        editing.value = null
    }
    /** Enter: a name another service holds keeps the field open with the error. */
    function save() {
        const id = editing.value
        if (id === null || taken.value) return
        editing.value = null
        if (name.value === '') return
        if (id === 'new') void vault.create(name.value)
        else void vault.update(id, { name: name.value })
    }

    function upload(id: string) {
        openFilePicker({
            accept: '.svg,image/svg+xml',
            onPick: async ([file]) => {
                const svg = file && readSvg(await file.text())
                if (svg) void vault.update(id, { icon: svg })
                else
                    toast.add({
                        color: 'danger',
                        title: t('Not an SVG icon'),
                        description: t('Pick an .svg file up to {size} KB.', {
                            size: MAX_ICON_BYTES / 1024,
                        }),
                    })
            },
        })
    }

    const iconMenu = (service: LinkedService): MenuItem[] => [
        {
            label: t('Upload SVG…'),
            icon: 'icon-[lucide--upload]',
            onSelect: () => upload(service.id),
        },
        ...(service.svg
            ? [
                  {
                      label: t('Remove icon'),
                      icon: 'icon-[lucide--image-off]',
                      onSelect: () =>
                          void vault.update(service.id, { icon: null }),
                  },
              ]
            : []),
    ]

    return {
        builtIn: vault.builtIn,
        summary: computed(() => {
            const count = vault.own.value.length
            return count === 1 ? t('1 added') : t('{count} added', { count })
        }),
        rows: computed(() =>
            vault.own.value.map((service) => ({
                service,
                editing: editing.value === service.id,
                iconMenu: iconMenu(service),
            })),
        ),
        adding: computed(() => editing.value === 'new'),
        empty: computed(
            () => vault.own.value.length === 0 && editing.value !== 'new',
        ),
        draft,
        error: computed(() =>
            taken.value ? t('Another service has this name') : undefined,
        ),
        start,
        save,
        cancel,
        /** Leaving the field saves what can be saved and drops the rest. */
        leave() {
            if (taken.value) cancel()
            else save()
        },
        /** Accounts keep their credentials for it, shown under Other until Undo. */
        remove({ id, name }: LinkedService) {
            void undoDelete({
                remove: () => vault.remove(id),
                title: t('Service “{name}” deleted', { name }),
                failed: t("Couldn't delete the service"),
                scope: 'services',
            })
        },
    }
}
