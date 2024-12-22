import {ObservableObject} from "@/shared/lib/observer/observableObject.ts";
import { gapi } from 'gapi-script';

export const isAuthorized = new ObservableObject<boolean>(undefined!)

const onClientInitializing = async () => {
    await gapi.client.init({
        clientId: "1051364021046-9rkovhkatqt70kmubg8fv7ukbalobj8q.apps.googleusercontent.com",
        discoveryDocs: [ "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest" ],
        scope: "https://www.googleapis.com/auth/drive.file",
    })
    const instance = gapi.auth2.getAuthInstance();
    isAuthorized.set(instance.isSignedIn.get())
    instance.isSignedIn.listen((o) => isAuthorized.set(o))
}

export const signIn = () =>
    gapi.auth2.getAuthInstance().signIn( { ux_mode: "popup" } );

export const signOut = () =>
    gapi.auth2.getAuthInstance().disconnect();

export const getUserProfile = () =>
    gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();

export const initGapi = () =>
    gapi.load('client:auth2', onClientInitializing);

/*
export const initGapi = () =>
{
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = onClientInitializing
    document.body.appendChild(script);
}
*/

