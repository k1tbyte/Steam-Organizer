import Accounts from "./pages/Accounts.tsx";
import {MainLayout} from "./layouts/MainLayout.tsx";
import NotFoundPage from "./pages/NotFoundPage.tsx";
import { createBrowserRouter, RouterProvider} from 'react-router-dom'
import Actions from "./pages/Actions.tsx";
import SignIn from "./pages/SignIn.tsx";
import Backups from "./pages/Backups.tsx";
import { RootModal } from "./components/elements/Modal.tsx";
import useModal from "./hooks/useModal.ts";
import {useEffect} from "react";
import {loadConfig, loadAccounts, EDecryptResult} from "./store/config.ts";
import db from "./services/indexedDb.ts";
import {PasswordBox} from "./components/elements/PasswordBox.tsx";
import InputWrapper from "./components/elements/InputWrapper.tsx";
import { MdVpnKey  } from "react-icons/md";
import { FaInfo } from "react-icons/fa6";

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
      if(result == EDecryptResult.NoKey) {
        openModal({ children:
              <div className="flex flex-col items-center w-full">
                <div className="text-[12px] text-fg-2 relative pl-5 text-justify pr-2 mb-3">
                  <FaInfo size={18} className="text-fg-3 absolute -left-0.5 top-0.5" />
                  <span>Enter a new password to encrypt your accounts, this is a required step. Enter a password that you 100% remember. If you forget your password, you will permanently lose access to your data.</span>
                </div>
                <InputWrapper title="Password" className="mb-7 w-full" icon={<MdVpnKey size={18}/>}>
                  <PasswordBox onChange={(e) => console.log(e.target.value)} />
                </InputWrapper>
                <button className="btn-secondary w-28 ">Confirm</button>
              </div>

          , preventClosing: true, title: "Registration", contentClass: "max-w-[305px]"})
      }
    })
  }, []);

  return (
      <>
        <RouterProvider router={router}/>
        <RootModal/>
      </>
  )
}
