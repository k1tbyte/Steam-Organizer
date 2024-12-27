import AccountCard from "./components/AccountCard";
import AccountsNav from "./components/AccountsNav";
import {GridLayout} from "@/shared/ui/VirtualScroller/GridLayout";
import {accounts} from "@/store/accounts";
import {LoaderStatic} from "@/shared/ui/Loader";
import {useLoader} from "@/shared/hooks/useLoader";
import {Account} from "@/entity/account";
import {Icon } from "@/defines";
import Button, {EButtonVariant} from "@/shared/ui/Button";
import {CollectionIndicator, SearchCollectionIndicator} from "@/components/CollectionIndicator";
import {VirtualScroller} from "@/shared/ui/VirtualScroller/VirtualScroller";
import {openAddAccount} from "@/pages/Modals/AddAccount";
import {ObservableProxy} from "@/shared/lib/observer/observableProxy";
import {EFilterType, IFilterConfig} from "@/components/FilterInput/types";
import {useFilterManager} from "@/components/FilterInput/useFilterManager";

const accountsProxy = new ObservableProxy(accounts)
const defaultConfig = {
    [EFilterType.Search]: { by: [0, nameof(Account.prototype.nickname)] },
    [EFilterType.Flags]: {},
    [EFilterType.Order]: {}
} as IFilterConfig

export default function Accounts() {
    const isLoading = useLoader(accounts)

    const { proxy, callback, filterConfig } = useFilterManager(accountsProxy, defaultConfig, "accountsFilter");

    if(isLoading) {
        return <LoaderStatic/>
    }

    return (
        <AccountsNav callback={callback} filterConfig={filterConfig}>
            <VirtualScroller
                collection={proxy} layout={GridLayout} withDragMoving
                scrollerClassName="my-2"
                className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 auto-rows mx-2"
                emptyIndicator={() => accounts.value.length ? <SearchCollectionIndicator/> :
                    <CollectionIndicator title="No accounts yet"
                                         icon={Icon.AccountAdd}
                                         subtitle={<span>Import backup or add new account <br/> using the button below</span>}>
                        <Button variant={EButtonVariant.Outlined} onClick={openAddAccount}>
                            Add account
                        </Button>
                    </CollectionIndicator>
                }
                onRenderElement={(o: Account, i) => <AccountCard pinned={o.unpinIndex !== undefined}
                                                                 index={i} acc={o} key={i}/>}
            />
        </AccountsNav>
    )
}