import { defineMock } from '#core'

import type { DriveConnection, GoogleAccount } from './model'

const ALEX: GoogleAccount = { name: 'Alex Kim', email: 'alex.kim@gmail.com' }

export const connectionMock = defineMock<DriveConnection>(
    'drive.connection',
    'Google Drive',
    {
        'Alex Kim': { account: ALEX, state: 'connected' },
        'Long address': {
            account: {
                name: 'Alexandra Kimberly-Wolfeschlegelstein',
                email: 'alexandra.kimberly-wolfeschlegelstein@example-company-mail.com',
            },
            state: 'connected',
        },
        'Sign-in expired': { account: ALEX, state: 'expired' },
        Offline: { account: ALEX, state: 'offline' },
        'Not connected': { account: null, state: 'disconnected' },
    },
)
