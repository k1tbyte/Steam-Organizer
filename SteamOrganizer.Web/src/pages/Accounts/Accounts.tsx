import AccountCard from "./elements/AccountCard.tsx";
import Toolbar from "./elements/Toolbar.tsx";
import {Account} from "@/types/account.ts";
import VirtualScroller from "../../components/elements/VirtualScroller.tsx";

let accounts: Account[] = new Array(200);
for (let i = 0; i < accounts.length; i++) {
    accounts[i] = new Account(`acc_${i}`,"pass", BigInt(i))
}


export default function Accounts() {
    return (
        <>
            <Toolbar/>
            <VirtualScroller count={accounts.length} renderElement={(i) => {
                return <AccountCard acc={accounts[i]} key={i}/>;
            }}/>
        </>
    )
}