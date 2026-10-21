import { MIN_MASTER_LENGTH } from '../../../core/passwordStrength'

export type RepeatState = 'empty' | 'match' | 'mismatch'

export interface PasswordChangeInput {
    current: string
    next: string
    repeat: string
}

export function repeatState(next: string, repeat: string): RepeatState {
    if (repeat.length === 0) return 'empty'
    return repeat === next ? 'match' : 'mismatch'
}

export function canChangePassword({
    current,
    next,
    repeat,
}: PasswordChangeInput): boolean {
    return (
        current.length > 0 &&
        next.length >= MIN_MASTER_LENGTH &&
        repeatState(next, repeat) === 'match'
    )
}
