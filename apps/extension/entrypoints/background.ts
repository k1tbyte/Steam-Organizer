export default defineBackground(() => {
    // Until the popup lands (it will replace this), the toolbar button opens the full app.
    browser.action.onClicked.addListener(() => {
        void browser.tabs.create({ url: browser.runtime.getURL('/app.html') })
    })
})
