import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

/*const routes = new createBrowserRouter([
    {
        path: "/",
        element: <NavBar/>,
        errorElement:<NotFoundPage/>,
        children:[
            {
                path  :'/',
                element:<HomePage/>,

            },
            {
                path: '/settings',
                element:<SettingsPage/>
            },
        ]
    },
]);*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
