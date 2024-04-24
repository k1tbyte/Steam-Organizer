import Account from "./elements/Account.tsx";
import Toolbar from "./elements/Toolbar.tsx";

export default function Accounts() {

    return (
        <div className="">
            <Toolbar/>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] p-2 gap-2">
                <Account/>
                <Account/>
                <Account/>
                <Account/>
            </div>
        </div>
    )
}