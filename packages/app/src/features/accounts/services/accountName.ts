import type { Account } from '../model'

/** The Steam nickname shown small and grey beside an alias; null without an alias or a Steam profile. */
export function steamNameOf({
    alias,
    steamNickname,
}: Pick<Account, 'alias' | 'steamNickname'>): string | null {
    return alias === null ? null : steamNickname
}
