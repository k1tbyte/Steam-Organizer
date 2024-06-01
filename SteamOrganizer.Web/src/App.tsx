import Accounts from "./pages/Accounts/Accounts.tsx";
import {MainLayout} from "./layouts/MainLayout.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import {createBrowserRouter, Navigate, RouterProvider} from 'react-router-dom'
import Actions from "./pages/Actions.tsx";
import SignIn from "./pages/SignIn.tsx";
import Backups from "./pages/Backups/Backups.tsx";
import {useEffect} from "react";
import { loadConfig, loadAccounts, EDecryptResult, storeEncryptionKey, getAccounts } from "./store/config.ts";
import db from "./services/indexedDb.ts";
import Authentication from "@/pages/Modals/Authentication.tsx";
import { Defs } from "./assets"
import {modal, ModalsHost} from "./components/elements/Modal.tsx";
import {Profile} from "@/pages/Profile/Profile.tsx";

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
      const result = await loadAccounts()

      let info: string;

      switch(result) {
        case EDecryptResult.NoKey:
          info = "Enter a new password to encrypt your accounts, this is a required step. Enter a password that you 100% remember. If you forget your password, you will permanently lose access to your data.";
          break;
        case EDecryptResult.BadCredentials:
          info = "For various reasons, the data could not be decrypted, please enter the password"
          break;
        case EDecryptResult.NeedAuth:
          info = "It seems you have changed your browser. Please re-enter your password"
          break;
        default: return;
      }

      modal.open({
        body: <Authentication info={info} onSuccess={storeEncryptionKey} decryptData={await getAccounts()} />,
        onClosing: () => true,
        title: "Authentication",
        withCloseButton: false,
        className: "max-w-[305px] w-full"
      })
    })
  }, []);

  return (
      <>
        <RouterProvider router={router}/>
        <ModalsHost/>
        <Defs/>
      </>
  )
}
