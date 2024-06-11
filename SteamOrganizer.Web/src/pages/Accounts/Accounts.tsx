import AccountCard from "./elements/AccountCard.tsx";
import Toolbar from "./elements/Toolbar.tsx";
import VirtualScroller from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import Ref from "@/types/ref.ts";
import {accounts} from "@/store/config.ts";

const accountsGrid: Ref<GridLayout> = new Ref<GridLayout>();

export default function Accounts() {
    return (
        <>
            <Toolbar/>
            <VirtualScroller collection={accounts} layout={GridLayout} gridRef={accountsGrid}
                             className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2"
                             emptyIndicator={<p className="absolute translate-center text-foreground-muted">
                                 The list of accounts is empty
                             </p>}
                             renderElement={(i) => <AccountCard acc={accounts[i]} key={i}/>}
            />
        </>
    )
}

export const actions = {
    mutate: (mutation: () => void) => {
        mutation();
        accountsGrid?.payload?.refresh()
    }
}