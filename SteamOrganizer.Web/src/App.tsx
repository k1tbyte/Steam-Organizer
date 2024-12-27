import Accounts from "./pages/Accounts/Accounts";
import {MainLayout} from "./layouts/MainLayout";
import NotFoundPage from "./pages/NotFoundPage";
import {createBrowserRouter, Navigate, RouterProvider} from 'react-router-dom'
import Actions from "./pages/Actions";
import SignIn from "./pages/SignIn";
import Backups from "./pages/Backups/Backups";
import {useEffect} from "react";
import {config, loadConfig} from "./store/config";
import db from "@/shared/services/indexedDb";
import {Defs} from "./defines"
import {ModalsHost} from "./shared/ui/Modal";
import {Profile} from "@/pages/Profile/Profile";
import {AuthProvider} from "@/providers/authProvider";
import {toast, ToastsHost, ToastVariant} from "@/shared/ui/Toast";
import {databaseKey, dbTimestamp, importAccounts, loadAccounts} from "@/store/accounts";
import {isAuthorized} from "@/shared/services/gAuth";
import {getLatestBackup, loadBackup, restoreBackup} from "@/store/backups";
import {decrypt} from "@/shared/services/cryptography";
import {flagStore} from "@/store/local";
import Logo from "@/components/Logo";

const router = createBrowserRouter([
    {
        path: "/",
        element: <MainLayout />,
        errorElement:<NotFoundPage/>,
        children:[
            {
                index: true,
                element: <Navigate replace to='/accounts' />,
            },
            {
                path  :'/accounts',
                element:<Accounts/>,
            },
            {
                path: '/actions',
                element:<Actions/>
            },
            {
                path: '/backups',
                element:<Backups/>
            },
            {
                path: '/accounts/:id',
                element: <Profile/>
            }
        ]
    },
    {
        path: "/signIn",
        element: <SignIn/>
    },
]);

const syncBackup = async (isAuth: boolean) => {
    if(!isAuth || !databaseKey || !navigator.onLine)  {
        return;
    }

    getLatestBackup().then(async (info) => {
        if(new Date(info.createdTime) < dbTimestamp) {
            return;
        }

        try {
            const buffer = await restoreBackup(await loadBackup(info.id))
            const db = await decrypt(databaseKey, buffer)
            await importAccounts(db, true);
        } catch {
            toast.open({ variant: ToastVariant.Error, body: "Unable to restore the latest backup!" })
        }
    })
}

export default function App() {
    useEffect( () => {
        db.openConnection().then(async () => {
            await loadConfig()
            await loadAccounts()

            if(config.autoSync) {
                isAuthorized.onChanged(syncBackup)
            }

            window.addEventListener('offline', () => flagStore.emit(nameof(flagStore.store.offlineMode), true))
            window.addEventListener('online', () => flagStore.emit(nameof(flagStore.store.offlineMode), false))
        })
    }, []);


    return (
        <>
            <AuthProvider>
                <RouterProvider router={router}/>
                <ModalsHost/>
                <ToastsHost/>
            </AuthProvider>
            <Defs/>
            <div className="pointer-events-none fixed opacity-5" style={{ right: "-10%", bottom: "-10%"}}>
                <Logo/>
            </div>
        </>
    )
}
