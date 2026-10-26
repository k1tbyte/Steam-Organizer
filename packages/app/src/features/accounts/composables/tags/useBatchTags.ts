import { computed, shallowRef, type UnwrapNestedRefs } from 'vue'
import { useI18n } from 'vue-i18n'

import {
    nextTagState,
    stateOf,
    type TagState,
    tagChanges,
    tagCounts,
} from '../../services/tags'
import { useVaultAccounts } from '../useVaultAccounts'
import { useTagSearch } from './useTagSearch'
import { useVaultTags } from './useVaultTags'

const CHECKED = { all: true, some: 'indeterminate', none: false } as const

/** Tags over several accounts: each tag on all, some or none of them; changes wait for Apply. */
export function useBatchTags(ids: () => readonly string[]) {
    const { t } = useI18n()
    const vault = useVaultAccounts()
    const { tags } = useVaultTags()
    const search = useTagSearch()

    const picked = computed(() => {
        const wanted = new Set(ids())
        return vault.accounts.value.filter(({ id }) => wanted.has(id))
    })
    const total = computed(() => picked.value.length)
    const counts = computed(() => tagCounts(picked.value))
    const initial = computed(
        () =>
            new Map(
                tags.value.map(({ id }) => [
                    id,
                    stateOf(counts.value.get(id) ?? 0, total.value),
                ]),
            ),
    )
    const edits = shallowRef(new Map<string, TagState>())
    const current = computed(
        () =>
            new Map(
                [...initial.value].map(([id, state]) => [
                    id,
                    edits.value.get(id) ?? state,
                ]),
            ),
    )
    const changes = computed(() => tagChanges(initial.value, current.value))
    const changed = computed(
        () => changes.value.add.length + changes.value.remove.length,
    )

    function set(id: string, state: TagState) {
        edits.value = new Map(edits.value).set(id, state)
    }
    function reset() {
        edits.value = new Map()
        search.reset()
    }
    /** A mixed tag cycles to all, none, then back to as it was. */
    function toggle(id: string) {
        const was = initial.value.get(id) ?? 'none'
        set(id, nextTagState(was, current.value.get(id) ?? was))
    }
    async function create() {
        const id = await search.create()
        if (id) set(id, 'all')
    }

    return {
        search,
        rows: computed(() =>
            search.found.value.map((tag) => {
                const state = current.value.get(tag.id) ?? 'none'
                const worn =
                    state === 'some'
                        ? (counts.value.get(tag.id) ?? 0)
                        : state === 'all'
                          ? total.value
                          : 0
                return {
                    ...tag,
                    checked: CHECKED[state],
                    count: t('{count} of {total}', {
                        count: worn,
                        total: total.value,
                    }),
                    changed: state !== initial.value.get(tag.id),
                }
            }),
        ),
        changed: computed(() => changed.value > 0),
        note: computed(() =>
            changed.value === 0
                ? t('No changes')
                : changed.value === 1
                  ? t('1 change for {total} accounts', { total: total.value })
                  : t('{count} changes for {total} accounts', {
                        count: changed.value,
                        total: total.value,
                    }),
        ),
        toggle,
        create,
        /** Enter: a new label creates the tag, a known one toggles. */
        submit() {
            const known = search.exact.value
            if (search.fresh.value) void create()
            else if (known) toggle(known.id)
        },
        reset,
        apply() {
            void vault.setTags(ids(), changes.value)
            reset()
        },
    }
}

export type BatchTagsState = UnwrapNestedRefs<ReturnType<typeof useBatchTags>>
