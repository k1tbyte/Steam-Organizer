import { expect, it } from 'vitest'

import { passwordProblem } from './restorePassword'

it('tells a blank password from a wrong one', () => {
    expect(passwordProblem('', 'demo')).toBe('blank')
    expect(passwordProblem('nope', 'demo')).toBe('wrong')
    expect(passwordProblem('demo', 'demo')).toBeNull()
})
