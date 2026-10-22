import '@so/app/styles.css'

import { mountPopup } from '@so/app/popup'

import { popupPlatform } from '../../utils/platform'

mountPopup('#app', popupPlatform)
