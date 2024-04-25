import Accounts from "./pages/Accounts/Accounts.tsx";
import {MainLayout} from "./layouts/MainLayout.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import { createBrowserRouter, RouterProvider} from 'react-router-dom'
import Actions from "./pages/Actions.tsx";
import SignIn from "./pages/SignIn.tsx";
import Backups from "./pages/Backups/Backups.tsx";
import { RootModal } from "./components/elements/Modal.tsx";
import useModal from "./hooks/useModal.ts";
import {useEffect} from "react";
import { loadConfig, loadAccounts, EDecryptResult, storeEncryptionKey, getAccounts } from "./store/config.ts";
import db from "./services/indexedDb.ts";
import Authentication from "./pages/modal/Authentication.tsx";
import { Defs } from "./assets"

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout/>,
    errorElement:<NotFoundPage/>,
    children:[
      {
        path  :'/',
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
    ]
  },
  {
    path: "/signIn",
    element: <SignIn/>
  },
]);

export default function App() {

  const { openModal } = useModal()

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

      openModal({ children:
            <Authentication info={info} onSuccess={storeEncryptionKey} decryptData={await getAccounts()} />,
        preventClosing: true, title: "Authentication", contentClass: "max-w-[305px]"}
      )
    })
  }, []);

  return (
      <>
        <RouterProvider router={router}/>
        <RootModal/>
        <Defs/>
      </>
  )
}
