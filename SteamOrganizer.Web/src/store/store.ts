import {configureStore } from "@reduxjs/toolkit";
import uiReducer from "./ui.slice.ts";

export const store = configureStore({
    reducer: {
        ui: uiReducer
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
       /*     immutableCheck: false,
            serializableCheck: false,*/
        })
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;