import {Gradients} from "src/defines";
import {useEffect} from "react";
import {setDocumentTitle} from "@/lib/utils.ts";
import {Loader} from "@/components/primitives/Loader.tsx";

export default function Actions(){
    useEffect(() => setDocumentTitle("Actions"), []);

    return(
        <div className="flex-center flex-wrap gap-2 p-2 w-full h-full text-foreground-muted">
            Coming soon...
        </div>
    )
}