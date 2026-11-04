import { mountVaultHost } from '@so/app/vault-host'

import { offscreenPlatform } from '../../utils/platform'
import { serveForwarded } from '../../utils/serveForwarded'

mountVaultHost(offscreenPlatform, serveForwarded)
