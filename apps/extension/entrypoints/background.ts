import { isOpenAppMessage } from '../utils/messages'
import { openAppPage } from '../utils/platform'

export default defineBackground(() => {
    browser.runtime.onMessage.addListener((message) => {
        if (isOpenAppMessage(message)) void openAppPage(message.path)
    })
})
