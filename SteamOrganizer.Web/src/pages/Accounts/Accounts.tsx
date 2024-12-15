import AccountCard from "./elements/AccountCard.tsx";
import AccountsNav from "./elements/AccountsNav.tsx";
import {GridLayout} from "@/components/primitives/VirtualScroller/GridLayout.ts";
import {accounts} from "@/store/accounts.ts";
import {LoaderStatic} from "@/components/primitives/Loader.tsx";
import {useLoader} from "@/hooks/useLoader.ts";
import {useEffect} from "react";
import {setDocumentTitle} from "@/lib/utils.ts";
import {ObservableProxy} from "@/lib/observer/observableProxy.ts";
import {Account} from "@/entity/account.ts";
import {Icon } from "@/defines";
import Button, {EButtonVariant} from "@/components/primitives/Button.tsx";
import {CollectionIndicator, SearchCollectionIndicator} from "@/components/elements/CollectionIndicator.tsx";
import {VirtualScroller} from "@/components/primitives/VirtualScroller/VirtualScroller.tsx";
import {openAddAccount} from "@/pages/Modals/AddAccount.tsx";

const filterProxy = new ObservableProxy<Account[]>(accounts)

export default function Accounts() {
   const isLoading = useLoader(accounts)
    useEffect(() => setDocumentTitle('Accounts'), []);

    return (
        <AccountsNav proxy={filterProxy}>
            {isLoading ? <LoaderStatic/> :
                <VirtualScroller
                    collection={filterProxy} layout={GridLayout} withDragMoving
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