import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import 'overlayscrollbars/overlayscrollbars.css';
import './assets/index.css'
import { ClickScrollPlugin, OverlayScrollbars } from "overlayscrollbars";

OverlayScrollbars.plugin(ClickScrollPlugin);

document.title = "Steam Organizer"
ReactDOM.createRoot(document.getElementById('root')).render(
    //<React.StrictMode>
        <App />
    //</React.StrictMode>
)
