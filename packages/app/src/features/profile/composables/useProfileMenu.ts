import type { DropdownItem } from '@so/ui'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useI18n } from 'vue-i18n'

export type ProfileIntent = 'change-password' | 'remove-password' | 'delete'

/** The topbar's more menu: lock or change the account password, delete. Credentials, note and tags edit in place. */
export function useProfileMenu(options: {
    hasLock: MaybeRefOrGetter<boolean>
    lock: () => void
    intent: (kind: ProfileIntent) => void
}) {
    const { t } = useI18n()

    const items = computed<DropdownItem[][]>(() => {
        const { intent } = options
        const account: DropdownItem[] = toValue(options.hasLock)
            ? [
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
              ]
            : [
                  {
                      label: t('Lock account'),
                      icon: 'icon-[lucide--lock-keyhole]',
                      onSelect: options.lock,
                  },
              ]
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
