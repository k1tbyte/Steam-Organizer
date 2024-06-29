import {useEffect, useState} from "react";
import {ObservableObject} from "@/lib/observableObject.ts";

export const useLoader = (object: ObservableObject<any>) => {
    const [isLoading, setLoading] = useState<boolean>(object.data === undefined)

    useEffect(() => {
        if(!isLoading) {
            return
        }
        const callback = (data: any | undefined) => {
            setLoading(data === undefined)
        }
        object.onChanged(callback)
        return () => object.unsubscribe(callback)
    },[])

    return isLoading;
}