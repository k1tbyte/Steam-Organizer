import {createSlice } from "@reduxjs/toolkit";

export const enum ESidebarState {
    Hidden= "hidden",
    Partial = "w-16",
    Full = "w52"
}

const initialState: { sidebarState: ESidebarState | undefined } = { sidebarState: undefined };

export const sidebarSlice = createSlice({
    name: "sidebar",
    initialState,
    reducers: {
        changeState: (state, { payload } : { payload: ESidebarState } ) => {
            state.sidebarState = payload
        }
    }
})

export const { actions, reducer } = sidebarSlice