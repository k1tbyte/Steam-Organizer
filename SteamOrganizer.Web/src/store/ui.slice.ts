import {createSlice, PayloadAction} from "@reduxjs/toolkit";

export const enum ESidebarState {
    Hidden,
    Partial,
    Full
}

const initialState:
    {
        sidebarState: ESidebarState | undefined,
        modalState: boolean
    } =
    {
        sidebarState: undefined,
        modalState: false
    };

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        changeSidebarState: (state, { payload } : PayloadAction<ESidebarState>) => {
            state.sidebarState = payload
        },
        changeModalState: (state, { payload } : PayloadAction<boolean>) => {
            state.modalState = payload
        }
    }
})

export const { changeSidebarState } = uiSlice.actions

export const actions = uiSlice.actions;

export default uiSlice.reducer;