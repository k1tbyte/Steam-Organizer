export default class MutableRef<T> {
    payload: T | undefined

    MutableRef(payload: T) {
        this.payload = payload;
    }
}