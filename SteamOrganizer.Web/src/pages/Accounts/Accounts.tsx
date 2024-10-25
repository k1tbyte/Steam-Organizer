import AccountCard from "./elements/AccountCard.tsx";
import AccountsNav from "./elements/AccountsNav.tsx";
import VirtualScroller from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import {accounts} from "@/store/accounts.ts";
import { LoaderStatic} from "@/components/primitives/Loader.tsx";
import {useLoader} from "@/hooks/useLoader.ts";

export default function Accounts() {
   const isLoading = useLoader(accounts)

    return (
        <AccountsNav>
            {isLoading ? <LoaderStatic/> :
                <VirtualScroller
                    collection={accounts} layout={GridLayout} useDragMoving
                    className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mx-2 gap-2 auto-rows"
                    emptyIndicator={<p className="absolute translate-center text-foreground-muted text-center">
                        The list of accounts is empty
                    </p>}
                    renderElement={(o, i) => <AccountCard index={i} acc={o} key={i}/>}
                />
            }
        </AccountsNav>
)
}