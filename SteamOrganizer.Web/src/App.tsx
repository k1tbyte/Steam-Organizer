/*import SignIn from "./pages/SignIn.tsx";*/
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
import FingerprintJS from "@fingerprintjs/fingerprintjs";

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

  const { openModal, closeModal } = useModal()

  useEffect(() => {

    const setFp = async () => {
      const fp = await FingerprintJS.load();

      const { visitorId } = await fp.get();

      return visitorId
    };


    setFp().then((id) => {
      openModal({ children:
            <span onClick={() => closeModal()}>Fingerprint: {id}</span>
        ,preventClosing: true, title: "Registration", contentClass: "max-w-[405px]"})
    });
  }, []);

  return (
      <>
        <RouterProvider router={router}/>
        {/*<RootModal/>*/}
      </>
  )
}
