import Account from "./elements/Account.tsx";
import Toolbar from "./elements/Toolbar.tsx";

export default function Accounts() {

    return (
        <>
            <Toolbar/>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] m-2 mb-0 gap-2 overflow-auto">
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
                <Account/>
            </div>
        </>
    )
}