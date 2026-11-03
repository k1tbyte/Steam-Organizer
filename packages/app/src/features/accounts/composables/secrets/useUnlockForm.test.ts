import { expect, it, vi } from 'vitest'

import { useUnlockForm } from './useUnlockForm'

vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (text: string) => text }) }))

it('drops an answer for a form reset while it was checked', async () => {
    let answer: (accepted: boolean) => void = () => {}
    const form = useUnlockForm(
        () => null,
        () => new Promise((resolve) => (answer = resolve)),
    )
    form.password.value = 'first'
    const submitted = form.submit()
    form.reset()
    form.password.value = 'second'
    answer(false)

    expect(await submitted).toBe(false)
    expect(form.password.value).toBe('second')
    expect(form.error.value).toBe('')
})
