import AccountCard from "./elements/AccountCard.tsx";
import AccountsNav from "./elements/AccountsNav.tsx";
import {GridLayout} from "@/shared/ui/VirtualScroller/GridLayout.ts";
import {accounts} from "@/store/accounts.ts";
import {LoaderStatic} from "@/shared/ui/Loader.tsx";
import {useLoader} from "@/shared/hooks/useLoader.ts";
import {useEffect} from "react";
import {setDocumentTitle} from "@/shared/lib/utils.ts";
import {Account} from "@/entity/account.ts";
import {Icon } from "@/defines";
import Button, {EButtonVariant} from "@/shared/ui/Button.tsx";
import {CollectionIndicator, SearchCollectionIndicator} from "@/components/CollectionIndicator.tsx";
import {VirtualScroller} from "@/shared/ui/VirtualScroller/VirtualScroller.tsx";
import {openAddAccount} from "@/pages/Modals/AddAccount.tsx";
import {useProxyFilter} from "@/shared/hooks/useProxyFilter.ts";

export default function Accounts() {
    const isLoading = useLoader(accounts)
    useEffect(() => setDocumentTitle('Accounts'), []);
    const [applyFilter, proxy] = useProxyFilter(accounts)


    return (
        <AccountsNav filter={applyFilter}>
            {isLoading ? <LoaderStatic/> :
                <VirtualScroller
                    collection={proxy} layout={GridLayout} withDragMoving
                    scrollerClassName="my-2"
                    className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 auto-rows mx-2"
                    emptyIndicator={
                        <CollectionIndicator title="No accounts yet"
                                             icon={Icon.AccountAdd}
                                             subtitle={<span>Import backup or add new account <br/> using the button below</span>}>
                            <Button variant={EButtonVariant.Outlined} onClick={openAddAccount}>
                                Add account
                            </Button>
                        </CollectionIndicator>
                    }
                    searchEmptyIndicator={<SearchCollectionIndicator/>}
                    onRenderElement={(o: Account, i) => <AccountCard pinned={o.unpinIndex !== undefined}
                                                                   index={i} acc={o} key={i}/>}
                />
            }
        </AccountsNav>
)
}