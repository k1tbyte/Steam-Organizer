export default class Ref<T> {
    payload: T | undefined

    mutate(payload: T) {
        this.payload = payload;
    }
}