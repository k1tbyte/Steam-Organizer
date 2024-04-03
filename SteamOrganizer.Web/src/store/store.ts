import {configureStore } from "@reduxjs/toolkit";
import { reducer as sidebarReducer } from "./sidebar.slice.ts";

export const store = configureStore({
    reducer: {
        sidebar: sidebarReducer
    }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;