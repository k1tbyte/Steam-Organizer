import AccountCard from "./elements/AccountCard.tsx";
import Toolbar from "./elements/Toolbar.tsx";
import VirtualScroller from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import {accounts} from "@/store/accounts.ts";

export default function Accounts() {
    return (
        <>
            <Toolbar/>
            <VirtualScroller collection={accounts} layout={GridLayout}
                             className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2"
                             emptyIndicator={<p className="absolute translate-center text-foreground-muted text-center">
                                 The list of accounts is empty
                             </p>}
                             renderElement={(o,i) => <AccountCard acc={o} key={i}/>}
            />
        </>
    )
}