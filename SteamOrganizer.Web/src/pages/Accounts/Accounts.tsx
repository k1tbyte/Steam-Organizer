import AccountCard from "./elements/AccountCard.tsx";
import Toolbar from "./elements/Toolbar.tsx";
import {Account} from "../../types/account.ts";
import 'overlayscrollbars/overlayscrollbars.css';
import {forwardRef } from "react";
import VirtualScroller  from "../../components/elements/VirtualScroller.tsx"
import {VirtuosoGrid} from "react-virtuoso";

let accounts: Account[] = new Array(300);
for (let i = 0; i < accounts.length; i++) {
    accounts[i] = new Account(`acc ${i}`,"pass", BigInt(i))
}




const gridComponents = {
    List: forwardRef(({ style, children, ...props }, ref) => (
        <div
            ref={ref}
            {...props}
            style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                margin: "0px 8px",
                gap: "8px",
                ...style,
            }}
        >
            {children}
        </div>
    ))
}

export default function Accounts() {
    return (
        <>
            <Toolbar/>
            <VirtualScroller count={accounts.length} renderElement={(i) =>
                <AccountCard acc={accounts[i]} key={i}/>} />
{/*            <VirtuosoGrid
                totalCount={accounts.length}
                components={gridComponents}
                itemContent={(index) => <AccountCard acc={accounts[index]}></AccountCard>}*/}
{/*            <VirtualScrollArea count={accounts.length}
                               onRender={(id) => <AccountCard acc={accounts[id]} key={id}/>} />*/}
        </>
    )
}