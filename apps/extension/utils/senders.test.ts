import { expect, it } from 'vitest'

import { autofillTabId, isExtensionPage, type Sender } from './senders'

const ID = 'extension-id'
const content: Sender = {
    id: ID,
    tab: { id: 7 },
    frameId: 0,
    url: 'https://store.steampowered.com/login',
}

it('answers this extensions content script on a Steam login page, for its tab', () => {
    expect(autofillTabId(content, ID)).toBe(7)
})

it('refuses another extension, a sender with no tab, a subframe and another page', () => {
    expect(autofillTabId({ ...content, id: 'other' }, ID)).toBeUndefined()
    expect(autofillTabId({ ...content, id: undefined }, ID)).toBeUndefined()
    // An extension page (the popup) has no tab: it never asks for a vault.
    expect(
        autofillTabId({ id: ID, url: 'chrome-extension://x/popup.html' }, ID),
    ).toBeUndefined()
    expect(autofillTabId({ ...content, tab: {} }, ID)).toBeUndefined()
    expect(autofillTabId({ ...content, frameId: 3 }, ID)).toBeUndefined()
    expect(
        autofillTabId({ ...content, frameId: undefined }, ID),
    ).toBeUndefined()
    expect(
        autofillTabId(
            { ...content, url: 'https://store.steampowered.com/' },
            ID,
        ),
    ).toBeUndefined()
    expect(
        autofillTabId({ ...content, url: 'https://evil.example/login' }, ID),
    ).toBeUndefined()
    expect(autofillTabId({ ...content, url: undefined }, ID)).toBeUndefined()
})

it('takes the popup and the other extension pages, never a content script or a foreign sender', () => {
    expect(
        isExtensionPage({ id: ID, url: 'chrome-extension://x/popup.html' }, ID),
    ).toBe(true)
    expect(isExtensionPage(content, ID)).toBe(false)
    expect(isExtensionPage({ id: 'other' }, ID)).toBe(false)
    expect(isExtensionPage({}, ID)).toBe(false)
})
