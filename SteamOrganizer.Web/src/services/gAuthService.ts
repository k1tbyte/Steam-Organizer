import { gapi } from 'gapi-script';
import {EventEmitter} from "@/lib/eventEmitter.ts";

export let isAuthorized : boolean;
const authSubscribers: EventEmitter<boolean> = new EventEmitter<boolean>()

const setAuthState = (state: boolean) => {
    isAuthorized = state;
    authSubscribers.emit(state)
}

const onClientInitializing = async () => {
    await gapi.client.init({
        apiKey: "AIzaSyCWCk7kXhV2kmsPs8Bv6Abe8hAx4RDa_z0",
        clientId: "1051364021046-9rkovhkatqt70kmubg8fv7ukbalobj8q.apps.googleusercontent.com",
        discoveryDocs: [ "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest" ],
        scope: "https://www.googleapis.com/auth/drive.file",
    })

    const instance = gapi.auth2.getAuthInstance();
    setAuthState(instance.isSignedIn.get())
    instance.isSignedIn.listen(setAuthState)
}

export const signIn = () =>
    gapi.auth2.getAuthInstance().signIn( { ux_mode: "popup" } );

export const signOut = () =>
    gapi.auth2.getAuthInstance().disconnect();

export const subscribe = (callback: (data: boolean) => void ) =>
    authSubscribers.subscribe(callback)

export const unsubscribe = (callback: (data: boolean) => void ) =>
    authSubscribers.unsubscribe(callback);

export const getUserProfile = () =>
    gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();

export const initGapi = () =>
    gapi.load('client:auth2', onClientInitializing);

