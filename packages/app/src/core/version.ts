// The root package.json holds the product version; the extension manifest and the web build's version.json read it too.
import { version } from '../../../../package.json'

export const APP_VERSION: string = version
