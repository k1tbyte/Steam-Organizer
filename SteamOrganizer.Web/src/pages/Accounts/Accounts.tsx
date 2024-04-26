import AccountCard from "./elements/AccountCard.tsx";
import Toolbar from "./elements/Toolbar.tsx";
import {Account} from "../../types/account.ts";
import React, {forwardRef, useRef} from "react";
import 'overlayscrollbars/overlayscrollbars.css';
import {OverlayScrollbarsComponent, useOverlayScrollbars} from "overlayscrollbars-react";
import { VirtuosoGrid} from "react-virtuoso";

let accounts: Account[] = new Array(200);
for (let i = 1; i <= accounts.length; i++) {
    accounts[i-1] = new Account(`acc ${i}`,"pass", BigInt(i))
}

const FancyScroller = React.forwardRef(({ children, ...props }, ref: React.Ref<HTMLDivElement>) => {
    const [initialize] = useOverlayScrollbars({
        options: {
            showNativeOverlaidScrollbars: false,
            overflow: {
                x: 'hidden'
            },
            scrollbars: {
                clickScroll: true,
                theme: 'os-theme-light',
                visibility: 'visible',
                autoHide: 'move',
            },
        }
    });
    React.useEffect(() => {
        initialize({
            target: ref.current,
            elements: {
                viewport: ref.current,
            }
        })
    }, [initialize]);

    const refSetter = React.useCallback(
        (node) => {
            if (node) {
                ref.current = node
            }
        },
        [ref]
    );
    return (
        <div
            ref={refSetter}
            {...props}
        >
            {children}
        </div>
    )
})

const gridComponents = {
    List: forwardRef<HTMLDivElement>(({className, children, ...props}, ref) => (
        <div
            ref={ref}
            className={"grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2 overflow-auto " +className}
            {...props}
        >
            {children}
        </div>
    )),
    Scroller: FancyScroller
}




export default function Accounts() {
    const overlayRef = useRef<any>(null);
    return (
        <>
            <Toolbar/>

                <VirtuosoGrid totalCount={accounts.length} components={gridComponents} className="m-2 mb-0"
                              itemContent={(index) => <AccountCard acc={accounts[index]} />}
                />


{/*            <OverlayScrollbarsComponent defer>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] mb-0 gap-2">
                    {accounts.map(acc => <AccountCard acc={acc} key={acc.steamId64!}/>)}
                </div>
            </OverlayScrollbarsComponent>*/}
        </>
    )
}