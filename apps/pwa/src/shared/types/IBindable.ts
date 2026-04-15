export interface IBindable {
    bindTo?: object,
    bindKey?: string,
    // Fired when bindable value changed and new value is different from the old one
    onChanged?: () => void
}