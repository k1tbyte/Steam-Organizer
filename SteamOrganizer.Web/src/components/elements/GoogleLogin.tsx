import React, {useState, useEffect, useRef} from 'react';
import { gapi } from 'gapi-script';
import {saveFile} from "@/services/gdrive.ts";

interface User {
    name: string;
    profileImg: string;
    email:string;
}


interface GoogleLoginProps {
    apiKey:string;
    clientId: string;
    discoveryDocs?:string[];
    scope?: string;
}

export const GoogleLogin: React.FC<GoogleLoginProps> = ({
                                                       clientId, apiKey,
                                                       scope = 'https://www.googleapis.com/auth/drive.file',
                                                        discoveryDocs=['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
                                                   }) => {
    let gay=true;
    const [user, setUser] = useState<User|null>(null

        /*
        {email: "john@gmail.com",
            profileImg: "https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true",
            name:"John doe"}*/)
    const signIn = () => {

        if(gay){
            console.log(JSON.stringify(user));
            gapi.auth2.getAuthInstance().signIn();
        }

    };

    /**
     *  Called when the signed in status changes, to update the UI
     *  appropriately. After a sign-in, the API is called.
     */
    const updateUser = (isSignedIn: boolean) => {
        if (isSignedIn) {
            let currentUser= gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
            const name = currentUser.getName();
            const profileImg = currentUser.getImageUrl();
            const email =currentUser.getEmail();
            setUser({
                name,
                profileImg,
                email,
            });
            saveFile();
        } else {
            signIn();
        }
    };

    const initClient = () => {
        gapi.client
            .init({
                apiKey: apiKey,
                clientId: clientId,
                discoveryDocs: discoveryDocs,
                scope: scope,
            })
            .then(
                function () {
                    // Listen for sign-in state changes.
                    gapi.auth2.getAuthInstance().isSignedIn.listen(updateUser);
                    // Handle the initial sign-in state.
                    updateUser(gapi.auth2.getAuthInstance().isSignedIn.get());
                }
            );
    };

  const HandleSignIn = () => {
      //After the platform library loads, load the auth2 library:
      gapi.load('client:auth2', initClient);
  };

    const HandleSignOut = () => {
        gay=false;
        const auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(() => {
            setUser(null);
            //console.log('User signed out.');
        });
    };
    if(user) {
        return (
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
                <div className="btn" onClick={HandleSignOut}>
                    Logout
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="btn" onClick={HandleSignIn}>
                Login
            </div>
        </div>
    );
}