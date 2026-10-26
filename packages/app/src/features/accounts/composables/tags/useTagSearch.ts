import { computed, ref, shallowRef, type UnwrapNestedRefs } from 'vue'

import { findTag, freeHue, tagLabel } from '../../services/tags'
import { useTagColors } from './useTagColors'
import { useVaultTags } from './useVaultTags'

/** A picker's search box: the tags it finds, and the label and swatch a new tag gets when none holds the label. */
export function useTagSearch() {
    const vault = useVaultTags()
    const colors = useTagColors()
    const query = ref('')
    const picked = shallowRef<number>()
    const label = computed(() => tagLabel(query.value))
    const exact = computed(() => findTag(vault.tags.value, label.value))
    const hue = computed(() => picked.value ?? freeHue(vault.tags.value))

    function reset() {
        query.value = ''
        picked.value = undefined
    }

    return {
        query,
        found: computed(() => {
            const needle = label.value.toLowerCase()
            return vault.tags.value.filter((tag) =>
                tag.label.toLowerCase().includes(needle),
            )
        }),
        exact,
        /** The label typed, while no tag holds it. */
        fresh: computed(() =>
            label.value !== '' && !exact.value ? label.value : null,
        ),
        swatches: computed(() =>
            colors.value.map((color) => ({
                ...color,
                picked: color.hue === hue.value,
            })),
        ),
        /** Resolves to the new tag's id; null over a sample. */
        create() {
            const created = vault.create(label.value, hue.value)
            reset()
            return created
        },
        pick(value: number) {
            picked.value = value
        },
        reset,
    }
}

export type TagSearchState = UnwrapNestedRefs<ReturnType<typeof useTagSearch>>
