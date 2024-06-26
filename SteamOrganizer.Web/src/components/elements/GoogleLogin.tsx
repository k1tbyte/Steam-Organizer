import React from 'react';
import {useAuth} from "@/providers/authProvider.tsx";
import {getFileJson, getFileList, uploadFileJson} from "@/services/gDrive.ts";
let i = 0;
async function saveTest(){
    console.log(await getFileJson<any>("164HcUob8oi49B2UfgnSPzJ_u6ioap9EA"))
    i++;
}
export const GoogleLogin: React.FC = () => {
    const { user, signIn, signOut } = useAuth();

    return (user.isLoggedIn ? (
            <div>
                <img
                    src={user.profileImg}
                    alt=""
                    className="w-10 h-10 rounded-md"
                />
                <div className="pl-2 flex-col flex justify-center text-nowrap w-full truncate relative">
                    <h4 className="text-fg-3 text-sm">{user.name}</h4>
                    <span className="text-fg-1 text-xs">{user.email}</span>
                    <div className="absolute w-1/3 h-full right-0 bg-gradient-to-r from-transparent to-pr-2"/>
                </div>
                <div className="btn" onClick={signOut}>
                    Logout
                </div>
                <div className="btn" onClick={saveTest}>
                    save
                </div>
            </div>
        ) : (
            <div>
                <div className="btn" onClick={signIn}>
                        <p>{user.isLoggedIn === undefined ? "loading..." : "Sign in"} </p>
                    </div>
                </div>
            )
    );
}