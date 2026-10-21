import type { DropdownItem } from '@so/ui'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type ProfileIntent =
    | 'edit'
    | 'change-password'
    | 'remove-password'
    | 'delete'

/** The topbar's more menu: lock or change the account password, edit, delete. */
export function useProfileMenu(options: {
    hasLock: MaybeRefOrGetter<boolean>
    editable: MaybeRefOrGetter<boolean>
    lock: () => void
    intent: (kind: ProfileIntent) => void
}) {
    const { t } = useI18n()

    const items = computed<DropdownItem[][]>(() => {
        const { intent } = options
        const account: DropdownItem[] = []
        if (toValue(options.editable))
            account.push({
                label: t('Edit account'),
                icon: 'icon-[lucide--pencil]',
                onSelect: () => intent('edit'),
            })
        if (toValue(options.hasLock))
            account.push(
                {
                    label: t('Change account password'),
                    icon: 'icon-[lucide--key-round]',
                    onSelect: () => intent('change-password'),
                },
                {
                    label: t('Remove account password'),
                    icon: 'icon-[lucide--lock-open]',
                    onSelect: () => intent('remove-password'),
                },
            )
        else
            account.push({
                label: t('Lock account'),
                icon: 'icon-[lucide--lock-keyhole]',
                onSelect: options.lock,
            })
        return [
            account,
            [
                {
                    label: t('Delete account'),
                    icon: 'icon-[lucide--trash-2]',
                    color: 'danger',
                    onSelect: () => intent('delete'),
                },
            ],
        ]
    })

    return { items }
}
