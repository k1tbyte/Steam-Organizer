import { type DependencyList, useEffect} from "react";
import {setDocumentTitle} from "@/shared/lib/utils";

export const useTitle = (title: string, deps?: DependencyList) => {
    useEffect(() => setDocumentTitle(title), deps);
}