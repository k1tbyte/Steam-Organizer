import Accounts from "./pages/Accounts/Accounts.tsx";
import {MainLayout} from "./layouts/MainLayout.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import {createBrowserRouter, Navigate, RouterProvider} from 'react-router-dom'
import Actions from "./pages/Actions.tsx";
import SignIn from "./pages/SignIn.tsx";
import Backups from "./pages/Backups/Backups.tsx";
import {useEffect} from "react";
import { loadConfig, EDecryptResult } from "./store/config.ts";
import db from "./services/indexedDb.ts";
import { Defs } from "./assets"
import {modal, ModalsHost} from "./components/primitives/Modal.tsx";
import {Profile} from "@/pages/Profile/Profile.tsx";
import {AuthProvider} from "@/providers/authProvider.tsx";
import { ToastsHost } from "@/components/primitives/Toast.tsx";
import {getAccountsBuffer, loadAccounts, storeEncryptionKey} from "@/store/accounts.ts";

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

export default function App() {
  useEffect( () => {
    db.openConnection().then(async () => {
      await loadConfig()
      await loadAccounts()
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
      </>
  )
}
