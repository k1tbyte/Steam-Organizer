import { computed, reactive, ref, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    type AccountTag,
    findTag,
    freeHue,
    tagLabel,
    useRemoveTag,
    useTagColors,
    useVaultTags,
} from '#features/accounts'

// The row being named: a tag's id, or a new one.
type Editing = string | 'new' | null

/** Settings → Tags: every tag with its color, name and how many accounts wear it; a rename or a color reaches all of them. */
export function useTagsSection() {
    const { t } = useI18n()
    const vault = useVaultTags()
    const colors = useTagColors()
    const removal = reactive(useRemoveTag())
    const editing = shallowRef<Editing>(null)
    const draft = ref('')
    const label = computed(() => tagLabel(draft.value))
    const taken = computed(() => {
        const holder = findTag(vault.tags.value, label.value)
        return holder !== undefined && holder.id !== editing.value
    })

    function start(id: Exclude<Editing, null>) {
        editing.value = id
        draft.value = vault.tags.value.find((tag) => tag.id === id)?.label ?? ''
    }
    function cancel() {
        editing.value = null
    }
    /** Enter: a name another tag holds keeps the field open with the error. */
    function save() {
        const id = editing.value
        if (id === null || taken.value) return
        editing.value = null
        if (label.value === '') return
        if (id === 'new')
            void vault.create(label.value, freeHue(vault.tags.value))
        else void vault.update(id, { label: label.value })
    }

    const countOf = (tag: AccountTag) => {
        const count = vault.counts.value.get(tag.id) ?? 0
        if (count === 0) return t('Not used')
        return count === 1 ? t('1 account') : t('{count} accounts', { count })
    }

    return {
        summary: computed(() =>
            vault.tags.value.length === 1
                ? t('1 tag')
                : t('{count} tags', { count: vault.tags.value.length }),
        ),
        rows: computed(() =>
            vault.tags.value.map((tag) => ({
                ...tag,
                count: countOf(tag),
                editing: editing.value === tag.id,
                swatches: colors.value.map((color) => ({
                    ...color,
                    picked: color.hue === tag.hue,
                })),
            })),
        ),
        adding: computed(() => editing.value === 'new'),
        newHue: computed(() => freeHue(vault.tags.value)),
        empty: computed(
            () => vault.tags.value.length === 0 && editing.value !== 'new',
        ),
        draft,
        error: computed(() =>
            taken.value ? t('Another tag has this name') : undefined,
        ),
        start,
        save,
        cancel,
        /** Leaving the field saves what can be saved and drops the rest. */
        leave() {
            if (taken.value) cancel()
            else save()
        },
        recolor(id: string, hue: number) {
            void vault.update(id, { hue })
        },
        removal,
    }
}
