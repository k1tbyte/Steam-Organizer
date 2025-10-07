import {useEffect, useState} from "react";
import {ObservableObject} from "@/shared/lib/observer/observableObject";

export const useObservableLoader = (object: ObservableObject<any>) => {
    const [isLoading, setLoading] = useState<boolean>(object.value === undefined)

    useEffect(() => {
        const callback = (data: any | undefined) => {
            setLoading(data === undefined)
        }
        object.onChanged(callback)
        return () => object.unsubscribe(callback)
    },[])

    return isLoading;
}