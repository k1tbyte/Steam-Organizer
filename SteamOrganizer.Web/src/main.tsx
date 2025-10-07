import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import 'overlayscrollbars/overlayscrollbars.css';
import '@/defines/index.css'
import {ClickScrollPlugin, OverlayScrollbars} from "overlayscrollbars";

if(import.meta.env.VITE_SKIP_SW === true) {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
    }
}

OverlayScrollbars.plugin(ClickScrollPlugin);

ReactDOM.createRoot(document.getElementById('root')).render(
    //<React.StrictMode>
        <App />
    //</React.StrictMode>
)
